/**
 * Screenshot Capture Service
 * Captures screenshots with geographical context for AI chat
 */

import html2canvas from 'html2canvas';
import type { Map as MapboxMap } from 'mapbox-gl';
import type {
  ScreenshotData,
  ScreenshotConfig,
  ScreenshotCaptureResult,
  ViewportInfo,
} from '../types/screenshot';
import { DEFAULT_SCREENSHOT_CONFIG } from '../types/screenshot';

// ============================================================================
// DEBUG LOGGING
// ============================================================================

/** Module-wide debug flag - set to true to enable debug logging */
export const DEBUG_SCREENSHOT = true;

const log = {
  debug: (...args: any[]) => {
    if (DEBUG_SCREENSHOT) {
      console.log('[ScreenshotCapture]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (DEBUG_SCREENSHOT) {
      console.info('[ScreenshotCapture]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (DEBUG_SCREENSHOT) {
      console.warn('[ScreenshotCapture]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (DEBUG_SCREENSHOT) {
      console.error('[ScreenshotCapture]', ...args);
    }
  },
  time: (label: string) => {
    if (DEBUG_SCREENSHOT) {
      console.time(`[ScreenshotCapture] ${label}`);
    }
  },
  timeEnd: (label: string) => {
    if (DEBUG_SCREENSHOT) {
      console.timeEnd(`[ScreenshotCapture] ${label}`);
    }
  },
};

// ============================================================================
// VIEWPORT INFO EXTRACTION
// ============================================================================

/**
 * Extract viewport information from Mapbox instance
 */
export function extractViewportInfo(map: MapboxMap): ViewportInfo {
  log.debug('Extracting viewport info from map');
  log.time('extractViewportInfo');

  try {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bounds = map.getBounds();

    if (!bounds) {
      throw new Error('Failed to get map bounds');
    }

    const viewportInfo: ViewportInfo = {
      width: window.innerWidth,
      height: window.innerHeight,
      mapCenter: [center.lat, center.lng],
      mapZoom: zoom,
      mapBounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
    };

    log.debug('Viewport info extracted:', {
      center: `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`,
      zoom: zoom.toFixed(2),
      size: `${viewportInfo.width}x${viewportInfo.height}`,
      bounds: viewportInfo.mapBounds,
    });

    log.timeEnd('extractViewportInfo');
    return viewportInfo;
  } catch (error) {
    log.error('Failed to extract viewport info:', error);
    throw new Error('Failed to extract map viewport information');
  }
}

/**
 * Calculate approximate coverage area in miles based on zoom level
 */
export function calculateCoverageArea(zoom: number, latitude: number): number {
  const earthCircumference = 24901; // miles at equator
  const tilesAtZoom = Math.pow(2, zoom);
  const milesPerTile = earthCircumference / tilesAtZoom;
  const latitudeAdjustment = Math.cos((latitude * Math.PI) / 180);
  const coverage = milesPerTile * latitudeAdjustment;

  log.debug(`Coverage area at zoom ${zoom.toFixed(2)}: ${coverage.toFixed(2)} miles`);
  return coverage;
}

// ============================================================================
// IMAGE CAPTURE & PROCESSING
// ============================================================================

/**
 * Capture screenshot of specified element
 */
async function captureElement(
  element: HTMLElement,
  config: ScreenshotConfig
): Promise<string> {
  log.debug('Capturing element:', element.tagName, element.className);
  log.time('html2canvas');

  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      logging: DEBUG_SCREENSHOT,
      scale: 1, // Use device pixel ratio
      backgroundColor: '#ffffff',
    });

    log.timeEnd('html2canvas');
    log.debug('Canvas created:', `${canvas.width}x${canvas.height}`);

    // Resize if needed
    const resizedCanvas = resizeCanvas(canvas, config);

    // Convert to base64
    log.time('toDataURL');
    const format = config.quality < 1 ? 'jpeg' : 'png';
    const mimeType = `image/${format}`;
    const base64 = resizedCanvas.toDataURL(mimeType, config.quality);
    log.timeEnd('toDataURL');

    // Remove data URL prefix to get just the base64 data
    const base64Data = base64.split(',')[1];

    const sizeKB = (base64Data.length * 3) / 4 / 1024;
    log.info(`Screenshot captured: ${format.toUpperCase()}, ${sizeKB.toFixed(2)} KB`);

    return base64Data;
  } catch (error) {
    log.error('Failed to capture element:', error);
    throw new Error('Failed to capture screenshot with html2canvas');
  }
}

/**
 * Resize canvas if it exceeds max dimensions
 */
function resizeCanvas(canvas: HTMLCanvasElement, config: ScreenshotConfig): HTMLCanvasElement {
  const { maxWidth, maxHeight } = config;

  // Skip resize if not configured
  if (maxWidth === 0 && maxHeight === 0) {
    log.debug('No resize needed (max dimensions not set)');
    return canvas;
  }

  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  // Calculate scale factor
  let scale = 1;
  if (maxWidth > 0 && originalWidth > maxWidth) {
    scale = Math.min(scale, maxWidth / originalWidth);
  }
  if (maxHeight > 0 && originalHeight > maxHeight) {
    scale = Math.min(scale, maxHeight / originalHeight);
  }

  // Skip resize if not needed
  if (scale >= 1) {
    log.debug('No resize needed (within max dimensions)');
    return canvas;
  }

  const newWidth = Math.floor(originalWidth * scale);
  const newHeight = Math.floor(originalHeight * scale);

  log.debug(`Resizing canvas: ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}`);
  log.time('resize');

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = newWidth;
  resizedCanvas.height = newHeight;

  const ctx = resizedCanvas.getContext('2d');
  if (!ctx) {
    log.error('Failed to get canvas context for resize');
    return canvas; // Return original if resize fails
  }

  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  log.timeEnd('resize');

  return resizedCanvas;
}

