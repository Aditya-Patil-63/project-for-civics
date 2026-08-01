const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    reporter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    category: {
        type: String,
        enum: ['Road', 'Sanitation', 'Water', 'Electricity', 'Public Safety', 'Other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    severity: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    photos: [String],
    status: {
        type: String,
        enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
        default: 'Submitted'
    },
    assigned_to: {
        type: Number,
        default: null
    },
    department_id: {
        type: Number, // MySQL department ID
        default: null
    },
    resolved_at: Date
}, { timestamps: true });

// strict typing for location index
issueSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Issue', issueSchema);
