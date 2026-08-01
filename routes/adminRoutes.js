const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const { mysqlPool } = require('../config/db');

router.use(isAuthenticated, hasRole(['admin']));

// Dashboard Route
router.get('/dashboard', async (req, res) => {
    try {
        const issues = await Issue.find();

        // Calculate Stats
        const stats = {
            total: issues.length,
            resolved: issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length,
            pending: issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length
        };

        // Aggregation for Charts
        const categoryCounts = {};
        const statusCounts = {};
        const dateCounts = {};

        // Helper for last 7 days
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        // Initialize date counts
        last7Days.forEach(date => dateCounts[date] = 0);

        issues.forEach(issue => {
            // Category & Status
            categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
            statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;

            // Date (Simple approximation using createdAt)
            if (issue.createdAt) {
                try {
                    const d = new Date(issue.createdAt);
                    const dateKey = d.toISOString().split('T')[0];
                    if (dateCounts.hasOwnProperty(dateKey)) {
                        dateCounts[dateKey]++;
                    }
                } catch (e) {
                    console.error('Date parsing error', e);
                }
            }
        });

        // Recent Activity (Real Data)
        const recentActivities = await Issue.find().sort({ createdAt: -1 }).limit(5);

        res.render('admin/dashboard', {
            stats,
            chartData: {
                categories: categoryCounts,
                statuses: statusCounts,
                dates: dateCounts
            },
            recentActivities
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Issues List Route
router.get('/issues', async (req, res) => {
    try {
        const { status, category } = req.query;
        let query = {};
        if (status) query.status = status;
        if (category) query.category = category;

        const issues = await Issue.find(query).sort({ createdAt: -1 });

        let workers = [];
        try {
            const [rows] = await mysqlPool.execute('SELECT id, name, department FROM workers WHERE status = "Active"');
            workers = rows;
        } catch (dbErr) {
            console.error('MySQL Error fetching workers:', dbErr.message);
        }

        res.render('admin/issues', { issues, query, workers });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Departments Route
router.get('/departments', async (req, res) => {
    try {
        const [rows] = await mysqlPool.execute('SELECT * FROM departments');
        res.render('admin/departments', { departments: rows });
    } catch (err) {
        console.error('MySQL Error in /departments:', err.message);
        res.render('admin/departments', { departments: [] }); // Graceful fallback
    }
});

// Add Department Route
router.post('/departments/add', async (req, res) => {
    const { name, head, contact, staff, budget } = req.body;
    try {
        await mysqlPool.execute(
            'INSERT INTO departments (name, head, contact, staff, budget) VALUES (?, ?, ?, ?, ?)',
            [name, head, contact, staff, budget]
        );
    } catch (err) {
        console.error('MySQL Error adding department:', err.message);
    }
    res.redirect('/admin/departments');
});

// Edit Department Route
router.post('/departments/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { name, head, contact, staff, budget } = req.body;
    try {
        await mysqlPool.execute(
            'UPDATE departments SET name = ?, head = ?, contact = ?, staff = ?, budget = ? WHERE id = ?',
            [name, head, contact, staff, budget, id]
        );
    } catch (err) {
        console.error('MySQL Error editing department:', err.message);
    }
    res.redirect('/admin/departments');
});

// Workers Route
router.get('/workers', async (req, res) => {
    try {
        const [rows] = await mysqlPool.execute('SELECT * FROM workers ORDER BY created_at DESC');
        res.render('admin/workers', { workers: rows });
    } catch (err) {
        console.error('MySQL Error in /workers:', err.message);
        res.render('admin/workers', { workers: [] }); // Graceful fallback
    }
});

// Add Worker Route
router.post('/workers/add', async (req, res) => {
    const { name, role, department, phone } = req.body;
    try {
        await mysqlPool.execute(
            'INSERT INTO workers (name, role, department, phone) VALUES (?, ?, ?, ?)',
            [name, role, department, phone]
        );
    } catch (err) {
        console.error('MySQL Error adding worker:', err.message);
    }
    res.redirect('/admin/workers');
});

// Redirect /admin to /admin/dashboard
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});


// Update Status API
router.post('/api/issues/:id/status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Not found' });
        }

        const { status } = req.body;
        const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        const oldIssue = await Issue.findById(req.params.id);
        if (!oldIssue) return res.status(404).json({ error: 'Issue not found' });
        const oldStatus = oldIssue.status;

        const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });

        try {
            await mysqlPool.execute(
                'INSERT INTO status_history (issue_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)',
                [issue._id.toString(), oldStatus, status, req.session.user.name, 'Status updated by Admin']
            );
        } catch (dbErr) {
            console.error('MySQL Audit Log Error:', dbErr.message);
        }

        // Emit socket event
        if (req.io) {
            req.io.emit('status_update', issue);
        }

        res.json({ success: true, issue });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// Assign Issue API
router.post('/api/issues/:id/assign', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Not found' });
        }

        const { worker_id } = req.body;
        const workerIdNum = parseInt(worker_id, 10);
        if (isNaN(workerIdNum)) {
            return res.status(400).json({ error: 'Invalid worker ID.' });
        }

        const [rows] = await mysqlPool.execute('SELECT id FROM workers WHERE id = ?', [workerIdNum]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found.' });
        }

        const oldIssue = await Issue.findById(req.params.id);
        const oldStatus = oldIssue ? oldIssue.status : 'Unknown';

        const issue = await Issue.findByIdAndUpdate(
            req.params.id,
            { assigned_to: workerIdNum, status: 'Assigned' },
            { new: true }
        );

        try {
            await mysqlPool.execute(
                'INSERT INTO status_history (issue_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)',
                [issue._id.toString(), oldStatus, 'Assigned', req.session.user.name, `Assigned to worker ID ${workerIdNum}`]
            );
        } catch (dbErr) {
            console.error('MySQL Audit Log Error:', dbErr.message);
        }

        if (req.io) {
            req.io.emit('status_update', issue);
        }

        res.redirect('/admin/issues');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