// ============================================================================
// MAIN CAPTURE FUNCTION
// ============================================================================

/**
 * Capture screenshot with geographical context
 *
 * @param map - Mapbox GL map instance
 * @param config - Screenshot configuration (optional, uses defaults)
 * @param elementId - ID of element to capture (defaults to 'app')
 * @returns Screenshot capture result
 */
export async function captureScreenshot(
  map: MapboxMap,
  config: Partial<ScreenshotConfig> = {},
  elementId: string = 'app'
): Promise<ScreenshotCaptureResult> {
  const startTime = performance.now();
  log.info('=== Starting screenshot capture ===');
  log.debug('Config:', config);
  log.debug('Element ID:', elementId);

  // Merge with defaults
  const finalConfig: ScreenshotConfig = {
    ...DEFAULT_SCREENSHOT_CONFIG,
    ...config,
  };

  log.debug('Final config:', finalConfig);

  try {
    // Check if feature is enabled
    if (!finalConfig.enabled) {
      log.warn('Screenshot capture is disabled');
      return {
        success: false,
        error: 'Screenshot capture is disabled',
      };
    }

    // Get element to capture
    const element = document.getElementById(elementId);
    if (!element) {
      log.error(`Element not found: #${elementId}`);
      return {
        success: false,
        error: `Element not found: #${elementId}`,
      };
    }

    log.debug('Element found:', element);

    // Extract viewport info
    log.debug('--- Extracting viewport info ---');
    const viewportInfo = extractViewportInfo(map);
    const coverageArea = calculateCoverageArea(
      viewportInfo.mapZoom,
      viewportInfo.mapCenter[0]
    );
    log.info(
      `Map viewing: ${viewportInfo.mapCenter[0].toFixed(6)}, ${viewportInfo.mapCenter[1].toFixed(6)} ` +
        `at zoom ${viewportInfo.mapZoom.toFixed(2)} (≈${coverageArea.toFixed(2)} miles)`
    );

    // Capture screenshot
    log.debug('--- Capturing screenshot ---');
    const imageData = await captureElement(element, finalConfig);

    // Calculate metrics
    const captureTime = performance.now() - startTime;
    const imageSize = (imageData.length * 3) / 4; // bytes

    log.debug('--- Capture complete ---');
    log.info(`Total time: ${captureTime.toFixed(2)}ms`);
    log.info(`Image size: ${(imageSize / 1024).toFixed(2)} KB`);

    const screenshotData: ScreenshotData = {
      data: imageData,
      format: finalConfig.quality < 1 ? 'jpeg' : 'png',
      capturedAt: new Date().toISOString(),
      viewportInfo,
    };

    log.info('=== Screenshot capture successful ===');

    return {
      success: true,
      data: screenshotData,
      metrics: {
        captureTime,
        imageSize,
      },
    };
  } catch (error) {
    const captureTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log.error('=== Screenshot capture failed ===');
    log.error('Error:', error);
    log.error(`Failed after ${captureTime.toFixed(2)}ms`);

    return {
      success: false,
      error: errorMessage,
      metrics: {
        captureTime,
        imageSize: 0,
      },
    };
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate screenshot data before sending to backend
 */
export function validateScreenshotData(screenshot: ScreenshotData): {
  valid: boolean;
  errors: string[];
} {
  log.debug('Validating screenshot data');
  const errors: string[] = [];

  // Validate base64 data
  if (!screenshot.data || typeof screenshot.data !== 'string') {
    errors.push('Screenshot data is missing or invalid');
  } else if (!screenshot.data.match(/^[A-Za-z0-9+/]+=*$/)) {
    errors.push('Screenshot data is not valid base64');
  }

  // Validate format
  if (!['png', 'jpeg'].includes(screenshot.format)) {
    errors.push('Invalid image format (must be png or jpeg)');
  }

  // Validate timestamp
  if (!screenshot.capturedAt || isNaN(Date.parse(screenshot.capturedAt))) {
    errors.push('Invalid or missing timestamp');
  }

  // Validate viewport info
  const { mapCenter, mapZoom } = screenshot.viewportInfo;

  if (!Array.isArray(mapCenter) || mapCenter.length !== 2) {
    errors.push('Invalid mapCenter (must be [lat, lng])');
  } else {
    const [lat, lng] = mapCenter;
    if (lat < -90 || lat > 90) {
      errors.push(`Invalid latitude: ${lat} (must be between -90 and 90)`);
    }
    if (lng < -180 || lng > 180) {
      errors.push(`Invalid longitude: ${lng} (must be between -180 and 180)`);
    }
  }

  if (mapZoom < 0 || mapZoom > 22) {
    errors.push(`Invalid zoom level: ${mapZoom} (must be between 0 and 22)`);
  }

  // Check size
  const sizeBytes = (screenshot.data.length * 3) / 4;
  const sizeMB = sizeBytes / (1024 * 1024);
  if (sizeMB > 10) {
    errors.push(`Screenshot too large: ${sizeMB.toFixed(2)}MB (max 10MB)`);
  }

  const valid = errors.length === 0;

  if (valid) {
    log.debug('Screenshot data is valid');
  } else {
    log.error('Screenshot validation failed:', errors);
  }

  return { valid, errors };
}
