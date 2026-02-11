const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');

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

        console.log('--- DEBUG: Chart Data to be sent ---');
        console.log('Categories:', categoryCounts);
        console.log('Dates:', dateCounts);
        console.log('------------------------------------');

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
        res.render('admin/issues', { issues, query });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Departments Data (In-Memory Storage)
let departments = [
    { id: 1, name: 'Public Works Dept', head: 'R. Kumar', contact: 'pwd-contact@city.gov.in', staff: 14, budget: '₹52L' },
    { id: 2, name: 'Sanitation', head: 'Sunita S.', contact: 'sanitation@city.gov.in', staff: 28, budget: '₹38.5L' },
    { id: 3, name: 'Water Board', head: 'Amit Singh', contact: 'water.dept@city.gov.in', staff: 17, budget: '₹42L' },
    { id: 4, name: 'Electricity Board', head: 'V. Malhotra', contact: 'power@city.gov.in', staff: 16, budget: '₹65L' }
];

// Departments Route
router.get('/departments', (req, res) => {
    res.render('admin/departments', { departments });
});

// Add Department Route
router.post('/departments/add', (req, res) => {
    const { name, head, contact, staff, budget } = req.body;
    const newDept = {
        id: departments.length + 1,
        name,
        head,
        contact,
        staff,
        budget
    };
    departments.push(newDept);
    res.redirect('/admin/departments');
});

// Edit Department Route
router.post('/departments/edit/:id', (req, res) => {
    const { id } = req.params;
    const { name, head, contact, staff, budget } = req.body;
    const deptIndex = departments.findIndex(d => d.id == id);

    if (deptIndex !== -1) {
        departments[deptIndex] = { ...departments[deptIndex], name, head, contact, staff, budget };
    }
    res.redirect('/admin/departments');
});

// Workers Data (In-Memory)
let workers = [
    { id: 204, name: 'R. Gupta', role: 'Field Supervisor', department: 'Public Works', status: 'Active', tasks: 5, phone: '+91 98231 76542' },
    { id: 312, name: 'Suresh P.', role: 'Technician', department: 'Electricity', status: 'Busy', tasks: 2, phone: '+91 99887 22331' },
    { id: 105, name: 'Mahesh Kumar', role: 'Cleaner', department: 'Sanitation', status: 'Offline', tasks: 0, phone: '+91 98761 11029' },
    { id: 156, name: 'Deepak Singh', role: 'Plumber', department: 'Water Board', status: 'Active', tasks: 3, phone: '+91 88776 54321' },
    { id: 402, name: 'Vijay Verma', role: 'Electrician', department: 'Electricity', status: 'Active', tasks: 4, phone: '+91 91234 56780' },
    { id: 221, name: 'Anil Yadav', role: 'Driver', department: 'Sanitation', status: 'Busy', tasks: 1, phone: '+91 90001 20002' },
    { id: 189, name: 'Rajendra P.', role: 'Mason', department: 'Public Works', status: 'Active', tasks: 2, phone: '+91 98798 76543' },
    { id: 334, name: 'Sanjay M.', role: 'Lineman', department: 'Electricity', status: 'Offline', tasks: 0, phone: '+91 95544 33221' },
    { id: 190, name: 'Prakash Sharma', role: 'Pipe Fitter', department: 'Water Board', status: 'Busy', tasks: 3, phone: '+91 96655 44332' },
    { id: 111, name: 'Mohan Lal', role: 'Sweeper', department: 'Sanitation', status: 'Active', tasks: 1, phone: '+91 97766 55443' },
    { id: 450, name: 'A. Tiwari', role: 'Road Inspector', department: 'Public Works', status: 'Active', tasks: 6, phone: '+91 98877 66554' },
    { id: 299, name: 'Kishan Joshi', role: 'Meter Reader', department: 'Water Board', status: 'Busy', tasks: 4, phone: '+91 99988 77766' }
];

// Workers Route
router.get('/workers', (req, res) => {
    res.render('admin/workers', { workers });
});

// Add Worker Route
router.post('/workers/add', (req, res) => {
    const { name, role, department, phone } = req.body;
    const newWorker = {
        id: workers.length + 101,
        name,
        role,
        department,
        status: 'Active', // Default status
        tasks: 0,
        phone
    };
    workers.push(newWorker);
    res.redirect('/admin/workers');
});

// Redirect /admin to /admin/dashboard
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});


// Update Status API
router.post('/api/issues/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });

        // Emit socket event
        if (req.io) {
            req.io.emit('status_update', issue);
        }

        res.json({ success: true, issue });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
