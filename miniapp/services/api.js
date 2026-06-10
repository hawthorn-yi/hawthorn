/**
 * Supabase REST API 封装
 * 用 wx.request 替代 @supabase/supabase-js 客户端
 */
const { REST_URL, SUPABASE_ANON_KEY } = require('../config/supabase.js');

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

/**
 * 构建查询参数字符串
 * @param {Object} params - 查询参数
 * @param {string} params.select - 选择字段，如 '*' 或 'id,name'
 * @param {Object} params.eq - 等值过滤，如 { status: 'active' }
 * @param {Object} params.neq - 不等过滤
 * @param {Object} params.in - IN 过滤，如 { id: ['a','b'] } → id=in.(a,b)
 * @param {Object} params.gt/lt/gte/lte - 范围过滤
 * @param {Object} params.like - LIKE 过滤
 * @param {Object} params.ilike - ILIKE 过滤（不区分大小写）
 * @param {string} params.order - 排序字段
 * @param {boolean} params.ascending - 是否升序
 * @param {number} params.limit - 限制数量
 * @param {number} params.offset - 偏移量
 * @param {string} params.foreignTable - 外键表名
 * @param {boolean} params.nullsFirst - null 排在前面
 */
function buildQuery(params) {
  if (!params) return '';

  const parts = [];

  // select
  if (params.select) {
    parts.push('select=' + encodeURIComponent(params.select));
  }

  // 等值过滤
  const filterOps = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike'];
  filterOps.forEach(op => {
    if (params[op]) {
      Object.keys(params[op]).forEach(key => {
        let val = params[op][key];
        if (Array.isArray(val)) {
          val = '(' + val.join(',') + ')';
        }
        parts.push(key + '=' + op + '.' + encodeURIComponent(val));
      });
    }
  });

  // in 过滤（特殊处理）
  if (params.in) {
    Object.keys(params.in).forEach(key => {
      const vals = params.in[key];
      parts.push(key + '=in.(' + vals.map(v => encodeURIComponent(v)).join(',') + ')');
    });
  }

  // 排序
  if (params.order) {
    const dir = params.ascending === false ? 'desc' : 'asc';
    let orderStr = params.order + '.' + dir;
    if (params.nullsFirst) {
      orderStr += '.nullsfirst';
    } else if (params.nullsFirst === false) {
      orderStr += '.nullslast';
    }
    parts.push('order=' + orderStr);
  }

  // 分页
  if (params.limit) {
    parts.push('limit=' + params.limit);
  }
  if (params.offset) {
    parts.push('offset=' + params.offset);
  }

  return parts.join('&');
}

/**
 * 发起 HTTP 请求
 */
function request(method, table, params, data) {
  return new Promise((resolve, reject) => {
    let url = REST_URL + '/' + table;
    const queryStr = buildQuery(params);
    if (queryStr) url += '?' + queryStr;

    const header = { ...HEADERS };
    // UPSERT 时添加冲突处理
    if (method === 'POST' && params && params.onConflict) {
      header['Prefer'] = 'return=representation,resolution=merge-duplicates';
      delete params.onConflict; // 不作为查询参数
    }

    wx.request({
      url: url,
      method: method,
      header: header,
      data: data || {},
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const errMsg = res.data?.message || res.data?.msg || '请求失败 (' + res.statusCode + ')';
          reject(new Error(errMsg));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

/**
 * 查询记录
 * @param {string} table - 表名
 * @param {Object} params - 查询参数
 * @returns {Promise<Array>}
 */
function select(table, params) {
  return request('GET', table, params);
}

/**
 * 查询单条记录
 * @param {string} table - 表名
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
function single(table, params) {
  params = params || {};
  params.limit = 1;
  return select(table, params).then(data => {
    if (!data || data.length === 0) {
      throw new Error('未找到记录');
    }
    return data[0];
  });
}

/**
 * 插入记录
 * @param {string} table - 表名
 * @param {Object|Array} data - 数据
 * @returns {Promise<Object|Array>}
 */
function insert(table, data) {
  return request('POST', table, null, data);
}

/**
 * 更新记录
 * @param {string} table - 表名
 * @param {Object} params - 过滤条件（必须提供 eq 等过滤条件）
 * @param {Object} data - 更新数据
 * @returns {Promise<Object|Array>}
 */
function update(table, params, data) {
  return request('PATCH', table, params, data);
}

/**
 * 删除记录
 * @param {string} table - 表名
 * @param {Object} params - 过滤条件
 * @returns {Promise<Object|Array>}
 */
function remove(table, params) {
  return request('DELETE', table, params);
}

/**
 * UPSERT 记录
 */
function upsert(table, data, onConflict) {
  const params = { onConflict: onConflict };
  return request('POST', table, params, data);
}

module.exports = {
  select,
  single,
  insert,
  update,
  remove,
  upsert,
  buildQuery,
  request
};
