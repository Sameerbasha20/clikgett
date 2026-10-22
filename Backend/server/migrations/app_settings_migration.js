// Adds customer-app settings (editable in admin Settings). Existing values are never overwritten.
const pool = require('../utils/db.js');

const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
});

const FAQS = [
    {
        category: 'Orders & delivery',
        questions: [
            { q: 'Where is my order?', a: 'Open My Orders and tap the order. You will see each step live, the delivery partner\'s name with a call button, and the expected arrival time.' },
            { q: 'How long does delivery take?', a: 'The delivery time for your address is shown at the top of the home screen and at checkout. Large orders can take a few minutes longer to pack.' },
            { q: 'Can I schedule a delivery for later?', a: 'Yes. At checkout, choose a delivery date and time slot instead of delivering now.' },
            { q: 'What are the delivery charges?', a: 'The delivery fee depends on the distance to your address and is shown in the bill at checkout. Orders above the free-delivery amount shown in your cart are delivered free.' },
            { q: 'Why do I need to share an OTP?', a: 'When the delivery partner arrives, the app shows a 4-digit OTP. Share it with them so the order is handed only to you.' },
            { q: 'An item is missing or damaged', a: 'Go to Profile > Help & enquiries and send us an enquiry with your order number and a photo. Our team will sort it out.' },
        ],
    },
    {
        category: 'Cancellation & refunds',
        questions: [
            { q: 'How do I cancel an order?', a: 'You can cancel within 2 minutes of placing the order from the order screen. After that, please contact support.' },
            { q: 'When do I get my refund?', a: 'Wallet money comes back to your wallet straight away. Online payments are refunded to the original payment method, which usually takes 3-5 working days.' },
            { q: 'Money was deducted but the order was not placed', a: 'If an online payment goes through but the order cannot be placed, it is refunded automatically. If you do not see the refund within 5 working days, contact support with the payment reference.' },
        ],
    },
    {
        category: 'Payments, wallet & offers',
        questions: [
            { q: 'Which payment methods can I use?', a: 'Cash on delivery (cash or UPI to the delivery partner), online payment by UPI, card or net banking, and your ClikGett wallet balance.' },
            { q: 'How much of my wallet can I use?', a: 'Checkout shows exactly how much of your wallet balance can be used on that order. Larger orders can be paid fully from the wallet.' },
            { q: 'How do I earn cashback?', a: 'Eligible orders earn cashback, which is added to your wallet after delivery. Checkout shows how much you will earn.' },
            { q: 'Why is my coupon not working?', a: 'Coupons have a minimum order value and an expiry date, and some items are not eligible. The coupon list at checkout shows how much more you need to add.' },
        ],
    },
    {
        category: 'Account',
        questions: [
            { q: 'How do I log in?', a: 'Enter your mobile number and the OTP sent to it. There is no password.' },
            { q: 'How do I change my delivery address?', a: 'Tap the address at the top of the home screen, or go to Profile > Saved addresses to add or edit addresses.' },
            { q: 'How do I change my mobile number?', a: 'Please contact support to change the mobile number on your account.' },
            { q: 'How do I delete my account?', a: 'Go to Profile and tap Delete account at the bottom of the page.' },
        ],
    },
];

const DEFAULTS = {
    SupportPhone: '9429690261',
    SupportEmail: 'support@clikgett.com',
    TipPresets: JSON.stringify([10, 20, 30, 50]),
    WalletTopupAmounts: JSON.stringify([100, 200, 500, 1000]),
    FAQs: JSON.stringify(FAQS),
};

async function runMigration() {
    console.log('=== App settings migration ===');
    for (const [key, value] of Object.entries(DEFAULTS)) {
        const result = await runQuery(
            'INSERT INTO Settings (SettingKey, SettingValue, Status) SELECT ?, ?, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE SettingKey = ?)',
            [key, value, key]
        );
        console.log(`${key}: ${result.affectedRows ? 'added' : 'already set'}`);
    }
    console.log('=== App settings migration complete ===');
}

if (require.main === module) {
    runMigration()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err.message);
            process.exit(1);
        });
}

module.exports = runMigration;
