## 算法面试心得

关于算法面试，实在是没什么太好的捷径，如果想面试外企或者对算法要求比较高的企业，老老实实刷Leetcode就得了。

对于怎么刷Leetcode，在这里给一些建议：

- 分类刷题，比如动态规划、双指针、二叉树这些。刷多了你就会发现，同一个类型的题，解题套路和编码步骤都是类似的。
- 尽量少刷难度为Hard的题，对于前端来说，面试中碰到Hard的算法题概率还是很低的，刷难度高的题一是收益不大，二是可能会打击你的信心。
- 对于非计算机专业或者算法基础薄弱的同学，有空闲时间最好找一些课程系统地学习数据结构和算法，不然直接刷题会面临很多挑战。
- 保持耐心别着急，贵在坚持，一周哪怕就刷两道题，只要消化了就好。
- 实际上绝大多数企业包括大厂，其实对前端的算法能力要求并不会太高，一本《剑指Offer》足矣。

## 快排
最常见的基础算法，很多面试一上来就让写个快排，所以必须掌握。

思路：把一个数组分成两个子数组来递归地解决问题，选择一个基准值，然后将小于等于基准值的元素移到数组左侧，将大于基准值的元素移到数组右侧，再对左右两个子数组递归进行排序，最终得到一个有序的数组。

``` javascript
function quickSort(arr) {
  if (arr.length <= 1) {  // 如果数组长度小于等于1，直接返回
    return arr;
  }
  const pivotIndex = Math.floor(arr.length / 2);  // 选择基准值
  const pivot = arr.splice(pivotIndex, 1)[0];  // 将基准值从数组中删除，并保存基准值
  const left = [], right = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < pivot) {  // 将小于基准值的元素放入左子数组
      left.push(arr[i]);
    } else {  // 将大于等于基准值的元素放入右子数组
      right.push(arr[i]);
    }
  }
  return quickSort(left).concat([pivot], quickSort(right));  // 对左右子数组递归进行排序，最终合并为一个有序数组
}

// 示例
const arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
console.log(quickSort(arr));  // [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
```

## 二分搜索
利用数组有序这一特点，将查找区间不断缩小一半，从而快速地定位目标元素。

``` javascript
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {  // 当查找区间非空时
    const mid = Math.floor((left + right) / 2);  // 计算中间位置
    if (arr[mid] === target) {  // 如果中间位置的元素就是目标元素，直接返回
      return mid;
    } else if (arr[mid] < target) {  // 如果中间位置的元素小于目标元素，将查找区间缩小为右半部分
      left = mid + 1;
    } else {  // 如果中间位置的元素大于目标元素，将查找区间缩小为左半部分
      right = mid - 1;
    }
  }
  return -1;  // 如果没有找到目标元素，返回-1
}

// 示例
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
console.log(binarySearch(arr, 5));  // 4
console.log(binarySearch(arr, 10));  // -1
```

## LRU缓存算法

有缓存的地方就有LRU，比如说Vue的keep-alive就是用的LRU缓存算法实现的。

``` javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;  // 缓存容量
    this.map = new Map();  // 使用Map来存储缓存数据，实现O(1)的查找和删除
  }

  get(key) {
    const value = this.map.get(key);  // 查找缓存数据
    if (value === undefined) {  // 如果数据不存在，返回-1
      return -1;
    } else {  // 如果数据存在，将其从Map中删除并重新插入到Map的最后面
      this.map.delete(key);
      this.map.set(key, value);
      return value;
    }
  }

  put(key, value) {
    if (this.map.has(key)) {  // 如果缓存数据已存在，将其从Map中删除
      this.map.delete(key);
    }
    this.map.set(key, value);  // 插入新的缓存数据到Map的最后面
    if (this.map.size > this.capacity) {  // 如果缓存容量已满，删除最近最少使用的缓存数据
      const oldestKey = this.map.keys().next().value;  // 获取Map中第一个键，即最近最少使用的缓存数据的键
      this.map.delete(oldestKey);
    }
  }
}

// 示例
const cache = new LRUCache(2);  // 初始化容量为2的LRU缓存
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1));  // 1，因为缓存中存在键为1的数据
cache.put(3, 3);  // 缓存容量已满，删除最近最少使用的缓存数据（键为2的数据）
console.log(cache.get(2));  // -1，因为缓存中不存在键为2的数据
cache.put(4, 4);  // 缓存容量已满，删除最近最少使用的缓存数据（键为1的数据）
console.log(cache.get(1));  // -1，因为缓存中不存在键为1的数据
console.log(cache.get(3));  // 3，因为缓存中存在键为3的数据
console.log(cache.get(4));  // 4，因为缓存中存在键为4的数据
```

