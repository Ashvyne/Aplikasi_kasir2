const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ANALYTICS CONTROLLER
 * High-level reporting and dashboard statistics
 */

exports.getAdminStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        // 1. Overview counts
        const [totalLoans, activeLoans, overdueLoans, totalEquipment, totalBorrowers] = await Promise.all([
            Loan.count(),
            Loan.count({ where: { status: ['Active', 'Aktif'] } }),
            Loan.count({ where: { [Op.or]: [{ status: ['Overdue', 'Terlambat'] }, { is_late: true, status: ['Active', 'Aktif', 'Returning'] }] } }),
            Equipment.count({ where: { is_active: true } }),
            Borrower.count({ where: { is_active: true } })
        ]);

        // 2. Trend Peminjaman (30 Hari Terakhir)
        // Group by date
        const trend = await Loan.findAll({
            where: {
                loan_date: { [Op.gte]: thirtyDaysAgo }
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('loan_date')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('loan_date'))],
            order: [[sequelize.fn('DATE', sequelize.col('loan_date')), 'ASC']]
        });

        // 3. Status Distribution
        const statusDist = await Loan.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status']
        });

        // 4. Category Distribution
        const catDist = await Equipment.findAll({
            attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['category']
        });

        // 5. Recent Activity (Latest 10 loans)
        const recentLoans = await Loan.findAll({
            include: [
                { model: Borrower, as: 'borrower', attributes: ['name'] },
                { model: Equipment, as: 'equipment', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            overview: {
                total_loans: totalLoans,
                active_loans: activeLoans,
                overdue_loans: overdueLoans,
                total_equipment: totalEquipment,
                total_borrowers: totalBorrowers
            },
            trend,
            status_distribution: statusDist,
            category_distribution: catDist,
            recent_loans: recentLoans
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getStaffStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [todayLoans, todayReturns, awaitingVerification, pendingApprovals] = await Promise.all([
            Loan.count({ where: { loan_date: today } }),
            Loan.count({ where: { return_date: today } }),
            Loan.count({ where: { status: 'Returning', return_status: 'Returned' } }),
            Loan.count({ where: { approval_status: 'Pending' } })
        ]);

        res.json({
            success: true,
            stats: {
                today_loans: todayLoans,
                today_returns: todayReturns,
                awaiting_verification: awaitingVerification,
                pending_approvals: pendingApprovals
            }
        });

    } catch (error) {
        console.error('Staff Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
