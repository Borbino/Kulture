/**
 * Translation Cost Monitoring
 * Track API usage costs and budget alerts
 */

import { logger } from './logger.js';

// Pricing per 1K characters (approximate, model-agnostic averages)
// Free-tier providers (groq, openrouter free, huggingface) have 0 cost
const PRICING = {
  openai:      { standard: 0.005 }, // average across GPT-4o-mini / GPT-4o
  anthropic:   { standard: 0.008 }, // average across Claude Haiku / Sonnet
  google:      { standard: 0.001 }, // Gemini Flash / Pro average
  groq:        { standard: 0.0   }, // free tier
  openrouter:  { standard: 0.0   }, // free models only
  huggingface: { standard: 0.0   }, // free inference
  deepl:       { standard: 0.02  }, // $20 per 1M chars
  googleTranslate: { standard: 0.02 }, // Google Translate API
};

class CostMonitor {
  constructor() {
    this.usage = {
      openai:      { characters: 0, requests: 0, cost: 0 },
      anthropic:   { characters: 0, requests: 0, cost: 0 },
      google:      { characters: 0, requests: 0, cost: 0 },
      groq:        { characters: 0, requests: 0, cost: 0 },
      openrouter:  { characters: 0, requests: 0, cost: 0 },
      huggingface: { characters: 0, requests: 0, cost: 0 },
      deepl:       { characters: 0, requests: 0, cost: 0 },
      googleTranslate: { characters: 0, requests: 0, cost: 0 },
    };
    
    this.budget = {
      monthly: parseFloat(process.env.TRANSLATION_BUDGET_MONTHLY) || 1000, // $1000
      daily: parseFloat(process.env.TRANSLATION_BUDGET_DAILY) || 50, // $50
      alertThreshold: 0.8, // Alert at 80%
    };
    
    this.startDate = new Date();
    this.dailyUsage = 0; // Track daily cost separately
    this.lastResetDate = new Date();
  }

  /**
   * Check and reset daily usage if new day
   */
  checkDailyReset() {
    const now = new Date();
    if (now.getDate() !== this.lastResetDate.getDate() || 
        now.getMonth() !== this.lastResetDate.getMonth()) {
      this.dailyUsage = 0;
      this.lastResetDate = now;
      logger.info('Daily cost usage reset');
    }
  }

  /**
   * Check if daily budget limit is exceeded (80%)
   * @returns {boolean}
   */
  checkDailyLimit() {
    this.checkDailyReset();
    const percentage = (this.dailyUsage / this.budget.daily);
    return percentage >= 0.8;
  }

  /**
   * Track translation request
   */
  trackRequest(provider, textLength) {
    if (!this.usage[provider]) {
      // 동적으로 신규 제공자 추가 (aiModelManager가 새 제공자를 발견했을 경우)
      this.usage[provider] = { characters: 0, requests: 0, cost: 0 };
    }

    this.checkDailyReset(); // Ensure daily usage is for current day

    const characters = textLength;
    const cost = this.calculateCost(provider, characters);

    this.dailyUsage += cost; // Add to daily usage
    this.usage[provider].characters += characters;
    this.usage[provider].requests += 1;
    this.usage[provider].cost += cost;

    // Check budget alerts
    this.checkBudgetAlerts();

    logger.info('Cost tracked', {
      provider,
      characters,
      cost: cost.toFixed(4),
      totalCost: this.getTotalCost().toFixed(2),
    });
  }

  /**
   * Calculate cost for a translation/AI request
   * Model-agnostic: uses provider-level average pricing
   */
  calculateCost(provider, characters) {
    const charsInK = characters / 1000;
    const providerPricing = PRICING[provider];
    if (!providerPricing) return 0;
    return charsInK * providerPricing.standard;
  }

