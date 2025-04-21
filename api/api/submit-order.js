import axios from 'axios';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const {
    name, phone, email, address, city, state, pincode, landmark,
    cart, discount, shipping, total, method,
    razorpay_payment_id, razorpay_order_id, razorpay_signature
  } = req.body;

  if (method === 'prepaid') {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(body).digest('hex');

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

    await axios.post(`https://${process.env.SHOPIFY_STORE}/admin/api/2023-10/orders.json`, orderData, {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Shopify order failed' });
  }
}
