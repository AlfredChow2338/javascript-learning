# useState為什麼不能在if裡面用

### 本質一：Hooks的底層存儲，不是數組，是鏈表

很多人以為hooks存在數組裡，通過索引匹配，這是錯的。

React Fiber架構下，每個function component對應一個fiber節點，Fiber節點上有一個memoizedState屬生，它指向一個鏈表。

為什麼用鏈表不用數組？

數組需要預先知道長度，但hooks數量是動態的，鏈表方便在條件渲染時跳過某些hook (React不允許)，鏈表插入/刪除更靈活。

### 本質二：為什麼不能在if裡面用？鏈表的順序匹配機制

React底層判Hook屬於哪個state，不靠key或名字，只靠調用順序。

mount時（初次渲染）：

- 按順序創建hook節點，串成鏈表。
- 第一個useState -> 鏈表第一個節點
- 第二個useState -> 鏈表第二個節點
- 第三個useState -> 鏈表第三個節點

update時（重新渲染）：

- 按順序遍歷鏈表
- 第一次調用useState -> 取鏈表第一個節點的值
- 第二次調用useState -> 取鏈表第二個節點的值

如果寫在if裡面，condition為false時，useState被跳過，順序錯位，數據全亂！

```js
if (condition) {
  const [name, setName] = useState(""); // 條件不滿足時，這個hook不執行
}

const [age, setAge] = useState(18); // 第二次調用，但鏈表裡對應的是第一個值
```

### 本質三：進階 - 自定義hook為什麼可以？

如果把邏輯抽定custom hook裡，在if裡面調用custom hook，行不行？

不行！自定義hook只是封裝，內部調用的hooks仍然遵循順序規則。

React的eslint插件react-hooks/rule-of-hooks會直接報錯。

什麼場景下可以動態調用？React 19的新特性：use。

use可以在conditional statement中調用，use可以在循環中調用，但它不是hook，是一個新的API，專門處理Promise和Context。

### 總結

底層存儲：每個Fiber節點的memoizedState是一個鏈表，不是數組。

順序匹配：mount時按順序構建鏈表，update時順序遍歷取值。

if / loop會打亂順序，導致取值錯位。

本質原因：React不靠key或名字區分hook，只靠調用順序，順序變了，狀態就亂了。

Hooks的規則不是React故意限制你，而是鏈表數據結構的設計決定的。
