const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// GET Login Page
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// GET Register Page
router.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

// POST Register
router.post('/register', async (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    try {
        // Validation
        if (!name || !email || !password || !confirm_password) {
            return res.render('register', { title: 'Register', error: 'Please fill in all fields' });
        }

        if (password !== confirm_password) {
            return res.render('register', { title: 'Register', error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.render('register', { title: 'Register', error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { title: 'Register', error: 'Email is already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create User
        const newUser = new User({
            name,
            email,
            password_hash,
            role: 'citizen', // Default role
            points: 0
        });

        await newUser.save();

        // Redirect to Login
        res.redirect('/auth/login');

    } catch (err) {
        console.error(err);
        res.render('register', { title: 'Register', error: 'Server Error' });
    }
});

// POST Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('login', { title: 'Login', error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            if (password !== user.password_hash) {
                return res.render('login', { title: 'Login', error: 'Invalid email or password' });
            }
        }

        // Determine role based on email suffix
        const userEmail = user.email.toLowerCase();
        let userRole = 'citizen'; // default

        if (userEmail.endsWith('.ac@city.gov.in')) {
            userRole = 'admin';
        } else if (userEmail.endsWith('@city.gov.in')) {
            userRole = 'worker';
        }

        // Set Session with role based on email
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: userRole
        };

        // Redirect based on role
        if (userRole === 'admin') {
            return res.redirect('/admin/dashboard');
        } else if (userRole === 'worker') {
            return res.redirect('/worker/dashboard');
        } else {
            return res.redirect('/citizen/home');
        }

    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Login', error: 'Server Error' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect('/auth/login');
    });
});

module.exports = router;
