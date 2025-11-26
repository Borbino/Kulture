/**
 * Automatic Translation Improvement System
 * Uses AI to automatically improve existing translations
 */

const fs = require('fs').promises;
const path = require('path');
const { translateHighQuality, evaluateTranslationQuality } = require('./highQualityTranslation');

async function improveTranslations(languageCode, options = {}) {
  const {
    minQualityThreshold = 7,
    dryRun = false,
    verbose = true,
  } = options;

  console.log(`\n🚀 Starting translation improvement for: ${languageCode}`);
  console.log(`   Minimum quality threshold: ${minQualityThreshold}/10`);
  console.log(`   Dry run: ${dryRun ? 'Yes' : 'No'}\n`);

  const filePath = path.join(
    process.cwd(),
    'public',
    'locales',
    languageCode,
    'common.json'
  );

  // Read current translations
  let translations;
  try {
    const content = await fs.readFile(filePath, 'utf8');
    translations = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read translation file: ${error.message}`);
    return;
  }

  // Get Korean original for comparison
  const koPath = path.join(process.cwd(), 'public', 'locales', 'ko', 'common.json');
  const koContent = await fs.readFile(koPath, 'utf8');
  const korean = JSON.parse(koContent);

  const improvements = [];
  let improved = 0;
  let skipped = 0;
  let errors = 0;

  // Process each section
  for (const [section, texts] of Object.entries(translations)) {
    if (typeof texts !== 'object') continue;

    console.log(`\n📁 Processing section: ${section}`);

    for (const [key, currentTranslation] of Object.entries(texts)) {
      const original = korean[section]?.[key];
      if (!original) {
        if (verbose) console.log(`   ⏭️  Skipped ${section}.${key} - no Korean original`);
        skipped++;
        continue;
      }

      try {
        // Evaluate current translation
        const evaluation = await evaluateTranslationQuality(
          original,
          currentTranslation,
          languageCode
        );

        if (verbose) {
          console.log(`   📝 ${section}.${key}`);
          console.log(`      Current: "${currentTranslation}"`);
          console.log(`      Quality: ${evaluation.score}/10 - ${evaluation.feedback}`);
        }

        // If quality is below threshold, generate improved translation
        if (evaluation.score < minQualityThreshold) {
          const improved Translation = await translateHighQuality(
            original,
            languageCode,
            'ko',
            {
              context: `Section: ${section}, Key: ${key}`,
              formality: 'default',
              preserveFormatting: true,
            }
          );

          // Evaluate new translation
          const newEvaluation = await evaluateTranslationQuality(
            original,
            improvedTranslation.text,
            languageCode
          );

          if (newEvaluation.score > evaluation.score) {
            improvements.push({
              section,
              key,
              old: currentTranslation,
              new: improvedTranslation.text,
              oldScore: evaluation.score,
              newScore: newEvaluation.score,
              improvement: newEvaluation.score - evaluation.score,
            });

            if (!dryRun) {
              translations[section][key] = improvedTranslation.text;
            }

            if (verbose) {
              console.log(`      ✨ Improved: "${improvedTranslation.text}"`);
              console.log(`      New quality: ${newEvaluation.score}/10 (+${newEvaluation.score - evaluation.score})`);
            }

            improved++;
          } else {
            if (verbose) console.log(`      ➡️  Kept original (no improvement)`);
            skipped++;
          }
        } else {
          if (verbose) console.log(`      ✅ Good quality, keeping as is`);
          skipped++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error processing ${section}.${key}: ${error.message}`);
        errors++;
      }
    }
  }

  // Save improved translations
  if (!dryRun && improved > 0) {
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf8');
    console.log(`\n💾 Saved ${improved} improvements to ${filePath}`);
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   ✨ Improved: ${improved}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  if (improvements.length > 0) {
    console.log(`\n🏆 Top Improvements:`);
    improvements
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5)
      .forEach(imp => {
        console.log(`   ${imp.section}.${imp.key}: ${imp.oldScore} → ${imp.newScore} (+${imp.improvement})`);
      });
  }

  return {
    improved,
    skipped,
    errors,
    improvements,
  };
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const lang = args[0] || 'en';
  const minQuality = parseInt(args[1]) || 7;
  const dryRun = args.includes('--dry-run');

  improveTranslations(lang, {
    minQualityThreshold: minQuality,
    dryRun,
    verbose: true,
  }).catch(console.error);
}

module.exports = { improveTranslations };
