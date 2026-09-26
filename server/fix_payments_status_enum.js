/**
 * One-time migration: Fix the payments.status ENUM
 * Removes 'mock_approved' (sandbox artefact) and normalises
 * any leftover 'mock_approved' rows to 'success'.
 *
 * Run once:  node fix_payments_status_enum.js
 */
const pool = require('./db');

async function run() {
    try {
        console.log('Normalising any mock_approved payment rows to success...');
        await pool.query(`
            UPDATE payments SET status = 'success', verified_at = CURRENT_TIMESTAMP
            WHERE status = 'mock_approved'
        `);

        console.log('Altering payments.status ENUM to remove mock_approved...');
        await pool.query(`
            ALTER TABLE payments
            MODIFY COLUMN status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending'
        `);

        console.log('Done. payments.status ENUM is now: pending | success | failed');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        process.exit();
    }
}

run();
