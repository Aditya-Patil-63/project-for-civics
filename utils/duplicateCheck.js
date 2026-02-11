const mongoose = require('mongoose');
const Issue = require('../models/Issue'); // Assuming Issue model exists

/**
 * Check for duplicate issues within a specific radius (default 100m)
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} radiusInMeters 
 * @returns {Promise<Array>} List of potential duplicate issues
 */
const checkDuplicates = async (latitude, longitude, radiusInMeters = 100) => {
    try {
        const duplicates = await Issue.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: radiusInMeters
                }
            },
            // Optional: Filter by status (e.g., only open issues)
            status: { $nin: ['Resolved', 'Closed'] }
        });

        return duplicates;
    } catch (error) {
        console.error('Error in duplicate check:', error);
        throw error;
    }
};

module.exports = { checkDuplicates };
