#!/usr/bin/env node
/**
 * generate-app-icons.js — PWA / 앱스토어 아이콘 일괄 생성
 * [사용법] node scripts/generate-app-icons.js
 * [의존성] sharp (이미 package.json에 포함)
 *
 * [요구사항]
 *   - 소스 이미지: public/icons/source.png (1024×1024 이상 PNG 권장)
 *   - 없으면 SVG 기반 기본 아이콘 자동 생성
 *
 * [생성 아이콘]
 *   PWA/Android: 72, 96, 128, 144, 152, 192, 384, 512
 *   Apple Touch Icon: 180
 *   Favicon: 32, 16
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons')
const SOURCE_PATH = path.join(ICONS_DIR, 'source.png')
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'screenshots')

// 생성할 아이콘 크기 목록
const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512]

// 기본 아이콘 SVG (source.png 없을 때 사용)
const DEFAULT_SVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
  <text x="512" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="500" font-weight="900"
    text-anchor="middle" fill="white">K</text>
</svg>`

async function generateIcons() {
  // 디렉토리 생성
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true })
    console.log(`📁 Created: ${ICONS_DIR}`)
  }

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    console.log(`📁 Created: ${SCREENSHOTS_DIR}`)
  }

  // 소스 이미지 준비
  let sourceBuffer
  if (fs.existsSync(SOURCE_PATH)) {
    sourceBuffer = fs.readFileSync(SOURCE_PATH)
    console.log(`✅ Source image: ${SOURCE_PATH}`)
  } else {
    console.log('⚠️  source.png not found, generating default SVG icon...')
    sourceBuffer = Buffer.from(DEFAULT_SVG)
  }

  const source = sharp(sourceBuffer)

  // 아이콘 생성
  let generated = 0
  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`)
    try {
      await source
        .clone()
        .resize(size, size, { fit: 'contain', background: { r: 102, g: 126, b: 234, alpha: 1 } })
        .png()
        .toFile(outputPath)
      generated++
      console.log(`  ✓ icon-${size}x${size}.png`)
    } catch (e) {
      console.warn(`  ✗ icon-${size}x${size}.png — ${e.message}`)
    }
  }

  // favicon.ico용 32x32도 복사
  const favicon32 = path.join(__dirname, '..', 'public', 'favicon-32x32.png')
  const favicon16 = path.join(__dirname, '..', 'public', 'favicon-16x16.png')
  if (fs.existsSync(path.join(ICONS_DIR, 'icon-32x32.png'))) {
    fs.copyFileSync(path.join(ICONS_DIR, 'icon-32x32.png'), favicon32)
    fs.copyFileSync(path.join(ICONS_DIR, 'icon-16x16.png'), favicon16)
    console.log('  ✓ favicon-32x32.png, favicon-16x16.png')
  }

  console.log(`\n✅ Generated ${generated} icons in ${ICONS_DIR}`)
  console.log(`\n📋 Next steps:`)
  console.log(`   1. Replace public/icons/source.png with your actual 1024×1024 app icon`)
  console.log(`   2. Re-run: node scripts/generate-app-icons.js`)
  console.log(`   3. For Android: npx cap add android && npx cap sync`)
  console.log(`   4. For iOS: npx cap add ios && npx cap sync`)
  console.log(`   5. Add screenshots to public/screenshots/ (750×1334 mobile, 1920×1080 desktop)`)
}

generateIcons().catch(console.error)
