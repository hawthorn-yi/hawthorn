/**
 * 附件服务
 */
const api = require('./api.js');
const { uuid } = require('../utils/id.js');

function fetchAttachmentsByTask(taskId) {
  return api.select('attachments', { select: '*', eq: { task_id: taskId } });
}

function fetchAllAttachments() {
  return api.select('attachments', { select: '*' });
}

function addAttachment(taskId, name, size, dataUrl) {
  var attId = uuid();
  return api.insert('attachments', {
    id: attId, task_id: taskId, name: name, size: size, data_url: dataUrl
  }).then(function() {
    return { id: attId, name: name, size: size, dataUrl: dataUrl };
  });
}

function removeAttachment(attachmentId) {
  return api.remove('attachments', { eq: { id: attachmentId } });
}

/**
 * 小程序端：选择文件并上传为 base64
 */
function chooseAndUploadFile(taskId) {
  return new Promise(function(resolve, reject) {
    wx.chooseMessageFile({
      count: 1,
      type: 'all',
      success: function(res) {
        var file = res.tempFiles[0];
        if (file.size > 10 * 1024 * 1024) {
          reject(new Error('文件大小不能超过10MB'));
          return;
        }
        var fs = wx.getFileSystemManager();
        var base64 = fs.readFileSync(file.path, 'base64');
        var mimeType = file.type || 'application/octet-stream';
        var dataUrl = 'data:' + mimeType + ';base64,' + base64;

        addAttachment(taskId, file.name, file.size, dataUrl).then(function(att) {
          resolve(att);
        }).catch(reject);
      },
      fail: function() {
        reject(new Error('未选择文件'));
      }
    });
  });
}

/**
 * 小程序端：预览/下载附件
 */
function previewAttachment(attachment) {
  if (!attachment.dataUrl) {
    wx.showToast({ title: '无文件数据', icon: 'none' });
    return;
  }

  var base64Data = attachment.dataUrl;
  var prefix = 'base64,';
  var idx = base64Data.indexOf(prefix);
  if (idx !== -1) {
    base64Data = base64Data.substring(idx + prefix.length);
  }

  var ext = attachment.name.split('.').pop().toLowerCase();
  var filePath = wx.env.USER_DATA_PATH + '/' + attachment.name;

  try {
    var fs = wx.getFileSystemManager();
    fs.writeFileSync(filePath, base64Data, 'base64');

    // 图片预览
    if (['jpg','jpeg','png','gif','bmp','webp'].indexOf(ext) !== -1) {
      wx.previewImage({ urls: [filePath], current: filePath });
    } else {
      // 其他文件用 openDocument 打开
      wx.openDocument({
        filePath: filePath,
        fileType: ext === 'pdf' ? 'pdf' : undefined,
        fail: function() {
          wx.shareFileMessage({ filePath: filePath });
        }
      });
    }
  } catch(e) {
    wx.showToast({ title: '文件打开失败', icon: 'none' });
  }
}

module.exports = {
  fetchAttachmentsByTask, fetchAllAttachments,
  addAttachment, removeAttachment,
  chooseAndUploadFile, previewAttachment
};
