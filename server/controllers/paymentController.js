const crypto = require('crypto');
const axios = require('axios');
const pool = require('../db');

// Paystack Secret Key from env
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_paystack_secret_key_here';

module.exports = {
    // 1. Get student fees info
    async getStudentFees(req, res) {
        try {
            const studentId = req.user.id;
            const term = req.query.term || '1st Term';
            const year = req.query.year || '2025/2026';

            // Get student's class
            const [userRows] = await pool.query('SELECT class_id FROM users WHERE id = ?', [studentId]);
            if (userRows.length === 0 || !userRows[0].class_id) {
                return res.status(400).json({ msg: 'Student is not assigned to any class.' });
            }
            const classId = userRows[0].class_id;

            // Find fee configuration for this class
            const [feeConfig] = await pool.query(`
                SELECT amount FROM fee_configurations 
                WHERE class_id = ? AND academic_term = ? AND academic_year = ?
            `, [classId, term, year]);

            const totalExpected = feeConfig.length > 0 ? parseFloat(feeConfig[0].amount) : 0.00;

            // Find or create student_fees record
            const [studentFees] = await pool.query(`
                SELECT total_amount, amount_paid, status FROM student_fees
                WHERE student_id = ? AND academic_term = ? AND academic_year = ?
            `, [studentId, term, year]);

            let record = {
                total_amount: totalExpected,
                amount_paid: 0.00,
                status: 'unpaid'
            };

            if (studentFees.length > 0) {
                record = {
                    total_amount: parseFloat(studentFees[0].total_amount),
                    amount_paid: parseFloat(studentFees[0].amount_paid),
                    status: studentFees[0].status
                };
            } else if (totalExpected > 0) {
                // Initialize fee record for student if it doesn't exist yet
                await pool.query(`
                    INSERT IGNORE INTO student_fees (student_id, academic_term, academic_year, total_amount, amount_paid, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [studentId, term, year, totalExpected, 0.00, 'unpaid']);
            }

            const balance = record.total_amount - record.amount_paid;

            res.json({
                total_amount: record.total_amount,
                amount_paid: record.amount_paid,
                balance: balance > 0 ? balance : 0.00,
                status: record.status,
                academic_term: term,
                academic_year: year
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Server error loading school fees status.' });
        }
    },

    // 2. Initialize payment with Paystack
    async initializePayment(req, res) {
        const studentId = req.user.id;
        const { amount, term, year } = req.body;

        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ msg: 'Invalid payment amount.' });
        }

        // Fetch student info
        let student;
        try {
            const [userRows] = await pool.query('SELECT full_name, username FROM users WHERE id = ?', [studentId]);
            if (userRows.length === 0) {
                return res.status(404).json({ msg: 'Student not found.' });
            }
            student = userRows[0];
        } catch (dbErr) {
            console.error(dbErr);
            return res.status(500).json({ msg: 'Database error loading student info.' });
        }

        // Generate unique transaction reference
        const reference = 'BI_FEES_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const amountInKobo = Math.round(parseFloat(amount) * 100);

        try {
            // Call Paystack API to initialize transaction
            const response = await axios.post('https://api.paystack.co/transaction/initialize', {
                email: `${student.username}@bichiacademy.edu.ng`,
                amount: amountInKobo,
                reference,
                metadata: {
                    studentId,
                    term,
                    year,
                    student_name: student.full_name
                }
            }, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            if (response.data && response.data.status && response.data.data) {
                const { authorization_url, access_code } = response.data.data;

                // Persist pending payment record in DB
                await pool.query(`
                    INSERT INTO payments (student_id, academic_term, academic_year, amount, transaction_reference, payment_gateway, status, rrr)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [studentId, term, year, parseFloat(amount), reference, 'paystack', 'pending', reference]);

                return res.json({
                    reference,
                    access_code,
                    authorization_url,
                    amount: parseFloat(amount)
                });
            } else {
                throw new Error(response.data?.message || 'Paystack did not return a valid authorization URL.');
            }
        } catch (err) {
            console.error('Paystack initialization error:', err.response?.data || err.message);
            return res.status(502).json({
                msg: 'Unable to connect to Paystack payment gateway. Please try again later.',
                detail: err.response?.data?.message || err.message
            });
        }
    },

    // 3. Callback URL that Paystack redirects back to
    async handleCallback(req, res) {
        const reference = req.query.reference || req.query.trxref;
        if (!reference) {
            return res.send(`
                <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                    <h2 style="color: red;">Invalid Callback Session</h2>
                    <p>No transaction reference found.</p>
                    <a href="/student/fees" style="color: #6366f1; font-weight: bold; text-decoration: none;">Return to Fees Section</a>
                </div>
            `);
        }

        try {
            // Verify payment status
            const isSuccess = await verifyAndCompleteTransaction(reference);

            if (isSuccess) {
                res.send(`
                    <html>
                    <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f8fafc; margin: 0;">
                        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px rgba(0,0,0,0.05); text-align: center; max-width: 450px;">
                            <div style="font-size: 50px; color: #10b981; margin-bottom: 20px;">✅</div>
                            <h2 style="margin: 0 0 10px 0; color: #0f172a;">Payment Successful!</h2>
                            <p style="color: #475569; margin: 0 0 20px 0; font-size: 0.95rem;">
                                Your payment has been verified. The outstanding balance has been updated in the portal.
                            </p>
                            <p style="font-family: monospace; font-size: 0.85rem; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 6px;">
                                Ref: ${reference}
                            </p>
                            <button onclick="window.close(); if(window.opener){window.opener.location.reload();}" style="background: #3bb75e; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                                Close & Refresh Portal
                            </button>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                res.send(`
                    <html>
                    <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f8fafc; margin: 0;">
                        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px rgba(0,0,0,0.05); text-align: center; max-width: 450px;">
                            <div style="font-size: 50px; color: #f43f5e; margin-bottom: 20px;">❌</div>
                            <h2 style="margin: 0 0 10px 0; color: #0f172a;">Payment Verification Failed</h2>
                            <p style="color: #475569; margin: 0 0 25px 0; font-size: 0.95rem;">
                                The payment status could not be verified by Paystack. If you were debited, please contact the administrator.
                            </p>
                            <button onclick="window.close();" style="background: #475569; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                                Close Window
                            </button>
                        </div>
                    </body>
                    </html>
                `);
            }
        } catch (err) {
            console.error(err);
            res.send('<h3>Server error processing payment callback.</h3>');
        }
    },

    // 4. Client polling route to check / verify payment on-demand
    async verifyPaymentStatus(req, res) {
        const { orderId } = req.params;
        try {
            const [paymentRows] = await pool.query('SELECT status FROM payments WHERE transaction_reference = ?', [orderId]);
            if (paymentRows.length === 0) {
                return res.status(404).json({ msg: 'Payment record not found.' });
            }

            const payment = paymentRows[0];
            if (payment.status === 'success') {
                return res.json({ verified: true, status: 'success' });
            }

            // Execute verification
            const isSuccess = await verifyAndCompleteTransaction(orderId);
            res.json({
                verified: isSuccess,
                status: isSuccess ? 'success' : 'failed'
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Error verifying transaction status.' });
        }
    },

    // 5. Webhook endpoint from Paystack
    async handleWebhook(req, res) {
        const payload = req.body;
        if (!payload || payload.event !== 'charge.success' || !payload.data || !payload.data.reference) {
            return res.status(400).json({ msg: 'Invalid webhook payload.' });
        }

        try {
            const isSuccess = await verifyAndCompleteTransaction(payload.data.reference);
            if (isSuccess) {
                res.status(200).json({ status: 'OK', msg: 'Transaction verified and updated.' });
            } else {
                res.status(400).json({ status: 'ERROR', msg: 'Verification failed.' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Webhook server error.' });
        }
    },

    // 6. Get payment history for student
    async getPaymentHistory(req, res) {
        try {
            const studentId = req.user.id;
            const [payments] = await pool.query(`
                SELECT id, academic_term, academic_year, amount, transaction_reference, rrr, status, created_at, verified_at
                FROM payments
                WHERE student_id = ?
                ORDER BY created_at DESC
            `, [studentId]);

            res.json(payments);
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Failed to load payment logs.' });
        }
    },

    // 7. Get single receipt details
    async getReceiptDetails(req, res) {
        const { paymentId } = req.params;
        try {
            const [receiptRows] = await pool.query(`
                SELECT p.id, p.amount, p.transaction_reference, p.rrr, p.status, p.created_at, p.verified_at,
                       p.academic_term, p.academic_year,
                       u.full_name AS student_name, u.username AS admission_id,
                       c.name AS class_name
                FROM payments p
                JOIN users u ON p.student_id = u.id
                LEFT JOIN classes c ON u.class_id = c.id
                WHERE p.id = ? AND p.status = 'success'
            `, [paymentId]);

            if (receiptRows.length === 0) {
                return res.status(404).json({ msg: 'Receipt not found or transaction was not successful.' });
            }

            res.json(receiptRows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Error retrieving receipt details.' });
        }
    },

    // 8. Bursar Stats dashboard
    async getBursarStats(req, res) {
        try {
            // Aggregated expectation
            const [expectationRows] = await pool.query('SELECT SUM(total_amount) AS total_expected FROM student_fees');
            const [collectionsRows] = await pool.query('SELECT SUM(amount) AS total_collected FROM payments WHERE status = "success"');

            const totalExpected = parseFloat(expectationRows[0]?.total_expected) || 0.00;
            const totalCollected = parseFloat(collectionsRows[0]?.total_collected) || 0.00;
            const outstanding = totalExpected - totalCollected;

            // Class configurations breakdown
            const [classBreakdown] = await pool.query(`
                SELECT c.name AS class_name, fc.amount, fc.academic_term, fc.academic_year
                FROM fee_configurations fc
                JOIN classes c ON fc.class_id = c.id
                ORDER BY c.name
            `);

            res.json({
                total_expected: totalExpected,
                total_collected: totalCollected,
                outstanding: outstanding > 0 ? outstanding : 0.00,
                classes: classBreakdown
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Failed to aggregate financial statistics.' });
        }
    },

    // 9. Bursar reports page
    async getBursarReports(req, res) {
        const { class_id, status, term, year } = req.query;
        try {
            let query = `
                SELECT sf.id, sf.total_amount, sf.amount_paid, sf.status, sf.academic_term, sf.academic_year,
                       u.full_name AS student_name, u.username AS admission_id,
                       c.name AS class_name
                FROM student_fees sf
                JOIN users u ON sf.student_id = u.id
                LEFT JOIN classes c ON u.class_id = c.id
                WHERE 1=1
            `;
            const params = [];

            if (class_id && class_id !== 'All') {
                query += ' AND u.class_id = ?';
                params.push(class_id);
            }
            if (status && status !== 'All') {
                query += ' AND sf.status = ?';
                params.push(status);
            }
            if (term && term !== 'All') {
                query += ' AND sf.academic_term = ?';
                params.push(term);
            }
            if (year && year !== 'All') {
                query += ' AND sf.academic_year = ?';
                params.push(year);
            }

            query += ' ORDER BY c.name, u.full_name';

            const [records] = await pool.query(query, params);
            res.json(records);
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Failed to query student reports.' });
        }
    },

    // 10. Configure fee amount per class/section/term/session
    async configureFee(req, res) {
        const { class_id, academic_term, academic_year, amount } = req.body;
        if (!class_id || !academic_term || !academic_year || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ msg: 'Please provide all details and a positive amount.' });
        }

        try {
            let targetClassIds = [];
            const strClassId = String(class_id).toLowerCase();

            if (strClassId === 'all' || strClassId === 'all_classes') {
                const [allCls] = await pool.query('SELECT id FROM classes');
                targetClassIds = allCls.map(c => c.id);
            } else if (strClassId === 'nursery' || strClassId === 'nursery_all') {
                const [nurCls] = await pool.query("SELECT id FROM classes WHERE LOWER(name) LIKE '%nursery%'");
                targetClassIds = nurCls.map(c => c.id);
            } else if (strClassId === 'primary' || strClassId === 'primary_all') {
                const [priCls] = await pool.query("SELECT id FROM classes WHERE LOWER(name) LIKE '%primary%'");
                targetClassIds = priCls.map(c => c.id);
            } else if (strClassId === 'jss' || strClassId === 'jss_all') {
                const [jssCls] = await pool.query("SELECT id FROM classes WHERE LOWER(name) LIKE '%jss%'");
                targetClassIds = jssCls.map(c => c.id);
            } else if (strClassId === 'ss' || strClassId === 'ss_all') {
                const [ssCls] = await pool.query("SELECT id FROM classes WHERE LOWER(name) LIKE '%ss%' AND LOWER(name) NOT LIKE '%jss%'");
                targetClassIds = ssCls.map(c => c.id);
            } else if (Array.isArray(class_id)) {
                targetClassIds = class_id;
            } else {
                targetClassIds = [class_id];
            }

            if (targetClassIds.length === 0) {
                return res.status(404).json({ msg: 'No matching classes found for this selection.' });
            }

            for (const cid of targetClassIds) {
                // Update or Insert Fee configuration
                await pool.query(`
                    INSERT INTO fee_configurations (class_id, academic_term, academic_year, amount)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE amount = VALUES(amount)
                `, [cid, academic_term, academic_year, parseFloat(amount)]);

                // Automatically sync/update existing student_fees mappings
                const [students] = await pool.query('SELECT id FROM users WHERE role = "student" AND class_id = ?', [cid]);
                for (let s of students) {
                    await pool.query(`
                        INSERT INTO student_fees (student_id, academic_term, academic_year, total_amount, amount_paid, status)
                        VALUES (?, ?, ?, ?, 0.00, 'unpaid')
                        ON DUPLICATE KEY UPDATE 
                            total_amount = VALUES(total_amount),
                            status = IF(amount_paid >= VALUES(total_amount), 'paid', IF(amount_paid > 0, 'partially_paid', 'unpaid'))
                    `, [s.id, academic_term, academic_year, parseFloat(amount)]);
                }
            }

            res.json({ 
                msg: `Fee configuration saved successfully across ${targetClassIds.length} class(es), and student balances have been updated.`,
                updatedClassesCount: targetClassIds.length
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Failed to save fee configuration.' });
        }
    },

    // 11. (Reserved for future use)
    async _placeholder(req, res) {
        const { reference } = req.query;
        if (!reference) {
            return res.send('<h3>Transaction reference is required for checkout.</h3>');
        }

        try {
            // Fetch payment details
            const [payments] = await pool.query(
                'SELECT p.amount, p.academic_term, p.academic_year, u.full_name FROM payments p JOIN users u ON p.student_id = u.id WHERE p.transaction_reference = ?',
                [reference]
            );

            if (payments.length === 0) {
                return res.send('<h3>Transaction details not found.</h3>');
            }

            const payment = payments[0];

            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Paystack Sandbox Simulator</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                            color: #f1f5f9;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                        }
                        .container {
                            background: rgba(15, 23, 42, 0.6);
                            backdrop-filter: blur(12px);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
                            max-width: 480px;
                            width: 100%;
                            text-align: center;
                        }
                        .logo {
                            color: #3b82f6;
                            font-size: 24px;
                            font-weight: 800;
                            letter-spacing: -0.05em;
                            margin-bottom: 25px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        }
                        .logo span {
                            color: #10b981;
                        }
                        .badge {
                            background: rgba(16, 185, 129, 0.1);
                            border: 1px solid rgba(16, 185, 129, 0.2);
                            color: #34d399;
                            padding: 6px 12px;
                            border-radius: 9999px;
                            font-size: 11px;
                            font-weight: bold;
                            display: inline-block;
                            margin-bottom: 20px;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .details-box {
                            background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.05);
                            border-radius: 12px;
                            padding: 20px;
                            margin-bottom: 30px;
                            text-align: left;
                        }
                        .detail-row {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 12px;
                            font-size: 14px;
                        }
                        .detail-row:last-child {
                            margin-bottom: 0;
                            border-top: 1px solid rgba(255, 255, 255, 0.05);
                            padding-top: 12px;
                        }
                        .label {
                            color: #94a3b8;
                        }
                        .value {
                            font-weight: 600;
                        }
                        .value.price {
                            color: #f8fafc;
                            font-size: 18px;
                            font-weight: 800;
                        }
                        .btn {
                            width: 100%;
                            padding: 14px;
                            border-radius: 10px;
                            font-weight: bold;
                            font-size: 15px;
                            cursor: pointer;
                            transition: all 0.2s;
                            border: none;
                            margin-bottom: 12px;
                        }
                        .btn-success {
                            background: #10b981;
                            color: #fff;
                        }
                        .btn-success:hover {
                            background: #059669;
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
                        }
                        .btn-danger {
                            background: transparent;
                            border: 1px solid rgba(239, 68, 68, 0.2);
                            color: #ef4444;
                        }
                        .btn-danger:hover {
                            background: rgba(239, 68, 68, 0.05);
                            border-color: #ef4444;
                        }
                        .footer {
                            margin-top: 20px;
                            font-size: 11px;
                            color: #64748b;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">
                            pay<span>stack</span> <small style="font-size: 12px; font-weight: normal; color: #94a3b8;">sandbox</small>
                        </div>
                        <div class="badge">Offline Payment Simulator</div>
                        
                        <div class="details-box">
                            <div class="detail-row">
                                <span class="label">Student Name</span>
                                <span class="value">${payment.full_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Session / Term</span>
                                <span class="value">${payment.academic_year} - ${payment.academic_term}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Reference ID</span>
                                <span class="value" style="font-family: monospace; font-size: 12px;">${reference}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Amount Due</span>
                                <span class="value price">₦${parseFloat(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                        </div>
                        
                        <button class="btn btn-success" onclick="handleSimulate(true)">Simulate Success</button>
                        <button class="btn btn-danger" onclick="handleSimulate(false)">Simulate Failure</button>
                        
                        <div class="footer">
                            This is a secure offline sandbox environment for Bichi Academy. No actual money will be charged.
                        </div>
                    </div>

                    <script>
                        function handleSimulate(isSuccess) {
                            if (isSuccess) {
                                window.location.href = '/api/payment/mock-checkout/process?reference=${reference}&status=success';
                            } else {
                                window.location.href = '/api/payment/mock-checkout/process?reference=${reference}&status=failed';
                            }
                        }
                    </script>
                </body>
                </html>
            `);
        } catch (err) {
            console.error(err);
            res.status(500).send('<h3>Error loading payment simulator details.</h3>');
        }
    },

    // 12. Process mock checkout simulation results
    async processMockCheckout(req, res) {
        const { reference, status } = req.query;
        if (!reference) {
            return res.status(400).send('Reference is required.');
        }

        try {
            const newStatus = status === 'success' ? 'mock_approved' : 'failed';
            await pool.query(
                'UPDATE payments SET status = ? WHERE transaction_reference = ? AND status = "pending"',
                [newStatus, reference]
            );

            // Redirect to callback URL
            res.redirect(`/api/payment/callback?reference=${reference}`);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error processing mock payment.');
        }
    }
};

// --- CORE TRANSACTION VERIFICATION HELPER ---
async function verifyAndCompleteTransaction(orderId) {
    // 1. Fetch payment attempt from database
    const [payments] = await pool.query(
        'SELECT student_id, amount, status, academic_term, academic_year, payment_gateway FROM payments WHERE transaction_reference = ?',
        [orderId]
    );

    if (payments.length === 0) {
        console.error(`Verification error: No transaction matching reference ${orderId} found.`);
        return false;
    }

    const pRecord = payments[0];
    if (pRecord.status === 'success') {
        return true; // Already verified and applied
    }

    let isSuccess = false;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(orderId)}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                },
                timeout: 15000
            }
        );

        // Paystack returns data.status === 'success' when the charge succeeded
        if (response.data && response.data.status && response.data.data && response.data.data.status === 'success') {
            isSuccess = true;
        }
    } catch (err) {
        console.error(`Error verifying Paystack transaction ${orderId}:`, err.response?.data || err.message);
    }

    if (isSuccess) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Update payments table to success
            await connection.query(`
                UPDATE payments 
                SET status = 'success', verified_at = CURRENT_TIMESTAMP
                WHERE transaction_reference = ?
            `, [orderId]);

            // 2. Fetch or create student_fees record
            const [studentFees] = await connection.query(`
                SELECT id, total_amount, amount_paid FROM student_fees
                WHERE student_id = ? AND academic_term = ? AND academic_year = ?
            `, [pRecord.student_id, pRecord.academic_term, pRecord.academic_year]);

            let totalExpected = pRecord.amount;
            let currentPaid = 0.00;

            if (studentFees.length > 0) {
                totalExpected = parseFloat(studentFees[0].total_amount);
                currentPaid = parseFloat(studentFees[0].amount_paid);
            }

            const newPaid = currentPaid + parseFloat(pRecord.amount);
            let newStatus = 'unpaid';
            if (newPaid >= totalExpected) {
                newStatus = 'paid';
            } else if (newPaid > 0) {
                newStatus = 'partially_paid';
            }

            await connection.query(`
                INSERT INTO student_fees (student_id, academic_term, academic_year, total_amount, amount_paid, status)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    amount_paid = VALUES(amount_paid),
                    status = VALUES(status)
            `, [pRecord.student_id, pRecord.academic_term, pRecord.academic_year, totalExpected, newPaid, newStatus]);

            await connection.commit();
            return true;
        } catch (dbErr) {
            await connection.rollback();
            console.error('Database transaction rollback during payment verification:', dbErr);
            return false;
        } finally {
            connection.release();
        }
    }

    // Mark as failed if status check fails
    await pool.query(`
        UPDATE payments SET status = 'failed' WHERE transaction_reference = ?
    `, [orderId]);

    return false;
}
