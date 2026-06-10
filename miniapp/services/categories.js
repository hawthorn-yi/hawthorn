/**
 * 分类服务
 */
const api = require('./api.js');
const { uuid } = require('../utils/id.js');

function fetchCategories() {
  return api.select('categories', { select: '*', order: 'created_at', ascending: true });
}

function addCategory(name, color) {
  var id = 'custom-' + uuid();
  return api.insert('categories', { id: id, name: name, color: color }).then(function() {
    return { id: id, name: name, color: color };
  });
}

function updateCategory(categoryId, data) {
  return api.update('categories', { eq: { id: categoryId } }, data);
}

function deleteCategory(categoryId) {
  return api.remove('categories', { eq: { id: categoryId } });
}

module.exports = { fetchCategories, addCategory, updateCategory, deleteCategory };
