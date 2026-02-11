const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Issue = require('../models/Issue');
const { checkDuplicates } = require('../utils/duplicateCheck');

// Multer Storage Engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, 'issue-' + Date.now() + path.extname(file.originalname));
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
router.get('/citizen/home', (req, res) => {
    res.render('citizen/home', {
        title: 'Citizen Dashboard'
    });
});

// Render Report Page
router.get('/report', (req, res) => {
    res.render('citizen/report', {
        title: 'Report Issue',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
});

// Render Track Page
router.get('/track', (req, res) => {
    res.render('citizen/track', {
        title: 'Track Issues'
    });
});

// POST Issue Report
router.post('/api/issues', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err });
        } else {
            try {
                const { category, description, severity, latitude, longitude } = req.body;

                // Parse coordinates
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);

                // 1. Check for Duplicates
                const duplicates = await checkDuplicates(lat, lng, 100);

                // We allow duplicates for now but log them.
                if (duplicates.length > 0) {
                    console.log('Potential duplicate issue reported');
                }

                const newIssue = new Issue({
                    category,
                    description,
                    severity,
                    location: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    photos: req.files ? req.files.map(file => '/uploads/' + file.filename) : [],
                    status: 'Submitted'
                });

                await newIssue.save();

                // Emit Real-time event
                if (req.io) {
                    req.io.emit('new_issue', newIssue);
                }

                if (duplicates.length > 0) {
                    // In a real app we might return a warning view. 
                    // For now redirect with a success but maybe a flash message (not setup yet).
                    console.log('Duplicate potential detected');
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
router.get('/leaderboard', async (req, res) => {
    try {
        // Mock data for now if no users, or fetch real users sorted by points
        // In real app: const users = await User.find({ role: 'citizen' }).sort({ points: -1 }).limit(10);

        const users = [
            { name: "Aarav Patel", points: 1245, badges: ["City Champion", "First Responder"] },
            { name: "Vihaan Sharma", points: 1102, badges: ["Guardian"] },
            { name: "Diya Gupta", points: 950, badges: ["First Responder"] },
            { name: "Aditya Singh", points: 890, badges: ["Quick Reporter"] },
            { name: "Ananya Reddy", points: 765, badges: [] },
            { name: "Rohan Mehta", points: 600, badges: ["Active Citizen"] },
            { name: "Priya Nair", points: 580, badges: [] },
            { name: "Kabir Verma", points: 550, badges: ["Helper"] },
            { name: "Ishita Joshi", points: 430, badges: [] },
            { name: "Arjun Kapoor", points: 395, badges: [] },
            { name: "Sneha Iyer", points: 350, badges: ["First Report"] },
            { name: "Rahul Deshmukh", points: 310, badges: [] },
            { name: "Meera Krishnan", points: 275, badges: [] },
            { name: "Vikram Rao", points: 240, badges: [] },
            { name: "Neha Agarwal", points: 120, badges: ["Newcomer"] }
        ];

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

module.exports = router;

