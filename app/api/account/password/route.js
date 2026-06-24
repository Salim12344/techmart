import { connectDB } from '@/lib/db';
import User from '@/models/user';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!newPassword || !confirmPassword) {
      return Response.json({ error: 'New password and confirmation are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return Response.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return Response.json({
        error: 'Password must be at least 8 characters with uppercase, number, and special character',
      }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.password) {
      if (!currentPassword) {
        return Response.json({ error: 'Current password is required' }, { status: 400 });
      }
      if (user.password !== currentPassword) {
        return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    user.password = newPassword;
    await user.save();

    return Response.json({
      message: user.password ? 'Password changed successfully' : 'Password set successfully',
      hasPassword: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
