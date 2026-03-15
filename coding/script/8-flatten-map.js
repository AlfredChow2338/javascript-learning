const obj = {
  user: {
    name: "alfred",
    pets: ["dog", "cat"]
  },
  class: {
    school: "cityu",
    year: 4,
    major: {
      bsc: {
        dept: "sdsc"
      }
    }
  }
};

function flattenMap(obj) {
  const res = {}
  const recursion = (ob, key) => {
    if (typeof ob != 'object') {
      return res[key] = ob
    }

    Object.keys(ob).forEach(currKey => {
      let newKey = key.length ? `${key}.${currKey}` : currKey
      recursion(ob[currKey], newKey)
    })

  }

  recursion(obj, '')

  return res
}

console.log(flattenMap(obj))