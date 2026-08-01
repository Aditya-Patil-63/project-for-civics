const mongoose = require('mongoose');
require('dotenv').config();

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./models/User');
        const user = await User.findOneAndUpdate({ email: 'hacker.ac@city.gov.in' }, { role: 'admin' }, { new: true });
        if (user) {
            console.log('Successfully made user admin:', user.email);
        } else {
            console.log('User not found!');
            // Let's create an admin if not found
            const bcrypt = require('bcrypt');
            const admin = new User({
                name: 'Admin User',
                email: 'admin@city.gov.in',
                password_hash: await bcrypt.hash('password123', 10),
                role: 'admin'
            });
            await admin.save();
            console.log('Created new admin@city.gov.in with password123');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
makeAdmin();
