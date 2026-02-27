import { runAutonomousDiscovery } from '../../../lib/autonomousScraper';

export default async function handler(req, res) {
  // 1. Security Check
  // Vercel Cron automatically adds this header if CRON_SECRET is set in environment variables
  const authHeader = req.headers.authorization;
  
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // 2. Execution
    const result = await runAutonomousDiscovery();

    // 3. Response
    return res.status(200).json({
      success: true,
      message: 'Autonomous discovery cycle completed',
      stats: result
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
