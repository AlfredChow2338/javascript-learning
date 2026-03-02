function debounce(func, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

function search(query) {
  console.log('Searching for:', query);
}

const debouncedSearch = debounce(search, 100)

debouncedSearch('r');
debouncedSearch('re');
debouncedSearch('rea');
debouncedSearch('reac');
debouncedSearch('react');