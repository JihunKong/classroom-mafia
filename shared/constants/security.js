// shared/constants/security.ts
import crypto from 'crypto';
// Rate limiting constants
export const RATE_LIMITS = {
    // Connection limits
    MAX_CONNECTIONS_PER_IP: 30,
    CONNECTION_ATTEMPT_WINDOW: 60000, // 1 minute
    MAX_CONNECTION_ATTEMPTS: 50,
    // Action limits
    MAX_ACTIONS_PER_MINUTE: 60,
    MAX_VOTES_PER_PHASE: 5,
    MAX_CHAT_MESSAGES_PER_MINUTE: 30,
    // Room creation limits
    MAX_ROOMS_PER_IP_PER_HOUR: 10,
    ROOM_CREATION_COOLDOWN: 5000, // 5 seconds
};
// Input validation constants
export const VALIDATION = {
    PLAYER_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 20,
        ALLOWED_CHARS: /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s_-]+$/,
        FORBIDDEN_WORDS: [
            '마피아', '시민', '경찰', '의사', '관리자', 'admin', 'system', 'bot',
            '개새끼', '씨발', '병신', '좆', '존나', '염병', '애미', '애비'
        ]
    },
    CHAT_MESSAGE: {
        MAX_LENGTH: 500,
        FORBIDDEN_WORDS: [
            '개새끼', '씨발', '병신', '좆', '존나', '염병', '애미', '애비',
            'fuck', 'shit', 'damn', 'bitch', 'bastard'
        ],
        SPAM_DETECTION: {
            MAX_REPEATED_CHARS: 10,
            MAX_CAPS_PERCENTAGE: 0.7,
            MIN_UNIQUE_CHARS: 3
        }
    },
    ROOM_CODE: {
        LENGTH: 4,
        ALLOWED_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        EXCLUDE_AMBIGUOUS: true, // Exclude O, 0, I, 1, etc.
        CLEAR_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No ambiguous characters
    }
};
// Secure room code generation
export function generateSecureRoomCode() {
    const chars = VALIDATION.ROOM_CODE.CLEAR_CHARS;
    let result = '';
    // Use crypto.randomBytes for cryptographically secure random generation
    const bytes = crypto.randomBytes(VALIDATION.ROOM_CODE.LENGTH);
    for (let i = 0; i < VALIDATION.ROOM_CODE.LENGTH; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}
// Input sanitization functions
export function sanitizePlayerName(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid player name');
    }
    // Trim and normalize
    const trimmed = name.trim();
    // Length validation
    if (trimmed.length < VALIDATION.PLAYER_NAME.MIN_LENGTH ||
        trimmed.length > VALIDATION.PLAYER_NAME.MAX_LENGTH) {
        throw new Error(`Player name must be ${VALIDATION.PLAYER_NAME.MIN_LENGTH}-${VALIDATION.PLAYER_NAME.MAX_LENGTH} characters`);
    }
    // Character validation
    if (!VALIDATION.PLAYER_NAME.ALLOWED_CHARS.test(trimmed)) {
        throw new Error('Player name contains invalid characters');
    }
    // Forbidden words check
    const lowerName = trimmed.toLowerCase();
    for (const word of VALIDATION.PLAYER_NAME.FORBIDDEN_WORDS) {
        if (lowerName.includes(word.toLowerCase())) {
            throw new Error('Player name contains forbidden words');
        }
    }
    return trimmed;
}
export function sanitizeChatMessage(message) {
    if (!message || typeof message !== 'string') {
        throw new Error('Invalid message');
    }
    const trimmed = message.trim();
    // Length validation
    if (trimmed.length === 0) {
        throw new Error('Message cannot be empty');
    }
    if (trimmed.length > VALIDATION.CHAT_MESSAGE.MAX_LENGTH) {
        throw new Error(`Message too long (max ${VALIDATION.CHAT_MESSAGE.MAX_LENGTH} characters)`);
    }
    // Spam detection
    const { MAX_REPEATED_CHARS, MAX_CAPS_PERCENTAGE, MIN_UNIQUE_CHARS } = VALIDATION.CHAT_MESSAGE.SPAM_DETECTION;
    // Check for repeated characters
    let maxRepeated = 0;
    let currentRepeated = 1;
    for (let i = 1; i < trimmed.length; i++) {
        if (trimmed[i] === trimmed[i - 1]) {
            currentRepeated++;
        }
        else {
            maxRepeated = Math.max(maxRepeated, currentRepeated);
            currentRepeated = 1;
        }
    }
    maxRepeated = Math.max(maxRepeated, currentRepeated);
    if (maxRepeated > MAX_REPEATED_CHARS) {
        throw new Error('Message contains too many repeated characters');
    }
    // Check caps percentage
    const alphaChars = trimmed.replace(/[^a-zA-Z]/g, '');
    if (alphaChars.length > 0) {
        const capsCount = trimmed.replace(/[^A-Z]/g, '').length;
        const capsPercentage = capsCount / alphaChars.length;
        if (capsPercentage > MAX_CAPS_PERCENTAGE && alphaChars.length > 5) {
            throw new Error('Message has too many capital letters');
        }
    }
    // Check unique characters
    const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s/g, '')).size;
    if (uniqueChars < MIN_UNIQUE_CHARS && trimmed.length > 10) {
        throw new Error('Message appears to be spam');
    }
    // Forbidden words check
    const lowerMessage = trimmed.toLowerCase();
    for (const word of VALIDATION.CHAT_MESSAGE.FORBIDDEN_WORDS) {
        if (lowerMessage.includes(word.toLowerCase())) {
            // Replace with asterisks instead of throwing error
            const regex = new RegExp(word, 'gi');
            return trimmed.replace(regex, '*'.repeat(word.length));
        }
    }
    return trimmed;
}
// Data validation functions
export function validateRoomCode(code) {
    if (!code || typeof code !== 'string') {
        return false;
    }
    return code.length === VALIDATION.ROOM_CODE.LENGTH &&
        /^[A-Z0-9]+$/.test(code);
}
export function validatePlayerId(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }
    // Should be a valid UUID v4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}
