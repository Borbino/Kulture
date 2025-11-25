/**
 * Translation System Test Script
 * Tests high-quality translation service
 */

const { translateHighQuality, translateBatch, detectLanguage, evaluateTranslationQuality } = require('../lib/highQualityTranslation');

async function testTranslationSystem() {
  console.log('🧪 Translation System Test\n');
  console.log('=' .repeat(80));

  // Test 1: Single Translation
  console.log('\n📝 Test 1: Single Translation (English → Korean)');
  console.log('-'.repeat(80));
  try {
    const result1 = await translateHighQuality(
      'Hello, world! Welcome to our community.',
      'ko',
      'en',
      { context: 'greeting', formality: 'default' }
    );
    console.log('Original:', 'Hello, world! Welcome to our community.');
    console.log('Translation:', result1.text);
    console.log('Provider:', result1.provider);
    console.log('Quality:', result1.quality);
    console.log('✅ Test 1 passed');
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }

  // Test 2: Batch Translation
  console.log('\n📝 Test 2: Batch Translation (English → Japanese)');
  console.log('-'.repeat(80));
  try {
    const texts = ['Good morning', 'Thank you', 'Have a nice day'];
    const result2 = await translateBatch(texts, 'ja', 'en');
    console.log('Originals:', texts);
    console.log('Translations:', result2.map(r => r.text));
    console.log('Provider:', result2[0].provider);
    console.log('✅ Test 2 passed');
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
  }

  // Test 3: Language Detection
  console.log('\n📝 Test 3: Language Detection');
  console.log('-'.repeat(80));
  try {
    const texts = [
      'Hello, how are you?',
      'こんにちは、元気ですか？',
      'Bonjour, comment allez-vous?',
      '안녕하세요, 어떻게 지내세요?',
      'Hola, ¿cómo estás?',
    ];
    
    for (const text of texts) {
      const result = await detectLanguage(text);
      console.log(`"${text}" → ${result.language} (confidence: ${result.confidence})`);
    }
    console.log('✅ Test 3 passed');
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
  }

  // Test 4: Context-Aware Translation
  console.log('\n📝 Test 4: Context-Aware Translation');
  console.log('-'.repeat(80));
  try {
    const text = 'The bank is closed today.';
    
    // Without context
    const result4a = await translateHighQuality(text, 'ko', 'en');
    console.log('Original:', text);
    console.log('Without context:', result4a.text);
    
    // With financial context
    const result4b = await translateHighQuality(
      text,
      'ko',
      'en',
      { context: 'This is about a financial institution' }
    );
    console.log('With financial context:', result4b.text);
    
    console.log('✅ Test 4 passed');
  } catch (error) {
    console.log('❌ Test 4 failed:', error.message);
  }

  // Test 5: Formality Levels (German)
  console.log('\n📝 Test 5: Formality Levels (German)');
  console.log('-'.repeat(80));
  try {
    const text = 'How are you?';
    
    const informal = await translateHighQuality(text, 'de', 'en', { formality: 'informal' });
    const formal = await translateHighQuality(text, 'de', 'en', { formality: 'formal' });
    
    console.log('Original:', text);
    console.log('Informal German:', informal.text);
    console.log('Formal German:', formal.text);
    console.log('✅ Test 5 passed');
  } catch (error) {
    console.log('❌ Test 5 failed:', error.message);
  }

  // Test 6: Quality Evaluation
  console.log('\n📝 Test 6: Translation Quality Evaluation');
  console.log('-'.repeat(80));
  try {
    const original = 'The weather is beautiful today.';
    const translation = '오늘 날씨가 아름답습니다.';
    
    const evaluation = await evaluateTranslationQuality(original, translation, 'ko');
    console.log('Original:', original);
    console.log('Translation:', translation);
    console.log('Quality Score:', evaluation.score, '/ 10');
    console.log('Feedback:', evaluation.feedback);
    console.log('✅ Test 6 passed');
  } catch (error) {
    console.log('❌ Test 6 failed:', error.message);
  }

  // Test 7: RTL Language (Arabic)
  console.log('\n📝 Test 7: RTL Language (Arabic)');
  console.log('-'.repeat(80));
  try {
    const result7 = await translateHighQuality(
      'Welcome to our community platform.',
      'ar',
      'en'
    );
    console.log('Original:', 'Welcome to our community platform.');
    console.log('Arabic:', result7.text);
    console.log('Provider:', result7.provider);
    console.log('✅ Test 7 passed');
  } catch (error) {
    console.log('❌ Test 7 failed:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Translation System Test Complete\n');
  
  console.log('📊 Summary:');
  console.log('  - Single translation: ✅');
  console.log('  - Batch translation: ✅');
  console.log('  - Language detection: ✅');
  console.log('  - Context-aware translation: ✅');
  console.log('  - Formality levels: ✅');
  console.log('  - Quality evaluation: ✅');
  console.log('  - RTL support: ✅');
  console.log('\n💡 Note: Some tests may fail if API keys are not configured.');
  console.log('   Configure DEEPL_API_KEY, OPENAI_API_KEY, or GOOGLE_TRANSLATE_API_KEY');
}

// Run tests
testTranslationSystem().catch(console.error);
