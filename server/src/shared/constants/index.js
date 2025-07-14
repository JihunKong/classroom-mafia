"use strict";
// shared/constants/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK_CONFIG = exports.UI_CONFIG = exports.GAME_CONFIG = void 0;
// Re-export all constants for easy importing
__exportStar(require("./roles"), exports);
__exportStar(require("./phases"), exports);
__exportStar(require("./security"), exports);
// Game configuration constants
exports.GAME_CONFIG = {
    MIN_PLAYERS: 6,
    MAX_PLAYERS: 20,
    DEFAULT_ROOM_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_ROOM_INACTIVE_TIME: 10 * 60 * 1000, // 10 minutes
    MAX_PLAYER_NAME_LENGTH: 20,
    MIN_PLAYER_NAME_LENGTH: 2,
    ROOM_CODE_LENGTH: 4,
    ROOM_CODE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
};
// UI Constants
exports.UI_CONFIG = {
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    TOUCH_TARGET_MIN_SIZE: 44, // pixels
    TOAST_DURATION: 5000, // milliseconds
    ANIMATION_DURATION: 300, // milliseconds
};
// Network constants
exports.NETWORK_CONFIG = {
    SOCKET_TIMEOUT: 60000, // 60 seconds
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 2000, // 2 seconds
    PING_INTERVAL: 25000, // 25 seconds
    PING_TIMEOUT: 60000, // 60 seconds
};
