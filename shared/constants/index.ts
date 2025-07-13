// shared/constants/index.ts

// Re-export all constants for easy importing
export * from './roles';
export * from './phases';
export * from './security';

// Game configuration constants
export const GAME_CONFIG = {
  MIN_PLAYERS: 6,
  MAX_PLAYERS: 20,
  DEFAULT_ROOM_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_ROOM_INACTIVE_TIME: 10 * 60 * 1000, // 10 minutes
  MAX_PLAYER_NAME_LENGTH: 20,
  MIN_PLAYER_NAME_LENGTH: 2,
  ROOM_CODE_LENGTH: 4,
  ROOM_CODE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// UI Constants
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  TOUCH_TARGET_MIN_SIZE: 44, // pixels
  TOAST_DURATION: 5000, // milliseconds
  ANIMATION_DURATION: 300, // milliseconds
} as const;

// Network constants
export const NETWORK_CONFIG = {
  SOCKET_TIMEOUT: 60000, // 60 seconds
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000, // 2 seconds
  PING_INTERVAL: 25000, // 25 seconds
  PING_TIMEOUT: 60000, // 60 seconds
} as const;