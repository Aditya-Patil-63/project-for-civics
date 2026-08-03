const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { connectMongoDB, mysqlPool } = require('./config/db');

// Initialize App
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.set('trust proxy', 1);

// Connect Databases
connectMongoDB();
// MySQL connection is pooled, so we just check it when needed or on startup in config/db.js

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET is not set. Using default secret. Set this in production!');
}

const MongoStore = require('connect-mongo');
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Socket.io
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Basic Routes
// Routes
app.use('/', require('./routes/issueRoutes'));
app.use('/', require('./routes/workerRoutes')); // Mount at root for simplicity of /worker/* paths
app.use('/auth', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// Direct Login Alias
app.get('/login', (req, res) => res.redirect('/auth/login'));
app.get('/logout', (req, res) => res.redirect('/auth/logout'));

// Basic Routes
// Root Route - Enforce Login
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
        if (req.session.user.role === 'worker') return res.redirect('/worker/dashboard');
        return res.redirect('/home');
    }
    res.redirect('/auth/login');
});

// Citizen Home Route
app.get('/home', (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');

    res.render('citizen/home', {
        title: 'Civic Issue Reporting',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application.`);
});
