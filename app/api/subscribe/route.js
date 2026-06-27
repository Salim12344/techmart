import { connectDB } from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import User from '@/models/user';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return Response.json({ type: 'existing_customer', message: "You're already a TechMart customer! Sign in to start shopping." });
    }

    const existingSub = await Subscriber.findOne({ email: normalizedEmail });
    if (existingSub) {
      return Response.json({ type: 'already_subscribed', message: 'You are already subscribed! Create an account to start shopping.' });
    }

    await Subscriber.create({ email: normalizedEmail });

    try {
      await resend.emails.send({
        from: 'noreply@techmartng.store',
        to: email,
        subject: "We can't wait to have you at TechMart!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1d1d1f; font-size: 28px;">We can't wait to have you!</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thanks for your interest in TechMart! You're one step away from accessing the best Apple products in Nigeria.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Create your account today and enjoy exclusive deals, fast delivery, and premium customer support.
            </p>
            <div style="margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/auth/register" style="background: #0071e3; color: white; padding: 14px 28px; border-radius: 980px; text-decoration: none; font-size: 16px; font-weight: 500;">
                Create Your Account
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">© 2026 TechMart. All rights reserved.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr);
    }

    return Response.json({
      type: 'new_subscriber',
      message: "We can't wait to have you! Check your email and create an account to get started.",
    }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return Response.json({ type: 'already_subscribed', message: 'You are already subscribed!' });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
