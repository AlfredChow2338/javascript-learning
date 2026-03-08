function throttle(cb, delay) {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      return cb.apply(this, args)
    }
  }
}

function throttle(cb, delay) {
  let timeoutId = null
  return function(...args) {
    if (!timeoutId) {
      cb.apply(this, args)
      timeoutId = setTimeout(() => {
        timeoutId = null
      }, delay)
    }
  }
}

const log = throttle(() => console.log('throttled'), 100)

log()
log()
log()
log()
log()
setTimeout(() => {
  log()
}, 1000)
setTimeout(() => {
  log()
}, 1000)
setTimeout(() => {
  log()
}, 1000)
setTimeout(() => {
  log()
}, 2000)
setTimeout(() => {
  log()
}, 2000)