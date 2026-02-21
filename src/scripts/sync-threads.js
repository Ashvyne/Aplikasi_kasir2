const { sequelize } = require('../config/database');
const LoanThread = require('../models/LoanThread');
const LoanThreadMessage = require('../models/LoanThreadMessage');

async function syncThreads() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync models
        await LoanThread.sync({ alter: true });
        await LoanThreadMessage.sync({ alter: true });

        console.log('LoanThread and LoanThreadMessage models synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

syncThreads();
