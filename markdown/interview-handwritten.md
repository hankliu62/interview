## 笔试题
### 怎么看待笔试题
从我个人对面试的看法来说，我是很不喜欢面试的时候手写代码的，尤其是像Promise这样的代码。因为它并不能完全反应出应聘者的真实前端技术水平，并且这种记忆复杂代码的工作，在项目开发中也并不会发挥多大作用。

所以如果是我招聘前端小伙伴的话，我多半是不会出笔试题的。

当然我也能理解为什么很多公司的基础面试会考手写Promise，原因可能有以下几点：

- 节省时间，手写代码能淘汰掉一大批没有基础的应聘者。
- 虽然不能保证上限，但却可以确保下限。
- 对于应届生来说，没有项目经验，只能出这类题了。
- 智力筛选，能手写出Promise的同学，智力和记忆力应该不会太差。
- 招认真准备的应聘者，能手写出Promise的一定是经过了一定时间的面试准备。

### 笔试题该怎么准备
- 使用ChatGPT：虽然ChatGPT取代程序员的工作短期来看可能性不大，但是用它来刷手写题真的很节省时间。
- 持续更新各种面试手写题以及参考答案，隔一段时间来看看即可。
- 尽量把每一个手写题在实际中的应用给讲一讲，比如像深拷贝、LRU、EventEmitter这些，当你知道它的应用之后，可能就更容易理解和记忆了。

## 手写防抖函数
``` javascript
function debounce(func, delay) {
  let timerId;
  return function(...args) {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  }
}
```

## 手写节流函数

``` javascript
function throttle(func, delay) {
  let lastTime = 0;
  return function(...args) {
    const currentTime = Date.now();
    if (currentTime - lastTime >= delay) {
      func.apply(this, args);
      lastTime = currentTime;
    }
  }
}
```

## EventEmitter发布订阅模式
EventEmitter是一个常考题，用途很广泛，可以用于前端组件通信，用于Nodejs异步编程，另外它就是个发布订阅模式。

``` javascript
class EventEmitter {
  constructor() {
    this.events = {}; // 用一个对象来保存事件和订阅者
  }

  // 添加事件
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  // 触发事件
  emit(event, ...args) {
    const listeners = this.events[event] || [];
    listeners.forEach((listener) => listener(...args));
  }

  // 移除事件
  off(event, listener) {
    const listeners = this.events[event] || [];
    const index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }
}
```

EventEmitter包含三个核心方法：

1. on(event, listener)：用于添加事件和订阅者。接收两个参数，event表示事件名称，listener表示订阅者的回调函数。

2. emit(event, ...args)：用于触发事件。接收一个事件名称和任意数量的参数。当事件被触发时，所有订阅该事件的回调函数将被调用，并将参数传递给它们。

3. off(event, listener)：用于移除事件和订阅者。接收两个参数，event表示事件名称，listener表示要移除的订阅者的回调函数。

调用示例：

``` javascript
const emitter = new EventEmitter();

// 添加订阅者
emitter.on('hello', (name) => {
  console.log(`Hello, ${name}!`);
});

// 触发事件
emitter.emit('hello', 'Tom'); // 输出：Hello, Tom!
```

## 手写Promise
要实现一个符合 Promise/A+ 规范的 Promise，需要注意以下几个要点：

1. 状态转移：Promise 可以处于三种状态之一，分别是“pending”（等待状态）、“fulfilled”（已完成状态）和“rejected”（已拒绝状态）。当 Promise 转移到已完成或已拒绝状态时，需要保证状态不可逆转。

2. 异步处理：Promise 可以处理异步操作，例如使用定时器或者在事件回调中执行异步代码。需要确保在异步操作完成之后，Promise 状态可以正确地转移。

3. 链式调用：Promise 支持链式调用，也就是说每次调用 then() 方法后，都会返回一个新的 Promise。在 Promise 链中，每个 Promise 的状态都会受到前一个 Promise 的影响，因此需要保证每个 Promise 都能正确处理自己的状态。

4. 错误处理：当 Promise 被拒绝时，可以通过 catch() 方法或在 then() 方法中传入第二个参数来处理错误。需要保证错误能够正确地冒泡，并且能够捕获到所有可能出现的错误。

