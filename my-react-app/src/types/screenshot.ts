/**
 * Screenshot Capture Types
 * Types for capturing and sending screenshots with geographical context
 */

export interface ViewportInfo {
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
  /** Map center coordinates [latitude, longitude] */
  mapCenter: [number, number];
  /** Mapbox zoom level (0-22, higher = more zoomed in) */
  mapZoom: number;
  /** Optional geographical bounds of visible area */
  mapBounds?: MapBounds;
}

export interface MapBounds {
  /** Northern latitude boundary */
  north: number;
  /** Southern latitude boundary */
  south: number;
  /** Eastern longitude boundary */
  east: number;
  /** Western longitude boundary */
  west: number;
}

export interface ScreenshotData {
  /** Base64 encoded image data */
  data: string;
  /** Image format */
  format: 'png' | 'jpeg';
  /** ISO timestamp of when screenshot was captured */
  capturedAt: string;
  /** Geographical and viewport information */
  viewportInfo: ViewportInfo;
}

export interface ScreenshotConfig {
  /** Whether screenshot capture is enabled */
  enabled: boolean;
  /** Capture full app vs just map view */
  captureFullApp: boolean;
  /** Image quality (0-1, lower = smaller file) */
  quality: number;
  /** Maximum width to resize to (0 = no resize) */
  maxWidth: number;
  /** Maximum height to resize to (0 = no resize) */
  maxHeight: number;
  /** Include screenshot in every message vs user-triggered only */
  includeInEveryMessage: boolean;
}

export interface ScreenshotCaptureResult {
  /** Whether capture was successful */
  success: boolean;
  /** Screenshot data if successful */
  data?: ScreenshotData;
  /** Error message if failed */
  error?: string;
  /** Performance metrics */
  metrics?: {
    captureTime: number; // milliseconds
    imageSize: number; // bytes
  };
}

export const DEFAULT_SCREENSHOT_CONFIG: ScreenshotConfig = {
  enabled: true,
  captureFullApp: false, // Just map by default
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  includeInEveryMessage: false, // User must trigger
};
