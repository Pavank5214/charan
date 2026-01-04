const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Company = require('./models/Company');
const connectDB = require('./config/db');

dotenv.config();

const setupAdmin = async () => {
    try {
        await connectDB();

        const email = 'pavank5214@gmail.com';
        const password = 'Pavank@5214';
        const name = 'Admin'; // Default name if creating new

        console.log(`Checking for user: ${email}`);

        let user = await User.findOne({ email });

        if (user) {
            console.log('User found. Updating password and role...');
            user.role = 'admin';
            // Mongoose middleware will hash this if we save, but I'll manually set to be sure or rely on save()
            user.password = password;
            await user.save();
            console.log('User updated successfully.');
        } else {
            console.log('User not found. Creating new admin user...');
            user = new User({
                name,
                email,
                password,
                role: 'admin'
            });
            await user.save();
            console.log('User created successfully.');
        }

        // Ensure Default Company exists
        console.log('Checking for default company...');
        let company = await Company.findOne();

        if (!company) {
            console.log('No company found. Creating default company...');
            company = new Company({
                user: user._id,
                name: 'My Factory', // Placeholder
                email: email,
                phone: ''
            });
            await company.save();
            console.log('Default company created.');
        } else {
            console.log('Company already exists.');
            // Optional: Ensure this admin is the owner? Not strictly necessary with shared logic but good for consistency.
            if (company.user.toString() !== user._id.toString()) {
                console.log('Updating company owner to new admin...');
                company.user = user._id;
                await company.save();
            }
        }

        console.log('Setup complete.');
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

setupAdmin();
