/**
 * 进度记录服务
 */
const api = require('./api.js');

function fetchEntriesByTask(taskId) {
  return api.select('progress_entries', {
    select: '*', eq: { task_id: taskId },
    order: 'timestamp', ascending: true
  });
}

function fetchAllEntries() {
  return api.select('progress_entries', {
    select: '*', order: 'timestamp', ascending: false, limit: 200
  });
}

function addEntry(taskId, progress, note, username) {
  var entryId = require('../utils/id.js').uuid();
  var now = require('../utils/date.js').toISOString();
  return api.insert('progress_entries', {
    id: entryId, task_id: taskId, timestamp: now,
    progress: progress, note: note, username: username
  }).then(function() {
    return { id: entryId, taskId: taskId, timestamp: now, progress: progress, note: note, username: username };
  });
}

function deleteEntry(entryId) {
  return api.remove('progress_entries', { eq: { id: entryId } });
}

module.exports = { fetchEntriesByTask, fetchAllEntries, addEntry, deleteEntry };
