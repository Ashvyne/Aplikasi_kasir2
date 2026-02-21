const { sequelize } = require('../config/database');
const DamageReview = require('../models/DamageReview');
const DamageChatMessage = require('../models/DamageChatMessage');

async function syncModels() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync models
        await DamageReview.sync({ alter: true });
        await DamageChatMessage.sync({ alter: true });

        console.log('DamageReview and DamageChatMessage models synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

syncModels();
