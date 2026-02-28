console.log(topKFrequent([1,1,1,2,2,3], 2)); // [1, 2]
console.log(topKFrequent([1], 1)); // [1]
console.log(topKFrequent([4,1,-1,2,-1,2,3], 2)); // [-1, 2]

function topKFrequent(nums, k) {
  const map = new Map()
  for (const n of nums) {
    map.set(n, (map.get(n) ?? 0) + 1)
  }
  console.log(map.entries())
  const freq = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  return freq.slice(0, k).map(item => item[0])
}