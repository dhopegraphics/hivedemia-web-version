/**
 * Application Version Constants
 *
 * This file contains all version-related constants used throughout the app.
 * Update only this file when releasing new versions.
 */

export const APP_VERSION = "1.2.1";
export const APP_BUILD_NUMBER = "6";
export const APP_NAME = "Hivedemia";
export const COPYRIGHT_YEAR = new Date().getFullYear();
export const COMPANY_NAME = "Smart Hive Labs";

// Formatted version strings for display
export const VERSION_DISPLAY = `${APP_NAME} v${APP_VERSION}`;
export const COPYRIGHT_TEXT = `© ${COPYRIGHT_YEAR} ${COMPANY_NAME}.`;
export const FULL_COPYRIGHT = `© ${COPYRIGHT_YEAR} ${COMPANY_NAME} Inc. All rights reserved.`;

// Version info object for easy consumption
export const VERSION_INFO = {
  name: APP_NAME,
  version: APP_VERSION,
  buildNumber: APP_BUILD_NUMBER,
  displayVersion: VERSION_DISPLAY,
  copyright: COPYRIGHT_TEXT,
  fullCopyright: FULL_COPYRIGHT,
  year: COPYRIGHT_YEAR,
  company: COMPANY_NAME,
} as const;
