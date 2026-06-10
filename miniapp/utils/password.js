/**
 * 密码哈希工具
 * 使用 js-sha256 替代 Web Crypto API
 * 输出格式与原 Web 版完全一致：btoa(String.fromCharCode(...SHA-256字节数组))
 */

const sha256 = require('../libs/sha256.js');

/**
 * 对密码进行 SHA-256 哈希
 * @param {string} password - 明文密码
 * @returns {string} base64 编码的哈希值（与 Web Crypto API 版本输出一致）
 */
function hashPassword(password) {
  // js-sha256 输出 hex 字符串
  const hex = sha256(password);

  // hex → 字节数组 → btoa（模拟 Web Crypto API 的输出格式）
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }

  // 小程序没有 btoa，手动实现 base64 编码
  return base64Encode(bytes);
}

/**
 * Base64 编码（兼容小程序环境）
 * @param {number[]} bytes - 字节数组
 * @returns {string} base64 字符串
 */
function base64Encode(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const triplet = (a << 16) | (b << 8) | c;

    result += chars[(triplet >> 18) & 0x3F];
    result += chars[(triplet >> 12) & 0x3F];
    result += i + 1 < bytes.length ? chars[(triplet >> 6) & 0x3F] : '=';
    result += i + 2 < bytes.length ? chars[triplet & 0x3F] : '=';
  }

  return result;
}

module.exports = {
  hashPassword
};
