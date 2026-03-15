const obj = {
  a: {
    b: {
      c: 1,
      e: new Date()
    }
  },
  d: "string"
}

const deepClone = (obj, map = new WeakMap()) => {
  if (typeof obj !== "object") {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj)
  }

  const clone = {}
  map.set(obj, clone)
  console.log({map})
  for (const key in obj) {
    clone[key] = deepClone(obj[key], map)
  }

  return clone
}

console.log(obj)
console.log(deepClone(obj))