## 爬楼梯问题
最基础的动态规划题，必须掌握。

``` javascript
function climbStairs(n) {
  if (n <= 2) {  // 当n小于等于2时，有n种不同的爬楼梯方法
    return n;
  }
  let a = 1, b = 2, c;
  for (let i = 3; i <= n; i++) {  // 使用动态规划，计算n步爬楼梯的不同方法数
    c = a + b;
    a = b;
    b = c;
  }
  return c;
}

// 示例
console.log(climbStairs(2));  // 2，因为有两种不同的爬楼梯方法：一次爬1级或者一次爬2级
console.log(climbStairs(3));  // 3，因为有三种不同的爬楼梯方法：一次爬1级、一次爬2级、或者一次爬1级再一次爬2级
console.log(climbStairs(4));  // 5，因为有五种不同的爬楼梯方法：一次爬1级、一次爬2级、一次爬1级再一次爬2级、一次爬2级再一次爬2级、或者一次爬1级再一次爬1级再一次爬2级
```

## 斐波那契数列

类似于爬楼梯问题，用动态规划。

``` javascript
function fibonacci(n) {
  if (n === 0 || n === 1) {  // 当n等于0或1时，返回n
    return n;
  }
  let a = 0, b = 1, c;
  for (let i = 2; i <= n; i++) {  // 使用动态规划，计算斐波那契数列的第n项
    c = a + b;
    a = b;
    b = c;
  }
  return c;
}

// 示例
console.log(fibonacci(0));  // 0
console.log(fibonacci(1));  // 1
console.log(fibonacci(2));  // 1
console.log(fibonacci(3));  // 2
console.log(fibonacci(4));  // 3
```

## 遍历二叉树

定义二叉树节点：

``` javascript
// 定义二叉树节点
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}
```

前序遍历：

``` javascript
// 前序遍历
function preorderTraversal(root) {
  const res = [];  // 用于存储遍历结果
  function preorder(root) {
    if (!root) {
      return;
    }
    res.push(root.val);
    preorder(root.left);
    preorder(root.right);
  }
  preorder(root);
  return res;
}
// 示例
const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);

console.log(preorderTraversal(root));  // [1, 2, 4, 5, 3]
```

中序遍历：

``` javascript
// 中序遍历
function inorderTraversal(root) {
  const res = [];  // 用于存储遍历结果
  function inorder(root) {
    if (!root) {
      return;
    }
    inorder(root.left);
    res.push(root.val);
    inorder(root.right);
  }
  inorder(root);
  return res;
}

// 示例
const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);

console.log(inorderTraversal(root));   // [4, 2, 5, 1, 3]
```

后序遍历：

``` javascript
// 后序遍历
function postorderTraversal(root) {
  const res = [];  // 用于存储遍历结果
  function postorder(root) {
    if (!root) {
      return;
    }
    postorder(root.left);
    postorder(root.right);
    res.push(root.val);
  }
  postorder(root);
  return res;
}

// 示例
const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);

console.log(postorderTraversal(root)); // [4, 5, 2, 3, 1]
```