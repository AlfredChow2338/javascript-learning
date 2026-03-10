const obj = {
  user: {
    name: "alfred",
    pets: ["dog", "cat"]
  },
  class: {
    school: "cityu",
    major: {
      bsc: {
        dept: "sdsc"
      }
    }
  }
};

function flattenMap(obj, prefix = '', result = {}) {
  // 處理 null 和 undefined
  if (obj == null) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  // 處理數組
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : `${index}`;
      flattenMap(item, key, result);
    });
    return result;
  }
  
  // 處理對象
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      // 空對象
      if (prefix) {
        result[prefix] = {};
      }
      return result;
    }
    
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      // 如果值是對象或數組，遞歸處理
      if (value != null && typeof value === 'object') {
        flattenMap(value, newKey, result);
      } else {
        // 基本類型，直接賦值
        result[newKey] = value;
      }
    });
    
    return result;
  }
  
  // 基本類型
  if (prefix) {
    result[prefix] = obj;
  }
  
  return result;
}

console.log(flattenMap(obj))