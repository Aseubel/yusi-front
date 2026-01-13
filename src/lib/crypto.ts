/**
 * 客户端加密工具
 * 使用 Web Crypto API 实现 AES-256-GCM 加密
 */

// 密钥派生参数
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * 使用 PBKDF2 从密码派生密钥
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        passwordKey,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * 从 Base64 字符串导入密钥
 */
export async function importKeyFromBase64(keyBase64: string): Promise<CryptoKey> {
    const keyData = base64ToBytes(keyBase64);
    return crypto.subtle.importKey(
        'raw',
        keyData.buffer.slice(keyData.byteOffset, keyData.byteOffset + keyData.byteLength) as ArrayBuffer,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * 生成随机盐值
 */
export function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * 生成随机 IV
 */
function generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * 加密文本
 * 返回格式: base64(iv + ciphertext + tag)
 */
export async function encryptText(plaintext: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = generateIV();
    const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        key,
        encoder.encode(plaintext)
    );

    // 组合 IV 和密文
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return bytesToBase64(combined);
}

/**
 * 解密文本
 */
export async function decryptText(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const combined = base64ToBytes(encryptedBase64);

    // 提取 IV 和密文
    const iv = combined.slice(0, IV_LENGTH);
    const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;
    const ciphertext = combined.slice(IV_LENGTH);
    const ciphertextBuffer = ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength) as ArrayBuffer;

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        key,
        ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * 使用密码加密文本（自动派生密钥）
 * 返回格式: base64(salt + iv + ciphertext)
 */
export async function encryptWithPassword(plaintext: string, password: string): Promise<{ encrypted: string; salt: string }> {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    const encrypted = await encryptText(plaintext, key);

    return {
        encrypted,
        salt: bytesToBase64(salt),
    };
}

/**
 * 使用密码解密文本
 */
export async function decryptWithPassword(encryptedBase64: string, password: string, saltBase64: string): Promise<string> {
    const salt = base64ToBytes(saltBase64);
    const key = await deriveKey(password, salt);
    return decryptText(encryptedBase64, key);
}

// 工具函数
function bytesToBase64(bytes: Uint8Array): string {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// 导出盐值转换函数
export { bytesToBase64, base64ToBytes };
