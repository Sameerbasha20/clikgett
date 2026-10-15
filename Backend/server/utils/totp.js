'use strict';
const crypto = require('crypto');

/**
 * Standard RFC 6238 Time-Based One-Time Password (TOTP)
 * and RFC 4648 Base32 Encoding / Decoding using Node.js built-in crypto.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
}

function base32Decode(base32Str) {
    const cleaned = (base32Str || '').toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = 0;
    let value = 0;
    const output = [];

    for (let i = 0; i < cleaned.length; i++) {
        const val = BASE32_ALPHABET.indexOf(cleaned[i]);
        if (val === -1) {
            continue; // Ignore non-alphabet chars
        }
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }

    return Buffer.from(output);
}

function generateSecret(byteLength = 20) {
    const randomBuffer = crypto.randomBytes(byteLength);
    return base32Encode(randomBuffer);
}

function generateHOTP(secretBuffer, counter) {
    // 8-byte big-endian counter
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigUInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuf);
    const digest = hmac.digest();

    // Dynamic truncation
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24) |
                   ((digest[offset + 1] & 0xff) << 16) |
                   ((digest[offset + 2] & 0xff) << 8) |
                   (digest[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}

function generateTOTP(base32Secret, timeMs = Date.now(), stepSeconds = 30) {
    const secretBuf = base32Decode(base32Secret);
    const counter = Math.floor(timeMs / 1000 / stepSeconds);
    return generateHOTP(secretBuf, counter);
}

function verifyTOTP(token, base32Secret, options = {}) {
    if (!token || !base32Secret) return { valid: false, reason: 'missing_input' };
    const cleanToken = String(token).trim();
    if (!/^\d{6}$/.test(cleanToken)) return { valid: false, reason: 'invalid_format' };

    const window = options.window !== undefined ? options.window : 1; // +/- 1 step (30s)
    const stepSeconds = options.stepSeconds || 30;
    const currentTime = options.timeMs || Date.now();
    const currentCounter = Math.floor(currentTime / 1000 / stepSeconds);
    const secretBuf = base32Decode(base32Secret);

    if (secretBuf.length === 0) {
        return { valid: false, reason: 'invalid_secret' };
    }

    for (let offset = -window; offset <= window; offset++) {
        const testCounter = currentCounter + offset;
        const expectedOTP = generateHOTP(secretBuf, testCounter);
        if (expectedOTP === cleanToken) {
            return {
                valid: true,
                counter: testCounter,
                stepTime: testCounter * stepSeconds * 1000
            };
        }
    }

    return { valid: false, reason: 'code_mismatch' };
}

function generateKeyUri(accountName, issuer, base32Secret) {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${base32Secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

function generateRecoveryCodes(count = 8) {
    const rawCodes = [];
    const hashedCodes = [];

    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars e.g. "A1B2C3D4"
        const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
        rawCodes.push(formatted);
        const hash = crypto.createHash('sha256').update(formatted.replace('-', '')).digest('hex');
        hashedCodes.push(hash);
    }

    return { rawCodes, hashedCodes };
}

function verifyRecoveryCode(candidateCode, hashedCodesArray = []) {
    if (!candidateCode || !Array.isArray(hashedCodesArray)) return { valid: false };
    const cleanCode = candidateCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const candidateHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    const index = hashedCodesArray.indexOf(candidateHash);
    if (index !== -1) {
        // Valid, return remaining hashes without the consumed one
        const updatedHashes = [...hashedCodesArray];
        updatedHashes.splice(index, 1);
        return { valid: true, remainingHashes: updatedHashes };
    }
    return { valid: false };
}

module.exports = {
    generateSecret,
    generateTOTP,
    verifyTOTP,
    generateKeyUri,
    generateRecoveryCodes,
    verifyRecoveryCode
};
