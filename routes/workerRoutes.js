const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Issue = require('../models/Issue');
const { isAuthenticated, hasRole } = require('../middleware/auth');

router.use('/worker', isAuthenticated, hasRole(['worker']));
router.use('/api/worker', isAuthenticated, hasRole(['worker']));

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
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb('Error: Images Only!');
    }
}).single('after_photo');

// Helper middleware to fetch MySQL worker info
const getWorkerInfo = async (req, res, next) => {
    req.workerId = null;
    req.workerDbInfo = null;
    if (req.session.user && req.session.user.name) {
        try {
            const { mysqlPool } = require('../config/db');
            const [rows] = await mysqlPool.execute('SELECT * FROM workers WHERE name = ?', [req.session.user.name]);
            if (rows.length > 0) {
                req.workerId = rows[0].id;
                req.workerDbInfo = rows[0];
            }
        } catch (err) {
            console.error('Error fetching worker info:', err.message);
        }
    }
    next();
};

router.use(getWorkerInfo);

// Worker Dashboard
router.get('/worker/dashboard', async (req, res) => {
    try {
        if (!req.workerId) {
            return res.render('worker/dashboard', {
                title: 'Worker Dashboard',
                totalAssigned: 0,
                completed: 0,
                recentTasks: [],
                user: req.session.user
            });
        }

        // Dashboard Stats
        const totalAssigned = await Issue.countDocuments({ assigned_to: req.workerId, status: { $in: ['Assigned', 'In Progress'] } });
        const completed = await Issue.countDocuments({ assigned_to: req.workerId, status: { $in: ['Resolved', 'Closed'] } });

        // Get recent tasks
        const recentTasks = await Issue.find({ assigned_to: req.workerId, status: { $in: ['Assigned', 'In Progress'] } })
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
router.get('/worker/profile', async (req, res) => {
    try {
        let tasksCompleted = 0;
        if (req.workerId) {
            tasksCompleted = await Issue.countDocuments({ assigned_to: req.workerId, status: { $in: ['Resolved', 'Closed'] } });
        }

        let joinedDate = 'Unknown';
        if (req.workerDbInfo && req.workerDbInfo.created_at) {
            const date = new Date(req.workerDbInfo.created_at);
            joinedDate = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        }

        const profile = {
            name: req.session.user ? req.session.user.name : 'Worker',
            email: req.session.user ? req.session.user.email : 'worker@city.gov.in',
            department: req.workerDbInfo ? req.workerDbInfo.department : 'N/A',
            role: req.workerDbInfo ? req.workerDbInfo.role : 'Field Technician',
            phone: req.workerDbInfo ? req.workerDbInfo.phone : 'N/A',
            joinedDate: joinedDate,
            tasksCompleted: tasksCompleted
        };
        res.render('worker/profile', { title: 'My Profile', profile, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Work History Page
router.get('/worker/history', async (req, res) => {
    try {
        if (!req.workerId) {
            return res.render('worker/history', { title: 'Work History', history: [], user: req.session.user });
        }
        
        // Get completed/resolved tasks for THIS worker only
        const history = await Issue.find({
            assigned_to: req.workerId,
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
        let tasks = [];
        if (req.workerId) {
            tasks = await Issue.find({
                assigned_to: req.workerId,
                status: { $in: ['Assigned', 'In Progress', 'Resolved'] }
            }).sort({ updatedAt: -1 });
        }

        res.render('worker/tasks', { title: 'My Tasks', tasks, user: req.session.user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// View Task Details
router.get('/worker/tasks/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).send('Not found');
        }
        
        const task = await Issue.findById(req.params.id);
        if (!task) return res.status(404).send('Task not found');
        
        // Enforce ownership
        if (task.assigned_to !== req.workerId) {
            return res.status(403).render('errors/403', { title: 'Access Denied', message: 'You do not have permission to view this task.' });
        }

        res.render('worker/task-detail', { title: 'Task Details', task, user: req.session.user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update Task Status (Simple AJAX)
router.put('/api/worker/tasks/:id/status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }

        const task = await Issue.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
        
        if (task.assigned_to !== req.workerId) {
            return res.status(403).json({ success: false, error: 'Access Denied' });
        }

        const { status } = req.body;
        const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status.' });
        }

        const oldStatus = task.status;
        const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });

        // Audit Logging
        try {
            const { mysqlPool } = require('../config/db');
            await mysqlPool.execute(
                'INSERT INTO status_history (issue_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)',
                [issue._id.toString(), oldStatus, status, req.session.user.name, 'Updated via Worker App']
            );
        } catch (dbErr) {
            console.error('MySQL Audit Log Error:', dbErr.message);
        }

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
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).send('Not found');
    }

    upload(req, res, async (err) => {
        if (err) return res.status(400).send(err);

        try {
            const task = await Issue.findById(req.params.id);
            if (!task) return res.status(404).send('Task not found');
            
            if (task.assigned_to !== req.workerId) {
                return res.status(403).render('errors/403', { title: 'Access Denied', message: 'You do not have permission to modify this task.' });
            }

            const { status } = req.body;
            const updateData = { status };

            // If photo uploaded, append to existing photos
            if (req.file) {
                updateData.$push = { photos: req.file.path };
            }

            const oldStatus = task.status;
            const issue = await Issue.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );

            // Audit Logging
            try {
                const { mysqlPool } = require('../config/db');
                await mysqlPool.execute(
                    'INSERT INTO status_history (issue_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)',
                    [issue._id.toString(), oldStatus, status, req.session.user.name, 'Task completed with photo evidence']
                );
            } catch (dbErr) {
                console.error('MySQL Audit Log Error:', dbErr.message);
            }

            // Emit socket event
            if (req.io) {
                req.io.emit('status_update', issue);
            }

            res.redirect('/worker/tasks');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    });
});

module.exports = router;