// Security headers and CORS configuration
export const SECURITY_CONFIG = {
    CORS: {
        origin: process.env.NODE_ENV === 'production'
            ? ['https://your-domain.com'] // Replace with actual domain
            : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
        optionsSuccessStatus: 200
    },
    HEADERS: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    },
    SESSION: {
        SECRET: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
        MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
        SECURE: process.env.NODE_ENV === 'production',
        HTTP_ONLY: true,
        SAME_SITE: 'strict'
    }
};
// Anti-cheat and tamper detection
export const ANTI_CHEAT = {
    MAX_ACTION_FREQUENCY: 100, // Max actions per minute
    SUSPICIOUS_PATTERNS: {
        RAPID_VOTING: 10, // votes per second
        IMPOSSIBLE_TIMING: 50, // milliseconds - impossibly fast human reaction
        DUPLICATE_ACTIONS: 5 // same action repeated rapidly
    },
    INTEGRITY_CHECKS: {
        VALIDATE_CLIENT_STATE: true,
        CHECK_ACTION_TIMING: true,
        VERIFY_ROLE_PERMISSIONS: true,
        DETECT_AUTOMATION: true
    }
};
// Logging and monitoring
export const SECURITY_LOGGING = {
    LOG_FAILED_LOGINS: true,
    LOG_SUSPICIOUS_ACTIVITY: true,
    LOG_RATE_LIMIT_VIOLATIONS: true,
    LOG_INVALID_REQUESTS: true,
    ALERT_THRESHOLDS: {
        FAILED_ATTEMPTS_PER_IP: 10,
        SUSPICIOUS_ACTIONS_PER_PLAYER: 5,
        RATE_LIMIT_VIOLATIONS_PER_IP: 20
    }
};
