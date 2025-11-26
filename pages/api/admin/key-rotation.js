/**
 * API Key Rotation Status API
 * Monitor and manage API key rotation
 */

import { getAPIKeyRotationManager } from '../../../lib/apiKeyRotation';
import { verifyAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Admin only
    await verifyAdmin(req, res);
    
    const rotationManager = getAPIKeyRotationManager();

    if (req.method === 'GET') {
      // Get rotation status
      const status = rotationManager.getRotationStatus();
      
      return res.status(200).json({
        ok: true,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === 'POST') {
      // Trigger manual rotation
      const { provider, newKey } = req.body;
      
      if (!provider) {
        return res.status(400).json({ error: 'Provider required' });
      }
      
      if (newKey) {
        // Validate new key first
        const isValid = await rotationManager.validateKey(provider, newKey);
        
        if (!isValid) {
          return res.status(400).json({ 
            error: 'Invalid API key',
            provider,
          });
        }
        
        // Perform manual rotation
        rotationManager.manualRotate(provider, newKey);
        
        return res.status(200).json({
          ok: true,
          message: `API key rotated for ${provider}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Rotate to backup key
        const success = rotationManager.rotateKey(provider);
        
        if (!success) {
          return res.status(400).json({
            error: 'Rotation failed - no backup key available',
            provider,
          });
        }
        
        return res.status(200).json({
          ok: true,
          message: `Rotated to backup key for ${provider}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API key rotation error:', error);
    return res.status(error.message === 'Forbidden: Admin access required' ? 403 : 500).json({
      error: error.message || 'Internal server error',
    });
  }
}
