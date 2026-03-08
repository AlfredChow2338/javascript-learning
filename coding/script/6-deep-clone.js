const obj = [{
  a: {
    b: {
      c: 1,
      e: new Date()
    }
  },
  d: "string"
}]

obj[0].self = obj

const deepClone = (obj, map = new WeakMap()) => {
  // primitive data type and null
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (map.has(obj)) {
    return map.get(obj)
  }

  if (obj instanceof Date) {
    return new Date(obj);
  }

  if (Array.isArray(obj)) {
    const clone = {}
    map.set(obj, clone)
    obj.forEach((key, idx) => {
      clone[idx] = deepClone(obj[key], map)
    })
  }

  const clone = {}
  map.set(obj, clone)
  for (const key in obj) {
    clone[key] = deepClone(obj[key], map)
  }

  return clone
}

console.log(obj)
console.log(deepClone(obj))