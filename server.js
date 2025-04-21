// =============================
// 🔧 BACKEND - server.js
// =============================

const express = require('express');
const axios = require('axios');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;

app.post('/submit-order', async (req, res) => {
  const { name, phone, email, address, city, state, pincode, landmark, cart, discount, shipping, total, method, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  // Verify Razorpay signature if prepaid
  if (method === 'prepaid') {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  try {
    const orderData = {
      order: {
        line_items: cart.items.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity
        })),
        customer: {
          first_name: name,
          email,
          phone
        },
        shipping_address: {
          address1: address,
          city,
          province: state,
          zip: pincode,
          phone,
          name,
          address2: landmark
        },
        financial_status: method === 'cod' ? 'pending' : 'paid',
        tags: method === 'cod' ? 'COD-FastForm' : 'Prepaid-FastForm'
      }
    };

    await axios.post(`https://${SHOPIFY_STORE}/admin/api/2023-10/orders.json`, orderData, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Order creation failed' });
  }
});

app.listen(3000, () => console.log('✅ Server running on port 3000'));
