/**
 * UUID 生成工具
 * 替代 crypto.randomUUID()
 */

/**
 * 生成 UUID v4
 * @returns {string} 格式如 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
 */
function uuid() {
  // 使用 wx.getRandomValues（基础库 2.28.1+）或 Math.random 兜底
  let randomBytes;
  try {
    if (wx.getRandomValues) {
      const array = new Uint8Array(16);
      wx.getRandomValues(array);
      randomBytes = Array.from(array);
    } else {
      randomBytes = [];
      for (let i = 0; i < 16; i++) {
        randomBytes.push(Math.floor(Math.random() * 256));
      }
    }
  } catch (e) {
    randomBytes = [];
    for (let i = 0; i < 16; i++) {
      randomBytes.push(Math.floor(Math.random() * 256));
    }
  }

  // 设置版本号 (4) 和变体 (8, 9, a, b)
  randomBytes[6] = (randomBytes[6] & 0x0F) | 0x40;
  randomBytes[8] = (randomBytes[8] & 0x3F) | 0x80;

  const hex = randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');

  return hex.substr(0, 8) + '-' + hex.substr(8, 4) + '-' + hex.substr(12, 4) + '-' + hex.substr(16, 4) + '-' + hex.substr(20, 12);
}

module.exports = {
  uuid
};
