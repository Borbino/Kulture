/**
 * [설명] 이미지 최적화 및 WebP 자동 변환 시스템
 * [일시] 2025-11-26 (KST)
 * [목적] 이미지 로딩 속도 50% 향상, 대역폭 절감
 */

import sharp from 'sharp';
import { logger } from './logger.js';

/**
 * 이미지 최적화 옵션
 */
const OPTIMIZATION_PRESETS = {
  thumbnail: {
    width: 150,
    height: 150,
    quality: 80,
    format: 'webp',
  },
  small: {
    width: 400,
    height: 400,
    quality: 85,
    format: 'webp',
  },
  medium: {
    width: 800,
    height: 800,
    quality: 85,
    format: 'webp',
  },
  large: {
    width: 1600,
    height: 1600,
    quality: 90,
    format: 'webp',
  },
  original: {
    quality: 90,
    format: 'webp',
  },
};

/**
 * 이미지 최적화 및 변환
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @param {string} preset - 최적화 프리셋 (thumbnail/small/medium/large/original)
 * @returns {Promise<Buffer>} 최적화된 이미지 버퍼
 */
export async function optimizeImage(imageBuffer, preset = 'medium') {
  try {
    const options = OPTIMIZATION_PRESETS[preset] || OPTIMIZATION_PRESETS.medium;
    
    let pipeline = sharp(imageBuffer);

    // 리사이즈 (원본 제외)
    if (options.width && options.height && preset !== 'original') {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 포맷 변환 및 품질 설정
    if (options.format === 'webp') {
      pipeline = pipeline.webp({ quality: options.quality });
    } else if (options.format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: options.quality });
    } else if (options.format === 'png') {
      pipeline = pipeline.png({ quality: options.quality });
    }

    const optimizedBuffer = await pipeline.toBuffer();
    
    // 압축률 로깅
    const compressionRatio = ((1 - optimizedBuffer.length / imageBuffer.length) * 100).toFixed(1);
    logger?.info?.(`Image optimized: ${preset}, ${compressionRatio}% size reduction`);

    return optimizedBuffer;
  } catch (error) {
    logger?.error?.('Image optimization failed:', error);
    throw error;
  }
}

/**
 * 여러 사이즈의 responsive 이미지 생성
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @returns {Promise<Object>} 여러 사이즈의 이미지 버퍼 객체
 */
export async function generateResponsiveImages(imageBuffer) {
  try {
    const [thumbnail, small, medium, large] = await Promise.all([
      optimizeImage(imageBuffer, 'thumbnail'),
      optimizeImage(imageBuffer, 'small'),
      optimizeImage(imageBuffer, 'medium'),
      optimizeImage(imageBuffer, 'large'),
    ]);

    return {
      thumbnail,
      small,
      medium,
      large,
    };
  } catch (error) {
    logger?.error?.('Responsive image generation failed:', error);
    throw error;
  }
}

/**
 * 이미지 메타데이터 추출
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @returns {Promise<Object>} 이미지 메타데이터
 */
export async function getImageMetadata(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    logger?.error?.('Failed to extract image metadata:', error);
    throw error;
  }
}

/**
 * Blur placeholder 생성 (LQIP - Low Quality Image Placeholder)
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @returns {Promise<string>} Base64 인코딩된 blur 이미지
 */
export async function generateBlurPlaceholder(imageBuffer) {
  try {
    const placeholder = await sharp(imageBuffer)
      .resize(20, 20, { fit: 'inside' })
      .blur(10)
      .webp({ quality: 20 })
      .toBuffer();

    return `data:image/webp;base64,${placeholder.toString('base64')}`;
  } catch (error) {
    logger?.error?.('Blur placeholder generation failed:', error);
    // 투명 1x1 픽셀 반환
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }
}

export default {
  optimizeImage,
  generateResponsiveImages,
  getImageMetadata,
  generateBlurPlaceholder,
};
