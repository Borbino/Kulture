/**
 * Translation System Performance Monitor
 * Monitors cache efficiency and translation speed
 */

const { translateHighQuality } = require('../lib/highQualityTranslation');

class PerformanceMonitor {
  constructor() {
    this.stats = {
      totalTranslations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTime: 0,
      providerStats: {
        deepl: { count: 0, totalTime: 0 },
        openai: { count: 0, totalTime: 0 },
        google: { count: 0, totalTime: 0 },
      },
    };
  }

  async translate(text, targetLang, sourceLang = 'auto', options = {}) {
    const startTime = Date.now();
    
    try {
      const result = await translateHighQuality(text, targetLang, sourceLang, options);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Update stats
      this.stats.totalTranslations++;
      this.stats.totalTime += duration;
      
      if (result.provider) {
        const provider = result.provider;
        if (this.stats.providerStats[provider]) {
          this.stats.providerStats[provider].count++;
          this.stats.providerStats[provider].totalTime += duration;
        }
      }
      
      return { ...result, duration };
    } catch (error) {
      throw error;
    }
  }

  getStats() {
    const avgTime = this.stats.totalTranslations > 0 
      ? this.stats.totalTime / this.stats.totalTranslations 
      : 0;
    
    const providerAvgTimes = {};
    for (const [provider, data] of Object.entries(this.stats.providerStats)) {
      providerAvgTimes[provider] = data.count > 0 
        ? data.totalTime / data.count 
        : 0;
    }
    
    return {
      totalTranslations: this.stats.totalTranslations,
      averageTime: Math.round(avgTime),
      totalTime: this.stats.totalTime,
      providers: this.stats.providerStats,
      providerAverageTimes: providerAvgTimes,
    };
  }

  printStats() {
    const stats = this.getStats();
    
    console.log('\n📊 Performance Statistics');
    console.log('='.repeat(80));
    console.log(`Total Translations: ${stats.totalTranslations}`);
    console.log(`Average Time: ${stats.averageTime}ms`);
    console.log(`Total Time: ${stats.totalTime}ms`);
    console.log('\nProvider Breakdown:');
    
    for (const [provider, data] of Object.entries(stats.providers)) {
      const avgTime = Math.round(stats.providerAverageTimes[provider]);
      console.log(`  ${provider.toUpperCase()}: ${data.count} translations, ${avgTime}ms avg`);
    }
    console.log('='.repeat(80));
  }
}

async function runPerformanceTest() {
  console.log('🚀 Translation System Performance Test\n');
  
  const monitor = new PerformanceMonitor();
  
  // Test cases
  const testCases = [
    { text: 'Hello, world!', targetLang: 'ko', name: 'Simple greeting' },
    { text: 'The weather is beautiful today.', targetLang: 'ja', name: 'Simple sentence' },
    { text: 'Welcome to our community platform. Share your thoughts and connect with others.', targetLang: 'es', name: 'Medium text' },
    { text: 'This is a test of the high-quality translation system. It should provide natural and accurate translations.', targetLang: 'fr', name: 'Longer text' },
    { text: 'Good morning', targetLang: 'de', name: 'Short phrase' },
  ];
  
  console.log('Running performance tests...\n');
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`  Original: "${testCase.text}"`);
    
    try {
      const result = await monitor.translate(testCase.text, testCase.targetLang);
      console.log(`  Translation: "${result.text}"`);
      console.log(`  Provider: ${result.provider}`);
      console.log(`  Duration: ${result.duration}ms`);
      console.log(`  Quality: ${result.quality}`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log();
  }
  
  // Test repeated translations (cache test)
  console.log('Testing cache efficiency...\n');
  const cacheTestText = 'This is a cache test';
  
  console.log('First translation (cache miss expected):');
  try {
    const result1 = await monitor.translate(cacheTestText, 'ko');
    console.log(`  Duration: ${result1.duration}ms`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
  
  console.log('\nSecond translation (cache hit expected):');
  try {
    const result2 = await monitor.translate(cacheTestText, 'ko');
    console.log(`  Duration: ${result2.duration}ms`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
  
  // Print final stats
  monitor.printStats();
  
  console.log('\n💡 Performance Tips:');
  console.log('  - DeepL provides best quality but may be slower');
  console.log('  - OpenAI GPT-4 is good for context-aware translation');
  console.log('  - Google Translate is fastest but lower quality');
  console.log('  - Cached translations should be <100ms');
  console.log('  - Configure API keys for best results\n');
}

// Run performance test
runPerformanceTest().catch(console.error);
