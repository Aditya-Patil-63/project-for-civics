const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { checkDuplicates } = require('../utils/duplicateCheck');
const { isAuthenticated } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const storage = new CloudinaryStorage({ 
    cloudinary, 
    params: { 
        folder: 'civic-issues', 
        allowed_formats: ['jpg','jpeg','png'] 
    } 
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).array('photos', 3);

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Render Citizen Home Page
router.get('/citizen/home', isAuthenticated, (req, res) => {
    res.render('citizen/home', {
        title: 'Citizen Dashboard'
    });
});

// Render Report Page
router.get('/report', isAuthenticated, (req, res) => {
    res.render('citizen/report', {
        title: 'Report Issue',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
});

// Render Track Page
router.get('/track', isAuthenticated, (req, res) => {
    res.render('citizen/track', {
        title: 'Track Issues'
    });
});

// POST Issue Report
router.post('/api/issues', isAuthenticated, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err });
        } else {
            try {
                const { category, description, severity, latitude, longitude } = req.body;

                const validCategories = ['Road', 'Sanitation', 'Water', 'Electricity', 'Public Safety', 'Other'];
                if (!validCategories.includes(category)) {
                    return res.status(400).json({ error: 'Invalid category.' });
                }

                if (typeof description !== 'string' || description.trim() === '' || description.length > 1000) {
                    return res.status(400).json({ error: 'Invalid description. Must be non-empty string, max 1000 characters.' });
                }

                const sev = parseInt(severity, 10);
                if (isNaN(sev) || sev < 1 || sev > 5) {
                    return res.status(400).json({ error: 'Invalid severity. Must be 1-5.' });
                }

                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    return res.status(400).json({ error: 'Invalid latitude. Must be between -90 and 90.' });
                }
                
                if (isNaN(lng) || lng < -180 || lng > 180) {
                    return res.status(400).json({ error: 'Invalid longitude. Must be between -180 and 180.' });
                }

                // 1. Check for Duplicates
                const duplicates = await checkDuplicates(lat, lng, 100);

                const newIssue = new Issue({
                    reporter_id: req.session.user ? req.session.user.id : null,
                    category,
                    description: description.trim(),
                    severity: sev,
                    location: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    photos: req.files ? req.files.map(file => file.path) : [],
                    status: 'Submitted'
                });

                await newIssue.save();

                // Award points to the user
                if (req.session.user && req.session.user.id) {
                    await User.findByIdAndUpdate(req.session.user.id, { $inc: { points: 10 } });
                }

                // Emit Real-time event
                if (req.io) {
                    req.io.emit('new_issue', newIssue);
                }

                res.redirect('/track');

            } catch (error) {
                console.error(error);
                res.status(500).send('Server Error');
            }
        }
    });
});

// API for Checking Duplicates (Client-side usage)
router.get('/api/issues/check-duplicate', async (req, res) => {
    const { lat, lng } = req.query;
    try {
        const duplicates = await checkDuplicates(parseFloat(lat), parseFloat(lng));
        res.json({ duplicateFound: duplicates.length > 0, count: duplicates.length });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET All Issues (for map/tracking)
router.get('/api/issues', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET Leaderboard
router.get('/leaderboard', isAuthenticated, async (req, res) => {
    try {
        const dbUsers = await User.find({ role: 'citizen' }).sort({ points: -1 }).limit(15).lean();
        const users = dbUsers.map(user => ({
            name: user.name,
            points: user.points || 0,
            badges: []
        }));

        // Get logged-in user from session
        const currentUser = req.session && req.session.user ? req.session.user : null;
        const currentUserName = currentUser ? currentUser.name : null;

        res.render('citizen/leaderboard', {
            title: 'Leaderboard',
            users,
            currentUserName
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// GET Issue History
router.get('/api/issues/:id/history', isAuthenticated, async (req, res) => {
    try {
        const { mysqlPool } = require('../config/db');
        const [rows] = await mysqlPool.execute(
            'SELECT old_status, new_status, changed_by, changed_at, comment FROM status_history WHERE issue_id = ? ORDER BY changed_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching status history:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// AI Suggest Route
router.post('/api/issues/ai-suggest', isAuthenticated, async (req, res) => {
    try {
        const { description } = req.body;
        if (!description || description.trim().length < 10) {
            return res.status(400).json({ error: 'Description too short' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

        const prompt = `You are categorizing civic complaints in India. Given this complaint description, respond with ONLY valid JSON, no markdown: {"category": one of Road/Sanitation/Water/Electricity/Public Safety/Other, "severity": integer 1-5}. Complaint: ${description}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        let jsonRes;
        try {
            jsonRes = JSON.parse(responseText);
        } catch (e) {
            // Fallback for markdown code blocks
            const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonRes = JSON.parse(cleaned);
        }

        res.json(jsonRes);
    } catch (err) {
        console.error('Gemini AI Error:', err);
        res.status(500).json({ error: 'Failed to generate AI suggestion' });
    }
});

module.exports = router;

