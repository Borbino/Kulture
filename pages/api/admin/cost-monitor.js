/**
 * Cost Monitoring API
 * Get translation cost statistics and budget status
 */

import { getCostMonitor } from '../../../lib/costMonitor';
import { verifyAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Admin only
    await verifyAdmin(req, res);
    
    const costMonitor = getCostMonitor();

    if (req.method === 'GET') {
      const { breakdown } = req.query;
      
      if (breakdown === 'true') {
        const data = costMonitor.getCostBreakdown();
        return res.status(200).json({ ok: true, data });
      }
      
      const stats = costMonitor.getUsageStats();
      return res.status(200).json({ ok: true, stats });
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      if (action === 'reset') {
        costMonitor.reset();
        return res.status(200).json({
          ok: true,
          message: 'Cost monitor reset successfully',
        });
      }
      
      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Cost monitoring error:', error);
    return res.status(error.message === 'Forbidden: Admin access required' ? 403 : 500).json({
      error: error.message || 'Internal server error',
    });
  }
}