5. 静态方法：Promise 还有一些静态方法，例如 Promise.all()、Promise.race()、Promise.resolve() 和 Promise.reject() 等。这些方法与实例方法有所不同，需要额外注意实现。

6. 链式调用的值传递：在链式调用中，每个 then() 方法可以返回一个值或一个新的 Promise。如果返回一个值，后续的 then() 方法应该接收到这个值。如果返回一个新的 Promise，后续的 then() 方法应该等待这个 Promise 完成，并接收到它的结果。

``` javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = null;
    this.reason = null;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.onResolvedCallbacks.forEach(callback => callback(value));
      }
    }

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(callback => callback(reason));
      }
    }

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

    const promise = new MyPromise((resolve, reject) => {
      const handle = (callback, state) => {
        try {
          const result = callback(this.value);
          if (result instanceof MyPromise) {
            result.then(resolve, reject);
          } else {
            state(result);
          }
        } catch (error) {
          reject(error);
        }
      }

      if (this.state === 'fulfilled') {
        setTimeout(() => handle(onResolved, resolve), 0);
      } else if (this.state === 'rejected') {
        setTimeout(() => handle(onRejected, reject), 0);
      } else {
        this.onResolvedCallbacks.push(() => handle(onResolved, resolve));
        this.onRejectedCallbacks.push(() => handle(onRejected, reject));
      }
    });

    return promise;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let count = 0;

      const handleResult = (index, value) => {
        results[index] = value;
        count++;
        if (count === promises.length) {
          resolve(results);
        }
      }

      for (let i = 0; i < promises.length; i++) {
        promises[i].then(value => handleResult(i, value), reject);
      }
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i].then(resolve, reject);
      }
    });
  }
}
```

## 手写LRU缓存算法

``` javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## 手写apply

``` javascript
Function.prototype.myApply = function(context, argsArray) {
  context = context || window;
  context.fn = this;
  let result;
  if (argsArray) {
    result = context.fn(...argsArray);
  } else {
    result = context.fn();
  }
  delete context.fn;
  return result;
}
```

## 手写bind
``` javascript
Function.prototype.myBind = function (context, ...args) {
  const fn = this;
  return function (...args2) {
    return fn.apply(context, [...args, ...args2]);
  };
};
```

## 手写call
``` javascript
Function.prototype.myCall = function (context, ...args) {
  const fn = Symbol("fn");
  context = context || window;
  context[fn] = this;
  const result = context[fn](...args);
  delete context[fn];
  return result;
};
```

## 手写Object.create
``` javascript
function createObject(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
}
```

创建一个空的函数F，然后将proto设置为F的原型，最后返回一个新的F实例。这个新实例的原型链就指向了proto。

## 手写instanceof方法
``` javascript
function myInstanceOf(obj, constructor) {
  // 首先判断参数是否合法
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  // 获取对象的原型
  let proto = Object.getPrototypeOf(obj);

  // 遍历原型链
  while (proto !== null) {
    if (proto === constructor.prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}
```

首先判断传入的 obj 是否是一个对象，如果不是则返回 false。接着获取对象的原型，然后遍历整个原型链。如果在原型链中找到了 `constructor.prototype`，则返回 true，否则返回 false。

## 手写new操作符
``` javascript
function myNew(constructor, ...args) {
  // 创建一个新对象，它的原型指向构造函数的原型对象
  const obj = Object.create(constructor.prototype);

  // 执行构造函数，并将 this 指向新对象
  const result = constructor.apply(obj, args);

  // 如果构造函数返回一个对象，则返回这个对象，否则返回新对象
  return result instanceof Object ? result : obj;
}
```
我们首先使用 `Object.create` 方法创建一个新对象，它的原型指向构造函数的原型对象。接着执行构造函数，并将 this 指向新对象。如果构造函数返回一个对象，则返回这个对象，否则返回新对象。

## 函数柯里化
``` javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function(...moreArgs) {
        return curried.apply(this, args.concat(moreArgs));
      };
    }
  };
}
```

我们定义了一个 curry 函数，它接受一个函数 fn 作为参数，并返回一个新函数。这个新函数接受任意个数的参数，并通过递归的方式将这些参数拆分成一系列嵌套的函数，最终返回一个新函数，执行原函数 fn。

## 手写Ajax
``` javascript
function ajax(method, url, data, successCallback, errorCallback) {
  // 创建 XMLHttpRequest 对象
  const xhr = new XMLHttpRequest();

  // 监听 readyState 变化事件
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // 请求成功，执行成功回调函数
        successCallback(xhr.responseText);
      } else {
        // 请求失败，执行错误回调函数
        errorCallback(xhr.status);
      }
    }
  };

  // 初始化请求
  xhr.open(method, url, true);

  // 设置请求头
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  // 发送请求
  xhr.send(data);
}
```

1. 定义一个 ajax 函数，它接受五个参数：请求方法（method）、请求地址（url）、请求数据（data）、成功回调函数（successCallback）和错误回调函数（errorCallback）。

2. 创建一个 XMLHttpRequest 对象，并设置它的 readyState 变化事件的回调函数。在回调函数中，判断 readyState 是否为 4，以及状态码是否为 200。如果是，则执行成功回调函数，并将响应文本作为参数传入；否则，执行错误回调函数，并将状态码作为参数传入。

3. 接着，调用 open 方法初始化请求，并调用 setRequestHeader 方法设置请求头。最后，我们调用 send 方法发送请求，并将请求数据作为参数传入。

## 数组去重

1. 使用Set去重

``` javascript
function uniqueBySet(arr) {
  return [...new Set(arr)];
}
```

2. 使用Array.reduce()方法去重
``` javascript
function uniqueByReduce(arr) {
  return arr.reduce((acc, cur) => {
    if (!acc.includes(cur)) {
      acc.push(cur);
    }
    return acc;
  }, []);
}
```

3. filter去重
``` javascript
function unique(arr) {
  return arr.filter((item, index, array) => {
    return array.indexOf(item) === index;
  });
}
```

## 数组扁平化
JS 数组扁平化是将一个多维数组变成一维数组的操作，可以使用多种方法来实现，以下是其中一种手写实现：

``` javascript
function flatten(arr) {
  return arr.reduce((prev, curr) => {
    return prev.concat(Array.isArray(curr) ? flatten(curr) : curr);
  }, []);
}
```

使用数组的 reduce 方法来递归地将多维数组扁平化。对于每个元素，如果它是一个数组，则递归调用 flatten 函数将其扁平化；否则，将其直接加入结果数组中。最终，我们将所有结果数组拼接起来，得到一个一维数组。

## 循环打印红黄绿
``` javascript
function printTrafficLight() {
  const colors = ['红灯', '黄灯', '绿灯'];
  let index = 0;
  setInterval(() => {
    console.log(colors[index]);
    index = (index + 1) % colors.length;
  }, 1000);
}

printTrafficLight();
```

我们首先定义了一个包含三种颜色的数组 colors，以及一个变量 index，用于表示当前应该输出哪种颜色。然后，我们使用 setInterval 方法每隔 1 秒输出一种颜色，并将 index 增加 1，以便下次输出下一个颜色。由于我们需要循环输出颜色，当 index 增加到 3 时，我们使用模运算将其重置为 0，从而重新开始循环输出。

## 手写继承
一般只需要实现组合寄生继承的形式就可以了,它通过借用构造函数来继承父类的属性，通过原型链来继承父类的方法，并使用寄生方式来修复原型链：

``` javascript
function inheritPrototype(subType, superType) {
  const prototype = Object.create(superType.prototype);
  prototype.constructor = subType;
  subType.prototype = prototype;
}

function Animal(name) {
  this.name = name;
  this.colors = ['white', 'black'];
}

Animal.prototype.eat = function() {
  console.log(this.name + ' is eating.');
};

function Dog(name) {
  Animal.call(this, name);
  this.type = 'dog';
}

inheritPrototype(Dog, Animal);

Dog.prototype.bark = function() {
  console.log(this.name + ' is barking.');
};

const dog = new Dog('Snoopy');
dog.eat(); // 输出 "Snoopy is eating."
dog.bark(); // 输出 "Snoopy is barking."
```