
const prom1 = new Promise((resolve, reject) => resolve('success1'))

Promise.all([prom1])
  .then(res => console.log({res}))


const promiseAll = (promises = []) => {
  return new Promise((resolve, reject) => {
    const result = []
    let count = 0
    promises.forEach((prom, idx) => {
      Promise.resolve(prom)
        .then(res => {
          result[idx] = res
          count ++
          if (count == promises.length) {
            resolve(result)
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  })
}

promiseAll([prom1])
  .then(res => console.log({res}))