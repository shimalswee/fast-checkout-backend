const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: 'order_rcptid_' + Math.floor(Math.random() * 100000),
      payment_capture: 1
    });

    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Razorpay order failed' });
  }
}
