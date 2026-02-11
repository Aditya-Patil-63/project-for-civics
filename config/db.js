const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config();

// MongoDB Connection
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        console.log('Retrying MongoDB connection in 5 seconds...');
        setTimeout(connectMongoDB, 5000);
    }
};

// MySQL Connection Pool
const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test MySQL Connection
mysqlPool.getConnection()
    .then(connection => {
        console.log('MySQL Connected Successfully');
        connection.release();
    })
    .catch(err => {
        console.warn('MySQL Configuration Error or Unreachable:', err.message);
        console.log('App will continue, but MySQL features will be unavailable.');
    });

module.exports = { connectMongoDB, mysqlPool };
