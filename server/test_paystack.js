/**
 * Quick diagnostic: tests Paystack API connectivity + key validity
 * Run:  node test_paystack.js
 */
require('dotenv').config();
const axios = require('axios');

const KEY = process.env.PAYSTACK_SECRET_KEY;
console.log('PAYSTACK_SECRET_KEY loaded:', KEY ? `${KEY.slice(0, 12)}...` : '❌ NOT FOUND');

(async () => {
    try {
        console.log('\nTesting Paystack /transaction/initialize ...');
        const res = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: 'test_student@bichiacademy.edu.ng',
                amount: 10000, // ₦100 in kobo
                reference: 'DIAG_TEST_' + Date.now(),
            },
            {
                headers: {
                    Authorization: `Bearer ${KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            }
        );
        console.log('\n✅ SUCCESS — Paystack responded:');
        console.log('  status:', res.data.status);
        console.log('  message:', res.data.message);
        console.log('  authorization_url:', res.data.data?.authorization_url?.slice(0, 60) + '...');
        console.log('  access_code:', res.data.data?.access_code);
    } catch (err) {
        if (err.response) {
            console.log('\n❌ Paystack returned an error:');
            console.log('  HTTP status:', err.response.status);
            console.log('  body:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.log('\n❌ Network / connection error:');
            console.log('  message:', err.message);
            console.log('  code:', err.code);
        }
    }
    process.exit();
})();
