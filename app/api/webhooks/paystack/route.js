import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Order from '@/models/order';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('x-paystack-signature');

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');

  if (hash !== sig) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const { reference, customer } = event.data;

    try {
      await connectDB();

      const order = await Order.findOneAndUpdate(
        { paymentReference: reference },
        { status: 'confirmed' },
        { new: true }
      );

      if (order && customer?.email) {
        try {
          await sendOrderConfirmationEmail(customer.email, {
            orderNumber: order.orderNumber,
            total: order.totalAmount,
            deliveryWindow: {
              earliest: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              latest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        } catch (emailErr) {
          console.error('Order email failed:', emailErr);
        }
      }
    } catch (err) {
      console.error('Webhook order update failed:', err);
      return Response.json({ error: 'Order update failed' }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
