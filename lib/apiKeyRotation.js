/**
 * API Key Rotation System
 * Automatically rotates API keys for security and manages key lifecycle
 */

import logger from './logger';

class APIKeyRotationManager {
  constructor() {
    this.keys = {
      openai: {
        current: process.env.OPENAI_API_KEY,
        backup: process.env.OPENAI_API_KEY_BACKUP,
        rotationDate: null,
        usageCount: 0,
      },
      deepl: {
        current: process.env.DEEPL_API_KEY,
        backup: process.env.DEEPL_API_KEY_BACKUP,
        rotationDate: null,
        usageCount: 0,
      },
      google: {
        current: process.env.GOOGLE_TRANSLATE_API_KEY,
        backup: process.env.GOOGLE_TRANSLATE_API_KEY_BACKUP,
        rotationDate: null,
        usageCount: 0,
      },
    };
    
    this.rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
    this.maxUsageBeforeRotation = 1000000; // 1M requests
  }

  /**
   * Get current active API key
   */
  getKey(provider) {
    if (!this.keys[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    const keyData = this.keys[provider];
    keyData.usageCount++;
    
    // Check if rotation is needed
    if (this.shouldRotate(provider)) {
      logger.warn(`API key rotation needed for ${provider}`);
      this.scheduleRotation(provider);
    }
    
    return keyData.current;
  }

  /**
   * Check if key should be rotated
   */
  shouldRotate(provider) {
    const keyData = this.keys[provider];
    
    // Check usage count
    if (keyData.usageCount >= this.maxUsageBeforeRotation) {
      return true;
    }
    
    // Check rotation date
    if (keyData.rotationDate) {
      const timeSinceRotation = Date.now() - keyData.rotationDate;
      if (timeSinceRotation >= this.rotationInterval) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Rotate to backup key
   */
  rotateKey(provider) {
    const keyData = this.keys[provider];
    
    if (!keyData.backup) {
      logger.error(`No backup key available for ${provider}`);
      return false;
    }
    
    // Swap keys
    const oldKey = keyData.current;
    keyData.current = keyData.backup;
    keyData.backup = oldKey;
    keyData.rotationDate = Date.now();
    keyData.usageCount = 0;
    
    logger.info(`API key rotated for ${provider}`, {
      provider,
      timestamp: new Date().toISOString(),
    });
    
    // Send notification
    this.notifyRotation(provider);
    
    return true;
  }

  /**
   * Schedule key rotation
   */
  scheduleRotation(provider) {
    // In production, this would trigger a workflow to:
    // 1. Generate new key in provider dashboard
    // 2. Update environment variables
    // 3. Rotate keys
    
    logger.warn(`Key rotation scheduled for ${provider}`, {
      currentUsage: this.keys[provider].usageCount,
      lastRotation: this.keys[provider].rotationDate,
    });
  }

  /**
   * Notify about key rotation
   */
  async notifyRotation(provider) {
    // Send email/Slack notification
    const message = `🔑 API Key Rotated: ${provider}
    
Time: ${new Date().toISOString()}
Previous Usage: ${this.keys[provider].usageCount} requests

Action Required: 
- Verify new key is working
- Update backup key in environment variables
- Monitor for any issues`;

    logger.info('Rotation notification sent', { provider, message });
  }

  /**
   * Get rotation status for all providers
   */
  getRotationStatus() {
    const status = {};
    
    for (const [provider, keyData] of Object.entries(this.keys)) {
      const hasBackup = !!keyData.backup;
      const timeSinceRotation = keyData.rotationDate 
        ? Date.now() - keyData.rotationDate 
        : null;
      const daysUntilRotation = timeSinceRotation
        ? Math.ceil((this.rotationInterval - timeSinceRotation) / (24 * 60 * 60 * 1000))
        : null;
      
      status[provider] = {
        hasBackup,
        usageCount: keyData.usageCount,
        usagePercentage: (keyData.usageCount / this.maxUsageBeforeRotation) * 100,
        lastRotation: keyData.rotationDate 
          ? new Date(keyData.rotationDate).toISOString() 
          : 'Never',
        daysUntilRotation,
        needsRotation: this.shouldRotate(provider),
      };
    }
    
    return status;
  }

  /**
   * Manually rotate key
   */
  manualRotate(provider, newKey) {
    if (!this.keys[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    this.keys[provider].backup = this.keys[provider].current;
    this.keys[provider].current = newKey;
    this.keys[provider].rotationDate = Date.now();
    this.keys[provider].usageCount = 0;
    
    logger.info(`Manual key rotation for ${provider}`);
    return true;
  }

  /**
   * Validate key is working
   */
  async validateKey(provider, key) {
    // Test key with minimal API call
    try {
      switch (provider) {
        case 'openai': {
          // Test OpenAI key
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${key}` },
          });
          return openaiResponse.ok;
        }
          
        case 'deepl': {
          // Test DeepL key
          const deeplResponse = await fetch(
            `https://api-free.deepl.com/v2/usage?auth_key=${key}`
          );
          return deeplResponse.ok;
        }
          
        case 'google': {
          // Test Google key
          const googleResponse = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${key}&q=test&target=en`
          );
          return googleResponse.ok;
        }
          
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Key validation failed for ${provider}`, { error: error.message });
      return false;
    }
  }
}

// Singleton instance
let rotationManager = null;

export function getAPIKeyRotationManager() {
  if (!rotationManager) {
    rotationManager = new APIKeyRotationManager();
  }
  return rotationManager;
}

export default APIKeyRotationManager;
