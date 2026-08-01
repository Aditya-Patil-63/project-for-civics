const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD
        });
        await connection.query('CREATE DATABASE IF NOT EXISTS civics;');
        console.log('Database civics created or already exists.');
        await connection.end();
    } catch (err) {
        console.error(err);
    }
}

createDb();
