const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Issue = require('../models/Issue');

// Multer Configuration
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, 'worker-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb('Error: Images Only!');
    }
}).single('after_photo');

// Worker Dashboard
router.get('/worker/dashboard', async (req, res) => {
    try {
        // Dashboard Stats
        const totalAssigned = await Issue.countDocuments({ status: { $in: ['Assigned', 'In Progress'] } });
        const completed = await Issue.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });

        // Get recent tasks
        const recentTasks = await Issue.find({ status: { $in: ['Assigned', 'In Progress'] } })
            .sort({ updatedAt: -1 })
            .limit(3);

        res.render('worker/dashboard', {
            title: 'Worker Dashboard',
            totalAssigned,
            completed,
            recentTasks,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Worker Profile Page
router.get('/worker/profile', (req, res) => {

    const profile = {
        name: req.session.user ? req.session.user.name : 'Worker',
        email: req.session.user ? req.session.user.email : 'worker@city.gov.in',
        department: 'Public Works',
        role: 'Field Technician',
        phone: '+91 98765 43210',
        joinedDate: 'January 2024',
        rating: 4.8,
        tasksCompleted: 45
    };
    res.render('worker/profile', { title: 'My Profile', profile, user: req.session.user });
});

// Work History Page
router.get('/worker/history', async (req, res) => {
    try {
        // Get completed/resolved tasks
        const history = await Issue.find({
            status: { $in: ['Resolved', 'Closed'] }
        }).sort({ updatedAt: -1 }).limit(20);

        res.render('worker/history', { title: 'Work History', history, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// List Assigned Tasks
router.get('/worker/tasks', async (req, res) => {
    try {

        const tasks = await Issue.find({
            status: { $in: ['Assigned', 'In Progress', 'Resolved'] }
        }).sort({ updatedAt: -1 });

        res.render('worker/tasks', { title: 'My Tasks', tasks, user: req.session.user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// View Task Details
router.get('/worker/tasks/:id', async (req, res) => {
    try {
        const task = await Issue.findById(req.params.id);
        if (!task) return res.status(404).send('Task not found');
        res.render('worker/task-detail', { title: 'Task Details', task, user: req.session.user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update Task Status (Simple AJAX)
router.put('/api/worker/tasks/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (req.io) {
            req.io.emit('status_update', issue);
        }

        res.json({ success: true, issue });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Complete Task (With Photo)
router.post('/api/worker/tasks/:id/complete', (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).send(err);

        try {
            const { status } = req.body;
            const updateData = { status };

            // If photo uploaded, append to existing photos
            if (req.file) {
                updateData.$push = { photos: '/uploads/' + req.file.filename };
            }

            const issue = await Issue.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );

            // Emit socket event
            if (req.io) {
                req.io.emit('status_update', issue);
                if (status === 'Resolved') {

                }
            }

            res.redirect('/worker/tasks');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    });
});

module.exports = router;
