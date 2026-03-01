// async function async1() {
//   console.log('1');
//   await async2();
//   console.log('2');
// }

// async function async2() {
//   console.log('3');
// }

// console.log('4');
// async1();
// console.log('5');

console.log('start');
const start = Date.now();

setTimeout(() => {
  console.log('timeout:', Date.now() - start);
}, 100);

// 執行耗時操作
for (let i = 0; i < 100000000; i++) {
  // 阻塞主線程
}