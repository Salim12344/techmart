/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test database connection
 *     description: Verify that the API server and database are working correctly
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: Database connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userCount:
 *                   type: number
 *       500:
 *         description: Database connection failed
 */

// app/api/test/route.js
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

export async function GET() {
  try {
    await connectDB();
    
    const userCount = await User.countDocuments();
    
    return Response.json({
      success: true,
      message: 'Database connected successfully',
      userCount: userCount,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}