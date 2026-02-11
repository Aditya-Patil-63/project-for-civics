const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for Seeding...');

        // Clear existing users
        await User.deleteMany({});

        // Hash passwords
        const adminPass = await bcrypt.hash('admin123', 10);
        const workerPass = await bcrypt.hash('worker123', 10);
        const citizenPass = await bcrypt.hash('citizen123', 10);

        const users = [
            {
                name: 'City Admin',
                email: 'admin@city.gov.in',
                password_hash: adminPass, // Using hashed password
                role: 'admin',
                points: 0
            },
            {
                name: 'Ramesh Field Worker',
                email: 'worker@city.gov.in',
                password_hash: workerPass,
                role: 'worker',
                points: 100
            },
            {
                name: 'Aditya Citizen',
                email: 'citizen@gmail.com',
                password_hash: citizenPass,
                role: 'citizen',
                points: 50,
                badges: ['First Reporter']
            }
        ];

        await User.insertMany(users);
        console.log('Users seeded successfully!');

        // Log credentials for user visibility
        console.log('-------------------------------------------');
        console.log('DEFAULT LOGIN CREDENTIALS:');
        console.log('Admin:   admin@city.gov.in / admin123');
        console.log('Worker:  worker@city.gov.in / worker123');
        console.log('Citizen: citizen@gmail.com / citizen123');
        console.log('-------------------------------------------');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedUsers();
