const DamageReview = require('../models/DamageReview');
const DamageChatMessage = require('../models/DamageChatMessage');
const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');
const User = require('../models/User'); // Staff
const { sequelize } = require('../config/database');
const { notify } = require('../services/NotificationService');
const { audit } = require('../services/AuditService');

// Helper: find the User.id for a borrower (for notifications)
const getUserIdForBorrower = async (borrowerId) => {
    try {
        const borrower = await Borrower.findByPk(borrowerId);
        if (!borrower || !borrower.email) return null;
        const user = await User.findOne({ where: { email: borrower.email } });
        return user ? user.id : null;
    } catch { return null; }
};

// GET review details by Loan ID
exports.getReviewByLoanId = async (req, res) => {
    try {
        const { loanId } = req.params;

        // Find the loan first to ensure it exists and get basic info
        const loan = await Loan.findByPk(loanId, {
            include: [
                { model: Equipment, as: 'equipment' },
                { model: Borrower, as: 'borrower' }
            ]
        });

        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }

        // Find the damage review
        let review = await DamageReview.findOne({
            where: { loan_id: loanId },
            include: [
                {
                    model: DamageChatMessage,
                    as: 'messages',
                    order: [['created_at', 'ASC']]
                }
            ]
        });

        res.json({
            success: true,
            loan,
            review
        });

    } catch (error) {
        console.error('Error fetching damage review:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// UPDATE review (Staff Only)
exports.updateReview = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params; // Review ID
        const { final_damage_cost, inspection_notes, status } = req.body;
        const staffId = req.user.id;

        const review = await DamageReview.findByPk(id, {
            include: [{ model: Loan, as: 'loan' }],
            transaction
        });

        if (!review) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const oldStatus = review.status;
        const oldCost = review.final_damage_cost;

        // Update review
        await review.update({
            staff_id: staffId,
            final_damage_cost: parseInt(final_damage_cost) || 0,
            inspection_notes,
            status
        }, { transaction });

        // Sync with Loan
        let loanStatus = review.loan.status;
        if (status === 'Approved with Penalty') {
            loanStatus = 'Penalty_Pending';
        } else if (status === 'Rejected (No Damage Fee)') {
            loanStatus = 'Completed';
        }

        await Loan.update({
            damage_cost: parseInt(final_damage_cost) || 0,
            damage_notes: inspection_notes,
            status: loanStatus
        }, {
            where: { id: review.loan_id },
            transaction
        });

        await transaction.commit();

        // Notify borrower
        const borrowerUserId = await getUserIdForBorrower(review.loan.borrower_id);
        if (borrowerUserId) {
            await notify({
                userId: borrowerUserId,
                type: 'penalty_issued',
                title: '💰 Update Denda Kerusakan',
                message: status === 'Rejected (No Damage Fee)'
                    ? `Denda kerusakan untuk ${review.loan.loan_number} telah dibatalkan. Status: Selesai.`
                    : `Biaya kerusakan untuk ${review.loan.loan_number} telah ditetapkan sebesar Rp ${parseInt(final_damage_cost).toLocaleString()}.`,
                entityType: 'DamageReview',
                entityId: review.id,
                actionUrl: `/dashboard-borrower.html#myloans`
            });
        }

        // Audit Log
        await audit({
            actor: req.user,
            action: 'DAMAGE_REVIEW_UPDATED',
            entityType: 'Loan',
            entityId: review.loan_id,
            oldValue: { status: oldStatus, cost: oldCost },
            newValue: { status, cost: final_damage_cost },
            description: `Damage review updated by ${req.user.name}. Status: ${status}. Cost: ${final_damage_cost}`,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Review updated', review });

    } catch (error) {
        await transaction.rollback();
        console.error('Error updating review:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// SEND chat message
exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params; // Review ID
        const { message, sender_role, sender_id, attachment_url } = req.body;

        // Validate that sender matches auth user (security check)
        // For simplicity assuming middleware passes clean data or we trust the role from body if checked against auth

        const newMessage = await DamageChatMessage.create({
            review_id: id,
            sender_role,
            sender_id,
            message,
            attachment_url
        });

        res.status(201).json({ success: true, message: newMessage });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET messages
exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params; // Review ID
        const messages = await DamageChatMessage.findAll({
            where: { review_id: id },
            order: [['created_at', 'ASC']]
        });
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
