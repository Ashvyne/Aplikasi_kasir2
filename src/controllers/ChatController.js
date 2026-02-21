const LoanThread = require('../models/LoanThread');
const LoanThreadMessage = require('../models/LoanThreadMessage');
const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Borrower = require('../models/Borrower');
const User = require('../models/User');
const { sequelize } = require('../config/database');

exports.getThreadByLoanId = async (req, res) => {
    try {
        const { loan_id } = req.params;

        let senderRole = 'staff';
        if (['customer', 'borrower', 'peminjam'].includes(req.user.role)) {
            senderRole = 'customer';
        }

        let senderId = req.user.id;

        if (senderRole === 'customer') {
            const borrower = await Borrower.findOne({ where: { email: req.user.email } });
            if (borrower) {
                senderId = borrower.id;
            } else {
                console.warn(`Chat Access: Borrower profile not found for email ${req.user.email}`);
                // If no borrower profile found, they can't possibly own a loan (which requires borrower_id)
                // Unless loan.borrower_id IS user.id (unlikely given schema)
                // We will let it fail the ID check below if IDs don't match
            }
        }

        // Check if thread exists or create new
        let thread = await LoanThread.findOne({
            where: { loan_id },
            include: [
                { model: Borrower, as: 'customer', attributes: ['name', 'email'] },
                { model: User, as: 'staff', attributes: ['name'] },
                { model: Loan, as: 'loan', include: [{ model: Equipment, as: 'equipment' }] }
            ]
        });

        if (!thread) {
            // Must define who the customer is if staff is opening?
            // Actually usually thread created when customer first messages OR system event
            // But let's allow lazy creation
            const loan = await Loan.findByPk(loan_id);
            if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

            // Check Access
            if (senderRole === 'customer') {
                // Check if loan belongs to this customer
                // Need to map user.id (borrower account) to loan.borrower_id
                // Assuming req.user.id is borrower_id for now or we do a lookup. 
                // In this app, it seems 'borrower' in token is 'id' of borrower table. 
                if (loan.borrower_id !== senderId) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
                }
            }

            // Create thread
            thread = await LoanThread.create({
                loan_id,
                customer_id: loan.borrower_id,
                status: 'Open',
                last_message_at: new Date()
            });

            // Re-fetch with includes
            thread = await LoanThread.findByPk(thread.id, {
                include: [
                    { model: Borrower, as: 'customer', attributes: ['name'] },
                    { model: User, as: 'staff', attributes: ['name'] },
                    { model: Loan, as: 'loan', include: [{ model: Equipment, as: 'equipment' }] }
                ]
            });
        } else {
            // Access Check
            if (senderRole === 'customer') {
                if (thread.customer_id !== senderId) return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        res.json({ success: true, thread });

    } catch (error) {
        console.error('Get Thread Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { thread_id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const thread = await LoanThread.findByPk(thread_id);
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        let senderRole = 'staff';
        if (['customer', 'borrower', 'peminjam'].includes(req.user.role)) {
            senderRole = 'customer';
        }

        let senderId = req.user.id;
        if (senderRole === 'customer') {
            const borrower = await Borrower.findOne({ where: { email: req.user.email } });
            if (borrower) senderId = borrower.id;
            else return res.status(403).json({ success: false, message: 'Access denied' });

            if (thread.customer_id !== senderId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        const whereClause = { thread_id };
        if (senderRole === 'customer') {
            whereClause.message_type = { [Op.ne]: 'internal_note' };
        }

        const messages = await LoanThreadMessage.findAll({
            where: whereClause,
            order: [['created_at', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({ success: true, messages });

    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const { notify } = require('../services/NotificationService');

exports.sendMessage = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { thread_id } = req.params;
        const { message, type = 'text', attachment_url } = req.body;

        let senderRole = 'staff';
        if (['customer', 'borrower', 'peminjam'].includes(req.user.role)) {
            senderRole = 'customer';
        }

        let senderId = req.user.id;

        if (senderRole === 'customer') {
            const borrower = await Borrower.findOne({ where: { email: req.user.email } });
            if (borrower) {
                senderId = borrower.id;
            } else {
                await transaction.rollback();
                return res.status(403).json({ success: false, message: 'Borrower profile not found' });
            }
        }

        const thread = await LoanThread.findByPk(thread_id, {
            include: [{ model: Loan, as: 'loan' }]
        });
        if (!thread) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Thread not found' });
        }

        // Security: Check if user is participant
        if (senderRole === 'customer' && thread.customer_id !== senderId) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const newMessage = await LoanThreadMessage.create({
            thread_id,
            sender_role: senderRole,
            sender_id: senderId,
            message,
            message_type: type,
            attachment_url
        }, { transaction });

        // Update thread status
        const updateData = { last_message_at: new Date() };
        if (senderRole === 'customer') {
            updateData.status = 'Awaiting Staff Response';
        } else if (senderRole === 'staff' && type === 'text') {
            updateData.status = 'Awaiting Customer Response';
        }

        await thread.update(updateData, { transaction });

        await transaction.commit();

        // 🔔 Trigger Notifications
        if (senderRole === 'customer') {
            // Notify all staff/admin
            const staff = await User.findAll({ where: { role: ['staff', 'admin', 'petugas'] } });
            for (const s of staff) {
                await notify({
                    userId: s.id,
                    type: 'chat_message',
                    title: '💬 Pesan Baru dari Customer',
                    message: `[Loan #${thread.loan?.loan_number}] ${message.substring(0, 50)}...`,
                    entityType: 'LoanThread',
                    entityId: thread_id,
                    actionUrl: `/dashboard-staff.html#chat`
                });
            }
        } else {
            if (type === 'text') {
                // Notify customer profile user
                const borrower = await Borrower.findByPk(thread.customer_id);
                if (borrower) {
                    const customerUser = await User.findOne({ where: { email: borrower.email } });
                    if (customerUser) {
                        await notify({
                            userId: customerUser.id,
                            type: 'chat_message',
                            title: '💬 Pesan dari Staff',
                            message: `[Loan #${thread.loan?.loan_number}] ${message.substring(0, 50)}...`,
                            entityType: 'LoanThread',
                            entityId: thread_id,
                            actionUrl: `/dashboard-borrower.html#chat`
                        });
                    }
                }
            }
        }

        res.status(201).json({ success: true, message: newMessage });

    } catch (error) {
        await transaction.rollback();
        console.error('Send Message Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.markRead = async (req, res) => {
    try {
        // Logic to mark messages as read
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
};

