const mongoose = require('mongoose');
const Issue = require('./models/Issue');
require('dotenv').config();

const checkDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civic_reporting_db';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const count = await Issue.countDocuments();
        console.log(`Total Issues in DB: ${count}`);

        const sample = await Issue.findOne();
        console.log('Sample Issue:', sample);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