  /**
   * Get total cost across all providers
   */
  getTotalCost() {
    return Object.values(this.usage).reduce((sum, data) => sum + data.cost, 0);
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const totalCost = this.getTotalCost();
    const totalCharacters = Object.values(this.usage).reduce(
      (sum, data) => sum + data.characters,
      0
    );
    const totalRequests = Object.values(this.usage).reduce(
      (sum, data) => sum + data.requests,
      0
    );

    const daysInMonth = 30;
    const daysElapsed = Math.ceil((Date.now() - this.startDate.getTime()) / (24 * 60 * 60 * 1000));
    const projectedMonthlyCost = (totalCost / daysElapsed) * daysInMonth;

    return {
      current: {
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalCharacters,
        totalRequests,
        byProvider: this.usage,
      },
      budget: {
        monthly: this.budget.monthly,
        daily: this.budget.daily,
        monthlyUsed: parseFloat(totalCost.toFixed(2)),
        monthlyRemaining: parseFloat((this.budget.monthly - totalCost).toFixed(2)),
        monthlyPercentage: parseFloat(((totalCost / this.budget.monthly) * 100).toFixed(1)),
        projectedMonthlyCost: parseFloat(projectedMonthlyCost.toFixed(2)),
      },
      period: {
        startDate: this.startDate.toISOString(),
        daysElapsed,
      },
      alerts: this.getAlerts(),
    };
  }

  /**
   * Check budget alerts
   */
  checkBudgetAlerts() {
    const totalCost = this.getTotalCost();
    const monthlyPercentage = (totalCost / this.budget.monthly) * 100;

    if (monthlyPercentage >= this.budget.alertThreshold * 100) {
      this.sendBudgetAlert('monthly', totalCost, this.budget.monthly);
    }
  }

  /**
   * Get active alerts
   */
  getAlerts() {
    const alerts = [];
    const totalCost = this.getTotalCost();
    const monthlyPercentage = (totalCost / this.budget.monthly) * 100;

    if (monthlyPercentage >= 100) {
      alerts.push({
        level: 'critical',
        type: 'budget_exceeded',
        message: `Monthly budget exceeded: $${totalCost.toFixed(2)} / $${this.budget.monthly}`,
      });
    } else if (monthlyPercentage >= 90) {
      alerts.push({
        level: 'warning',
        type: 'budget_high',
        message: `Monthly budget at ${monthlyPercentage.toFixed(1)}%`,
      });
    } else if (monthlyPercentage >= 80) {
      alerts.push({
        level: 'info',
        type: 'budget_approaching',
        message: `Monthly budget at ${monthlyPercentage.toFixed(1)}%`,
      });
    }

    return alerts;
  }

  /**
   * Send budget alert
   */
  async sendBudgetAlert(period, current, limit) {
    const percentage = ((current / limit) * 100).toFixed(1);
    
    logger.warn('Budget alert triggered', {
      period,
      current: current.toFixed(2),
      limit,
      percentage,
    });

    // In production, send email/Slack notification
    const message = `⚠️ Translation Budget Alert

Period: ${period}
Current Spend: $${current.toFixed(2)}
Budget Limit: $${limit}
Usage: ${percentage}%

Action: Review usage and consider increasing budget or optimizing translation calls.`;

    // Notification would be sent here
    logger.info('Budget alert notification', { message });
  }

  /**
   * Reset usage stats
   */
  reset() {
    this.usage = {
      openai:      { characters: 0, requests: 0, cost: 0 },
      anthropic:   { characters: 0, requests: 0, cost: 0 },
      google:      { characters: 0, requests: 0, cost: 0 },
      groq:        { characters: 0, requests: 0, cost: 0 },
      openrouter:  { characters: 0, requests: 0, cost: 0 },
      huggingface: { characters: 0, requests: 0, cost: 0 },
      deepl:       { characters: 0, requests: 0, cost: 0 },
      googleTranslate: { characters: 0, requests: 0, cost: 0 },
    };
    this.startDate = new Date();
    this.dailyUsage = 0; // Track daily cost separately
    this.lastResetDate = new Date();
    logger.info('Cost monitor reset');
  }

  /**
   * Get cost breakdown by time period
   */
  getCostBreakdown() {
    const stats = this.getUsageStats();
    
    return {
      providers: Object.entries(this.usage).map(([provider, data]) => ({
        name: provider,
        characters: data.characters,
        requests: data.requests,
        cost: parseFloat(data.cost.toFixed(2)),
        percentage: parseFloat(((data.cost / stats.current.totalCost) * 100).toFixed(1)),
      })),
      totals: {
        cost: stats.current.totalCost,
        characters: stats.current.totalCharacters,
        requests: stats.current.totalRequests,
      },
    };
  }
}

// Singleton instance
let costMonitor = null;

export function getCostMonitor() {
  if (!costMonitor) {
    costMonitor = new CostMonitor();
  }
  return costMonitor;
}

export default CostMonitor;
