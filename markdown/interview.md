# 安宁宝典

## 一、Event Loop

Event Loop即事件循环，是指浏览器或者Nodejs解决javascript单线程运行时异步逻辑不会阻塞的一种机制。

Event Loop是一个执行模型，不同的运行环境有不同的实现，浏览器和nodejs基于不同的技术实现自己的event loop。

- 浏览器的Event Loop是在HTML5规范中明确定义。
- Nodejs的Event Loop是libuv实现的。
- libuv已经对Event Loop作出了实现，HTML5规范中只是定义的浏览器中Event Loop的模型，具体的实现交给了浏览器厂商。

### 宏队列和微队列

在javascript中，任务被分为两种，一种为宏任务(macrotask)，也称为task，一种为微任务(microtask)，也称为jobs。

宏任务主要包括:

- script全部代码
- setTimeout
- setInterval
- setImmediate (Nodejs独有，浏览器暂时不支持，只有IE10支持)
- requestAnimationFrame (浏览器独有)
- I/O
- UI rendering (浏览器独有)

微任务主要包括:

- process.nextTick (Nodejs独有)
- Promise
- Object.observe (废弃)
- MutationObserver

### 浏览器中的Event Loop

Javascript 有一个主线程 main thread 和 一个调用栈(执行栈) call-stack，所有任务都会被放到调用栈等待主线程的执行。

JS调用栈采用的是后进先出的规则，当函数执行时，会被添加到调用栈的顶部，当执行栈执行完后，就会从栈顶移除，直到栈内被清空。

Javascript单线程任务可以分为同步任务和异步任务，同步任务会在调用栈内按照顺序依次被主线程执行，异步任务会在异步任务有了结果后，将注册的回调函数放入任务队列中等待主线程空闲的时候（调用栈被清空的时候），被读取到调用栈内等待主线程的执行

任务队列 Task Queue, 是先进先出的数据结构。

![浏览器事件循环的进程模型](https://user-images.githubusercontent.com/8088864/124855609-c2904a00-dfdb-11eb-9138-df80150fa3a3.jpg)

浏览器Event Loop的具体流程:

1. 执行全局Javascript的同步代码，可能包含一些同步语句，也可以是异步语句(setTimeout语句不执行回调函数里面的，Promise中.then之前的语句)
2. 全局Javascript执行完毕后，调用栈call-stack会被清空
3. 从微队列microtask queue中取出位于首部的回调函数，放入到调用栈call-stack中执行，执行完毕后从调用栈中删除，microtask queue的长度减1。
4. 继续从微队列microtask queue的队首取出任务，放到调用栈中执行，依次循环往复，直至微任务队列microtask queue中的任务都被调用栈执行完毕。**特别注意，如果在执行微任务microtask过程中，又产生了微任务microtask，新产生的微任务也会追加到微任务队列microtask queue的尾部，新生成的微任务也会在当前周期中被执行完毕。**
5. microtask queue中的任务都被执行完毕后，microtask queue为空队列，调用栈也处于空闲阶段
6. 执行UI rendering
7. 从宏队列macrotask queue的队首取出宏任务，放入调用栈中执行。
8. 执行完后，调用栈为空闲状态
9. 重复 3 - 8 的步骤，直至宏任务队列的任务都被执行完毕。
...

浏览器Event Loop的3个重点:

1. 宏队列macrotask queue每次只从中取出一个任务放到调用栈中执行，执行完后去执行微任务队列中的所有任务
2. 微任务队列中的所有任务都会依次取出来执行，只是微任务队列中的任务清空
3. UI rendering 的执行节点在微任务队列执行完毕后，宏任务队列中取出任务执行之前执行

### NodeJs中的Event Loop

libuv结构

![libuv的事件循环模型](https://user-images.githubusercontent.com/8088864/125010304-d64db600-e098-11eb-824f-de433a12a095.png)

NodeJs中的宏任务队列和微任务队列

NodeJs的Event Loop中，执行宏任务队列的回调有6个阶段

![NodeJS中的宏队列执行回调的6个阶段](https://user-images.githubusercontent.com/8088864/125010342-e9608600-e098-11eb-84e0-70a5bd5f5867.png)

Node的Event Loop可以分为6个阶段，各个阶段执行的任务如下所示:

- `timers`: 执行setTimeout和setInterval中到期的callback。
- `I/O callbacks`: 执行几乎所有的回调，除了close callbacks以及timers调度的回调和setImmediate()调度的回调。
- `idle, prepare`: 仅在内部使用。
- `poll`: 最重要的阶段，检索新的I/O事件，在适当的情况下回阻塞在该阶段。
- `check`: 执行setImmediate的callback(setImmediate()会将事件回调插入到事件队列的尾部，主线程和事件队列的任务执行完毕后会立即执行setImmediate中传入的回调函数)。
- `close callbacks`: 执行`close`事件的callback，例如socket.on('close', fn)或则http.server.on('close', fn)等。

NodeJs中的宏任务队列可以分为下列4个:

  1. Timers Queue
  2. I/O Callbacks Queue
  3. Check Queue
  4. Close Callbacks Queue

在浏览器中只有一个宏任务队列，所有宏任务都会放入到宏任务队列中等待放入执行栈中被主线程执行，NodeJs中有4个宏任务队列，不同类型的宏任务会被放入到不同的宏任务队列中。

NodeJs中的微任务队列可以分为下列2个:

  1. `Next Tick Queue`: 放置process.nextTick(callback)的回调函数
  2. `Other Micro Queue`: 其他microtask，例如Promise等

在浏览器中只有一个微任务队列，所有微任务都会放入到微任务队列中等待放入执行栈中被主线程执行，NodeJs中有2个微任务队列，不同类型的微任务会被放入到不同的微任务队列中。

![NodeJs事件循环](https://user-images.githubusercontent.com/8088864/125030923-71a55200-e0be-11eb-93be-95f1cbc456e3.png)

NodeJs的Event Loop的具体流程:

1. 执行全局Javascript的同步代码，可能包含一些同步语句，也可以是异步语句(setTimeout语句不执行回调函数里面的，Promise中.then之前的语句)。
2. 执行微任务队列中的微任务，先执行Next Tick Queue队列中的所有的所有任务，再执行Other Micro Queue队列中的所有任务。
3. 开始执行宏任务队列中的任务，共6个阶段，从第1个阶段开始执行每个阶段对应宏任务队列中的所有任务，**注意，这里执行的是该阶段宏任务队列中的所有的任务，浏览器Event Loop每次只会中宏任务队列中取出队首的任务执行，执行完后开始执行微任务队列中的任务，NodeJs的Event Loop会执行完该阶段中宏任务队列中的所有任务后，才开始执行微任务队列中的任务，也就是步骤2**。
4. Timers Queue -> 步骤2 -> I/O Callbacks Queue -> 步骤2 -> Check Queue -> 步骤2 -> Close Callback Queue -> 步骤2 -> Timers Queue -> ......

**特别注意:**

- 上述的第三步，当 NodeJs 版本小于11时，NodeJs的Event Loop会执行完该阶段中宏任务队列中的所有任务
- 当 NodeJS 版本大于等于11时，**在timer阶段的setTimeout,setInterval...和在check阶段的setImmediate都在node11里面都修改为一旦执行一个阶段里的一个任务就立刻执行微任务队列**。为了和浏览器更加趋同。

NodeJs的Event Loop的microtask queue和macrotask queue的执行顺序详情

![NodeJS中的微任务队列执行顺序](https://user-images.githubusercontent.com/8088864/125032436-8aaf0280-e0c0-11eb-926a-30be5bf116f9.png)

![NodeJS中的宏任务队列执行顺序](https://user-images.githubusercontent.com/8088864/125032451-8f73b680-e0c0-11eb-8349-d6c5f20bd11a.png)

当setTimeout(fn, 0)和setImmediate(fn)放在同一同步代码中执行时，可能会出现下面两种情况：

1. **第一种情况**: 同步代码执行完后，timer还没到期，setImmediate中注册的回调函数先放入到Check Queue的宏任务队列中，先执行微任务队列，然后开始执行宏任务队列，先从Timers Queue开始，由于在Timer Queue中未发现任何的回调函数，往下阶段走，直到Check Queue中发现setImmediate中注册的回调函数，先执行，然后timer到期，setTimeout注册的回调函数会放入到Timers Queue的宏任务队列中，下一轮后再次执行到Timers Queue阶段时，才会再Timers Queue中发现了setTimeout注册的回调函数，于是执行该timer的回调，所以，**setImmediate(fn)注册的回调函数会早于setTimeout(fn, 0)注册的回调函数执行**。
2. **第二种情况**: 同步代码执行完之前，timer已经到期，setTimeout注册的回调函数会放入到Timers Queue的宏任务队列中，执行同步代码到setImmediate时，将其回调函数注册到Check Queue中，同步代码执行完后，先执行微任务队列，然后开始执行宏任务队列，先从Timers Queue开始，在Timers Queue发现了timer中注册的回调函数，取出执行，往下阶段走，到Check Queue中发现setImmediate中注册的回调函数，又执行，所以这种情况时，**setTimeout(fn, 0)注册的回调函数会早于setImmediate(fn)注册的回调函数执行**。

3. 在同步代码中同时调setTimeout(fn, 0)和setImmediate执行顺序情况是不确定的，但是如果把他们放在一个IO的回调，比如readFile('xx', function () {// ....})回调中，那么IO回调是在I/O Callbacks Queue中，setTimeout到期回调注册到Timers Queue，setImmediate回调注册到Check Queue，I/O Callbacks Queue执行完到Check Queue，Timers Queue得到下个循环周期，所以setImmediate回调这种情况下肯定比setTimeout(fn, 0)回调先执行。

``` js
setImmediate(function A() {
  console.log(1);
  setImmediate(function B(){console.log(2);});
});

setTimeout(function timeout() {
  console.log('TIMEOUT FIRED');
}, 0);

// 执行结果: 会存在下面两种情况
// 第一种情况:
// 1
// TIMEOUT FIRED
// 2

// 第二种情况:
// TIMEOUT FIRED
// 1
// 2
```

注:

- setImmediate中如果又存在setImmediate语句，内部的setImmediate语句注册的回调函数会在下一个`check`阶段来执行，并不在当前的`check`阶段来执行。

poll 阶段详解:

poll 阶段主要又两个功能:

1. 当timers到达指定的时间后，执行指定的timer的回调(Executing scripts for timers whose threshold has elapsed, then)。
2. 处理poll队列的事件(Processing events in the poll queue)。

当进入到poll阶段，并且没有timers被调用的时候，会出现下面的情况:

- 如果poll队列不为空，Event Loop将同步执行poll queue中的任务，直到poll queue队列为空或者执行的callback达到上限。
- 如果poll队列为空，会发生下面的情况:
  - 如果脚本执行过setImmediate代码，Event Loop会结束poll阶段，直接进入check阶段，执行Check Queue中调用setImmediate注册的回调函数。
  - 如果脚本没有执行过setImmediate代码，poll阶段将等待callback被添加到队列中，然后立即执行。

当进入到poll阶段，并且调用了timers的话，会发生下面的情况:

- 一旦poll queue为空，Event Loop会检测Timers Queue中是否存在任务，如果存在任务的话，Event Loop会回到timer阶段并执行Timers Queue中timers注册的回调函数。**执行完后是进入check阶段，还是又重新进入I/O callbacks阶段?**

setTimeout 对比 setImmediate

- setTimeout(fn, 0)在timers阶段执行，并且是在poll阶段进行判断是否达到指定的timer时间才会执行
- setImmediate(fn)在check阶段执行

两者的执行顺序要根据当前的执行环境才能确定：

- 如果两者都在主模块(main module)调用，那么执行先后取决于进程性能，顺序随机
- 如果两者都不在主模块调用，即在一个I/O Circle中调用，那么setImmediate的回调永远先执行，因为会先到Check阶段

setImmediate 对比 process.nextTick

- setImmediate(fn)的回调任务会插入到宏队列Check Queue中
- process.nextTick(fn)的回调任务会插入到微队列Next Tick Queue中
- process.nextTick(fn)调用深度有限制，上限是1000，而setImmediate则没有

## 二、Fetch API使用的常见问题及其解决办法

XMLHttpRequest在发送web请求时需要开发者配置相关请求信息和成功后的回调，尽管开发者只关心请求成功后的业务处理，但是也要配置其他繁琐内容，导致配置和调用比较混乱，也不符合关注分离的原则；fetch的出现正是为了解决XHR存在的这些问题。

**fetch是基于Promise设计的**，让开发者只关注请求成功后的业务逻辑处理，其他的不用关心，相当简单，FetchAPI的优点如下:

- 语法简单，更加语义化
- 基于标准的Promise实现，支持async/await
- 使用isomorphic-fetch可以方便同构

使用fetch来进行项目开发时，也是有一些常见问题的，下面就来说说fetch使用的常见问题。

### Fetch 兼容性问题

fetch是相对较新的技术，当然就会存在浏览器兼容性的问题，借用上面应用文章的一幅图加以说明fetch在各种浏览器的原生支持情况：

![Fetch兼容性](https://user-images.githubusercontent.com/8088864/125045722-e03edb80-e0cf-11eb-9457-f56b13350846.png)

从上图可以看出各个浏览器的低版本都不支持fetch技术。

如何在所有浏览器中通用fetch呢，当然就要考虑fetch的polyfill了。

fetch是基于Promise来实现的，所以在低版本浏览器中Promise可能也未被原生支持，所以还需要Promise的polyfill；大多数情况下，实现fetch的polyfill需要涉及到的：

- promise的polyfill，例如es6-promise、babel-polyfill提供的promise实现。
- fetch的polyfill实现，例如isomorphic-fetch和whatwg-fetch

IE浏览器中IE8/9还比较特殊：IE8它使用的是ES3，而IE9则对ES5部分支持。这种情况下还需要ES5的polyfill es5-shim支持了。

上述有关promise的polyfill实现，需要说明的是：

babel-runtime是不能作为Promise的polyfill的实现的，否则在IE8/9下使用fetch会报Promise未定义。为什么？我想大家猜到了，因为babel-runtime实现的polyfill是局部实现而不是全局实现，fetch底层实现用到Promise就是从全局中去取的，拿不到这报上述错误。

fetch的polyfill实现思路:

首先判断浏览器是否原生支持fetch，否则结合Promise使用XMLHttpRequest的方式来实现；这正是whatwg-fetch的实现思路，而同构应用中使用的isomorphic-fetch，其客户端fetch的实现是直接require("whatwg-fetch")来实现的。

### fetch默认不携带cookie

fetch发送请求默认是不发送cookie的，不管是同域还是跨域；

对于那些需要权限验证的请求就可能无法正常获取数据，可以配置其credentials项，其有3个值：

- omit: 默认值，忽略cookie的发送
- same-origin: 表示cookie只能同域发送，不能跨域发送
- include: cookie既可以同域发送，也可以跨域发送

credentials所表达的含义，其实与XHR2中的withCredentials属性类似，表示请求是否携带cookie；

若要fetch请求携带cookie信息，只需设置一下credentials选项即可，例如fetch(url, {credentials: 'include'});

fetch默认对服务端通过Set-Cookie头设置的cookie也会忽略，若想选择接受来自服务端的cookie信息，也必须要配置credentials选项；

### fetch请求对某些错误http状态不会reject

主要是由fetch返回promise导致的，因为fetch返回的promise在某些错误的http状态下如400、500等不会reject，相反它会被resolve；只有网络错误会导致请求不能完成时，fetch 才会被 reject；所以一般会对fetch请求做一层封装。

``` js
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function parseJSON(response) {
  return response.json();
}

export default function request(url, options = {}) {
  return fetch(url, { credentials: 'include', ...options })
    .then(checkStatus)
    .then(parseJSON)
    .then((data) => data)
    .catch((err) => err);
}
```

### fetch不支持超时timeout处理

fetch不像大多数ajax库那样对请求设置超时timeout，它没有有关请求超时的功能，所以在fetch标准添加超时功能之前，都需要polyfill该特性。

实际上，我们真正需要的是abort()， timeout可以通过timeout+abort方式来实现，起到真正超时丢弃当前的请求。

目前的fetch指导规范中，fetch并不是一个具体实例，而只是一个方法；其返回的promise实例根据Promise指导规范标准是不能abort的，也不能手动改变promise实例的状态，只能由内部来根据请求结果来改变promise的状态。

实现fetch的timeout功能，其思想就是新创建一个可以手动控制promise状态的实例，根据不同情况来对新promise实例进行resolve或者reject，从而达到实现timeout的功能；

根据github上[timeout handling](https://github.com/github/fetch/issues/175)上的讨论，目前可以有两种不同的解决方法：

方法一: 单纯setTimeout方法

``` js
var fetchOrigin = fetch;
window.fetch = function(url, options) {
  return new Promise(function(resolve, reject) {
    var timerId;
    if (options.timeout) {
      timerId = setTimeout(function() {
        reject(new Error('fetch timeout'));
      }, options.timeout);
    }

    fetchOrigin(url, option).then(function(response) {
      timerId && clearTimeout(timerId);
      resolve(response);
    }, function(error) {
      timerId && clearTimeout(timerId);
      reject(error);
    });
  });
}
```

使用这种方式还可模拟XHR的abort方法

``` js
var fetchOrigin = fetch;
window.fetch = function(url, options) {
  return new Promise(function(resolve, reject) {
    var abort = function() {
      reject(new Error('fetch abort'));
    };

    const p = fetchOrigin(url, option).then(resolve, reject);
    p.abort = abort;

    return p;
  });
}
```

方法二: 利用Promise.race方法

Promise.race方法接受一个promise实例数组参数，表示多个promise实例中任何一个最先改变状态，那么race方法返回的promise实例状态就跟着改变

``` js
var fetchOrigin = fetch;
window.fetch = function(url, options) {
  var abortFn = null;
  var timeoutFn = null;

  var timeoutPromise = new Promise(function(resolve, reject) {
    timeoutFn = function () {
      reject(new Error('fetch timeout'));
    }
  });

  var abortPromise = new Promise(function(resolve, reject) {
    abortFn = function () {
      reject(new Error('fetch abort'));
    }
  });

  const fetchPromise = fetchOrigin(url, option);

  if (option.timeout) {
    setTimeout(timeoutFn, option.timeout);
  }

  const promise = Promise.race(
    timeoutPromise,
    abortPromise,
    fetchPromise,
  );

  promise.abort = abortFn;

  return promise;
}
```

对fetch的timeout的上述实现方式补充几点：

- timeout不是请求连接超时的含义，它表示发送请求到接收响应的时间，包括请求的连接、服务器处理及服务器响应回来的时间。
- fetch的timeout即使超时发生了，本次请求也不会被abort丢弃掉，它在后台仍然会发送到服务器端，只是本次请求的响应内容被丢弃而已。

### fetch不支持JSONP

fetch是与服务器端进行异步交互的，而JSONP是外链一个javascript资源，是JSON的一种“使用模式”，可用于解决主流浏览器的跨域数据访问的问题，并不是真正ajax，所以fetch与JSONP没有什么直接关联，当然至少目前是不支持JSONP的。

这里我们把JSONP与fetch关联在一起有点差强人意，fetch只是一个ajax库，我们不可能使fetch支持JSONP；只是我们要实现一个JSONP，只不过这个JSONP的实现要与fetch的实现类似，即基于Promise来实现一个JSONP；而其外在表现给人感觉是fetch支持JSONP一样；

目前比较成熟的开源JSONP实现[fetch-jsonp](https://github.com/camsong/fetch-jsonp)给我们提供了解决方案，想了解可以自行前往。不过再次想唠叨一下其JSONP的实现步骤，因为在本人面试的前端候选人中大部分人对JSONP的实现语焉不详；

使用它非常简单，首先需要用npm安装fetch-jsonp

``` shell
npm install fetch-jsonp --save-dev
```

fetch-jsonp源码如下所示:

``` js
const defaultOptions = {
  timeout: 5000,
  jsonpCallback: 'callback',
  jsonpCallbackFunction: null,
};

function generateCallbackFunction() {
  return `jsonp_${Date.now()}_${Math.ceil(Math.random() * 100000)}`;
}

function clearFunction(functionName) {
  // IE8 throws an exception when you try to delete a property on window
  // http://stackoverflow.com/a/1824228/751089
  try {
    delete window[functionName];
  } catch (e) {
    window[functionName] = undefined;
  }
}

function removeScript(scriptId) {
  const script = document.getElementById(scriptId);
  if (script) {
    document.getElementsByTagName('head')[0].removeChild(script);
  }
}

function fetchJsonp(_url, options = {}) {
  // to avoid param reassign
  let url = _url;
  const timeout = options.timeout || defaultOptions.timeout;
  const jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

  let timeoutId;

  return new Promise((resolve, reject) => {
    const callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
    const scriptId = `${jsonpCallback}_${callbackFunction}`;

    window[callbackFunction] = (response) => {
      resolve({
        ok: true,
        // keep consistent with fetch API
        json: () => Promise.resolve(response),
      });

      if (timeoutId) clearTimeout(timeoutId);

      removeScript(scriptId);

      clearFunction(callbackFunction);
    };

    // Check if the user set their own params, and if not add a ? to start a list of params
    url += (url.indexOf('?') === -1) ? '?' : '&';

    const jsonpScript = document.createElement('script');
    jsonpScript.setAttribute('src', `${url}${jsonpCallback}=${callbackFunction}`);
    if (options.charset) {
      jsonpScript.setAttribute('charset', options.charset);
    }
    jsonpScript.id = scriptId;
    document.getElementsByTagName('head')[0].appendChild(jsonpScript);

    timeoutId = setTimeout(() => {
      reject(new Error(`JSONP request to ${_url} timed out`));

      removeScript(scriptId);

      clearFunction(callbackFunction);

      // 当前超时，请求并没有丢弃，请求完成的时候还是会调用该方法，如果直接干掉，会报错，修改函数体，回调过来时删除从全局上删除该函数
      window[callbackFunction] = () => {
        clearFunction(callbackFunction);
      };
    }, timeout);

    // Caught if got 404/500
    jsonpScript.onerror = () => {
      reject(new Error(`JSONP request to ${_url} failed`));

      clearFunction(callbackFunction);
      removeScript(scriptId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
}

export default fetchJsonp;
```

具体的使用方式:

``` js
fetchJsonp('/users.jsonp', {
  timeout: 3000,
  jsonpCallback: 'custom_callback'
})
.then(function(response) {
  return response.json()
}).catch(function(ex) {
  console.log('parsing failed', ex)
});
```

### fetch不支持progress事件

XHR是原生支持progress事件的，例如下面代码这样：

``` js
var xhr = new XMLHttpRequest();
xhr.open('POST', '/uploads');
xhr.onload = function() {}
xhr.onerror = function() {}
var uploadProgress = function(event) {
  if (event.lengthComputable) {
    var percent = Math.round((event.loaded / event.total) * 100);
    console.log(percent);
  }
};

// 上传的progress事件
xhr.upload.onprogress = uploadProgress;
// 下载的progress事件
xhr.onprogress = uploadProgress;
```

但是fetch是不支持有关progress事件的；不过可喜的是，根据fetch的指导规范标准，其内部设计实现了Request和Response类；其中Response封装一些方法和属性，通过Response实例可以访问这些方法和属性，例如response.json()、response.body等等；

值得关注的地方是，response.body是一个可读字节流对象，其实现了一个getRender()方法，其具体作用是：

getRender()方法用于读取响应的原始字节流，该字节流是可以循环读取的，直至body内容传输完成；

因此，利用到这点可以模拟出fetch的progress。

代码实现如下:

``` js
// fetch() returns a promise that resolves once headers have been received
fetch(url).then(response => {
  // response.body is a readable stream.
  // Calling getReader() gives us exclusive access to the stream's content
  var reader = response.body.getReader();
  var bytesReceived = 0;

  // read() returns a promise that resolves when a value has been received
  reader.read().then(function processResult(result) {
    // Result objects contain two properties:
    // done  - true if the stream has already given you all its data.
    // value - some data. Always undefined when done is true.
    if (result.done) {
      console.log("Fetch complete");
      return;
    }

    // result.value for fetch streams is a Uint8Array
    bytesReceived += result.value.length;
    console.log('Received', bytesReceived, 'bytes of data so far');

    // Read some more, and call this function again
    return reader.read().then(processResult);
  });
});
```

github上也有使用Promise+XHR结合的方式实现类fetch的progress效果(当然这跟fetch完全不搭边）可以参考[这里](https://github.com/github/fetch/issues/89#issuecomment-256610849)，具体代码如下：

``` js
function fetchProgress(url, opts={}, onProgress) {
  return new Promise((resolve, reject)=>{
    var xhr = new XMLHttpRequest();
    xhr.open(opts.method || 'get', url);

    for (var key in opts.headers||{}) {
      xhr.setRequestHeader(key, opts.headers[key]);
    }

    xhr.onload = function(event) {
      resolve(e.target.responseText)
    };

    xhr.onerror = reject;

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = onProgress; // event.loaded / event.total * 100 ; //event.lengthComputable
    }

    xhr.send(opts.body);
  });
}

fetchProgress('/').then(console.log)
```

### fetch跨域问题

既然是ajax库，就不可避免与跨域扯上关系；XHR2是支持跨域请求的，只不过要满足浏览器端支持CORS，服务器通过Access-Control-Allow-Origin来允许指定的源进行跨域，仅此一种方式。

与XHR2一样，fetch也是支持跨域请求的，只不过其跨域请求做法与XHR2一样，需要客户端与服务端支持；另外，fetch还支持一种跨域，不需要服务器支持的形式，具体可以通过其mode的配置项来说明。

fetch的mode配置项有3个值，如下：

- same-origin：该模式是不允许跨域的，它需要遵守同源策略，否则浏览器会返回一个error告知不能跨域；其对应的response type为basic。
- cors: 该模式支持跨域请求，顾名思义它是以CORS的形式跨域；当然该模式也可以同域请求不需要后端额外的CORS支持；其对应的response type为cors。
- no-cors: 该模式用于跨域请求但是服务器不带CORS响应头，也就是服务端不支持CORS；这也是fetch的特殊跨域请求方式；其对应的response type为opaque。

针对跨域请求，cors模式是常见跨域请求实现，但是fetch自带的no-cors跨域请求模式则较为陌生，该模式有一个比较明显的特点：

该模式允许浏览器发送本次跨域请求，但是不能访问响应返回的内容，这也是其response type为opaque不透明的原因。

这与<img \/>发送的请求类似，只是该模式不能访问响应的内容信息；但是它可以被其他APIs进行处理，例如ServiceWorker。另外，该模式返回的response可以在Cache API中被存储起来以便后续的对它的使用，这点对script、css和图片的CDN资源是非常合适的，因为这些资源响应头中都没有CORS头。

总的来说，fetch的跨域请求是使用CORS方式，需要浏览器和服务端的支持。

## 三、原型链和继承

JavaScript是一门面向对象的设计语言，在JS里除了null和undefined，其余一切皆为对象。其中Array/Function/Date/RegExp是Object对象的特殊实例实现，Boolean/Number/String也都有对应的基本包装类型的对象（具有内置的方法）。传统语言是依靠class类来完成面向对象的继承和多态等特性，而JS使用原型链和构造器来实现继承，依靠参数arguments.length来实现多态。并且在ES6里也引入了class关键字来实现类。

### 函数与对象的关系

有时我们会好奇为什么能给一个函数添加属性，函数难道不应该就是一个执行过程的作用域吗？

``` js
var name = 'Hank';
function Person(name) {
    this.name = name;
    this.sayName = function() {
        alert(this.name);
    }
}
Person.age = 10;
console.log(Person.age);    // 10
console.log(Person);
/* 输出函数体：
ƒ Person(name) {
    this.name = name;
}
*/
```

我们能够给函数赋一个属性值，当我们输出这个函数时这个属性却无影无踪了，这到底是怎么回事，这个属性又保存在哪里了呢？

其实，在JS里，函数就是一个对象，这些属性自然就跟对象的属性一样被保存起来，函数名称指向这个对象的存储空间。

函数调用过程没查到资料，个人理解为：这个对象内部拥有一个内部属性[\[function]]保存有该函数体的字符串形式，当使用()来调用的时候，就会实时对其进行动态解析和执行，如同**eval()**一样。

![内存栈和内存堆](https://user-images.githubusercontent.com/8088864/125233637-947b7480-e311-11eb-903e-73397c79b87e.png)

上图是JS的具体内存分配方式，JS中分为值类型和引用类型，值类型的数据大小固定，我们将其分配在栈里，直接保存其数据。而引用类型是对象，会动态的增删属性，大小不固定，我们把它分配到内存堆里，并用一个指针指向这片地址，也就是Person其实保存的是一个指向这片地址的指针。这里的Person对象是个函数实例，所以拥有特殊的内部属性[\[function]]用于调用。同时它也拥有内部属性arguments/this/name，因为不相关，这里我们没有绘出，而展示了我们为其添加的属性age。

### 函数与原型的关系

同时在JS里，我们创建的每一个函数都有一个prototype（原型）属性，这个属性是一个指针，指向一个用于包含该函数所有实例的共享属性和方法的对象。而这个对象同时包含一个指针指向这个这个函数，这个指针就是**constructor**，这个函数也被成为构造函数。这样我们就完成了构造函数和原型对象的双向引用。

而上面的代码实质也就是当我们创建了Person构造函数之后，同步开辟了一片空间创建了一个对象作为Person的原型对象，可以通过Person.prototype来访问这个对象，也可以通过Person.prototype.constructor来访问Person该构造函数。通过构造函数我们可以往实例对象里添加属性，如上面的例子里的name属性和sayName()方法。我们也可以通过prototype来添加原型属性，如：

![函数原型](https://user-images.githubusercontent.com/8088864/125234076-7f531580-e312-11eb-9c55-3d760c70f5e7.png)

要注意属性和原型属性不是同一个东西，也并不保存在同一个空间里：

``` js
Person.age; // 10
Person.prototype.age; // 24
```

### 原型和实例的关系

现在有了构造函数和原型对象，那我们接下来new一个实例出来，这样才能真正体现面向对象编程的思想，也就是**继承**：

``` js
var person1 = new Person('Lee');
var person2 = new Person('Lucy');
```

我们新建了两个实例person1和person2，这些实例的内部都会包含一个指向其构造函数的原型对象的指针（内部属性），这个指针叫[\[Prototype]]，在ES5的标准上没有规定访问这个属性，但是大部分浏览器实现了**__proto__**的属性来访问它，成为了实际的通用属性，于是在ES6的附录里写进了该属性。__proto__前后的双下划线说明其本质上是一个内部属性，而不是对外访问的API，因此官方建议新的代码应当避免使用该属性，转而使用Object.setPrototypeOf()（写操作）、Object.getPrototypeOf()（读操作）、Object.create()（生成操作）代替。

这里的prototype我们称为显示原型，__proto__我们称为隐式原型。

``` js
Object.getPrototypeOf({}) === Object.prototype; // true
```

同时由于现代 JavaScript 引擎优化属性访问所带来的特性的关系，更改对象的 [\[Prototype]]在各个浏览器和 JavaScript 引擎上都是一个很慢的操作。其在更改继承的性能上的影响是微妙而又广泛的，这不仅仅限于 obj.__proto__ = ... 语句上的时间花费，而且可能会延伸到任何代码，那些可以访问任何[[Prototype]]已被更改的对象的代码。如果你关心性能，你应该避免设置一个对象的 [\[Prototype]]。相反，你应该使用 Object.create()来创建带有你想要的[[Prototype]]的新对象。

此时它们的关系是（为了清晰，忽略函数属性的指向，用(function)代指）：

![构造函数实例的原型关系](https://user-images.githubusercontent.com/8088864/125234787-f89f3800-e313-11eb-8f2a-b1e346d904af.png)

在这里我们可以看到两个实例指向了同一个原型对象，而在new的过程中调用了Person()方法，对每个实例分别初始化了name属性和sayName方法，属性值分别被保存，而方法作为引用对象也指向了不同的内存空间。

我们可以用几种方法来验证实例的原型指针到底指向的是不是构造函数的原型对象：

``` js
person1.__proto__ === Person.prototype // true
Person.prototype.isPrototypeOf(person1); // true
Object.getPrototypeOf(person2) === Person.prototype; // true
person1 instanceof Person; // true
```

### 原型链

现在我们访问实例person1的属性和方法了：

``` js
person1.name; // Lee
person1.age; // 24
person1.toString(); // [object Object]
```

想下这个问题，我们的name值来自于person1的属性，那么age值来自于哪？toString( )方法又在哪定义的呢？

这就是我们要说的原型链，原型链是实现继承的主要方法，其思想是利用原型让一个引用类型继承另一个引用类型的属性和方法。如果我们让一个原型对象等于另一个类型的实例，那么该原型对象就会包含一个指向另一个原型的指针，而如果另一个原型对象又是另一个原型的实例，那么上述关系依然成立，层层递进，就构成了实例与原型的链条，这就是原型链的概念。

上面代码的name来自于自身属性，age来自于原型属性，toString( )方法来自于Person原型对象的原型Object。当我们访问一个实例属性的时候，如果没有找到，我们就会继续搜索实例的原型，如果还没有找到，就递归搜索原型链直到原型链末端。我们可以来验证一下原型链的关系：

``` js
Person.prototype.__proto__ === Object.prototype // true
```

同时让我们更加深入的验证一些东西：

``` js
Person.__proto__ === Function.prototype // true
Function.prototype.__proto__ === Object.prototype // true
```

我们会发现Person是Function对象的实例，Function是Object对象的实例，Person原型是Object对象的实例。这证明了我们开篇的观点：JavaScript是一门面向对象的设计语言，在JS里除了null和undefined，其余一切皆为对象。

下面祭出我们的原型链图：

![原型链图](https://user-images.githubusercontent.com/8088864/125235100-7e22e800-e314-11eb-9dd0-bb6d0747ec99.jpg)

根据我们上面讲述的关于prototype/constructor/__proto__的内容，我相信你可以完全看懂这张图的内容。需要注意两点：

  1. 构造函数和对象原型一一对应，他们与实例一起作为三要素构成了三面这幅图。最左侧是实例，中间是构造函数，最右侧是对象原型。
  2. 最最右侧的null告诉我们：Object.prototype.__proto__ = null，也就是Object.prototype是JS中一切对象的根源。其余的对象继承于它，并拥有自己的方法和属性。

### 6种继承方法

#### 第一种: 原型链继承

利用原型链的特点进行继承

``` js
function Super(){
  this.name = 'web前端';
  this.type = ['JS','HTML','CSS'];
}
Super.prototype.sayName=function(){
  return this.name;
}
function Sub(){};
Sub.prototype = new Super();
Sub.prototype.constructor = Sub;
var sub1 = new Sub();
sub1.sayName();
```

优点：

- 可以实现继承。

缺点:

- 子类的原型属性集成了父类实例化对象，所有子类的实例化对象都共享原型对象的属性和方法

``` js
var sub1 = new Son();
var sub2 = new Son();
sub1.type.push('VUE');
console.log(sub1.type); // ['JS','HTML','CSS','VUE']
console.log(sub2.type); // ['JS','HTML','CSS','VUE']
```

- 子类构造函数实例化对象时，无法传递参数给父类

#### 第二种: 构造函数继承

通过构造函数call方法实现继承。

``` js
function Super(){
  this.name = 'web前端';
  this.type = ['JS','HTML','CSS'];

  this.sayName = function() {
    return this.name;
  }
}
function Sub(){
  Super.call(this);
}
var sub1 = new Sub();
sub1.type.push('VUE');
console.log(sub1.type); // ['JS','HTML','CSS','VUE']
var sub2 = new Sub();
console.log(sub2.type); // ['JS','HTML','CSS']
```

优点:

- 实现父类实例化对象的独立性

- 还可以给父类实例化对象添加参数

缺点:

- 方法都在构造函数中定义，每次实例化对象都得创建一遍方法，基本无法实现函数复用

- call方法仅仅调用了父级构造函数的属性及方法，没有办法访问父级构造函数原型对象的属性和方法

#### 第三种: 组合继承

利用原型链继承和构造函数继承的各自优势进行组合使用

``` js

function Super(name){
  this.name = name;
  this.type = ['JS','HTML','CSS'];
}

Super.prototype.sayName=function(){
  return this.name;
}

function Sub(name){
  Super.call(this, name);
}

Sub.prototype = new Super();
sub1 = new Sub('张三');
sub2 = new Sub('李四');
sub1.type.push('VUE');
sub2.type.push('PHP');
console.log(sub1.type); // ['JS','HTML','CSS','VUE']
console.log(sub2.type); // ['JS','HTML','CSS','PHP']
sub1.sayName(); // 张三
sub2.sayName(); // 李四
```

优点:

- 利用原型链继承，实现原型对象方法的继承，允许访问父级构造函数原型对象属性和方法，实现方法复用

- 利用构造函数继承，实现属性的继承，而且可以传递参数

缺点:

- 创建子类实例对象时，无论什么情况下，都会调用两次父级构造函数：一次是在创建子级原型的时候，另一次是在子级构造函数内部(call)

#### 第四种: 原型式继承

创建一个函数，将参数作为一个对象的原型对象。

``` js
function create(obj) {
  function Sub(){};
  Sub.prototype = obj;
  Sub.prototype.constructor = Sub;
  return new Sub();
}

var parent = {
  name: '张三',
  type: ['JS','HTML','CSS'],
};

var sub1 = create(parent);
var sub2 = create(parent);

console.log(sub1.name); // 张三
console.log(sub2.name); // 张三
```

ES5规范化了这个原型继承，新增了Object.create()方法，接收两个参数，第一个为原型对象，第二个为要混合进新对象的属性，格式与Object.defineProperties()相同。

``` js
Object.create(null, {name: {value: 'Greg', enumerable: true}});

// 相当于
var parent = {
  name: '张三',
  type: ['JS','HTML','CSS'],
};

var sub1 = Object.create(parent);
var sub2 = Object.create(parent);

console.log(sub1.name); // 张三
console.log(sub2.name); // 张三
```

优缺点：

- 跟原型链类似

#### 第五种: 寄生继承

在原型式继承的基础上，在函数内部丰富对象

``` js
function create(obj) {
  function Sub() {};
  Sub.prototype = obj;
  Sub.prototype.constructor = Sub;

  return new Sub();
}

function Parasitic(obj) {
  var clone = create(obj);
  clone.sayHi = function() {
    console.log('hi');
  };
  return clone;
}

var parent = {
  name: '张三',
  type: ['JS','HTML','CSS'],
};

var sub1 = Parasitic(parent);
var sub2 = Parasitic(parent);

console.log(sub1.name); // 张三
console.log(sub2.name); // 张三
```

如果使用ES5Object.create来代替create函数的话，可以简化成如下所示:

``` js
function Parasitic(obj) {
  var clone = Object.create(obj);
  clone.sayHi = function() {
    console.log('hi');
  };
  return clone;
}

var parent = {
  name: '张三',
  type: ['JS','HTML','CSS'];
};

var son1 = Parasitic(parent);
var son2 = Parasitic(parent);

console.log(son1.name); // 张三
console.log(son2.name); // 张三
son1.sayHi();
son2.sayHi();
```

优缺点:

- 跟构造函数继承类似，调用一次函数就得创建一遍方法，无法实现函数复用，效率较低

#### 第六种: 寄生组合继承

利用组合继承和寄生继承各自优势

组合继承方法我们已经说了，它的缺点是两次调用父级构造函数，一次是在创建子级原型的时候，另一次是在子级构造函数内部，那么我们只需要优化这个问题就行了，即减少一次调用父级构造函数，正好利用寄生继承的特性，继承父级构造函数的原型来创建子级原型。

``` js
function Super(name) {
  this.name = name;
  this.type = ['JS','HTML','CSS'];
};

Super.prototype.sayName = function () {
  return this.name;
};

function Sub(name, age) {
  Super.call(this, name);
  this.age = age;
}

// 我们封装其继承过程
function inheritPrototype(Sub, Super) {
  // 以该对象为原型创建一个新对象
  var prototype = Object.create(Super.prototype);
  prototype.constructor = Sub;
  Sub.prototype = prototype;
}

inheritPrototype(Sub, Super);

// 必须定义在inheritPrototype方法之后
Sub.prototype.sayAge = function () {
  return this.age;
}

var instance = new Sub('张三', 40);
instance.sayName(); // 张三
instance.sayAge(); // 40
```

这种方式只调用了一次父类构造函数，只在子类上创建一次对象，同时保持原型链，还可以使用instanceof和isPrototypeOf()来判断原型，是我们最理想的继承方式。

#### 第七种: ES6 Class类和extends关键字

ES6引进了class关键字，用于创建类，这里的类是作为**ES5构造函数和原型对象的语法糖**存在的，其功能大部分都可以被ES5实现，不过在语言层面上ES6也提供了部分支持。新的写法不过让对象原型看起来更加清晰，更像面向对象的语法而已。

``` js
//定义类
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ')';
  }
}

var point = new Point(10, 10);
```

我们看到其中的constructor方法就是之前的构造函数，this就是之前的原型对象，toString()就是定义在原型上的方法，只能使用new关键字来新建实例。语法差别在于我们不需要function关键字和逗号分割符。其中，所有的方法都直接定义在原型上，注意所有的方法都不可枚举。类的内部使用严格模式，并且不存在变量提升，其中的this指向类的实例。

new是从构造函数生成实例的命令。ES6 为new命令引入了一个new.target属性，该属性一般用在构造函数之中，返回new命令作用于的那个构造函数。如果构造函数不是通过new命令调用的，new.target会返回undefined，因此这个属性可以用来确定构造函数是怎么调用的。

类存在静态方法，使用static关键字表示，其只能类和继承的子类来进行调用，不能被实例调用，也就是不能被实例继承，所以我们称它为静态方法。类不存在内部方法和内部属性。

``` js
class Foo {
  static classMethod() {
    return 'hello';
  }
}

Foo.classMethod() // 'hello'

var foo = new Foo();
foo.classMethod()
// TypeError: foo.classMethod is not a function
```

类通过extends关键字来实现继承，在继承的子类的构造函数里我们使用super关键字来表示对父类构造函数的引用；在静态方法里，super指向父类；在其它函数体内，super表示对父类原型属性的引用。其中super必须在子类的构造函数体内调用一次，因为我们需要调用时来绑定子类的元素对象，否则会报错。

``` js
class ColorPoint extends Point {
  constructor(x, y, color) {
    super(x, y); // 调用父类的constructor(x, y)
    this.color = color;
  }

  toString() {
    return this.color + ' ' + super.toString(); // 调用父类的toString()
  }
}
```

## 四、前端性能优化

性能优化是把双刃剑，有好的一面也有坏的一面。好的一面就是能提升网站性能，坏的一面就是配置麻烦，或者要遵守的规则太多。并且某些性能优化规则并不适用所有场景，需要谨慎使用。

下面列出来了前端性能的24条建议:

### 1. 减少 HTTP 请求

一个完整的 HTTP 请求需要经历 DNS 查找，TCP 握手，浏览器发出 HTTP 请求，服务器接收请求，服务器处理请求并发回响应，浏览器接收响应等过程。

接下来看一个具体的例子帮助理解 HTTP ：

![http请求瀑布图](https://user-images.githubusercontent.com/8088864/125281253-957bc880-e348-11eb-97bf-464d4531ce8e.png)

这是一个 HTTP 请求，请求的文件大小为 28.4KB。

名词解释：

- Queueing: 在请求队列中的时间。
- Stalled: 从TCP 连接建立完成，到真正可以传输数据之间的时间差，此时间包括代理协商时间。
- Proxy negotiation: 与代理服务器连接进行协商所花费的时间。
- DNS Lookup: 执行DNS查找所花费的时间，页面上的每个不同的域都需要进行DNS查找。
- Initial Connection / Connecting: 建立连接所花费的时间，包括TCP握手，重试和协商SSL。
- SSL: 完成SSL握手所花费的时间。
- Request sent: 发出网络请求所花费的时间，通常为一毫秒的时间。
- Waiting(TFFB): TFFB 是发出页面请求到接收到应答数据第一个字节的时间。
- Content Download: 接收响应数据所花费的时间。

从这个例子可以看出，真正下载数据的时间占比为 13.05 / 204.16 = 6.39%，文件越小，这个比例越小，文件越大，比例就越高。这就是为什么要建议将多个小文件合并为一个大文件，从而减少 HTTP 请求次数的原因。

### 2. 使用 HTTP2

HTTP2 相比 HTTP1.1 有如下几个优点：

#### 解析速度快

服务器解析 HTTP1.1 的请求时，必须不断地读入字节，直到遇到分隔符 CRLF 为止。而解析 HTTP2 的请求就不用这么麻烦，因为 HTTP2 是基于帧的协议，每个帧都有表示帧长度的字段。

#### 多路复用

HTTP1.1 如果要同时发起多个请求，就得建立多个 TCP 连接，因为一个 TCP 连接同时只能处理一个 HTTP1.1 的请求。

在 HTTP2 上，多个请求可以共用一个 TCP 连接，这称为多路复用。同一个请求和响应用一个流来表示，并有唯一的流 ID 来标识。 多个请求和响应在 TCP 连接中可以乱序发送，到达目的地后再通过流 ID 重新组建。

#### 首部压缩

HTTP2 提供了首部压缩功能。

例如有如下两个请求：

```
// 请求1
:authority: unpkg.zhimg.com
:method: GET
:path: /za-js-sdk@2.16.0/dist/zap.js
:scheme: https
accept: */*
accept-encoding: gzip, deflate, br
accept-language: zh-CN,zh;q=0.9
cache-control: no-cache
pragma: no-cache
referer: https://www.zhihu.com/
sec-fetch-dest: script
sec-fetch-mode: no-cors
sec-fetch-site: cross-site
user-agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36

// 请求2
:authority: zz.bdstatic.com
:method: GET
:path: /linksubmit/push.js
:scheme: https
accept: */*
accept-encoding: gzip, deflate, br
accept-language: zh-CN,zh;q=0.9
cache-control: no-cache
pragma: no-cache
referer: https://www.zhihu.com/
sec-fetch-dest: script
sec-fetch-mode: no-cors
sec-fetch-site: cross-site
user-agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36
```

从上面两个请求可以看出来，有很多数据都是重复的。如果可以把相同的首部存储起来，仅发送它们之间不同的部分，就可以节省不少的流量，加快请求的时间。

HTTP/2 在客户端和服务器端使用“首部表”来跟踪和存储之前发送的键－值对，对于相同的数据，不再通过每次请求和响应发送。

下面再来看一个简化的例子，假设客户端按顺序发送如下请求首部：

```
Header1:foo
Header2:bar
Header3:bat
```

当客户端发送请求时，它会根据首部值创建一张表：

| 索引 | 首部名称 | 值 |
| ---- | ---- | ---- |
| 62 | Header1 | foo |
| 63 | Header2 | bar |
| 64 | Header3 | bar |

如果服务器收到了请求，它会照样创建一张表。 当客户端发送下一个请求的时候，如果首部相同，它可以直接发送这样的首部块：

```
62 63 64
```

服务器会查找先前建立的表格，并把这些数字还原成索引对应的完整首部。

#### 优先级

HTTP2 可以对比较紧急的请求设置一个较高的优先级，服务器在收到这样的请求后，可以优先处理。

#### 流量控制

由于一个 TCP 连接流量带宽（根据客户端到服务器的网络带宽而定）是固定的，当有多个请求并发时，一个请求占的流量多，另一个请求占的流量就会少。流量控制可以对不同的流的流量进行精确控制。

#### 服务器推送

HTTP2 新增的一个强大的新功能，就是服务器可以对一个客户端请求发送多个响应。换句话说，除了对最初请求的响应外，服务器还可以额外向客户端推送资源，而无需客户端明确地请求。

例如当浏览器请求一个网站时，除了返回 HTML 页面外，服务器还可以根据 HTML 页面中的资源的 URL，来提前推送资源。

现在有很多网站已经开始使用 HTTP2 了，例如知乎：

![服务器推送](https://user-images.githubusercontent.com/8088864/125283274-d83ea000-e34a-11eb-95d5-7881c4af0403.jpg)

其中 h2 是指 HTTP2 协议，http/1.1 则是指 HTTP1.1 协议。

参考资料：

- [半小时搞懂 HTTP、HTTPS和HTTP2](https://github.com/woai3c/Front-end-articles/blob/master/http-https-http2.md)

### 3. 使用服务端渲染

客户端渲染: 获取 HTML 文件，根据需要下载 JavaScript 文件，运行文件，生成 DOM，再渲染。

服务端渲染：服务端返回 HTML 文件，客户端只需解析 HTML。

- 优点：首屏渲染快，SEO 好。
- 缺点：配置麻烦，增加了服务器的计算压力。

下面我用 Vue SSR 做示例，简单的描述一下 SSR 过程。

#### 客户端渲染过程

1. 访问客户端渲染的网站。
2. 服务器返回一个包含了引入资源语句和 \<div id="app">\</div> 的 HTML 文件。
3. 客户端通过 HTTP 向服务器请求资源，当必要的资源都加载完毕后，执行 new Vue() 开始实例化并渲染页面。

#### 服务端渲染过程

1. 访问服务端渲染的网站。
2. 服务器会查看当前路由组件需要哪些资源文件，然后将这些文件的内容填充到 HTML 文件。如果有 ajax 请求，就会执行它进行数据预取并填充到 HTML 文件里，最后返回这个 HTML 页面。
3. 当客户端接收到这个 HTML 页面时，可以马上就开始渲染页面。与此同时，页面也会加载资源，当必要的资源都加载完毕后，开始执行 new Vue() 开始实例化并接管页面。

从上述两个过程中可以看出，区别就在于第二步。客户端渲染的网站会直接返回 HTML 文件，而服务端渲染的网站则会渲染完页面再返回这个 HTML 文件。

这样做的好处是什么？是更快的内容到达时间 (time-to-content)。

假设你的网站需要加载完 abcd 四个文件才能渲染完毕。并且每个文件大小为 1 M。

这样一算：客户端渲染的网站需要加载 4 个文件和 HTML 文件才能完成首页渲染，总计大小为 4M（忽略 HTML 文件大小）。而服务端渲染的网站只需要加载一个渲染完毕的 HTML 文件就能完成首页渲染，总计大小为已经渲染完毕的 HTML 文件（这种文件不会太大，一般为几百K，我的个人博客网站（SSR）加载的 HTML 文件为 400K）。这就是服务端渲染更快的原因。

参考资料：

- [vue-ssr-demo](https://github.com/woai3c/vue-ssr-demo)
- [Vue.js 服务器端渲染指南](https://ssr.vuejs.org/zh/)

### 4. 静态资源使用 CDN

内容分发网络（CDN）是一组分布在多个不同地理位置的 Web 服务器。我们都知道，当服务器离用户越远时，延迟越高。CDN 就是为了解决这一问题，在多个位置部署服务器，让用户离服务器更近，从而缩短请求时间。

#### CDN 原理

当用户访问一个网站时，如果没有 CDN，过程是这样的：

1. 浏览器要将域名解析为 IP 地址，所以需要向本地 DNS 发出请求。
2. 本地 DNS 依次向根服务器、顶级域名服务器、权限服务器发出请求，得到网站服务器的 IP 地址。
3. 本地 DNS 将 IP 地址发回给浏览器，浏览器向网站服务器 IP 地址发出请求并得到资源。

![没有CDN的资源请求](https://user-images.githubusercontent.com/8088864/125375921-8171ae80-e3bc-11eb-9d66-adb57433b67a.jpg)

如果用户访问的网站部署了 CDN，过程是这样的：

1. 浏览器要将域名解析为 IP 地址，所以需要向本地 DNS 发出请求。
2. 本地 DNS 依次向根服务器、顶级域名服务器、权限服务器发出请求，得到全局负载均衡系统（GSLB）的 IP 地址。
3. 本地 DNS 再向 GSLB 发出请求，GSLB 的主要功能是根据本地 DNS 的 IP 地址判断用户的位置，筛选出距离用户较近的本地负载均衡系统（SLB），并将该 SLB 的 IP 地址作为结果返回给本地 DNS。
4. 本地 DNS 将 SLB 的 IP 地址发回给浏览器，浏览器向 SLB 发出请求。
5. SLB 根据浏览器请求的资源和地址，选出最优的缓存服务器发回给浏览器。
6. 浏览器再根据 SLB 发回的地址重定向到缓存服务器。
7. 如果缓存服务器有浏览器需要的资源，就将资源发回给浏览器。如果没有，就向源服务器请求资源，再发给浏览器并缓存在本地。

![有CDN的资源请求](https://user-images.githubusercontent.com/8088864/125376046-baaa1e80-e3bc-11eb-84ba-c86cd8d63a7f.jpg)

参考资料：

- [CDN是什么？使用CDN有什么优势？](https://www.zhihu.com/question/36514327/answer/193768864)
- [CDN原理简析](https://juejin.cn/post/6844903873518239752)

### 5. 将 CSS 放在文件头部，JavaScript 文件放在底部

所有放在 head 标签里的 CSS 和 JS 文件都会堵塞渲染。如果这些 CSS 和 JS 需要加载和解析很久的话，那么页面就空白了。所以 JS 文件要放在底部，等 HTML 解析完了再加载 JS 文件。

那为什么 CSS 文件还要放在头部呢？

因为先加载 HTML 再加载 CSS，会让用户第一时间看到的页面是没有样式的、“丑陋”的，为了避免这种情况发生，就要将 CSS 文件放在头部了。

另外，JS 文件也不是不可以放在头部，只要给 script 标签加上 defer 属性就可以了，异步下载，延迟执行。

### 6. 使用字体图标 iconfont 代替图片图标

字体图标就是将图标制作成一个字体，使用时就跟字体一样，可以设置属性，例如 font-size、color 等等，非常方便。并且字体图标是矢量图，不会失真。还有一个优点是生成的文件特别小。

#### 压缩字体文件

使用 [fontmin-webpack](https://github.com/patrickhulce/fontmin-webpack) 插件对字体文件进行压缩。

![fontmin-webpack](https://user-images.githubusercontent.com/8088864/125377089-efb77080-e3be-11eb-845b-d8992de47838.png)

参考资料：

- [fontmin-webpack](https://github.com/patrickhulce/fontmin-webpack)
- [Iconfont-阿里巴巴矢量图标库](https://www.iconfont.cn/)

### 7. 善用缓存，不重复加载相同的资源

为了避免用户每次访问网站都得请求文件，我们可以通过添加 Expires 或 max-age 来控制这一行为。Expires 设置了一个时间，只要在这个时间之前，浏览器都不会请求文件，而是直接使用缓存。而 max-age 是一个相对时间，建议使用 max-age 代替 Expires 。

不过这样会产生一个问题，当文件更新了怎么办？怎么通知浏览器重新请求文件？

可以通过更新页面中引用的资源链接地址，让浏览器主动放弃缓存，加载新资源。

具体做法是把资源地址 URL 的修改与文件内容关联起来，也就是说，只有文件内容变化，才会导致相应 URL 的变更，从而实现文件级别的精确缓存控制。什么东西与文件内容相关呢？我们会很自然的联想到利用[数据摘要要算法](https://cloud.tencent.com/developer/article/1584742)对文件求摘要信息，摘要信息与文件内容一一对应，就有了一种可以精确到单个文件粒度的缓存控制依据了。

参考资料：

- [webpack + express 实现文件精确缓存](https://github.com/woai3c/node-blog/blob/master/doc/node-blog7.md)
- [webpack-缓存](https://www.webpackjs.com/guides/caching/)
- [张云龙--大公司里怎样开发和部署前端代码？](https://www.zhihu.com/question/20790576/answer/32602154)

### 8. 压缩文件

压缩文件可以减少文件下载时间，让用户体验性更好。

得益于 webpack 和 node 的发展，现在压缩文件已经非常方便了。

在 webpack 可以使用如下插件进行压缩：

- JavaScript：UglifyPlugin
- CSS ：MiniCssExtractPlugin
- HTML：HtmlWebpackPlugin

其实，我们还可以做得更好。那就是使用 gzip 压缩。可以通过向 HTTP 请求头中的 Accept-Encoding 头添加 gzip 标识来开启这一功能。当然，服务器也得支持这一功能。

gzip 是目前最流行和最有效的压缩方法。举个例子，我用 Vue 开发的项目构建后生成的 app.js 文件大小为 1.4MB，使用 gzip 压缩后只有 573KB，体积减少了将近 60%。

附上 webpack 和 node 配置 gzip 的使用方法。

下载插件

``` shell
npm install compression-webpack-plugin --save-dev
npm install compression
```

webpack 配置

``` js
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins: [new CompressionPlugin()],
}
```

node 配置

``` js
const compression = require('compression')
// 在其他中间件前使用
app.use(compression())
```

### 9. 图片优化

#### (1). 图片延迟加载

在页面中，先不给图片设置路径，只有当图片出现在浏览器的可视区域时，才去加载真正的图片，这就是延迟加载。对于图片很多的网站来说，一次性加载全部图片，会对用户体验造成很大的影响，所以需要使用图片延迟加载。

首先可以将图片这样设置，在页面不可见时图片不会加载：

``` html
<img data-src="https://avatars0.githubusercontent.com/u/22117876?s=460&u=7bd8f32788df6988833da6bd155c3cfbebc68006&v=4">
```

等页面可见时，使用 JS 加载图片：

``` js
const img = document.querySelector('img')
img.src = img.dataset.src
```

这样图片就加载出来了，完整的代码可以看一下参考资料。

参考资料：

- [web 前端图片懒加载实现原理](https://juejin.cn/post/6844903482164510734)

#### (2). 响应式图片

响应式图片的优点是浏览器能够根据屏幕大小自动加载合适的图片。

通过 picture 实现

``` html
<picture>
  <source srcset="banner_w1000.jpg" media="(min-width: 801px)">
  <source srcset="banner_w800.jpg" media="(max-width: 800px)">
  <img src="banner_w800.jpg" alt="">
</picture>
```

通过 @media 实现

``` css
@media (min-width: 769px) {
  .bg {
    background-image: url(bg1080.jpg);
  }
}
@media (max-width: 768px) {
  .bg {
    background-image: url(bg768.jpg);
  }
}
```

#### (3). 调整图片大小

例如，你有一个 1920 * 1080 大小的图片，用缩略图的方式展示给用户，并且当用户鼠标悬停在上面时才展示全图。如果用户从未真正将鼠标悬停在缩略图上，则浪费了下载图片的时间。

所以，我们可以用两张图片来实行优化。一开始，只加载缩略图，当用户悬停在图片上时，才加载大图。还有一种办法，即对大图进行延迟加载，在所有元素都加载完成后手动更改大图的 src 进行下载。

#### (4). 降低图片质量

例如 JPG 格式的图片，100% 的质量和 90% 质量的通常看不出来区别，尤其是用来当背景图的时候。我经常用 PS 切背景图时， 将图片切成 JPG 格式，并且将它压缩到 60% 的质量，基本上看不出来区别。

压缩方法有两种，一是通过 webpack 插件 image-webpack-loader，二是通过在线网站进行压缩。

以下附上 webpack 插件 image-webpack-loader 的用法。

``` shell
npm install --save-dev image-webpack-loader
```

webpack 配置

``` js
{
  test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
  use:[
    {
    loader: 'url-loader',
    options: {
      limit: 10000, /* 图片大小小于1000字节限制时会自动转成 base64 码引用*/
      name: utils.assetsPath('img/[name].[hash:7].[ext]')
      }
    },
    /*对图片进行压缩*/
    {
      loader: 'image-webpack-loader',
      options: {
        bypassOnDebug: true,
      }
    }
  ]
}
```

参考资料：

- [img图片在webpack中使用](https://juejin.cn/post/6844903816081457159)

#### (5). 尽可能利用 CSS3 效果代替图片

有很多图片使用 CSS 效果（渐变、阴影等）就能画出来，这种情况选择 CSS3 效果更好。因为代码大小通常是图片大小的几分之一甚至几十分之一。

#### (6). 使用 webp 格式的图片

WebP 的优势体现在它具有更优的图像数据压缩算法，能带来更小的图片体积，而且拥有肉眼识别无差异的图像质量；同时具备了无损和有损的压缩模式、Alpha 透明以及动画的特性，在 JPEG 和 PNG 上的转化效果都相当优秀、稳定和统一。

参考资料：

- [WebP 相对于 PNG、JPG 有什么优势？](https://www.zhihu.com/question/27201061)

### 10. 通过 webpack 按需加载代码，提取第三库代码，减少 ES6 转为 ES5 的冗余代码

懒加载或者按需加载，是一种很好的优化网页或应用的方式。这种方式实际上是先把你的代码在一些逻辑断点处分离开，然后在一些代码块中完成某些操作后，立即引用或即将引用另外一些新的代码块。这样加快了应用的初始加载速度，减轻了它的总体体积，因为某些代码块可能永远不会被加载。

#### 根据文件内容生成文件名，结合 import 动态引入组件实现按需加载

通过配置 output 的 filename 属性可以实现这个需求。filename 属性的值选项中有一个 [contenthash]，它将根据文件内容创建出唯一 hash。当文件内容发生变化时，[contenthash] 也会发生变化。

``` js
{
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '../dist'),
  },
}
```

#### 提取第三方库

由于引入的第三方库一般都比较稳定，不会经常改变。所以将它们单独提取出来，作为长期缓存是一个更好的选择。 这里需要使用 webpack4 的 splitChunk 插件 cacheGroups 选项。

``` js
optimization: {
  runtimeChunk: {
    name: 'manifest' // 将 webpack 的 runtime 代码拆分为一个单独的 chunk。
  },
  splitChunks: {
    cacheGroups: {
      vendor: {
        name: 'chunk-vendors',
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        chunks: 'initial'
      },
      common: {
        name: 'chunk-common',
        minChunks: 2,
        priority: -20,
        chunks: 'initial',
        reuseExistingChunk: true
      }
    },
  }
},
```

- **test**: 过滤 modules，默认为所有的 modules，可匹配模块路径或 chunk 名字，当匹配到某个 chunk 的名字时，这个 chunk 里面引入的所有 module 都会选中。可以传递的值类型：RegExp、String和Function。
- **priority**: 权重，数字越大表示优先级越高。一个 module 可能会满足多个 cacheGroups 的正则匹配，到底将哪个缓存组应用于这个 module，取决于优先级。
- **reuseExistingChunk**: 表示是否使用已有的 chunk，true 则表示如果当前的 chunk 包含的模块已经被抽取出去了，那么将不会重新生成新的，即几个 chunk 复用被拆分出去的一个 module。
- **minChunks**(默认是1): 在分割之前，这个代码块最小应该被引用的次数（译注：保证代码块复用性，默认配置的策略是不需要多次引用也可以被分割）
- **chunks**(默认是async): initial、async和all。chunks改为all，表示同时对静态加载(initial)和动态加载(async)起作用。
- **name**(打包的chunks的名字): 字符串或者函数(函数可以根据条件自定义名字)

#### 减少 ES6 转为 ES5 的冗余代码

Babel 转化后的代码想要实现和原来代码一样的功能需要借助一些帮助函数，比如

``` js
class Person {}
```

会被转换为：

``` js
"use strict";

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Person = function Person() {
  _classCallCheck(this, Person);
};
```

这里 `_classCallCheck` 就是一个 `helper` 函数，如果在很多文件里都声明了类，那么就会产生很多个这样的 `helper` 函数。

这里的 `@babel/runtime` 包就声明了所有需要用到的帮助函数，而 `@babel/plugin-transform-runtime` 的作用就是将所有需要 `helper` 函数的文件，从 `@babel/runtime`包引进来：

``` js
"use strict";

var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Person = function Person() {
  (0, _classCallCheck3.default)(this, Person);
};
```

这里就没有再编译出 helper 函数 classCallCheck 了，而是直接引用了 @babel/runtime 中的 helpers/classCallCheck。

**安装**

``` shell
npm install --save-dev @babel/plugin-transform-runtime @babel/runtime
```

**使用** 在 .babelrc 文件中

``` json
{
  "plugins": [
    "@babel/plugin-transform-runtime"
  ]
}
```

参考资料：

- [Babel 7.1介绍 transform-runtime polyfill env](https://www.jianshu.com/p/d078b5f3036a)
- [webpack 懒加载](https://webpack.docschina.org/guides/lazy-loading/)
- [Vue 路由懒加载](https://router.vuejs.org/zh/guide/advanced/lazy-loading.html#%E8%B7%AF%E7%94%B1%E6%87%92%E5%8A%A0%E8%BD%BD)
- [webpack 缓存](https://webpack.docschina.org/guides/caching/)
- [一步一步的了解webpack4的splitChunk插件](https://juejin.cn/post/6844903614759043079)

### 11. 减少重绘重排

浏览器渲染过程

1. 解析HTML生成DOM树。
2. 解析CSS生成CSSOM规则树。
3. 将DOM树与CSSOM规则树合并在一起生成渲染树。
4. 遍历渲染树开始布局，计算每个节点的位置大小信息。
5. 将渲染树每个节点绘制到屏幕。

![渲染树生成](https://user-images.githubusercontent.com/8088864/125440124-9cc83d52-c342-4959-af1e-dc67cfe7d312.png)

#### 重排

当改变 DOM 元素位置或大小时，会导致浏览器重新生成渲染树，这个过程叫重排。

#### 重绘

当重新生成渲染树后，就要将渲染树每个节点绘制到屏幕，这个过程叫重绘。不是所有的动作都会导致重排，例如改变字体颜色，只会导致重绘。记住，重排会导致重绘，重绘不会导致重排。

重排和重绘这两个操作都是非常昂贵的，因为 **JavaScript** 引擎线程与 **GUI** 渲染线程是互斥，它们同时只能一个在工作。

什么操作会导致重排？

- 添加或删除可见的 **DOM** 元素
- 元素位置改变
- 元素尺寸改变
- 内容改变
- 浏览器窗口尺寸改变

如何减少重排重绘？

- 用 **JavaScript** 修改样式时，最好不要直接写样式，而是替换 **class** 来改变样式。
- 如果要对 **DOM** 元素执行一系列操作，可以将 **DOM** 元素脱离文档流，修改完成后，再将它带回文档。推荐使用隐藏元素（**display:none**）或文档碎片（**DocumentFragment**），都能很好的实现这个方案。

### 12. 使用事件委托

事件委托利用了事件冒泡，只指定一个事件处理程序，就可以管理某一类型的所有事件。所有用到按钮的事件（多数鼠标事件和键盘事件）都适合采用事件委托技术， 使用事件委托可以节省内存。

``` html
<ul>
  <li>苹果</li>
  <li>香蕉</li>
  <li>凤梨</li>
</ul>
```

``` js
// good
document.querySelector('ul').onclick = (event) => {
  const target = event.target;
  if (target.nodeName === 'LI') {
    console.log(target.innerHTML);
  }
}

// bad
document.querySelectorAll('li').forEach((e) => {
  e.onclick = function() {
    console.log(this.innerHTML);
  }
})
```

### 13. 注意程序的局部性

一个编写良好的计算机程序常常具有良好的局部性，它们倾向于引用最近引用过的数据项附近的数据项，或者最近引用过的数据项本身，这种倾向性，被称为局部性原理。有良好局部性的程序比局部性差的程序运行得更快。

**局部性通常有两种不同的形式：**

- 时间局部性: 在一个具有良好时间局部性的程序中，被引用过一次的内存位置很可能在不远的将来被多次引用。
- 空间局部性: 在一个具有良好空间局部性的程序中，如果一个内存位置被引用了一次，那么程序很可能在不远的将来引用附近的一个内存位置。

时间局部性示例

``` js
function sum(arry) {
  let i, sum = 0;
  let len = arry.length;

  for (i = 0; i < len; i++) {
    sum += arry[i];
  }

  return sum;
}
```

在这个例子中，变量sum在每次循环迭代中被引用一次，因此，对于sum来说，具有良好的时间局部性

空间局部性示例

**具有良好空间局部性的程序**

``` js
// 二维数组
function sum1(arry, rows, cols) {
  let i, j, sum = 0;

  for (i = 0; i < rows; i++) {
    for (j = 0; j < cols; j++) {
      sum += arry[i][j];
    }
  }

  return sum;
}
```

**空间局部性差的程序**

``` js
// 二维数组
function sum2(arry, rows, cols) {
  let i, j, sum = 0;

  for (j = 0; j < cols; j++) {
    for (i = 0; i < rows; i++) {
      sum += arry[i][j];
    }
  }

  return sum;
}
```

看一下上面的两个空间局部性示例，像示例中从每行开始按顺序访问数组每个元素的方式，称为具有步长为1的引用模式。 如果在数组中，每隔k个元素进行访问，就称为步长为k的引用模式。 一般而言，随着步长的增加，空间局部性下降。

这两个例子有什么区别？区别在于第一个示例是按行扫描数组，每扫描完一行再去扫下一行；第二个示例是按列来扫描数组，扫完一行中的一个元素，马上就去扫下一行中的同一列元素。

数组在内存中是按照行顺序来存放的，结果就是逐行扫描数组的示例得到了步长为 1 引用模式，具有良好的空间局部性；而另一个示例步长为 rows，空间局部性极差。

**性能测试**

运行环境：

- cpu: i7-10510U
- 浏览器: 83.0.4103.61

对一个长度为9000的二维数组（子数组长度也为9000）进行10次空间局部性测试，时间（毫秒）取平均值，结果如下：

``` js
function sum2(arry, rows, cols) {
  let i, j, sum = 0;

  for (j = 0; j < cols; j++) {
    for (i = 0; i < rows; i++) {
      sum += arry[i][j];
    }
  }

  return sum;
}

// 二维数组
function sum1(arry, rows, cols) {
  let i, j, sum = 0;

  for (i = 0; i < rows; i++) {
    for (j = 0; j < cols; j++) {
      sum += arry[i][j];
    }
  }

  return sum;
}

var arry = new Array(9000).fill(new Array(9000).fill(1));

let ts = 0;
for (let i = 0; i < 10; i++) {
  const startTime = new Date().valueOf();
  sum1(arry, 9000, 9000);
  ts += (new Date().valueOf() - startTime);
}

console.log('sum1: ' + (ts / 10)); // 81.5ms

let ts2 = 0;
for (let i = 0; i < 10; i++) {
  const startTime = new Date().valueOf();
  sum2(arry, 9000, 9000);
  ts2 += (new Date().valueOf() - startTime);
}

console.log('sum2: ' + (ts2 / 10)); // 167.3ms
```

所用示例为上述两个空间局部性示例

| 步长为1(sum1) | 步长为9000(sum2) |
| ---- | ---- |
| 81.5ms | 167.3ms |

从以上测试结果来看，步长为 1 的数组执行时间比步长为 9000 的数组快了一个数量级。

总结：

- 重复引用相同变量的程序具有良好的时间局部性
- 对于具有步长为 k 的引用模式的程序，步长越小，空间局部性越好；而在内存中以大步长跳来跳去的程序空间局部性会很差

参考资料：

- [深入理解计算机系统](https://book.douban.com/subject/26912767/)

### 14. if-else 对比 switch

当判断条件数量越来越多时，越倾向于使用 switch 而不是 if-else。

``` js
if (color == 'blue') {

} else if (color == 'yellow') {

} else if (color == 'white') {

} else if (color == 'black') {

} else if (color == 'green') {

} else if (color == 'orange') {

} else if (color == 'pink') {

}

switch (color) {
  case 'blue':

    break;
  case 'yellow':

    break;
  case 'white':

    break;
  case 'black':

    break;
  case 'green':

    break;
  case 'orange':

    break;
  case 'pink':

    break;
}
```

像以上这种情况，使用 switch 是最好的。假设 color 的值为 pink，则 if-else 语句要进行 7 次判断，switch 只需要进行一次判断。 从可读性来说，switch 语句也更好。

从使用时机来说，当条件值大于两个的时候，使用 switch 更好。不过 if-else 也有 switch 无法做到的事情，例如有多个判断条件的情况下，无法使用 switch。

### 15. 查找表

当条件语句特别多时，使用 switch 和 if-else 不是最佳的选择，这时不妨试一下查找表。查找表可以使用数组和对象来构建。

``` js
switch (index) {
  case '0':
    return result0;
  case '1':
    return result1;
  case '2':
    return result2;
  case '3':
    return result3;
  case '4':
    return result4;
  case '5':
    return result5;
  case '6':
    return result6;
  case '7':
    return result7;
  case '8':
    return result8;
  case '9':
    return result9;
  case '10':
    return result10;
  case '11':
    return result11;
}
```

可以将这个 switch 语句转换为查找表

``` js
const results = [result0,result1,result2,result3,result4,result5,result6,result7,result8,result9,result10,result11];

return results[index];
```

如果条件语句不是数值而是字符串，可以用对象来建立查找表

``` js
const map = {
  red: result0,
  green: result1,
};

return map[color];
```

### 16. 避免页面卡顿

**60fps 与设备刷新率**

目前大多数设备的屏幕刷新率为 60 次/秒。因此，如果在页面中有一个动画或渐变效果，或者用户正在滚动页面，那么浏览器渲染动画或页面的每一帧的速率也需要跟设备屏幕的刷新率保持一致。 其中每个帧的预算时间仅比 16 毫秒多一点 (1 秒/ 60 = 16.66 毫秒)。但实际上，浏览器有整理工作要做，因此您的所有工作需要在 10 毫秒内完成。如果无法符合此预算，帧率将下降，并且内容会在屏幕上抖动。 此现象通常称为卡顿，会对用户体验产生负面影响。

![网页渲染流程](https://user-images.githubusercontent.com/8088864/125445172-29d132ea-e485-49c7-b32d-172956c4349b.jpeg)

假如你用 JavaScript 修改了 DOM，并触发样式修改，经历重排重绘最后画到屏幕上。如果这其中任意一项的执行时间过长，都会导致渲染这一帧的时间过长，平均帧率就会下降。假设这一帧花了 50 ms，那么此时的帧率为 1s / 50ms = 20fps，页面看起来就像卡顿了一样。

对于一些长时间运行的 JavaScript，我们可以使用定时器进行切分，延迟执行。

``` js
for (let i = 0, len = arry.length; i < len; i++) {
  process(arry[i]);
}
```

假设上面的循环结构由于 process() 复杂度过高或数组元素太多，甚至两者都有，可以尝试一下切分。

``` js
const todo = arry.concat();
setTimeout(function(){
  process(todo.shift());
  if (todo.length) {
    setTimeout(arguments.callee, 25);
  } else {
    callback(arry);
  }
}, 25);
```

如果有兴趣了解更多，可以查看一下高性能JavaScript第 6 章和[高效前端：Web高效编程与优化实践](https://book.douban.com/subject/30170670/)第 3 章。

### 17. 使用 requestAnimationFrame 来实现视觉变化

从第 16 点我们可以知道，大多数设备屏幕刷新率为 60 次/秒，也就是说每一帧的平均时间为 16.66 毫秒。在使用 JavaScript 实现动画效果的时候，最好的情况就是每次代码都是在帧的开头开始执行。而保证 JavaScript 在帧开始时运行的唯一方式是使用 `requestAnimationFrame`。

``` js
/**
 * If run as a requestAnimationFrame callback, this
 * will be run at the start of the frame.
 */
function updateScreen(time) {
  // Make visual updates here.
}

requestAnimationFrame(updateScreen);
```

如果采取 setTimeout 或 setInterval 来实现动画的话，回调函数将在帧中的某个时点运行，可能刚好在末尾，而这可能经常会使我们丢失帧，导致卡顿。

![requestAnimationFrame执行点](https://user-images.githubusercontent.com/8088864/125448006-c889aac7-f5d6-4a21-a4fe-b4c6c0cdf197.jpg)

### 18. 使用 Web Workers

Web Worker 使用其他工作线程从而独立于主线程之外，它可以执行任务而不干扰用户界面。一个 worker 可以将消息发送到创建它的 JavaScript 代码, 通过将消息发送到该代码指定的事件处理程序（反之亦然）。

Web Worker 适用于那些处理纯数据，或者与浏览器 UI 无关的长时间运行脚本。

创建一个新的 worker 很简单，指定一个脚本的 URI 来执行 worker 线程（main.js）：

``` js
var myWorker = new Worker('worker.js');
// 你可以通过postMessage() 方法和onmessage事件向worker发送消息。
first.onchange = function() {
  myWorker.postMessage([first.value,second.value]);
  console.log('Message posted to worker');
}

second.onchange = function() {
  myWorker.postMessage([first.value,second.value]);
  console.log('Message posted to worker');
}
```

在 worker 中接收到消息后，我们可以写一个事件处理函数代码作为响应（worker.js）：

``` js
onmessage = function(e) {
  console.log('Message received from main script');
  var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
  console.log('Posting message back to main script');
  postMessage(workerResult);
}
```

onmessage处理函数在接收到消息后马上执行，代码中消息本身作为事件的data属性进行使用。这里我们简单的对这2个数字作乘法处理并再次使用postMessage()方法，将结果回传给主线程。

回到主线程，我们再次使用onmessage以响应worker回传的消息：

``` js
myWorker.onmessage = function(e) {
  result.textContent = e.data;
  console.log('Message received from worker');
}
```

在这里我们获取消息事件的data，并且将它设置为result的textContent，所以用户可以直接看到运算的结果。

不过在worker内，不能直接操作DOM节点，也不能使用window对象的默认方法和属性。然而你可以使用大量window对象之下的东西，包括WebSockets，IndexedDB以及FireFox OS专用的Data Store API等数据存储机制。

参考资料：

- [Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)

### 19. 使用位操作

JavaScript 中的数字都使用 IEEE-754 标准以 64 位格式存储。但是在位操作中，数字被转换为有符号的 32 位格式。即使需要转换，位操作也比其他数学运算和布尔操作快得多。

#### 取模

由于偶数的最低位为 0，奇数为 1，所以取模运算可以用位操作来代替。

``` js
if (value % 2) {
    // 奇数
} else {
    // 偶数
}
// 位操作
if (value & 1) {
    // 奇数
} else {
    // 偶数
}
```

#### 取整

``` js
~~10.12 // 10
~~10 // 10
~~'1.5' // 1
~~undefined // 0
~~null // 0
```

#### 位掩码

``` js
const a = 1
const b = 2
const c = 4
const options = a | b | c
```

通过定义这些选项，可以用按位与操作来判断 a/b/c 是否在 options 中。

``` js
// 选项 b 是否在选项中
if (b & options) {
  // ...
}
```

### 20. 不要覆盖原生方法

无论你的 JavaScript 代码如何优化，都比不上原生方法。因为原生方法是用低级语言写的（C/C++），并且被编译成机器码，成为浏览器的一部分。当原生方法可用时，尽量使用它们，特别是数学运算和 DOM 操作。

### 21. 降低 CSS 选择器的复杂性

#### (1). 浏览器读取选择器，遵循的原则是从选择器的右边到左边读取

看个示例

``` css
#block .text p {
    color: red;
}
```

1. 查找所有 P 元素。
2. 查找结果 1 中的元素是否有类名为 text 的父元素
3. 查找结果 2 中的元素是否有 id 为 block 的父元素

#### (2). CSS 选择器优先级

```
内联 > ID选择器 > 类选择器 > 标签选择器
```

根据以上两个信息可以得出结论。

1. 选择器越短越好。
2. 尽量使用高优先级的选择器，例如 ID 和类选择器。
3. 避免使用通配符 *。

最后要说一句，据我查找的资料所得，CSS 选择器没有优化的必要，因为最慢和慢快的选择器性能差别非常小。

### 22. 使用 flexbox 而不是较早的布局模型

在早期的 CSS 布局方式中我们能对元素实行绝对定位、相对定位或浮动定位。而现在，我们有了新的布局方式 [flexbox](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout/Basic_Concepts_of_Flexbox)，它比起早期的布局方式来说有个优势，那就是性能比较好。

下面的截图显示了在 1300 个框上使用浮动的布局开销：

![float布局的元素](https://user-images.githubusercontent.com/8088864/125547454-c911b26b-4a1c-44d8-9044-e83a09dc618d.jpg)

然后我们用 flexbox 来重现这个例子：

![flexbox布局的元素](https://user-images.githubusercontent.com/8088864/125547509-ecf25fd0-a9ef-438c-827a-987ea0bb9ae5.jpg)

现在，对于相同数量的元素和相同的视觉外观，布局的时间要少得多（本例中为分别 3.5 毫秒和 14 毫秒）。

不过 flexbox 兼容性还是有点问题，不是所有浏览器都支持它，所以要谨慎使用。

各浏览器兼容性：

- Chrome 29+
- Firefox 28+
- Internet Explorer 11
- Opera 17+
- Safari 6.1+ (prefixed with -webkit-)
- Android 4.4+
- iOS 7.1+ (prefixed with -webkit-)

但是在可能的情况下，至少应研究布局模型对网站性能的影响，并且采用最大程度减少网页执行开销的模型。

在任何情况下，不管是否选择 Flexbox，都应当在应用的高压力点期间尝试完全避免触发布局！

### 23. 使用 transform 和 opacity 属性更改来实现动画

在 CSS 中，transforms 和 opacity 这两个属性更改不会触发重排与重绘，它们是可以由合成器（composite）单独处理的属性。

![使用 transform 和 opacity 属性更改来实现动画](https://user-images.githubusercontent.com/8088864/125547800-ab61c27b-23fb-45bd-9d6a-2585df8d804e.jpeg)

### 24. 合理使用规则，避免过度优化

性能优化主要分为两类：

1. 加载时优化
2. 运行时优化

上述 23 条建议中，属于加载时优化的是前面 10 条建议，属于运行时优化的是后面 13 条建议。通常来说，没有必要 23 条性能优化规则都用上，根据网站用户群体来做针对性的调整是最好的，节省精力，节省时间。

在解决问题之前，得先找出问题，否则无从下手。所以在做性能优化之前，最好先调查一下网站的加载性能和运行性能。

#### 检查加载性能

一个网站加载性能如何主要看白屏时间和首屏时间。

- 白屏时间：指从输入网址，到页面开始显示内容的时间。
- 首屏时间：指从输入网址，到页面完全渲染的时间。

将以下脚本放在 \</head> 前面就能获取白屏时间。

``` html
<script>
  new Date() - performance.timing.navigationStart
</script>
```

在 `window.onload` 事件里执行 `new Date() - performance.timing.navigationStart` 即可获取首屏时间。

#### 检查运行性能

配合 chrome 的开发者工具，我们可以查看网站在运行时的性能。

打开网站，按 F12 选择 performance，点击左上角的灰色圆点，变成红色就代表开始记录了。这时可以模仿用户使用网站，在使用完毕后，点击 stop，然后你就能看到网站运行期间的性能报告。如果有红色的块，代表有掉帧的情况；如果是绿色，则代表 FPS 很好。performance 的具体使用方法请用搜索引擎搜索一下，毕竟篇幅有限。

通过检查加载和运行性能，相信你对网站性能已经有了大概了解。所以这时候要做的事情，就是使用上述 23 条建议尽情地去优化你的网站，加油！

参考资料：

- [performance.timing.navigationStart](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceTiming/navigationStart)

其他参考资料

- 高性能网站建设指南
- Web性能权威指南
- 高性能JavaScript
- [高效前端：Web高效编程与优化实践](https://book.douban.com/subject/30170670/)

## 五、强缓存与协商缓存

### 浏览器缓存

当浏览器去请求某个文件的时候，服务端就在response header里面对该文件做了缓存配置。缓存的时间、缓存类型都由服务端控制

#### 缓存优点

1. 减少不必要的数据传输，节省带宽
2. 减少服务器的负担，提升网站性能
3. 加快了客户端加载网页的速度，用户体验友好

#### 缓存缺点

资源如果有更改,会导致客户端不及时更新就会造成用户获取信息滞后

#### 缓存流程

浏览器第一次请求时

![浏览器缓存第一次请求](https://user-images.githubusercontent.com/8088864/125554789-a7d7d647-b89f-4c84-a326-5af87e6782f6.png)

浏览器后续在进行请求时

![浏览器缓存再次请求](https://user-images.githubusercontent.com/8088864/125554810-255dcfd2-a1f0-4e09-a329-56bacdee6d22.png)

从上图可以知道,浏览器缓存包括两种类型,即强缓存(本地缓存)和协商缓存,浏览器在第一次请求发生后,再次请求时

- 浏览器在请求某一资源时，会先获取该资源缓存的header信息，判断是否命中强缓存（`cache-control`和`expires`信息），若命中直接从缓存中获取资源信息，包括缓存header信息；本次请求根本就不会与服务器进行通信。

请求头信息

```
Accept: xxx
Accept-Encoding: gzip,deflate
Accept-Language: zh-cn
Connection: keep-alive
Host: xxx
Referer: xxx
User-Agent: xxx
```

来自缓存的响应头的信息

```
Accept-Ranges: bytes
Cache-Control: max-age= xxxx
Content-Encoding: gzip
Content-length: 3333
Content-Type: application/javascript
Date: xxx
Expires: xxx
Last-Modified: xxx
Server: 服务器
```

- 如果没有命中强缓存，浏览器会发送请求到服务器，请求会携带第一次请求返回的有关缓存的header字段信息（`Last-Modified`/`If-Modified-Since`和`Etag`/`If-None-Match`），由服务器根据请求中的相关header信息来比对结果是否协商缓存命中；若命中，则服务器返回新的响应header信息更新缓存中的对应header信息，但是并不返回资源内容，它会告知浏览器可以直接从缓存获取；否则返回最新的资源内容。

强缓存与协商缓存的区别，可以用下表来进行描述：

|  | 获取资源形式 | 状态码 | 发送请求到服务器 |
| ---- | ---- | ---- | ---- |
| **强缓存** | 从缓存取 | 200（from cache） | 否，直接从缓存取 |
| **协商缓存** | 从缓存取 |  304（not modified） | 是，正如其名，通过服务器来告知缓存是否可用 |

### 强缓存相关的header字段

强缓存上面已经介绍了，直接从缓存中获取资源而不经过服务器；与强缓存相关的header字段有两个：

1. **expires**: 这是http1.0时的规范；它的值为一个绝对时间的GMT格式的时间字符串，如**Mon, 10 Jun 2015 21:31:12 GMT**，如果发送请求的时间在expires之前，那么本地缓存始终有效，否则就会发送请求到服务器来获取资源。
2. **cache-control：max-age=number**: 这是http1.1时出现的header信息，主要是利用该字段的max-age值来进行判断，它是一个相对值；资源第一次的请求时间和Cache-Control设定的有效期，计算出一个资源过期时间，再拿这个过期时间跟当前的请求时间比较，如果请求时间在过期时间之前，就能命中缓存，否则就不行；cache-control除了该字段外，还有下面几个比较常用的设置值：

- **no-cache**: 不使用本地缓存。需要使用缓存协商，先与服务器确认返回的响应是否被更改，如果之前的响应中存在ETag，那么请求的时候会与服务端验证，如果资源未被更改，则可以避免重新下载。
- **no-store**: 直接禁止游览器缓存数据，每次用户请求该资源，都会向服务器发送一个请求，每次都会下载完整的资源。
- **public**: 可以被所有的用户缓存，包括终端用户和CDN等中间代理服务器。
- **private**: 只能被终端用户的浏览器缓存，不允许CDN等中继缓存服务器对其缓存。

**注意：如果cache-control与expires同时存在的话，cache-control的优先级高于expires。**

### 协商缓存相关的header字段

协商缓存都是由服务器来确定缓存资源是否可用的，所以客户端与服务器端要通过某种标识来进行通信，从而让服务器判断请求资源是否可以缓存访问，这主要涉及到下面两组header字段，这两组搭档都是成对出现的，即第一次请求的响应头带上某个字段（`Last-Modified`或者`Etag`），则后续请求则会带上对应的请求字段（`If-Modified-Since`或者`If-None-Match`），若响应头没有`Last-Modified`或者`Etag`字段，则请求头也不会有对应的字段。

#### 1. Last-Modified/If-Modified-Since

二者的值都是GMT格式的时间字符串，具体过程：

- 浏览器第一次跟服务器请求一个资源，服务器在返回这个资源的同时，在response的header加上`Last-Modified`的header，这个header表示这个资源在服务器上的最后修改时间

- 浏览器再次跟服务器请求这个资源时，在request的header上加上`If-Modified-Since`的header，这个header的值就是上一次请求时返回的Last-Modified的值

- 服务器再次收到资源请求时，根据浏览器传过来`If-Modified-Since`和资源在服务器上的最后修改时间判断资源是否有变化，如果没有变化则返回`304 Not Modified`，但是不会返回资源内容；如果有变化，就正常返回资源内容。当服务器返回`304 Not Modified`的响应时，response header中不会再添加`Last-Modified`的header，因为既然资源没有变化，那么`Last-Modified`也就不会改变，这是服务器返回304时的response header

- 浏览器收到304的响应后，就会从缓存中加载资源

- 如果协商缓存没有命中，浏览器直接从服务器加载资源时，`Last-Modified`的Header在重新加载的时候会被更新，下次请求时，`If-Modified-Since`会启用上次返回的`Last-Modified`值

#### 2. Etag/If-None-Match

这两个值是由服务器生成的每个资源的唯一标识字符串，只要资源有变化就这个值就会改变；其判断过程与**Last-Modified/If-Modified-Since**类似，与Last-Modified不一样的是，当服务器返回304 Not Modified的响应时，由于ETag重新生成过，response header中还会把这个ETag返回，即使这个ETag跟之前的没有变化。

### 既生Last-Modified何生Etag

你可能会觉得使用Last-Modified已经足以让浏览器知道本地的缓存副本是否足够新，为什么还需要Etag呢？HTTP1.1中Etag的出现主要是为了解决几个Last-Modified比较难解决的问题：

- 一些文件也许会周期性的更改，但是他的内容并不改变(仅仅改变的修改时间)，这个时候我们并不希望客户端认为这个文件被修改了，而重新GET；

- 某些文件修改非常频繁，比如在秒以下的时间内进行修改，(比方说1s内修改了N次)，If-Modified-Since能检查到的粒度是s级的，这种修改无法判断(或者说UNIX记录MTIME只能精确到秒)；

- 某些服务器不能精确的得到文件的最后修改时间。

这时，利用Etag能够更加准确的控制缓存，因为Etag是服务器自动生成或者由开发者生成的对应资源在服务器端的唯一标识符。

**注意: Last-Modified与ETag是可以一起使用的，服务器会优先验证ETag，一致的情况下，才会继续比对Last-Modified，最后才决定是否返回304。**

### 用户的行为对缓存的影响

| 用户操作 | Expires/Cache-Control | Last-Modified/ETag |
| ---- | ---- | ---- |
| 地址栏回车 | 有效 | 有效 |
| 页面链接条状 | 有效 | 有效 |
| 新开窗口 | 有效 | 有效 |
| 前进后退 | 有效 | 有效 |
| F5刷新 | 无效 | 有效 |
| Ctrl + F5强制刷新 | 无效 | 无效 |

### 强缓存如何重新加载缓存缓存过的资源

使用强缓存时，浏览器不会发送请求到服务端，根据设置的缓存时间浏览器一直从缓存中获取资源，在这期间若资源产生了变化，浏览器就在缓存期内就一直得不到最新的资源，那么如何防止这种事情发生呢？

**通过更新页面中引用的资源路径，让浏览器主动放弃缓存，加载新资源。**

``` html
<link rel="stylesheet" href="a.css?a=1.0" />
...
<div class="app">app</div>
```

这样每次文件改变后就会生成新的query值，这样query值不同，也就是页面引用的资源路径不同了，之前缓存过的资源就被浏览器忽略了，因为资源请求的路径变了。

## 六、HTTP 各版本特点与区别

HTTP协议到现在为止总共经历了3个版本的演化，第一个HTTP协议诞生于1989年3月。

| 版本 | 功能 | 备注 |
| ---- | ---- | ---- |
| HTTP 0.9 | 仅支持 Get <br /> 仅能访问 HTML 格式资源 | 简单单一 |
| HTTP 1.0 | 新增POST，DELETE，PUT，HEADER等方式 <br />  增加请求头和响应头概念，指定协议版本号，携带其他元信息（状态码、权限、缓存、内容编码）<br />  扩展传输内容格式（图片、音视频、二进制等都可以传输） | 存活时间短 |
| HTTP 1.1 | 长连接：新增 Connection 字段,可以通过keep-alive保持长连接 <br /> 管道化：一次连接就形成一次管道，管道内进行多次有序响应。允许向服务端发生多次请求，但是响应按序返回 <br /> 缓存处理：新增 cache-control 和 etag 首部字段<br /> 断点续传 <br /> 状态码增加 | 当前主流版本号 <br /> 存在Header 重复问题 |
| HTTP 2.0 | 二进制分帧：数据体和头信息可以都是二进制，统称帧 <br /> 多路复用与数据流：能同时发送和响应多个请求，通过数据流来传输 <br /> 头部压缩：对 Header 进行压缩,避免重复浪费 <br /> 服务器推送：服务器可以向客户端主动发送资源 | 2005发布 |

### 1、HTTP 0.9

HTTP 0.9是第一个版本的HTTP协议，已过时。它的组成极其简单，只允许客户端发送GET这一种请求，且不支持请求头。由于没有协议头，造成了HTTP 0.9协议只支持一种内容，即纯文本。不过网页仍然支持用HTML语言格式化，同时无法插入图片。

HTTP 0.9具有典型的无状态性，每个事务独立进行处理，事务结束时就释放这个连接。由此可见，HTTP协议的无状态特点在其第一个版本0.9中已经成型。一次HTTP 0.9的传输首先要建立一个由客户端到Web服务器的TCP连接，由客户端发起一个请求，然后由Web服务器返回页面内容，然后连接会关闭。如果请求的页面不存在，也不会返回任何错误码。

### 2、HTTP 1.0

HTTP协议的第二个版本，第一个在通讯中指定版本号的HTTP协议版本，至今仍被广泛采用。相对于HTTP 0.9 增加了如下主要特性：

- 请求与响应支持头域
- 响应对象以一个响应状态行开始
- 响应对象不只限于超文本
- 开始支持客户端通过POST方法向Web服务器提交数据，支持GET、HEAD、POST方法
- （短连接）每一个请求建立一个TCP连接，请求完成后立马断开连接。这将会导致2个问题：连接无法复用，队头阻塞(head of line blocking)。连接无法复用会导致每次请求都经历三次握手和慢启动。三次握手在高延迟的场景下影响较明显，慢启动则对文件类请求影响较大。队头阻塞(head of line blocking)

### 3、HTTP 1.1

HTTP协议的第三个版本是HTTP 1.1，是目前使用最广泛的协议版本 。HTTP 1.1是目前主流的HTTP协议版本，因此这里就多花一些笔墨介绍一下HTTP 1.1的特性。

HTTP 1.1引入了许多关键性能优化：keepalive连接，chunked编码传输，字节范围请求，请求流水线等

#### Persistent Connection（keepalive连接）

允许HTTP设备在事务处理结束之后将TCP连接保持在打开的状态，以便未来的HTTP请求重用现在的连接，直到客户端或服务器端决定将其关闭为止。在HTTP1.0中使用长连接需要添加请求头 `Connection: Keep-Alive`，而在HTTP 1.1 所有的连接默认都是长连接，除非特殊声明不支持（ HTTP请求报文首部加上`Connection: close` ）。服务器端按照FIFO原则来处理不同的Request。

![长连接(keepalive连接)](https://user-images.githubusercontent.com/8088864/125572282-1b48362e-ed29-42a1-9882-3710ab106b76.jpg)

#### chunked编码传输

该编码将实体分块传送并逐块标明长度，直到长度为0块表示传输结束，这在实体长度未知时特别有用(比如由数据库动态产生的数据)

#### 字节范围请求

HTTP1.1支持传送内容的一部分。比方说，当客户端已经有内容的一部分，为了节省带宽，可以只向服务器请求一部分。该功能通过在请求消息中引入了range头域来实现，它允许只请求资源的某个部分。在响应消息中Content-Range头域声明了返回的这部分对象的偏移值和长度。如果服务器相应地返回了对象所请求范围的内容，则响应码206（Partial Content）

#### 断点续传

Header 字段

服务端

Accept-Ranges:表示服务器支持断点续传，并且数据传输以字节为单位

Etag:资源的唯一 tag 后端自定义，验证文件是否修改过。修改过就重新重头传输

Last-Modified:文件上次修改时间

Content-Range:返回数据范围

客户端

If-Range:服务器给的 Etag 值

Range:请求的数据范围

If-Modified-Since: 将服务器响应的 Last-Modified 保存， 下次发送可以携带，后台接受判断文件是否修改，没有可以返回 304状态码，叫客户端使用缓存数据，避免重复发出资源。

流程

![断点续传](https://user-images.githubusercontent.com/8088864/125573335-f1eda73b-ad4f-470a-808f-caa393e38b2e.png)

**注意：断点续传后台返回状态码为 206。**

#### Pipelining（请求流水线）

#### 其他特性

另外，HTTP 1.1还新增了如下特性：

- 请求消息和响应消息都支持Host头域：在HTTP1.0中认为每台服务器都绑定一个唯一的IP地址，因此，请求消息中的URL并没有传递主机名（hostname）。但随着虚拟主机技术的发展，在一台物理服务器上可以存在多个虚拟主机（Multi-homed Web Servers），并且它们共享一个IP地址。因此，Host头的引入就很有必要了。

- 新增了一批Request method：HTTP1.1增加了OPTIONS, PUT, DELETE, TRACE, CONNECT方法

- 缓存处理：HTTP/1.1在1.0的基础上加入了一些cache的新特性，引入了实体标签，一般被称为e-tags，新增更为强大的Cache-Control头。

### 4、HTTP 2.0

HTTP 2.0是下一代HTTP协议。主要特点有：

#### 二进制分帧

HTTP 2.0最大的特点：不会改动HTTP 的语义，HTTP 方法、状态码、URI 及首部字段，等等这些核心概念上一如往常，却能致力于突破上一代标准的性能限制，改进传输性能，实现低延迟和高吞吐量。而之所以叫2.0，是在于新增的二进制分帧层。在二进制分帧层上， HTTP 2.0 会将所有传输的信息分割为更小的消息和帧，并对它们采用二进制格式的编码 ，其中HTTP1.x的首部信息会被封装到Headers帧，而我们的request body则封装到Data帧里面。

![二进制分帧](https://user-images.githubusercontent.com/8088864/125574741-7645e5f9-3476-44f3-94eb-4a3aaebce2ae.jpg)

#### 多路复用

HTTP 2.0 通信都在一个连接上完成，这个连接可以承载任意数量的双向数据流。

通过单一的 HTTP2.0连接连续发起多重请求-响应消息，即客户端和服务器可以同时发送多个请求和响应，而不用顺序一一对应。

每个数据流以HTTP消息的形式发送，HTTP消息被分为独立的帧，然后由一或多个帧组成，这些帧可以乱序发送，接收端根据这些帧的标识符号和首部将信息重新组装起来。

默认什么情况下使用同一个连接

- 同一个域名下的资源
- 不同域名但是满足两个条件：1）解析到同一个 IP；2）使用同一个证书

#### 头部压缩

当一个客户端向相同服务器请求许多资源时，像来自同一个网页的图像，将会有大量的请求看上去几乎同样的，这就需要压缩技术对付这种几乎相同的信息。

由于头信息使用文本，没有压缩，请求时候会来回重复传递，造成流量浪费。

参考[HTTP2头部压缩技术介绍](https://imququ.com/post/header-compression-in-http2.html)

头部压缩需要支持 HTTP2的浏览器和服务器之间：

- 维护一份相同的静态字典（包含常见的头部名称，以及常见的头部名称与值的组合）
- 维护一份相同的动态字典，动态添加内容（即实际的 Header 值）
- 支持基于静态哈夫曼码表的哈夫曼编码（uffman Coding）

原理图：

![http头部压缩原理](https://user-images.githubusercontent.com/8088864/125578550-82fd62aa-eb21-4813-87d1-19904e1b42fc.png)

总结： 通过映射表，传递对应编码和值来达到压缩。

#### 随时复位

HTTP1.1一个缺点是当HTTP信息有一定长度大小数据传输时，你不能方便地随时停止它，中断TCP连接的代价是昂贵的。使用HTTP2的RST_STREAM将能方便停止一个信息传输，启动新的信息，在不中断连接的情况下提高带宽利用效率。

#### 服务器端推流

Server Push。客户端请求一个资源X，服务器端判断也许客户端还需要资源Z，在无需事先询问客户端情况下将资源Z推送到客户端，客户端接受到后，可以缓存起来以备后用。

#### 优先权和依赖

每个流都有自己的优先级别，会表明哪个流是最重要的，客户端会指定哪个流是最重要的，有一些依赖参数，这样一个流可以依赖另外一个流。优先级别可以在运行时动态改变，当用户滚动页面时，可以告诉浏览器哪个图像是最重要的，你也可以在一组流中进行优先筛选，能够突然抓住重点流。

## 七、队头阻塞以及解决办法

### 前言

通常我们提到队头阻塞，指的可能是TCP协议中的队头阻塞，但是HTTP1.1中也有一个类似TCP队头阻塞的问题，下面各自介绍一下。

### TCP队头阻塞

队头阻塞（head-of-line blocking）发生在一个TCP分节丢失，导致其后续分节不按序到达接收端的时候。该后续分节将被接收端一直保持直到丢失的第一个分节被发送端重传并到达接收端为止。该后续分节的延迟递送确保接收应用进程能够按照发送端的发送顺序接收数据。这种为了达到完全有序而引入的延迟机制，非常有用，但也有不利之处。

假设在单个TCP连接上发送语义独立的消息，比如说服务器可能发送3幅不同的图像供Web浏览器显示。为了营造这几幅图像在用户屏幕上并行显示的效果，服务器先发送第一幅图像的一个断片，再发送第二幅图像的一个断片，然后再发送第三幅图像的一个断片；服务器重复这个过程，直到这3幅图像全部成功地发送到浏览器为止。

要是第一幅图像的某个断片内容的TCP分节丢失了，客户端将保持已到达的不按序的所有数据，直到丢失的分节重传成功。这样不仅延缓了第一幅图像数据的递送，也延缓了第二幅和第三幅图像数据的递送。

### HTTP队头阻塞

上面用浏览器请求图片资源举例子，但实际上HTTP自身也有类似TCP队头阻塞的情况。要介绍HTTP队头阻塞，就需要先讲讲HTTP的管道化（pipelining）。

#### HTTP管道化是什么

HTTP1.1 允许在持久连接上可选的使用请求管道。这是相对于keep-alive连接的又一性能优化。在响应到达之前，可以将多条请求放入队列，当第一条请求发往服务器的时候，第二第三条请求也可以开始发送了，在高延时网络条件下，这样做可以降低网络的环回时间，提高性能。

非管道化与管道化的区别示意图

![HTTP非管道化与管道化](https://user-images.githubusercontent.com/8088864/125586316-36604fa7-fcc1-453b-9ae3-4c84b39690bd.png)

#### HTTP管道化产生的背景

在一般情况下，HTTP遵守“请求-响应”的模式，也就是客户端每次发送一个请求到服务端，服务端返回响应。这种模式非常容易理解，但是效率并不是那么高，为了提高速度和效率，人们做了很多尝试：

- 最简单的情况下，服务端一旦返回响应后就会把对应的连接关闭，客户端的多个请求实际上是串行发送的。
- 除此之外，客户端可以选择同时创建多个连接，在多个连接上并行的发送不同请求。但是创建更多连接也带来了更多的消耗，当前大部分浏览器都会限制对同一个域名的连接数。
- 从HTTP1.0开始增加了持久连接的概念（HTTP1.0的Keep-Alive和HTTP1.1的persistent），可以使HTTP能够复用已经创建好的连接。客户端在收到服务端响应后，可以复用上次的连接发送下一个请求，而不用重新建立连接。
- 现代浏览器大多采用并行连接与持久连接共用的方式提高访问速度，对每个域名建立并行地少量持久连接。
- 而在持久连接的基础上，HTTP1.1进一步地支持在持久连接上使用管道化（pipelining）特性。管道化允许客户端在已发送的请求收到服务端的响应之前发送下一个请求，借此来减少等待时间提高吞吐；如果多个请求能在同一个TCP分节发送的话，还能提高网络利用率。但是因为HTTP管道化本身可能会导致队头阻塞的问题，以及一些其他的原因，现代浏览器默认都关闭了管道化。

#### HTTP管道化的限制

1. 管道化要求服务端按照请求发送的顺序返回响应（FIFO），原因很简单，HTTP请求和响应并没有序号标识，无法将乱序的响应与请求关联起来。
2. 客户端需要保持未收到响应的请求，当连接意外中断时，需要重新发送这部分请求。
3. 只有幂等的请求才能进行管道化，也就是只有GET和HEAD请求才能管道化，否则可能会出现意料之外的结果

#### HTTP管道化引起的请求队头阻塞

前面提到HTTP管道化要求服务端必须按照请求发送的顺序返回响应，那如果一个响应返回延迟了，那么其后续的响应都会被延迟，直到队头的响应送达。

### 如何解决队头阻塞

#### 如何解决HTTP队头阻塞

对于HTTP1.1中管道化导致的请求/响应级别的队头阻塞，可以使用HTTP2解决。HTTP2不使用管道化的方式，而是引入了帧、消息和数据流等概念，每个请求/响应被称为消息，每个消息都被拆分成若干个帧进行传输，每个帧都分配一个序号。每个帧在传输是属于一个数据流，而一个连接上可以存在多个流，各个帧在流和连接上独立传输，到达之后在组装成消息，这样就避免了请求/响应阻塞。

当然，即使使用HTTP2，如果HTTP2底层使用的是TCP协议，仍可能出现TCP队头阻塞。

#### 如何解决TCP队头阻塞

TCP中的队头阻塞的产生是由TCP自身的实现机制决定的，无法避免。想要在应用程序当中避免TCP队头阻塞带来的影响，只有舍弃TCP协议。

比如google推出的QUIC协议，在某种程度上可以说避免了TCP中的队头阻塞，因为它根本不使用TCP协议，而是在UDP协议的基础上实现了可靠传输。而UDP是面向数据报的协议，数据报之间不会有阻塞约束。

此外还有一个SCTP（流控制传输协议），它是和TCP、UDP在同一层次的传输协议。SCTP的多流特性也可以尽可能的避免队头阻塞的情况。

### 总结

从TCP队头阻塞和HTTP队头阻塞的原因我们可以看到，出现队头阻塞的原因有两个：

  1. 独立的消息数据都在一个链路上传输，也就是有一个“队列”。比如TCP只有一个流，多个HTTP请求共用一个TCP连接
  2. 队列上传输的数据有严格的顺序约束。比如TCP要求数据严格按照序号顺序，HTTP管道化要求响应严格按照请求顺序返回

所以要避免队头阻塞，就需要从以上两个方面出发，比如quic协议不使用TCP协议而是使用UDP协议，SCTP协议支持一个连接上存在多个数据流等等。

## 八、QUIC

QUIC（Quick UDP Internet Connection）是谷歌制定的一种互联网传输层协议，它基于UDP传输层协议，同时兼具TCP、TLS、HTTP/2等协议的可靠性与安全性，可以有效减少连接与传输延迟，更好地应对当前传输层与应用层的挑战。

### QUIC的由来：为什么是UDP而非TCP？

UDP和TCP都属于传输层协议。TCP是面向连接的，更强调的是传输的可靠性，通过TCP连接传送的数据，无差错，不丢失，不重复，按序到达，但是因为TCP在传递数据之前会有三次握手来建立连接，所以效率低、占用系统的CPU、内存等硬件资源较高；而UDP的无连接的（即发送数据之前不需要建立连接），只需要知道对方地址即可发送数据，具有较好的实时性，工作效率比TCP高，占用系统资源比TCP少，但是在数据传递时，如果网络质量不好，就会很容易丢包。

我们知道，大部分Web平台的数据传输都基于TCP协议。实际上，TCP在设计之初，网络环境复杂、丢包率高、网速差，所以TCP可以完美解决可靠性的问题。而如今的网络环境和网速都已经取得了巨大的改善，网络传输可靠性已经不再是棘手的问题。另外，TCP还有一个很大的问题是更新非常困难。这是因为：TCP网络协议栈的实现依赖于系统内核更新，一旦系统内核更新，终端设备、中间设备的系统更新都会非常缓慢，迭代需要花费几年甚至十几年的时间，这显然跟不上当今互联网的发展速度。所以现在解法就是，抛弃TCP而使用UDP，来实现低延迟的传输需求。

![QUIC is very similar to TCP TLS HTTP 2 0 implemented on UDP](https://user-images.githubusercontent.com/8088864/125581409-742f54c2-93aa-4d3a-919e-d3710b318361.jpg)

为了结合两者优点，谷歌公司推出了QUIC，它的升级不依赖于系统内核，只需要Client和Server端更新到指定版本。如此一来，基于UDP的QUIC就能月更甚至周更，很好的解决了TCP部署和更新的困难，更灵活地实现部署和更新。

### 为什么要用QUIC？

#### 1. 建连延迟低

网民传统TCP三次握手+TLS1`~`2RTT握手+http数据，基于TCP的HTTPS一次建连至少需要2`~`3个RTT，而QUIC基于UDP，完整握手只需要1RTT乃至0RTT，可以显著降低延迟。

![QUIC握手](https://user-images.githubusercontent.com/8088864/125584078-81044014-9ed7-47ba-93a4-24623b716b07.jpg)

#### 2. 安全又可靠

QUIC具备TCP、TLS、HTTPS/2等协议的安全、可靠性的特点，通过提供安全功能（如身份验证和加密）来实现加密传输，这些功能由传输协议本身的更高层协议（如TLS）来实现。

#### 3. 改造灵活

QUIC在应用程序层面就能实现不同的拥塞控制算法，不需要操作系统和内核支持，这相比于传统的TCP协议改造灵活性更好。

#### 4. 改进的拥塞控制

QUIC主要实现了TCP的慢启动、拥塞避免、快重传、快恢复。在这些拥塞控制算法的基础上改进，例如单调递增的 Packet Number，解决了重传的二义性，确保RTT准确性，减少重传次数。

#### 5. 无队头阻塞的多路复用

HTTP2实现了多路复用，可以在一条TCP流上并发多个HTTP请求，但基于TCP的HTTP2在传输层却有个问题，TCP无法识别不同的HTTP2流，实际收数据仍是一个队列，当后发的流先收到时，会因前面的流未到达而被阻塞。QUIC一个connection可以复用传输多个stream，每个stream之间都是独立的，一个stream的丢包不会影响到其他stream的接收和处理。

![QUIC特点](https://user-images.githubusercontent.com/8088864/125585210-a874fcb0-87ab-46a5-b254-825c78034943.jpg)

综上所述，QUIC具有众多优点，它融合了UDP协议的速度、性能与TCP的安全与可靠，大大优化了互联网传输体验。

作为提升终端用户访问效率的CDN服务，其节点之间存在大量数据互通，节点之间的网络连接、传输架构等因素都会对CDN服务质量产生影响。而将QUIC应用在CDN系统中，CDN用户开启QUIC功能后，系统将遵循QUIC协议进行用户IP请求处理，既能满足安全传输的需求，也能提升传输效率。

### QUIC对客户端的要求

- 如果您使用Chrome浏览器，则只支持QUIC协议Q43版本。当前阿里云CDN的QUIC协议是Q39版本，不支持直接对阿里云CDN发起QUIC请求。
- 如果您使用自研App，则App必须集成支持QUIC协议的网络库，例如：lsquic-client或cronet网络库。

### QUIC应用场景

1. 图片小文件：明显降低文件下载总耗时，提升效率
2. 视频点播：提升首屏秒开率，降低卡顿率，提升用户观看体验
3. 动态请求：适用于动态请求，提升访问速度，如网页登录、交易等交互体验提升
4. 弱网环境：在丢包和网络延迟严重的情况下仍可提供可用的服务，并优化卡顿率、请求失败率、秒开率、提高连接成功率等传输指标
5. 大并发连接：连接可靠性强，支持页面资源数较多、并发连接数较多情况下的访问速率提升
6. 加密连接：具备安全、可靠的传输性能

## 九、WebRTC的优缺点

WebRTC，即网页即时通信（Web Real-Time Communication），是一个支持网页浏览器进行实时语音对话或视频对话的API。

目前几乎所有主流浏览器都支持了 WebRTC，越来越多的公司正在使用 WebRTC 并且将其加到自己的应用程序中。在浏览器端，依赖于浏览器获取音视频的能力，以及强大的网页上的渲染能力，就能够为高清的通信体验打下基础。同时，相比移动端来说，屏幕比较大，视窗选择也比较灵活。

### 优点

1. 方便。对于用户来说，在WebRTC出现之前想要进行实时通信就需要安装插件和客户端，但是对于很多用户来说，插件的下载、软件的安装和更新这些操作是复杂而且容易出现问题的，现在WebRTC技术内置于浏览器中，用户不需要使用任何插件或者软件就能通过浏览器来实现实时通信。对于开发者来说，在Google将WebRTC开源之前，浏览器之间实现通信的技术是掌握在大企业手中，这项技术的开发是一个很困难的任务，现在开发者使用简单的HTML标签和JavaScript API就能够实现Web音/视频通信的功能。

2. 免费。虽然WebRTC技术已经较为成熟，其集成了最佳的音/视频引擎，十分先进的codec，但是Google对于这些技术不收取任何费用。

3. 强大的打洞能力。WebRTC技术包含了使用STUN、ICE、TURN、RTP-over-TCP的关键NAT和防火墙穿透技术，并支持代理。

### 缺点

1. 缺乏服务器方案的设计和部署。

2. 传输质量难以保证。WebRTC的传输设计基于P2P，难以保障传输质量，优化手段也有限，只能做一些端到端的优化，难以应对复杂的互联网环境。比如对跨地区、跨运营商、低带宽、高丢包等场景下的传输质量基本是靠天吃饭，而这恰恰是国内互联网应用的典型场景。

3. WebRTC比较适合一对一的单聊，虽然功能上可以扩展实现群聊，但是没有针对群聊，特别是超大群聊进行任何优化。

4. 设备端适配，如回声、录音失败等问题层出不穷。这一点在安卓设备上尤为突出。由于安卓设备厂商众多，每个厂商都会在标准的安卓框架上进行定制化，导致很多可用性问题（访问麦克风失败）和质量问题（如回声、啸叫）。

5. 对Native开发支持不够。WebRTC顾名思义，主要面向Web应用，虽然也可以用于Native开发，但是由于涉及到的领域知识（音视频采集、处理、编解码、实时传输等）较多，整个框架设计比较复杂，API粒度也比较细，导致连工程项目的编译都不是一件容易的事。

## 十、EventSource和轮询的优缺点

### EventSource

#### 简介

EventSource 是服务器推送的一个网络事件接口。一个EventSource实例会对HTTP服务开启一个持久化的连接，以text/event-stream 格式发送事件, 会一直保持开启直到被要求关闭。

一旦连接开启，来自服务端传入的消息会以事件的形式分发至你代码中。如果接收消息中有一个事件字段，触发的事件与事件字段的值相同。如果没有事件字段存在，则将触发通用事件。

与 WebSockets,不同的是，服务端推送是单向的。数据信息被单向从服务端到客户端分发. 当不需要以消息形式将数据从客户端发送到服务器时，这使它们成为绝佳的选择。例如，对于处理社交媒体状态更新，新闻提要或将数据传递到客户端存储机制（如IndexedDB或Web存储）之类的，EventSource无疑是一个有效方案。

- `EventSource`（Server-sent events）简称SSE用于向服务端发送事件，它是基于http协议的单向通讯技术，以`text/event-stream`格式接受事件，如果不关闭会一直处于连接状态，直到调用`EventSource.close()`方法才能关闭连接；

- `EvenSource`本质上也就是`XHR-streaming`只不过浏览器给它提供了标准的API封装和协议。

- 由于`EventSource`是单向通讯，所以只能用来实现像股票报价、新闻推送、实时天气这些只需要服务器发送消息给客户端场景中。

- `EventSource`虽然不支持双向通讯，但是在功能设计上他也有一些优点比如可以自动重连接,event IDs,以及发送随机事件的等功能

`EventSource`案例浏览器端代码如下所示:

``` js
// 实例化 EventSource 参数是服务端监听的路由
var source = new EventSource('http://localhost:3000');

source.onopen = function (event) { // 与服务器连接成功回调
  console.log('成功与服务器连接');
}

// 监听从服务器发送来的所有没有指定事件类型的消息(没有event字段的消息)
source.onmessage = function (event) { // 监听未命名事件
  console.log('未命名事件', event.data);
}

source.onerror = function (error) { // 监听错误
  console.log('错误');
}

// 监听指定类型的事件（可以监听多个）
source.addEventListener("ping", function (event) {
  console.log("ping", event.data)
})
```

服务器端

``` js
const http = require('http');

http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type' :'text/event-stream',
    'Access-Control-Allow-Origin':'*'
  });

  let i = 0;
  const timer = setInterval(()=>{
    const date = {date:new Date()}
    var content ='event: ping\n'+"data:"+JSON.stringify(date)+"" +"\n\n";
    res.write(content);
  },1000)

  res.connection.on("close", function(){
    res.end();
    clearInterval(timer);
    console.log("Client closed connection. Aborting.");
  });

}).listen(3000);
console.log('server is run http://localhost:3000');
```

#### EventSource规范字段

- **event**: 事件类型，如果指定了该字段，则在客户端接收到该条消息时，会在当前的EventSource对象上触发一个事件，事件类型就是该字段的字段值，你可以使用addEventListener()方法在当前EventSource对象上监听任意类型的命名事件，如果该条消息没有event字段，则会触发onmessage属性上的事件处理函数。
- **data**: 消息的数据字段，如果该消息包含多个data字段，则客户端会用换行符把他们连接成一个字符串来处理
- **id**: 事件ID，会成为当前EventSource对象的内部属性“最后一个事件ID”的属性值；
- **retry**: 一个整数值，指定了重新连接的时间（单位为毫秒），如果该字段不是整数，则会被忽略。

#### EventSource属性

- **EventSource.onerror**: 是一个 EventHandler，当发生错误时被调用，并且在此对象上派发 error 事件。
- **EventSource.onmessage**: 是一个 EventHandler，当收到一个 message事件，即消息来自源头时被调用。
- **EventSource.onopen**: 是一个 EventHandler，当收到一个 open 事件，即连接刚打开时被调用。
- **EventSource.readyState**(只读): 一个 unsigned short 值，代表连接状态。可能值是CONNECTING (0), OPEN (1), 或者 CLOSED (2)。
- **EventSource.url**(只读): 一个DOMString，代表源头的URL。

#### EventSource 通讯过程

![EventSource通讯过程](https://user-images.githubusercontent.com/8088864/125590756-ffd10207-83de-4166-a8b5-9fc848c191cc.png)

#### 缺点

1. 因为是服务器->客户端的，所以它不能处理客户端请求流
2. 因为是明确指定用于传输UTF-8数据的，所以对于传输二进制流是低效率的，即使你转为base64的话，反而增加带宽的负载，得不偿失。

### 轮询

#### 短轮询(Polling)

是一种简单粗暴，同样也是一种效率低下的实现“实时”通讯方案，这种方案的原理就是定期向服务器发送请求，主动拉取最新的消息队列。

客户端代码：

``` js
function Polling() {
  fetch(url).then(data => {
    // somthing
  }).catch(err => {
    console.error(err);
  });
}

//每5s执行一次
setInterval(polling, 5000);
```

![短轮询流程](https://user-images.githubusercontent.com/8088864/125591641-814c4239-47e3-41da-ad9e-a0c7e64dfe72.png)

这种轮询方式比较适合服务器信息定期更新的场景，如天气预报股票行情等，每隔一段时间会进行更新，且轮询间隔的服务器更新频率保持一致是比较理想的方式，但很多多时候会因网络或者服务器出现阻塞早场事件间隔不一致。

优点：

- 可以看到实现非常简单，它的兼容性也比较好的只要支持http协议就可以用这种方式实现

缺点：

- 资源浪费: 比如轮询的间隔小于服务器信息跟新频率，会浪费很多HTTP请求，消耗宝贵的CPU时间和带宽。

- 容易导致请求轰炸: 例如当服务器负载比较高时，第一个请求还没有处理完，这时第三、第四个请求接踵而来，无用的额外请求对服务器端进行了轰炸。

#### 长轮询(Long Polling)

这是一种优化的轮询方式，称为长轮询，sockjs就是使用的这种轮询方式，长轮询值的是浏览器发送一个请求到服务器，服务器只有在有可用的新数据时才会响应。

客户端代码:

``` js
function LongPolling() {
    fetch(url).then(data => {
        LongPolling();
    }).catch(err => {
        LongPolling();
        console.log(err);
    });
}
LongPolling();
```

![长轮询流程](https://user-images.githubusercontent.com/8088864/125592542-e5c7fb6b-18b8-434f-a4ee-f986684dcbbf.png)

客户端向服务器发送一个消息获取请求时，服务器会将当前的消息队列返回给客户端，然后关闭连接。当消息队列为空的时，服务器不会立即关闭连接，而是等待指定的时间间隔，如果在这个时间间隔内没有新的消息，则由客户端主动超时关闭连接。

相比Polling，客户端的轮询请求只有在上一个请求连接关闭后才会重新发起。这就解决了Polling的请求轰炸问题。服务器可以控制的请求时序，因为在服务器未响应之前，客户端不会发送额为的请求。

优点:

- 长轮询和短轮询比起来，明显减少了很多不必要的http请求次数，相比之下节约了资源。

缺点:

- 连接挂起也会导致资源的浪费。

### EventSource VS 轮询

|  | 轮询(Polling) | 长轮询(Long-Polling) | EventSource |
| ---- | ---- | ---- | ---- |
| 通信协议 | http | http | http |
| 触发方式 | client(客户端) | client(客户端) | client、server(客户端、服务端) |
| 优点 | 兼容性好容错性强，实现简单 | 比短轮询节约服务器资源 | 实现简便，开发成本低 |
| 缺点 | 安全性差，占较多的内存资源与请求数量，容易对服务器造成压力，请求时间间隔容易导致不一致 | 安全性差，占较多的内存资源与请求数，请求时间间隔容易导致不一致 | 只适用高级浏览器，老版本的浏览器不兼容 |
| 延迟 | 非实时，延迟取决于请求间隔 | 非实时，延迟取决于请求间隔 | 非实时，默认3秒延迟，延迟可自定义 |

### 总结

通过对上面两种对通讯技术比较，可以从不同的角度考虑；

- 兼容性: 短轮询 > 长轮询 > EventSource
- 性能: EvenSource > 长轮询 > 短轮询
- 服务端推送: EventSource > 长连接 （短轮询基本不考虑）

## 十一、WebSocket 是什么原理？为什么可以实现持久连接？

### WebSocket 机制

以下简要介绍一下WebSocket的原理及运行机制。

WebSocket是HTML5下一种新的协议。它实现了浏览器与服务器全双工通信，能更好的节省服务器资源和带宽并达到实时通讯的目的。它与HTTP一样通过已建立的TCP连接来传输数据，但是它和HTTP最大不同是：

- WebSocket是一种双向通信协议。在建立连接后，WebSocket服务器端和客户端都能主动向对方发送或接收数据，就像Socket一样；
- WebSocket需要像TCP一样，先建立连接，连接成功后才能相互通信。

传统HTTP客户端与服务器请求响应模式如下图所示：

![传统HTTP客户端与服务器请求响应模型](https://user-images.githubusercontent.com/8088864/125600810-db0eaedf-6a66-4d71-b9c6-1a5d891a7b86.jpg)

WebSocket模式客户端与服务器请求响应模式如下图：

![WebSocket模式客户端与服务器请求响应模式](https://user-images.githubusercontent.com/8088864/125600954-0e796b1d-dd3a-482c-ab83-0d43f1abf610.jpg)

上图对比可以看出，相对于传统HTTP每次请求-响应都需要客户端与服务端建立连接的模式，WebSocket是类似Socket的TCP长连接通讯模式。一旦WebSocket连接建立后，后续数据都以帧序列的形式传输。在客户端断开WebSocket连接或Server端中断连接前，不需要客户端和服务端重新发起连接请求。在海量并发及客户端与服务器交互负载流量大的情况下，极大的节省了网络带宽资源的消耗，有明显的性能优势，且客户端发送和接受消息是在同一个持久连接上发起，实时性优势明显。

相比HTTP长连接，WebSocket有以下特点：

- 是真正的全双工方式，建立连接后客户端与服务器端是完全平等的，可以互相主动请求。而HTTP长连接基于HTTP，是传统的客户端对服务器发起请求的模式。
- HTTP长连接中，每次数据交换除了真正的数据部分外，服务器和客户端还要大量交换HTTP header，信息交换效率很低。Websocket协议通过第一个request建立了TCP连接之后，之后交换的数据都不需要发送 HTTP header就能交换数据，这显然和原有的HTTP协议有区别所以它需要对服务器和客户端都进行升级才能实现（主流浏览器都已支持HTML5）。此外还有 multiplexing、不同的URL可以复用同一个WebSocket连接等功能。这些都是HTTP长连接不能做到的。

### WebSocket协议的原理

与http协议一样，WebSocket协议也需要通过已建立的TCP连接来传输数据。具体实现上是通过http协议建立通道，然后在此基础上用真正的WebSocket协议进行通信，所以WebSocket协议和http协议是有一定的交叉关系的。

![WebSocket协议原理流程图](https://user-images.githubusercontent.com/8088864/125603352-ba55e8bd-f554-4ef1-8c0c-add611f63023.jpg)

下面是WebSocket协议请求头：

![WebSocket协议请求头](https://user-images.githubusercontent.com/8088864/125603469-ef8dfb8e-988a-4bc6-a041-487f697cb72a.jpg)

其中请求头中重要的字段：

``` request header
Connection:Upgrade

Upgrade:websocket

Sec-WebSocket-Extensions:permessage-deflate; client_max_window_bits

Sec-WebSocket-Key:mg8LvEqrB2vLpyCNnCJV3Q==

Sec-WebSocket-Version:13
```

1. Connection和Upgrade字段告诉服务器，客户端发起的是WebSocket协议请求
2. Sec-WebSocket-Extensions表示客户端想要表达的协议级的扩展
3. Sec-WebSocket-Key是一个Base64编码值，由浏览器随机生成
4. Sec-WebSocket-Version表明客户端所使用的协议版本

而得到的响应头中重要的字段：

``` response header
Connection:Upgrade

Upgrade:websocket

Sec-WebSocket-Accept:AYtwtwampsFjE0lu3kFQrmOCzLQ=
```

1. Connection和Upgrade字段与请求头中的作用相同

2. Sec-WebSocket-Accept表明服务器接受了客户端的请求

``` response header
Status Code:101 Switching Protocols
```

并且http请求完成后响应的状态码为101，表示切换了协议，说明WebSocket协议通过http协议来建立运输层的TCP连接，之后便与http协议无关了。

### WebSocket协议的优缺点

优点：

- WebSocket协议一旦建议后，互相沟通所消耗的请求头是很小的
- 服务器可以向客户端推送消息了

缺点：

- 少部分浏览器不支持，浏览器支持的程度与方式有区别

WebSocket协议的应用场景

- 即时聊天通信
- 多玩家游戏
- 在线协同编辑/编辑
- 实时数据流的拉取与推送
- 体育/游戏实况
- 实时地图位置

一个使用WebSocket应用于视频的业务思路如下：

- 使用心跳维护websocket链路，探测客户端端的网红/主播是否在线
- 设置负载均衡7层的proxy_read_timeout默认为60s
- 设置心跳为50s，即可长期保持Websocket不断开

## 十二、Sass

Sass (英文全称：Syntactically Awesome Stylesheets) 是一个最初由 Hampton Catlin 设计并由 Natalie Weizenbaum 开发的层叠样式表语言。

Sass 是一个 CSS 预处理器。

Sass 是 CSS 扩展语言，可以帮助我们减少 CSS 重复的代码，节省开发时间。

Sass 完全兼容所有版本的 CSS。

Sass 扩展了 CSS3，增加了规则、变量、混入、选择器、继承、内置函数等等特性。

Sass 生成良好格式化的 CSS 代码，易于组织和维护。

Sass 文件后缀为 `.scss`。

浏览器并不支持 Sass 代码。因此，你需要使用一个 Sass 预处理器将 Sass 代码转换为 CSS 代码。

## 十三、三栏弹性布局的5种方法(绝对定位、圣杯、双飞翼、flex、grid)

### 需求

用css实现三栏布局，html结构代码如下，顺序不能变（main优先渲染），可以适当加元素，同时要求left宽度200px，right宽度300px，main宽度自适应。

``` html
<div class="container">
  <div class="main">main 宽度自适应</div>
  <div class="left">left 宽200px</div>
  <div class="right">right 宽300px</div>
</div>
```

![三栏布局](https://user-images.githubusercontent.com/8088864/125612523-d7b144ff-a0a3-4522-ad8b-c2a7179198c2.gif)

### 5种具体实现和优缺点比较

#### 1. 绝对定位布局

原始的布局方法

- 原理：container为相对定位并设置左右padding为left和right的宽度，left\right绝对定位在左右两侧，main不用设置。

- 优点：兼容好、原理简单

- 缺点：left和right都为绝对定位，高度不能撑开container

``` html
<!DOCTYPE html>
<head>
  <meta charset="UTF-8">
  <title>绝对定位布局</title>
</head>
<style>
  .container {
    color: #fff;
    position: relative;
    padding: 0 300px 0 200px;
  }

  .left,
  .main,
  .right {
    top: 0;
    min-height: 100px;
  }

  .left {
    position: absolute;
    width: 200px;
    background: blue;
    left: 0;
  }

  .right {
    position: absolute;
    width: 300px;
    background: red;
    right: 0;
  }

  .main {
    background: green;
  }
</style>
<body>
  <div class="container">
    <div class="main">main 宽度自适应</div>
    <div class="left">left 宽200px</div>
    <div class="right">right 宽300px</div>
  </div>
</body>
</html>
```

#### 2. 圣杯布局

圣杯布局方法

- 原理：container设置左右padding为left和right的宽度，left\right\main 浮动，left\right相对定位并设置left、right、margin-left来偏移位置，main宽100%。
- 优点：兼容好
- 缺点：原理复制，left/right/main高度自适应情况下3者不能高度一致。

``` html
<!DOCTYPE html>
<head>
  <meta charset="UTF-8">
  <title>圣杯布局</title>
</head>
<style>
  .container {
    color: #fff;
    overflow: hidden;
    padding: 0 300px 0 200px;
  }

  .left,
  .main,
  .right {
    float: left;
    position: relative;
    min-height: 100px;
  }

  .left {
    width: 200px;
    background: blue;
    margin-left: -100%;
    left: -200px;
  }

  .right {
    width: 300px;
    background: red;
    margin-left: -300px;
    right: -300px;
  }

  .main {
    width: 100%;
    background: green;
  }
</style>
<body>
  <div class="container">
    <div class="main">main 宽度自适应</div>
    <div class="left">left 宽200px</div>
    <div class="right">right 宽300px</div>
  </div>
</body>
</html>
```

#### 3. 双飞翼布局

圣杯布局改进方法

- 原理：left\right\main 浮动，left\right设置margin-left来偏移位置，main宽100%，main出入content，并设置content的左右边距为left\right宽度
- 优点：兼容好，原理简单
- 缺点：left/right/main高度自适应情况下3者不能高度一致。

``` html
<!DOCTYPE html>
<head>
  <meta charset="UTF-8">
  <title>双飞翼布局</title>
</head>
<style>
  .container {
    color: #fff;
    overflow: hidden;
  }

  .left,
  .main,
  .right {
    float: left;
    min-height: 100px;
  }

  .left {
    width: 200px;
    background: blue;
    margin-left: -100%;
  }

  .right {
    width: 300px;
    background: red;
    margin-left: -300px;
  }

  .main {
    width: 100%;
    background: green;
  }

  .content {
    margin: 0 300px 0 200px;
  }
</style>
<body>
  <div class="container">
    <div class="main">
      <div class="content">
        main 宽度自适应
      </div>
    </div>
    <div class="left">left 宽200px</div>
    <div class="right">right 宽300px</div>
  </div>
</body>
</html>
```

#### 4. flex布局

css3新布局方式

- 原理：container设置`display:flex`，left设置`order:-1`排在最前面，main设置`flex-grow:1`自适应宽度
- 优点：原理简单，代码简洁，left/right/main高度自适应情况下3者能高度一致
- 缺点：兼容性不够好，ie10+，chrome20+，正式使用要加各种前缀（-webkit--ms-）

``` html
<!DOCTYPE html>
<head>
  <meta charset="UTF-8">
  <title>flex布局</title>
</head>
<style>
  .container {
    color: #fff;
    display: flex;
  }

  .left,
  .main,
  .right {
    min-height: 100px;
  }

  .left {
    order: -1;
    width: 200px;
    background: blue;
  }

  .right {
    width: 300px;
    background: red;
  }

  .main {
    flex-grow: 1;
    background: green;
  }
</style>
<body>
  <div class="container">
    <div class="main">main 宽度自适应</div>
    <div class="left">left 宽200px</div>
    <div class="right">right 宽300px</div>
  </div>
</body>
</html>
```

#### 5. grid布局

css3新布局方式

- 原理：container设置`display:grid` 和 `grid-template-columns:200px auto 300px`，left设置`order: -1`排在最前面
- 优点：原理简单，代码简洁，left/right/main高度自适应情况下3者能高度一致
- 缺点：兼容性较差，ie10+，Chrome57+，正式使用要加各种前缀（-webkit--ms-）

``` html
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <title>grid布局</title>
</head>
<style>
  .container {
    color: #fff;
    display: grid;
    grid-template-columns: 200px auto 300px;
  }

  .left,
  .main,
  .right {
    min-height: 100px;
  }

  .left {
    order: -1;
    background: blue;
  }

  .right {
    background: red;
  }

  .main {
    background: green;
  }
</style>
<body>
  <div class="container">
    <div class="main">main 宽度自适应</div>
    <div class="left">left 宽200px</div>
    <div class="right">right 宽300px</div>
  </div>
</body>
</html>
```

## 十四、浅析CSS里的BFC和IFC的用法

### BFC简介

所谓的 Formatting Context(格式化上下文), 它是 W3C CSS2.1 规范中的一个概念。

- 格式化上下文(FC)是页面中的一块渲染区域，并且有一套渲染规则。
- 格式化上下文(FC)决定了其子元素将如何定位，以及和其他元素的关系和相互作用。

Block Formatting Context (BFC，块级格式化上下文)，就是一个块级元素的渲染显示规则。通俗一点讲，可以把 BFC 理解为一个封闭的大箱子，容器里面的子元素不会影响到外面的元素，反之也如此。

BFC的布局规则如下：

1. 内部的盒子会在垂直方向，一个个地放置；
2. BFC是页面上的一个隔离的独立容器；
3. 属于同一个BFC的 两个相邻Box的 上下margin会发生重叠；
4. 计算BFC的高度时，浮动元素也参与计算；
5. 每个元素的左边，与包含的盒子的左边相接触，即使存在浮动也是如此；
6. BFC的区域不会与float重叠。

那么如何触发 BFC 呢？只要元素满足下面任一条件即可触发 BFC 特性：

- body 根元素；
- 浮动元素：float 不为none的属性值；
- 绝对定位元素：position (absolute、fixed)；
- display为： inline-block、table-cells、flex；
- overflow 除了visible以外的值 (hidden、auto、scroll)。

### BFC的特性及应用

#### 同一个 BFC下外边距 会发生折叠

``` html
<!DOCTYPE html>
<head>
<style>
  .p {
    width: 200px;
    height: 50px;
    margin: 50px 0;
    background-color: red;
  }
</style>
</head>
<body>
  <div class="p"></div>
  <div class="p"></div>
</body>
</html>
```

效果如下所示:

![同一个 BFC 下两个相邻的普通流中的块元素垂直方向上的 margin会折叠](https://user-images.githubusercontent.com/8088864/125714340-57813f51-5cad-4844-9247-2ba5cc04ac8d.jpg)

根据BFC规则的第3条：

盒子垂直方向的距离由margin决定，

属于 同一个BFC的 + 两个相邻Box的 + 上下margin 会发生重叠。

上文的例子 之所以发生外边距折叠，是因为他们 同属于 body这个根元素， 所以我们需要让 它们 不属于同一个BFC，就能避免外边距折叠：

``` html
<!DOCTYPE html>
<head>
<style>
  .wrap {
    overflow: hidden;
  }

  .p {
    width: 200px;
    height: 50px;
    margin: 50px 0;
    background-color: red;
  }
</style>
</head>
<body>
  <div class="p"></div>
  <div class="wrap">
    <div class="p"></div>
  </div>
</body>
</html>
```

效果如下所示:

![利用 BFC 下可以避免两个相邻的块元素垂直方向上的 margin折叠](https://user-images.githubusercontent.com/8088864/125714635-3ff51432-6415-40df-938d-c4c2fe654ca2.jpg)

#### BFC可以包含浮动的元素(清除浮动)

正常情况下，浮动的元素会脱离普通文档流，所以下面的代码里：

``` html
<!DOCTYPE html>
<head>
<style>
  .wrap {
    border: 1px solid #000;
  }

  .p {
    width: 200px;
    height: 50px;
    background-color: #eee;
    float: left;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="p"></div>
  </div>
</body>
</html>
```

外层的div会无法包含 内部浮动的div。

效果如下所示:

![外层的div会无法包含内部浮动的div](https://user-images.githubusercontent.com/8088864/125714940-1de23469-a365-47f4-82ab-3a89fea5441b.jpg)

但如果我们 触发外部容器的BFC，根据BFC规范中的第4条：计算BFC的高度时，浮动元素也参与计算，那么外部div容器就可以包裹着浮动元素，所以只要把代码修改如下：

``` html
<!DOCTYPE html>
<head>
<style>
  .wrap {
    border: 1px solid #000;
    overflow: hidden;
  }

  .p {
    width: 200px;
    height: 50px;
    background-color: #eee;
    float: left;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="p"></div>
  </div>
</body>
</html>
```

效果如下所示:

![利用BFC外层的div会包含内部浮动的div](https://user-images.githubusercontent.com/8088864/125715066-4a11c8a9-caef-4258-acfb-87e3cc8b8302.jpg)

#### BFC可以阻止元素被浮动元素覆盖

正常情况下，浮动的元素会脱离普通文档流，会覆盖着普通文档流的元素上。所以下面的代码里：

``` html
<!DOCTYPE html>
<head>
<style>
.aside {
  width: 100px;
  height: 150px;
  float: left;
  background: black;
}

.main {
  width: 300px;
  height: 200px;
  background-color: red;
}
</style>
</head>
<body>
  <div class="aside"></div>
  <div class="main"></div>
</body>
</html>
```

效果如下所示:

![浮动的元素会脱离普通文档流，会覆盖着普通文档流的元素上](https://user-images.githubusercontent.com/8088864/125716169-ccf5e6b4-f51e-431e-8aff-0b8e753b88a8.png)


之所以是这样，是因为上文的 规则5： 每个元素的左边，与包含的盒子的左边相接触，即使存在浮动也是如此；

所以要想改变效果，使其互补干扰，就得利用规则6 ：BFC的区域不会与float重叠，让 \<div class="main"> 也能触发BFC的性质。

将代码改成下列所示:

``` html
<!DOCTYPE html>
<head>
<style>
.aside {
  width: 100px;
  height: 150px;
  float: left;
  background: black;
}

.main {
  width: 300px;
  height: 200px;
  background-color: red;
  overflow: hidden;
}
</style>
</head>
<body>
  <div class="aside"></div>
  <div class="main"></div>
</body>
</html>
```

效果如下所示：

![利用BFC可以阻止元素被浮动元素覆盖](https://user-images.githubusercontent.com/8088864/125716325-7b9fe487-9b6e-4d35-b8b7-33839bb9ebce.png)

通过这种方法，就能 用来实现 两列的自适应布局。

### 简要介绍IFC

1. 框会从包含块的顶部开始，一个接一个地水平摆放。

2. 摆放这些框时，它们在水平方向的 内外边距+边框 所占用的空间都会被考虑；
    在垂直方向上，这些框可能会以不同形式来对齐；
    水平的margin、padding、border有效，垂直无效，不能指定宽高。

3. 行框的宽度是 由包含块和存在的浮动来决定;
  行框的高度 由行高来决定。

## 十五、浅析CSS的性能优化：transform与position区别、硬件加速工作原理及注意事项、强制使用GPU渲染的友好CSS属性

在网上看到一个这样的问题： transform与position:absolute 有什么区别？查阅资料后发现这道题目其实不简单，涉及到重排、重绘、硬件加速等网页优化的知识。

### 问题背景

过去几年，我们常常会听说硬件加速给移动端带来了巨大的体验提升，但是即使对于很多经验丰富的开发者来说，恐怕对其背后的工作原理也是模棱两可，更不要合理地将其运用到网页的动画效果中了。

#### 1. position + top/left 的效果

下面让我们来看一个动画效果，在该动画中包含了几个堆叠在一起的球并让它们沿相同路径移动。最简单的方式就是实时调整它们的 left 和 top 属性，使用 css 动画实现。

``` html
<!DOCTYPE html>
<head>
<style>
  html,
  body {
    width: 100%;
    height: 100%;
  }

  .ball-running {
    animation: run-around 4s infinite;
    width: 100px;
    height: 100px;
    background-color: red;
    position: absolute;
  }

  @keyframes run-around {
    0%: {
      top: 0;
      left: 0;
    }
    25% {
      top: 0;
      left: 200px;
    }
    50% {
      top: 200px;
      left: 200px;
    }
    75% {
      top: 200px;
      left: 0;
    }
  }
</style>
</head>
<body>
  <div class="ball-running"></div>
</body>
</html>
```

在运行的时候，即使是在电脑浏览器上也会隐约觉得动画的运行并不流畅，动画有些停顿的感觉，更不要提在移动端达到 60fps 的流畅效果了。这是因为top和left的改变会触发浏览器的 reflow 和 repaint ，整个动画过程都在不断触发浏览器的重新渲染，这个过程是很影响性能的。

#### 2. transform 的效果

为了解决这个问题，我们使用 transform 中的 translate() 来替换 top 和 left ，重写一下这个动画效果。


``` html
<!DOCTYPE html>
<head>
<style>
  html,
  body {
    width: 100%;
    height: 100%;
  }

  .ball-running {
    animation: run-around 4s infinite;
    width: 100px;
    height: 100px;
    background-color: red;
  }

  @keyframes run-around {
    0%: {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(200px, 0);
    }
    50% {
      transform: translate(200px, 200px);
    }
    75% {
      transform: translate(0, 200px);
    }
  }
</style>
</head>
<body>
  <div class="ball-running"></div>
</body>
</html>
```

这时候会发现整个动画效果流畅了很多，在动画移动的过程中也没有发生repaint和reflow。

那么，为什么 transform 没有触发 repaint 呢？原因就是：transform 动画由GPU控制，支持硬件加速，并不需要软件方面的渲染。

### 硬件加速工作原理

浏览器接收到页面文档后，会将文档中的标记语言解析为DOM树，DOM树和CSS结合后形成浏览器构建页面的渲染树，渲染树中包含了大量的渲染元素，每一个渲染元素会被分到一个图层中，每个图层又会被加载到GPU形成渲染纹理，而图层在GPU中 transform 是不会触发 repaint 的，这一点非常类似3D绘图功能，最终这些使用transform的图层都会使用独立的合成器进程进行处理。

在我们的示例中，CSS  transform  创建了一个新的复合图层，可以被GPU直接用来执行 transform 操作。在chrome开发者工具中开启“show layer borders”选项后，每个复合图层就会显示一条黄色的边界。示例中的球就处于一个独立的复合图层，移动时的变化也是独立的。

此时，你也许会问：浏览器什么时候会创建一个独立的复合图层呢？事实上一般是在以下几种情况下：

  1. 3D 或者 CSS transform
  2. video或canvas标签
  3. CSS filters
  4. 元素覆盖时，比如使用了 z-index 属性

等一下，上面的示例使用的是 2D transform 而不是 3D transform 啊？这个说法没错，所以在timeline中我们可以看到：动画开始和结束的时候发生了两次 repaint 操作。

![CSS transform网页的重绘时间轴](https://user-images.githubusercontent.com/8088864/125720131-5776ac63-b267-4699-9cbf-06a86c80689b.png)

3D 和 2D transform 的区别就在于，浏览器在页面渲染前为3D动画创建独立的复合图层，而在运行期间为2D动画创建。

动画开始时，生成新的复合图层并加载为GPU的纹理用于初始化 repaint，然后由GPU的复合器操纵整个动画的执行，最后当动画结束时，再次执行 repaint 操作删除复合图层。

### 使用 GPU 渲染元素

#### 能触发GPU渲染的属性

并不是所有的CSS属性都能触发GPU的硬件加速，实际上只有少数属性可以，比如下面的这些：

1. transform
2. opacity
3. filter

#### 强制使用GPU渲染

为了避免 2D transform 动画在开始和结束时发生的 repaint 操作，我们可以硬编码一些样式来解决这个问题：

``` css
.exam1 {
  transform: translateZ(0);
}

.exam2 {
  transform: rotateZ(360deg);
}
```

这段代码的作用就是让浏览器执行 3D transform，浏览器通过该样式创建了一个独立图层，图层中的动画则有GPU进行预处理并且触发了硬件加速。

#### 使用硬件加速需要注意的事项

使用硬件加速并不是十全十美的事情，比如：

1. 内存。如果GPU加载了大量的纹理，那么很容易就会发生内存问题，这一点在移动端浏览器上尤为明显，所以，一定要牢记不要让页面的每个元素都使用硬件加速。
2. 使用GPU渲染会影响字体的抗锯齿效果。这是因为GPU和CPU具有不同的渲染机制，即使最终硬件加速停止了，文本还是会在动画期间显示得很模糊。

#### will-change

浏览器还提出了一个 will-change 属性，该属性允许开发者告知浏览器哪一个属性即将发生变化，从而为浏览器对该属性进行优化提供了时间。下面是一个使用 will-change 的示例

``` css
.exam3 {
  will-change: transform;
}
```

缺点在于其兼容性不大好。

### 总结

1. transform 会使用 GPU 硬件加速，性能更好；position + top/left 会触发大量的重绘和回流，性能影响较大。
2. 硬件加速的工作原理是创建一个新的复合图层，然后使用合成线程进行渲染。
3. 3D 动画 与 2D 动画的区别；2D动画会在动画开始和动画结束时触发2次重新渲染。
4. 使用GPU可以优化动画效果，但是不要滥用，会有内存问题。
5. 理解强制触发硬件加速的 transform 技巧，使用对GPU友好的CSS属性。

## 十六、深入解析你不知道的 EventLoop 和浏览器渲染、帧动画、空闲回调

### 前言

关于 Event Loop 的文章很多，但是有很多只是在讲「宏任务」、「微任务」，我先提出几个问题：

1. 每一轮 Event Loop 都会伴随着渲染吗？
2. requestAnimationFrame 在哪个阶段执行，在渲染前还是后？在 microTask 的前还是后？
3. requestIdleCallback 在哪个阶段执行？如何去执行？在渲染前还是后？在 microTask 的前还是后？
4. resize、scroll 这些事件是何时去派发的。

这些问题并不是刻意想刁难你，如果你不知道这些，那你可能并不能在遇到一个动画需求的时候合理的选择 requestAnimationFrame，你可能在做一些需求的时候想到了 requestIdleCallback，但是你不知道它运行的时机，只是胆战心惊的去用它，祈祷不要出线上 bug。

这也是本文想要从规范解读入手，深挖底层的动机之一。本文会酌情从规范中排除掉一些比较晦涩难懂，或者和主流程不太相关的概念。更详细的版本也可以直接去读这个规范，不过比较费时费力。

### 事件循环

我们先依据HTML 官方规范从浏览器的事件循环讲起，因为剩下的 API 都在这个循环中进行，它是浏览器调度任务的基础。

#### 定义

为了协调事件，用户交互，脚本，渲染，网络任务等，浏览器必须使用本节中描述的事件循环。

#### 流程

1. 从任务队列中取出一个宏任务并执行。

2. 检查微任务队列，执行并清空微任务队列，如果在微任务的执行中又加入了新的微任务，也会在这一步一起执行。

3. 进入更新渲染阶段，判断是否需要渲染，这里有一个 rendering opportunity 的概念，也就是说不一定每一轮 event loop 都会对应一次浏览器渲染，要根据屏幕刷新率、页面性能、页面是否在后台运行来共同决定，通常来说这个渲染间隔是固定的。（所以多个 task 很可能在一次渲染之间执行）

  - 浏览器会尽可能的保持帧率稳定，例如页面性能无法维持 60fps（每 16.66ms 渲染一次）的话，那么浏览器就会选择 30fps 的更新速率，而不是偶尔丢帧。
  - 如果浏览器上下文不可见，那么页面会降低到 4fps 左右甚至更低。
  - 如果满足以下条件，也会跳过渲染：

    1. 浏览器判断更新渲染不会带来视觉上的改变。
    2. map of animation frame callbacks 为空，也就是帧动画回调为空，可以通过 requestAnimationFrame 来请求帧动画。

4. 如果上述的判断决定本轮不需要渲染，那么下面的几步也不会继续运行：
  This step enables the user agent to prevent the steps below from running for other reasons, for example, to ensure certain tasks are executed immediately after each other, with only microtask checkpoints interleaved (and without, e.g., animation frame callbacks interleaved). Concretely, a user agent might wish to coalesce timer callbacks together, with no intermediate rendering updates. 有时候浏览器希望两次「定时器任务」是合并的，他们之间只会穿插着 microTask的执行，而不会穿插屏幕渲染相关的流程（比如requestAnimationFrame，下面会写一个例子）。

5. 对于需要渲染的文档，如果窗口的大小发生了变化，执行监听的 `resize` 方法。

6. 对于需要渲染的文档，如果页面发生了滚动，执行 `scroll` 方法。

7. 对于需要渲染的文档，执行帧动画回调，也就是 `requestAnimationFrame` 的回调。（后文会详解）

8. 对于需要渲染的文档，执行 `IntersectionObserver` 的回调。

9. 对于需要渲染的文档，**重新渲染**绘制用户界面。

10. 判断 `task队列`和`microTask队列`是否都为空，如果是的话，则进行 `Idle` 空闲周期的算法，判断是否要执行 `requestIdleCallback` 的回调函数。（后文会详解）

对于 `resize` 和 `scroll` 来说，并不是到了这一步才去执行滚动和缩放，那岂不是要延迟很多？浏览器当然会立刻帮你滚动视图，根据CSSOM 规范所讲，浏览器会保存一个 `pending scroll event targets`，等到事件循环中的 `scroll` 这一步，去派发一个事件到对应的目标上，驱动它去执行监听的回调函数而已。`resize` 也是同理。
可以在这个流程中仔细看一下「宏任务」、「微任务」、「渲染」之间的关系。
多任务队列

#### 多任务队列

task 队列并不是我们想象中的那样只有一个，根据规范里的描述：

An event loop has one or more task queues. For example, a user agent could have one task queue for mouse and key events (to which the user interaction task source is associated), and another to which all other task sources are associated. Then, using the freedom granted in the initial step of the event loop processing model, it could give keyboard and mouse events preference over other tasks three-quarters of the time, keeping the interface responsive but not starving other task queues. Note that in this setup, the processing model still enforces that the user agent would never process events from any one task source out of order.

事件循环中可能会有一个或多个任务队列，这些队列分别为了处理：

1. 鼠标和键盘事件
2. 其他的一些 Task

览器会在保持任务顺序的前提下，可能分配四分之三的优先权给鼠标和键盘事件，保证用户的输入得到最高优先级的响应，而剩下的优先级交给其他 Task，并且保证不会“饿死”它们。

这个规范也导致 Vue 2.0.0-rc.7 这个版本 `nextTick` 采用了从微任务 `MutationObserver` 更换成宏任务 `postMessage` 而导致了一个 [Issue](https://github.com/vuejs/vue/issues/3771#issuecomment-249692588)。
目前由于一些“未知”的原因，`jsfiddle` 的案例打不开了。简单描述一下就是采用了 `task` 实现的 `nextTick`，在用户持续滚动的情况下 `nextTick` 任务被延后了很久才去执行，导致动画跟不上滚动了。

迫于无奈，尤大还是改回了 `microTask` 去实现 `nextTick`，当然目前来说 `promise.then` 微任务已经比较稳定了，并且 Chrome 也已经实现了 `queueMicroTask` 这个官方 API。不久的未来，我们想要调用微任务队列的话，也可以节省掉实例化 `Promise` 在开销了。

从这个 Issue 的例子中我们可以看出，稍微去深入了解一下规范还是比较有好处的，以免在遇到这种比较复杂的 Bug 的时候一脸懵逼。

#### requestAnimationFrame

在解读规范的过程中，我们发现 `requestAnimationFrame` 的回调有两个特征：

1. 在重新渲染前调用。
2. 很可能在宏任务之后不调用。

我们来分析一下，为什么要在重新渲染前去调用？因为 `rAF` 是官方推荐的用来做一些流畅动画所应该使用的 API，做动画不可避免的会去更改 DOM，而如果在渲染之后再去更改 DOM，那就只能等到下一轮渲染机会的时候才能去绘制出来了，这显然是不合理的。

`rAF`在浏览器决定渲染之前给你最后一个机会去改变 DOM 属性，然后很快在接下来的绘制中帮你呈现出来，所以这是做流畅动画的不二选择。下面我用一个 setTimeout的例子来对比。

##### 闪烁动画

假设我们现在想要快速的让屏幕上闪烁 红、蓝两种颜色，保证用户可以观察到，如果我们用 `setTimeout` 来写，并且带着我们长期的误解「宏任务之间一定会伴随着浏览器绘制」，那么你会得到一个预料之外的结果。

``` js
setTimeout(() => {
  document.body.style.background = "red";
  setTimeout(() => {
    document.body.style.background = "blue";
  });
});
```

![setTimeout闪烁动画](https://user-images.githubusercontent.com/8088864/125749050-c757f81e-6482-4262-a0d4-c455eb78d4f4.gif)

以看出这个结果是非常不可控的，如果这两个 `Task` 之间正好遇到了浏览器认定的渲染机会，那么它会重绘，否则就不会。由于这俩宏任务的间隔周期太短了，所以很大概率是不会的。

如果你把延时调整到 17ms 那么重绘的概率会大很多，毕竟这个是一般情况下 60fps 的一个指标。但是也会出现很多不绘制的情况，所以并不稳定。
如果你依赖这个 API 来做动画，那么就很可能会造成「掉帧」。

接下来我们换成 rAF 试试？我们用一个递归函数来模拟 10 次颜色变化的动画。

``` js
let i = 10;
let req = () => {
  i--;
  requestAnimationFrame(() => {
    document.body.style.background = "red";
    requestAnimationFrame(() => {
      document.body.style.background = "blue";
      if (i > 0) {
        req();
      }
    });
  });
};

req();
```

这里由于颜色变化太快，gif 录制软件没办法截出这么高帧率的颜色变换，所以各位可以放到浏览器中自己执行一下试试，我这边直接抛结论，浏览器会非常规律的把这 10 组也就是 20 次颜色变化绘制出来，可以看下 performance 面板记录的表现：

![requestAnimationFrame闪烁动画](https://user-images.githubusercontent.com/8088864/125750295-ab491df6-c612-4add-b2fe-8819fcf47ef1.png)

##### 定时器合并

在第一节解读规范的时候，第 4 点中提到了，定时器宏任务可能会直接跳过渲染。

按照一些常规的理解来说，宏任务之间理应穿插渲染，而定时器任务就是一个典型的宏任务，看一下以下的代码：

``` js
setTimeout(() => {
  console.log("sto1")
  requestAnimationFrame(() => console.log("rAF1"))
})
setTimeout(() => {
  console.log("sto2")
  requestAnimationFrame(() => console.log("rAF2"))
})

queueMicrotask(() => console.log("mic1"))
queueMicrotask(() => console.log("mic2"))
```

从直觉上来看，顺序是不是应该是：

``` text
mic1
mic2
sto1
rAF1
sto2
rAF2
```

呢？也就是每一个宏任务之后都紧跟着一次渲染。

实际上不会，浏览器会合并这两个定时器任务：

``` text
mic1
mic2
sto1
sto2
rAF1
rAF2
```

#### requestIdleCallback

#### 草案解读

我们都知道 `requestIdleCallback` 是浏览器提供给我们的空闲调度算法，关于它的简介可以看 [MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)，意图是让我们把一些计算量较大但是又没那么紧急的任务放到空闲时间去执行。不要去影响浏览器中优先级较高的任务，比如动画绘制、用户输入等等。

React 的时间分片渲染就想要用到这个 API，不过目前浏览器支持的不给力，他们是自己去用 postMessage 实现了一套。

**渲染有序进行**

首先看一张图，很精确的描述了这个 API 的意图：

![浏览器渲染有序调度](https://user-images.githubusercontent.com/8088864/125756615-7bec3496-94cc-46ba-9298-5df48b99d2d8.png)

当然，这种有序的 `浏览器 -> 用户 -> 浏览器 -> 用户` 的调度基于一个前提，就是我们要把任务切分成比较小的片，不能说浏览器把空闲时间让给你了，你去执行一个耗时 10s 的任务，那肯定也会把浏览器给阻塞住的。这就要求我们去读取 `rIC` 提供给你的 `deadline` 里的时间，去动态的安排我们切分的小任务。浏览器信任了你，你也不能辜负它呀。

**渲染长期空闲**

![浏览器渲染长期空闲调度](https://user-images.githubusercontent.com/8088864/125756805-79afd49b-e62d-45b9-bb7e-4a4b34eb7bd4.png)

还有一种情况，也有可能在几帧的时间内浏览器都是空闲的，并没有发生任何影响视图的操作，它也就不需要去绘制页面：
这种情况下为什么还是会有 50ms 的 deadline 呢？是因为浏览器为了提前应对一些可能会突发的用户交互操作，比如用户输入文字。如果给的时间太长了，你的任务把主线程卡住了，那么用户的交互就得不到回应了。50ms 可以确保用户在无感知的延迟下得到回应。

MDN 文档中的[幕后任务协作调度 API](https://developer.mozilla.org/zh-CN/docs/Web/API/Background_Tasks_API)  介绍的比较清楚，来根据里面的概念做个小实验：

屏幕中间有个红色的方块，把 MDN 文档中[requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame)的范例部分的动画代码直接复制过来。

草案中还提到：

1. 当浏览器判断这个页面对用户不可见时，这个回调执行的频率可能被降低到 10 秒执行一次，甚至更低。这点在解读 EventLoop 中也有提及。

2. 如果浏览器的工作比较繁忙的时候，不能保证它会提供空闲时间去执行 rIC 的回调，而且可能会长期的推迟下去。所以如果你需要保证你的任务在一定时间内一定要执行掉，那么你可以给 rIC 传入第二个参数 timeout。
这会强制浏览器不管多忙，都在超过这个时间之后去执行 rIC 的回调函数。所以要谨慎使用，因为它会打断浏览器本身优先级更高的工作。

3. 最长期限为 50 毫秒，是根据研究得出的，研究表明，人们通常认为 100 毫秒内对用户输入的响应是瞬时的。 将闲置截止期限设置为 50ms 意味着即使在闲置任务开始后立即发生用户输入，浏览器仍然有剩余的 50ms 可以在其中响应用户输入而不会产生用户可察觉的滞后。

4. 每次调用 timeRemaining() 函数判断是否有剩余时间的时候，如果浏览器判断此时有优先级更高的任务，那么会动态的把这个值设置为 0，否则就是用预先设置好的 deadline - now 去计算。

5. 这个 timeRemaining() 的计算非常动态，会根据很多因素去决定，所以不要指望这个时间是稳定的。

#### 动画例子

**滚动**

如果我鼠标不做任何动作和交互，直接在控制台通过 rIC 去打印这次空闲任务的剩余时间，一般都稳定维持在 49.xx ms，因为此时浏览器没有什么优先级更高的任务要去处理。

``` js
requestIdleCallback((deadline) => console.log(deadline.timeRemaining()))
```

![requetIdleCallback的timeRemaining时间1](https://user-images.githubusercontent.com/8088864/125778161-1e903c20-19a8-4340-83e9-af15ff16078a.gif)

而如果我不停的滚动浏览器，不断的触发浏览器的重新绘制的话，这个时间就变的非常不稳定了。

![requetIdleCallback的timeRemaining时间2](https://user-images.githubusercontent.com/8088864/125778195-dc9bc852-60e6-475d-a50e-441707e793ff.gif)

通过这个例子，你可以更加有体感的感受到什么样叫做「繁忙」，什么样叫做「空闲」。


**动画**

这个动画的例子很简单，就是利用rAF在每帧渲染前的回调中把方块的位置向右移动 10px。

``` html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      #SomeElementYouWantToAnimate {
        height: 200px;
        width: 200px;
        background: red;
      }
    </style>
  </head>
  <body>
    <div id="SomeElementYouWantToAnimate"></div>
    <script>
      var start = null;
      var element = document.getElementById("SomeElementYouWantToAnimate");
      element.style.position = "absolute";

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = timestamp - start;
        element.style.left = Math.min(progress / 10, 200) + "px";
        if (progress < 2000) {
          window.requestAnimationFrame(step);
        }
      }
      // 动画
      window.requestAnimationFrame(step);

      // 空闲调度
      window.requestIdleCallback((deadline) => {
        console.log(deadline.timeRemaining())
        alert("rIC");
      });
    </script>
  </body>
</html>
```

注意在最后我加了一个 requestIdleCallback 的函数，回调里会 alert('rIC')，来看一下演示效果：

![requetIdleCallback和requestAnmationFrame动画](https://user-images.githubusercontent.com/8088864/125778813-19d6dde2-2b12-4754-bd4c-deba1209d3e6.gif)

alert 在最开始的时候就执行了，为什么会这样呢一下，想一下「空闲」的概念，我们每一帧仅仅是把 left 的值移动了一下，做了这一个简单的渲染，没有占满空闲时间，所以可能在最开始的时候，浏览器就找到机会去调用 rIC 的回调函数了。

我们简单的修改一下 step 函数，在里面加一个很重的任务，1000 次循环打印。

``` html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      #SomeElementYouWantToAnimate {
        height: 200px;
        width: 200px;
        background: red;
      }
    </style>
  </head>
  <body>
    <div id="SomeElementYouWantToAnimate"></div>
    <script>
      var start = null;
      var element = document.getElementById("SomeElementYouWantToAnimate");
      element.style.position = "absolute";

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = timestamp - start;
        element.style.left = Math.min(progress / 10, 200) + "px";
        let i = 1000;
        while (i > 0) {
          console.log("i", i);
          i--;
        }
        if (progress < 2000) {
          window.requestAnimationFrame(step);
        }
      }

      // 动画
      window.requestAnimationFrame(step);

      // 空闲调度
      window.requestIdleCallback((deadline) => {
        console.log(deadline.timeRemaining())
        alert("rIC");
      });
    </script>
  </body>
</html>
```

再来看一下它的表现：

![requetIdleCallback和requestAnmationFrame动画很忙](https://user-images.githubusercontent.com/8088864/125779688-be382539-51e0-4462-afee-ddb5db99b2bb.gif)

其实和我们预期的一样，由于浏览器的每一帧都"太忙了",导致它真的就无视我们的 rIC 函数了。

如果给 rIC 函数加一个 timeout 呢：


``` html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      #SomeElementYouWantToAnimate {
        height: 200px;
        width: 200px;
        background: red;
      }
    </style>
  </head>
  <body>
    <div id="SomeElementYouWantToAnimate"></div>
    <script>
      var start = null;
      var element = document.getElementById("SomeElementYouWantToAnimate");
      element.style.position = "absolute";

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = timestamp - start;
        element.style.left = Math.min(progress / 10, 200) + "px";
        let i = 1000;
        while (i > 0) {
          console.log("i", i);
          i--;
        }
        if (progress < 2000) {
          window.requestAnimationFrame(step);
        }
      }

      // 动画
      window.requestAnimationFrame(step);

      // 空闲调度
      window.requestIdleCallback((deadline) => {
        console.log(deadline.timeRemaining())
        alert("rIC");
      }, { timeout: 500 });
    </script>
  </body>
</html>
```

效果如下：

![requetIdleCallback和requestAnmationFrame动画很忙再加上timeout](https://user-images.githubusercontent.com/8088864/125779998-cf9201d8-707b-4d99-aece-9e40c4f7b2a2.gif)

浏览器会在大概 500ms 的时候，不管有多忙，都去强制执行 `rIC` 函数，这个机制可以防止我们的空闲任务被“饿死”。

### 总结

通过本文的学习过程，我自己也打破了很多对于 Event Loop 以及 rAF、rIC 函数的固有错误认知，通过本文我们可以整理出以下的几个关键点。

1. 事件循环不一定每轮都伴随着重新渲染，但是如果有微任务，一定会伴随着微任务执行。
2. 决定浏览器视图是否渲染的因素很多，浏览器是非常聪明的。
3. requestAnimationFrame在重新渲染屏幕之前执行，非常适合用来做动画。
4. requestIdleCallback在渲染屏幕之后执行，并且是否有空执行要看浏览器的调度，如果你一定要它在某个时间内执行，请使用 timeout参数。
5. resize和scroll事件其实自带节流，它只在 Event Loop 的渲染阶段去派发事件到 EventTarget 上。

## 十七、React Fiber架构中，迭代器和requestIdleCallback结合的优势

### requestIdleCallback API

requestIdleCallback 是浏览器提供的 Web API，它是 React Fiber 中用到的核心 API。

#### API 介绍

[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) 利用浏览器的空余时间执行任务，如果浏览器没有空余时间，可以随时终止这些任务。

这样可以实现如果有更高优先级的任务要执行时，当前执行的任务可以被终止，优先执行高级别的任务。

原理是该方法将 在浏览器的空闲时段内调用的函数 排队。

这样使得开发者能够在主事件循环上 执行后台和低优先级的任务，而不会影响 像动画和用户交互 这些关键的延迟触发的事件。

这里的“延迟”指的是大量计算导致运行时间较长。

#### 浏览器空余时间

页面是一帧一帧绘制出来的，当每秒绘制的帧数达到 60 时，页面时流畅的，小于这个值时，用户会感觉到卡顿。

1秒60帧意思是1秒中60张画面在切换。

当帧数低于人眼的捕捉频率（有说24帧或30帧，考虑到视觉残留现象，这个数值可能会更低）时，人脑会识别这是几张图片在切换，也就是静态的。

当帧数高于人眼的捕捉频率，人脑会认为画面是连续的，也就是动态的动画。

帧数越高画面就看起来更流畅。

1秒60帧（大约 1000/60 ≈ 16ms 切换一个画面）差不多是人眼能识别卡顿的分界线。

如果每一帧执行的时间小于 16 ms，就说明浏览器有空余时间。

一帧时间内浏览器要做的事情包括：脚本执行、样式计算、布局、重绘、合成等。

如果某一项内容执行时间过长，浏览器会推迟渲染，造成丢帧卡顿，就没有剩余时间。

#### 应用场景

比如现在有一项计算任务，这项任务需要花费比较长的时间(例如超过16ms）去执行。

在执行任务的过程当中，浏览器的主线程会被一直占用。

在主线程被占用的过程中，浏览器是被阻塞的，并不能执行其他的任务。

如果此时用户想要操作页面，比如向下滑动页面查看其它内容，浏览器是不能响应用户的操作的，给用户的感觉就是页面卡死了，体验非常差。

**如何解决呢？**

可以将这项任务注册到 `requestIdleCallback` 中，利用浏览器的空余时间执行它。

当用户操作页面时，就是**优先级比较高的任务**被执行时，此时计算任务会被终止，优先响应用户的操作，这样用户就不会感觉页面发生卡顿了。

当高优先级的任务执行完成后，再继续执行计算任务。

`requestIdleCallback` 的作用就是利用浏览器的空余时间执行这些需要大量计算的任务，当空余时间结束，会中断计算任务，执行高优先级的任务，以达到不阻塞主线程任务（例如浏览器 UI 渲染）的目的。

#### 使用方式

``` js
var handle = window.requestIdleCallback(callback[, options])
```

- callback：一个在空闲时间即将被调用的回调函数
    - 该函数接收一个形参：IdleDeadline，它提供一个方法和一个属性：
      - 方法：timeRemaining()
        - 用于获取浏览器空闲期的剩余时间，也就是空余时间
          - 返回值是毫秒数
          - 如果闲置期结束，则返回 0
        - 根据时间的多少可以来决定是否要执行任务
      - 属性：didTimeout(Boolean，只读)
        - 表示是否是上一次空闲期因为超时而没有执行的回调函数
        - 超时时间由 requestIdleCallback 的参数options.timeout 定义
- options：可选配置，目前只有一个配置项
  - timeout：超时时间，如果设置了超时时间并超时，回调函数还没有被调用，则会在下一次空闲期强制被调用

#### 功能体验

页面中有两个按钮和一个 DIV，点击第一个按钮执行一项昂贵的计算，使其长期占用主线程，当计算任务执行的时候去点击第二个按钮更改页面中 DIV 的背景颜色。

``` html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>requestIdleCallback</title>
    <style>
      #box {
        background: palegoldenrod;
        padding: 20px;
        margin-bottom: 10px;
      }
    </style>
  </head>
  <body>
    <div id="box">playground</div>
    <button id="btn1">执行计算任务</button>
    <button id="btn2">更改背景颜色</button>

    <script>
      var box = document.querySelector('#box');
      var btn1 = document.querySelector('#btn1');
      var btn2 = document.querySelector('#btn2');
      var number = 100000000;
      var value = 0;

      function calc() {
        while (number > 0) {
          value = Math.random() < 0.5 ? Math.random() : Math.random();
          number--;
        }
      }

      btn1.onclick = function () {
        calc();
      }

      btn2.onclick = function () {
        console.log(number); // 0：计算任务执行完
        box.style.background = 'palegreen';
      }
    </script>
  </body>
</html>
```

![requestIdleCallback功能体验1](https://user-images.githubusercontent.com/8088864/125783134-1435e780-a620-4cbf-b8c3-c04fccd4b145.png)

使用 requestIdleCallback可以完美解决这个卡顿问题：

``` html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>requestIdleCallback</title>
    <style>
      #box {
        background: palegoldenrod;
        padding: 20px;
        margin-bottom: 10px;
      }
    </style>
  </head>
  <body>
    <div id="box">playground</div>
    <button id="btn1">执行计算任务</button>
    <button id="btn2">更改背景颜色</button>

    <script>
      var box = document.querySelector('#box');
      var btn1 = document.querySelector('#btn1');
      var btn2 = document.querySelector('#btn2');
      var number = 100000000;
      var value = 0;

      function calc(IdleDeadline) {
        while (number > 0 && IdleDeadline.timeRemaining() > 1) {
          value = Math.random() < 0.5 ? Math.random() : Math.random();
          number--;
        }

        if (number > 0) {
          requestIdleCallback(calc);
        } else {
          console.log('计算结束');
        }
      }

      btn1.onclick = function () {
        requestIdleCallback(calc);
      }

      btn2.onclick = function () {
        console.log(number); // 0：计算任务执行完
        box.style.background = 'palegreen';
      }
    </script>
  </body>
</html>
```

![requestIdleCallback功能体验2](https://user-images.githubusercontent.com/8088864/125783529-12c4da73-fe20-4757-b858-169f381efce4.png)

- 浏览器在空余时间执行 calc 函数
- 当空余时间小于 1ms 时，跳出while循环
- calc 根据 number 判断计算任务是否执行完成，如果没有完成，则继续注册新的空闲期的任务
- 当 btn2 点击事件触发，会等到当前空闲期任务执行完后执行“更改背景颜色”的任务
- “更改背景颜色”任务执行完成后，继续进入空闲期，执行后面的任务

由此可见，所谓执行优先级更高的任务，是手动将计算任务拆分到浏览器的空闲期，以实现每次进入空闲期之前优先执行主线程的任务。

### Fiber 出现的目的

Fiber 其实是 React 16 新的 DOM 比对算法的名字，旧的 DOM 比对算法的名字是 Stack。

#### React 16之前的版本存在的问题

React 16之前的版本对比更新 VirtualDOM 的过程是采用**循环加递归**实现的。

这种对比方式有一个问题，就是一旦任务开始进行就无法中断（由于递归需要一层一层的进入，一层一层的退出，所以过程不能中断）。

如果应用中组件数量庞大，主线程被长期占用，直到整棵 VirtualDOM 树对比更新完成之后主线程才能被释放，主线程才能执行其它任务。

这就会导致一些用户交互、动画等任务无法立即得到执行，页面就会产生卡顿，非常影响用户的体验。

因为递归利用的 **JavaScript 自身的执行栈**，所以旧版 DOM 比对的算法称为 **Stack(堆栈)**。

**核心问题：递归无法中断，执行重任务耗时长，JavaScript 又是单线程的，无法同时执行其它任务，导致在绘制页面的过程当中不能执行其它任务，比如元素动画、用户交互等任务必须延后，给用户的感觉就是页面变得卡顿，用户体验差。**

### Stack 算法模拟

模拟 React 16 之前将虚拟 DOM 转化成真实 DOM 的递归算法：

``` jsx
// 要渲染的 jsx
const jsx = (
  <div id="a1">
    <div id="b1">
      <div id="c1"></div>
      <div id="c2"></div>
    </div>
    <div id="b2"></div>
  </div>
)
```

jsx 会被 Babel 转化成 `React.createElement()` 的调用，最终返回一个虚拟 DOM 对象：

``` js
"use strict";

const jsx = /*#__PURE__*/React.createElement("div", {
  id: "a1"
}, /*#__PURE__*/React.createElement("div", {
  id: "b1"
}, /*#__PURE__*/React.createElement("div", {
  id: "c1"
}), /*#__PURE__*/React.createElement("div", {
  id: "c2"
})), /*#__PURE__*/React.createElement("div", {
  id: "b2"
}));
```

去掉一些属性，打印结果：

``` js
const jsx = {
  type: 'div',
  props: {
    id: 'a1',
    children: [
      {
        type: 'div',
        props: {
          id: 'b1',
          children: [
            {
              type: 'div',
              props: {
                id: 'c1'
              }
            },
            {
              type: 'div',
              props: {
                id: 'c2'
              }
            }
          ]
        }
      },
      {
        type: 'div',
        props: {
          id: 'b2'
        }
      }
    ]
  }
}
```

递归转化真实 DOM：

``` js
const jsx = {...}
function render(vdom, container) {
  // 创建元素
  const element = document.createElement(vdom.type);
  // 为元素添加属性
  Object.keys(vdom.props)
    .filter(prop => prop !== 'children')
    .forEach(prop => (element[prop] = vdom.props[prop]));
  // 递归创建子元素
  if (Array.isArray(vdom.props.children)) {
    vdom.props.children.forEach(child => render(child, element));
  }
  // 将元素添加到页面中
  container.appendChild(element);
}

render(jsx, document.getElementById('root'));
```

DOM 更新就是在上面递归的过程中加入了 Virtual DOM 对比的过程。

可以看到递归是无法中断的。

### React 16 解决方案 - Fiber

1. 利用浏览器空余时间执行任务，拒绝长时间占用主线程
  - 在新版本的 React 版本中，使用了 requestIdleCallback API
  - 利用浏览器空余时间执行 VirtualDOM 比对任务，也就表示 VirtualDOM 比对不会长期占用主线程
  - 如果有高优先级的任务要执行，就会暂时终止 VirtualDOM 的比对过程，先去执行高优先级的任务
  - 高优先级任务执行完成，再回来继续执行 VirtualDOM 比对任务
  - 这样页面就不会出现卡顿现象
2. 放弃递归，只采用循环，因为循环可以被中断
  - 由于递归必须一层一层进入，一层一层退出，所以过程无法中断
  - 所以要实现任务的终止再继续，就必须放弃递归，只采用循环的方式执行比对的过程
  - 因为循环是可以终止的，只需要将循环的条件保存下来，下一次任务就可以从中断的地方执行了
3. 任务拆分，将任务拆分成一个个的小任务
  - 如果任务要实现终止再继续，任务的单元就必须要小
  - 这样任务即使没有执行完就被终止，重新执行任务的代价就会小很多
  - 所以要进行任务的拆分，将一个大的任务拆分成一个个小的任务
  - VirtualDOM 比对任务如何拆分？
    - 以前将整棵 VirtualDOM 树的比对看作一个任务
    - 现在将树中每一个节点的比对看作一个任务

新版 React 的解决方案核心就是第 1 点，第 2、3 点都是为了实现第 1 点而存在的，

Fiber 翻译过来是“纤维”，意思就是执行任务的颗粒度变得细腻，像纤维一样。

可以通过这个 [Demo](https://claudiopro.github.io/react-fiber-vs-stack-demo/) 查看 Stack 算法 和 Fiber 算法的效果区别。

### 实现思路

在 Fiber 方案中，为了实现任务的终止再继续，DOM 对比算法被拆分成了两阶段：

1. render 阶段（可中断）
  - VirtualDOM 的比对，构建 Fiber 对象，构建链表

2. commit 阶段（不可中断）
  - 根据构建的链表进行 DOM 操作

过程就是：

1. 在使用 React 编写用户界面的时候仍然使用 JSX 语法
2. Babel 会将 JSX 语法转换成 `React.createElement()` 方法的调用
3. `React.createElement()` 方法调用后会返回 VirtualDOM 对象
4. 接下来就可以执行第一个阶段了：**构建 Fiber 对象**
  - 采用循环的方式从 VirtualDOM 对象中，找到每一个内部的 VirtualDOM 对象
  - 为每一个 VirtualDOM 对象构建 Fiber 对象
  - Fiber 对象也是 JavaScript 对象，它是从 VirtualDOM 对象衍化来的，它除了 type、props、children以外还存储了更多节点的信息，其中包含的一个核心信息是：当前节点要进行的操作，例如删除、更新、新增
  - 在构建 Fiber 的过程中还要构建链表
5. 接着进行第二阶段的操作：**执行 DOM 操作**

总结：

- DOM 初始渲染：`根据 VirtualDOM` --> `创建 Fiber 对象 及 构建链表` --> `将 Fiber 对象存储的操作应用到真实 DOM 中`
- DOM 更新操作：`newFiber(重新获取所有 Fiber 对象)` --> `newFiber vs oldFiber(获取旧的 Fiber 对象，进行比对) 将差异操作追加到链表` --> `将 Fiber 对象应用到真实 DOM 中`

### 什么是 Fiber

Fiber 有两层含义：

- Fiber 是一个执行单元
- Fiber 是一种数据结构

#### 执行单元

在 React 16 之前，将 Virtual DOM 树整体看成一个任务进行递归处理，任务整体庞大执行耗时且不能中断。

在 React 16，将整个任务拆分成一个个小的任务进行处理，每个小的任务指的就是一个 Fiber 节点的构建。

任务会在浏览器的空闲时间被执行，每个单元执行完成后，React 都会检查是否还有空余时间，如果有继续执行下一个人物单元，直到没有空余时间或者所有任务执行完毕，如果没有空余时间就交还主线程的控制权。

![React Fiber 执行单元流程图](https://user-images.githubusercontent.com/8088864/125878368-317a2c5c-8b16-4877-981c-3883075423bc.png)

#### 数据结构

Fiber 是一种数据结构，支撑 React 构建任务的运转。

Fiber 其实就是 JavaScript 对象，对象中存储了当前节点的父节点、第一个子节点、下一个兄弟节点，以便在构建链表和执行 DOM 操作的时候知道它们的关系。

在 render 阶段的时候，React 会从上（root）向下，再从下向上构建所有节点对应的 Fiber 对象，在从下向上的同时还会构建链表，最后将链头存储到 Root Fiber。

- 从上向下
  - 从 Root 节点开始构建，优先构建子节点

- 从下向上
  - 如果当前节点没有子节点，就会构建下一个兄弟节点
  - 如果当前节点没有子节点，也没有下一个兄弟节点，就会返回父节点，构建父节点的兄弟节点
  - 如果父节点的下一个兄弟节点有子节点，就继续向下构建
  - 如果父节点没有下一个兄弟节点，就继续向上查找

在第二阶段的时候，通过链表结构的属性（child、sibling、parent）准确构建出完整的 DOM 节点树，从而才能将 DOM 对象追加到页面当中。

``` js
// Fiber 对象
{
  type // 节点类型（元素、文本、组件）（具体的类型）
  props // 节点属性（props中包含children属性，标识当前节点的子级 VirtualDOM）
  stateNode // 节点的真实 DOM 对象 | 类组件实例对象 | 函数组件的定义方法
  tag // 节点标记（对具体类型的分类 host_root[顶级节点root] || host_component[普通DOM节点] || class_component[类组件] || function_component[函数组件]）
  effectTag // 当前 Fiber 在 commit 阶段需要被执行的副作用类型/操作（新增、删除、修改）
  nextEffect // 单链表用来快速查找下一个 sideEffect
  lastEffect // 存储最新副作用，用于构建链表的 nextEffect
  firstEffect // 存储第一个要执行的副作用，用于向 root 传递第一个要操作的 DOM
  parent // 当前 Fiber 的父级 Fiber（React 中是 `return`）
  child // 当前 Fiber 的第一个子级 Fiber
  sibling // 当前 Fiber 的下一个兄弟 Fiber
  alternate // 当前节点对应的旧 Fiber 的备份，用于新旧 Fiber 比对
}
```

以上面的示例为例：

``` jsx
<div id="a1">
  <div id="b1">
    <div id="c1"></div>
    <div id="c2"></div>
  </div>
  <div id="b2"></div>
</div>
```

![React Fiber 数据结构](https://user-images.githubusercontent.com/8088864/125878754-89f402ab-cb4b-466a-bef3-c6f20b9e10f8.png)

``` js
// B1 的 Fiber 对象包含这几个属性：
{
  child: C1_Fiber,
  sibling: B2_Fiber,
  parent: A1_Fiber
}
```

## 十八、canvas

Canvas API 提供了一个通过JavaScript 和 HTML的`<canvas>`元素来绘制图形的方式。它可以用于动画、游戏画面、数据可视化、图片编辑以及实时视频处理等方面。

Canvas API主要聚焦于2D图形。而同样使用`<canvas>`元素的 WebGL API 则用于绘制硬件加速的2D和3D图形。

### 标签

``` html
<canvas width="600" height="400" id="canvas"></canvas>
```

不给宽高的话默认是300+150

### 怎么用

``` js
// 拿到canvas
var canvas = document.getElementById("canvas");
// 创建画图工具
var context = canvas.getContext("2d");
```

### 相关的api及用法

``` html
<!DOCTYPE html>
<html>
<body>

<canvas id="myCanvas" width="600" height="500" style="border:1px solid #d3d3d3;">
  Your browser does not support the HTML5 canvas tag.
</canvas>

<script>

var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

// 画线
context.moveTo(100, 100);
context.lineTo(300, 100);
context.lineTo(300, 200);

// 画第二条线
// 画第二条线
context.moveTo(100, 300);
context.lineTo(300, 300);

// 最后要描边才会出效果
context.stroke();

// 创建一张新的玻璃纸
context.beginPath();
// 画第三条线
context.moveTo(400, 100);
context.lineTo(400, 300);
context.lineTo(500, 300);
context.lineTo(500, 200);

// 只要执行stroke，都会玻璃纸上的图形重复印刷一次
context.stroke();

// 填充
context.fill();
context.fillStyle = "gray";

// 设置描边色
context.strokeStyle = "red"; // 颜色的写法和css写法是一样的
context.stroke();

//填充
//设置填充色
context.fillStyle = "yellowgreen";
context.fill();

//把路径闭合
context.closePath();

//设置线条的粗细， 不需要加px
context.lineWidth = 15;
//线条的头部的设置
context.lineCap = "round"; //默认是butt， 记住round
</script>

</body>
</html>
```

效果如下所示:

![Canvas LineTo 效果图](https://user-images.githubusercontent.com/8088864/125880740-1d667e65-6511-4fd1-96a2-c697fa62aba3.png)

#### 画矩形

``` js
// 直接传入 x， y， width， height， 就可以绘制一个矩形
// 画在玻璃纸上

context.rect(100, 100, 200, 200);
context.strokeStyle = "red";
context.stroke();
context.fillStyle = "yellow";
context.fill();
```

``` js
// 直接创建一个填充的矩形
// 创建玻璃纸， 画矩形路径， 填充， 把玻璃纸销毁
context.fillRect(100, 100, 200, 200);

// 黄色的边不会显示，是因为上面那一句，画完之后，就把玻璃纸销毁了
context.strokeStyle = "yellow";
context.stroke();
// 如果放在fillRect上面就可以实现
```

#### 圆形绘制

``` js
// x轴是0度开始
// x, y: 圆心位置；radius： 半径的长度; startRadian, endRadian 代表的是起始弧度和结束弧度；dircetion代表的圆形的路径的方向，默认是顺时针（是否逆时针， 默认值是false），如果传true就是逆时针,最后一个参数是可以不传的， 默认就是顺时针

// context.arc(x, y, radius, startRadian, endRadian, direction);

// 从31度的地方，画到81度的地方
context.arc(300, 200, 100, 31/180*Math.PI, 81/180*Math.PI);

context.strokeStyle = "yellow";
context.stroke();

context.fillStyle = "red";
context.fill();
```

#### 画飞镖转盘

``` js
for (var i = 0; i < 10; i++) {
    context.moveTo(320+i*20,200);
    // i % 2代表是奇数还是偶数， 偶数就逆时针， 奇数就顺时针
    context.arc(300, 200, 20 + i * 20, 0, 2*Math.PI, i%2==0);
}
context.fillStyle = "green";
context.fill();
context.stroke();
```

效果图如下所示:

![Canvas arc 画飞镖转盘](https://user-images.githubusercontent.com/8088864/125925307-9fdd88ec-8569-412d-9245-37aceca560ba.png)

#### 线性渐变

``` js
// 1. 需要创建出一个渐变对象
//    var gradient = context.createLinearGradient(100, 100, 300, 100);
// 参数代表哪个点到哪个点，这里写的是左上角到右下角的意思
var gradient = context.createLinearGradient(100, 100, 300, 380);

// 2. 添加渐变颜色
gradient.addColorStop(0, "red");
gradient.addColorStop(0.5, "hotpink");
gradient.addColorStop(1, "yellowgreen");

// 3. 将渐变对象设为填充色
context.fillStyle = gradient;

// 4. 画一个矩形
context.fillRect(100, 100, 200, 280);
```

效果图如下所示:

![Canvas createLinearGradient 线性渐变](https://user-images.githubusercontent.com/8088864/125925678-c260361c-11cb-44cd-86f9-86156ea7033e.png)

#### 径向渐变

``` js
// 1. 创建渐变对象
// 内圆
var c1 = {x: 260, y: 160, r: 0};
// 外圆
var c2 = {x: 300, y: 200, r: 120};

var gradient = context.createRadialGradient(c1.x, c1.y, c1.r, c2.x, c2.y, c2.r);
gradient.addColorStop(0, "red");
gradient.addColorStop(0.3, "yellow");
gradient.addColorStop(0.6, "green");
gradient.addColorStop(1, "orange");

// 2. 把渐变对象设为填充色
context.fillStyle = gradient;

// 3. 画圆并填充
// 内圆的部分是用0的位置填充的; 内圆的边到外圆的边所发生的渐变叫， 径向渐变
context.arc(c2.x, c2.y, c2.r, 0, 2*Math.PI);
context.fill();
```

效果图如下所示:

![Canvas createRadialGradient 径向渐变](https://user-images.githubusercontent.com/8088864/125926105-f8d0128c-fc71-4278-9c10-580d9dbf4d3c.png)

#### 径向渐变画球

``` js
//1. 创建一个径向渐变
var c1 = {x: 240, y: 160, r: 0};
var c2 = {x: 300, y: 200, r: 120};

var gradient = context.createRadialGradient(c1.x, c1.y, c1.r, c2.x, c2.y, c2.r);
gradient.addColorStop(1, "gray");
gradient.addColorStop(0, "lightgray");

//2. 将渐变对象设为填充色
context.fillStyle = gradient;

//3. 画圆并填充
context.arc(c2.x, c2.y, c2.r, 0, 2*Math.PI);
context.fill();
```

效果图如下所示:

![Canvas createRadialGradient 径向渐变画球](https://user-images.githubusercontent.com/8088864/125926450-19a90cf2-1049-4d2c-a47d-1f22fad0cd58.png)

#### 径向渐变画彩虹

``` js
//实现彩虹，给里面的圆一个半径80是关键
var c1 = {x: 300, y: 200, r: 80};
var c2 = {x: 300, y: 200, r: 150};
var gradient = context.createRadialGradient(c1.x, c1.y, c1.r, c2.x, c2.y, c2.r);
gradient.addColorStop(1, "red");
gradient.addColorStop(6/7, "orange");
gradient.addColorStop(5/7, "yellow");
gradient.addColorStop(4/7, "green");
gradient.addColorStop(3/7, "cyan");
gradient.addColorStop(2/7, "skyblue");
gradient.addColorStop(1/7, "purple");
gradient.addColorStop(0, "white");

//设为填充色
context.fillStyle = gradient;

//画圆并填充
context.arc(c2.x, c2.y, c2.r, 0, 2*Math.PI);
context.fill();

//遮挡下半部分
context.fillStyle = "white";
context.fillRect(0, 200, 600, 200);
```

效果图如下所示:

![Canvas createRadialGradient 径向渐变画彩虹](https://user-images.githubusercontent.com/8088864/125926965-02866a67-5dd9-4be1-84f3-b0589696e7f7.png)

#### 阴影效果

``` js
//和css3相比， 阴影只能设一个， 不能设内阴影
//水平偏移， 垂直的偏移， 模糊程度， 阴影的颜色

//设置阴影的参数
context.shadowOffsetX = 10;
context.shadowOffsetY = 10;
context.shadowBlur = 10;
context.shadowColor = "yellowgreen";

//画一个矩形
context.fillStyle = "red";
context.fillRect(100, 100, 300, 200);
```

效果图如下所示:

![Canvas shadow 阴影效果](https://user-images.githubusercontent.com/8088864/125927364-e91bafb3-7e90-4173-bd39-4ee8ae7da746.png)

#### 绘制文字api

``` js
//绘制文字
//text就是要绘制的文字， x， y就是从什么地方开始绘制
//context.strokeText("text", x, y)

context.font = "60px 微软雅黑";
//context.strokeText("hello, world", 100, 100);
context.fillText("hello, world", 100, 100);
```

效果图如下所示:

![Canvas fillText 绘制文字](https://user-images.githubusercontent.com/8088864/125927573-fdaa09b5-93d7-4990-86ee-2fa9a453eab5.png)

#### 文字对齐方式

``` js
//默认在left
//关键api：context.textAlign = "left";
context.textAlign = "left";
context.fillText("left", 300, 120);

context.textAlign = "center";
context.fillText("center", 300, 190);

context.textAlign = "right";
context.fillText("right", 300, 260);

// 文字出现在canvas的右上方
// 1. 先设置right
// 2. 给canvas.width,0即可
context.font = "60px 微软雅黑";
context.textAlign = "right";
context.textBaseline = "top";
context.fillText("hello, world", canvas.width, 0);
```

效果图如下所示:

![Canvas fillText 水平对齐方式](https://user-images.githubusercontent.com/8088864/125934392-abf31a1e-2b7e-429f-90cc-8cef9fd516d0.png)


#### 垂直方向

``` js
//默认是top
//关键api：context.textBaseline = "top";

context.fillText("default", 50, 200);

context.textBaseline = "top";
context.fillText("top", 150, 200);

context.textBaseline = "middle";
context.fillText("middle", 251, 200);

context.textBaseline = "bottom";
context.fillText("bottom", 400, 200);
```

效果图如下所示:

![Canvas fillText 垂直对齐方式](https://user-images.githubusercontent.com/8088864/125935099-d0a918b3-25e8-4150-bd86-053a5e5cfa98.png)

#### 图片的绘制

3参模式： 将img从x, y的地方开始绘制， 图片有多大，就绘制多大，超出canvas的部分就不显示了

``` js
//context.drawImage(img, x, y)

var image = new Image();
image.src = "./img/gls.jpg";

//必须要等到图片加载出来，才能进行绘制的操作
image.onload = function () {
  context.drawImage(image, 100, 200);
}
```

5参模式（缩放模式）, 就是将图片显示在画布上的某一块区域（x, y, w, h）,如果这个区域的宽高和图片不一至，会被压缩或放大

``` js
var image = new Image();
image.src = "./img/gls.jpg";

image.onload = function () {
  context.drawImage(image, 100, 100, 100, 100);
}
```

图片绘制的9参模式， 就是把原图（img）中的某一块（imagex，imagey，imagew，imageh）截取出来， 显示在画布的某个区域(canvasx, canvasy, canvasw, canvash)

``` js
//理解关键：
//（imagex，imagey，imagew，imageh）
//(canvasx, canvasy, canvasw, canvash)

var image = new Image();
image.src = "./img/gls.jpg";
image.onload = function () {
  /*
    参数的解释：
    image： 就是大图片本身
    中间的四个参数， 代表从图片的150， 0的位置，截取 150 * 200的一块区域
    后面的四个参数， 将刚才截取的小图， 显示画布上 100， 100， 150， 200的这个区域
  */
  context.drawImage(image, 150, 0, 150, 200, 100, 100, 150, 200);
}
```

## 十九、WebWorker和postMessage

### 概述

JavaScript 语言采用的是单线程模型，也就是说，所有任务只能在一个线程上完成，一次只能做一件事。前面的任务没做完，后面的任务只能等着。随着电脑计算能力的增强，尤其是多核 CPU 的出现，单线程带来很大的不便，无法充分发挥计算机的计算能力。

Web Worker 的作用，就是为 JavaScript 创造多线程环境，允许主线程创建 Worker 线程，将一些任务分配给后者运行。在主线程运行的同时，Worker 线程在后台运行，两者互不干扰。等到 Worker 线程完成计算任务，再把结果返回给主线程。这样的好处是，一些计算密集型或高延迟的任务，被 Worker 线程负担了，主线程（通常负责 UI 交互）就会很流畅，不会被阻塞或拖慢。

Worker 线程一旦新建成功，就会始终运行，不会被主线程上的活动（比如用户点击按钮、提交表单）打断。这样有利于随时响应主线程的通信。但是，这也造成了 Worker 比较耗费资源，不应该过度使用，而且一旦使用完毕，就应该关闭。

Web Worker 有以下几个使用注意点。

#### （1）同源限制

分配给 Worker 线程运行的脚本文件，必须与主线程的脚本文件同源。

#### （2）DOM 限制

Worker 线程所在的全局对象，与主线程不一样，无法读取主线程所在网页的 DOM 对象，也无法使用document、window、parent这些对象。但是，Worker 线程可以navigator对象和location对象。

#### （3）通信联系

Worker 线程和主线程不在同一个上下文环境，它们不能直接通信，必须通过消息完成。(postMessage)

#### （4）脚本限制

Worker 线程不能执行alert()方法和confirm()方法，但可以使用 XMLHttpRequest 对象发出 AJAX 请求。

#### （5）文件限制

Worker 线程无法读取本地文件，即不能打开本机的文件系统（file://），它所加载的脚本，必须来自网络。

### 基本用法

#### 主线程

主线程采用`new`命令，调用`Worker()`构造函数，新建一个 `Worker` 线程。

``` js
var worker = new Worker('work.js');
```

`Worker()`构造函数的参数是一个脚本文件，该文件就是 `Worker` 线程所要执行的任务。由于 `Worker` 不能读取本地文件，所以这个脚本必须来自网络。如果下载没有成功（比如404错误），`Worker` 就会默默地失败。

然后，主线程调用`worker.postMessage()`方法，向 `Worker` 发消息。

``` js
worker.postMessage('Hello World');
worker.postMessage({method: 'echo', args: ['Work']});
// worker.postMessage() 方法的参数，就是主线程传给 Worker 的数据。它可以是各种数据类型，包括二进制数据。
```

接着，主线程通过`worker.onmessage`指定监听函数，接收子线程发回来的消息。

``` js
worker.onmessage = function (event) {
  console.log('Received message ' + event.data);
  doSomething();
}

function doSomething() {
  // 执行任务
  worker.postMessage('Work done!');
}
```

上面代码中，事件对象的data属性可以获取 `Worker` 发来的数据。

`Worker` 完成任务以后，主线程就可以把它关掉。

``` js
worker.terminate();
```

#### Worker 线程

`Worker` 线程内部需要有一个监听函数，监听`message`事件。

``` js
self.addEventListener('message', function (e) {
  self.postMessage('You said: ' + e.data);
}, false);
```

上面代码中，`self`代表子线程自身，即子线程的全局对象。因此，等同于下面两种写法。

```js
// 写法一
this.addEventListener('message', function (e) {
  this.postMessage('You said: ' + e.data);
}, false);

// 写法二
addEventListener('message', function (e) {
  postMessage('You said: ' + e.data);
}, false);
```

除了使用`self.addEventListener()`指定监听函数，也可以使用`self.onmessage`指定。监听函数的参数是一个事件对象，它的data属性包含主线程发来的数据。`self.postMessage()`方法用来向主线程发送消息。

根据主线程发来的数据，`Worker` 线程可以调用不同的方法，下面是一个例子。

``` js
self.addEventListener('message', function (e) {
  var data = e.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage('WORKER STARTED: ' + data.msg);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg);
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);
```

上面代码中，`self.close()`用于在 Worker 内部关闭自身。

#### Worker 加载脚本

Worker 内部如果要加载其他脚本，有一个专门的方法`importScripts()`。

``` js
importScripts('script1.js');
```

该方法可以同时加载多个脚本。

``` js
importScripts('script1.js', 'script2.js');
```

#### Worker 错误处理

主线程可以监听 `Worker` 是否发生错误。如果发生错误，`Worker` 会触发主线程的error事件。

``` js
worker.onerror(function (event) {
  console.log([
    'ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message
  ].join(''));
});

// 或者
worker.addEventListener('error', function (event) {
  // ...
});
```

`Worker` 内部也可以监听error事件。

#### 关闭 Worker

使用完毕，为了节省系统资源，必须关闭 Worker。

``` js
// 主线程
worker.terminate();

// Worker 线程
self.close();
```

### 数据通信

前面说过，主线程与 Worker 之间的通信内容，可以是文本，也可以是对象。需要注意的是，这种通信是拷贝关系，即是传值而不是传址，Worker 对通信内容的修改，不会影响到主线程。事实上，浏览器内部的运行机制是，先将通信内容串行化，然后把串行化后的字符串发给 Worker，后者再将它还原。

主线程与 Worker 之间也可以交换二进制数据，比如 File、Blob、ArrayBuffer 等类型，也可以在线程之间发送。下面是一个例子。

``` js
// 主线程
var uInt8Array = new Uint8Array(new ArrayBuffer(10));
for (var i = 0; i < uInt8Array.length; ++i) {
  uInt8Array[i] = i * 2; // [0, 2, 4, 6, 8,...]
}
worker.postMessage(uInt8Array);

// Worker 线程
self.onmessage = function (e) {
  var uInt8Array = e.data;
  postMessage('Inside worker.js: uInt8Array.toString() = ' + uInt8Array.toString());
  postMessage('Inside worker.js: uInt8Array.byteLength = ' + uInt8Array.byteLength);
};
```

但是，拷贝方式发送二进制数据，会造成性能问题。比如，主线程向 Worker 发送一个 500MB 文件，默认情况下浏览器会生成一个原文件的拷贝。为了解决这个问题，JavaScript 允许主线程把二进制数据直接转移给子线程，但是一旦转移，主线程就无法再使用这些二进制数据了，这是为了防止出现多个线程同时修改数据的麻烦局面。这种转移数据的方法，叫做Transferable Objects。这使得主线程可以快速把数据交给 Worker，对于影像处理、声音处理、3D 运算等就非常方便了，不会产生性能负担。

如果要直接转移数据的控制权，就要使用下面的写法。

``` js
// Transferable Objects 格式
worker.postMessage(arrayBuffer, [arrayBuffer]);

// 例子
var ab = new ArrayBuffer(1);
worker.postMessage(ab, [ab]);
```

### 同页面的 Web Worker

通常情况下，Worker 载入的是一个单独的 JavaScript 脚本文件，但是也可以载入与主线程在同一个网页的代码。

``` html
<!DOCTYPE html>
  <body>
    <script id="worker" type="app/worker">
      addEventListener('message', function () {
        postMessage('some message');
      }, false);
    </script>
  </body>
</html>
```

上面是一段嵌入网页的脚本，注意必须指定`<script>`标签的type属性是一个浏览器不认识的值，上例是`app/worker`。

然后，读取这一段嵌入页面的脚本，用 Worker 来处理。

``` js
var blob = new Blob([document.querySelector('#worker').textContent]);
var url = window.URL.createObjectURL(blob);
var worker = new Worker(url);

worker.onmessage = function (e) {
  // e.data === 'some message'
};
```

上面代码中，先将嵌入网页的脚本代码，转成一个二进制对象，然后为这个二进制对象生成 URL，再让 Worker 加载这个 URL。这样就做到了，主线程和 Worker 的代码都在同一个网页上面。

### Worker 线程完成轮询

有时，浏览器需要轮询服务器状态，以便第一时间得知状态改变。这个工作可以放在 Worker 里面。

``` js
function createWorker(f) {
  var blob = new Blob(['(' + f.toString() +')()']);
  var url = window.URL.createObjectURL(blob);
  var worker = new Worker(url);
  return worker;
}

var pollingWorker = createWorker(function (e) {
  var cache;

  function compare(new, old) { ... };

  setInterval(function () {
    fetch('/my-api-endpoint').then(function (res) {
      var data = res.json();

      if (!compare(data, cache)) {
        cache = data;
        self.postMessage(data);
      }
    })
  }, 1000)
});

pollingWorker.onmessage = function () {
  // render data
}

pollingWorker.postMessage('init');
```

上面代码中，Worker 每秒钟轮询一次数据，然后跟缓存做比较。如果不一致，就说明服务端有了新的变化，因此就要通知主线程。

### Worker 新建 Worker

Worker 线程内部还能再新建 Worker 线程（目前只有 Firefox 浏览器支持）。下面的例子是将一个计算密集的任务，分配到10个 Worker。

主线程代码如下。

``` js
var worker = new Worker('worker.js');
worker.onmessage = function (event) {
  document.getElementById('result').textContent = event.data;
};
```

Worker 线程代码如下。

``` js
// worker.js

// settings
var num_workers = 10;
var items_per_worker = 1000000;

// start the workers
var result = 0;
var pending_workers = num_workers;
for (var i = 0; i < num_workers; i += 1) {
  var worker = new Worker('core.js');
  worker.postMessage(i * items_per_worker);
  worker.postMessage((i + 1) * items_per_worker);
  worker.onmessage = storeResult;
}

// handle the results
function storeResult(event) {
  result += event.data;
  pending_workers -= 1;
  if (pending_workers <= 0)
    postMessage(result); // finished!
}
```

上面代码中，Worker 线程内部新建了10个 Worker 线程，并且依次向这10个 Worker 发送消息，告知了计算的起点和终点。计算任务脚本的代码如下。

``` js
// core.js
var start;
onmessage = getStart;
function getStart(event) {
  start = event.data;
  onmessage = getEnd;
}

var end;
function getEnd(event) {
  end = event.data;
  onmessage = null;
  work();
}

function work() {
  var result = 0;
  for (var i = start; i < end; i += 1) {
    // perform some complex calculation here
    result += 1;
  }
  postMessage(result);
  close();
}
```

### API

#### 主线程

浏览器原生提供Worker()构造函数，用来供主线程生成 Worker 线程。

``` js
var myWorker = new Worker(jsUrl, options);
```

Worker()构造函数，可以接受两个参数。第一个参数是脚本的网址（必须遵守同源政策），该参数是必需的，且只能加载 JS 脚本，否则会报错。第二个参数是配置对象，该对象可选。它的一个作用就是指定 Worker 的名称，用来区分多个 Worker 线程。

``` js
// 主线程
var myWorker = new Worker('worker.js', { name : 'myWorker' });

// Worker 线程
self.name // myWorker
```

Worker()构造函数返回一个 Worker 线程对象，用来供主线程操作 Worker。Worker 线程对象的属性和方法如下。

- Worker.onerror：指定 error 事件的监听函数。
- Worker.onmessage：指定 message 事件的监听函数，发送过来的数据在Event.data属性中。
- Worker.onmessageerror：指定 messageerror 事件的监听函数。发送的数据无法序列化成字符串时，会触发这个事件。
- Worker.postMessage()：向 Worker 线程发送消息。
- Worker.terminate()：立即终止 Worker 线程。

#### Worker 线程

Web Worker 有自己的全局对象，不是主线程的window，而是一个专门为 Worker 定制的全局对象。因此定义在window上面的对象和方法不是全部都可以使用。

Worker 线程有一些自己的全局属性和方法。

- self.name： Worker 的名字。该属性只读，由构造函数指定。
- self.onmessage：指定message事件的监听函数。
- self.onmessageerror：指定 messageerror 事件的监听函数。发送的数据无法序列化成字符串时，会触发这个事件。
- self.close()：关闭 Worker 线程。
- self.postMessage()：向产生这个 Worker 线程发送消息。
- self.importScripts()：加载 JS 脚本。

## 二十、OffscreenCanvas 离屏Canvas — 使用Web Worker提高你的Canvas运行速度

OffscreenCanvas提供了一个可以脱离屏幕渲染的canvas对象。

有了离屏Canvas，你可以不用在你的主线程中绘制图像了！

Canvas 是一个非常受欢迎的表现方式，同时也是WebGL的入口。它能绘制图形，图片，展示动画，甚至是处理视频内容。它经常被用来在富媒体web应用中创建炫酷的用户界面或者是制作在线（web）游戏。

它是非常灵活的，这意味着绘制在Canvas的内容可以被编程。JavaScript就提供了Canvas的系列API。这些给了Canvas非常好的灵活度。

但同时，在一些现代化的web站点，脚本解析运行是实现流畅用户反馈的最大的问题之一。因为Canvas计算和渲染和用户操作响应都发生在同一个线程中，在动画中（有时候很耗时）的计算操作将会导致App卡顿，降低用户体验。

幸运的是, [OffscreenCanvas](https://developer.mozilla.org/zh-CN/docs/Web/API/OffscreenCanvas) 离屏Canvas可以非常棒的解决这个麻烦！

到目前为止，Canvas的绘制功能都与`<canvas>`标签绑定在一起，这意味着Canvas API和DOM是耦合的。而OffscreenCanvas，正如它的名字一样，通过将Canvas移出屏幕来解耦了DOM和Canvas API。

由于这种解耦，OffscreenCanvas的渲染与DOM完全分离了开来，并且比普通Canvas速度提升了一些，而这只是因为两者（Canvas和DOM）之间没有同步。但更重要的是，将两者分离后，Canvas将可以在Web Worker中使用，即使在Web Worker中没有DOM。这给Canvas提供了更多的可能性。

### 兼容性

这是一个实验中的功能
此功能某些浏览器尚在开发中，请参考浏览器兼容性表格以得到在不同浏览器中适合使用的前缀。由于该功能对应的标准文档可能被重新修订，所以在未来版本的浏览器中该功能的语法和行为可能随之改变。

支持浏览器如下图所示：

![OffscreenCanvas兼容性](https://user-images.githubusercontent.com/8088864/126027990-d476b78e-e6c9-4438-998d-7ccc4ae79f8b.png)

### 在Worker中使用OffscreenCanvas

它在窗口环境和web worker环境均有效。

[Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API) 是一个Web版的线程——它允许你在幕后运行你的代码。将你的一部分代码放到Worker中可以给你的主线程更多的空闲时间，这可以提高你的用户体验度。就像其没有DOM一样，直到现在，在Worker中都没有Canvas API。

而OffscreenCanvas并不依赖DOM，所以在Worker中Canvas API可以被某种方法来代替。下面是我在Worker中用OffscreenCanvas来计算渐变颜色的：

``` js
// file: worker.js

function getGradientColor(percent) {
    const canvas = new OffscreenCanvas(100, 1);
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1, 'blue');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, 1);
    const imgd = ctx.getImageData(0, 0, ctx.canvas.width, 1);
    const colors = imgd.data.slice(percent * 4, percent * 4 + 4);
    return `rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[3]})`;
}

getGradientColor(40);  // rgba(152, 0, 104, 255)
```

### 不要阻塞主线程

当我们将大量的计算移到Worker中运行时，可以释放主线程上的资源，这很有意思。我们可以使用transferControlToOffscreen 方法将常规的Canvas映射到OffscreenCanvas实例上。之后所有应用于OffscreenCanvas的操作将自动呈现在在源Canvas上。

``` html
<!DOCTYPE html>
<html>
<body>
<canvas id="myCanvas" width="600" height="500" style="border:1px solid #d3d3d3;">
  Your browser does not support the HTML5 canvas tag.
</canvas>
<script>
var canvas = document.getElementById("myCanvas");
// var context = canvas.getContext("2d");

// // 画线
// context.moveTo(100, 100);
// context.lineTo(300, 100);
// context.lineTo(300, 200);

// // 画第二条线
// // 画第二条线
// context.moveTo(100, 300);
// context.lineTo(300, 300);

// // 最后要描边才会出效果
// context.stroke();

// // 创建一张新的玻璃纸
// context.beginPath();
// // 画第三条线
// context.moveTo(400, 100);
// context.lineTo(400, 300);
// context.lineTo(500, 300);
// context.lineTo(500, 200);

// // 只要执行stroke，都会玻璃纸上的图形重复印刷一次
// context.stroke();

// // 填充
// context.fill();
// context.fillStyle = "gray";

// // 设置描边色
// context.strokeStyle = "red"; // 颜色的写法和css写法是一样的
// context.stroke();

// //填充
// //设置填充色
// context.fillStyle = "yellowgreen";
// context.fill();

// //把路径闭合
// context.closePath();

// //设置线条的粗细， 不需要加px
// context.lineWidth = 15;
// //线条的头部的设置
// context.lineCap = "round"; //默认是butt， 记住round

// 注: 如果将canvas转化成离屏canvas时，就不能使用原canvas的cantext来绘制图案，否则会报错，已经绘制了的canvas不同通过transferControlToOffscreen转换成OffscreenCanvas
// Uncaught DOMException: Failed to execute 'transferControlToOffscreen' on 'HTMLCanvasElement': Cannot transfer control from a canvas that has a rendering context.
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);
</script>
</body>
</html>
```

OffscreenCanvas 是可转移的，除了将其指定为传递信息中的字段之一以外，还需要将其作为postMessage（传递信息给Worker的方法）中的第二个参数传递出去，以便可以在Worker线程的context（上下文）中使用它。

``` js
// worker.js

self.onmessage = function (event) {
  // 获取传送过来的离屏Canvas(OffscreenCanvas)
  var canvas = event.data.canvas;
  var context = canvas.getContext('2d');

  // 画一个曲径球体
  var c1 = {x: 240, y: 160, r: 0};
  var c2 = {x: 300, y: 200, r: 120};

  var gradient = context.createRadialGradient(c1.x, c1.y, c1.r, c2.x, c2.y, c2.r);
  gradient.addColorStop(1, "gray");
  gradient.addColorStop(0, "lightgray");

  //2. 将渐变对象设为填充色
  context.fillStyle = gradient;

  //3. 画圆并填充
  context.arc(c2.x, c2.y, c2.r, 0, 2*Math.PI);
  context.fill();
}
```

效果如下所示:

![WebWorker中OffscreenCanvas绘制径向渐变画球](https://user-images.githubusercontent.com/8088864/126027866-d78a65fc-8f0f-4a7e-9adf-7eb09a03b956.png)

任务繁忙的主线程也不会影响在Worker上运行的动画。所以即使主线程非常繁忙，你也可以通过此功能来避免掉帧并保证流畅的动画

### WebRTC的YUV媒体流数据的离屏渲染

从 WebRTC 中拿到的是 YUV 的原始视频流，将原始的 YUV 视频帧直接转发过来，通过第三方库直接在 Cavans 上渲染。

可以使用[yuv-canvas](https://github.com/brion/yuv-canvas)和[yuv-buffer](https://github.com/brion/yuv-buffer)第三方库来渲染YUV的原始视频流。

主进程render.js

``` js
"use strict";
exports.__esModule = true;
var isEqual = require('lodash.isequal');
var YUVBuffer = require('yuv-buffer');
var YUVCanvas = require('yuv-canvas');
var Renderer = /** @class */ (function () {
    function Renderer(workSource) {
        var _this = this;
        this._sendCanvas = function () {
            _this.canvasSent = true;
            _this.worker && _this.worker.postMessage({
                type: 'constructor',
                data: {
                    canvas: _this.offCanvas,
                    id: (_this.element && _this.element.id) || (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2))
                }
            }, [_this.offCanvas]);
        };
        /**
         * 判断使用渲染的方式
         */
        this._checkRendererWay = function () {
            if (_this.workerReady && _this.worker && _this.offCanvas && _this.enableWorker) {
                return 'worker';
            }
            else {
                return 'software';
            }
        };
        // workerCanvas渲染
        this._workDrawFrame = function (width, height, yUint8Array, uUint8Array, vUint8Array) {
            if (_this.canvasWrapper && _this.canvasWrapper.style.display !== 'none') {
                _this.canvasWrapper.style.display = 'none';
            }
            if (_this.workerCanvasWrapper && _this.workerCanvasWrapper.style.display === 'none') {
                _this.workerCanvasWrapper.style.display = 'flex';
            }
            _this.worker && _this.worker.postMessage({
                type: 'drawFrame',
                data: {
                    width: width,
                    height: height,
                    yUint8Array: yUint8Array,
                    uUint8Array: uUint8Array,
                    vUint8Array: vUint8Array
                }
            }, [yUint8Array, uUint8Array, vUint8Array]);
        };
        // 实际渲染Canvas
        this._softwareDrawFrame = function (width, height, yUint8Array, uUint8Array, vUint8Array) {
            if (_this.workerCanvasWrapper && _this.workerCanvasWrapper.style.display !== 'none') {
                _this.workerCanvasWrapper.style.display = 'none';
            }
            if (_this.canvasWrapper && _this.canvasWrapper.style.display === 'none') {
                _this.canvasWrapper.style.display = 'flex';
            }
            var format = YUVBuffer.format({
                width: width,
                height: height,
                chromaWidth: width / 2,
                chromaHeight: height / 2
            });
            var y = YUVBuffer.lumaPlane(format, yUint8Array);
            var u = YUVBuffer.chromaPlane(format, uUint8Array);
            var v = YUVBuffer.chromaPlane(format, vUint8Array);
            var frame = YUVBuffer.frame(format, y, u, v);
            _this.yuv.drawFrame(frame);
        };
        this.cacheCanvasOpts = {};
        this.yuv = {};
        this.ready = false;
        this.contentMode = 0;
        this.container = {};
        this.canvasWrapper;
        this.canvas = {};
        this.element = {};
        this.offCanvas = {};
        this.enableWorker = !!workSource;
        if (this.enableWorker) {
            this.worker = new Worker(workSource);
            this.workerReady = false;
            this.canvasSent = false;
            this.worker.onerror = function (evt) {
                console.error('[WorkerRenderer]: the renderer worker catch error: ', evt);
                _this.workerReady = false;
                _this.enableWorker = false;
            };
            this.worker.onmessage = function (evt) {
                var data = evt.data;
                switch (data.type) {
                    case 'ready': {
                        console.log('[WorkerRenderer]: the renderer worker was ready');
                        _this.workerReady = true;
                        if (_this.offCanvas) {
                            _this._sendCanvas();
                        }
                        break;
                    }
                    case 'exited': {
                        console.log('[WorkerRenderer]: the renderer worker was exited');
                        _this.workerReady = false;
                        _this.enableWorker = false;
                        break;
                    }
                }
            };
        }
    }
    Renderer.prototype._calcZoom = function (vertical, contentMode, width, height, clientWidth, clientHeight) {
        if (vertical === void 0) { vertical = false; }
        if (contentMode === void 0) { contentMode = 0; }
        var localRatio = clientWidth / clientHeight;
        var tempRatio = width / height;
        if (isNaN(localRatio) || isNaN(tempRatio)) {
            return 1;
        }
        if (!contentMode) {
            if (vertical) {
                return localRatio > tempRatio ?
                    clientHeight / height : clientWidth / width;
            }
            else {
                return localRatio < tempRatio ?
                    clientHeight / height : clientWidth / width;
            }
        }
        else {
            if (vertical) {
                return localRatio < tempRatio ?
                    clientHeight / height : clientWidth / width;
            }
            else {
                return localRatio > tempRatio ?
                    clientHeight / height : clientWidth / width;
            }
        }
    };
    Renderer.prototype.getBindingElement = function () {
        return this.element;
    };
    Renderer.prototype.bind = function (element) {
        // record element
        this.element = element;
        // create container
        var container = document.createElement('div');
        container.className += ' video-canvas-container';
        Object.assign(container.style, {
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
        });
        this.container = container;
        element && element.appendChild(this.container);
        // 创建两个canvas，一个在主线程中渲染，如果web worker中的离屏canvas渲染进程出错了，还可以切换到主进程的canvas进行渲染
        var canvasWrapper = document.createElement('div');
        canvasWrapper.className += ' video-canvas-wrapper canvas-renderer';
        Object.assign(canvasWrapper.style, {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            left: '0px',
            right: '0px',
            display: 'none'
        });
        this.canvasWrapper = canvasWrapper;
        this.container.appendChild(this.canvasWrapper);
        var workerCanvasWrapper = document.createElement('div');
        workerCanvasWrapper.className += ' video-canvas-wrapper webworker-renderer';
        Object.assign(workerCanvasWrapper.style, {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            left: '0px',
            right: '0px',
            display: 'none'
        });
        this.workerCanvasWrapper = workerCanvasWrapper;
        this.container.appendChild(this.workerCanvasWrapper);
        // create canvas
        this.canvas = document.createElement('canvas');
        this.workerCanvas = document.createElement('canvas');
        this.canvasWrapper.appendChild(this.canvas);
        this.workerCanvasWrapper.appendChild(this.workerCanvas);
        // 创建 OffscreenCanvas 对象
        this.offCanvas = this.workerCanvas.transferControlToOffscreen();
        if (!this.canvasSent && this.offCanvas && this.worker && this.workerReady) {
            this._sendCanvas();
        }
        this.yuv = YUVCanvas.attach(this.canvas, { webGL: false });
    };
    Renderer.prototype.unbind = function () {
        this.canvasWrapper && this.canvasWrapper.removeChild(this.canvas);
        this.workerCanvasWrapper && this.workerCanvasWrapper.removeChild(this.workerCanvas);
        this.container && this.container.removeChild(this.canvasWrapper);
        this.container && this.container.removeChild(this.workerCanvasWrapper);
        this.element && this.element.removeChild(this.container);
        this.worker && this.worker.terminate();
        this.workerReady = false;
        this.canvasSent = false;
        this.yuv = null;
        this.container = null;
        this.workerCanvasWrapper = null;
        this.canvasWrapper = null;
        this.element = null;
        this.canvas = null;
        this.workerCanvas = null;
        this.offCanvas = null;
        this.worker = null;
    };
    Renderer.prototype.refreshCanvas = function () {
        // Not implemented for software renderer
    };
    Renderer.prototype.updateCanvas = function (options) {
        if (options === void 0) { options = {
            width: 0,
            height: 0,
            rotation: 0,
            mirrorView: false,
            contentMode: 0,
            clientWidth: 0,
            clientHeight: 0
        }; }
        // check if display options changed
        if (isEqual(this.cacheCanvasOpts, options)) {
            return;
        }
        this.cacheCanvasOpts = Object.assign({}, options);
        // check for rotation
        if (options.rotation === 0 || options.rotation === 180) {
            this.canvas.width = options.width;
            this.canvas.height = options.height;
            // canvas 调用 transferControlToOffscreen 方法后无法修改canvas的宽度和高度，只允许修改canvas的style属性
            this.workerCanvas.style.width = options.width + "px";
            this.workerCanvas.style.height = options.height + "px";
        }
        else if (options.rotation === 90 || options.rotation === 270) {
            this.canvas.height = options.width;
            this.canvas.width = options.height;
            this.workerCanvas.style.height = options.width + "px";
            this.workerCanvas.style.width = options.height + "px";
        }
        else {
            throw new Error('Invalid value for rotation. Only support 0, 90, 180, 270');
        }
        var transformItems = [];
        transformItems.push("rotateZ(" + options.rotation + "deg)");
        var scale = this._calcZoom(options.rotation === 90 || options.rotation === 270, options.contentMode, options.width, options.height, options.clientWidth, options.clientHeight);
        // transformItems.push(`scale(${scale})`)
        this.canvas.style.zoom = scale;
        this.workerCanvas.style.zoom = scale;
        // check for mirror
        if (options.mirrorView) {
            // this.canvas.style.transform = 'rotateY(180deg)';
            transformItems.push('rotateY(180deg)');
        }
        if (transformItems.length > 0) {
            var transform = "" + transformItems.join(' ');
            this.canvas.style.transform = transform;
            this.workerCanvas.style.transform = transform;
        }
    };
    Renderer.prototype.drawFrame = function (imageData) {
        if (!this.ready) {
            this.ready = true;
        }
        var dv = new DataView(imageData.header);
        // let format = dv.getUint8(0);
        var mirror = dv.getUint8(1);
        var contentWidth = dv.getUint16(2);
        var contentHeight = dv.getUint16(4);
        var left = dv.getUint16(6);
        var top = dv.getUint16(8);
        var right = dv.getUint16(10);
        var bottom = dv.getUint16(12);
        var rotation = dv.getUint16(14);
        // let ts = dv.getUint32(16);
        var width = contentWidth + left + right;
        var height = contentHeight + top + bottom;
        this.updateCanvas({
            width: width, height: height, rotation: rotation,
            mirrorView: !!mirror,
            contentMode: this.contentMode,
            clientWidth: this.container && this.container.clientWidth,
            clientHeight: this.container && this.container.clientHeight
        });
        if (this._checkRendererWay() === 'software') {
            // 实际渲染canvas
            this._softwareDrawFrame(width, height, imageData.yUint8Array, imageData.uUint8Array, imageData.vUint8Array);
        }
        else {
            this._workDrawFrame(width, height, imageData.yUint8Array, imageData.uUint8Array, imageData.vUint8Array);
        }
    };
    /**
     * 清空整个Canvas面板
     *
     * @memberof Renderer
     */
    Renderer.prototype.clearFrame = function () {
        if (this._checkRendererWay() === 'software') {
            this.yuv && this.yuv.clear();
        }
        else {
            this.worker && this.worker.postMessage({
                type: 'clearFrame'
            });
        }
    };
    Renderer.prototype.setContentMode = function (mode) {
        if (mode === void 0) { mode = 0; }
        this.contentMode = mode;
    };
    return Renderer;
}());

exports["default"] = Renderer;
```

渲染Worker的代码如下所示:

``` js
// render worker

(function() {
  const dateFormat = function(date, formatter = 'YYYY-MM-DD hh:mm:ss SSS') {
    if (!date) {
      return date;
    }

    let time;

    try {
      time = new Date(date);
    } catch (e) {
      return date;
    }

    const oDate = {
      Y: time.getFullYear(),
      M: time.getMonth() + 1,
      D: time.getDate(),
      h: time.getHours(),
      m: time.getMinutes(),
      s: time.getSeconds(),
      S: time.getMilliseconds()
    };

    return formatter.replace(/(Y|M|D|h|m|s|S)+/g, (res, key) => {
      let len = 2;

      switch (res.length) {
        case 1:
          len = res.slice(1, 0) === 'Y' ? 4 : 2;
          break;
        case 2:
          len = 2;
          break;
        case 3:
          len = 3;
          break;
        case 4:
          len = 4;
          break;
        default:
          len = 2;
      }
      return (`0${oDate[key]}`).slice(-len);
    });
  }

  let yuv;

  try {
    importScripts('./yuv-buffer/yuv-buffer.js');
    importScripts('./yuv-canvas/shaders.js');
    importScripts('./yuv-canvas/depower.js');
    importScripts('./yuv-canvas/YCbCr.js');
    importScripts('./yuv-canvas/FrameSink.js');
    importScripts('./yuv-canvas/SoftwareFrameSink.js');
    importScripts('./yuv-canvas/WebGLFrameSink.js');
    importScripts('./yuv-canvas/yuv-canvas.js');

    self.addEventListener('message', function (e) {
      const data = e.data;
      switch (data.type) {
        case 'constructor':
          console.log(`${dateFormat(new Date())} RENDER_WORKER [INFO]: received canvas: `, data.data.canvas, data.data.id);
          yuv = YUVCanvas.attach(data.data.canvas, { webGL: false });
          break;
        case 'drawFrame':
          // 考虑是否使用requestAnimationFrame进行渲染，控制每一帧显示的频率
          const width = data.data.width;
          const height = data.data.height;
          const yUint8Array = data.data.yUint8Array;
          const uUint8Array = data.data.uUint8Array;
          const vUint8Array = data.data.vUint8Array;
          const format = YUVBuffer.format({
            width: width,
            height: height,
            chromaWidth: width / 2,
            chromaHeight: height / 2
          });
          const y = YUVBuffer.lumaPlane(format, yUint8Array);
          const u = YUVBuffer.chromaPlane(format, uUint8Array);
          const v = YUVBuffer.chromaPlane(format, vUint8Array);
          const frame = YUVBuffer.frame(format, y, u, v);
          yuv && yuv.drawFrame(frame);
          break;
        case 'clearFrame': {
          yuv && yuv.clear(frame);
          break;
        }
        default:
          console.log(`${dateFormat(new Date())} RENDER_WORKER [INFO]: [RendererWorker]: Unknown message: `, data);
      };
    }, false);

    self.postMessage({
      type: 'ready',
    });
  } catch (error) {
    self.postMessage({
      type: 'exited',
    });

    console.log(`${dateFormat(new Date())} RENDER_WORKER [INFO]: [RendererWorker]: catch error`, error);
  }
})();

```

### 总结

如果你对图像绘画使用得非常多，OffscreenCanvas可以有效的提高你APP的性能。它使得Worker可以处理canvas的渲染绘制，让你的APP更好地利用了多核系统。

OffscreenCanvas在Chrome 69中已经不需要开启flag（实验性功能）就可以使用了。它也正在被 Firefox 实现。由于其API与普通canvas元素非常相似，所以你可以轻松地对其进行特征检测并循序渐进地使用它，而不会破坏现有的APP或库的运行逻辑。OffscreenCanvas在任何涉及到图形计算以及动画表现且与DOM关系并不密切（即依赖DOM API不多）的情况下，它都具有性能优势。

## 二十一、Vue与React Virtual DOM对比

### 相同点

1. vue和react都采用了虚拟dom算法，以最小化更新真实DOM，从而减小不必要的性能损耗。

2. 按颗粒度分为tree diff, component diff, element diff。 tree diff 比较同层级dom节点，进行增、删、移操作。如果遇到component元素， 就会重新tree diff流程。

### 不同点

#### dom的更新策略不同

react 会自顶向下全diff。

vue 会跟踪每一个组件的依赖关系，不需要重新渲染整个组件树。

1. 在react中，当状态发生改变时，组件树就会自顶向下的全diff, 重新render页面， 重新生成新的虚拟dom tree, 新旧dom tree进行比较， 进行patch打补丁方式，局部跟新dom. 所以react为了避免父组件跟新而引起不必要的子组件更新， 可以在shouldComponentUpdate做逻辑判断，减少没必要的render， 以及重新生成虚拟dom，做差量对比过程。

2. 在 vue中， 通过Object.defineProperty 把这些 data 属性 全部转为 getter/setter。同时watcher实例对象会在组件渲染时，将属性记录为dep, 当dep 项中的 setter被调用时，通知watch重新计算，使得关联组件更新。

Diff 算法借助元素的 Key 判断元素是新增、删除、修改，从而减少不必要的元素重渲染。

### 建议

1. 基于tree diff

  - 开发组件时，注意保持DOM结构的稳定；即尽可能少地动态操作DOM结构，尤其是移动操作。
  - 当节点数过大或者页面更新次数过多时，页面卡顿的现象会比较明显。这时可以通过 CSS 隐藏或显示节点，而不是真的移除或添加 DOM 节点。

2. 基于component diff

  - 注意使用 shouldComponentUpdate() 来减少组件不必要的更新。
  - 对于类似的结构应该尽量封装成组件，既减少代码量，又能减少component diff的性能消耗。

3. 基于element diff：

  - 对于列表结构，尽量减少类似将最后一个节点移动到列表首部的操作，当节点数量过大或更新操作过于频繁时，在一定程度上会影响渲染性能。
  - 循环渲染的必须加上key值，唯一标识节点。

## 二十二、Vue2.0 中，“渐进式框架”和“自底向上增量开发的设计”这两个概念是什么？

在我看来，渐进式代表的含义是：主张最少。

每个框架都不可避免会有自己的一些特点，从而会对使用者有一定的要求，这些要求就是主张，主张有强有弱，它的强势程度会影响在业务开发中的使用方式。

比如说，Angular，它两个版本都是强主张的，如果你用它，必须接受以下东西：

- 必须使用它的模块机制
- 必须使用它的依赖注入
- 必须使用它的特殊形式定义组件（这一点每个视图框架都有，难以避免）

所以Angular是带有比较强的排它性的，如果你的应用不是从头开始，而是要不断考虑是否跟其他东西集成，这些主张会带来一些困扰。

比如React，它也有一定程度的主张，它的主张主要是函数式编程的理念，比如说，你需要知道什么是副作用，什么是纯函数，如何隔离副作用。它的侵入性看似没有Angular那么强，主要因为它是软性侵入。

你当然可以只用React的视图层，但几乎没有人这么用，为什么呢，因为你用了它，就会觉得其他东西都很别扭，于是你要引入Flux，Redux，Mobx之中的一个，于是你除了Redux，还要看saga，于是你要纠结业务开发过程中每个东西有没有副作用，纯不纯，甚至你连这个都可能不能忍：

``` js
const getData = () => {
  // 如果不存在，就在缓存中创建一个并返回
  // 如果存在，就从缓存中拿
}
```

因为你要纠结它有外部依赖，同样是不加参数调用，连续两次的结果是不一样的，于是不纯。

为什么我一直不认同在中后台项目中使用React，原因就在这里，我反对的是整个业务应用的函数式倾向，很多人都是看到有很多好用的React组件，就会倾向于把它引入，然后，你知道怎么把自己的业务映射到函数式的那套理念上吗？

函数式编程，无副作用，写出来的代码没有bug，这是真理没错，但是有两个问题需要考虑：

1. JS本身，有太多特性与纯函数式的主张不适配，这一点，题叶能说得更多
2. 业务系统里面的实体关系，如何组织业务逻辑，几十年来积累了无数的基于设计模式的场景经验，有太多的东西可以模仿，但是，没有人给你总结那么多如何把你的厚重业务映射到函数式理念的经验，这个地方很考验综合水平的，真的每个人都有能力去做这种映射吗？

函数式编程无bug的根本就在于要把业务逻辑完全都依照这套理念搞好，你看看自己公司做中后台的员工，他们熟悉的是什么？是基于传统OO设计模式的这套东西，他们以为拿着你们给的组件库就得到了一切，但是可能还要被灌输函数式编程的一整套东西，而且又没人告诉他们在业务场景下，如何规划业务模型、组织代码，还要求快速开发，怎么能快起来？

所以我真是心疼这些人，他们要的只是组件库，却不得不把业务逻辑的思考方式也作转换，这个事情没有一两年时间洗脑，根本洗不到能开发业务的程度。

没有好组件库的时候，大家痛点在视图层，有了基于React的组件化，把原先没那么痛的业务逻辑部分搞得也痛起来了，原先大家按照设计模式教的东西，照猫画虎还能继续开发了，学了一套新理念之后，都不知道怎么写代码了，怎么写都怀疑自己不对，可怕。

我宁可支持Angular也不支持React的原因也就在此，Angular至少在业务逻辑这块没有软主张，能够跟OO设计模式那套东西配合得很好。我面对过很多商务场景，都是前端很厚重的东西，不仅仅是管理控制台这种，这类东西里面，业务逻辑的占比要比视图大挺多的，如何组织这些东西，目前几个主流技术栈都没有解决方案，要靠业务架构师去摆平。

如果你的场景不是这么厚重的，只是简单管理控制台，那当我没说好了。

框架是不能解决业务问题的，只能作为工具，放在合适的人手里，合适的场景下。

现在我要说说为什么我这么支持Vue了，没什么，可能有些方面是不如React，不如Angular，但它是渐进的，没有强主张，你可以在原有大系统的上面，把一两个组件改用它实现，当jQuery用；也可以整个用它全家桶开发，当Angular用；还可以用它的视图，搭配你自己设计的整个下层用。你可以在底层数据逻辑的地方用OO和设计模式的那套理念，也可以函数式，都可以，它只是个轻量视图而已，只做了自己该做的事，没有做不该做的事，仅此而已。

渐进式的含义，我的理解是：没有多做职责之外的事。

## 二十三、webpack 打包优化的四种方法（多进程打包，多进程压缩，资源 CDN，动态 polyfill）

### 打包分析

#### 1. 速度分析

我们的目的是优化打包速度，那肯定需要一个速度分析插件，此时 `speed-measure-webpack-plugin` 就派上用场了。它的作用如下：

- 分析整个打包总耗时
- 每个 plugin 和 loader 的耗时情况

安装插件

``` shell
npm install --save-dev speed-measure-webpack-plugin
```

使用插件

修改配置webpack.config.js文件

``` js
// 导入速度分析插件
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// 实例化速度分析插件
const smp = new SpeedMeasurePlugin();

const webpackConfig = smp.wrap({
  entry: {
    // ...
  },
  output: {
    // ...
  },
  resolve: {
    // ...
  },
  module: {
    rules: [
      // ....
    ]
  },
  plugins: [new MyPlugin(), new MyOtherPlugin()],
});

module.exports = webpackConfig;
```

运行打包命令之后，可以看到，打包总耗时为 `15.48 secs`

效果如下所示:

![Webpack优化_speed-measure-webpack-plugin 打包速度](https://user-images.githubusercontent.com/8088864/126053799-541740e0-922b-45c0-949d-6a91fc64f759.png)


#### 2. 体积分析

分析完打包速度之后，接着我们来分析打包之后每个文件以及每个模块对应的体积大小。使用到的插件为 `webpack-bundle-analyzer`，构建完成后会在 8888 端口展示大小。

安装插件

``` shell
npm install --save-dev webpack-bundle-analyzer
```

使用插件

修改配置webpack.config.js文件

``` js
// 导入速度分析插件
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// 导入体积分析插件
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// 实例化速度分析插件
const smp = new SpeedMeasurePlugin();

const webpackConfig = smp.wrap({
  entry: {
    // ...
  },
  output: {
    // ...
  },
  resolve: {
    // ...
  },
  module: {
    rules: [
      // ....
    ]
  },
  plugins: [
    // 实例化体积分析插件
    new BundleAnalyzerPlugin(),
    new MyPlugin(),
    new MyOtherPlugin(),
  ],
});

module.exports = webpackConfig;
```

构建之后可以看到，其中黄色块 `chunk-vendors` 文件占比最大，为 `1.34MB`

效果如下所示:

![Webpack优化_webpack-bundle-analyzer 打包体积分析](https://user-images.githubusercontent.com/8088864/126053872-dca114ab-7a88-44ad-8456-6be4a4ce5510.png)

### 打包优化

#### 1. 多进程多实例构建，资源并行解析

多进程构建的方案比较知名的有以下三个：

- thread-loader (推荐使用这个)
- parallel-webpack
- HappyPack

这里以 `thread-loader` 为例配置多进程多实例构建

安装 loader

``` shell
npm install --save-dev thread-loader
```

使用 loader

修改配置webpack.config.js文件

``` js
const path = require("path");
// 导入速度分析插件
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// 实例化速度分析插件
const smp = new SpeedMeasurePlugin();

const webpackConfig = smp.wrap({
  entry: {
    // ...
  },
  output: {
    // ...
  },
  resolve: {
    // ...
  },
  module: {
    rules: [
      rules: [
        {
          test: /\.js$/,
          include: path.resolve('src'),
          use: [
            'thread-loader',
            // your expensive loader (e.g babel-loader)
          ],
        }
      ]
    ]
  },
  plugins: [
    new MyPlugin(),
    new MyOtherPlugin(),
  ],
});

module.exports = webpackConfig;
```

#### 2. 公用代码提取，使用 CDN 加载

以vue.js构建的项目为例，里面很多的第三方库只要不升级对应的版本其内容是不变的，我们可以将这些内用文件不通过webpack打包到模块里面，而是使用CDN加载，例如对于vue，vuex，vue-router，axios，echarts，swiper等第三方库我们可以利用webpack的externals参数来配置，这里我们设定只需要在生产环境中才需要使用。

这里需要使用 `html-webpack-plugin` 和 `webpack-cdn-plugin` 两个插件

安装插件

``` shell
npm install --save-dev html-webpack-plugin, webpack-cdn-plugin
```

使用插件

修改配置webpack.config.js文件

``` js
const path = require("path");
// 导入速度分析插件
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// 导入体积分析插件
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const HtmlWebpackPlugin = require('html-webpack-plugin');

//判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

// 实例化速度分析插件
const smp = new SpeedMeasurePlugin();

//定义 CDN 路径，这里采用 bootstrap 的 cdn
const cdn = {
    css: [
        'https://cdn.bootcss.com/Swiper/4.5.1/css/swiper.min.css'
    ],
    js: [
        'https://cdn.bootcss.com/vue/2.6.10/vue.min.js',
        'https://cdn.bootcss.com/vue-router/3.1.3/vue-router.min.js',
        'https://cdn.bootcss.com/vuex/3.1.1/vuex.min.js',
        'https://cdn.bootcss.com/axios/0.19.0/axios.min.js',
        'https://cdn.bootcss.com/echarts/4.3.0/echarts.min.js',
        'https://cdn.bootcss.com/Swiper/4.5.1/js/swiper.min.js',
    ]
}

const webpackConfig = smp.wrap({
  entry: {
    // ...
  },
  output: {
    // ...
  },
  resolve: {
    // ...
  },
  //生产环境注入 cdn
  externals: isProduction && {
    'vue': 'Vue',
    'vuex': 'Vuex',
    'vue-router': 'VueRouter',
    'axios': 'axios',
    'echarts': 'echarts',
    'swiper': 'Swiper'
  } || {},
  module: {
    rules: [
      rules: [
        {
          test: /\.js$/,
          include: path.resolve('src'),
          use: [
            'thread-loader',
            // your expensive loader (e.g babel-loader)
          ],
        }
      ]
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ filename: '../index.html' }), // output file relative to output.path
    new WebpackCdnPlugin({
      modules: [
        {
          name: 'vue',
          var: 'Vue',
          path: 'vue.min.js'
        },
        {
          name: 'vuex',
          var: 'Vuex',
          path: 'vuex.min.js'
        }
        {
          name: 'vue-router',
          var: 'VueRouter',
          path: 'vue-router.min.js'
        },
        {
          name: 'axios',
          var: 'axios',
          path: 'axios.min.js'
        }
        {
          name: 'echarts',
          var: 'echarts',
          path: 'echarts.min.js'
        },
        {
          name: 'swiper',
          var: 'Swiper',
          path: 'swiper.min.js'
        },
      ],
      prod: isProduction,
      prodUrl: '//cdn.bootcdn.net/ajax/libs/:name/:version/:path' // => https://cdn.bootcdn.net/ajax/libs/xxx/xxx/xxx(`:name`,`:version`和`:path`为模板变量)
      publicPath: '/node_modules/dist', // override when prod is false
    }),
    new MyPlugin(),
    new MyOtherPlugin(),
  ],
});

module.exports = webpackConfig;
```

最终生成的inde.html文件如下所示:

``` html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <link href="https://cdn.bootcdn.net/ajax/libs/Swiper/6.7.5/swiper-bundle.min.css" rel="stylesheet">
  </head>
  <body>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.13/vue.min.js"></script>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/vue-router/3.1.3/vue-router.min.js"></script>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/vuex/3.1.1/vuex.min.js"></script>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/axios/0.19.0/axios.min.js"></script>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/echarts/4.3.0/echarts.min.js"></script>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/Swiper/6.7.5/js/swiper.min.js"></script>
  <script type="text/javascript" src="/assets/app.js"></script>
  </body>
</html>
```

#### 3. 多进程多实例并行压缩

并行压缩主流有以下三种方案

- 使用 parallel-uglify-plugin 插件
- uglifyjs-webpack-plugin 开启 parallel 参数
- terser-webpack-plugin 开启 parallel 参数 （推荐使用这个，支持 ES6 语法压缩）

安装插件

``` shell
npm install --save-dev terser-webpack-plugin
```

使用插件

修改配置webpack.config.js文件

``` js
const path = require("path");
// 导入速度分析插件
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// 导入代码压缩插件
const TerserPlugin = require("terser-webpack-plugin");

// 导入体积分析插件
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const HtmlWebpackPlugin = require('html-webpack-plugin');

//判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

// 实例化速度分析插件
const smp = new SpeedMeasurePlugin();

//定义 CDN 路径，这里采用 bootstrap 的 cdn
const cdn = {
    css: [
        'https://cdn.bootcss.com/Swiper/4.5.1/css/swiper.min.css'
    ],
    js: [
        'https://cdn.bootcss.com/vue/2.6.10/vue.min.js',
        'https://cdn.bootcss.com/vue-router/3.1.3/vue-router.min.js',
        'https://cdn.bootcss.com/vuex/3.1.1/vuex.min.js',
        'https://cdn.bootcss.com/axios/0.19.0/axios.min.js',
        'https://cdn.bootcss.com/echarts/4.3.0/echarts.min.js',
        'https://cdn.bootcss.com/Swiper/4.5.1/js/swiper.min.js',
    ]
}

const webpackConfig = smp.wrap({
  entry: {
    // ...
  },
  output: {
    // ...
  },
  resolve: {
    // ...
  },
  module: {
    rules: [
      rules: [
        {
          test: /\.js$/,
          include: path.resolve('src'),
          use: [
            'thread-loader',
            // your expensive loader (e.g babel-loader)
          ],
        }
      ]
    ]
  },
  //生产环境注入 cdn
  externals: isProduction && {
    'vue': 'Vue',
    'vuex': 'Vuex',
    'vue-router': 'VueRouter',
    'axios': 'axios',
    'echarts': 'echarts',
    'swiper': 'Swiper'
  } || {},
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: 4
      })
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ filename: '../index.html' }), // output file relative to output.path
    new WebpackCdnPlugin({
      modules: [
        {
          name: 'vue',
          var: 'Vue',
          path: 'vue.min.js'
        },
        {
          name: 'vuex',
          var: 'Vuex',
          path: 'vuex.min.js'
        }
        {
          name: 'vue-router',
          var: 'VueRouter',
          path: 'vue-router.min.js'
        },
        {
          name: 'axios',
          var: 'axios',
          path: 'axios.min.js'
        }
        {
          name: 'echarts',
          var: 'echarts',
          path: 'echarts.min.js'
        },
        {
          name: 'swiper',
          var: 'Swiper',
          path: 'swiper.min.js'
        },
      ],
      prod: isProduction,
      prodUrl: '//cdn.bootcdn.net/ajax/libs/:name/:version/:path' // => https://cdn.bootcdn.net/ajax/libs/xxx/xxx/xxx(`:name`,`:version`和`:path`为模板变量)
      publicPath: '/node_modules/dist', // override when prod is false
    }),
    new MyPlugin(),
    new MyOtherPlugin(),
  ],
});

module.exports = webpackConfig;
```

#### 4. 使用 polyfill 动态服务

Polyfill 可以为旧浏览器提供和标准 API 一样的功能。比如你想要 IE 浏览器实现 Promise 和 fetch 功能，你需要手动引入 es6-promise、whatwg-fetch。而通过 Polyfill.io，你只需要引入一个 JS 文件。

Polyfill.io 通过分析请求头信息中的 UserAgent 实现自动加载浏览器所需的 polyfills。 Polyfill.io 有一份默认功能列表，包括了最常见的 polyfills：document.querySelector、Element.classList、ES5 新增的 Array 方法、Date.now、ES6 中的 Object.assign、Promise 等。

动态 `polyfill` 指的是根据不同的浏览器，动态载入需要的 `polyfill`。 `Polyfill.io` 通过尝试使用 `polyfill` 重新创建缺少的功能，可以更轻松地支持不同的浏览器，并且可以大幅度的减少构建体积。

Polyfill Service 原理

识别 User Agent，下发不同的 Polyfill

![Webpack polyfill 服务](https://user-images.githubusercontent.com/8088864/126054825-2e1a0e44-2eb7-4668-b044-de846427e577.png)

使用方法：

在 index.html 中引入如下 script 标签

``` html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Document</title>
</head>
<body>
</body>
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?callback=main" async defer></script>
<script>
function main () {
  var node=document.createElement("script");
  node.src="index.js";
  document.body.appendChild(node);
}
</script>
</html>
```

## 二十四、常见排序算法的时间复杂度,空间复杂度

![排序算法比较](https://user-images.githubusercontent.com/8088864/126057079-6d6fdcfb-cfd1-416c-9f8d-b4ca98e5f50b.png)

## 二十五、前端需要注意哪些 SEO

1. 合理的 title、description、keywords：搜索对着三项的权重逐个减小，title 值强调重点即可，重要关键词出现不要超过 2 次，而且要靠前，不同页面 title 要有所不同；description 把页面内容高度概括，长度合适，不可过分堆砌关键词，不同页面 description 有所不同；keywords 列举出重要关键词即可
2. 语义化的 HTML 代码，符合 W3C 规范：语义化代码让搜索引擎容易理解网页
3. 重要内容 HTML 代码放在最前：搜索引擎抓取 HTML 顺序是从上到下，有的搜索引擎对抓取长度有限制，保证重要内容一定会被抓取
4. 重要内容不要用 js 输出：爬虫不会执行 js 获取内容
5. 少用 iframe：搜索引擎不会抓取 iframe 中的内容
6. 非装饰性图片必须加 alt
7. 提高网站速度：网站速度是搜索引擎排序的一个重要指标

## 二十六、web 开发中会话跟踪的方法有哪些

1. cookie
2. session
3. url 重写
4. 隐藏 input
5. ip 地址

## 二十七、`<img>`的`title`和`alt`有什么区别

1. `title`是[global attributes](http://www.w3.org/TR/html-markup/global-attributes.html#common.attrs.core)之一，用于为元素提供附加的 advisory information。通常当鼠标滑动到元素上的时候显示。
2. `alt`是`<img>`的特有属性，是图片内容的等价描述，用于图片无法加载时显示、读屏器阅读图片。可提图片高可访问性，除了纯装饰图片外都必须设置有意义的值，搜索引擎会重点分析。

## 二十八、doctype 是什么,举例常见 doctype 及特点

1. `<!doctype>`声明必须处于 HTML 文档的头部，在`<html>`标签之前，HTML5 中不区分大小写
2. `<!doctype>`声明不是一个 HTML 标签，是一个用于告诉浏览器当前 HTML 版本的指令
3. 现代浏览器的 html 布局引擎通过检查 doctype 决定使用兼容模式还是标准模式对文档进行渲染，一些浏览器有一个接近标准模型。
4. 在 HTML4.01 中`<!doctype>`声明指向一个 DTD，由于 HTML4.01 基于 SGML，所以 DTD 指定了标记规则以保证浏览器正确渲染内容
5. HTML5 不基于 SGML，所以不用指定 DTD

常见 dotype：

1. **HTML4.01 strict**：不允许使用表现性、废弃元素（如 font）以及 frameset。声明：`<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">`
2. **HTML4.01 Transitional**:允许使用表现性、废弃元素（如 font），不允许使用 frameset。声明：`<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`
3. **HTML4.01 Frameset**:允许表现性元素，废气元素以及 frameset。声明：`<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">`
4. **XHTML1.0 Strict**:不使用允许表现性、废弃元素以及 frameset。文档必须是结构良好的 XML 文档。声明：`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">`
5. **XHTML1.0 Transitional**:允许使用表现性、废弃元素，不允许 frameset，文档必须是结构良好的 XMl 文档。声明： `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`
6. **XHTML 1.0 Frameset**:允许使用表现性、废弃元素以及 frameset，文档必须是结构良好的 XML 文档。声明：`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">`
7. **HTML 5**: `<!doctype html>`

## 二十九、HTML 全局属性(global attribute)有哪些

参考资料：[MDN: html global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes)或者[W3C HTML global-attributes](http://www.w3.org/TR/html-markup/global-attributes.html#common.attrs.core)

- `accesskey`:设置快捷键，提供快速访问元素如<a href="#" accesskey="a">aaa</a>在 windows 下的 firefox 中按`alt + shift + a`可激活元素
- `class`:为元素设置类标识，多个类名用空格分开，CSS 和 javascript 可通过 class 属性获取元素
- `contenteditable`: 指定元素内容是否可编辑
- `contextmenu`: 自定义鼠标右键弹出菜单内容
- `data-*`: 为元素增加自定义属性
- `dir`: 设置元素文本方向
- `draggable`: 设置元素是否可拖拽
- `dropzone`: 设置元素拖放类型： copy, move, link
- `hidden`: 表示一个元素是否与文档。样式上会导致元素不显示，但是不能用这个属性实现样式效果
- `id`: 元素 id，文档内唯一
- `lang`: 元素内容的的语言
- `spellcheck`: 是否启动拼写和语法检查
- `style`: 行内 css 样式
- `tabindex`: 设置元素可以获得焦点，通过 tab 可以导航
- `title`: 元素相关的建议信息
- `translate`: 元素和子孙节点内容是否需要本地化

## 三十、什么是 web 语义化,有什么好处

web 语义化是指通过 HTML 标记表示页面包含的信息，包含了 HTML 标签的语义化和 css 命名的语义化。
HTML 标签的语义化是指：通过使用包含语义的标签（如 h1-h6）恰当地表示文档结构
css 命名的语义化是指：为 html 标签添加有意义的 class，id 补充未表达的语义，如[Microformat](http://en.wikipedia.org/wiki/Microformats)通过添加符合规则的 class 描述信息
为什么需要语义化：

- 去掉样式后页面呈现清晰的结构
- 盲人使用读屏器更好地阅读
- 搜索引擎更好地理解页面，有利于收录
- 便于团队项目的可持续运作及维护

## 三十一、HTTP method

1. 一台服务器要与 HTTP1.1 兼容，只要为资源实现**GET**和**HEAD**方法即可
2. **GET**是最常用的方法，通常用于**请求服务器发送某个资源**。
3. **HEAD**与 GET 类似，但**服务器在响应中只返回首部，不返回实体的主体部分**
4. **PUT**让服务器**用请求的主体部分来创建一个由所请求的 URL 命名的新文档，或者，如果那个 URL 已经存在的话，就用干这个主体替代它**
5. **POST**起初是用来向服务器输入数据的。实际上，通常会用它来支持 HTML 的表单。表单中填好的数据通常会被送给服务器，然后由服务器将其发送到要去的地方。
6. **TRACE**会在目的服务器端发起一个环回诊断，最后一站的服务器会弹回一个 TRACE 响应并在响应主体中携带它收到的原始请求报文。TRACE 方法主要用于诊断，用于验证请求是否如愿穿过了请求/响应链。
7. **OPTIONS**方法请求 web 服务器告知其支持的各种功能。可以查询服务器支持哪些方法或者对某些特殊资源支持哪些方法。
8. **DELETE**请求服务器删除请求 URL 指定的资源

## 三十二、从浏览器地址栏输入 url 到显示页面的步骤(以 HTTP 为例)

1. 在浏览器地址栏输入 URL
2. 浏览器查看**缓存**，如果请求资源在缓存中并且判断缓存是否过期，跳转到转码步骤
   1. 如果资源未缓存，发起新请求
   2. 如果已缓存，检验判断缓存是否过期，缓存未过期直接提供给客户端，否则与服务器进行验证。
   3. 检验缓存是否过期通常有两个 HTTP 头进行控制`Expires`和`Cache-Control`：
      - HTTP1.0 提供 Expires，值为一个绝对时间表示缓存过期日期
      - HTTP1.1 增加了 Cache-Control: max-age=,值为以秒为单位的最大过期时间
3. 浏览器**解析 URL**获取协议，主机，端口，path
4. 浏览器**组装一个 HTTP（GET）请求报文**
5. 浏览器**获取主机 ip 地址**，过程如下：
   1. 浏览器缓存
   2. 本机缓存
   3. hosts 文件
   4. 路由器缓存
   5. ISP DNS 缓存
   6. DNS 递归查询（可能存在负载均衡导致每次 IP 不一样）
6. **打开一个 socket 与目标 IP 地址，端口建立 TCP 链接**，三次握手如下：
   1. 客户端发送一个 TCP 的**SYN=1，Seq=X**的包到服务器端口
   2. 服务器发回**SYN=1， ACK=X+1， Seq=Y**的响应包
   3. 客户端发送**ACK=Y+1， Seq=Z**
7. TCP 链接建立后**发送 HTTP 请求**
8. 服务器接受请求并解析，将请求转发到服务程序，如虚拟主机使用 HTTP Host 头部判断请求的服务程序
9. 服务器检查**HTTP 请求头是否包含缓存验证信息**如果验证缓存未过期，返回**304**等对应状态码
10. 处理程序读取完整请求并准备 HTTP 响应，可能需要查询数据库等操作
11. 服务器将**响应报文通过 TCP 连接发送回浏览器**
12. 浏览器接收 HTTP 响应，然后根据情况选择**关闭 TCP 连接或者保留重用，关闭 TCP 连接的四次握手如下**：
    1. 主动方发送**Fin=1， Ack=Z， Seq= X**报文
    2. 被动方发送**ACK=X+1， Seq=Z**报文
    3. 被动方发送**Fin=1， ACK=X， Seq=Y**报文
    4. 主动方发送**ACK=Y+1， Seq=X**报文
13. 浏览器检查响应状态吗：是否为 1XX，3XX， 4XX， 5XX，这些情况处理与 2XX 不同
14. 如果资源可缓存，**进行缓存协商**
15. 对响应进行**解码**（例如 gzip 压缩）
16. 根据资源类型决定如何处理（假设资源为 HTML 文档）
17. **解析 HTML 文档，构件 DOM 树，下载资源，构造 CSSOM 树，执行 js 脚本**，这些操作没有严格的先后顺序，以下分别解释
18. **构建 DOM 树**：
    1. **Tokenizing**：根据 HTML 规范将字符流解析为标记
    2. **Lexing**：词法分析将标记转换为对象并定义属性和规则
    3. **DOM construction**：根据 HTML 标记关系将对象组成 DOM 树
19. 解析过程中遇到图片、样式表、js 文件，**启动下载**
20. 构建**CSSOM 树**：
    1. **Tokenizing**：字符流转换为标记流
    2. **Node**：根据标记创建节点
    3. **CSSOM**：节点创建 CSSOM 树
21. **[根据 DOM 树和 CSSOM 树构建渲染树](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/render-tree-construction)**:
    1. 从 DOM 树的根节点遍历所有**可见节点**，不可见节点包括：1）`script`,`meta`这样本身不可见的标签。2)被 css 隐藏的节点，如`display: none`
    2. 对每一个可见节点，找到恰当的 CSSOM 规则并应用
    3. 发布可视节点的内容和计算样式
22. **js 解析如下**：
    1. 浏览器创建 Document 对象并解析 HTML，将解析到的元素和文本节点添加到文档中，此时**document.readystate 为 loading**
    2. HTML 解析器遇到**没有 async 和 defer 的 script 时**，将他们添加到文档中，然后执行行内或外部脚本。这些脚本会同步执行，并且在脚本下载和执行时解析器会暂停。这样就可以用 document.write()把文本插入到输入流中。**同步脚本经常简单定义函数和注册事件处理程序，他们可以遍历和操作 script 和他们之前的文档内容**
    3. 当解析器遇到设置了**async**属性的 script 时，开始下载脚本并继续解析文档。脚本会在它**下载完成后尽快执行**，但是**解析器不会停下来等它下载**。异步脚本**禁止使用 document.write()**，它们可以访问自己 script 和之前的文档元素
    4. 当文档完成解析，document.readState 变成 interactive
    5. 所有**defer**脚本会**按照在文档出现的顺序执行**，延迟脚本**能访问完整文档树**，禁止使用 document.write()
    6. 浏览器**在 Document 对象上触发 DOMContentLoaded 事件**
    7. 此时文档完全解析完成，浏览器可能还在等待如图片等内容加载，等这些**内容完成载入并且所有异步脚本完成载入和执行**，document.readState 变为 complete,window 触发 load 事件
23. **显示页面**（HTML 解析过程中会逐步显示页面）

![HTTP访问过程](https://user-images.githubusercontent.com/8088864/126057166-67172419-c265-4be2-bc9f-5c8e4a3214ee.png)

## 三十三、HTTP request 报文结构是怎样的

[rfc2616](http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html)中进行了定义：

1. 首行是**Request-Line**包括：**请求方法**，**请求 URI**，**协议版本**，**CRLF**
2. 首行之后是若干行**请求头**，包括**general-header**，**request-header**或者**entity-header**，每个一行以 CRLF 结束
3. 请求头和消息实体之间有一个**CRLF 分隔**
4. 根据实际请求需要可能包含一个**消息实体**
   一个请求报文例子如下：

```
GET /Protocols/rfc2616/rfc2616-sec5.html HTTP/1.1
Host: www.w3.org
Connection: keep-alive
Cache-Control: max-age=0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36
Referer: https://www.google.com.hk/
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-CN,zh;q=0.8,en;q=0.6
Cookie: authorstyle=yes
If-None-Match: "2cc8-3e3073913b100"
If-Modified-Since: Wed, 01 Sep 2004 13:24:52 GMT

name=qiu&age=25
```

## 三十四、HTTP response 报文结构是怎样的

[rfc2616](http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html)中进行了定义：

1. 首行是状态行包括：**HTTP 版本，状态码，状态描述**，后面跟一个 CRLF
2. 首行之后是**若干行响应头**，包括：**通用头部，响应头部，实体头部**
3. 响应头部和响应实体之间用**一个 CRLF 空行**分隔
4. 最后是一个可能的**消息实体**
   响应报文例子如下：

```
HTTP/1.1 200 OK
Date: Tue, 08 Jul 2014 05:28:43 GMT
Server: Apache/2
Last-Modified: Wed, 01 Sep 2004 13:24:52 GMT
ETag: "40d7-3e3073913b100"
Accept-Ranges: bytes
Content-Length: 16599
Cache-Control: max-age=21600
Expires: Tue, 08 Jul 2014 11:28:43 GMT
P3P: policyref="http://www.w3.org/2001/05/P3P/p3p.xml"
Content-Type: text/html; charset=iso-8859-1

{"name": "qiu", "age": 25}
```

## 三十五、如何进行网站性能优化

[雅虎 Best Practices for Speeding Up Your Web Site](https://developer.yahoo.com/performance/rules.html)：

- content 方面

  1. 减少 HTTP 请求：合并文件、CSS 精灵、inline Image
  2. 减少 DNS 查询：DNS 查询完成之前浏览器不能从这个主机下载任何任何文件。方法：DNS 缓存、将资源分布到恰当数量的主机名，平衡并行下载和 DNS 查询
  3. 避免重定向：多余的中间访问
  4. 使 Ajax 可缓存
  5. 非必须组件延迟加载
  6. 未来所需组件预加载
  7. 减少 DOM 元素数量
  8. 将资源放到不同的域下：浏览器同时从一个域下载资源的数目有限，增加域可以提高并行下载量
  9. 减少 iframe 数量
  10. 不要 404

- Server 方面
  1. 使用 CDN
  2. 添加 Expires 或者 Cache-Control 响应头
  3. 对组件使用 Gzip 压缩
  4. 配置 ETag
  5. Flush Buffer Early
  6. Ajax 使用 GET 进行请求
  7. 避免空 src 的 img 标签
- Cookie 方面
  1. 减小 cookie 大小
  2. 引入资源的域名不要包含 cookie
- css 方面
  1. 将样式表放到页面顶部
  2. 不使用 CSS 表达式
  3. 使用`<link>`不使用@import
  4. 不使用 IE 的 Filter
- Javascript 方面
  1. 将脚本放到页面底部
  2. 将 javascript 和 css 从外部引入
  3. 压缩 javascript 和 css
  4. 删除不需要的脚本
  5. 减少 DOM 访问
  6. 合理设计事件监听器
- 图片方面
  1. 优化图片：根据实际颜色需要选择色深、压缩
  2. 优化 css 精灵
  3. 不要在 HTML 中拉伸图片
  4. 保证 favicon.ico 小并且可缓存
- 移动方面
  1. 保证组件小于 25k
  2. Pack Components into a Multipart Document

## 三十六、什么是渐进增强

渐进增强是指在 web 设计时强调可访问性、语义化 HTML 标签、外部样式表和脚本。保证所有人都能访问页面的基本内容和功能同时为高级浏览器和高带宽用户提供更好的用户体验。核心原则如下:

- 所有浏览器都必须能访问基本内容
- 所有浏览器都必须能使用基本功能
- 所有内容都包含在语义化标签中
- 通过外部 CSS 提供增强的布局
- 通过非侵入式、外部 javascript 提供增强功能
- end-user web browser preferences are respected

## 三十七、HTTP 状态码及其含义

参考[RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)

- 1XX：信息状态码
  - **100 Continue**：客户端应当继续发送请求。这个临时响应是用来通知客户端它的部分请求已经被服务器接收，且未被拒绝。客户端应当继续发送请求的剩余部分，或者如果请求已经完成，忽略这个响应。服务器必须在请求完成后向客户端发送一个最终响应
  - **101 Switching Protocols**：服务器理解了客户端切换协议的请求，并将通过 Upgrade 消息头通知客户端采用不同的协议来完成这个请求。在发送完这个响应后，服务器将会切换到 Upgrade 消息头中定义的那些协议。
- 2XX：成功状态码
  - **200 OK**：请求成功，请求所希望的响应头或数据体将随此响应返回
  - **201 Created**：请求成功并且服务器创建了新的资源
  - **202 Accepted**：服务器已接受请求，但尚未处理
  - **203 Non-Authoritative Information**：表示文档被正常的返回，但是由于正在使用的是文档副本所以某些响应头信息可能不正确。（HTTP 1.1新）
  - **204 No Content**：没有新文档，浏览器应该继续显示原来的文档。
  - **205 Reset Content**：没有新的内容，但浏览器应该重置它所显示的内容。用来强制浏览器清除表单输入内容（HTTP 1.1新）
  - **206 Partial Content**：请求成功，返回范围请求的部分资源
- 3XX：重定向
  - **300 Multiple Choices**：客户请求的文档可以在多个位置找到，这些位置已经在返回的文档内列出。如果服务器要提出优先选择，则应该在Location响应头中指明
  - **301 Moved Permanently**：请求的资源已永久移动到新位置
  - **302 Found**：临时性重定向
  - **303 See Other**：类似于301/302，不同之处在于，如果原来的请求是POST，Location头指定的重定向目标文档应该通过GET提取（HTTP 1.1新）
  - **304 Not Modified**：自从上次请求后，请求的资源未修改过
  - **305 Use Proxy**：客户请求的文档应该通过Location头所指明的代理服务器提取（HTTP 1.1新）
  - **306 （unused）**：未使用
  - **307 Temporary Redirect**：和302 （Found）相同。许多浏览器会错误地响应302应答进行重定向，即使原来的请求是POST，即使它实际上只能在POST请求的应答是303时才能重定向。由于这个原因，HTTP 1.1新增了307，以便更加清除地区分几个状态代码：当出现303应答时，浏览器可以跟随重定向的GET和POST请求；如果是307应答，则浏览器只能跟随对GET请求的重定向。（HTTP 1.1新）
- 4XX：客户端错误
  - **400 Bad Request**：服务器无法理解请求的格式，客户端不应当尝试再次使用相同的内容发起请求
  - **401 Unauthorized**：求未授权
  - **402 Payment Required**：
  - **403 Forbidden**：禁止访问
  - **404 Not Found**：找不到与 URI 相匹配的资源
  - **405 Method Not Allowed**：请求方法（GET、POST、HEAD、DELETE、PUT、TRACE等）对指定的资源不适用。（HTTP 1.1新）
  - **406 Not Acceptable**：指定的资源已经找到，但它的MIME类型和客户在Accpet头中所指定的不兼容（HTTP 1.1新）
  - **407 Proxy Authentication Required**：类似于401，表示客户必须先经过代理服务器的授权。（HTTP 1.1新）
  - **408 Request Timeout**：在服务器许可的等待时间内，客户一直没有发出任何请求。客户可以在以后重复同一请求。（HTTP 1.1新）
  - **409 Conflict**：通常和PUT请求有关。由于请求和资源的当前状态相冲突，因此请求不能成功。（HTTP 1.1新）
  - **410 Gone**：所请求的文档已经不再可用，而且服务器不知道应该重定向到哪一个地址。它和404的不同在于，返回407表示文档永久地离开了指定的位置，而 404表示由于未知的原因文档不可用。（HTTP 1.1新）
  - **411 Length Required**：服务器不能处理请求，除非客户发送一个Content-Length头。（HTTP 1.1新）
  - **412 Precondition Failed**：请求头中指定的一些前提条件失败（HTTP 1.1新）
  - **413 Request Entity Too Large**：目标文档的大小超过服务器当前愿意处理的大小。如果服务器认为自己能够稍后再处理该请求，则应该提供一个Retry-After头（HTTP 1.1新）
  - **414 Request-URI Too Long**：URI太长（HTTP 1.1新）
  - **415 Unsupported Media Type**：请求所带的附件的格式类型服务器不知道如何处理。（HTTP 1.1新）

  - **416 Requested Range Not Satisfiable**：服务器不能满足客户在请求中指定的Range头。（HTTP 1.1新）
  - **417 Expectation Failed**：如果服务器得到一个带有100-continue值的Expect请求头信息，这是指客户端正在询问是否可以在后面的请求中发送附件。在这种情况下，服务器也会用该状态(417)告诉浏览器服务器不接收该附件或用100 (SC_CONTINUE)状态告诉客户端可以继续发送附件。（HTTP 1.1新）
- 5XX: 服务器错误
  - **500 Internal Server Error**：服务器端错误
  - **501 Not Implemented**：服务器不支持实现请求所需要的功能。例如，客户发出了一个服务器不支持的PUT请求
  - **502 Bad Gateway**：服务器作为网关或者代理时，为了完成请求访问下一个服务器，但该服务器返回了非法的应答。
  - **503 Service Unavailable**：服务器由于维护或者负载过重未能应答。例如，Servlet可能在数据库连接池已满的情况下返回503。服务器返回503时可以提供一个 Retry-After头。
  - **504 Gateway Timeout**：由作为代理或网关的服务器使用，表示不能及时地从远程服务器获得应答。（HTTP 1.1新）
  - **505 HTTP Version Not Supported**：服务器不支持请求中所指明的HTTP版本。（HTTP 1.1新


## 三十八、CSS 选择器有哪些

1. **`* 通用选择器`**：选择所有元素，**不参与计算优先级**，兼容性 IE6+
2. **`#X id 选择器`**：选择 id 值为 X 的元素，兼容性：IE6+
3. **`.X 类选择器`**： 选择 class 包含 X 的元素，兼容性：IE6+
4. **`X Y 后代选择器`**： 选择满足 X 选择器的后代节点中满足 Y 选择器的元素，兼容性：IE6+
5. **`X 元素选择器`**： 选择标所有签为 X 的元素，兼容性：IE6+
6. **`:link，:visited，:focus，:hover，:active 链接状态`**： 选择特定状态的链接元素，顺序 LoVe HAte，兼容性: IE4+
7. **`X + Y 直接兄弟选择器`**：在**X 之后第一个兄弟节点**中选择满足 Y 选择器的元素，兼容性： IE7+
8. **`X > Y 子选择器`**： 选择 X 的子元素中满足 Y 选择器的元素，兼容性： IE7+
9. **`X ~ Y 兄弟`**： 选择**X 之后所有兄弟节点**中满足 Y 选择器的元素，兼容性： IE7+
10. **`[attr]`**：选择所有设置了 attr 属性的元素，兼容性 IE7+
11. **`[attr=value]`**：选择属性值刚好为 value 的元素
12. **`[attr~=value]`**：选择属性值为空白符分隔，其中一个的值刚好是 value 的元素
13. **`[attr|=value]`**：选择属性值刚好为 value 或者 value-开头的元素
14. **`[attr^=value]`**：选择属性值以 value 开头的元素
15. **`[attr$=value]`**：选择属性值以 value 结尾的元素
16. **`[attr*=value]`**：选择属性值中包含 value 的元素
17. **`[:checked]`**：选择单选框，复选框，下拉框中选中状态下的元素，兼容性：IE9+
18. **`X:after, X::after`**：after 伪元素，选择元素虚拟子元素（元素的最后一个子元素），CSS3 中::表示伪元素。兼容性:after 为 IE8+，::after 为 IE9+
19. **`:hover`**：鼠标移入状态的元素，兼容性 a 标签 IE4+， 所有元素 IE7+
20. **`:not(selector)`**：选择不符合 selector 的元素。**不参与计算优先级**，兼容性：IE9+
21. **`::first-letter`**：伪元素，选择块元素第一行的第一个字母，兼容性 IE5.5+
22. **`::first-line`**：伪元素，选择块元素的第一行，兼容性 IE5.5+
23. **`:nth-child(an + b)`**：伪类，选择前面有 an + b - 1 个兄弟节点的元素，其中 n
    &gt;= 0， 兼容性 IE9+
24. **`:nth-last-child(an + b)`**：伪类，选择后面有 an + b - 1 个兄弟节点的元素
    其中 n &gt;= 0，兼容性 IE9+
25. **`X:nth-of-type(an+b)`**：伪类，X 为选择器，**解析得到元素标签**，选择**前面**有 an + b - 1 个**相同标签**兄弟节点的元素。兼容性 IE9+
26. **`X:nth-last-of-type(an+b)`**：伪类，X 为选择器，解析得到元素标签，选择**后面**有 an+b-1 个相同**标签**兄弟节点的元素。兼容性 IE9+
27. **`X:first-child`**：伪类，选择满足 X 选择器的元素，且这个元素是其父节点的第一个子元素。兼容性 IE7+
28. **`X:last-child`**：伪类，选择满足 X 选择器的元素，且这个元素是其父节点的最后一个子元素。兼容性 IE9+
29. **`X:only-child`**：伪类，选择满足 X 选择器的元素，且这个元素是其父元素的唯一子元素。兼容性 IE9+
30. **`X:only-of-type`**：伪类，选择 X 选择的元素，**解析得到元素标签**，如果该元素没有相同类型的兄弟节点时选中它。兼容性 IE9+
31. **`X:first-of-type`**：伪类，选择 X 选择的元素，**解析得到元素标签**，如果该元素
    是此此类型元素的第一个兄弟。选中它。兼容性 IE9+

## 三十九、css sprite 是什么,有什么优缺点

概念：将多个小图片拼接到一个图片中。通过 background-position 和元素尺寸调节需要显示的背景图案。

优点：

1. 减少 HTTP 请求数，极大地提高页面加载速度
2. 增加图片信息重复度，提高压缩比，减少图片大小
3. 更换风格方便，只需在一张或几张图片上修改颜色或样式即可实现

缺点：

1. 图片合并麻烦
2. 维护麻烦，修改一个图片可能需要重新布局整个图片，样式

## 四十、`display: none;`与`visibility: hidden;`的区别

联系：它们都能让元素不可见

区别：

1. display:none;会让元素完全从渲染树中消失，渲染的时候不占据任何空间；visibility: hidden;不会让元素从渲染树消失，渲染时元素继续占据空间，只是内容不可见。
2. display: none;是非继承属性，子孙节点消失由于元素从渲染树消失造成，通过修改子孙节点属性无法显示；visibility: hidden;是继承属性，子孙节点由于继承了 hidden 而消失，通过设置 visibility: visible，可以让子孙节点显示。
3. 修改常规流中元素的 display 通常会造成文档重排。修改 visibility 属性只会造成本元素的重绘。
4. 读屏器不会读取 display: none;元素内容；会读取 visibility: hidden;元素内容。

## 四十一、css hack 原理及常用 hack

原理：利用**不同浏览器对 CSS 的支持和解析结果不一样**编写针对特定浏览器样式。常见的 hack 有 1）属性 hack。2）选择器 hack。3）IE 条件注释

- IE 条件注释：适用于[IE5, IE9]常见格式如下

```js
<!--[if IE 6]>
Special instructions for IE 6 here
<![endif]-->
```

- 选择器 hack：不同浏览器对选择器的支持不一样

```css
/***** Selector Hacks ******/

/* IE6 and below */
* html #uno {
  color: red;
}

/* IE7 */
*:first-child + html #dos {
  color: red;
}

/* IE7, FF, Saf, Opera  */
html > body #tres {
  color: red;
}

/* IE8, FF, Saf, Opera (Everything but IE 6,7) */
html>/**/body #cuatro {
  color: red;
}

/* Opera 9.27 and below, safari 2 */
html:first-child #cinco {
  color: red;
}

/* Safari 2-3 */
html[xmlns*=''] body:last-child #seis {
  color: red;
}

/* safari 3+, chrome 1+, opera9+, ff 3.5+ */
body:nth-of-type(1) #siete {
  color: red;
}

/* safari 3+, chrome 1+, opera9+, ff 3.5+ */
body:first-of-type #ocho {
  color: red;
}

/* saf3+, chrome1+ */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  #diez {
    color: red;
  }
}

/* iPhone / mobile webkit */
@media screen and (max-device-width: 480px) {
  #veintiseis {
    color: red;
  }
}

/* Safari 2 - 3.1 */
html[xmlns*='']:root #trece {
  color: red;
}

/* Safari 2 - 3.1, Opera 9.25 */
*|html[xmlns*=''] #catorce {
  color: red;
}

/* Everything but IE6-8 */
:root * > #quince {
  color: red;
}

/* IE7 */
* + html #dieciocho {
  color: red;
}

/* Firefox only. 1+ */
#veinticuatro,
x:-moz-any-link {
  color: red;
}

/* Firefox 3.0+ */
#veinticinco,
x:-moz-any-link,
x:default {
  color: red;
}
```

- 属性 hack：不同浏览器解析 bug 或方法

```
/* IE6 */
#once { _color: blue }

/* IE6, IE7 */
#doce { *color: blue; /* or #color: blue */ }

/* Everything but IE6 */
#diecisiete { color/**/: blue }

/* IE6, IE7, IE8 */
#diecinueve { color: blue\9; }

/* IE7, IE8 */
#veinte { color/*\**/: blue\9; }

/* IE6, IE7 -- acts as an !important */
#veintesiete { color: blue !ie; } /* string after ! can be anything */
```

## 四十二、specified value,computed value,used value 计算方法

- specified value: 计算方法如下：

  1. 如果样式表设置了一个值，使用这个值
  2. 如果没有设值，且这个属性是继承属性，从父元素继承
  3. 如果没有设值，并且不是继承属性，则使用 css 规范指定的初始值

- computed value: 以 specified value 根据规范定义的行为进行计算，通常将相对值计算为绝对值，例如 em 根据 font-size 进行计算。一些使用百分数并且需要布局来决定最终值的属性，如 width，margin。百分数就直接作为 computed value。line-height 的无单位值也直接作为 computed value。这些值将在计算 used value 时得到绝对值。**computed value 的主要作用是用于继承**

- used value：属性计算后的最终值，对于大多数属性可以通过 window.getComputedStyle 获得，尺寸值单位为像素。以下属性依赖于布局，
  - background-position
  - bottom, left, right, top
  - height, width
  - margin-bottom, margin-left, margin-right, margin-top
  - min-height, min-width
  - padding-bottom, padding-left, padding-right, padding-top
  - text-indent

## 四十三、`link`与`@import`的区别

1. `link`是 HTML 方式， `@import`是 CSS 方式
2. `link`最大限度支持并行下载，`@import`过多嵌套导致串行下载，出现[FOUC](http://www.bluerobot.com/web/css/fouc.asp/)
3. `link`可以通过`rel="alternate stylesheet"`指定候选样式
4. 浏览器对`link`支持早于`@import`，可以使用`@import`对老浏览器隐藏样式
5. `@import`必须在样式规则之前，可以在 css 文件中引用其他文件
6. 总体来说：**[link 优于@import](http://www.stevesouders.com/blog/2009/04/09/dont-use-import/)**

## 四十四、`display: block;`和`display: inline;`的区别

`block`元素特点：

1.处于常规流中时，如果`width`没有设置，会自动填充满父容器 2.可以应用`margin/padding` 3.在没有设置高度的情况下会扩展高度以包含常规流中的子元素 4.处于常规流中时布局时在前后元素位置之间（独占一个水平空间） 5.忽略`vertical-align`

`inline`元素特点

1.水平方向上根据`direction`依次布局 2.不会在元素前后进行换行 3.受`white-space`控制 4.`margin/padding`在竖直方向上无效，水平方向上有效 5.`width/height`属性对非替换行内元素无效，宽度由元素内容决定 6.非替换行内元素的行框高由`line-height`确定，替换行内元素的行框高由`height`,`margin`,`padding`,`border`决定 6.浮动或绝对定位时会转换为`block` 7.`vertical-align`属性生效

## 四十五、PNG,GIF,JPG 的区别及如何选

参考资料： [选择正确的图片格式](http://www.yuiblog.com/blog/2008/11/04/imageopt-2/)
**GIF**:

1. 8 位像素，256 色
2. 无损压缩
3. 支持简单动画
4. 支持 boolean 透明
5. 适合简单动画

**JPEG**：

1. 颜色限于 256
2. 有损压缩
3. 可控制压缩质量
4. 不支持透明
5. 适合照片

**PNG**：

1. 有 PNG8 和 truecolor PNG
2. PNG8 类似 GIF 颜色上限为 256，文件小，支持 alpha 透明度，无动画
3. 适合图标、背景、按钮

## 四十六、CSS 有哪些继承属性

- 关于文字排版的属性如：
  - [font](https://developer.mozilla.org/en-US/docs/Web/CSS/font)
  - [word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break)
  - [letter-spacing](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing)
  - [text-align](https://developer.mozilla.org/en-US/docs/Web/CSS/text-align)
  - [text-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/text-rendering)
  - [word-spacing](https://developer.mozilla.org/en-US/docs/Web/CSS/word-spacing)
  - [white-space](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)
  - [text-indent](https://developer.mozilla.org/en-US/docs/Web/CSS/text-indent)
  - [text-transform](https://developer.mozilla.org/en-US/docs/Web/CSS/text-transform)
  - [text-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow)
- [line-height](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height)
- [color](https://developer.mozilla.org/en-US/docs/Web/CSS/color)
- [visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility)
- [cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)

## 四十七、IE6 浏览器有哪些常见的 bug,缺陷或者与标准不一致的地方,如何解决

- IE6 不支持 min-height，解决办法使用 css hack：

```
.target {
    min-height: 100px;
    height: auto !important;
    height: 100px;   // IE6下内容高度超过会自动扩展高度
}
```

- `ol`内`li`的序号全为 1，不递增。解决方法：为 li 设置样式`display: list-item;`

- 未定位父元素`overflow: auto;`，包含`position: relative;`子元素，子元素高于父元素时会溢出。解决办法：1）子元素去掉`position: relative;`; 2）不能为子元素去掉定位时，父元素`position: relative;`

```
<style type="text/css">
.outer {
    width: 215px;
    height: 100px;
    border: 1px solid red;
    overflow: auto;
    position: relative;  /* 修复bug */
}
.inner {
    width: 100px;
    height: 200px;
    background-color: purple;
    position: relative;
}
</style>

<div class="outer">
    <div class="inner"></div>
</div>
```

- IE6 只支持`a`标签的`:hover`伪类，解决方法：使用 js 为元素监听 mouseenter，mouseleave 事件，添加类实现效果：

```
<style type="text/css">
.p:hover,
.hover {
    background: purple;
}
</style>

<p class="p" id="target">aaaa bbbbb<span>DDDDDDDDDDDd</span> aaaa lkjlkjdf j</p>

<script type="text/javascript">
function addClass(elem, cls) {
    if (elem.className) {
        elem.className += ' ' + cls;
    } else {
        elem.className = cls;
    }
}
function removeClass(elem, cls) {
    var className = ' ' + elem.className + ' ';
    var reg = new RegExp(' +' + cls + ' +', 'g');
    elem.className = className.replace(reg, ' ').replace(/^ +| +$/, '');
}

var target = document.getElementById('target');
if (target.attachEvent) {
    target.attachEvent('onmouseenter', function () {
        addClass(target, 'hover');
    });
    target.attachEvent('onmouseleave', function () {
        removeClass(target, 'hover');
    })
}
</script>
```

- IE5-8 不支持`opacity`，解决办法：

```
.opacity {
    opacity: 0.4
    filter: alpha(opacity=60); /* for IE5-7 */
    -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=60)"; /* for IE 8*/
}
```

- IE6 在设置`height`小于`font-size`时高度值为`font-size`，解决办法：`font-size: 0;`
- IE6 不支持 PNG 透明背景，解决办法: **IE6 下使用 gif 图片**
- IE6-7 不支持`display: inline-block`解决办法：设置 inline 并触发 hasLayout

```
    display: inline-block;
    *display: inline;
    *zoom: 1;
```

- IE6 下浮动元素在浮动方向上与父元素边界接触元素的外边距会加倍。解决办法：
  1）使用 padding 控制间距。
  2）浮动元素`display: inline;`这样解决问题且无任何副作用：css 标准规定浮动元素 display:inline 会自动调整为 block
- 通过为块级元素设置宽度和左右 margin 为 auto 时，IE6 不能实现水平居中，解决方法：为父元素设置`text-align: center;`

## 四十八、容器包含若干浮动元素时如何清理(包含)浮动

1. 容器元素闭合标签前添加额外元素并设置`clear: both`
2. 父元素触发块级格式化上下文(见块级可视化上下文部分)
3. 设置容器元素伪元素进行清理[推荐的清理浮动方法](http://nicolasgallagher.com/micro-clearfix-hack/)

```
/**
* 在标准浏览器下使用
* 1 content内容为空格用于修复opera下文档中出现
*   contenteditable属性时在清理浮动元素上下的空白
* 2 使用display使用table而不是block：可以防止容器和
*   子元素top-margin折叠,这样能使清理效果与BFC，IE6/7
*   zoom: 1;一致
**/

.clearfix:before,
.clearfix:after {
    content: " "; /* 1 */
    display: table; /* 2 */
}

.clearfix:after {
    clear: both;
}

/**
* IE 6/7下使用
* 通过触发hasLayout实现包含浮动
**/
.clearfix {
    *zoom: 1;
}
```

## 四十九、什么是 FOUC?如何避免

Flash Of Unstyled Content：用户定义样式表加载之前浏览器使用默认样式显示文档，用户样式加载渲染之后再从新显示文档，造成页面闪烁。**解决方法**：把样式表放到文档的`head`

## 五十、如何创建块级格式化上下文(block formatting context),BFC 有什么用

创建规则：

1. 根元素
2. 浮动元素（`float`不是`none`）
3. 绝对定位元素（`position`取值为`absolute`或`fixed`）
4. `display`取值为`inline-block`,`table-cell`, `table-caption`,`flex`, `inline-flex`之一的元素
5. `overflow`不是`visible`的元素

作用：

1. 可以包含浮动元素
2. 不被浮动元素覆盖
3. 阻止父子元素的 margin 折叠

## 五十一、display,float,position 的关系

1. 如果`display`为 none，那么 position 和 float 都不起作用，这种情况下元素不产生框
2. 否则，如果 position 值为 absolute 或者 fixed，框就是绝对定位的，float 的计算值为 none，display 根据下面的表格进行调整。
3. 否则，如果 float 不是 none，框是浮动的，display 根据下表进行调整
4. 否则，如果元素是根元素，display 根据下表进行调整
5. 其他情况下 display 的值为指定值
    总结起来：**绝对定位、浮动、根元素都需要调整`display`**
    ![display转换规则](https://user-images.githubusercontent.com/8088864/126057344-e6e66b1a-edc3-4725-bf4a-835f9153a1eb.png)

## 五十二、外边距折叠(collapsing margins)

毗邻的两个或多个`margin`会合并成一个 margin，叫做外边距折叠。规则如下：

1. 两个或多个毗邻的普通流中的块元素垂直方向上的 margin 会折叠
2. 浮动元素/inline-block 元素/绝对定位元素的 margin 不会和垂直方向上的其他元素的 margin 折叠
3. 创建了块级格式化上下文的元素，不会和它的子元素发生 margin 折叠
4. 元素自身的 margin-bottom 和 margin-top 相邻时也会折叠

## 五十三、如何确定一个元素的包含块(containing block)

1. 根元素的包含块叫做初始包含块，在连续媒体中他的尺寸与 viewport 相同并且 anchored at the canvas origin；对于 paged media，它的尺寸等于 page area。初始包含块的 direction 属性与根元素相同。
2. `position`为`relative`或者`static`的元素，它的包含块由最近的块级（`display`为`block`,`list-item`, `table`）祖先元素的**内容框**组成
3. 如果元素`position`为`fixed`。对于连续媒体，它的包含块为 viewport；对于 paged media，包含块为 page area
4. 如果元素`position`为`absolute`，它的包含块由祖先元素中最近一个`position`为`relative`,`absolute`或者`fixed`的元素产生，规则如下：

   - 如果祖先元素为行内元素，the containing block is the bounding box around the **padding boxes** of the first and the last inline boxes generated for that element.
   - 其他情况下包含块由祖先节点的**padding edge**组成

   如果找不到定位的祖先元素，包含块为**初始包含块**

## 五十四、stacking context,布局规则

z 轴上的默认层叠顺序如下（从下到上）：

1. 根元素的边界和背景
2. 常规流中的元素按照 html 中顺序
3. 浮动块
4. positioned 元素按照 html 中出现顺序

如何创建 stacking context：

1. 根元素
2. z-index 不为 auto 的定位元素
3. a flex item with a z-index value other than 'auto'
4. opacity 小于 1 的元素
5. 在移动端 webkit 和 chrome22+，z-index 为 auto，position: fixed 也将创建新的 stacking context

## 五十五、如何水平居中一个元素

- 如果需要居中的元素为**常规流中 inline 元素**，为父元素设置`text-align: center;`即可实现
- 如果需要居中的元素为**常规流中 block 元素**，1）为元素设置宽度，2）设置左右 margin 为 auto。3）IE6 下需在父元素上设置`text-align: center;`,再给子元素恢复需要的值

```
<body>
    <div class="content">
    aaaaaa aaaaaa a a a a a a a a
    </div>
</body>

<style>
    body {
        background: #DDD;
        text-align: center; /* 3 */
    }
    .content {
        width: 500px;      /* 1 */
        text-align: left;  /* 3 */
        margin: 0 auto;    /* 2 */

        background: purple;
    }
</style>
```

- 如果需要居中的元素为**浮动元素**，1）为元素设置宽度，2）`position: relative;`，3）浮动方向偏移量（left 或者 right）设置为 50%，4）浮动方向上的 margin 设置为元素宽度一半乘以-1

```
<body>
    <div class="content">
    aaaaaa aaaaaa a a a a a a a a
    </div>
</body>

<style>
    body {
        background: #DDD;
    }
    .content {
        width: 500px;         /* 1 */
        float: left;

        position: relative;   /* 2 */
        left: 50%;            /* 3 */
        margin-left: -250px;  /* 4 */

        background-color: purple;
    }
</style>
```

- 如果需要居中的元素为**绝对定位元素**，1）为元素设置宽度，2）偏移量设置为 50%，3）偏移方向外边距设置为元素宽度一半乘以-1

```
<body>
    <div class="content">
    aaaaaa aaaaaa a a a a a a a a
    </div>
</body>

<style>
    body {
        background: #DDD;
        position: relative;
    }
    .content {
        width: 800px;

        position: absolute;
        left: 50%;
        margin-left: -400px;

        background-color: purple;
    }
</style>
```

- 如果需要居中的元素为**绝对定位元素**，1）为元素设置宽度，2）设置左右偏移量都为 0,3）设置左右外边距都为 auto

```
<body>
    <div class="content">
    aaaaaa aaaaaa a a a a a a a a
    </div>
</body>

<style>
    body {
        background: #DDD;
        position: relative;
    }
    .content {
        width: 800px;

        position: absolute;
        margin: 0 auto;
        left: 0;
        right: 0;

        background-color: purple;
    }
</style>
```

## 六十、如何竖直居中一个元素

参考资料：[6 Methods For Vertical Centering With CSS](http://www.vanseodesign.com/css/vertical-centering/)。 [盘点 8 种 CSS 实现垂直居中](http://blog.csdn.net/freshlover/article/details/11579669)

- 需要居中元素为**单行文本**，为包含文本的元素设置大于`font-size`的`line-height`：

```
<p class="text">center text</p>

<style>
.text {
    line-height: 200px;
}
</style>
```

## 六十一、DOM 元素 e 的 e.getAttribute(propName)和 e.propName 有什么区别和联系

- e.getAttribute()，是标准 DOM 操作文档元素属性的方法，具有通用性可在任意文档上使用，返回元素在源文件中**设置的属性**
- e.propName 通常是在 HTML 文档中访问特定元素的**特性**，浏览器解析元素后生成对应对象（如 a 标签生成 HTMLAnchorElement），这些对象的特性会根据特定规则结合属性设置得到，对于没有对应特性的属性，只能使用 getAttribute 进行访问
- e.getAttribute()返回值是源文件中设置的值，类型是字符串或者 null（有的实现返回""）
- e.propName 返回值可能是字符串、布尔值、对象、undefined 等
- 大部分 attribute 与 property 是一一对应关系，修改其中一个会影响另一个，如 id，title 等属性
- 一些布尔属性`<input hidden/>`的检测设置需要 hasAttribute 和 removeAttribute 来完成，或者设置对应 property
- 像`<a href="../index.html">link</a>`中 href 属性，转换成 property 的时候需要通过转换得到完整 URL
- 一些 attribute 和 property 不是一一对应如：form 控件中`<input value="hello"/>`对应的是 defaultValue，修改或设置 value property 修改的是控件当前值，setAttribute 修改 value 属性不会改变 value property

## 六十二、offsetWidth/offsetHeight,clientWidth/clientHeight 与 scrollWidth/scrollHeight 的区别

- offsetWidth/offsetHeight 返回值包含**content + padding + border**，效果与 e.getBoundingClientRect()相同
- clientWidth/clientHeight 返回值只包含**content + padding**，如果有滚动条，也**不包含滚动条**
- scrollWidth/scrollHeight 返回值包含**content + padding + 溢出内容的尺寸**

[Measuring Element Dimension and Location with CSSOM in Windows Internet Explorer 9](<http://msdn.microsoft.com/en-us/library/ie/hh781509(v=vs.85).aspx>)

![元素尺寸](https://user-images.githubusercontent.com/8088864/126057392-4ee53f39-9730-4aae-aa18-2f25236b6dd2.png)

## 六十三、XMLHttpRequest 通用属性和方法

1. `readyState`:表示请求状态的整数，取值：

- UNSENT（0）：对象已创建
- OPENED（1）：open()成功调用，在这个状态下，可以为 xhr 设置请求头，或者使用 send()发送请求
- HEADERS_RECEIVED(2)：所有重定向已经自动完成访问，并且最终响应的 HTTP 头已经收到
- LOADING(3)：响应体正在接收
- DONE(4)：数据传输完成或者传输产生错误

3. `onreadystatechange`：readyState 改变时调用的函数
4. `status`：服务器返回的 HTTP 状态码（如，200， 404）
5. `statusText`:服务器返回的 HTTP 状态信息（如，OK，No Content）
6. `responseText`:作为字符串形式的来自服务器的完整响应
7. `responseXML`: Document 对象，表示服务器的响应解析成的 XML 文档
8. `abort()`:取消异步 HTTP 请求
9. `getAllResponseHeaders()`: 返回一个字符串，包含响应中服务器发送的全部 HTTP 报头。每个报头都是一个用冒号分隔开的名/值对，并且使用一个回车/换行来分隔报头行
10. `getResponseHeader(headerName)`:返回 headName 对应的报头值
11. `open(method, url, asynchronous [, user, password])`:初始化准备发送到服务器上的请求。method 是 HTTP 方法，不区分大小写；url 是请求发送的相对或绝对 URL；asynchronous 表示请求是否异步；user 和 password 提供身份验证
12. `setRequestHeader(name, value)`:设置 HTTP 报头
13. `send(body)`:对服务器请求进行初始化。参数 body 包含请求的主体部分，对于 POST 请求为键值对字符串；对于 GET 请求，为 null

## 六十四、focus/blur 与 focusin/focusout 的区别与联系

1. focus/blur 不冒泡，focusin/focusout 冒泡
2. focus/blur 兼容性好，focusin/focusout 在除 FireFox 外的浏览器下都保持良好兼容性，如需使用事件托管，可考虑在 FireFox 下使用事件捕获 elem.addEventListener('focus', handler, true)
3. 可获得焦点的元素：
   1. window
   2. 链接被点击或键盘操作
   3. 表单空间被点击或键盘操作
   4. 设置`tabindex`属性的元素被点击或键盘操作

## 六十五、mouseover/mouseout 与 mouseenter/mouseleave 的区别与联系

1. mouseover/mouseout 是标准事件，**所有浏览器都支持**；mouseenter/mouseleave 是 IE5.5 引入的特有事件后来被 DOM3 标准采纳，现代标准浏览器也支持
2. mouseover/mouseout 是**冒泡**事件；mouseenter/mouseleave**不冒泡**。需要为**多个元素监听鼠标移入/出事件时，推荐 mouseover/mouseout 托管，提高性能**
3. 标准事件模型中 **event.target** 表示正在发生移入/移出的元素，**event.relatedTarget**表示对应移入/移出的目标元素；在老 IE 中 **event.srcElement** 表示正在发生移入/移出的元素，**event.toElement**表示移出的目标元素，**event.fromElement**表示移入时的来源元素

例子：鼠标从 div#target 元素移出时进行处理，判断逻辑如下：
``` html
    <div id="target"><span>test</span></div>

    <script type="text/javascript">
    var target = document.getElementById('target');
    if (target.addEventListener) {
      target.addEventListener('mouseout', mouseoutHandler, false);
    } else if (target.attachEvent) {
      target.attachEvent('onmouseout', mouseoutHandler);
    }

    function mouseoutHandler(e) {
      e = e || window.event;
      var target = e.target || e.srcElement;

      // 判断移出鼠标的元素是否为目标元素
      if (target.id !== 'target') {
        return;
      }

      // 判断鼠标是移出元素还是移到子元素
      var relatedTarget = e.relatedTarget || e.toElement;
      while (relatedTarget !== target
        && relatedTarget.nodeName.toUpperCase() !== 'BODY') {
        relatedTarget = relatedTarget.parentNode;
      }

      // 如果相等，说明鼠标在元素内部移动
      if (relatedTarget === target) {
        return;
      }

      // 执行需要操作
      //alert('鼠标移出');

    }
    </script>
```

## 六十六、sessionStorage,localStorage,cookie 区别

1. 都会在浏览器端保存，有大小限制，同源限制
2. cookie 会在请求时发送到服务器，作为会话标识，服务器可修改 cookie；web storage 不会发送到服务器
3. cookie 有 path 概念，子路径可以访问父路径 cookie，父路径不能访问子路径 cookie
4. 有效期：cookie 在设置的有效期内有效，默认为浏览器关闭；sessionStorage 在窗口关闭前有效，localStorage 长期有效，直到用户删除
5. 共享：sessionStorage 不能共享，localStorage 在同源文档之间共享，cookie 在同源且符合 path 规则的文档之间共享
6. localStorage 的修改会促发其他文档窗口的 update 事件
7. cookie 有 secure 属性要求 HTTPS 传输
8. 浏览器不能保存超过 300 个 cookie，单个服务器不能超过 20 个，每个 cookie 不能超过 4k。web storage 大小支持能达到 5M

## 六十七、javascript 跨域通信

同源：两个文档同源需满足

1. 协议相同
2. 域名相同
3. 端口相同

跨域通信：js 进行 DOM 操作、通信时如果目标与当前窗口不满足同源条件，浏览器为了安全会阻止跨域操作。跨域通信通常有以下方法

- 如果是 log 之类的简单**单项通信**，新建`<img>`,`<script>`,`<link>`,`<iframe>`元素，通过 src，href 属性设置为目标 url。实现跨域请求
- 如果请求**json 数据**，使用`<script>`进行 jsonp 请求
- 现代浏览器中**多窗口通信**使用 HTML5 规范的 targetWindow.postMessage(data, origin);其中 data 是需要发送的对象，origin 是目标窗口的 origin。window.addEventListener('message', handler, false);handler 的 event.data 是 postMessage 发送来的数据，event.origin 是发送窗口的 origin，event.source 是发送消息的窗口引用
- 内部服务器代理请求跨域 url，然后返回数据
- 跨域请求数据，现代浏览器可使用 HTML5 规范的 CORS 功能，只要目标服务器返回 HTTP 头部**`Access-Control-Allow-Origin: *`**即可像普通 ajax 一样访问跨域资源

## 六十八、javascript 有哪几种数据类型

六种基本数据类型

- undefined
- null
- string
- boolean
- number
- [symbol](https://developer.mozilla.org/en-US/docs/Glossary/Symbol)(ES6)

一种引用类型

- Object

## 六十九、什么闭包,闭包有什么用

**闭包是在某个作用域内定义的函数，它可以访问这个作用域内的所有变量**。闭包作用域链通常包括三个部分：

1. 函数本身作用域。
2. 闭包定义时的作用域。
3. 全局作用域。

闭包常见用途：

1. 创建特权方法用于访问控制
2. 事件处理程序及回调

## 七十、javascript 有哪几种方法定义函数

1. [函数声明表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)
2. [function 操作符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function)
3. [Function 构造函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)
4. [ES6:arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/arrow_functions)

重要参考资料：[MDN:Functions_and_function_scope](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope)

## 七十一、应用程序存储和离线 web 应用

HTML5 新增应用程序缓存，允许 web 应用将应用程序自身保存到用户浏览器中，用户离线状态也能访问。
1. 为 html 元素设置 manifest 属性:`<html manifest="myapp.appcache" >`，其中后缀名只是一个约定，真正识别方式是通过`text/cache-manifest`作为 MIME 类型。所以需要配置服务器保证设置正确
2. manifest 文件首行为`CACHE MANIFEST`，其余就是要缓存的 URL 列表，每个一行，相对路径都相对于 manifest 文件的 url。注释以#开头
3. url 分为三种类型：
  - `CACHE`：为默认类型，列举的所有的文件都会被缓存。
  - `NETWORK`：开头的区域列举的文件，总是从线上获取，表示资源从不缓存。
    头信息支持通配符"*"，表示任何未明确列举的资源，都将通过网络加载。
  - `FALLBACK`：开头的区域中的内容，提供了获取不到缓存资源时的备选资源路径。
    该区域中的内容，每一行包含两个URL（第一个URL是一个前缀，任何匹配的资源都不被缓存，第二个URL表示需要被缓存的资源，如果从网络中载入第一个 URL 失败的话，就会用第二个 URL 指定的缓存资源来替代）

以下是一个文件例子：

```
CACHE MANIFEST

CACHE:
myapp.html
myapp.css
myapp.js

FALLBACK:
videos/ offline_help.html

NETWORK:
cgi/
```

## 七十二、客户端存储 localStorage 和 sessionStorage

- localStorage 有效期为永久，sessionStorage 有效期为顶层窗口关闭前
- 同源文档可以读取并修改 localStorage 数据，sessionStorage 只允许同一个窗口下的文档访问，如通过 iframe 引入的同源文档。
- Storage 对象通常被当做普通 javascript 对象使用：**通过设置属性来存取字符串值**，也可以通过**setItem(key, value)设置**，**getItem(key)读取**，**removeItem(key)删除**，**clear()删除所有数据**，**length 表示已存储的数据项数目**，**key(index)返回对应索引的 key**

```
localStorage.setItem('x', 1); // storge x->1
localStorage.getItem('x); // return value of x

// 枚举所有存储的键值对
for (var i = 0, len = localStorage.length; i < len; ++i ) {
    var name = localStorage.key(i);
    var value = localStorage.getItem(name);
}

localStorage.removeItem('x'); // remove x
localStorage.clear();  // remove all data
```

## 七十三、cookie 及其操作

- cookie 是 web 浏览器存储的少量数据，最早设计为服务器端使用，作为 HTTP 协议的扩展实现。cookie 数据会自动在浏览器和服务器之间传输。
- 通过读写 cookie 检测是否支持
- cookie 属性有**名**，**值**，**max-age**，**path**, **domain**，**secure**；
- cookie 默认有效期为浏览器会话，一旦用户关闭浏览器，数据就丢失，通过设置**max-age=seconds**属性告诉浏览器 cookie 有效期
- cookie 作用域通过**文档源**和**文档路径**来确定，通过**path**和**domain**进行配置，web 页面同目录或子目录文档都可访问
- 通过 cookie 保存数据的方法为：为 document.cookie 设置一个符合目标的字符串如下
- 读取 document.cookie 获得'; '分隔的字符串，key=value,解析得到结果

```
document.cookie = 'name=qiu; max-age=9999; path=/; domain=domain; secure';

document.cookie = 'name=aaa; path=/; domain=domain; secure';
// 要改变cookie的值，需要使用相同的名字、路径和域，新的值
// 来设置cookie，同样的方法可以用来改变有效期

// 设置max-age为0可以删除指定cookie

//读取cookie，访问document.cookie返回键值对组成的字符串，
//不同键值对之间用'; '分隔。通过解析获得需要的值
```

[cookieUtil.js](https://github.com/qiu-deqing/google/blob/master/module/js/cookieUtil.js)：自己写的 cookie 操作工具

## 七十四、javascript 有哪些方法定义对象

1. 对象字面量： `var obj = {};`
2. 构造函数： `var obj = new Object();`
3. Object.create(): `var obj = Object.create(Object.prototype);`

## 七十五、===运算符判断相等的流程是怎样的

1. 如果两个值不是相同类型，它们不相等
2. 如果两个值都是 null 或者都是 undefined，它们相等
3. 如果两个值都是布尔类型 true 或者都是 false，它们相等
4. 如果其中有一个是**NaN**，它们不相等
5. 如果都是数值型并且数值相等，他们相等， -0 等于 0
6. 如果他们都是字符串并且在相同位置包含相同的 16 位值，他它们相等；如果在长度或者内容上不等，它们不相等；两个字符串显示结果相同但是编码不同==和===都认为他们不相等
7. 如果他们指向相同对象、数组、函数，它们相等；如果指向不同对象，他们不相等

## 七十六、==运算符判断相等的流程是怎样的

1. 如果两个值类型相同，按照===比较方法进行比较
2. 如果类型不同，使用如下规则进行比较
3. 如果其中一个值是 null，另一个是 undefined，它们相等
4. 如果一个值是**数字**另一个是**字符串**，将**字符串转换为数字**进行比较
5. 如果有布尔类型，将**true 转换为 1，false 转换为 0**，然后用==规则继续比较
6. 如果一个值是对象，另一个是数字或字符串，将对象转换为原始值然后用==规则继续比较
7. **其他所有情况都认为不相等**

## 七十七、对象到字符串的转换步骤

1. 如果对象有 toString()方法，javascript 调用它。如果返回一个原始值（primitive value 如：string number boolean）,将这个值转换为字符串作为结果
2. 如果对象没有 toString()方法或者返回值不是原始值，javascript 寻找对象的 valueOf()方法，如果存在就调用它，返回结果是原始值则转为字符串作为结果
3. 否则，javascript 不能从 toString()或者 valueOf()获得一个原始值，此时 throws a TypeError

## 七十八、对象到数字的转换步骤

    1. 如果对象有valueOf()方法并且返回元素值，javascript将返回值转换为数字作为结果
    2. 否则，如果对象有toString()并且返回原始值，javascript将返回结果转换为数字作为结果
    3. 否则，throws a TypeError

## 七十九、<,>,<=,>=的比较规则

所有比较运算符都支持任意类型，但是**比较只支持数字和字符串**，所以需要执行必要的转换然后进行比较，转换规则如下:

1. 如果操作数是对象，转换为原始值：如果 valueOf 方法返回原始值，则使用这个值，否则使用 toString 方法的结果，如果转换失败则报错
2. 经过必要的对象到原始值的转换后，如果两个操作数都是字符串，按照字母顺序进行比较（他们的 16 位 unicode 值的大小）
3. 否则，如果有一个操作数不是字符串，**将两个操作数转换为数字**进行比较

## 八十、+运算符工作流程

1. 如果有操作数是对象，转换为原始值
2. 此时如果有**一个操作数是字符串**，其他的操作数都转换为字符串并执行连接
3. 否则：**所有操作数都转换为数字并执行加法**

## 八十一、函数内部 arguments 变量有哪些特性,有哪些属性,如何将它转换为数组

- arguments 所有函数中都包含的一个局部变量，是一个类数组对象，对应函数调用时的实参。如果函数定义同名参数会在调用时覆盖默认对象
- arguments[index]分别对应函数调用时的实参，并且通过 arguments 修改实参时会同时修改实参
- arguments.length 为实参的个数（Function.length 表示形参长度）
- arguments.callee 为当前正在执行的函数本身，使用这个属性进行递归调用时需注意 this 的变化
- arguments.caller 为调用当前函数的函数（已被遗弃）
- 转换为数组：<code>var args = Array.prototype.slice.call(arguments, 0);</code>

## 八十二、DOM 事件模型是如何的,编写一个 EventUtil 工具类实现事件管理兼容

- DOM 事件包含捕获（capture）和冒泡（bubble）两个阶段：捕获阶段事件从 window 开始触发事件然后通过祖先节点一次传递到触发事件的 DOM 元素上；冒泡阶段事件从初始元素依次向祖先节点传递直到 window
- 标准事件监听 elem.addEventListener(type, handler, capture)/elem.removeEventListener(type, handler, capture)：handler 接收保存事件信息的 event 对象作为参数，event.target 为触发事件的对象，handler 调用上下文 this 为绑定监听器的对象，event.preventDefault()取消事件默认行为，event.stopPropagation()/event.stopImmediatePropagation()取消事件传递
- 老版本 IE 事件监听 elem.attachEvent('on'+type, handler)/elem.detachEvent('on'+type, handler)：handler 不接收 event 作为参数，事件信息保存在 window.event 中，触发事件的对象为 event.srcElement，handler 执行上下文 this 为 window 使用闭包中调用 handler.call(elem, event)可模仿标准模型，然后返回闭包，保证了监听器的移除。event.returnValue 为 false 时取消事件默认行为，event.cancleBubble 为 true 时取消时间传播
- 通常利用事件冒泡机制托管事件处理程序提高程序性能。

``` js
/**
 * 跨浏览器事件处理工具。只支持冒泡。不支持捕获
 * @author  (qiu_deqing@126.com)
 */

var EventUtil = {
    getEvent: function (event) {
        return event || window.event;
    },
    getTarget: function (event) {
        return event.target || event.srcElement;
    },
    // 返回注册成功的监听器，IE中需要使用返回值来移除监听器
    on: function (elem, type, handler) {
        if (elem.addEventListener) {
            elem.addEventListener(type, handler, false);
            return handler;
        } else if (elem.attachEvent) {
            var wrapper = function () {
              var event = window.event;
              event.target = event.srcElement;
              handler.call(elem, event);
            };
            elem.attachEvent('on' + type, wrapper);
            return wrapper;
        }
    },
    off: function (elem, type, handler) {
        if (elem.removeEventListener) {
            elem.removeEventListener(type, handler, false);
        } else if (elem.detachEvent) {
            elem.detachEvent('on' + type, handler);
        }
    },
    preventDefault: function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else if ('returnValue' in event) {
            event.returnValue = false;
        }
    },
    stopPropagation: function (event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else if ('cancelBubble' in event) {
            event.cancelBubble = true;
        }
    },
    /**
     * keypress事件跨浏览器获取输入字符
     * 某些浏览器在一些特殊键上也触发keypress，此时返回null
     **/
     getChar: function (event) {
        if (event.which == null) {
            return String.fromCharCode(event.keyCode);  // IE
        }
        else if (event.which != 0 && event.charCode != 0) {
            return String.fromCharCode(event.which);    // the rest
        }
        else {
            return null;    // special key
        }
     }
};
```

## 八十三、评价一下三种方法实现继承的优缺点,并改进

``` js
function Shape() {}

function Rect() {}

// 方法1
Rect.prototype = new Shape();

// 方法2
Rect.prototype = Shape.prototype;

// 方法3
Rect.prototype = Object.create(Shape.prototype);

Rect.prototype.area = function () {
  // do something
};
```

方法 1：

1. 优点：正确设置原型链实现继承
2. 优点：父类实例属性得到继承，原型链查找效率提高，也能为一些属性提供合理的默认值
3. 缺点：父类实例属性为引用类型时，不恰当地修改会导致所有子类被修改
4. 缺点：创建父类实例作为子类原型时，可能无法确定构造函数需要的合理参数，这样提供的参数继承给子类没有实际意义，当子类需要这些参数时应该在构造函数中进行初始化和设置
5. 总结：继承应该是继承方法而不是属性，为子类设置父类实例属性应该是通过在子类构造函数中调用父类构造函数进行初始化

方法 2：

1. 优点：正确设置原型链实现继承
2. 缺点：父类构造函数原型与子类相同。修改子类原型添加方法会修改父类

方法 3：

1. 优点：正确设置原型链且避免方法 1.2 中的缺点
2. 缺点：ES5 方法需要注意兼容性

改进：

1. 所有三种方法应该在子类构造函数中调用父类构造函数实现实例属性初始化

``` js
function Rect() {
    Shape.call(this);
}
```

2. 用新创建的对象替代子类默认原型，设置`Rect.prototype.constructor = Rect;`保证一致性
3. 第三种方法的 polyfill：

``` js
function create(obj) {
    if (Object.create) {
        return Object.create(obj);
    }

    function f() {};
    f.prototype = obj;
    return new f();
}
```


## 八十四、请用原生 js 实现一个函数,给页面制定的任意一个元素添加一个透明遮罩(透明度可变,默认 0.2),使这个区域点击无效,要求兼容 IE8+及各主流浏览器,遮罩层效果如下图所示:

![遮罩效果element-mask](https://user-images.githubusercontent.com/8088864/126057428-01adc5e4-777a-4a01-a64b-80638392e51e.jpg)

``` html
<style>
#target {
    width: 200px;
    height: 300px;
    margin: 40px;
    background-color: tomato;
}
</style>

<div id="target"></div>

<script>
function addMask(elem, opacity) {
    opacity = opacity || 0.2;

    var rect = elem.getBoundingClientRect();
    var style = getComputedStyle(elem, null);

    var mask = document.createElement('div');
    mask.style.position = 'absolute';
    var marginLeft = parseFloat(style.marginLeft);
    mask.style.left = (elem.offsetLeft - marginLeft) + 'px';
    var marginTop = parseFloat(style.marginTop);
    mask.style.top = (elem.offsetTop - marginTop) + 'px';
    mask.style.zIndex = 9999;
    mask.style.opacity = '' + opacity;
    mask.style.backgroundColor = '#000';

    mask.style.width = (parseFloat(style.marginLeft) +
        parseFloat(style.marginRight) + rect.width) + 'px';
    mask.style.height = (parseFloat(style.marginTop) +
        parseFloat(style.marginBottom) + rect.height) + 'px';

    elem.parentNode.appendChild(mask);
}

var target = document.getElementById('target');
addMask(target);

target.addEventListener('click', function () {
    console.log('click');
}, false);
</script>
```

## 八十五、请用代码写出(今天是星期 x)其中 x 表示当天是星期几,如果当天是星期一,输出应该是"今天是星期一"

``` js
var days = ['日','一','二','三','四','五','六'];
var date = new Date();

console.log('今天是星期' + days[date.getDay()]);
```

## 八十六、下面这段代码想要循环延时输出结果 0 1 2 3 4,请问输出结果是否正确,如果不正确,请说明为什么,并修改循环内的代码使其输出正确结果

``` js
for (var i = 0; i < 5; ++i) {
  setTimeout(function () {
    console.log(i + ' ');
  }, 100);
}
```

不能输出正确结果，因为循环中 setTimeout 接受的参数函数通过闭包访问变量 i。javascript 运行环境为单线程，setTimeout 注册的函数需要等待线程空闲才能执行，此时 for 循环已经结束，i 值为 5.五个定时输出都是 5
修改方法：将 setTimeout 放在函数立即调用表达式中，将 i 值作为参数传递给包裹函数，创建新闭包

``` js
for (var i = 0; i < 5; ++i) {
  (function (i) {
    setTimeout(function () {
      console.log(i + ' ');
    }, 100);
  }(i));
}
```

## 八十七、现有一个 Page 类,其原型对象上有许多以 post 开头的方法(如 postMsg);另有一拦截函数 chekc,只返回 ture 或 false.请设计一个函数,该函数应批量改造原 Page 的 postXXX 方法,在保留其原有功能的同时,为每个 postXXX 方法增加拦截验证功能,当 chekc 返回 true 时继续执行原 postXXX 方法,返回 false 时不再执行原 postXXX 方法

``` js
function Page() {}

Page.prototype = {
  constructor: Page,

  postA: function (a) {
    console.log('a:' + a);
  },
  postB: function (b) {
    console.log('b:' + b);
  },
  postC: function (c) {
    console.log('c:' + c);
  },
  check: function () {
    return Math.random() > 0.5;
  }
}

function checkfy(obj) {
  for (var key in obj) {
    if (key.indexOf('post') === 0 && typeof obj[key] === 'function') {
      (function (key) {
        var fn = obj[key];
        obj[key] = function () {
          if (obj.check()) {
            fn.apply(obj, arguments);
          }
        };
      }(key));
    }
  }
} // end checkfy()

checkfy(Page.prototype);

var obj = new Page();

obj.postA('checkfy');
obj.postB('checkfy');
obj.postC('checkfy');
```

## 八十八、编写 javascript 深度克隆函数 deepClone

``` js
    function deepClone(obj) {
        var _toString = Object.prototype.toString;

        // null, undefined, non-object, function
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        // DOM Node
        if (obj.nodeType && 'cloneNode' in obj) {
            return obj.cloneNode(true);
        }

        // Date
        if (_toString.call(obj) === '[object Date]') {
            return new Date(obj.getTime());
        }

        // RegExp
        if (_toString.call(obj) === '[object RegExp]') {
            var flags = [];
            if (obj.global) { flags.push('g'); }
            if (obj.multiline) { flags.push('m'); }
            if (obj.ignoreCase) { flags.push('i'); }

            return new RegExp(obj.source, flags.join(''));
        }

        var result = Array.isArray(obj) ? [] :
            obj.constructor ? new obj.constructor() : {};

        for (var key in obj ) {
            result[key] = deepClone(obj[key]);
        }

        return result;
    }

    function A() {
        this.a = a;
    }

    var a = {
        name: 'qiu',
        birth: new Date(),
        pattern: /qiu/gim,
        container: document.body,
        hobbys: ['book', new Date(), /aaa/gim, 111]
    };

    var c = new A();
    var b = deepClone(c);
    console.log(c.a === b.a);
    console.log(c, b);
```

## 八十九、补充代码,鼠标单击 Button1 后将 Button1 移动到 Button2 的后面

``` html
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>TEst</title>
    </head>
    <body>

    <div>
       <input type="button" id ="button1" value="1" />
       <input type="button" id ="button2" value="2" />
    </div>

    <script type="text/javascript">
        var btn1 = document.getElementById('button1');
        var btn2 = document.getElementById('button2');

        addListener(btn1, 'click', function (event) {
            btn1.parentNode.insertBefore(btn2, btn1);
        });

        function addListener(elem, type, handler) {
            if (elem.addEventListener) {
                elem.addEventListener(type, handler, false);
                return handler;
            } else if (elem.attachEvent) {
                function wrapper() {
                    var event = window.event;
                    event.target = event.srcElement;
                    handler.call(elem, event);
                }
                elem.attachEvent('on' + type, wrapper);
                return wrapper;
            }
        }

    </script>
    </body>
    </html>
```

## 九十、网页中实现一个计算当年还剩多少时间的倒数计时程序,要求网页上实时动态显示"×× 年还剩 ×× 天 ×× 时 ×× 分 ×× 秒"

``` html
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>TEst</title>
    </head>
    <body>

        <span id="target"></span>


    <script type="text/javascript">
        // 为了简化。每月默认30天
        function getTimeString() {
            var start = new Date();
            var end = new Date(start.getFullYear() + 1, 0, 1);
            var elapse = Math.floor((end - start) / 1000);

            var seconds = elapse % 60 ;
            var minutes = Math.floor(elapse / 60) % 60;
            var hours = Math.floor(elapse / (60 * 60)) % 24;
            var days = Math.floor(elapse / (60 * 60 * 24)) % 30;
            var months = Math.floor(elapse / (60 * 60 * 24 * 30)) % 12;
            var years = Math.floor(elapse / (60 * 60 * 24 * 30 * 12));

            return start.getFullYear() + '年还剩' + years + '年' + months + '月' + days + '日'
                + hours + '小时' + minutes + '分' + seconds + '秒';
        }

        function domText(elem, text) {
            if (text == undefined) {

                if (elem.textContent) {
                    return elem.textContent;
                } else if (elem.innerText) {
                    return elem.innerText;
                }
            } else {
                if (elem.textContent) {
                    elem.textContent = text;
                } else if (elem.innerText) {
                    elem.innerText = text;
                } else {
                    elem.innerHTML = text;
                }
            }
        }

        var target = document.getElementById('target');

        setInterval(function () {
            domText(target, getTimeString());
        }, 1000)
    </script>

    </body>
    </html>
```

## 九十一、完成一个函数,接受数组作为参数,数组元素为整数或者数组,数组元素包含整数或数组,函数返回扁平化后的数组

如：[1, [2, [ [3, 4], 5], 6]] => [1, 2, 3, 4, 5, 6]

``` js
    var data =  [1, [2, [ [3, 4], 5], 6]];

    function flat(data, result) {
        var i, d, len;
        for (i = 0, len = data.length; i < len; ++i) {
            d = data[i];
            if (typeof d === 'number') {
                result.push(d);
            } else {
                flat(d, result);
            }
        }
    }

    var result = [];
    flat(data, result);

    console.log(result);
```

## 九十二、如何判断一个对象是否为数组

如果浏览器支持 Array.isArray()可以直接判断否则需进行必要判断

``` js
/**
 * 判断一个对象是否是数组，参数不是对象或者不是数组，返回false
 *
 * @param {Object} arg 需要测试是否为数组的对象
 * @return {Boolean} 传入参数是数组返回true，否则返回false
 */
function isArray(arg) {
    if (typeof arg === 'object') {
        return Object.prototype.toString.call(arg) === '[object Array]';
    }
    return false;
}
```

## 九十三、请评价以下事件监听器代码并给出改进意见

``` js
if (window.addEventListener) {
  var addListener = function (el, type, listener, useCapture) {
    el.addEventListener(type, listener, useCapture);
  };
}
else if (document.all) {
  addListener = function (el, type, listener) {
    el.attachEvent('on' + type, function () {
      listener.apply(el);
    });
  };
}
```

作用：浏览器功能检测实现跨浏览器 DOM 事件绑定

优点：

1. 测试代码只运行一次，根据浏览器确定绑定方法
2. 通过`listener.apply(el)`解决 IE 下监听器 this 与标准不一致的地方
3. 在浏览器不支持的情况下提供简单的功能，在标准浏览器中提供捕获功能

缺点：

1. document.all 作为 IE 检测不可靠，应该使用 if(el.attachEvent)
2. addListener 在不同浏览器下 API 不一样
3. `listener.apply`使 this 与标准一致但监听器无法移除
4. 未解决 IE 下 listener 参数 event。 target 问题

改进:

``` js
var addListener;

if (window.addEventListener) {
  addListener = function (el, type, listener, useCapture) {
    el.addEventListener(type, listener, useCapture);
    return listener;
  };
}
else if (window.attachEvent) {
  addListener = function (el, type, listener) {
    // 标准化this，event，target
    var wrapper = function () {
      var event = window.event;
      event.target = event.srcElement;
      listener.call(el, event);
    };

    el.attachEvent('on' + type, wrapper);
    return wrapper;
    // 返回wrapper。调用者可以保存，以后remove
  };
}
```

## 九十四、如何判断一个对象是否为函数

``` js
/**
 * 判断对象是否为函数，如果当前运行环境对可调用对象（如正则表达式）
 * 的typeof返回'function'，采用通用方法，否则采用优化方法
 *
 * @param {Any} arg 需要检测是否为函数的对象
 * @return {boolean} 如果参数是函数，返回true，否则false
 */
function isFunction(arg) {
    if (arg) {
        if (typeof (/./) !== 'function') {
            return typeof arg === 'function';
        } else {
            return Object.prototype.toString.call(arg) === '[object Function]';
        }
    } // end if
    return false;
}
```

## 九十五、编写一个函数接受 url 中 query string 为参数,返回解析后的 Object,query string 使用 application/x-www-form-urlencoded 编码

``` js
/**
 * 解析query string转换为对象，一个key有多个值时生成数组
 *
 * @param {String} query 需要解析的query字符串，开头可以是?，
 * 按照application/x-www-form-urlencoded编码
 * @return {Object} 参数解析后的对象
 */
function parseQuery(query) {
    var result = {};

    // 如果不是字符串返回空对象
    if (typeof query !== 'string') {
        return result;
    }

    // 去掉字符串开头可能带的?
    if (query.charAt(0) === '?') {
        query = query.substring(1);
    }

    var pairs = query.split('&');
    var pair;
    var key, value;
    var i, len;

    for (i = 0, len = pairs.length; i < len; ++i) {
        pair = pairs[i].split('=');
        // application/x-www-form-urlencoded编码会将' '转换为+
        key = decodeURIComponent(pair[0]).replace(/\+/g, ' ');
        value = decodeURIComponent(pair[1]).replace(/\+/g, ' ');

        // 如果是新key，直接添加
        if (!(key in result)) {
            result[key] = value;
        }
        // 如果key已经出现一次以上，直接向数组添加value
        else if (isArray(result[key])) {
            result[key].push(value);
        }
        // key第二次出现，将结果改为数组
        else {
            var arr = [result[key]];
            arr.push(value);
            result[key] = arr;
        } // end if-else
    } // end for

    return result;
}

function isArray(arg) {
    if (arg && typeof arg === 'object') {
        return Object.prototype.toString.call(arg) === '[object Array]';
    }
    return false;
}
/**
console.log(parseQuery('sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8'));
 */
```

## 九十六、解析一个完整的 url,返回 Object 包含域与 window.location 相同

``` js
/**
 * 解析一个url并生成window.location对象中包含的域
 * location:
 * {
 *      href: '包含完整的url',
 *      origin: '包含协议到pathname之前的内容',
 *      protocol: 'url使用的协议，包含末尾的:',
 *      username: '用户名', // 暂时不支持
 *      password: '密码',  // 暂时不支持
 *      host: '完整主机名，包含:和端口',
 *      hostname: '主机名，不包含端口'
 *      port: '端口号',
 *      pathname: '服务器上访问资源的路径/开头',
 *      search: 'query string，?开头',
 *      hash: '#开头的fragment identifier'
 * }
 *
 * @param {string} url 需要解析的url
 * @return {Object} 包含url信息的对象
 */
function parseUrl(url) {
    var result = {};
    var keys = ['href', 'origin', 'protocol', 'host',
                'hostname', 'port', 'pathname', 'search', 'hash'];
    var i, len;
    var regexp = /(([^:]+:)\/\/(([^:\/\?#]+)(:\d+)?))(\/[^?#]*)?(\?[^#]*)?(#.*)?/;

    var match = regexp.exec(url);

    if (match) {
        for (i = keys.length - 1; i >= 0; --i) {
            result[keys[i]] = match[i] ? match[i] : '';
        }
    }

    return result;
}
```

## 九十七、完成函数 getViewportSize 返回指定窗口的视口尺寸

``` js
/**
* 查询指定窗口的视口尺寸，如果不指定窗口，查询当前窗口尺寸
**/
function getViewportSize(w) {
    w = w || window;

    // IE9及标准浏览器中可使用此标准方法
    if ('innerHeight' in w) {
        return {
            width: w.innerWidth,
            height: w.innerHeight
        };
    }

    var d = w.document;
    // IE 8及以下浏览器在标准模式下
    if (document.compatMode === 'CSS1Compat') {
        return {
            width: d.documentElement.clientWidth,
            height: d.documentElement.clientHeight
        };
    }

    // IE8及以下浏览器在怪癖模式下
    return {
        width: d.body.clientWidth,
        height: d.body.clientHeight
    };
}
```

## 九十八、完成函数 getScrollOffset 返回窗口滚动条偏移量

``` js
    /**
     * 获取指定window中滚动条的偏移量，如未指定则获取当前window
     * 滚动条偏移量
     *
     * @param {window} w 需要获取滚动条偏移量的窗口
     * @return {Object} obj.x为水平滚动条偏移量,obj.y为竖直滚动条偏移量
     */
    function getScrollOffset(w) {
        w =  w || window;
        // 如果是标准浏览器
        if (w.pageXOffset != null) {
            return {
                x: w.pageXOffset,
                y: w.pageYOffset
            };
        }

        // 老版本IE，根据兼容性不同访问不同元素
        var d = w.document;
        if (d.compatMode === 'CSS1Compat') {
            return {
                x: d.documentElement.scrollLeft,
                y: d.documentElement.scrollTop
            }
        }

        return {
            x: d.body.scrollLeft,
            y: d.body.scrollTop
        };
    }
```

## 九十九、现有一个字符串 richText,是一段富文本,需要显示在页面上.有个要求,需要给其中只包含一个 img 元素的 p 标签增加一个叫 pic 的 class.请编写代码实现.可以使用 jQuery 或 KISSY.

``` js
    function richText(text) {
        var div = document.createElement('div');
        div.innerHTML = text;
        var p = div.getElementsByTagName('p');
        var i, len;

        for (i = 0, len = p.length; i < len; ++i) {
            if (p[i].getElementsByTagName('img').length === 1) {
                p[i].classList.add('pic');
            }
        }

        return div.innerHTML;
    }
```

## 一百、请实现一个 Event 类,继承自此类的对象都会拥有两个方法 on,off,once 和 trigger

``` js
    function Event() {
        if (!(this instanceof Event)) {
            return new Event();
        }
        this._callbacks = {};
    }
    Event.prototype.on = function (type, handler) {
        this_callbacks = this._callbacks || {};
        this._callbacks[type] = this.callbacks[type] || [];
        this._callbacks[type].push(handler);

        return this;
    };

    Event.prototype.off = function (type, handler) {
        var list = this._callbacks[type];

        if (list) {
            for (var i = list.length; i >= 0; --i) {
                if (list[i] === handler) {
                    list.splice(i, 1);
                }
            }
        }

        return this;
    };

    Event.prototype.trigger = function (type, data) {
        var list = this._callbacks[type];

        if (list) {
            for (var i = 0, len = list.length; i < len; ++i) {
                list[i].call(this, data);
            }
        }
    };

    Event.prototype.once = function (type, handler) {
        var self = this;

        function wrapper() {
            handler.apply(self, arguments);
            self.off(type, wrapper);
        }
        this.on(type, wrapper);
        return this;
    };
```

## 一百零一、编写一个函数将列表子元素顺序反转

``` html
<ul id="target">
    <li>1</li>
    <li>2</li>
    <li>3</li>
    <li>4</li>
</ul>

<script>
    var target = document.getElementById('target');
    var i;
    var frag = document.createDocumentFragment();

    for (i = target.children.length - 1; i &gt;= 0; --i) {
        frag.appendChild(target.children[i]);
    }
    target.appendChild(frag);
</script>
```

## 一百零二、以下函数的作用是?空白区域应该填写什么

``` js
// define
(function (window) {
    function fn(str) {
        this.str = str;
    }

    fn.prototype.format = function () {
        var arg = __1__;
        return this.str.replace(__2__, function (a, b) {
            return arg[b] || '';
        });
    };

    window.fn = fn;
})(window);

// use
(function () {
    var t = new fn('<p><a href="{0}">{1}</a><span>{2}</span></p>');
    console.log(t.format('http://www.alibaba.com', 'Alibaba', 'Welcome'));
})();
```

define 部分定义一个简单的模板类，使用{}作为转义标记，中间的数字表示替换目标，format 实参用来替换模板内标记
横线处填：

1. `Array.prototype.slice.call(arguments, 0)`
2. `/\{\s*(\d+)\s*\}/g`

## 一百零三、编写一个函数实现 form 的序列化(即将一个表单中的键值序列化为可提交的字符串)

``` html
    <form id="target">
        <select name="age">
            <option value="aaa">aaa</option>
            <option value="bbb" selected>bbb</option>
        </select>
        <select name="friends" multiple>
            <option value="qiu" selected>qiu</option>
            <option value="de">de</option>
            <option value="qing" selected>qing</option>
        </select>
        <input name="name" value="qiudeqing">
        <input type="password" name="password" value="11111">
        <input type="hidden" name="salery" value="3333">
        <textarea name="description">description</textarea>
        <input type="checkbox" name="hobby" checked value="football">Football
        <input type="checkbox" name="hobby" value="basketball">Basketball
        <input type="radio" name="sex" checked value="Female">Female
        <input type="radio" name="sex" value="Male">Male
    </form>


    <script>

    /**
     * 将一个表单元素序列化为可提交的字符串
     *
     * @param {FormElement} form 需要序列化的表单元素
     * @return {string} 表单序列化后的字符串
     */
    function serializeForm(form) {
      if (!form || form.nodeName.toUpperCase() !== 'FORM') {
        return;
      }

      var result = [];

      var i, len;
      var field, fieldName, fieldType;

      for (i = 0, len = form.length; i < len; ++i) {
        field = form.elements[i];
        fieldName = field.name;
        fieldType = field.type;

        if (field.disabled || !fieldName) {
          continue;
        } // enf if

        switch (fieldType) {
          case 'text':
          case 'password':
          case 'hidden':
          case 'textarea':
            result.push(encodeURIComponent(fieldName) + '=' +
                encodeURIComponent(field.value));
            break;

          case 'radio':
          case 'checkbox':
            if (field.checked) {
              result.push(encodeURIComponent(fieldName) + '=' +
                encodeURIComponent(field.value));
            }
            break;

          case 'select-one':
          case 'select-multiple':
            for (var j = 0, jLen = field.options.length; j < jLen; ++j) {
              if (field.options[j].selected) {
                result.push(encodeURIComponent(fieldName) + '=' +
                  encodeURIComponent(field.options[j].value || field.options[j].text));
              }
            } // end for
            break;

          case 'file':
          case 'submit':
            break; // 是否处理？

          default:
            break;
        } // end switch
      } // end for

        return result.join('&');
    }

    var form = document.getElementById('target');
    console.log(serializeForm(form));
    </script>
```

## 一百零四、使用原生 javascript 给下面列表中的 li 节点绑定点击事件,点击时创建一个 Object 对象,兼容 IE 和标准浏览器

``` html
<ul id="nav">
    <li><a href="http://11111">111</a></li>
    <li><a href="http://2222">222</a></li>
    <li><a href="http://333">333</a></li>
    <li><a href="http://444">444</a></li>
</ul>
```

Object:

``` js
{
    "index": 1,
    "name": "111",
    "link": "http://1111"
}
```

script:

``` js
var EventUtil = {
    getEvent: function (event) {
        return event || window.event;
    },
    getTarget: function (event) {
        return event.target || event.srcElement;
    },
    // 返回注册成功的监听器，IE中需要使用返回值来移除监听器
    on: function (elem, type, handler) {
        if (elem.addEventListener) {
            elem.addEventListener(type, handler, false);
            return handler;
        } else if (elem.attachEvent) {
            function wrapper(event) {
                return handler.call(elem, event);
            };
            elem.attachEvent('on' + type, wrapper);
            return wrapper;
        }
    },
    off: function (elem, type, handler) {
        if (elem.removeEventListener) {
            elem.removeEventListener(type, handler, false);
        } else if (elem.detachEvent) {
            elem.detachEvent('on' + type, handler);
        }
    },
    preventDefault: function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else if ('returnValue' in event) {
            event.returnValue = false;
        }
    },
    stopPropagation: function (event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else if ('cancelBubble' in event) {
            event.cancelBubble = true;
        }
    }
};
var DOMUtil = {
    text: function (elem) {
        if ('textContent' in elem) {
            return elem.textContent;
        } else if ('innerText' in elem) {
            return elem.innerText;
        }
    },
    prop: function (elem, propName) {
        return elem.getAttribute(propName);
    }
};

var nav = document.getElementById('nav');

EventUtil.on(nav, 'click', function (event) {
    var event = EventUtil.getEvent(event);
    var target = EventUtil.getTarget(event);

    var children = this.children;
    var i, len;
    var anchor;
    var obj = {};

    for (i = 0, len = children.length; i < len; ++i) {
        if (children[i] === target) {
            obj.index = i + 1;
            anchor = target.getElementsByTagName('a')[0];
            obj.name = DOMUtil.text(anchor);
            obj.link = DOMUtil.prop(anchor, 'href');
        }
    }

    alert('index: ' + obj.index + ' name: ' + obj.name +
        ' link: ' + obj.link);
});
```

## 一百零五、有一个大数组,var a = ['1', '2', '3', ...];a 的长度是 100,内容填充随机整数的字符串.请先构造此数组 a,然后设计一个算法将其内容去重

``` js
    /**
    * 数组去重
    **/
    function normalize(arr) {
        if (arr && Array.isArray(arr)) {
            var i, len, map = {};
            for (i = arr.length; i >= 0; --i) {
                if (arr[i] in map) {
                    arr.splice(i, 1);
                } else {
                    map[arr[i]] = true;
                }
            }
        }
        return arr;
    }

    /**
    * 用100个随机整数对应的字符串填充数组。
    **/
    function fillArray(arr, start, end) {
        start = start == undefined ? 1 : start;
        end = end == undefined ?  100 : end;

        if (end <= start) {
            end = start + 100;
        }

        var width = end - start;
        var i;
        for (i = 100; i >= 1; --i) {
            arr.push('' + (Math.floor(Math.random() * width) + start));
        }
        return arr;
    }

    var input = [];
    fillArray(input, 1, 100);
    input.sort(function (a, b) {
        return a - b;
    });
    console.log(input);

    normalize(input);
    console.log(input);
```

## 写一个 mySetInterVal(fn, a, b),每次间隔 a,a+b,a+2b,...,a+nb 的时间，然后写一个 myClear，停止上面的 mySetInterVal

``` js
function mySetInterVal(fn, a, b) {
  let timer = setTimeout(() => {
    fn();
    mySetInterVal(fn,a+b,b);
  }, a)
  return () => {
    clearTimeout(timer);
  }
}
const myClear =mySetInterVal(()=>{console.log('abc')},1000,500);
// 清除定时器
myClear()
```

## 合并二维有序数组成一维有序数组，归并排序的思路

``` js
// 严格意义上的归并排序实现
function merge(leftArr, rightArr) {
  const result = [];
  if (leftArr[0] instanceof Array) {
    leftArr = leftArr.shift();
  }
  if (rightArr[0] instanceof Array) {
    rightArr = rightArr.shift();
  }
  while (leftArr.length > 0 && rightArr.length > 0) {
    if (leftArr[0] < rightArr[0]) {
      result.push(leftArr.shift());
    } else {
      result.push(rightArr.shift());
    }
  }

  return result.concat(leftArr).concat(rightArr);
};

function mergeSort(arr) {
  if (arr.length === 1) return arr;
  const middle = Math.floor(arr.length / 2);
  const leftArr = arr.slice(0, middle);
  const rightArr = arr.slice(middle);
  return merge(mergeSort(leftArr), mergeSort(rightArr));
};

console.log(mergeSort([[1,4,7],[2,5,8],[3,6,9]]));
```

## 多种方式实现斐波那契数列

### 参考实现

数学上是以递归的方法来定义

```
F(0) = 0;
F(1) = 1;
F(n) = F(n - 1) + F(n - 2);
```

### 公式版：递归

``` js
function fib(n) {
  if(n < 0) throw new Error('输入的数字不能小于0');
  if (n < 2) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}
```

正常递归版本是一个既简单又直接的逻辑，但是这个版本有个问题就是存在大量重复计算。如：当 n 为 5 的时候要计算fib(4) + fib(3)当 n 为 4 的要计算fib(3) + fib(2) ，这时fib(3)就是重复计算了。运行 fib(50) 等半天才会出结果。

### 迭代:for 循环

``` js
function fib(n) {
  if(n < 0) throw new Error('输入的数字不能小于0');
  let f0 = 0, f1 = 1, curFib = f0;
  if (n < 2) {
    return n;
  }
  for (let i = 1; i < n; i++) {
    curFib = f0 + f1;
    f0 = f1;
    f1 = curFib;
  }
  return curFib;
}
```

这个版本没有重复计算问题，速度也明显快了很多。这并不代表循环比递归好。循环的问题在于状态变量太多，为了实现 fib 这里使用了 4 个状态变量(f0,f1,curFib,i) 而状态变量 在写、修改、删除的过程中需要格外小心。状态变量多了阅读起来也不那么优美了。

### 去除重复计算的递归版本

``` js
function fib(n) {
  if(n < 0) throw new Error('输入的数字不能小于0');
  if (n < 2) return n;
  function _fib(n, a, b) {
    if (n === 0) return a;
    return _fib(n - 1, b, a + b);
  }
  return _fib(n, 0, 1);
}
```

把前两位数字做成参数巧妙的避免了重复计算，性能也有明显的提升。n 做递减运算，前两位数字做递增（斐波那契数列的递增）,这段代码一个减，一个增。

### 基于 ES6 Generator 实现

``` js
function* fib(n) {
  if(n < 0) throw new Error('输入的数字不能小于0');
  let f0 = 1, f1 = 1, count = 0;
  while (count < n) {
    yield f0;
    [f0, f1] = [f1, f0 + f1];
    count++;
  }
}
```

### 数组方法

``` js
function fib(n) {
  if(n < 0) throw new Error('输入的数字不能小于0');
  if (n < 2) {
    return n;
  }
  let list = [];
  list[0] = 0;
  list[1] = 1;
  for (let i = 1; i < n; i++) {
    list[i + 1] = list[i] + list[i - 1];
  }
  return list[n];
}
```

## 字符串出现的不重复最长长度

``` js
/**
 * 题目：字符串出现的不重复最长长度
 * 整体思路：
 * 用一个滑动窗口装没有重复的字符，枚举字符记录最大值即可
 * 对于遇到重复字符如何收缩窗口大小？
 * 我们可以用 map 维护字符的索引，遇到相同的字符，把左边界移动过去即可
 * 挪动的过程中记录最大长度
 */
var lengthOfLongestSubstring = function (s) {
  const map = {};
  let i = -1;
  let res = 0;
  const n = s.length;
  for (let j = 0; j < n; j++) {
    if (map[s[j]]) {
      i = Math.max(i, map[s[j]]);
    }
    res = Math.max(res, j - i);
    map[s[j]] = j;
  }

  return res;
};
```

## 介绍chrome 浏览器的几个版本

### 1）Chrome 浏览器提供 4 种发布版本，即稳定版(Stable)、测试版(Beta)、开发者版(Dev)和金丝雀版(Canary)。

虽然 Chrome 这几个版本名称各不相同，但都沿用了相同的版本号，只是更新早晚的区别。就好比 iOS 等系统，Beta 版可以率先更新到 iOS 12 并进行测试，不断改进稳定后，正式版才升级到 12 版本。
Chrome 也是如此，更新最快的 Canary 会领先正式版 1-2 个版本。

#### 1. Canary（金丝雀） 版

只限用于测试，Canary 是 Chrome 的未来版本，是功能、代码最先进的Chrome 版本，一方面软件本身没有足够时间测试，另一方面网页也不一定支持这些全新的功能，因此极不稳定。好在，谷歌将其设定为可独立安装、与其他版本的 Chrome 程序共存，因此适合进阶用户安装备用，尝鲜最新功能。这种不稳定性使得 Canary 版目前并不适合日常使用。
Chrome Canary 是更新速度最快的 Chrome 版本，几乎每天更新。它相当于支持自动更新、并添加了谷歌自家服务与商业闭源插件（Flash 等）的 Chromium，更加强大好用。

#### 2. 开发者版(Dev)

Chrome Dev 最初是以 Chromium 为基础、更新最快的 Chrome，后来则被 Canary 取代。Dev 版每周更新一次，虽然仍不太稳定，但已经可以勉强满足日常使用，适合 Web 开发者用来测试新功能和网页。
让 IT 人员使用开发者版，开发者可以通过开发者版测试自己公司的应用，确保这些应用能与Chrome 最新的 API 更改及功能更改兼容。注意：开发者版并非百分之百稳定，但开发者可以提前 9 至 12 周体验即将添加到 Chrome 稳定版的功能。

#### 3. 测试版(Beta)

Chrome Beta 以 Dev 为基础，每月更新一次。它是正式发布前的最后测试版本，所有功能都已在前面几个版本中得到测试并改进，因此已经十分稳定，普通用户也可以用来日常使用
让 5% 的用户使用测试版，测试版用户可以提前 4-6 周体验即将在 Chrome 稳定版中推出的功能。测试版用户可以发现特定版本可能存在的问题，让您可以先解决问题，然后再向所有用户推出该版本。

#### 4. 稳定版(Stable)

最后的 Chrome Stable 就是我们熟知的正式版，它以 Beta 为基础，几个月更新一次。由于所有的功能都已经过数个月反复测试，是稳定性最高的 Chrome 版本。
让大多数用户使用稳定版，稳定版是已进行充分测试的版本，稳定版每 2-3 周会进行一次小幅更新，并且每 6 周会进行一次重大更新。
所以要定期下载开发者版，体验Chrome 最新的 API和新功能 ，发现自己的应用跟新API和新功能的是否有兼容问题，找到开发亮点。

### 2）对于Chrome的历史版本测试

可以使用Docker Selenium 做分布式自动化测试，部署多个重点关注的版本，进行自动化测试，对比差异。

## React 项目中有哪些细节可以优化？实际开发中都做过哪些性能优化

1）对于正常的项目优化，一般都涉及到几个方面，**开发过程中、上线之后的首屏、运行过程的状态**

- 来聊聊上线之后的首屏及运行状态：

  - 首屏优化一般涉及到几个指标FP、FCP、FMP；要有一个良好的体验是尽可能的把FCP提前，需要做一些工程化的处理，去优化资源的加载

  - 方式及分包策略，资源的减少是最有效的加快首屏打开的方式；

  - 对于CSR的应用，FCP的过程一般是首先加载js与css资源，js在本地执行完成，然后加载数据回来，做内容初始化渲染，这中间就有几次的网络反复请求的过程；所以CSR可以考虑使用骨架屏及预渲染（部分结构预渲染）、suspence与lazy做懒加载动态组件的方式

  - 当然还有另外一种方式就是SSR的方式，SSR对于首屏的优化有一定的优势，但是这种瓶颈一般在Node服务端的处理，建议使用stream流的方式来处理，对于体验与node端的内存管理等，都有优势；

  - 不管对于CSR或者SSR，都建议配合使用Service worker，来控制资源的调配及骨架屏秒开的体验

  - react项目上线之后，首先需要保障的是可用性，所以可以通过React.Profiler分析组件的渲染次数及耗时的一些任务，但是Profile记录的是commit阶段的数据，所以对于react的调和阶段就需要结合performance API一起分析；

  - 由于React是父级props改变之后，所有与props不相关子组件在没有添加条件控制的情况之下，也会触发render渲染，这是没有必要的，可以结合React的PureComponent以及React.memo等做浅比较处理，这中间有涉及到不可变数据的处理，当然也可以结合使用ShouldComponentUpdate做深比较处理；

  - 所有的运行状态优化，都是减少不必要的render，React.useMemo与React.useCallback也是可以做很多优化的地方；

  - 在很多应用中，都会涉及到使用redux以及使用context，这两个都可能造成许多不必要的render，所以在使用的时候，也需要谨慎的处理一些数据；

  - 最后就是保证整个应用的可用性，为组件创建错误边界，可以使用componentDidCatch来处理；

- 实际项目中开发过程中还有很多其他的优化点：

1. 保证数据的不可变性
2. 使用唯一的键值迭代
3. 使用web worker做密集型的任务处理
4. 不在render中处理数据
5. 不必要的标签，使用React.Fragments

## react 最新版本解决了什么问题 加了哪些东西

### 1）React 16.x的三大新特性 Time Slicing, Suspense，hooks

- Time Slicing（解决CPU速度问题）使得在执行任务的期间可以随时暂停，跑去干别的事情，这个特性使得react能在性能极其差的机器跑时，仍然保持有良好的性能
- Suspense （解决网络IO问题）和lazy配合，实现异步加载组件。 能暂停当前组件的渲染, 当完成某件事以后再继续渲染，解决从react出生到现在都存在的「异步副作用」的问题，而且解决得非常的优雅，使用的是「异步但是同步的写法」，我个人认为，这是最好的解决异步问题的方式
- 此外，还提供了一个内置函数 componentDidCatch，当有错误发生时, 我们可以友好地展示 fallback 组件；可以捕捉到它的子元素（包括嵌套子元素）抛出的异常；可以复用错误组件。

### 2）React16.8

- 加入hooks，让React函数式组件更加灵活
- hooks之前，React存在很多问题
  - 在组件间复用状态逻辑很难
  - 复杂组件变得难以理解，高阶组件和函数组件的嵌套过深。
  - class组件的this指向问题
  - 难以记忆的生命周期
- hooks很好的解决了上述问题，hooks提供了很多方法
  - useState 返回有状态值，以及更新这个状态值的函数
  - useEffect 接受包含命令式，可能有副作用代码的函数。
  - useContext 接受上下文对象（从React.createContext返回的值）并返回当前上下文值，
  - useReducer useState的替代方案。接受类型为(state，action) => newState的reducer，并返回与dispatch方法配对的当前状态。
  - useCallback 返回一个回忆的memoized版本，该版本仅在其中一个输入发生更改时才会更改。纯函数的输入输出确定性
  - useMemo 纯的一个记忆函数
  - useRef 返回一个可变的ref对象，其.current属性被初始化为传递的参数，返回的 ref 对象在组件的整个生命周期内保持不变。
  - useImperativeMethods 自定义使用ref时公开给父组件的实例值
  - useMutationEffect 更新兄弟组件之前，它在React执行其DOM改变的同一阶段同步触发
  - useLayoutEffect DOM改变后同步触发。使用它来从DOM读取布局并同步重新渲染

### 3）React16.9

- 重命名 Unsafe 的生命周期方法。新的 UNSAFE_ 前缀将有助于在代码 review 和 debug 期间，使这些有问题的字样更突出
- 废弃 javascript: 形式的 URL。以 javascript: 开头的 URL 非常容易遭受攻击，造成安全漏洞。
- 废弃 “Factory” 组件。 工厂组件会导致 React 变大且变慢。
- act() 也支持异步函数，并且你可以在调用它时使用 await。
- 使用 `<React.Profiler>` 进行性能评估。 在较大的应用中追踪性能回归可能会很方便

### 4）React16.13.0

- 支持在渲染期间调用setState，但仅适用于同一组件
- 可检测冲突的样式规则并记录警告
- 废弃unstable_createPortal，使用createPortal
- 将组件堆栈添加到其开发警告中，使开发人员能够隔离bug并调试其程序，这可以清楚地说明问题所在，并更快地定位和修复错误。

## 说一下 Http 缓存策略，有什么区别，分别解决了什么问题

### 1）浏览器缓存策略

浏览器每次发起请求时，先在本地缓存中查找结果以及缓存标识，根据缓存标识来判断是否使用本地缓存。如果缓存有效，则使
用本地缓存；否则，则向服务器发起请求并携带缓存标识。根据是否需向服务器发起HTTP请求，将缓存过程划分为两个部分：
强制缓存和协商缓存，强缓优先于协商缓存。

- 强缓存，服务器通知浏览器一个缓存时间，在缓存时间内，下次请求，直接用缓存，不在时间内，执行比较缓存策略。

- 协商缓存，让客户端与服务器之间能实现缓存文件是否更新的验证、提升缓存的复用率，将缓存信息中的Etag和Last-Modified
通过请求发送给服务器，由服务器校验，返回304状态码时，浏览器直接使用缓存。

HTTP缓存都是从第二次请求开始的：

- 第一次请求资源时，服务器返回资源，并在response header中回传资源的缓存策略；

- 第二次请求时，浏览器判断这些请求参数，击中强缓存就直接200，否则就把请求参数加到request header头中传给服务器，看是否击中协商缓存，击中则返回304，否则服务器会返回新的资源。这是缓存运作的一个整体流程图：

![浏览器缓存策略流程图](https://user-images.githubusercontent.com/8088864/126058683-beef4f08-b60d-493d-b870-998d0238e212.png)

### 2）强缓存

- 强缓存命中则直接读取浏览器本地的资源，在network中显示的是from memory或者from disk
- 控制强制缓存的字段有：Cache-Control（http1.1）和Expires（http1.0）
- Cache-control是一个相对时间，用以表达自上次请求正确的资源之后的多少秒的时间段内缓存有效。
- Expires是一个绝对时间。用以表达在这个时间点之前发起请求可以直接从浏览器中读取数据，而无需发起请求
- Cache-Control的优先级比Expires的优先级高。前者的出现是为了解决Expires在浏览器时间被手动更改导致缓存判断错误的问题。
- 如果同时存在则使用Cache-control。

### 3）强缓存(expires)

- 该字段是服务器响应消息头字段，告诉浏览器在过期时间之前可以直接从浏览器缓存中存取数据。

- Expires 是 HTTP 1.0 的字段，表示缓存到期时间，是一个绝对的时间 (当前时间+缓存时间)。在响应消息头中，设置这个字段之后，就可以告诉浏览器，在未过期之前不需要再次请求。

- 由于是绝对时间，用户可能会将客户端本地的时间进行修改，而导致浏览器判断缓存失效，重新请求该资源。此外，即使不考虑修改，时差或者误差等因素也可能造成客户端与服务端的时间不一致，致使缓存失效。

- 优势特点

  - 1. HTTP 1.0 产物，可以在HTTP 1.0和1.1中使用，简单易用。
  - 2. 以时刻标识失效时间。

- 劣势问题

  - 1. 时间是由服务器发送的(UTC)，如果服务器时间和客户端时间存在不一致，可能会出现问题。
  - 2. 存在版本问题，到期之前的修改客户端是不可知的。

### 4）强缓存(cache-control)

- 已知Expires的缺点之后，在HTTP/1.1中，增加了一个字段Cache-control，该字段表示资源缓存的最大有效时间，在该时间内，客户端不需要向服务器发送请求。

- 这两者的区别就是前者是绝对时间，而后者是相对时间。下面列举一些 Cache-control 字段常用的值：(完整的列表可以查看MDN)

  - `max-age`：即最大有效时间。
  - `must-revalidate`：如果超过了 max-age 的时间，浏览器必须向服务器发送请求，验证资源是否还有效。
  - `no-cache`：不使用强缓存，需要与服务器验证缓存是否新鲜。
  - `no-store`: 真正意义上的“不要缓存”。所有内容都不走缓存，包括强制和对比。
  - `public`：所有的内容都可以被缓存 (包括客户端和代理服务器， 如 CDN)
  - `private`：所有的内容只有客户端才可以缓存，代理服务器不能缓存。默认值。

- **Cache-control 的优先级高于 Expires**，为了兼容 HTTP/1.0 和 HTTP/1.1，实际项目中两个字段都可以设置。

- 该字段可以在请求头或者响应头设置，可组合使用多种指令：
  - **可缓存性：**
    - public：浏览器和缓存服务器都可以缓存页面信息
    - private：default，代理服务器不可缓存，只能被单个用户缓存
    - no-cache：浏览器器和服务器都不应该缓存页面信息，但仍可缓存，只是在缓存前需要向服务器确认资源是否被更改。可配合private，过期时间设置为过去时间。
    - only-if-cache：客户端只接受已缓存的响应
  - **到期：**
    - max-age=：缓存存储的最大周期，超过这个周期被认为过期。
    - s-maxage=：设置共享缓存，比如can。会覆盖max-age和expires。
    - max-stale[=]：客户端愿意接收一个已经过期的资源
    - min-fresh=：客户端希望在指定的时间内获取最新的响应
    - stale-while-revalidate=：客户端愿意接收陈旧的响应，并且在后台一部检查新的响应。时间代表客户端愿意接收陈旧响应的时间长度。
    - stale-if-error=：如新的检测失败，客户端则愿意接收陈旧的响应，时间代表等待时间。
  - **重新验证和重新加载**
    - must-revalidate：如页面过期，则去服务器进行获取。
    - proxy-revalidate：用于共享缓存。
    - immutable：响应正文不随时间改变。
  - **其他**
    - no-store：绝对禁止缓存
    - no-transform：不得对资源进行转换和转变。例如，不得对图像格式进行转换。

- 优势特点
  - 1. HTTP 1.1 产物，以时间间隔标识失效时间，解决了Expires服务器和客户端相对时间的问题。
  - 2. 比Expires多了很多选项设置。

- 劣势问题
  - 1. 存在版本问题，到期之前的修改客户端是不可知的。

### 5）协商缓存

- 协商缓存的状态码由服务器决策返回200或者304
- 当浏览器的强缓存失效的时候或者请求头中设置了不走强缓存，并且在请求头中设置了If-Modified-Since 或者 If-None-Match 的时候，会将这两个属性值到服务端去验证是否命中协商缓存，如果命中了协商缓存，会返回 304 状态，加载浏览器缓存，并且响应头会设置 Last-Modified 或者 ETag 属性。
- 对比缓存在请求数上和没有缓存是一致的，但如果是 304 的话，返回的仅仅是一个状态码而已，并没有实际的文件内容，因此 在响应体体积上的节省是它的优化点。
- 协商缓存有 2 组字段(不是两个)，控制协商缓存的字段有：Last-Modified/If-Modified-since（http1.0）和Etag/If-None-match（http1.1）
- Last-Modified/If-Modified-since表示的是服务器的资源最后一次修改的时间；Etag/If-None-match表示的是服务器资源的唯一标
识，只要资源变化，Etag就会重新生成。
- Etag/If-None-match的优先级比Last-Modified/If-Modified-since高。

### 协商缓存(Last-Modified/If-Modified-since)

- 服务器通过 `Last-Modified` 字段告知客户端，资源最后一次被修改的时间，例如 `Last-Modified: Mon, 10 Nov 2018 09:10:11 GMT`

- 浏览器将这个值和内容一起记录在缓存数据库中。

- 下一次请求相同资源时时，浏览器从自己的缓存中找出“不确定是否过期的”缓存。因此在请求头中将上次的 `Last-Modified` 的值写入到请求头的 `If-Modified-Since` 字段

- 服务器会将 `If-Modified-Since` 的值与 `Last-Modified` 字段进行对比。如果相等，则表示未修改，响应 304；反之，则表示修改了，响应 200 状态码，并返回数据。

- 优势特点
  - 1. 不存在版本问题，每次请求都会去服务器进行校验。服务器对比最后修改时间如果相同则返回304，不同返回200以及资源内容。

- 劣势问题
  - 1. 只要资源修改，无论内容是否发生实质性的变化，都会将该资源返回客户端。例如周期性重写，这种情况下该资源包含的数据实际上一样的。
  - 2. 以时刻作为标识，无法识别一秒内进行多次修改的情况。 如果资源更新的速度是秒以下单位，那么该缓存是不能被使用的，因为它的时间单位最低是秒。
  - 3. 某些服务器不能精确的得到文件的最后修改时间。
  - 4. 如果文件是通过服务器动态生成的，那么该方法的更新时间永远是生成的时间，尽管文件可能没有变化，所以起不到缓存的作用。

### 协商缓存(Etag/If-None-match)

- 为了解决上述问题，出现了一组新的字段 `Etag` 和 `If-None-Match`

- `Etag` 存储的是文件的特殊标识(一般都是 hash 生成的)，服务器存储着文件的 `Etag` 字段。之后的流程和 `Last-Modified` 一致，只是 `Last-Modified` 字段和它所表示的更新时间改变成了 `Etag` 字段和它所表示的文件 hash，把 `If-Modified-Since` 变成了 `If-None-Match`。服务器同样进行比较，命中返回 304, 不命中返回新资源和 200。

- 浏览器在发起请求时，服务器返回在Response header中返回请求资源的唯一标识。在下一次请求时，会将上一次返回的Etag值赋值给If-No-Matched并添加在Request Header中。服务器将浏览器传来的if-no-matched跟自己的本地的资源的ETag做对比，如果匹配，则返回304通知浏览器读取本地缓存，否则返回200和更新后的资源。

- **Etag 的优先级高于 Last-Modified。**

- 优势特点
  - 1. 可以更加精确的判断资源是否被修改，可以识别一秒内多次修改的情况。
  - 2. 不存在版本问题，每次请求都回去服务器进行校验。

- 劣势问题
  - 1. 计算ETag值需要性能损耗。
  - 2. 分布式服务器存储的情况下，计算ETag的算法如果不一样，会导致浏览器从一台服务器上获得页面内容后到另外一台服务器上进行验证时现ETag不匹配的情况。

## 介绍防抖节流原理、区别以及应用，并用JavaScript进行实现

### 1）防抖

- 原理：在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。

- 适用场景：
  - 按钮提交场景：防止多次提交按钮，只执行最后提交的一次
  - 搜索框联想场景：防止联想发送请求，只发送最后一次输入

- 简易版实现

``` js
/**
 * 防抖:
 *
 * 应用场景：当用户进行了某个行为(例如点击)之后。不希望每次行为都会触发方法，而是行为做出后,一段时间内没有再次重复行为，才给用户响应
 * 实现原理 : 每次触发事件时设置一个延时调用方法，并且取消之前的延时调用方法。（每次触发事件时都取消之前的延时调用方法）
 * @params fun 传入的防抖函数(callback) delay 等待时间
 *
 */
const debounce = (fun, delay = 500) => {
    let timer = null //设定一个定时器
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fun.apply(this, args)
        }, delay)
    }
}
```

- 立即执行版实现

有时希望立刻执行函数，然后等到停止触发 n 秒后，才可以重新触发执行。

``` js
// 有时希望立刻执行函数，然后等到停止触发 n 秒后，才可以重新触发执行。
function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    if (timeout) clearTimeout(timeout);
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(function () {
        timeout = null;
      }, wait)
      if (callNow) func.apply(context, args)
    } else {
      timeout = setTimeout(function () {
        func.apply(context, args)
      }, wait);
    }
  }
}
```

- 返回值版实现

func函数可能会有返回值，所以需要返回函数结果，但是当 immediate 为 false 的时候，因为使用了 setTimeout ，我们将 func.apply(context, args) 的返回值赋给变量，最后再 return 的时候，值将会一直是 undefined，所以只在 immediate 为 true 的时候返回函数的执行结果。

``` js
function debounce(func, wait, immediate) {
  let timeout, result;
  return function () {
    const context = this;
    const args = arguments;
    if (timeout) clearTimeout(timeout);
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(function () {
        timeout = null;
      }, wait)
      if (callNow) result = func.apply(context, args)
    }
    else {
      timeout = setTimeout(function () {
        func.apply(context, args)
      }, wait);
    }
    return result;
  }
}
```

### 2）节流

- 原理：规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。

- 适用场景
  - 拖拽场景：固定时间内只执行一次，防止超高频次触发位置变动
  - 缩放场景：监控浏览器resize

- 简易版实现

``` js
/**
 * 节流
 *
 * 应用场景:用户进行高频事件触发(滚动)，但在限制在n秒内只会执行一次。
 * 实现原理: 每次触发时间的时候，判断当前是否存在等待执行的延时函数。
 *
 * @params fun 传入的防抖函数(callback) delay 等待时间
 *
 */
const throttle = (fun, delay = 1000) => {
  let flag = true;
  return function (...args) {
    if (!flag) return;
    flag = false;
    setTimeout(() => {
      fun.apply(this, args);
      flag = true;
    }, delay);
  }
}
```


- 使用时间戳实现

使用时间戳，当触发事件的时候，我们取出当前的时间戳，然后减去之前的时间戳(最一开始值设为 0 )，如果大于设置的时间周期，就执行函数，然后更新时间戳为当前的时间戳，如果小于，就不执行。

``` js
function throttle(func, wait) {
  let context, args;
  let previous = 0;

  return function () {
    let now = +new Date();
    context = this;
    args = arguments;
    if (now - previous > wait) {
      func.apply(context, args);
      previous = now;
    }
  }
}
```

- 使用定时器实现

当触发事件的时候，我们设置一个定时器，再触发事件的时候，如果定时器存在，就不执行，直到定时器执行，然后执行函数，清空定时器，这样就可以设置下个定时器。

``` js
function throttle(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    if (!timeout) {
      timeout = setTimeout(function () {
        timeout = null;
        func.apply(context, args)
      }, wait);
    }
  }
}
```

## 前端安全、中间人攻击

### 1）XSS：跨站脚本攻击

就是攻击者想尽一切办法将可以执行的代码注入到网页中。

#### 存储型(server端)

- 场景：见于带有用户保存数据的网站功能，如论坛发帖、商品评论、用户私信等。

- 攻击步骤：
  - 1. 攻击者将恶意代码提交到目标网站的数据库中
  - 2. 用户打开目标网站时，服务端将恶意代码从数据库中取出来，拼接在HTML中返回给浏览器
  - 3. 用户浏览器在收到响应后解析执行，混在其中的恶意代码也同时被执行
  - 4. 恶意代码窃取用户数据，并发送到指定攻击者的网站，或者冒充用户行为，调用目标网站的接口，执行恶意操作

#### 反射型(Server端)

与存储型的区别在于，存储型的恶意代码存储在数据库中，反射型的恶意代码在URL上

- 场景：通过 URL 传递参数的功能，如网站搜索、跳转等。

- 攻击步骤：
  - 1. 攻击者构造出特殊的 URL，其中包含恶意代码。
  - 2. 用户打开带有恶意代码的 URL 时，网站服务端将恶意代码从 URL 中取出，拼接在 HTML 中返回给浏览器。
  - 3. 用户浏览器接收到响应后解析执行，混在其中的恶意代码也被执行。
  - 4. 恶意代码窃取用户数据并发送到攻击者的网站，或者冒充用户的行为，调用目标网站接口执行攻击者指定的操作。

#### Dom 型(浏览器端)

DOM 型 XSS 攻击中，取出和执行恶意代码由浏览器端完成，属于前端 JavaScript 自身的安全漏洞，而其他两种 XSS 都属于服务端的安全漏洞。

- 场景：通过 URL 传递参数的功能，如网站搜索、跳转等。
- 攻击步骤：
  - 1. 攻击者构造出特殊的 URL，其中包含恶意代码。
  - 2. 用户打开带有恶意代码的 URL。
  - 3. 用户浏览器接收到响应后解析执行，前端 JavaScript 取出 URL 中的恶意代码并执行。
  - 4. 恶意代码窃取用户数据并发送到攻击者的网站，或者冒充用户的行为，调用目标网站接口执行攻击者指定的操作。

#### 预防方案

防止攻击者提交恶意代码，防止浏览器执行恶意代码。

- 1. 对数据进行严格的输出编码：如HTML元素的编码，JS编码，CSS编码，URL编码等等
  - 避免拼接 HTML；Vue/React 技术栈，避免使用 v-html / dangerouslySetInnerHTML

- 2. CSP HTTP Header，即 Content-Security-Policy、X-XSS-Protection
  - 增加攻击难度，配置CSP(本质是建立白名单，由浏览器进行拦截)
  - `Content-Security-Policy: default-src 'self'` - 所有内容均来自站点的同一个源（不包括其子域名）
  - `Content-Security-Policy: default-src 'self' *.trusted.com` - 允许内容来自信任的域名及其子域名 (域名不必须与CSP设置所在的域名相同)
  - `Content-Security-Policy: default-src https://yideng.com` - 该服务器仅允许通过HTTPS方式并仅从yideng.com域名来访问文档

- 3. 输入验证：比如一些常见的数字、URL、电话号码、邮箱地址等等做校验判断

- 4. 开启浏览器XSS防御：Http Only cookie，禁止 JavaScript 读取某些敏感 Cookie，攻击者完成 XSS 注入后也无法窃取此 Cookie。

- 5. 验证码

### CSRF：跨站请求伪造

攻击者诱导受害者进入第三方网站，在第三方网站中，向被攻击网站发送跨站请求。利用受害者在被攻击网站已经获取的注册凭证，绕过后台的用户验证，达到冒充用户对被攻击的网站执行某项操作的目的。

#### 攻击流程举例

1. 受害者登录 a.com，并保留了登录凭证（Cookie）
2. 攻击者引诱受害者访问了b.com
3. b.com 向 a.com 发送了一个请求：a.com/act=xx浏览器会默认携带a.com的Cookie
4. a.com接收到请求后，对请求进行验证，并确认是受害者的凭证，误以为是受害者自己发送的请求
5. a.com以受害者的名义执行了act=xx
6. 攻击完成，攻击者在受害者不知情的情况下，冒充受害者，让a.com执行了自己定义的操作

#### 攻击类型

1. GET型：如在页面的某个 img 中发起一个 get 请求
2. POST型：通过自动提交表单到恶意网站
3. 链接型：需要诱导用户点击链接

#### 预防方案

CSRF通常从第三方网站发起，被攻击的网站无法防止攻击发生，只能通过增强自己网站针对CSRF的防护能力来提升安全性。

- 1. 同源检测：通过Header中的Origin Header 、Referer Header 确定，但不同浏览器可能会有不一样的实现，不能完全保证

- 2. CSRF Token 校验：将CSRF Token输出到页面中（通常保存在Session中），页面提交的请求携带这个Token，服务器验证Token是否正确

- 3. 双重cookie验证：
  - 流程：
    - 步骤1：在用户访问网站页面时，向请求域名注入一个Cookie，内容为随机字符串（例如csrfcookie=v8g9e4ksfhw）
    - 步骤2：在前端向后端发起请求时，取出Cookie，并添加到URL的参数中（接上例POST https://www.a.com/comment?csrfcookie=v8g9e4ksfhw）
    - 步骤3：后端接口验证Cookie中的字段与URL参数中的字段是否一致，不一致则拒绝。
  - 优点：
    - 无需使用Session，适用面更广，易于实施。
    - Token储存于客户端中，不会给服务器带来压力。
    - 相对于Token，实施成本更低，可以在前后端统一拦截校验，而不需要一个个接口和页面添加。
  - 缺点：
    - Cookie中增加了额外的字段。
    - 如果有其他漏洞（例如XSS），攻击者可以注入Cookie，那么该防御方式失效。
    - 难以做到子域名的隔离。
    - 为了确保Cookie传输安全，采用这种防御方式的最好确保用整站HTTPS的方式，如果还没切HTTPS的使用这种方式也会有风险。
- 4. Samesite Cookie属性：Google起草了一份草案来改进HTTP协议，那就是为Set-Cookie响应头新增Samesite属性，它用来标明这个 Cookie是个“同站 Cookie”，同站Cookie只能作为第一方Cookie，不能作为第三方Cookie，Samesite 有两个属性值，Strict 为任何情况下都不可以作为第三方 Cookie ，Lax 为可以作为第三方 Cookie , 但必须是Get请求

### 3）iframe 安全

#### 说明

- 1. 嵌入第三方 iframe 会有很多不可控的问题，同时当第三方 iframe 出现问题或是被劫持之后，也会诱发安全性问题
- 2. 点击劫持
  - 攻击者将目标网站通过 iframe 嵌套的方式嵌入自己的网页中，并将 iframe 设置为透明，诱导用户点击。
- 3. 禁止自己的 iframe 中的链接外部网站的JS

#### 预防方案

- 1. 为 iframe 设置 sandbox 属性，通过它可以对iframe的行为进行各种限制，充分实现“最小权限“原则
- 2. 服务端设置 X-Frame-Options Header头，拒绝页面被嵌套，X-Frame-Options 是HTTP 响应头中用来告诉浏览器一个页面是否可以嵌入 \<iframe> 中
  - eg.X-Frame-Options: SAMEORIGIN
  - SAMEORIGIN: iframe 页面的地址只能为同源域名下的页面
  - ALLOW-FROM: 可以嵌套在指定来源的 iframe 里
  - DENY: 当前页面不能被嵌套在 iframe 里
- 3. 设置 CSP 即 Content-Security-Policy 请求头
- 4. 减少对 iframe 的使用


### 4）错误的内容推断

#### 说明

文件上传类型校验失败后，导致恶意的JS文件上传后，浏览器 Content-Type Header 的默认解析为可执行的 JS 文件

#### 预防方案

设置 X-Content-Type-Options 头

### 5）第三方依赖包

减少对第三方依赖包的使用，如之前 npm 的包如：event-stream 被爆出恶意攻击数字货币；

### 6）HTTPS

#### 描述

黑客可以利用SSL Stripping这种攻击手段，强制让HTTPS降级回HTTP，从而继续进行中间人攻击。

#### 预防方案
解决这个安全问题的办法是使用HSTS（HTTP Strict Transport Security），它通过下面这个HTTP Header以及一个预加载的清单，来告知浏览器在和网站进行通信的时候强制性的使用HTTPS，而不是通过明文的HTTP进行通信：

``` header
Strict-Transport-Security: max-age=<seconds>; includeSubDomains; preload
```

这里的“强制性”表现为浏览器无论在何种情况下都直接向服务器端发起HTTPS请求，而不再像以往那样从HTTP跳转到HTTPS。另外，当遇到证书或者链接不安全的时候，则首先警告用户，并且不再让用户选择是否继续进行不安全的通信。

### 7）本地存储数据

避免重要的用户信息存在浏览器缓存中

### 8）静态资源完整性校验

#### 描述

使用 内容分发网络 (CDNs) 在多个站点之间共享脚本和样式表等文件可以提高站点性能并节省带宽。然而，使用CDN也存在风险，如果攻击者获得对 CDN 的控制权，则可以将任意恶意内容注入到 CDN 上的文件中 （或完全替换掉文件），因此可能潜在地攻击所有从该 CDN 获取文件的站点。

#### 预防方案

将使用 base64 编码过后的文件哈希值写入你所引用的 `<script>` 或 标签的 integrity 属性值中即可启用子资源完整性能。

### 9）网络劫持

#### 描述

- DNS劫持（涉嫌违法）：修改运行商的 DNS 记录，重定向到其他网站。DNS 劫持是违法的行为，目前 DNS 劫持已被监管，现在很少见 DNS 劫持
- HTTP劫持：前提有 HTTP 请求。因 HTTP 是明文传输，运营商便可借机修改 HTTP 响应内容（如加广告）。

#### 预防方案

全站 HTTPS

### 10）中间人攻击

中间人攻击（Man-in-the-middle attack, MITM），指攻击者与通讯的两端分别创建独立的联系，并交换其所收到的数据，使通讯的两端认为他们正在通过一个私密的连接与对方直接对话，但事实上整个会话都被攻击者窃听、篡改甚至完全控制。没有进行严格的证书校验是中间人攻击着手点。目前大多数加密协议都提供了一些特殊认证方法以阻止中间人攻击。如 SSL （安全套接字层）协议可以验证参与通讯的用户的证书是否有权威、受信任的数字证书认证机构颁发，并且能执行双向身份认证。攻击场景如用户在一个未加密的 WiFi下访问网站。在中间人攻击中，攻击者可以拦截通讯双方的通话并插入新的内容。

#### 场景

1. 在一个未加密的Wi-Fi 无线接入点的接受范围内的中间人攻击者，可以将自己作为一个中间人插入这个网络
2. Fiddler / Charles （花瓶）代理工具
3. 12306 之前的自己证书

#### 过程

1. 客户端发送请求到服务端，请求被中间人截获
2. 服务器向客户端发送公钥
3. 中间人截获公钥，保留在自己手上。然后自己生成一个【伪造的】公钥，发给客户端
4. 客户端收到伪造的公钥后，生成加密hash值发给服务器
5. 中间人获得加密hash值，用自己的私钥解密获得真秘钥,同时生成假的加密hash值，发给服务器
6. 服务器用私钥解密获得假密钥,然后加密数据传输给客户端

#### 使用抓包工具fiddle来进行举例说明

1. 首先通过一些途径在客户端安装证书
2. 然后客户端发送连接请求，fiddle在中间截取请求，并返回自己伪造的证书
3. 客户端已经安装了攻击者的根证书，所以验证通过
4. 客户端就会正常和fiddle进行通信，把fiddle当作正确的服务器
5. 同时fiddle会跟原有的服务器进行通信，获取数据以及加密的密钥，去解密密钥

#### 常见攻击方式

1. 嗅探：嗅探是一种用来捕获流进和流出的网络数据包的技术，就好像是监听电话一样。比如：抓包工具
2. 数据包注入：在这种，攻击者会将恶意数据包注入到常规数据中的，因为这些恶意数据包是在正常的数据包里面的，用户和系统都很难发现这个内容。
3. 会话劫持：当我们进行一个网站的登录的时候到退出登录这个时候，会产生一个会话，这个会话是攻击者用来攻击的首要目标，因为这个会话，包含了用户大量的数据和私密信息。
4. SSL剥离：HTTPS是通过SSL/TLS进行加密过的，在SSL剥离攻击中，会使SSL/TLS连接断开，让受保护的HTTPS，变成不受保护的HTTP（这对于网站非常致命）
5. DNS欺骗：攻击者往往通过入侵到DNS服务器，或者篡改用户本地hosts文件，然后去劫持用户发送的请求，然后转发到攻击者想要转发到的服务器
6. ARP欺骗： ARP(address resolution protocol)地址解析协议，攻击者利用APR的漏洞，用当前局域网之间的一台服务器，来冒充客户端想要请求的服务端，向客户端发送自己的MAC地址，客户端无从得到真正的主机的MAC地址，所以，他会把这个地址当作真正的主机来进行通信，将MAC存入ARP缓存表。
7. 代理服务器

#### 预防方案

1. 用可信的第三方CA厂商
2. 不下载未知来源的证书，不要去下载一些不安全的文件
3. 确认你访问的URL是HTTPS的，确保网站使用了SSL，确保禁用一些不安全的SSL，只开启：TLS1.1，TLS1.2
4. 不要使用公用网络发送一些敏感的信息
5. 不要去点击一些不安全的连接或者恶意链接或邮件信息

### 11）sql 注入

#### 描述

就是通过把SQL命令插入到Web表单递交或输入域名或页面请求的查询字符串，最终达到欺骗数据库服务器执行恶意的SQL命令,从而达到和服务器
进行直接的交互

#### 预防方案

1. 后台进行输入验证，对敏感字符过滤。
2. 使用参数化查询，能避免拼接SQL，就不要拼接SQL语句。

### 12）前端数据安全

#### 描述

反爬虫。如猫眼电影、天眼查等等，以数据内容为核心资产的企业

#### 预防方案

1. font-face拼接方式：猫眼电影、天眼查
2. background 拼接：美团
3. 伪元素隐藏：汽车之家
4. 元素定位覆盖式：去哪儿
5. iframe 异步加载：网易云音乐

### 13）其他建议

1. 定期请第三方机构做安全性测试，漏洞扫描
2. 使用第三方开源库做上线前的安全测试，可以考虑融合到CI中
3. code review 保证代码质量
4. 默认项目中设置对应的 Header 请求头，如 X-XSS-Protection、 X-Content-Type-Options 、X-Frame-Options Header、Content-Security-Policy 等等
5. 对第三方包和库做检测：NSP(Node Security Platform)，Snyk

## 对闭包的看法，为什么要用闭包？说一下闭包原理以及应用场景

### 1）什么是闭包

函数执行后返回结果是一个内部函数，并被外部变量所引用，如果内部函数持有被执行函数作用域的变量，即形成了闭包。

可以在内部函数访问到外部函数作用域。使用闭包，一可以读取函数中的变量，二可以将函数中的变量存储在内存中，保护变量不被污染。而正因闭包会把函数中的变量值存储在内存中，会对内存有消耗，所以不能滥用闭包，否则会影响网页性能，造成内存泄漏。当不需要使用闭包时，要及时释放内存，可将内层函数对象的变量赋值为null。

### 2）闭包原理

函数执行分成两个阶段(预编译阶段和执行阶段)。

- 在预编译阶段，如果发现内部函数使用了外部函数的变量，则会在内存中创建一个“闭包”对象并保存对应变量值，如果已存在“闭包”，则只需要增加对应属性值即可。

- 执行完后，函数执行上下文会被销毁，函数对“闭包”对象的引用也会被销毁，但其内部函数还持用该“闭包”的引用，所以内部函数可以继续使用“外部函数”中的变量

利用了函数作用域链的特性，一个函数内部定义的函数会将包含外部函数的活动对象添加到它的作用域链中，函数执行完毕，其执行作用域链销毁，但因内部函数的作用域链仍然在引用这个活动对象，所以其活动对象不会被销毁，直到内部函数被销毁后才被销毁。

### 3）优点

1. 可以从内部函数访问外部函数的作用域中的变量，且访问到的变量长期驻扎在内存中，可供之后使用
2. 避免变量污染全局
3. 把变量存到独立的作用域，作为私有成员存在

### 4）缺点

1. 对内存消耗有负面影响。因内部函数保存了对外部变量的引用，导致无法被垃圾回收，增大内存使用量，所以使用不当会导致内存泄漏
2. 对处理速度具有负面影响。闭包的层级决定了引用的外部变量在查找时经过的作用域链长度
3. 可能获取到意外的值(captured value)

### 5）应用场景

#### 应用场景一

典型应用是模块封装，在各模块规范出现之前，都是用这样的方式防止变量污染全局。

``` js
var Yideng = (function () {
  // 这样声明为模块私有变量，外界无法直接访问
  var foo = 0;

  function Yideng() {}
  Yideng.prototype.bar = function bar() {
    return foo;
  };

  return Yideng;
}());
```

#### 应用场景二

在循环中创建闭包，防止取到意外的值。

如下代码，无论哪个元素触发事件，都会弹出 3。因为函数执行后引用的 i 是同一个，而 i 在循环结束后就是 3

``` js
for (var i = 0; i < 3; i++) {
  document.getElementById('id' + i).onfocus = function() {
    alert(i);
  };
}

// 可用闭包解决
function makeCallback(num) {
  return function() {
    alert(num);
  };
}

for (var i = 0; i < 3; i++) {
  document.getElementById('id' + i).onfocus = makeCallback(i);
}
```

## CSS 伪类与伪元素区别

### 1）伪类(pseudo-classes)

- 其核⼼就是⽤来选择DOM树之外的信息，不能够被普通选择器选择的⽂档之外的元素，⽤来添加⼀些选择器的特殊效果。
- ⽐如:hover :active :visited :link :first-child :focus :lang等
- 由于状态的变化是⾮静态的，所以元素达到⼀个特定状态时，它可能得到⼀个伪类的样式；当状态改变时，它⼜会失去这个样式。
- 由此可以看出，它的功能和class有些类似，但它是基于⽂档之外的抽象，所以叫 伪类。

### 2）伪元素(Pseudo-elements)

- DOM树没有定义的虚拟元素
- 核⼼就是需要创建通常不存在于⽂档中的元素。
- ⽐如::before ::after 表示选择元素内容的之前内容或之后内容。
- 伪元素控制的内容和元素是没有差别的，但是它本身只是基于元素的抽象，并不存在于⽂档中，所以称为伪元素。⽤于将特殊的效果添加到某些选择器

### 3）伪类与伪元素的区别

- 表示⽅法

  - CSS2 中伪类、伪元素都是以单冒号:表示,
  - CSS2.1 后规定伪类⽤单冒号表示,伪元素⽤双冒号::表示，
  - 浏览器同样接受 CSS2 时代已经存在的伪元素(:before, :after, :first-line, :first-letter 等)的单冒号写法。
  - CSS2 之后所有新增的伪元素(如::selection)，应该采⽤双冒号的写法。
  - CSS3中，伪类与伪元素在语法上也有所区别，伪元素修改为以::开头。浏览器对以:开头的伪元素也继续⽀持，但建议规范书写为::开头

- 定义不同

  - 伪类即假的类，可以添加类来达到效果
  - 伪元素即假元素，需要通过添加元素才能达到效果

- 总结
  - 伪类和伪元素都是⽤来表示⽂档树以外的"元素"。
  - 伪类和伪元素分别⽤单冒号:和双冒号::来表示。
  - 伪类和伪元素的区别，关键点在于如果没有伪元素(或伪类)，
  - 是否需要添加元素才能达到效果，如果是则是伪元素，反之则是伪类。

### 4）相同之处

- 伪类和伪元素都不出现在源⽂件和DOM树中。也就是说在html源⽂件中是看不到伪类和伪元素的。

### 5）不同之处

- 伪类其实就是基于普通DOM元素⽽产⽣的不同状态，他是DOM元素的某⼀特征。
- 伪元素能够创建在DOM树中不存在的抽象对象，⽽且这些抽象对象是能够访问到的。

## 有一堆整数，请把他们分成三份，确保每一份和尽量相等（11，42，23，4，5，6, 4, 5, 6, 11, 23, 42, 56, 78, 90）

``` js
function f1(arr, count) {
  // 数组从大到小排序
  arr.sort((a, b) => b - a);
  // 计算平均值
  let avg = arr.reduce((a,b) => a + b) / count;
  let resArr = [];
  let current = 0;

  // 从大到小求和，取最接近平均值的一组，放入二维数组
  for (let i = 0; i < count - 1; i++) {
    if (current + arr[arr.length-1] / 2 < avg && i) {
      arr.pop();
      resArr[i-1].push(arr[arr.length-1]);
    }
    current = 0;
    resArr[i] = [];
    arr.forEach((item, index) => {
      current += item;
      arr.splice(index,1);
      resArr[i].push(item);
      if (current > avg) {
        current -= item;
        arr.splice(index,0,item);
        resArr[i].pop();
      }
    });
  }

  resArr[count-1] = arr;

  return resArr;
}
//测试，第一个参数为数组，第二个为份数
console.log(f1([11,42,23,4,5,6,4,5,6,11,23,42,56,78,90], 3))
```

## 实现 lodash 的_.get

在 js 中经常会出现嵌套调用这种情况，如 a.b.c.d.e，但是这么写很容易抛出异常。你需要这么写 a && a.b && a.b.c && a.b.c.d && a.b.c.d.e，但是显得有些啰嗦与冗长了。特别是在 graphql 中，这种嵌套调用更是难以避免。

这时就需要一个 get 函数，使用 get(a, 'b.c.d.e') 简单清晰，并且容错性提高了很多。

### 1）代码实现

``` js
function get(source, path, defaultValue = undefined) {
  // a[3].b -> a.3.b -> [a,3,b]
 // path 中也可能是数组的路径，全部转化成 . 运算符并组成数组
  const paths = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let result = source;
  for (const p of paths) {
    // 注意 null 与 undefined 取属性会报错，所以使用 Object 包装一下。
    result = Object(result)[p];
    if (result == undefined) {
      return defaultValue;
    }
  }
  return result;
}
// 测试用例
console.log(get({ a: null }, "a.b.c", 3)); // output: 3
console.log(get({ a: undefined }, "a", 3)); // output: 3
console.log(get({ a: null }, "a", 3)); // output: 3
console.log(get({ a: [{ b: 1 }] }, "a[0].b", 3)); // output: 1
```

### 2）代码实现

不考虑数组的情况

``` js
const _get = (object, keys, val) => {
 return keys.split(/\./).reduce(
  (o, j)=>( (o || {})[j] ),
  object
 ) || val
}

console.log(get({ a: null }, "a.b.c", 3)); // output: 3
console.log(get({ a: undefined }, "a", 3)); // output: 3
console.log(get({ a: null }, "a", 3)); // output: 3
console.log(get({ a: { b: 1 } }, "a.b", 3)); // output: 1
```

## 实现 add(1)(2)(3)

考点：函数柯里化

函数柯里化概念： 柯里化（Currying）是把接受多个参数的函数转变为接受一个单一参数的函数，并且返回接受余下的参数且返回结果的新函数的技术。

### 1）粗暴版

``` js
function add (a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    }
  }
}
console.log(add(1)(2)(3)); // 6
```

### 2）柯里化解决方案

#### 参数长度固定

``` js
const curry = (fn) =>(judge = (...args) => args.length === fn.length ? fn(...args) : (...arg) => judge(...args, ...arg));
const add = (a, b, c) => a + b + c;
const curryAdd = curry(add);
console.log(curryAdd(1)(2)(3)); // 6
console.log(curryAdd(1, 2)(3)); // 6
console.log(curryAdd(1)(2, 3)); // 6
```

#### 参数长度不固定

``` js
function add (...args) {
  //求和
  return args.reduce((a, b) => a + b);
}

function currying (fn) {
  let args = [];

  return function temp (...newArgs) {
    if (newArgs.length) {
      args = [
        ...args,
        ...newArgs
      ];
      return temp;
    } else {
      let val = fn.apply(this, args);
      args = []; //保证再次调用时清空
      return val;
    }
  }
}

let addCurry = currying(add);
console.log(addCurry(1)(2)(3)(4, 5)());  //15
console.log(addCurry(1)(2)(3, 4, 5)());  //15
console.log(addCurry(1)(2, 3, 4, 5)());  //15
```

## 实现链式调用

链式调用的核心就在于调用完的方法将自身实例返回

### 1）示例一

``` js
function Class1() {
  console.log('初始化');
}

Class1.prototype.method = function(param) {
  console.log(param);
  return this;
}

let cl = new Class1();
//由于new 在实例化的时候this会指向创建的对象， 所以this.method这个方法会在原型链中找到。
cl.method('第一次调用').method('第二次链式调用').method('第三次链式调用');
```

### 2）示例二

``` js
var obj = {
  a: function() {
    console.log("a");
    return this;
  },
  b: function() {
    console.log("b");
    return this;
  },
};
obj.a().b();
```

### 3）示例三

``` js
// 类
class Math {
  constructor(value) {
    this.hasInit = true;
    this.value = value;

    if (!value) {
      this.value = 0;
      this.hasInit = false;
    }
  }
  add() {
    let args = [...arguments];
    let initValue = this.hasInit ? this.value : args.shift();
    const value = args.reduce((prev, curv) => prev + curv, initValue);
    return new Math(value);
  }
  minus() {
    let args = [...arguments];
    let initValue = this.hasInit ? this.value : args.shift();
    const value = args.reduce((prev, curv) => prev - curv, initValue);
    return new Math(value);
  }
  mul() {
    let args = [...arguments];
    let initValue = this.hasInit ? this.value : args.shift();
    const value = args.reduce((prev, curv) => prev * curv, initValue);
    return new Math(value);
  }
  divide() {
    let args = [...arguments];
    let initValue = this.hasInit ? this.value : args.shift();
    const value = args.reduce((prev, curv) => prev / (+curv ? curv : 1), initValue);
    return new Math(value);
  }
}

let test = new Math();
const res = test.add(222, 333, 444).minus(333, 222).mul(3, 3).divide(2, 3);
console.log(res.value);

// 原型链
Number.prototype.add = function() {
  let _that = this;
  _that = [...arguments].reduce((prev, curv) => prev + curv, _that);
  return _that;
}
Number.prototype.minus = function() {
  let _that = this;
  _that = [...arguments].reduce((prev, curv) => prev - curv, _that);
  return _that;
}
Number.prototype.mul = function() {
  let _that = this;
  _that = [...arguments].reduce((prev, curv) => prev * curv, _that);
  return _that;
}
Number.prototype.divide = function() {
  let _that = this;
  _that = [...arguments].reduce((prev, curv) => prev / (+curv ? curv : 1), _that);
  return _that;
}
let num = 0;
let newNum = num.add(222, 333, 444).minus(333, 222).mul(3, 3).divide(2, 3)
console.log(newNum)
```

## React 事件绑定原理

React并不是将click事件绑在该div的真实DOM上，而是在document处监听所有支持的事件，当事件发生并冒泡至document处时，React将事件内容封装并交由真正的处理函数运行。这样的方式不仅减少了内存消耗，还能在组件挂载销毁时统一订阅和移除事件。
另外冒泡到 document 上的事件也不是原生浏览器事件，而是 React 自己实现的合成事件（SyntheticEvent）。因此我们如果不想要事件冒泡的话，调用 event.stopPropagation 是无效的，而应该调用 event.preventDefault。

![react事件绑定原理](https://user-images.githubusercontent.com/8088864/126061467-cd14eaa1-038a-48c2-ae47-221ad03e725c.png)

### 1）事件注册

![事件注册流程](https://user-images.githubusercontent.com/8088864/126061515-beeda52c-8cf9-4af2-9d6f-2da545e09ba7.png)

- 组件装载 / 更新。
- 通过lastProps、nextProps判断是否新增、删除事件分别调用事件注册、卸载方法。
- 调用EventPluginHub的enqueuePutListener进行事件存储
- 获取document对象。
- 根据事件名称（如onClick、onCaptureClick）判断是进行冒泡还是捕获。
- 判断是否存在addEventListener方法，否则使用attachEvent（兼容IE）。
- 给document注册原生事件回调为dispatchEvent（统一的事件分发机制）。

### 2）事件存储

![事件存储](https://user-images.githubusercontent.com/8088864/126061553-7d2039f1-9724-4069-b675-559fd95f8bff.png)

- EventPluginHub负责管理React合成事件的callback，它将callback存储在listenerBank中，另外还存储了负责合成事件的Plugin。
- EventPluginHub的putListener方法是向存储容器中增加一个listener。
- 获取绑定事件的元素的唯一标识key。
- 将callback根据事件类型，元素的唯一标识key存储在listenerBank中。
- listenerBank的结构是：listenerBank\[registrationName]\[key]。

``` js
{
  onClick:{
    nodeid1:()=>{...}
    nodeid2:()=>{...}
  },
  onChange:{
    nodeid3:()=>{...}
    nodeid4:()=>{...}
  }
}
```

### 3）事件触发执行

![事件触发执行](https://user-images.githubusercontent.com/8088864/126061593-4be8d1a6-9001-42c0-af56-928106a89d79.png)

- 触发document注册原生事件的回调dispatchEvent
- 获取到触发这个事件最深一级的元素
  这里的事件执行利用了React的批处理机制

代码示例

``` jsx
<div onClick={this.parentClick} ref={ref => this.parent = ref}>
  <div onClick={this.childClick} ref={ref => this.child = ref}>
    test
  </div>
</div>
```

- 首先会获取到this.child
- 遍历这个元素的所有父元素，依次对每一级元素进行处理。
- 构造合成事件。
- 将每一级的合成事件存储在eventQueue事件队列中。
- 遍历eventQueue。
- 通过isPropagationStopped判断当前事件是否执行了阻止冒泡方法。
- 如果阻止了冒泡，停止遍历，否则通过executeDispatch执行合成事件。
- 释放处理完成的事件。

### 4）合成事件

![事件合成](https://user-images.githubusercontent.com/8088864/126061657-e91d4aa2-d61f-4b3d-82e6-37805b645710.png)

- 调用EventPluginHub的extractEvents方法。
- 循环所有类型的EventPlugin（用来处理不同事件的工具方法）。
- 在每个EventPlugin中根据不同的事件类型，返回不同的事件池。
- 在事件池中取出合成事件，如果事件池是空的，那么创建一个新的。
- 根据元素nodeid(唯一标识key)和事件类型从listenerBink中取出回调函数
- 返回带有合成事件参数的回调函数

5）总流程

![事件总流程](https://user-images.githubusercontent.com/8088864/126061682-e2ee65f1-651c-4762-bb7c-972602b1d451.png)

## 类数组和数组的区别，dom 的类数组如何转换成数组

### 1）定义

- 数组是一个特殊对象,与常规对象的区别：
  - 1. 当由新元素添加到列表中时，自动更新length属性
  - 2. 设置length属性，可以截断数组
  - 3. 从Array.protoype中继承了方法
  - 4. 属性为'Array'
- 类数组是一个拥有length属性，并且他属性为非负整数的普通对象，类数组不能直接调用数组方法

### 2）区别

本质：类数组是简单对象，它的原型关系与数组不同。

``` js
// 原型关系和原始值转换
let arrayLike = {
    length: 10,
};
console.log(arrayLike instanceof Array); // false
console.log(arrayLike.__proto__.constructor === Array); // false
console.log(arrayLike.toString()); // [object Object]
console.log(arrayLike.valueOf()); // {length: 10}

let array = [];
console.log(array instanceof Array); // true
console.log(array.__proto__.constructor === Array); // true
console.log(array.toString()); // ''
console.log(array.valueOf()); // []
```

### 3）类数组转换为数组

- 转换方法
  - 1. 使用 Array.from()
  - 2. 使用 Array.prototype.slice.call()
  - 3. 使用 Array.prototype.forEach() 进行属性遍历并组成新的数组

- 转换须知
  - 转换后的数组长度由 length 属性决定。索引不连续时转换结果是连续的，会自动补位。
  - 代码示例

  ``` js
  let al1 = {
      length: 4,
      0: 0,
      1: 1,
      3: 3,
      4: 4,
      5: 5,
  };
  console.log(Array.from(al1)) // [0, 1, undefined, 3]
  ```

  - 仅考虑 0或正整数的索引

  ``` js
  // 代码示例
  let al2 = {
      length: 4,
      '-1': -1,
      '0': 0,
      a: 'a',
      1: 1
  };
  console.log(Array.from(al2)); // [0, 1, undefined, undefined]
  ```

  - 使用slice转换产生稀疏数组

  ``` js
  // 代码示例
  let al2 = {
      length: 4,
      '-1': -1,
      '0': 0,
      a: 'a',
      1: 1
  };
  console.log(Array.prototype.slice.call(al2)); //[0, 1, empty × 2]
  ```

### 4）使用数组方法操作类数组注意地方

``` js
let arrayLike2 = {
  2: 3,
  3: 4,
  length: 2,
  push: Array.prototype.push
}

// push 操作的是索引值为 length 的位置
arrayLike2.push(1);
console.log(arrayLike2); // {2: 1, 3: 4, length: 3, push: ƒ}
arrayLike2.push(2);
console.log(arrayLike2); // {2: 1, 3: 2, length: 4, push: ƒ}
```

## webpack 做过哪些优化，开发效率方面、打包策略方面等等

### 1）优化 Webpack 的构建速度

- 使用高版本的 Webpack （使用webpack4）
- 多线程/多实例构建：HappyPack(不维护了)、thread-loader
- 缩小打包作用域：
  - exclude/include (确定 loader 规则范围)
  - resolve.modules 指明第三方模块的绝对路径 (减少不必要的查找)
  - resolve.extensions 尽可能减少后缀尝试的可能性
  - noParse 对完全不需要解析的库进行忽略 (不去解析但仍会打包到 bundle 中，注意被忽略掉的文件里不应该包含 import、require、define 等模块化语句)
  - IgnorePlugin (完全排除模块)
  - 合理使用alias
- 充分利用缓存提升二次构建速度：
  - babel-loader 开启缓存
  - terser-webpack-plugin 开启缓存
  - 使用 cache-loader 或者 hard-source-webpack-plugin
    注意：thread-loader 和 cache-loader 兩個要一起使用的話，請先放 cache-loader 接著是 thread-loader 最後才是 heavy-loader
- DLL：
  - 使用 DllPlugin 进行分包，使用 DllReferencePlugin(索引链接) 对 manifest.json 引用，让一些基本不会改动的代码先打包成静态资源，避免反复编译浪费时间。

### 2）使用webpack4-优化原因

1. V8带来的优化（for of替代forEach、Map和Set替代Object、includes替代indexOf）
2. 默认使用更快的md4 hash算法
3. webpacks AST可以直接从loader传递给AST，减少解析时间
4. 使用字符串方法替代正则表达式

#### noParse

- 不去解析某个库内部的依赖关系
- 比如jquery 这个库是独立的， 则不去解析这个库内部依赖的其他的东西
- 在独立库的时候可以使用

``` js
module.exports = {
  module: {
    noParse: /jquery/,
    rules:[]
  }
}
```

#### IgnorePlugin

- 忽略掉某些内容 不去解析依赖库内部引用的某些内容
- 从moment中引用 ./locol 则忽略掉
- 如果要用local的话 则必须在项目中必须手动引入 import 'moment/locale/zh-cn'

``` js
module.exports = {
  plugins: [
    new Webpack.IgnorePlugin(/./local/, /moment/),
  ]
}
```

#### dllPlugin

- 不会多次打包， 优化打包时间
- 先把依赖的不变的库打包
- 生成 manifest.json文件
- 然后在webpack.config中引入
- webpack.DllPlugin Webpack.DllReferencePlugin

#### happypack -> thread-loader

- 大项目的时候开启多线程打包
- 影响前端发布速度的有两个方面，一个是构建，一个就是压缩，把这两个东西优化起来，可以减少很多发布的时间。

#### thread-loader

thread-loader 会将您的 loader 放置在一个 worker 池里面运行，以达到多线程构建。
把这个 loader 放置在其他 loader 之前（如下图 example 的位置）， 放置在这个 loader 之后的 loader 就会在一个单独的 worker 池(worker pool)中运行。

``` js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve("src"),
        use: [
          "thread-loader",
          // 你的高开销的loader放置在此 (e.g babel-loader)
        ]
      }
    ]
  }
}
```

每个 worker 都是一个单独的有 600ms 限制的 node.js 进程。同时跨进程的数据交换也会被限制。请在高开销的loader中使用，否则效果不佳

#### 压缩加速——开启多线程压缩

- 不推荐使用 webpack-paralle-uglify-plugin，项目基本处于没人维护的阶段，issue 没人处理，pr没人合并。
  Webpack 4.0以前：uglifyjs-webpack-plugin，parallel参数

``` js
module.exports = {
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
      }),
    ],
  },
};
```

- 推荐使用 terser-webpack-plugin

``` js
module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true   // 多线程
      })
    ],
  },
};
```

### 2）优化 Webpack 的打包体积

- 压缩代码
  - webpack-paralle-uglify-plugin
  - uglifyjs-webpack-plugin 开启 parallel 参数 (不支持ES6)
  - terser-webpack-plugin 开启 parallel 参数
  - 多进程并行压缩
  - 通过 mini-css-extract-plugin 提取 Chunk 中的 CSS 代码到单独文件，通过optimize-css-assets-webpack-plugin插件 开启 cssnano 压缩 CSS。
- 提取页面公共资源
  - 使用 html-webpack-externals-plugin，将基础包通过 CDN 引入，不打入 bundle 中
  - 使用 SplitChunksPlugin 进行(公共脚本、基础包、页面公共文件)分离(Webpack4内置) ，替代了 CommonsChunkPlugin 插件
  - 基础包分离：将一些基础库放到cdn，比如vue，webpack 配置 external是的vue不打入bundle
- Tree shaking
  - purgecss-webpack-plugin 和 mini-css-extract-plugin配合使用(建议)
  - 打包过程中检测工程中没有引用过的模块并进行标记，在资源压缩时将它们从最终的bundle中去掉(只能对ES6 Modlue生效) 开发中尽可能使用ES6 Module的模块，提高tree shaking效率
  - 禁用 babel-loader 的模块依赖解析，否则 Webpack 接收到的就都是转换过的 CommonJS 形式的模块，无法进行 tree-shaking
  - 使用 PurifyCSS(不在维护) 或者 uncss 去除无用 CSS 代码
- Scope hosting
  - 构建后的代码会存在大量闭包，造成体积增大，运行代码时创建的函数作用域变多，内存开销变大。Scope hosting 将所有模块的代码按照引用顺序放在一个函数作用域里，然后适当的重命名一些变量以防止变量名冲突
  - 必须是ES6的语法，因为有很多第三方库仍采用 CommonJS 语法，为了充分发挥 Scope hosting 的作用，需要配置 mainFields 对第三方模块优先采用 jsnext:main 中指向的ES6模块化语法
- 图片压缩
  - 使用基于 Node 库的 imagemin (很多定制选项、可以处理多种图片格式)
  - 配置 image-webpack-loader
- 动态Polyfill
  - 建议采用 polyfill-service 只给用户返回需要的polyfill，社区维护。(部分国内奇葩浏览器UA可能无法识别，但可以降级返回所需全部polyfill)
  - @babel-preset-env 中通过useBuiltIns: 'usage参数来动态加载polyfill。

### 3）speed-measure-webpack-plugin

简称 SMP，分析出 Webpack 打包过程中 Loader 和 Plugin 的耗时，有助于找到构建过程中的性能瓶颈。

### 4）开发阶段常用的插件

#### 开启多核压缩

插件：**terser-webpack-plugin**

``` js
const TerserPlugin = require('terser-webpack-plugin')
module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 6,
        },
      }),
    ]
  }
}
```

#### 监控面板

插件：**speed-measure-webpack-plugin**

在打包的时候显示出每一个loader,plugin所用的时间，来精准优化

``` js
// webpack.config.js文件
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();
//............
// 用smp.warp()包裹一下合并的config
module.exports = smp.wrap(merge(_mergeConfig, webpackConfig));
```

#### 开启一个通知面板

插件：**webpack-build-notifier**

``` js
// webpack.config.js文件
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const webpackConfig= {
  plugins: [
    new WebpackBuildNotifierPlugin({
      title: '我的webpack',
      // logo: path.resolve('./img/favicon.png'),
      suppressSuccess: true
    })
  ]
}
```

#### 开启打包进度

插件：**progress-bar-webpack-plugin**

``` js
// webpack.config.js文件
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const webpackConfig= {
  plugins: [
    new ProgressBarPlugin(),
  ]
}
```

#### 开发面板更清晰

插件：**webpack-dashboard**

``` js
// webpack.config.js文件
const DashboardPlugin = require('webpack-dashboard/plugin');
const webpackConfig= {
  plugins: [
    new DashboardPlugin()
  ]
}
```

``` json
// package.json文件
{
  "scripts": {
    "dev": "webpack-dashboard webpack --mode development",
  },
}
```

#### 开启窗口的标题

第三方库: **node-bash-title**

这个包mac的item用有效果，windows暂时没看到效果

``` js
// webpack.config.js文件
const setTitle = require('node-bash-title');
setTitle('server');
```

#### friendly-errors-webpack-plugin

插件：**friendly-errors-webpack-plugin**

``` js
const webpackConfig= {
  plugins: [
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['You application is running here http://localhost:3000'],
        notes: ['Some additionnal notes to be displayed unpon successful compilation']
      },
      onErrors: function (severity, errors) {
        // You can listen to errors transformed and prioritized by the plugin
        // severity can be 'error' or 'warning'
      },
      // should the console be cleared between each compilation?
      // default is true
      clearConsole: true,

      // add formatters and transformers (see below)
      additionalFormatters: [],
      additionalTransformers: []
    }),
  ]
}
```

## 说一下事件循环机制(node、浏览器)

### 1）为什么会有Event Loop

JavaScript的任务分为两种`同步`和`异步`，它们的处理方式也各自不同，**同步任务**是直接放在主线程上排队依次执行，**异步任务**会放在任务队列中，若有多个异步任务则需要在任务队列中排队等待，任务队列类似于缓冲区，任务下一步会被移到**调用栈**然后主线程执行调用栈的任务。

**调用栈**：调用栈是一个栈结构，函数调用会形成一个栈帧，帧中包含了当前执行函数的参数和局部变量等上下文信息，函数执行完后，它的执行上下文会从栈中弹出。

​JavaScript是`单线程`的，单线程是指 js引擎中解析和执行js代码的线程只有一个（主线程），每次只能做一件事情，然而`ajax`请求中，主线程在等待响应的过程中回去做其他事情，浏览器先在事件表注册ajax的回调函数，响应回来后回调函数被添加到任务队列中等待执行，不会造成线程阻塞，所以说js处理ajax请求的方式是异步的。

​ 综上所述，检查调用栈是否为空以及讲某个任务添加到调用栈中的个过程就是event loop，这就是JavaScript实现异步的核心。

### 2）浏览器中的 Event Loop

#### Micro-Task 与 Macro-Task

浏览器端事件循环中的异步队列有两种：macro（宏任务）队列和 micro（微任务）队列。

常见的 macro-task：setTimeout、setInterval、script（整体代码）、 I/O 操作、UI 渲染等。

常见的 micro-task: new Promise().then(回调)、MutationObserve 等。

#### requestAnimationFrame

requestAnimationFrame也属于异步执行的方法，但该方法既不属于宏任务，也不属于微任务。按照MDN中的定义：

window.requestAnimationFrame() 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行

requestAnimationFrame是GUI渲染之前执行，但在Micro-Task之后，不过requestAnimationFrame不一定会在当前帧必须执行，由浏览器根据当前的策略自行决定在哪一帧执行。

#### event loop过程

![event loop过程](https://user-images.githubusercontent.com/8088864/126062256-502787ec-32ec-4b59-924e-45bed78222e9.jpg)

1. 检查macrotask队列是否为空，非空则到2，为空则到3
2. 执行macrotask中的一个任务
3. 继续检查microtask队列是否为空，若有则到4，否则到5
4. 取出microtask中的任务执行，执行完成返回到步骤3
5. 执行视图更新

当某个宏任务执行完后,会查看是否有微任务队列。如果有，先执行微任务队列中的所有任务，如果没有，会读取宏任务队列中排在最前的任务，执行宏任务的过程中，遇到微任务，依次加入微任务队列。栈空后，再次读取微任务队列里的任务，依次类推。

### 3）node中的 Event Loop

Node 中的 Event Loop 和浏览器中的是完全不相同的东西。Node.js采用V8作为js的解析引擎，而I/O处理方面使用了自己设计的libuv，libuv是一个基于事件驱动的跨平台抽象层，封装了不同操作系统一些底层特性，对外提供统一的API，事件循环机制也是它里面的实现

![nodejs中的 Event Loop](https://user-images.githubusercontent.com/8088864/126062291-3b0274ed-1308-4bfd-be48-7dc4ba458883.png)

根据上图node的运行机制如下:

1. V8引擎解析JavaScript脚本。
2. 解析后的代码，调用Node API。
3. libuv库负责Node API的执行。它将不同的任务分配给不同的线程，形成一个Event Loop（事件循环），以异步的方式将任务的执行结果返回给V8引擎。
4. V8引擎再将结果返回给用户。

#### 六大阶段

其中libuv引擎中的事件循环分为 6 个阶段，它们会按照顺序反复运行。每当进入某一个阶段的时候，都会从对应的回调队列中取出函数去执行。当队列为空或者执行的回调函数数量到达系统设定的阈值，就会进入下一阶段。

![libuv引擎事件循环的六大阶段](https://user-images.githubusercontent.com/8088864/126062318-299d2b2b-ef0a-4d78-9221-5a8062e9ad34.png)

1. `timers` 阶段：这个阶段执行timer（setTimeout、setInterval）的回调，并且是由 poll 阶段控制的。
2. `I/O callbacks` 阶段：处理一些上一轮循环中的少数未执行的 I/O 回调
3. `idle, prepare` 阶段：仅node内部使用
4. `poll` 阶段：获取新的I/O事件, 适当的条件下node将阻塞在这里
5. `check` 阶段：执行 setImmediate() 的回调
6. `close callbacks` 阶段：执行 socket 的 close 事件回调

#### poll阶段

poll 是一个至关重要的阶段，这一阶段中，系统会做两件事情

1. 回到 timer 阶段执行回调

2. 执行 I/O 回调

并且在进入该阶段时如果没有设定了 timer 的话，会发生以下两件事情

- 如果 poll 队列不为空，会遍历回调队列并同步执行，直到队列为空或者达到系统限制
- 如果 poll 队列为空时，会有两件事发生
  - 如果有 setImmediate 回调需要执行，poll 阶段会停止并且进入到 check 阶段执行回调
  - 如果没有 setImmediate 回调需要执行，会等待回调被加入到队列中并立即执行回调，这里同样会有个超时时间设置防止一直等待下去

当然设定了 timer 的话且 poll 队列为空，则会判断是否有 timer 超时，如果有的话会回到 timer 阶段执行回调。

#### Micro-Task 与 Macro-Task

Node端事件循环中的异步队列也是这两种：macro（宏任务）队列和 micro（微任务）队列。

常见的 macro-task 比如：`setTimeout`、`setInterval`、 `setImmediate`、`script（整体代码）`、` I/O 操作`等。
常见的 micro-task 比如: `process.nextTick`、`new Promise().then(回调)`等。

#### setTimeout 和 setImmediate

二者非常相似，区别主要在于调用时机不同。

- setImmediate 设计在poll阶段完成时执行，即check阶段；
- setTimeout 设计在poll阶段为空闲时，且设定时间到达后执行，但它在timer阶段执行

``` js
setTimeout(function timeout () {
  console.log('timeout');
},0);
setImmediate(function immediate () {
  console.log('immediate');
});
```

1. 对于以上代码来说，setTimeout 可能执行在前，也可能执行在后。
2. 首先 setTimeout(fn, 0) === setTimeout(fn, 1)，这是由源码决定的 进入事件循环也是需要成本的，如果在准备时候花费了大于 1ms 的时间，那么在 timer 阶段就会直接执行 setTimeout 回调
3. 如果准备时间花费小于 1ms，那么就是 setImmediate 回调先执行了

#### process.nextTick

这个函数其实是独立于 Event Loop 之外的，它有一个自己的队列，当每个阶段完成后，如果存在 nextTick 队列，就会清空队列中的所有回调函数，并且优先于其他 microtask 执行

### 4）Node与浏览器的 Event Loop 差异

![Node与浏览器的 Event Loop 差异](https://user-images.githubusercontent.com/8088864/126062411-f536ebf8-1d5f-482b-b939-6be320e3446c.png)

- Node端，microtask 在事件循环的各个阶段之间执行
- 浏览器端，microtask 在事件循环的 macrotask 执行完之后执行

## 如何封装 node 中间件

在NodeJS中，中间件主要是指封装所有Http请求细节处理的方法。一次Http请求通常包含很多工作，如记录日志、ip过滤、查询字符串、请求体解析、Cookie处理、权限验证、参数验证、异常处理等，但对于Web应用而言，并不希望接触到这么多细节性的处理，因此引入中间件来简化和隔离这些基础设施与业务逻辑之间的细节，让开发者能够关注在业务的开发上，以达到提升开发效率的目的。

中间件的行为比较类似Java中过滤器的工作原理，就是在进入具体的业务处理之前，先让过滤器处理。

``` js
const http = require('http')
function compose(middlewareList) {
  return function (ctx) {
    function dispatch (i) {
      const fn = middlewareList[i]
      try {
        return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)))
      } catch (err) {
        Promise.reject(err)
      }
    }
    return dispatch(0)
  }
}
class App {
  constructor(){
    this.middlewares = []
  }
  use(fn){
    this.middlewares.push(fn)
    return this
  }
  handleRequest(ctx, middleware) {
    return middleware(ctx)
  }
  createContext (req, res) {
    const ctx = {
      req,
      res
    }
    return ctx
  }
  callback () {
    const fn = compose(this.middlewares)
    return (req, res) => {
      const ctx = this.createContext(req, res)
      return this.handleRequest(ctx, fn)
    }
  }
  listen(...args) {
    const server = http.createServer(this.callback())
    return server.listen(...args)
  }
}
module.exports = App
```

## node 中间层怎样做的请求合并转发

### 1）什么是中间层

- 就是前端---请求---> nodejs ----请求---->后端 ----响应--->nodejs--数据处理---响应---->前端。这么一个流程，这个流程的好处就是当业务逻辑过多，或者业务需求在不断变更的时候，前端不需要过多当去改变业务逻辑，与后端低耦合。前端即显示，渲染。后端获取和存储数据。中间层处理数据结构，返回给前端可用可渲染的数据结构。
- nodejs是起中间层的作用，即根据客户端不同请求来做相应的处理或渲染页面，处理时可以是把获取的数据做简单的处理交由底层java那边做真正的数据持久化或数据更新，也可以是从底层获取数据做简单的处理返回给客户端。
- 通常我们把Web领域分为客户端和服务端，也就是前端和后端，这里的后端就包含了网关，静态资源，接口，缓存，数据库等。而中间层呢，就是在后端这里再抽离一层出来，在业务上处理和客户端衔接更紧密的部分，比如页面渲染（SSR），数据聚合，接口转发等等。
- 以SSR来说，在服务端将页面渲染好，可以加快用户的首屏加载速度，避免请求时白屏，还有利于网站做SEO，他的好处是比较好理解的。

### 2）中间层可以做的事情

- 代理：在开发环境下，我们可以利用代理来，解决最常见的跨域问题；在线上环境下，我们可以利用代理，转发请求到多个服务端。
- 缓存：缓存其实是更靠近前端的需求，用户的动作触发数据的更新，node中间层可以直接处理一部分缓存需求。
- 限流：node中间层，可以针对接口或者路由做响应的限流。
- 日志：相比其他服务端语言，node中间层的日志记录，能更方便快捷的定位问题（是在浏览器端还是服务端）。
- 监控：擅长高并发的请求处理，做监控也是合适的选项。
- 鉴权：有一个中间层去鉴权，也是一种单一职责的实现。
- 路由：前端更需要掌握页面路由的权限和逻辑。
- 服务端渲染：node中间层的解决方案更灵活，比如SSR、模板直出、利用一些JS库做预渲染等等。

### 3）node转发API（node中间层）的优势

- 可以在中间层把java|php的数据，处理成对前端更友好的格式
- 可以解决前端的跨域问题，因为服务器端的请求是不涉及跨域的，跨域是浏览器的同源策略导致的
- 可以将多个请求在通过中间层合并，减少前端的请求

### 4）如何做请求合并转发

- 使用express中间件multifetch可以将请求批量合并
- 使用express+http-proxy-middleware实现接口代理转发

### 5）不使用用第三方模块手动实现一个nodejs代理服务器，实现请求合并转发

#### 实现思路

- 1. 搭建http服务器，使用Node的http模块的createServer方法
- 2. 接收客户端发送的请求，就是请求报文，请求报文中包括请求行、请求头、请求体
- 3. 将请求报文发送到目标服务器，使用http模块的request方法

#### 实现步骤

- 第一步：http服务器搭建

``` js
const http = require("http");
const server = http.createServer();
server.on('request',(req,res)=>{
  res.end("hello world")
})
server.listen(3000,()=>{
  console.log("running");
})
```

- 第二步：接收客户端发送到代理服务器的请求报文

``` js
const http = require("http");
const server = http.createServer();
server.on('request', (req, res)=>{
  // 通过req的data事件和end事件接收客户端发送的数据
  // 并用Buffer.concat处理一下
  //
  let postbody = [];
  req.on("data", chunk => {
    postbody.push(chunk);
  })
  req.on('end', () => {
    let postbodyBuffer = Buffer.concat(postbody);
    res.end(postbodyBuffer);
  })
})
server.listen(3000,()=>{
  console.log("running");
})
```

这一步主要数据在客户端到服务器端进行传输时在nodejs中需要用到buffer来处理一下。处理过程就是将所有接收的数据片段chunk塞到一个数组中，然后将其合并到一起还原出源数据。合并方法需要用到Buffer.concat，这里不能使用加号，加号会隐式的将buffer转化为字符串，这种转化不安全。

- 第三步：使用http模块的request方法，将请求报文发送到目标服务器

第二步已经得到了客户端上传的数据，但是缺少请求头，所以在这一步根据客户端发送的请求需要构造请求头，然后发送

``` js
const http = require("http");
const server = http.createServer();

server.on("request", (req, res) => {
  var { connection, host, ...originHeaders } = req.headers;
  var options = {
    "method": req.method,
    // 随表找了一个网站做测试，被代理网站修改这里
    "hostname": "www.nanjingmb.com",
    "port": "80",
    "path": req.url,
    "headers": { originHeaders }
  };
  //接收客户端发送的数据
  var p = new Promise((resolve,reject)=>{
      let postbody = [];
      req.on("data", chunk => {
        postbody.push(chunk);
      })
      req.on('end', () => {
        let postbodyBuffer = Buffer.concat(postbody);
        resolve(postbodyBuffer)；
      });
  });
  //将数据转发，并接收目标服务器返回的数据，然后转发给客户端
  p.then((postbodyBuffer)=>{
    let responsebody = [];
    var request = http.request(options, (response) => {
      response.on('data', (chunk) => {
        responsebody.push(chunk);
      });
      response.on("end", () => {
        responsebodyBuffer = Buffer.concat(responsebody)
        res.end(responsebodyBuffer);
      });
    });
    // 使用request的write方法传递请求体
    request.write(postbodyBuffer);
    // 使用end方法将请求发出去
    request.end();
  });
});
server.listen(3000, () => {
  console.log("runnng");
});
```

## 介绍下 promise 的特性、优缺点，内部是如何实现的，动手实现 Promise

### 1）Promise基本特性

1. Promise有三种状态：pending(进行中)、fulfilled(已成功)、rejected(已失败)
2. Promise对象接受一个回调函数作为参数, 该回调函数接受两个参数，分别是成功时的回调resolve和失败时的回调reject；另外resolve的参数除了正常值以外， 还可能是一个Promise对象的实例；reject的参数通常是一个Error对象的实例。
3. then方法返回一个新的Promise实例，并接收两个参数onResolved(fulfilled状态的回调)；onRejected(rejected状态的回调，该参数可选)
4. catch方法返回一个新的Promise实例
5. finally方法不管Promise状态如何都会执行，该方法的回调函数不接受任何参数
6. Promise.all()方法将多个多个Promise实例，包装成一个新的Promise实例，该方法接受一个由Promise对象组成的数组作为参数(Promise.all()方法的参数可以不是数组，但必须具有Iterator接口，且返回的每个成员都是Promise实例)，注意参数中只要有一个实例触发catch方法，都会触发Promise.all()方法返回的新的实例的catch方法，如果参数中的某个实例本身调用了catch方法，将不会触发Promise.all()方法返回的新实例的catch方法
7. Promise.race()方法的参数与Promise.all方法一样，参数中的实例只要有一个率先改变状态就会将该实例的状态传给Promise.race()方法，并将返回值作为Promise.race()方法产生的Promise实例的返回值
8. Promise.resolve()将现有对象转为Promise对象，如果该方法的参数为一个Promise对象，Promise.resolve()将不做任何处理；如果参数thenable对象(即具有then方法)，Promise.resolve()将该对象转为Promise对象并立即执行then方法；如果参数是一个原始值，或者是一个不具有then方法的对象，则Promise.resolve方法返回一个新的Promise对象，状态为fulfilled，其参数将会作为then方法中onResolved回调函数的参数，如果Promise.resolve方法不带参数，会直接返回一个fulfilled状态的 Promise 对象。需要注意的是，立即resolve()的 Promise 对象，是在本轮“事件循环”（event loop）的结束时执行，而不是在下一轮“事件循环”的开始时。
9. Promise.reject()同样返回一个新的Promise对象，状态为rejected，无论传入任何参数都将作为reject()的参数

### 2）Promise优点

- 统一异步 API
Promise 的一个重要优点是它将逐渐被用作浏览器的异步 API ，统一现在各种各样的 API ，以及不兼容的模式和手法。
- Promise 与事件对比
和事件相比较， Promise 更适合处理一次性的结果。在结果计算出来之前或之后注册回调函数都是可以的，都可以拿到正确的值。 Promise 的这个优点很自然。但是，不能使用 Promise 处理多次触发的事件。链式处理是 Promise 的又一优点，但是事件却不能这样链式处理。
- Promise 与回调对比
解决了回调地狱的问题，将异步操作以同步操作的流程表达出来。
- Promise 带来的额外好处是包含了更好的错误处理方式（包含了异常处理），并且写起来很轻松（因为可以重用一些同步的工具，比如 Array.prototype.map() ）。

### 3）Promise缺点

1. 无法取消Promise，一旦新建它就会立即执行，无法中途取消。
2. 如果不设置回调函数，Promise内部抛出的错误，不会反应到外部。
3. 当处于Pending状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成）。
4. Promise 真正执行回调的时候，定义 Promise 那部分实际上已经走完了，所以 Promise 的报错堆栈上下文不太友好。

### 4）简单代码实现

最简单的Promise实现有7个主要属性, state(状态), value(成功返回值), reason(错误信息), resolve方法, reject方法, then方法。

``` js
class Promise{
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    let resolve = value => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
      }
    };
    let reject = reason => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
      }
    };
    try {
      // 立即执行函数
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }
  then(onFulfilled, onRejected) {
    if (this.state === 'fulfilled') {
      let x = onFulfilled(this.value);
    };
    if (this.state === 'rejected') {
      let x = onRejected(this.reason);
    };
  }
}
```

### 5）面试够用版

``` js
function myPromise(constructor){ let self=this;
  self.status="pending" //定义状态改变前的初始状态
  self.value=undefined;//定义状态为resolved的时候的状态
  self.reason=undefined;//定义状态为rejected的时候的状态
  function resolve(value){
    //两个==="pending"，保证了了状态的改变是不不可逆的
    if(self.status==="pending"){
      self.value=value;
      self.status="resolved";
    }
  }
  function reject(reason){
     //两个==="pending"，保证了了状态的改变是不不可逆的
     if(self.status==="pending"){
        self.reason=reason;
        self.status="rejected";
      }
  }
  //捕获构造异常
  try{
    constructor(resolve,reject);
  } catch(e){
    reject(e);
  }
}
myPromise.prototype.then=function(onFullfilled,onRejected){
  let self=this;
  switch(self.status){
    case "resolved": onFullfilled(self.value); break;
    case "rejected": onRejected(self.reason); break;
    default:
  }
}

// 测试
var p=new myPromise(function(resolve,reject){resolve(1)});
p.then(function(x){console.log(x)})
//输出1
```

### 6）大厂专供版

``` js
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
const resolvePromise = (promise, x, resolve, reject) => {
  if (x === promise) {
    // If promise and x refer to the same object, reject promise with a TypeError as the reason.
    reject(new TypeError('循环引用'))
  }
  // if x is an object or function,
  if (x !== null && typeof x === 'object' || typeof x === 'function') {
    // If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
    let called
    try { // If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
      let then = x.then // Let then be x.then
      // If then is a function, call it with x as this
      if (typeof then === 'function') {
        // If/when resolvePromise is called with a value y, run [[Resolve]](promise, y)
        // If/when rejectPromise is called with a reason r, reject promise with r.
        then.call(x, y => {
          if (called) return
          called = true
          resolvePromise(promise, y, resolve, reject)
        }, r => {
          if (called) return
          called = true
          reject(r)
        })
      } else {
        // If then is not a function, fulfill promise with x.
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    // If x is not an object or function, fulfill promise with x
    resolve(x)
  }
}
function Promise(excutor) {
  let that = this; // 缓存当前promise实例例对象
  that.status = PENDING; // 初始状态
  that.value = undefined; // fulfilled状态时 返回的信息
  that.reason = undefined; // rejected状态时 拒绝的原因
  that.onFulfilledCallbacks = []; // 存储fulfilled状态对应的onFulfilled函数
  that.onRejectedCallbacks = []; // 存储rejected状态对应的onRejected函数
  function resolve(value) { // value成功态时接收的终值
    if(value instanceof Promise) {
      return value.then(resolve, reject);
    }
    // 实践中要确保 onFulfilled 和 onRejected ⽅方法异步执⾏行行，且应该在 then ⽅方法被调⽤用的那⼀一轮事件循环之后的新执⾏行行栈中执⾏行行。
    setTimeout(() => {
      // 调⽤用resolve 回调对应onFulfilled函数
      if (that.status === PENDING) {
        // 只能由pending状态 => fulfilled状态 (避免调⽤用多次resolve reject)
        that.status = FULFILLED;
        that.value = value;
        that.onFulfilledCallbacks.forEach(cb => cb(that.value));
      }
    });
  }
  function reject(reason) { // reason失败态时接收的拒因
    setTimeout(() => {
      // 调⽤用reject 回调对应onRejected函数
      if (that.status === PENDING) {
        // 只能由pending状态 => rejected状态 (避免调⽤用多次resolve reject)
        that.status = REJECTED;
        that.reason = reason;
        that.onRejectedCallbacks.forEach(cb => cb(that.reason));
      }
    });
  }

  // 捕获在excutor执⾏行行器器中抛出的异常
  // new Promise((resolve, reject) => {
  //     throw new Error('error in excutor')
  // })
  try {
    excutor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}
Promise.prototype.then = function(onFulfilled, onRejected) {
  const that = this;
  let newPromise;
  // 处理理参数默认值 保证参数后续能够继续执⾏行行
  onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
  onRejected = typeof onRejected === "function" ? onRejected : reason => {
    throw reason;
  };
  if (that.status === FULFILLED) { // 成功态
    return newPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        try{
          let x = onFulfilled(that.value);
          resolvePromise(newPromise, x, resolve, reject); //新的promise resolve 上⼀一个onFulfilled的返回值
        } catch(e) {
          reject(e); // 捕获前⾯面onFulfilled中抛出的异常then(onFulfilled, onRejected);
        }
      });
    })
  }
  if (that.status === REJECTED) { // 失败态
    return newPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          let x = onRejected(that.reason);
          resolvePromise(newPromise, x, resolve, reject);
        } catch(e) {
          reject(e);
        }
      });
    });
  }
  if (that.status === PENDING) { // 等待态
// 当异步调⽤用resolve/rejected时 将onFulfilled/onRejected收集暂存到集合中
    return newPromise = new Promise((resolve, reject) => {
      that.onFulfilledCallbacks.push((value) => {
        try {
          let x = onFulfilled(value);
          resolvePromise(newPromise, x, resolve, reject);
        } catch(e) {
          reject(e);
        }
      });
      that.onRejectedCallbacks.push((reason) => {
        try {
          let x = onRejected(reason);
          resolvePromise(newPromise, x, resolve, reject);
        } catch(e) {
          reject(e);
        }
      });
    });
  }
};
```

### 7）闭包版

``` js
/**
 * 抽象表达
 * Promise是 js 进行异步编辑的新的解决方案（旧的方式：纯回调的形式）
 * 具体表达
 * 1 从语法上来说Promise 是一个构造函数
 * 2 从功能上来说promise 对象用来封装一个异步操作并可以获取其结果
 * 状态改变
 * pending 变为 resolved
 * pending rejected
 * 一个promise 对象只能改变一次
 * 无论变为成功还是失败，都会有一个结果数据
 * 成功的结果数据一般称为value 失败的结果数据一般称为reason
 * 为什么要使用promise
 *
 * 1 指定的回调函数的方式更加灵活
 * 旧：必须要启动异步任务前指定
 * promise 启动异步任务=>返回 promise对象=>给promise对象
 * 绑定回调函数（甚至可以在异步结束后指定/多个）
 *
 * 2 promise 支持链式调用。可以解决回调地狱问题
 * 什么是回调地狱 回调函数嵌套调用，外部回调函异步执行的结果是嵌套的
 * 回调函数执行条件
 * 回调地狱的缺点？不便于阅读/不便于异常处理
 * 解决方案 promise 链式调用
 * 错误回调:异常传透
 * then 是原型对象方法
 * new Promise 是实例对象方法
 * Promise.all promise函数对象方法
 *
* */
(function (window) {
  /**
   * Promise 构造函数
   * excutor 执行器函数 同步执行
   * */
  const PENDING='pending'
  const RESOLVED='resolved'
  const REJECTED='rejected'
  function Promise(excutor) {
      const self = this
      self.status = 'pending'// 给promise 对象指定status 属性，初始值为pending
      self.data = undefined// 给promise 对象指定一个用一存储结果数据的属性
      self.callbacks=[]// 每个元素的结构{onResolve(){},onRejected(){}}
      // 立即同步执行excutor
      function resolve(value) {
          if(self.status !==PENDING) return
          //将状态改为resolve
          self.status= RESOLVED
          //保存value数据
          self.data = value
          //如果有待执行callback函数,立即异步执行回调 onResolved
          if(self.callbacks.length>0){
              setTimeout(()=>{//放入队列中执行所有成功的回调
                  self.callbacks.forEach((callbacksObj)=>{
                      callbacksObj.onResolved(value)
                  })
              })
          }
      }
      function reject(reason) {
          if(self.status !==PENDING) return
          //将状态改为rejected
          self.status= REJECTED
          //保存value数据
          self.data = reason
          //如果有待执行callback函数,立即异步执行回调onRejected
          if(self.callbacks.length>0){
              setTimeout(()=>{//放入队列中执行所有成功的回调
                  self.callbacks.forEach((callbacksObj)=>{
                      callbacksObj.onRejected(reason)
                  })
              })
          }
      }
      try{
          excutor(resolve,reject)
      }catch (error) {// 如果执行器抛出异常将失败
         reject(error)
      }

  }

  /**
   *  Promise原型对象then方法
   *  成功或失败的回调函数
   *  返回一个新的promise对象
   * */
  Promise.prototype.then = function (onResolved, onRejected) {
      const self = this
      // 返回一个新地promise对象
      return new Promise((resolve,reject)=>{
          if(self.status===PENDING){
              this.callbacks.push({
                  onResolved,
                  onRejected
              })
          }else if(self.status === RESOLVED){
              setTimeout(()=>{
                  /**
                   * 结果异常 return 的promise 就会失败 reason 就是error
                   * 执行返回非 promise
                   * */
                  try{
                      const result =  onResolved(self.data)
                      if(result instanceof Promise){
                          result.then(
                              value=> resolve(value),
                              reason=> reject(reason)
                          )
                      }else{
                          resolve(result)
                      }
                  }catch (error) {
                      reject(error)
                  }

              })
          }else{
              // rejected
              setTimeout(()=>{
                  onRejected(self.data)
              })
          }
      })

  }
  //向外暴露promise函数
  window.Promise = Promise
})(window)
```

## 实现 Promise.all

### 1）核心思路

1. 接收一个 Promise 实例的数组或具有 Iterator 接口的对象作为参数
2. 这个方法返回一个新的 promise 对象，
3. 遍历传入的参数，用Promise.resolve()将参数"包一层"，使其变成一个promise对象
4. 参数所有回调成功才是成功，返回值数组与参数顺序一致
5. 参数数组其中一个失败，则触发失败状态，第一个触发失败的 Promise 错误信息作为 Promise.all 的错误信息。

### 2）实现代码

一般来说，Promise.all 用来处理多个并发请求，也是为了页面数据构造的方便，将一个页面所用到的在不同接口的数据一起请求过来，不过，如果其中一个接口失败了，多个请求也就失败了，页面可能啥也出不来，这就看当前页面的耦合程度了～

``` js
function promiseAll(promises) {
  return new Promise(function(resolve, reject) {
    if (!Array.isArray(promises)) {
        throw new TypeError(`argument must be a array`);
    }
    var resolvedCounter = 0;
    var promiseNum = promises.length;
    var resolvedResult = [];
    for (let i = 0; i < promiseNum; i++) {
      Promise.resolve(promises[i]).then(value=>{
        resolvedCounter++;
        resolvedResult[i] = value;
        if (resolvedCounter === promiseNum) {
          return resolve(resolvedResult);
        }
      }, error=>{
        return reject(error);
      });
    }
  });
}

// test
let p1 = new Promise(function (resolve, reject) {
  setTimeout(function () {
    resolve(1);
  }, 1000);
})
let p2 = new Promise(function (resolve, reject) {
  setTimeout(function () {
    resolve(2);
  }, 2000);
})
let p3 = new Promise(function (resolve, reject) {
  setTimeout(function () {
    resolve(3);
  }, 3000);
})
promiseAll([p3, p1, p2]).then(res => {
  console.log(res); // [3, 1, 2]
});
```

## React 组件通信方式

react组件间通信常见的几种情况:

1. 父组件向子组件通信
2. 子组件向父组件通信
3. 跨级组件通信
4. 非嵌套关系的组件通信

### 1）父组件向子组件通信

父组件通过 props 向子组件传递需要的信息。

``` jsx
// 子组件: Child
const Child = props =>{
  return <p>{props.name}</p>
}

// 父组件 Parent
const Parent = ()=>{
  return <Child name="京程一灯"></Child>
}
```

### 2）子组件向父组件通信

props+回调的方式。

``` jsx
// 子组件: Child
const Child = props =>{
  const cb = msg =>{
    return () => {
      props.callback(msg);
    }
  }
  return (
    <button onClick={cb("京程一灯欢迎你!")}>京程一灯欢迎你</button>
  );
}

// 父组件 Parent
class Parent extends Component {
  callback(msg) {
    console.log(msg);
  }
  render() {
    return (<Child callback={this.callback.bind(this)}></Child>);
  }
}
```

### 3）跨级组件通信

即父组件向子组件的子组件通信，向更深层子组件通信。

- 使用props，利用中间组件层层传递,但是如果父组件结构较深，那么中间每一层组件都要去传递props，增加了复杂度，并且这些props并不是中间组件自己需要的。
- 使用context，context相当于一个大容器，我们可以把要通信的内容放在这个容器中，这样不管嵌套多深，都可以随意取用，对于跨越多层的全局数据可以使用context实现。

``` jsx
// context方式实现跨级组件通信
// Context 设计目的是为了共享那些对于一个组件树而言是“全局”的数据

const BatteryContext = createContext();

//  子组件的子组件
class GrandChild extends Component {
  render(){
    return (
      <BatteryContext.Consumer>
        {
          color => <h1 style={{"color":color}}>我是红色的:{color}</h1>
        }
      </BatteryContext.Consumer>
    );
  }
}

//  子组件
const Child = () =>{
  return (
    <GrandChild/>
  );
}

// 父组件
class Parent extends Component {
  state = {
    color: "red"
  }

  render() {
    const { color } = this.state;
    return (
      <BatteryContext.Provider value={color}>
        <Child></Child>
      </BatteryContext.Provider>
    );
  }
}
```

### 4）非嵌套关系的组件通信

即没有任何包含关系的组件，包括兄弟组件以及不在同一个父级中的非兄弟组件。

1. 可以使用自定义事件通信（发布订阅模式）
2. 可以通过redux等进行全局状态管理
3. 如果是兄弟组件通信，可以找到这两个兄弟节点共同的父节点, 结合父子间通信方式进行通信。

## redux-saga 和 mobx 的比较

### 1）状态管理

- redux-sage 是 redux 的一个异步处理的中间件。
- mobx 是数据管理库，和 redux 一样。

### 2）设计思想

- redux-sage 属于 flux 体系， 函数式编程思想。
- mobx 不属于 flux 体系，面向对象编程和响应式编程。

### 3）主要特点

- redux-sage 因为是中间件，更关注异步处理的，通过 Generator 函数来将异步变为同步，使代码可读性高，结构清晰。action 也不是 action creator 而是 pure action，
- 在 Generator 函数中通过 call 或者 put 方法直接声明式调用，并自带一些方法，如 takeEvery，takeLast，race等，控制多个异步操作，让多个异步更简单。
- mobx 是更简单更方便更灵活的处理数据。 Store 是包含了 state 和 action。state 包装成一个可被观察的对象， action 可以直接修改 state，之后通过 Computed values 将依赖 state 的计算属性更新 ，之后触发 Reactions 响应依赖 state 的变更，输出相应的副作用 ，但不生成新的 state。

### 4）数据可变性

- redux-sage 强调 state 不可变，不能直接操作 state，通过 action 和 reducer 在原来的 state 的基础上返回一个新的 state 达到改变 state 的目的。
- mobx 直接在方法中更改 state，同时所有使用的 state 都发生变化，不生成新的 state。

### 5）写法难易度

- redux-sage 比 redux 在 action 和 reducer 上要简单一些。需要用 dispatch 触发 state 的改变，需要 mapStateToProps 订阅 state。
- mobx 在非严格模式下不用 action 和 reducer，在严格模式下需要在 action 中修改 state，并且自动触发相关依赖的更新。

### 6）使用场景

- redux-sage 很好的解决了 redux 关于异步处理时的复杂度和代码冗余的问题，数据流向比较好追踪。但是 redux 的学习成本比 较高，代码比较冗余，不是特别需要状态管理，最好用别的方式代替。
- mobx 学习成本低，能快速上手，代码比较简洁。但是可能因为代码编写的原因和数据更新时相对黑盒，导致数据流向不利于追踪。

## 说一下 react-fiber

### 1）背景

- react在进行组件渲染时，从setState开始到渲染完成整个过程是同步的（“一气呵成”）。如果需要渲染的组件比较庞大，js执行会占据主线程时间较长，会导致页面响应度变差，使得react在动画、手势等应用中效果比较差。
- 页面卡顿：Stack reconciler的工作流程很像函数的调用过程。父组件里调子组件，可以类比为函数的递归；对于特别庞大的vDOM树来说，reconciliation过程会很长(x00ms)，超过16ms,在这期间，主线程是被js占用的，因此任何交互、布局、渲染都会停止，给用户的感觉就是页面被卡住了。

### 2）实现原理

旧版 React 通过递归的方式进行渲染，使用的是 JS 引擎自身的函数调用栈，它会一直执行到栈空为止。而Fiber实现了自己的组件调用栈，它以链表的形式遍历组件树，可以灵活的暂停、继续和丢弃执行的任务。实现方式是使用了浏览器的requestIdleCallback这一 API。

Fiber 其实指的是一种数据结构，它可以用一个纯 JS 对象来表示：

``` js
const fiber = {
  stateNode,    // 节点实例
  child,        // 子节点
  sibling,      // 兄弟节点
  return,       // 父节点
}
```

- react内部运转分三层：
  - Virtual DOM 层，描述页面长什么样。
  - Reconciler 层，负责调用组件生命周期方法，进行 Diff 运算等。
  - Renderer 层，根据不同的平台，渲染出相应的页面，比较常见的是 ReactDOM 和 ReactNative。

- 为了实现不卡顿，就需要有一个调度器 (Scheduler) 来进行任务分配。优先级高的任务（如键盘输入）可以打断优先级低的任务（如Diff）的执行，从而更快的生效。任务的优先级有六种：
  - synchronous，与之前的Stack Reconciler操作一样，同步执行
  - task，在next tick之前执行
  - animation，下一帧之前执行
  - high，在不久的将来立即执行
  - low，稍微延迟执行也没关系
  - offscreen，下一次render时或scroll时才执行

- Fiber Reconciler（react ）执行阶段：
  - 阶段一，生成 Fiber 树，得出需要更新的节点信息。这一步是一个渐进的过程，可以被打断。
  - 阶段二，将需要更新的节点一次过批量更新，这个过程不能被打断。

- Fiber树：React 在 render 第一次渲染时，会通过 React.createElement 创建一颗 Element 树，可以称之为 Virtual DOM Tree，由于要记录上下文信息，加入了 Fiber，每一个 Element 会对应一个 Fiber Node，将 Fiber Node 链接起来的结构成为 Fiber Tree。Fiber Tree 一个重要的特点是链表结构，将递归遍历编程循环遍历，然后配合 requestIdleCallback API, 实现任务拆分、中断与恢复。

- 从Stack Reconciler到Fiber Reconciler，源码层面其实就是干了一件递归改循环的事情

## 手写发布订阅

``` js
// 发布订阅中心, on-订阅, off取消订阅, emit发布, 内部需要一个单独事件中心caches进行存储;

interface CacheProps {
  [key: string]: Array<((data?: unknown) => void)>;
}

class Observer {

  private caches: CacheProps = {}; // 事件中心

  on (eventName: string, fn: (data?: unknown) => void){ // eventName事件名-独一无二, fn订阅后执行的自定义行为
    this.caches[eventName] = this.caches[eventName] || [];
    this.caches[eventName].push(fn);
  }

  emit (eventName: string, data?: unknown) { // 发布 => 将订阅的事件进行统一执行
    if (this.caches[eventName]) {
      this.caches[eventName].forEach((fn: (data?: unknown) => void) => fn(data));
    }
  }

  off (eventName: string, fn?: (data?: unknown) => void) { // 取消订阅 => 若fn不传, 直接取消该事件所有订阅信息
    if (this.caches[eventName]) {
      const newCaches = fn ? this.caches[eventName].filter(e => e !== fn) : [];
      this.caches[eventName] = newCaches;
    }
  }

}
```

``` js
class EventListener {
  listeners = {};
  on(name, fn) {
    (this.listeners[name] || (this.listeners[name] = [])).push(fn);
  }
  once(name, fn) {
    let tem = (...args) => {
      this.removeListener(name, fn);
      fn(...args);
    }
    fn.fn = tem;
    this.on(name, tem);
  }
  removeListener(name, fn) {
    if (this.listeners[name]) {
      this.listeners[name] = this.listeners[name].filter(listener => (listener != fn && listener != fn.fn));
    }
  }
  removeAllListeners(name) {
    if (name && this.listeners[name]) {
      delete this.listeners[name];
    }
    this.listeners = {};
  }
  emit(name, ...args) {
    if (this.listeners[name]) {
      this.listeners[name].forEach(fn => fn.call(this, ...args));
    }
  }
}
```

## 手写数组转树

``` js
let input = [
  {
    id: 1,
    val: "学校",
    parentId: null,
  },
  {
    id: 2,
    val: "班级1",
    parentId: 1,
  },
  {
    id: 3,
    val: "班级2",
    parentId: 1,
  },
  {
    id: 4,
    val: "学生1",
    parentId: 2,
  },
  {
    id: 5,
    val: "学生2",
    parentId: 3,
  },
  {
    id: 6,
    val: "学生3",
    parentId: 3,
  },
];

function buildTree(arr, parentId, childrenArray) {
  arr.forEach((item) => {
    if (item.parentId === parentId) {
      item.children = [];
      buildTree(arr, item.id, item.children);
      childrenArray.push(item);
    }
  });
}

function arrayToTree(input, parentId) {
  const array = [];
  buildTree(input, parentId, array);
  return array.length > 0 ? (array.length > 1 ? array : array[0]) : {};
}
const obj = arrayToTree(input, null);
console.log(obj);
```

数组转树的其中一种，排序数组转二叉搜索树

``` js
/**
 * function TreeNode(val) {
 *     this.val = val;
 *     this.left = null;
 *     this.right = null;
 * }
 */

var sortedArrayToBST = function (nums) {
  if (!nums.length) {
    return null
  };
  const root = new TreeNode(null);

  if (nums.length > 1) {
    root.left = sortedArrayToBST(nums.splice(0, nums.length / 2))
  };
  root.val = nums[0];
  root.right = sortedArrayToBST(nums.splice(1));
  return root;
};
```

## 使用ES6 的Proxy实现数组负索引。 （负索引：例如，可以简单地使用arr[-1]替代arr[arr.length-1]访问最后一个元素，[-2]访问倒数第二个元素，以此类推）

``` js
const negativeArray = els =>
  new Proxy(els, {
    get: (target, propKey, receiver) =>
      Reflect.get(target, +propKey < 0 ? String(target.length + +propKey) : propKey, receiver)
  });
const unicorn = negativeArray(["京", "程", "一", "灯"]);
unicorn[-1];
```

``` js
// 30.手写用 ES6proxy 如何实现 arr[-1] 的访问
function PythonArray(arr) {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      if ((key = Number.parseInt(prop))) {
        const len = Reflect.get(target, 'length', receiver);
        prop = key < 0 && Math.abs(key) <= len ? len + key : prop;
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if ((key = Number.parseInt(prop))) {
        const len = Reflect.get(target, 'length', receiver);
        prop = key < 0 && Math.abs(key) <= len ? len + key : prop;
      }
      return Reflect.set(target, prop, value, receiver);
    },
    deleteProperty(target, prop) {
      if ((key = Number.parseInt(prop))) {
        const len = target.length;
        prop = key < 0 && Math.abs(key) <= len ? len + key : prop;
      }
      return Reflect.deleteProperty(target, prop);
    },
  });
}
```

## 请写出下面代码执行的的结果

``` js
console.log(1);
setTimeout(() => {
  console.log(2);
  process.nextTick(() => {
    console.log(3);
  });
  new Promise((resolve) => {
    console.log(4);
    resolve();
  }).then(() => {
    console.log(5);
  });
});

new Promise((resolve) => {
  console.log(7);
  resolve();
}).then(() => {
  console.log(8);
});

// nextTick中的微任务比promise.then中的微任务先执行
process.nextTick(() => {
  console.log(6);
});

setTimeout(() => {
  console.log(9);
  process.nextTick(() => {
    console.log(10);
  });
  new Promise((resolve) => {
    console.log(11);
    resolve();
  }).then(() => {
    console.log(12);
  });
});
```

### 结果

``` js
// node版本小于11时：
// 1 7 6 8 2 4 9 11 3 10 5 12

// node版本大于等于11时：
// 1 7 6 8 2 4 3 5 9 11 10 12
```

### 解析

- 宏任务和微任务
  - 宏任务：macrotask,包括setTimeout、setInerVal、setImmediate(node独有)、requestAnimationFrame(浏览器独有)、I/O、UI rendering(浏览器独有)
  - 微任务：microtask,包括process.nextTick(Node独有)、Promise.then()、Object.observe、MutationObserver

- Promise构造函数中的代码是同步执行的，new Promise()构造函数中的代码是同步代码，并不是微任务

- Node.js中的EventLoop执行宏队列的回调任务有**6个阶段**
  - 1. timers阶段：这个阶段执行setTimeout和setInterval预定的callback
  - 2. I/O callback阶段：执行除了close事件的callbacks、被timers设定的callbacks、setImmediate()设定的callbacks这些之外的callbacks
  - 3. idle, prepare阶段：仅node内部使用
  - 4. poll阶段：获取新的I/O事件，适当的条件下node将阻塞在这里
  - 5. check阶段：执行setImmediate()设定的callbacks
  - 6. close callbacks阶段：执行socket.on('close', ....)这些callbacks

- NodeJs中宏队列主要有4个
  - 1. Timers Queue
  - 2. IO Callbacks Queue
  - 3. Check Queue
  - 4. Close Callbacks Queue
  - 这4个都属于宏队列，但是在浏览器中，可以认为只有一个宏队列，所有的macrotask都会被加到这一个宏队列中，但是在NodeJS中，不同的macrotask会被放置在不同的宏队列中。

- NodeJS中微队列主要有2个
  - 1. Next Tick Queue：是放置process.nextTick(callback)的回调任务的
  - 2. Other Micro Queue：放置其他microtask，比如Promise等
  - 在浏览器中，也可以认为只有一个微队列，所有的microtask都会被加到这一个微队列中，但是在NodeJS中，不同的microtask会被放置在不同的微队列中。

- Node.js中的EventLoop过程
  - 1. 执行全局Script的同步代码
  - 2. 执行microtask微任务，先执行所有Next Tick Queue中的所有任务，再执行Other Microtask Queue中的所有任务
  - 3. 开始执行macrotask宏任务，共6个阶段，从第1个阶段开始执行相应每一个阶段macrotask中的所有任务，注意，这里是所有每个阶段宏任务队列的所有任务，在浏览器的Event Loop中是只取宏队列的第一个任务出来执行，每一个阶段的macrotask任务执行完毕后，开始执行微任务，也就是步骤2
  - 4. Timers Queue -> 步骤2 -> I/O Queue -> 步骤2 -> Check Queue -> 步骤2 -> Close Callback Queue -> 步骤2 -> Timers Queue ......
  - 5. 这就是Node的Event Loop

- Node 11.x新变化
  - 现在node11在timer阶段的setTimeout,setInterval...和在check阶段的immediate都在node11里面都修改为一旦执行一个阶段里的一个任务就立刻执行微任务队列。为了和浏览器更加趋同。

## 写出执行结果，并解释原因

``` js
function side(arr) {
  arr[0] = arr[2];
  console.log(arr); // [1, 1, 1, callee: ƒ, Symbol(Symbol.iterator): ƒ]
}
function a(a, b, c = 3) {
  c = 10;
  side(arguments);
  console.log(a, b, c); // 1, 1, 10
  return a + b + c;
}
a(1, 1, 1);
// 写出执行结果，并解释原因
```

### 答案

12

### 解析

arguments 中 c 的值还是 1 不会变成 10，
因为 a 函数加了默认值，就按 ES 的方式解析，ES6 是有块级作用域的，所以 c 的值是不会改变的

``` js
function side(arr) {
  arr[0] = arr[2];
  console.log(arr); // [10, 1, 10, callee: ƒ, Symbol(Symbol.iterator): ƒ]
}
function a(a, b, c) {
  c = 10;
  side(arguments);
  console.log(a, b, c); // 10, 1, 10
  return a + b + c;
}
a(1, 1, 1);
// 写出执行结果，并解释原因
// 21
```

### 答案

21

## 写出执行结果，并解释原因

``` js
var min = Math.min();
max = Math.max();
console.log(min < max);
// 写出执行结果，并解释原因
```

### 答案

false

### 解析

- 按常规的思路，这段代码应该输出 true，毕竟最小值小于最大值。但是却输出 false
- MDN 相关文档是这样解释的
  - Math.min 的参数是 0 个或者多个，如果多个参数很容易理解，返回参数中最小的。如果没有参数，则返回 Infinity，无穷大。
  - Math.max 没有传递参数时返回的是-Infinity.所以输出 false

## 写出执行结果,并解释原因

``` js
var a = 1;
(function a () {
  a = 2;
  console.log(a);
})();
// 写出执行结果，并解释原因
```

### 答案

ƒ a () {
    a = 2;
    console.log(a);
}

### 解析

立即调用的函数表达式（IIFE） 有一个 自己独立的 作用域，如果函数名称与内部变量名称冲突，就会永远执行函数本身；所以上面的结果输出是函数本身；

## 写出执行结果,并解释原因

``` js
var a = [0];
if (a) {
  console.log(a == true);
} else {
  console.log(a);
}
// 写出执行结果，并解释原因
```

### 答案

false

### 解析

- 1）当 a 出现在 if 的条件中时，被转成布尔值，而 Boolean([0])为 true,所以就进行下一步判断 a == true,在进行比较时，[0]被转换成了 0，所以 0==true 为 false

- 数组从非 primitive 转为 primitive 的时候会先隐式调用 join 变成“0”，string 和 boolean 比较的时候，两个都先转为 number 类型再比较，最后就是 0==1 的比较了

``` js
var a = [1];
if (a) {
  console.log(a == true);
} else {
  console.log(a);
}
// true
```

``` js
!![] //true 空数组转换为布尔值是 true,
!![0]//true 数组转换为布尔值是 true
[0] == true;//false 数组与布尔值比较时却变成了 false
Number([])//0
Number(false)//0
Number(['1'])//1
```

- 2）所以当 a 出现在 if 的条件中时，被转成布尔值，而 Boolean([0])为 true,所以就进行下一步判断 a == true,在进行比较时，js 的规则是：
  - 1. 如果比较的是原始类型的值，原始类型的值会转成数值再进行比较
    ``` js
    1 == true  //true   1 === Number(true)
    'true' == true //false Number('true')->NaN  Number(true)->1
    '' = 0//true
    '1' == true//true  Number('1')->1
    ```

  - 2. 对象与原始类型值比较，对象会转换成原始类型的值再进行比较。
  - 3. undefined和null与其它类型进行比较时，结果都为false，他们相互比较时结果为true。

## 写出执行结果,并解释原因

``` js
(function () {
  var a = (b = 5);
})();
console.log(b);
console.log(a);
// 写出执行结果，并解释原因
```

### 答案

5 Error, a is not defined

### 解析

在这个立即执行函数表达式（IIFE）中包括两个赋值操作，其中a使用var关键字进行声明，因此其属于函数内部的局部变量（仅存在于函数中），相反，b被分配到全局命名空间。
另一个需要注意的是，这里没有在函数内部使用严格模式(use strict;)。如果启用了严格模式，代码会在输出 b 时报错Uncaught ReferenceError: b is not defined,需要记住的是，严格模式要求你显式的引用全局作用域。因此，你需要写成：

``` js
(function () {
  "use strict";
  var a = (window.b = 5);
})();
console.log(b);
```

再看一个

``` js
(function() {
   'use strict';
   var a = b = 5;
})();

console.log(b);  //Uncaught ReferenceError: b is not defined

/*---------------------------*/

(function() {
   'use strict';
   var a = window.b = 5;
})();

console.log(b);  // 5
```

## 写出执行结果,并解释原因

``` js
var fullname = 'a';
var obj = {
   fullname: 'b',
   prop: {
      fullname: 'c',
      getFullname: function() {
         return this.fullname;
      }
   }
};

console.log(obj.prop.getFullname()); // c
var test = obj.prop.getFullname;
console.log(test());  // a
```

### 答案

c a

### 解析

- 原因在于`this`指向的是函数的执行环境，`this`取决于其被谁调用了，而不是被谁定义了。
- 对第一个`console.log()`语句而言，`getFullName()`是作为obj.prop对象的一个方法被调用的，因此此时的执行环境应该是这个对象。另一方面，但`getFullName()`被分配给`test`变量时，此时的执行环境变成全局对象（`window`），原因是`test`是在全局作用域中定义的。因此，此时的`this`指向的是全局作用域的`fullname`变量，即a。

## 写出执行结果,并解释原因

``` js
var company = {
    address: 'beijing'
}
var yideng = Object.create(company);
delete yideng.address
console.log(yideng.address);
// 写出执行结果，并解释原因
```

### 答案

beijing

### 解析

这里的 yideng 通过 prototype 继承了 company的 address。yideng自己并没有address属性。所以delete操作符的作用是无效的。

### 知识点
- 1. delete使用原则：delete 操作符用来删除一个对象的属性。
- 2. delete在删除一个不可配置的属性时在严格模式和非严格模式下的区别:
  - （1）在严格模式中，如果属性是一个不可配置（non-configurable）属性，删除时会抛出异常;
  - （2）非严格模式下返回 false。
- 3. delete能删除隐式声明的全局变量：这个全局变量其实是global对象(window)的属性
- 4. delete能删除的：
  - （1）可配置对象的属性
  - （2）隐式声明的全局变量
  - （3）用户定义的属性
  - （4）在ECMAScript 6中，通过 const 或 let 声明指定的 "temporal dead zone" (TDZ) 对 delete 操作符也会起作用
- 5. delete不能删除的：
  - （1）显式声明的全局变量
  - （2）内置对象的内置属性
  - （3）一个对象从原型继承而来的属性
- 6. delete删除数组元素：
  - （1）当你删除一个数组元素时，数组的 length 属性并不会变小，数组元素变成undefined
  - （2）当用 delete 操作符删除一个数组元素时，被删除的元素已经完全不属于该数组。
  - （3）如果你想让一个数组元素的值变为 undefined 而不是删除它，可以使用 undefined 给其赋值而不是使用 delete 操作符。此时数组元素是在数组中的
- 7. delete 操作符与直接释放内存（只能通过解除引用来间接释放）没有关系。

- 8. 其它例子

（1）下面代码输出什么？

``` js
var output = (function(x){
  delete x;
  return x;
})(0);
console.log(output);
```

答案：0，`delete` 操作符是将object的属性删去的操作。但是这里的 `x` 是并不是对象的属性， `delete` 操作符并不能作用。

（2）下面代码输出什么？

``` js
var x = 1;
var output = (function(){
    delete x;
    return x;
})();
console.log(output);
```

答案：输出是 1。`delete` 操作符是将object的属性删去的操作。但是这里的 x 是并不是对象的属性， `delete` 操作符并不能作用。

（3）下面代码输出什么?

``` js
x = 1;
var output = (function(){
    delete x;
    return x;
})();
console.log(output);
```

答案：报错 VM548:1 Uncaught ReferenceError: x is not defined,

（4）下面代码输出什么？

``` js
var x = { foo : 1};
var output = (function(){
    delete x.foo;
    return x.foo;
})();
console.log(output);
```

答案：输出是 undefined。x虽然是全局变量，但是它是一个object。delete作用在x.foo上，成功的将x.foo删去。所以返回undefined

## 写出执行结果,并解释原因

``` js
var foo = function bar(){ return 12; };
console.log(typeof bar());
// 写出执行结果，并解释原因
```

### 答案

输出是抛出异常，bar is not defined。

### 解析

这种命名函数表达式函数只能在函数体内有效

``` js
var foo = function bar(){
    // foo is visible here
    // bar is visible here
    console.log(typeof bar()); // Work here :)
};
// foo is visible here
// bar is undefined here
```

## 写出执行结果,并解释原因

``` js
var x=1;
if(function f(){}){
    x += typeof f;
}
console.log(x)
// 写出执行结果，并解释原因
```

### 答案

1 undefined

### 解析

条件判断为假的情况有：0，false，''，null，undefined，未定义对象。函数声明写在运算符中，其为true，但放在运算符中的函数声明在执行阶段是找不到的。另外，对未声明的变量执行typeOf不会报错，会返回undefined

## 写出执行结果,并解释原因

``` js
function f(){
  return f;
}
console.log(new f() instanceof f);
// 写出执行结果，并解释原因
```

### 答案

false

### 解析

a instanceof b 用于检测a是不是b的实例。如果题目f中没有return f,则答案明显为true;而在本题中new f()其返回的结果为f的函数对象，其并不是f的一个实例。

``` js
function f(){}
console.log(new f() instanceof f);
// 答案：true
```

## 写出执行结果,并解释原因

``` js
var foo = {
  bar: function(){
    return this.baz;
  },
  baz:1
}
console.log(typeof (f=foo.bar)());
//写出执行结果，并解释原因
```

### 答案

undefined

## AMD和CMD规范区别

- AMD规范：是 RequireJS在推广过程中对模块定义的规范化产出的
- CMD规范：是SeaJS 在推广过程中对模块定义的规范化产出的
- CMD 推崇依赖就近；AMD 推崇依赖前置
- CMD 是延迟执行；AMD 是提前执行
- CMD性能好，因为只有用户需要的时候才执行；AMD用户体验好，因为没有延迟，依赖模块提前执行了

## SPA单页页面

SPA（ single-page application ）仅在 Web 页面初始化时加载相应的 HTML、JavaScript 和 CSS。一旦页面加载完成，SPA 不会因为用户的操作而进行页面的重新加载或跳转；取而代之的是利用路由机制实现 HTML 内容的变换，UI 与用户的交互，避免页面的重新加载。

### SPA优点

- 用户体验好、快，内容的改变不需要重新加载整个页面，避免了不必要的跳转和重复渲染；
- 基于上面一点，SPA 相对对服务器压力小；
- 前后端职责分离，架构清晰，前端进行交互逻辑，后端负责数据处理；

### SPA缺点

- 初次加载耗时多：为实现单页 Web 应用功能及显示效果，需要在加载页面的时候将 JavaScript、CSS 统一加载，部分页面按需加载；
- 前进后退路由管理：由于单页应用在一个页面中显示所有的内容，所以不能使用浏览器的前进后退功能，所有的页面切换需要自己建立堆栈管理；
- SEO 难度较大：由于所有的内容都在一个页面中动态替换显示，所以在 SEO 上其有着天然的弱势。

## Vue.js虚拟DOM的优缺点

### 1）优点

- **保证性能下限**： 框架的虚拟 DOM 需要适配任何上层 API 可能产生的操作，它的一些 DOM 操作的实现必须是普适的，所以它的性能并不是最优的；但是比起粗暴的 DOM 操作性能要好很多，因此框架的虚拟 DOM 至少可以保证在你不需要手动优化的情况下，依然可以提供还不错的性能，即保证性能的下限；
- **无需手动操作 DOM**： 我们不再需要手动去操作 DOM，只需要写好 View-Model 的代码逻辑，框架会根据虚拟 DOM 和 数据双向绑定，帮我们以可预期的方式更新视图，极大提高我们的开发效率；

- **跨平台**： 虚拟 DOM 本质上是 JavaScript 对象,而 DOM 与平台强相关，相比之下虚拟 DOM 可以进行更方便地跨平台操作，例如服务器渲染、weex 开发等等。

### 2）缺点

- **无法进行极致优化**： 虽然虚拟 DOM + 合理的优化，足以应对绝大部分应用的性能需求，但在一些性能要求极高的应用中虚拟 DOM 无法进行针对性的极致优化。比如VScode采用直接手动操作DOM的方式进行极端的性能优化

## 写出执行结果,并解释原因

``` js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}
```

### 答案

0 1 2

### 解析

使用`let`关键字声明变量`i`：使用`let`（和`const`）关键字声明的变量是具有块作用域的（块是`{}`之间的任何东西）。 在每次迭代期间，`i`将被创建为一个新值，并且每个值都会存在于循环内的块级作用域。

``` js
// 下面代码输出什么
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}
```

答案：3 3 3，由于JavaScript中的事件执行机制，setTimeout函数真正被执行时，循环已经走完。 由于第一个循环中的变量i是使用var关键字声明的，因此该值是全局的。 在循环期间，我们每次使用一元运算符++都会将i的值增加1。 因此在第一个例子中，当调用setTimeout函数时，i已经被赋值为3。

## CSS预处理器和Less有什么好处

### CSS预处理器

为css增加编程特性的拓展语言，可以使用变量，简单逻辑判断，函数等基本编程技巧。

css预处理器编译输出还是标准的css样式。

less, sass都是动态的样式语言，是css预处理器，css上的一种抽象层。他们是一种特殊的语法语言而编译成css的。

less变量符号是@，sass变量符号是$。

### 预处理器解决了哪些痛点

css语法不够强大。因为无法嵌套导致有很多重复的选择器 没有变量和合理的样式利用机制，导致逻辑上相关的属性值只能以字面量的形式重复输出，难以维护。

### 常用规范

变量，嵌套语法，混入，@import，运算，函数，继承

### 好处

比css代码更加整洁，更易维护，代码量更少 修改更快。
基础颜色使用变量，一处动，处处动。
常用的代码使用代码块，节省大量代码。
css嵌套减少大量的重复选择器，避免一些低级错误。
变量混入大大提升了样式的利用性 额外的工具类似颜色函数(lighten,darken,transparentize)，mixins，loops等这些方法使css更像一个真正的编程语言，让开发者能够有能力生成更加复杂的css样式。

## Node 中怎么开启一个子线程

work_thread
Node 10.5.0 的发布，work_thread 让 Node 有了真正的多线程能力，worker_thread 模块中有 4 个对象和 2 个类

- isMainThread: 是否是主线程，源码中是通过 threadId === 0 进行判断的。
- MessagePort: 用于线程之间的通信，继承自 EventEmitter。
- MessageChannel: 用于创建异步、双向通信的通道实例。
- threadId: 线程 ID。
- Worker: 用于在主线程中创建子线程。第一个参数为 filename，表示子线程执行的入口。
- parentPort: 在 worker 线程里是表示父进程的 MessagePort 类型的对象，在主线程里为 null
- workerData: 用于在主进程中向子进程传递数据（data 副本）

在主线程中开启五个子线程，并且主线程向子线程发送简单的消息示例代码如下：

``` js
const {
  isMainThread,
  parentPort,
  workerData,
  threadId,
  MessageChannel,
  MessagePort,
  Worker,
} = require("worker_threads");

function mainThread() {
  for (let i = 0; i < 5; i++) {
    const worker = new Worker(__filename, { workerData: i });
    worker.on("exit", (code) => {
      console.log(`main: worker stopped with exit code ${code}`);
    });
    worker.on("message", (msg) => {
      console.log(`main: receive ${msg}`);
      worker.postMessage(msg + 1);
    });
  }
}

function workerThread() {
  console.log(`worker: workerDate ${workerData}`);
  parentPort.on("message", (msg) => {
    console.log(`worker: receive ${msg}`);
  }),
  parentPort.postMessage(workerData);
}

if (isMainThread) {
  mainThread();
} else {
  workerThread();
}

// 上述代码在主线程中开启五个子线程，并且主线程向子线程发送简单的消息
```

## React 中 keys 的作用是什么？

> Keys 是 React 用于追踪哪些列表中元素被修改、被添加或者被移除的辅助标识

- 在开发过程中，我们需要保证某个元素的 key 在其同级元素中具有唯一性。在 React Diff 算法中 React 会借助元素的 Key 值来判断该元素是新近创建的还是被移动而来的元素，从而减少不必要的元素重渲染。此外，React 还需要借助 Key 值来判断元素与本地状态的关联关系，因此我们绝不可忽视转换函数中 Key 的重要性

## 传入 setState 函数的第二个参数的作用是什么？

> 该函数会在setState函数调用完成并且组件开始重渲染的时候被调用，我们可以用该函数来监听渲染是否完成：

``` jsx
this.setState(
  { username: 'tylermcginnis33' },
  () => console.log('setState has finished and the component has re-rendered.')
)
```

``` jsx
this.setState((prevState, props) => {
  return {
    streak: prevState.streak + props.count
  }
})
```

## React 中 refs 的作用是什么

- Refs 是 React 提供给我们的安全访问 DOM 元素或者某个组件实例的句柄
- 可以为元素添加ref属性然后在回调函数中接受该元素在 DOM 树中的句柄，该值会作为回调函数的第一个参数返回

## 在生命周期中的哪一步你应该发起 AJAX 请求

> 我们应当将AJAX 请求放到 `componentDidMount` 函数中执行，主要原因有下

- React 下一代调和算法 Fiber 会通过开始或停止渲染的方式优化应用性能，其会影响到 componentWillMount 的触发次数。对于 componentWillMount 这个生命周期函数的调用次数会变得不确定，React 可能会多次频繁调用 componentWillMount。如果我们将 AJAX 请求放到 componentWillMount 函数中，那么显而易见其会被触发多次，自然也就不是好的选择。
- 如果我们将 AJAX 请求放置在生命周期的其他函数中，我们并不能保证请求仅在组件挂载完毕后才会要求响应。如果我们的数据请求在组件挂载之前就完成，并且调用了setState函数将数据添加到组件状态中，对于未挂载的组件则会报错。而在 componentDidMount 函数中进行 AJAX 请求则能有效避免这个问题

## shouldComponentUpdate 的作用

> shouldComponentUpdate 允许我们手动地判断是否要进行组件更新，根据组件的应用场景设置函数的合理返回值能够帮我们避免不必要的更新

## 如何告诉 React 它应该编译生产环境版

> 通常情况下我们会使用 Webpack 的 DefinePlugin 方法来将 NODE_ENV 变量值设置为 production。编译版本中 React 会忽略 propType 验证以及其他的告警信息，同时还会降低代码库的大小，React 使用了 Uglify 插件来移除生产环境下不必要的注释等信息

## 概述下 React 中的事件处理逻辑

> 为了解决跨浏览器兼容性问题，React 会将浏览器原生事件（Browser Native Event）封装为合成事件（SyntheticEvent）传入设置的事件处理器中。这里的合成事件提供了与原生事件相同的接口，不过它们屏蔽了底层浏览器的细节差异，保证了行为的一致性。另外有意思的是，React 并没有直接将事件附着到子元素上，而是以单一事件监听器的方式将所有的事件发送到顶层进行处理。这样 React 在更新 DOM 的时候就不需要考虑如何去处理附着在 DOM 上的事件监听器，最终达到优化性能的目的

## createElement 与 cloneElement 的区别是什么

> createElement 函数是 JSX 编译之后使用的创建 React Element 的函数，而 cloneElement 则是用于复制某个元素并传入新的 Props

## redux中间件

> 中间件提供第三方插件的模式，自定义拦截 action -> reducer 的过程。变为 action -> middlewares -> reducer 。这种机制可以让我们改变数据流，实现如异步 action ，action 过滤，日志输出，异常报告等功能

- `redux-logger`：提供日志输出
- `redux-thunk`：处理异步操作
- `redux-promise`：处理异步操作，`actionCreator`的返回值是`promise`

## redux有什么缺点

- 一个组件所需要的数据，必须由父组件传过来，而不能像flux中直接从store取。
- 当一个组件相关数据更新时，即使父组件不需要用到这个组件，父组件还是会重新render，可能会有效率影响，或者需要写复杂的`shouldComponentUpdate`进行判断。

## react组件的划分业务组件技术组件？

- 根据组件的职责通常把组件分为UI组件和容器组件。
- UI 组件负责 UI 的呈现，容器组件负责管理数据和逻辑。
- 两者通过`React-Redux` 提供`connect`方法联系起来


## react生命周期函数

### **初始化阶段**

- `getDefaultProps`:获取实例的默认属性
- `getInitialState`:获取每个实例的初始化状态
- `componentWillMount`:组件即将被装载、渲染到页面上
- `render`:组件在这里生成虚拟的DOM节点
- `componentDidMount`:组件真正在被装载之后

### **运行中状态**

- `componentWillReceiveProps`:组件将要接收到属性的时候调用
- `shouldComponentUpdate`:组件接受到新属性或者新状态的时候（可以返回false，接收数据后不更新，阻止`render`调用，后面的函数不会被继续执行了）
- `componentWillUpdate`:组件即将更新，该生命周期函数中不能修改属性和状态
- `render`:组件重新描绘
- `componentDidUpdate`:组件已经更新

### **销毁阶段**

- `componentWillUnmount`:组件即将销毁

## react性能优化是哪个周期函数

> shouldComponentUpdate 这个方法用来判断是否需要调用render方法重新描绘dom。因为dom的描绘非常消耗性能，如果我们能在shouldComponentUpdate方法中能够写出更优化的dom diff算法，可以极大的提高性能

## 为什么虚拟dom会提高性能

> 虚拟dom相当于在js和真实dom中间加了一个缓存，利用dom diff算法避免了没有必要的dom操作，从而提高性能

### **具体实现步骤如下**

- 用 JavaScript 对象结构表示 DOM 树的结构；然后用这个树构建一个真正的 DOM 树，插到文档当中
- 当状态变更的时候，重新构造一棵新的对象树。然后用新的树和旧的树进行比较，记录两棵树差异
- 把2所记录的差异应用到步骤1所构建的真正的DOM树上，视图就更新

## diff算法?

- 把树形结构按照层级分解，只比较同级元素。
- 给列表结构的每个单元添加唯一的key属性，方便比较。
- React 只会匹配相同 class 的 component（这里面的class指的是组件的名字）
- 合并操作，调用 component 的 setState 方法的时候, React 将其标记为 - dirty.到每一个事件循环结束, React 检查所有标记 dirty 的 component 重新绘制.
- 选择性子树渲染。开发人员可以重写shouldComponentUpdate提高diff的性能

## react性能优化方案

- 重写`shouldComponentUpdate`来避免不必要的dom操作
- 使用 production 版本的react.js
- 使用key来帮助React识别列表中所有子组件的最小变化

## 当你调用 setState 的时候，发生了什么事？

将传递给 setState 的对象合并到组件的当前状态，这将启动一个和解的过程，构建一个新的 react 元素树，与上一个元素树进行对比（ diff ），从而进行最小化的重渲染。

## React 项目用过什么脚手架（本题是开放性题目）

- create-react-app 是最常用 的脚手架，一定要说出来！

Create React App：如果你是在学习 React 或创建一个新的单页应用
Create React App是FaceBook的React团队官方出的一个构建React单页面应用的脚手架工具。它本身集成了Webpack，并配置了一系列内置的loader和默认的npm的脚本，可以很轻松的实现零配置就可以快速开发React的应用。

- Next. js：如果你是在用 Node. js 构建服务端渲染的网站

Next. js 为您提供生产环境所需的所有功能以及最佳的开发体验：包括静态及服务器端融合渲染、 支持 TypeScript、智能化打包、 路由预取等功能 无需任何配置。

- Gatsby：如果你是在构建面向内容的静态网站

Gatsby. js 是基于 React 构建的、速度非常快的、现代化网站生成器。超越静态网站: 用 Gatsby 可以构建博客、电子商务网站、成熟的应用程序等。

- nwb：用于React应用程序、库和其他web npm模块的工具包

- razzle：创建没有配置的服务器呈现的通用JavaScript应用程序

- Razzle是类似于next. js的简单服务端框架, 用于在服务端渲染 React 应用程序。

- Neutrino：创建和构建零初始配置的现代JavaScript应用程序

- Yeoman：

Yeoman提供generator系统，一个generator是一个插件，在我们在一个完整的项目上使用‘yo’命令时，会运行该generator。通过这些官方的Generators，推出了Yeoman工作流，工作流是一个健壮、有自己特色的客户端堆栈，包含能快速构建漂亮的网络应用的工具和框架。Yeoman提供了负责开始项目开发的一切，没有任何让人头痛的手动配置。

采用模块化结构，Yeoman利用从几个开源社区网站学习到的成功和教训，以确保栈开发人员越来越智能的进行开发。基于良好的文档基础以及深思熟虑的项目构建过程，Yeoman提供测试和其他更多技术 ，因此开发人员可以更专注于解决方案而不用去担心其他小事。

Yeoman主要提供了三个工具：脚手架（yo），构建工具（grunt），包管理器（bower）。这三个工具是分别独立开发的，但是需要配合使用，来实现我们更高效的工作流模式。

- umi. js：

umi，中文可发音为乌米，是一个可插拔的企业级 react 应用框架。你可以将它简单的理解为一个专注性能的类 next. js 前端框架，并通过约定、自动生成和解析代码等方式来辅助开发，减少我们开发者的代码量。

- react-cli脚手架

- Rekit脚手架

## 功能组件( Functional Component )与类组件( Class Component )如何选择？

如果您的组件具有状态( state ) 或 生命周期方法，请使用 Class 组件。否则，使用功能组件

解析：

React中有两种组件：函数组件（Functional Components) 和类组件（Class Components）。据我观察，大部分同学都习惯于用类组件，而很少会主动写函数组件，包括我自己也是这样。但实际上，在使用场景和功能实现上，这两类组件是有很大区别的。

来看一个函数组件的例子：

``` jsx
function Welcome = (props) => {
  const sayHi = () => {
    alert( `Hi ${props.name}` );
  }
  return (
    <div>
      <h1>Hello, {props.name}</h1>
      <button onClick ={sayHi}>Say Hi</button>
    </div>
  )
}
```
把上面的函数组件改写成类组件：

``` jsx
import React from 'react'

class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.sayHi = this.sayHi.bind(this);
  }
  sayHi() {
    alert( `Hi ${this.props.name}` );
  }
  render() {
    return (
      <div>
        <h1>Hello, {this.props.name}</h1>
        <button onClick ={this.sayHi}>Say Hi</button>
      </div>
    )
  }
}
```

下面让我们来分析一下两种实现的区别：

1. 第一眼直观的区别是，函数组件的代码量比类组件要少一些，所以函数组件比类组件更加简洁。千万不要小看这一点，对于我们追求极致的程序员来说，这依然是不可忽视的。

2. 函数组件看似只是一个返回值是DOM结构的函数，其实它的背后是无状态组件（Stateless Components）的思想。函数组件中，你无法使用State，也无法使用组件的生命周期方法，这就决定了函数组件都是展示性组件（Presentational Components），接收Props，渲染DOM，而不关注其他逻辑。

3. 函数组件中没有this。所以你再也不需要考虑this带来的烦恼。而在类组件中，你依然要记得绑定this这个琐碎的事情。如示例中的sayHi。

4. 函数组件更容易理解。当你看到一个函数组件时，你就知道它的功能只是接收属性，渲染页面，它不执行与UI无关的逻辑处理，它只是一个纯函数。而不用在意它返回的DOM结构有多复杂。

5. 性能。目前React还是会把函数组件在内部转换成类组件，所以使用函数组件和使用类组件在性能上并无大的差异。但是，React官方已承诺，未来将会优化函数组件的性能，因为函数组件不需要考虑组件状态和组件生命周期方法中的各种比较校验，所以有很大的性能提升空间。

6. 函数组件迫使你思考最佳实践。这是最重要的一点。组件的主要职责是UI渲染，理想情况下，所有的组件都是展示性组件，每个页面都是由这些展示性组件组合而成。如果一个组件是函数组件，那么它当然满足这个要求。所以牢记函数组件的概念，可以让你在写组件时，先思考这个组件应不应该是展示性组件。更多的展示性组件意味着更多的组件有更简洁的结构，更多的组件能被更好的复用。

所以，当你下次在动手写组件时，一定不要忽略了函数组件，应该尽可能多地使用函数组件。

## React 中 keys 的作用是什么？

Keys 是 React 用于追踪哪些列表中元素被修改、被添加或者被移除的辅助标识。

``` jsx
render () {
  return (
    <ul>
      {this.state.todoItems.map(({item, key}) => {
        return <li key={key}>{item}</li>
      })}
    </ul>
  )
}
```

在开发过程中，我们需要保证某个元素的 key 在其同级元素中具有唯一性。在 React Diff 算法中 React 会借助元素的 Key 值来判断该元素是新近创建的还是被移动而来的元素，从而减少不必要的元素重渲染。此外，React 还需要借助 Key 值来判断元素与本地状态的关联关系，因此我们绝不可忽视转换函数中 Key 的重要性。

## React 优势

1. React 速度很快：它并不直接对 DOM 进行操作，引入了一个叫做虚拟 DOM 的概念，安插在 javascript 逻辑和实际的 DOM 之间，性能好。

2. 跨浏览器兼容：虚拟 DOM 帮助我们解决了跨浏览器问题，它为我们提供了标准化的 API，甚至在 IE8 中都是没问题的。

3. 一切都是 component：代码更加模块化，重用代码更容易，可维护性高。

4. 单向数据流：Flux 是一个用于在 JavaScript 应用中创建单向数据层的架构，它随着 React 视图库的开发而被 Facebook 概念化。

5. 同构、纯粹的 javascript：因为搜索引擎的爬虫程序依赖的是服务端响应而不是 JavaScript 的执行，预渲染你的应用有助于搜索引擎优化。

6. 兼容性好：比如使用 RequireJS 来加载和打包，而 Browserify 和 Webpack 适用于构建大型应用。它们使得那些艰难的任务不再让人望而生畏。

## React 很多个 setState 为什么是执行完再 render

react为了提高整体的渲染性能，会将一次渲染周期中的state进行合并，在这个渲染周期中对所有setState的所有调用都会被合并起来之后，再一次性的渲染，这样可以避免频繁的调用setState导致频繁的操作dom，提高渲染性能。

具体的实现方面，可以简单的理解为react中存在一个状态变量isBatchingUpdates，当处于渲染周期开始时，这个变量会被设置成true，渲染周期结束时，会被设置成false，react会根据这个状态变量，当出在渲染周期中时，仅仅只是将当前的改变缓存起来，等到渲染周期结束时，再一次性的全部render。

## react diff 原理（常考，大厂必考）

1. 把树形结构按照层级分解，只比较同级元素。
2. 给列表结构的每个单元添加唯一的 key 属性，方便比较。
3. React 只会匹配相同 class 的 component（这里面的 class 指的是组件的名字）
4. 合并操作，调用 component 的 setState 方法的时候, React 将其标记为 dirty. 到每一个事件循环结束, React 检查所有标记 dirty 的 component 重新绘制.
5. 选择性子树渲染。开发人员可以重写 shouldComponentUpdate 提高 diff 的性能。

## react 生命周期函数

### react15生命周期

#### 初始化阶段：

getDefaultProps: 获取实例的默认属性
getInitialState: 获取实例的初始化状态
componentWillMount：组件即将被装载、渲染到页面上
render: 组件在这里生成虚拟的 DOM 节点
componentDidMount: 组件真正在被装载之后

#### 运行中阶段：
componentWillReceiveProps: 组件将要接收到属性的时候调用
shouldComponentUpdate: 组件接受到新属性或者新状态的时候（可以返回 false，接收数据后不更新，阻止 render 调用，后面的函数不会被继续执行了）
componentWillUpdate: 组件即将更新不能修改属性和状态
render: 组件重新描绘
componentDidUpdate: 组件已经更新

#### 销毁阶段：
componentWillUnmount: 组件即将销毁

### react16生命周期

React 在v16.3版本中将 componentWillMount, componentWillReceiveProps 以及componentWillUpdate 加上了UNSAFE_前缀，这些钩子将在React 17. 0废除

新引入的两个生命周期函数

- getDerivedStateFromProps: 是一个静态方法, 是一个和组件自身"不相关"的角色. 在这个静态方法中, 除了两个默认的位置参数 nextProps 和 currentState 以外, 你无法访问任何组件上的数据.
- getSnapshotBeforeUpdate: 获取render之前的dom状态

## shouldComponentUpdate 是做什么的？（react 性能优化是哪个周期函数？）

1. shouldComponentUpdate询问组件是否需要更新的一个钩子函数，判断数据是否需要重新渲染，返回一个布尔值。默认的返回值是true，需要重新render()。若如果返回值是false则不触发渲染,利用这个生命周期函数可以强制关闭不需要更新的子组件来提升渲染性能。
2. 这个方法用来判断是否需要调用 render 方法重新描绘 dom。
3. 因为 dom 的描绘非常消耗性能，如果我们能在 shouldComponentUpdate 方法中能够写出更优化的 dom diff 算法，可以极大的提高性能。

## 为什么虚拟 dom 会提高性能?(必考)

虚拟dom(virtual dom) 其实就是一个JavaScript对象，通过这个JavaScript对象来描述真实dom。

真实dom：以前没有虚拟dom，如果需要比较两个页面的差异，我们需要通过对真实dom进行比对。真实dom节点是非常复杂的，它里面会绑定的事件，它会有属性，背后会有各种方法，会频繁触发重排与重绘，所以两个真实dom比对，非常耗性能。

总损耗 = 真实DOM完全增删改 + （可能较多的节点）重排与重绘

虚拟dom：相当于在js和真实dom中间加了一个缓存，利用dom diff算法避免了没有必要的dom操作，从而提髙性能。

总损耗 = 虚拟DOM增删改 + （与Diff算法效率有关）真实DOM差异增删改 + （较少的节点）重排与重绘

具体实现步骤如下：

1. 用JavaScript对象结构表示DOM树的结构；然后用这个树构建一个真正的DOM树，插到文档当中;
2. 当状态变更的时候，重新构造一棵新的对象树。然后用新的树和旧的树进行比较，记录两棵树差异;
3. 把步骤2所记录的差异应用到步骤1所构建的真正的DOM树上，视图就更新了。

## React 中 refs 的作用是什么？

refs 是 React 提供给我们的安全访问 DOM 元素或者某个组件实例的句柄。我们可以为元素添加 ref 属性然后在回调函数中接受该元素在 DOM 树中的句柄，该值会作为回调函数的第一个参数返回：

``` jsx
class CustomForm extends Component {
  handleSubmit = () => {
    console.log("Input Value: ", this.input.value)
  }
  render () {
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          type='text'
          ref={(input) => this.input = input} />
        <button type='submit'>Submit</button>
      </form>
    )
  }
}
```

上述代码中的 input 域包含了一个 ref 属性，该属性声明的回调函数会接收 input 对应的 DOM 元素，我们将其绑定到 this 指针以便在其他的类函数中使用。另外值得一提的是，refs 并不是类组件的专属，函数式组件同样能够利用闭包暂存其值：

``` jsx
function CustomForm ({handleSubmit}) {
  let inputElement
  return (
    <form onSubmit={() => handleSubmit(inputElement.value)}>
      <input
        type='text'
        ref={(input) => inputElement = input} />
      <button type='submit'>Submit</button>
    </form>
  )
}
```

## setState 和 replaceState 的区别

1. setState 是修改其中的部分状态，相当于 Object.assign，只是覆盖，不会减少原来的状态；
2. replaceState 是完全替换原来的状态，相当于赋值，将原来的 state 替换为另一个对象，如果新状态属性减少，那么 state 中就没有这个状态了。

## redux 有什么缺点

- 一个组件所需要的数据，必须由父组件传过来，而不能像 flux 中直接从 store 取。
- 当一个组件相关数据更新时，即使父组件不需要用到这个组件，父组件还是会重新 render，可能会有效率影响，或者需要写复杂的 shouldComponentUpdate 进行判断。

## 简述 flux 思想

Flux 的最大特点，就是数据的"单向流动"。

1. 用户访问 View
2. View 发出用户的 Action
3. Dispatcher 收到 Action，要求 Store 进行相应的更新
4. Store 更新后，发出一个"change"事件
5. View 收到"change"事件后，更新页面

## 了解 redux 么，说一下 redux 吧

### 1、为什么要用redux

在React中，数据在组件中是单向流动的，数据从一个方向父组件流向子组件（通过props）, 所以，两个非父子组件之间通信就相对麻烦，redux的出现就是为了解决state里面的数据问题

### 2、Redux设计理念

Redux是将整个应用状态存储到一个地方上称为store, 里面保存着一个状态树store tree, 组件可以派发(dispatch)行为(action)给store, 而不是直接通知其他组件，组件内部通过订阅store中的状态state来刷新自己的视图。

redux工作流

### 3、Redux三大原则

1. 唯一数据源
整个应用的state都被存储到一个状态树里面，并且这个状态树，只存在于唯一的store中

2. 保持只读状态
state是只读的，唯一改变state的方法就是触发action，action是一个用于描述以发生时间的普通对象

3. 数据改变只能通过纯函数来执行
使用纯函数来执行修改，为了描述action如何改变state的，你需要编写reducers

### 4、Redux概念解析

1. Store

- store就是保存数据的地方，你可以把它看成一个数据，整个应用只能有一个store
- Redux提供createStore这个函数，用来生成Store

``` js
import {
    createStore
} from 'redux'
const store = createStore(fn);
```

2. State

state就是store里面存储的数据，store里面可以拥有多个state，Redux规定一个state对应一个View, 只要state相同，view就是一样的，反过来也是一样的，可以通过store.getState( )获取

``` js
import {
    createStore
} from 'redux'
const store = createStore(fn);
const state = store.getState();
```

3. Action

state的改变会导致View的变化，但是在redux中不能直接操作state也就是说不能使用this. setState来操作，用户只能接触到View。在Redux中提供了一个对象来告诉Store需要改变state。Action是一个对象其中type属性是必须的，表示Action的名称，其他的可以根据需求自由设置。

``` js
const action = {
    type: 'ADD_TODO',
    payload: 'redux原理'
}
```

在上面代码中，Action的名称是ADD_TODO，携带的数据是字符串‘redux原理’，Action描述当前发生的事情，这是改变state的唯一的方式

4. store.dispatch()
store.dispatch() // 是view发出Action的唯一办法

``` js
store.dispatch({
    type: 'ADD_TODO',
    payload: 'redux原理'
})
```

store.dispatch接收一个Action作为参数，将它发送给store通知store来改变state。

5. Reducer

Store收到Action以后，必须给出一个新的state，这样view才会发生变化。这种state的计算过程就叫做Reducer。 Reducer是一个纯函数，他接收Action和当前state作为参数，返回一个新的state

注意：Reducer必须是一个纯函数，也就是说函数返回的结果必须由参数state和action决定，而且不产生任何副作用也不能修改state和action对象

``` js
const reducer = (state, action) => {
    switch (action.type) {
        case ADD_TODO:
            return newstate;
        default
        return state
    }
}
```

### 5、Redux源码

``` js
let createStore = (reducer) => {
    let state;
    //获取状态对象
    //存放所有的监听函数
    let listeners = [];
    let getState = () => state;
    //提供一个方法供外部调用派发action
    let dispath = (action) => {
        //调用管理员reducer得到新的state
        state = reducer(state, action);
        //执行所有的监听函数
        listeners.forEach((l) => l())
    }
    //订阅状态变化事件，当状态改变发生之后执行监听函数
    let subscribe = (listener) => {
        listeners.push(listener);
    }
    dispath();
    return {
        getState,
        dispath,
        subscribe
    }
}
let combineReducers = (renducers) => {
    //传入一个renducers管理组，返回的是一个renducer
    return function(state = {}, action = {}) {
        let newState = {};
        for (var attr in renducers) {
            newState[attr] = renducers[attr](state[attr], action)

        }
        return newState;
    }
}
export {
    createStore,
    combineReducers
};
```

### 6、Redux使用案例

html代码

``` html
<div id="counter"></div>
<button id="addBtn">+</button>
<button id="minusBtn">-</button>
```

js代码

``` js
function createStore(reducer) {
    var state;
    var listeners = [];
    var getState = () => state;
    var dispatch = (action) => {
        state = reducer(state, action);
        listeners.forEach(l => l());
    }
    var subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter((l) => l != listener)
        }
    }
    dispatch();
    return {
        getState,
        dispatch,
        subscribe
    }
}
var reducer = (state = 0, action) => {
    if (!action) return state;
    console.log(action);
    switch (action.type) {
        case 'INCREMENT':
            return state + 1;
        case 'DECREMENT':
            return state - 1;
        default:
            return state;
    }
}
var store = createStore(reducer);
store.subscribe(function() {
    document.querySelector('#counter').innerHTML = store.getState();
});

document.querySelector('#addBtn').addEventListener('click', function() {
    store.dispatch({
        type: 'INCREMENT'
    });
});
document.querySelector('#minusBtn').addEventListener('click', function() {
    store.dispatch({
        type: 'DECREMENT'
    });
});
```

## React 中有三种构建组件的方式

React. createClass()、ES6 class 和无状态函数。

## react 组件的划分业务组件技术组件？

- 根据组件的职责通常把组件分为 UI 组件和容器组件。
- UI 组件负责 UI 的呈现，容器组件负责管理数据和逻辑。
- 两者通过 React-Redux 提供 connect 方法联系起来。

## 描述事件在 React 中的处理方式

为了解决跨浏览器兼容性问题，您的 React 中的事件处理程序将传递 SyntheticEvent 的实例，它是 React 的浏览器本机事件的跨浏览器包装器。

这些 SyntheticEvent 与您习惯的原生事件具有相同的接口，除了它们在所有浏览器中都兼容。有趣的是，React 实际上并没有将事件附加到子节点本身。React 将使用单个事件监听器监听顶层的所有事件。这对于性能是有好处的，这也意味着在更新 DOM 时，React 不需要担心跟踪事件监听器。

## 应该在 React 组件的何处发起 Ajax 请求

在 React 组件中，应该在 componentDidMount 中发起网络请求。这个方法会在组件第一次“挂载”(被添加到 DOM)时执行，在组件的生命周期中仅会执行一次。更重要的是，你不能保证在组件挂载之前 Ajax 请求已经完成，如果是这样，也就意味着你将尝试在一个未挂载的组件上调用 setState，这将不起作用。在 componentDidMount 中发起网络请求将保证这有一个组件可以更新了。

## (在构造函数中)调用 super(props) 的目的是什么

在 super() 被调用之前，子类是不能使用 this 的，在 ES2015 中，子类必须在 constructor 中调用 super()。传递 props 给 super() 的原因则是便于(在子类中)能在 constructor 访问 this. props。

## 除了在构造函数中绑定 this，还有其它方式吗

你可以使用属性初始值设定项(property initializers)来正确绑定回调，create-react-app 也是默认支持的。在回调中你可以使用箭头函数，但问题是每次组件渲染时都会创建一个新的回调。

## 为什么建议传递给 setState 的参数是一个 callback 而不是一个对象

因为 this. props 和 this. state 的更新可能是异步的，不能依赖它们的值去计算下一个 state。

## 何为高阶组件(higher order component)

高阶组件是一个以组件为参数并返回一个新组件的函数。HOC 运行你重用代码、逻辑和引导抽象。最常见的可能是 Redux 的 connect 函数。除了简单分享工具库和简单的组合，HOC 最好的方式是共享 React 组件之间的行为。如果你发现你在不同的地方写了大量代码来做同一件事时，就应该考虑将代码重构为可重用的 HOC。

## 何为受控组件(controlled component)

在 HTML 中，类似 `<input>` , `<textarea>` 和 `<select>` 这样的表单元素会维护自身的状态，并基于用户的输入来更新。当用户提交表单时，前面提到的元素的值将随表单一起被发送。但在 React 中会有些不同，包含表单元素的组件将会在 state 中追踪输入的值，并且每次调用回调函数时，如 onChange 会更新 state，重新渲染组件。一个输入表单元素，它的值通过 React 的这种方式来控制，这样的元素就被称为"受控元素"。

## 在 React 当中 Element 和 Component 有何区别？

React Element 是描述屏幕上所见内容的数据结构，是对于 UI 的对象表述。典型的 React Element 就是利用 JSX 构建的声明式代码片然后被转化为 createElement 的调用组合。

React Component 是一个函数或一个类，可以接收参数输入，并且返回某个 React Element

## (组件的)状态(state)和属性(props)之间有何区别

- State 是一种数据结构，用于组件挂载时所需数据的默认值。State 可能会随着时间的推移而发生突变，但多数时候是作为用户事件行为的结果。

- Props(properties 的简写)则是组件的配置。props 由父组件传递给子组件，并且就子组件而言，props 是不可变的(immutable)。组件不能改变自身的 props，但是可以把其子组件的 props 放在一起(统一管理)。Props 也不仅仅是数据--回调函数也可以通过 props 传递。

## 展示组件(Presentational component)和容器组件(Container component)之间有何区别？

- 展示组件关心组件看起来是什么。展示专门通过 props 接受数据和回调，并且几乎不会有自身的状态，但当展示组件拥有自身的状态时，通常也只关心 UI 状态而不是数据的状态。

- 容器组件则更关心组件是如何运作的。容器组件会为展示组件或者其它容器组件提供数据和行为(behavior)，它们会调用 Flux actions，并将其作为回调提供给展示组件。容器组件经常是有状态的，因为它们是(其它组件的)数据源。

## 类组件(Class component)和 函数式组件(Functional component)之间有何区别？

1. 函数式组件比类组件操作简单，只是简单的调取和返回 JSX；而类组件可以使用生命周期函数来操作业务

2. 函数式组件可以理解为静态组件（组件中的内容调取的时候已经固定了，很难再修改），而类组件，可以基于组件内部的状态来动态更新渲染的内容

3. 类组件不仅允许你使用更多额外的功能，如组件自身的状态和生命周期钩子，也能使组件直接访问 store 并维持状态

4. 当组件仅是接收 props，并将组件自身渲染到页面时，该组件就是一个 '无状态组件(stateless component)'，可以使用一个纯函数来创建这样的组件。这种组件也被称为哑组件(dumb components)或展示组件

## createElement 和 cloneElement 有什么区别？

传入的第一个参数不同

React.createElement(): JSX 语法就是用 React.createElement()来构建 React 元素的。它接受三个参数，第一个参数可以是一个标签名。如 div、span，或者 React 组件。第二个参数为传入的属性。第三个以及之后的参数，皆作为组件的子组件。

``` js
React.createElement(type, [props], [...children]);
```

React.cloneElement()与 React.createElement()相似，不同的是它传入的第一个参数是一个 React 元素，而不是标签名或组件。新添加的属性会并入原有的属性，传入到返回的新元素中，而旧的子元素将被替换。将保留原始元素的键和引用。

``` js
React.cloneElement(element, [props], [...children]);
```

## React实现一个防抖的模糊查询输入框

### 1. 前言

开门见山，使用防抖和节流技术的意义：节约资源，提升用户体验。

浏览器中有许多事件会在很小时间间隔内频繁触发，比如：监听用户的输入（keyup、keydown）、浏览器窗口调整大小和滚动行为（resize、scroll）、鼠标的移动行为（mousemove）等。如果这些事件一触发我们就执行相应的事件处理函数的话，那将会造成较大的资源浪费或者给用户带来不好的体验。
例如，我们为输入框绑定keyup回调函数，判断用户输入的手机号是否符合规则，在普通情况下，用户每输入一个字符，我们就会对当前的输入内容进行判断并给出相应的提示，但实际上用户的输入并未结束，我们就在页面中给出输入不符合规则的错误提示，这样的用户体验很不好，并且这么频繁的验证没必要。实际中我们可能采用的处理方式是：当用户在停止输入一段时间后我们再判断输入的内容是否符合规则。（后面我们使用React来实现该例子）

这时，我们的**防抖**和**节流**两位小兄弟就排上用场了！

### 2. 防抖（debounce）

**防抖：**触发高频事件后n秒内函数只会执行一次，如果n秒内高频事件再次被触发，则重新计算时间。
**思路：**每次触发事件时都取消之前的延时调用方法。
**使用的本质：**不允许某一行为触发。
一种简单的实现方式如下（更完善的可以参考：lodash的debounce）：

``` js
function debounce(fn, ms) {
	let timerId // 创建一个标记用来存放定时器的返回值
	return function () {
		timerId && clearTimeout(timerId) // 每当用户输入的时候把前一个 setTimeout clear 掉
		// 然后又创建一个新的 setTimeout, 这样就能保证输入字符后的 interval 间隔内如果还有字符输入的话，就不会执行 fn 函数
		timerId = setTimeout(() => {
			fn.apply(this, arguments)
		}, ms)
	}
}


// 使用例子
function sayHi() {
	console.log('防抖成功');
}

var inp = document.getElementById('inp');
inp.addEventListener('input', debounce(sayHi, 1000)); // 防抖
```

防抖一般用于input输入框。

### 3. 节流（throttle）

**节流：**高频事件触发，但在n秒内只会执行一次，所以节流会稀释函数的执行频率。
**思路：**每次触发事件时都判断当前是否有等待执行的延时函数。
**使用的本质：**允许某一行为触发，但是触发的频率不能太高。
一种简单的实现方式如下（更详细的可以参考：lodash的throttle）：

``` js
function throttle(fn, ms) {
	let timerId // 创建一个标记用来存放定时器的id
	return function () {
		// 没有定时器等待执行，则表示可以创建新的定时器来执行函数
		if (!timerId) {
			timerId = setTimeout(() => {
				// 定时器id清空，表示可以执行下一次调用了
				timerId = null
				fn.apply(this, arguments)
			}, ms)
		}
	}
}


// 使用例子
function sayHi(e) {
	console.log(e.target.innerWidth, e.target.innerHeight);
}
window.addEventListener('resize', throttle(sayHi, 1000));
```

节流一般用于动画相关的场景。

### 4. 两个比喻来帮助区分防抖和节流

我们从词本身的意义展开来解释防抖和节流，希望能帮助大家更清楚地区分它们。

**防抖：** 防止抖动的意思，也就是不抖动时才进行相应的处理。比如一根拉直的弹簧，我们拨动一下它就会抖动，过一段时间后弹簧会恢复到平静的状态（从拨动弹簧使其抖动到恢复平静的时长就是代码例子的ms值）。在这个过程中，拨动弹簧的这一行为假设为事件被触发（代码中的input事件被触发），当弹簧恢复平静时我们再执行事件处理函数（代码中的sayHi函数）。基于以上假设，当我们在弹簧还没恢复到平静状态时，又不断地拨动它（清除了原来的setTimeout，并重新开始计时），因为弹簧还没恢复到平静，那么事件处理函数就一直不会被执行。只有当我们拨动它，并且之后再也不动它（也就是最后一次触发），等它恢复到平静状态时（setTimeout时间到达），事件处理函数才会被执行。

**节流：** 控制住流量的意思，流量没达到一定的程度就不进行相应的处理。比如我们用水桶去接水，水龙头保持以不变的流量出水（即事件不断被触发），只有当水桶里的水满的时候（setTimeout时间到达），我们才将装满水的水桶拿走（执行事件处理函数），使用完后再拿这个空桶继续接水（重新开始计时）。

从以上的比喻中我们可以知道，**防抖是用来处理那些离散的事件**（拨动弹簧），**节流是用来处理那些连续的事件**（水一直在流出），这样我们就可以根据事件触发是离散型的还是连续型的来判断使用防抖还是节流啦（当然还要考虑实际需求）！
**防抖应用的例子：** 判断用户的输入情况，只在用户停止输入一段时间后再进行判断。
**节流应用的例子：** 滚动页面垂直滚动条，判断是否滚动到页面底部。

### 5. 在React中使用

#### 5.1 未使用防抖

``` jsx
import * as React from 'react'
import './App.css'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tip: null,
      trigerTimes: 1
    }
  }
  handleKeyUp = (e) => {
    this.isPhoneLegal(e.target.value) // 对用户输入进行判断
  }

  isPhoneLegal = (phone) => {
    const phoneRegexp = /^1([38]\d|5[0-35-9]|7[3678])\d{8}$/  //手机号码的正则表达式
    const { trigerTimes } = this.state
    if(phoneRegexp.test(phone)) {
      this.setState({
        tip: `手机号符合规则!`,
        trigerTimes: 0
      })
    } else {
      this.setState({
        tip: `手机号有误, 触发了：${trigerTimes}次`,
        trigerTimes: trigerTimes + 1
      })
    }
  }

  render() {
    return (
      <div className="container">
        <input onKeyUp={ this.handleKeyUp } placeholder="请输入手机号"/>
        <span>
          {this.state.tip}
        </span>
      </div>
    )
  }
}

export default App;
```

可以看到，我们每输入一个字符，keyup事件就被触发一次，用户未输入完成就提示输入有误，这种体验不是很好。

#### 5.2 使用防抖

``` jsx
import * as React from 'react'
import './App.css'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tip: null,
      trigerTimes: 1
    }
    this.isPhoneLegal = debounce(this.isPhoneLegal, 1000)
  }
  handleKeyUp = (e) => {
    this.isPhoneLegal(e.target.value) // 对用户输入进行判断
  }
  isPhoneLegal = (phone) => {
    const phoneRegexp = /^1([38]\d|5[0-35-9]|7[3678])\d{8}$/
    const { trigerTimes } = this.state
    if(phoneRegexp.test(phone)) {
      this.setState({
        tip: `手机号符合规则!`,
        trigerTimes: 0
      })
    } else {
      this.setState({
        tip: `手机号有误, 触发了：${trigerTimes}次`,
        trigerTimes: trigerTimes + 1
      })
    }
  }

  render() {
    return (
      <div className="container">
        <input onKeyUp={ this.handleKeyUp} placeholder="请输入手机号"/>
        <span>
          {this.state.tip}
        </span>
      </div>
    )
  }
}

function debounce(fn, ms) {
  let timeoutId
  return function () {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn.apply(this, arguments)
    }, ms)
  }
}

export default App;
```

结果显示，此时并不会在用户每次输入字符的时候都进行规则判断。我们在输入到第10位时停顿了一下，然后才执行判断，输出手机号不符合规则的信息。很明显，使用防抖以后，回调执行的次数大大减少了，这样有利于节约资源，提升用户体验。假设这是一个判断用户名是否存在的输入框，那么我们的事件触发回调就需要进行Ajax请求，后端查询数据库判断用户名是否存在，此时，减少回调函数的调用次数可以大大减少网络请求数，降低服务器的压力。

## React 和 Vue 的 diff 时间复杂度从 O(n^3) 优化到 O(n) ，那么 O(n^3) 和 O(n) 是如何计算出来的？

## React 中 setState 什么时候是同步的，什么时候是异步的？

## react-router里的 `<Link>` 标签和 `<a>` 标签有什么区别（滴滴）

对比`<a>`标签，`<Link>`标签避免了不必要的重渲染

link的源码如下所示:

``` js
if (_this.props.onClick) _this.props.onClick(event);

if (!event.defaultPrevented && // onClick prevented default
  event.button === 0 && // ignore everything but left clicks
  !_this.props.target && // let browser handle "target=_blank" etc.
  !isModifiedEvent(event) // ignore clicks with modifier keys
) {
    event.preventDefault();

    var history = _this.context.router.history;
    var _this$props = _this.props,
        replace = _this$props.replace,
        to = _this$props.to;


    if (replace) {
      history.replace(to);
    } else {
      history.push(to);
    }
  }
```

Link做了3件事情：

1. 有onclick那就执行onclick
2. click的时候阻止a标签默认事件（这样子点击[123]()就不会跳转和刷新页面）
3. 再取得跳转href（即是to），用history（前端路由两种方式之一，history & hash）跳转，此时只是链接变了，并没有刷新页面

## react-router怎么实现路由切换（滴滴）

## React组件事件代理的原理（网易）

## RN的原理，为什么可以同时在安卓和IOS端运行（寺库）

## 比较一下React与Vue

相同点
1. 都有组件化开发和Virtual DOM
2. 都支持props进行父子组件间数据通信
3. 都支持数据驱动视图, 不直接操作真实DOM, 更新状态数据界面就自动更新
4. 都支持服务器端渲染
5. 都有支持native的方案,React的React Native,Vue的Weex

不同点
1. 数据绑定: vue实现了数据的双向绑定,react数据流动是单向的
2. 组件写法不一样, React推荐的做法是 JSX , 也就是把HTML和CSS全都写进JavaScript了,即'all in js'; Vue推荐的做法是webpack+vue-loader的单文件组件格式,即html,css,js写在同一个文件
3. state对象在react应用中不可变的,需要使用setState方法更新状态;在vue中,state对象不是必须的,数据由data属性在vue对象中管理
4. virtual DOM不一样,vue会跟踪每一个组件的依赖关系,不需要重新渲染整个组件树。而对于React而言,每当应用的状态被改变时,全部组件都会重新渲染,所以react中会需要shouldComponentUpdate这个生命周期函数方法来进行控制
5. React严格上只针对MVC的view层,Vue则是MVVM模式

## 受控组件与非受控组件

- 受控: 表单元素状态由使用者维护
- 非受控: 表单元素状态DOM 自身维护

1. 受控组件

在HTML中，标签、`<textarea>`、的值的改变通常是根据用户输入进行更新。在React中，可变状态通常保存在组件的状态属性中，并且只能使用 setState() 更新，而呈现表单的React组件也控制着在后续用户输入时该表单中发生的情况，以这种由React控制的输入表单元素而改变其值的方式，称为：“受控组件”。

2. 不受控组件

表单数据由DOM本身处理。即不受setState()的控制，与传统的HTML表单输入相似，input输入值即显示最新值（使用 ref 从DOM获取表单值

## 什么是 React?

React 是一个开源前端 JavaScript 库，用于构建用户界面，尤其是单页应用程序。它用于处理网页和移动应用程序的视图层。React 是由 Facebook 的软件工程师 Jordan Walke 创建的。在 2011 年 React 应用首次被部署到 Facebook 的信息流中，之后于 2012 年被应用到 Instagram 上。

## React 的主要特点是什么?

- 考虑到真实的 DOM 操作成本很高，它使用 VirtualDOM 而不是真实的 DOM。
- 支持服务端渲染。
- 遵循单向数据流或数据绑定。
- 使用可复用/可组合的 UI 组件开发视图。

## 什么是 JSX?

JSX 是 ECMAScript 一个类似 XML 的语法扩展。基本上，它只是为 React.createElement() 函数提供语法糖，从而让在我们在 JavaScript 中，使用类 HTML 模板的语法，进行页面描述。

在下面的示例中，`<h1>` 内的文本标签会作为 JavaScript 函数返回给渲染函数。

``` jsx
class App extends React.Component {
  render() {
    return(
      <div>
        <h1>{'Welcome to React world!'}</h1>
      </div>
    )
  }
}
```
以上示例 render 方法中的 JSX 将会被转换为以下内容：

``` js
React.createElement(
  "div",
  null,
  React.createElement("h1", null, 'Welcome to React world!')
);
```

## 元素和组件有什么区别?

一个 Element 是一个简单的对象，它描述了你希望在屏幕上以 DOM 节点或其他组件的形式呈现的内容。Elements 在它们的属性中可以包含其他 Elements。创建一个 React 元素是很轻量的。一旦元素被创建后，它将不会被修改。

React Element 的对象表示如下：

``` js
const element = React.createElement(
  'div',
  {id: 'login-btn'},
  'Login'
)
```

上面的 React.createElement() 函数会返回一个对象。

``` js
{
  type: 'div',
  props: {
    children: 'Login',
    id: 'login-btn'
  }
}
```

最后使用 ReactDOM.render() 方法渲染到 DOM：

``` jsx
<div id='login-btn'>Login</div>
```

而一个组件可以用多种不同方式声明。它可以是一个含有 render() 方法的类。或者，在简单的情况中，它可以定义为函数。无论哪种情况，它都将 props 作为输入，并返回一个 JSX 树作为输出：

``` jsx
const Button = ({ onLogin }) =>
  <div id={'login-btn'} onClick={onLogin} />
```

然后 JSX 被转换成 React.createElement() 函数：

``` js
const Button = ({ onLogin }) => React.createElement(
  'div',
  { id: 'login-btn', onClick: onLogin },
  'Login'
)
```

## 如何在 React 中创建组件?

有两种可行的方法来创建一个组件：

1. Function Components: 这是创建组件最简单的方式。这些是纯 JavaScript 函数，接受 props 对象作为第一个参数并返回 React 元素：

``` jsx
function Greeting({ message }) {
  return <h1>{`Hello, ${message}`}</h1>
}
```

2. Class Components: 你还可以使用 ES6 类来定义组件。上面的函数组件若使用 ES6 的类可改写为：

``` jsx
class Greeting extends React.Component {
  render() {
    return <h1>{`Hello, ${this.props.message}`}</h1>
  }
}
```

通过以上任意方式创建的组件，可以这样使用：

``` jsx
<Greeting message="semlinker"/>
```

在 React 内部对函数组件和类组件的处理方式是不一样的，如：

``` jsx
// 如果 Greeting 是一个函数
const result = Greeting(props); // <p>Hello</p>

// 如果 Greeting 是一个类
const instance = new Greeting(props); // Greeting {}
const result = instance.render(); // <p>Hello</p>
```

## 何时使用类组件和函数组件?

如果组件需要使用**状态或生命周期方法**，那么使用类组件，否则使用函数组件。

## 什么是 Pure Components?

`React.PureComponent` 与 `React.Component` 完全相同，只是它为你处理了 `shouldComponentUpdate()` 方法。当属性或状态发生变化时，`PureComponent` 将对属性和状态进行浅比较。另一方面，一般的组件不会将当前的属性和状态与新的属性和状态进行比较。因此，在默认情况下，每当调用 `shouldComponentUpdate` 时，默认返回 true，所以组件都将重新渲染。

## React 的状态是什么?

组件的状态是一个对象，它包含某些信息，这些信息可能在组件的生命周期中发生更改。我们应该尽量使状态尽可能简单，并尽量减少有状态组件的数量。让我们创建一个包含消息状态的 User 组件：

``` jsx
class User extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      message: 'Welcome to React world'
    }
  }

  render() {
    return (
      <div>
        <h1>{this.state.message}</h1>
      </div>
    )
  }
}
```

状态（State）与属性（Props）类似，但它是私有的，完全由组件控制。也就是说，除了它所属的组件外，任何组件都无法访问它。

## React 中的 props 是什么?

Props 是组件的输入。它们是单个值或包含一组值的对象，这些值在创建时使用类似于 HTML 标记属性的命名约定传递给组件。它们是从父组件传递到子组件的数据。

Props 的主要目的是提供以下组件功能：

1. 将自定义数据传递到组件。
2. 触发状态更改。
3. 在组件的 render() 方法中通过 this.props.reactProp 使用。

例如，让我们使用 reactProp 属性创建一个元素：

``` jsx
<Element reactProp={'1'} />
```

然后，reactProp 将成为附加到 React props 对象的属性，该对象最初已存在于使用 React 库创建的所有组件上。

``` js
props.reactProp
```

## 状态和属性有什么区别?

state 和 props 都是普通的 JavaScript 对象。虽然它们都保存着影响渲染输出的信息，但它们在组件方面的功能不同。Props 以类似于函数参数的方式传递给组件，而状态则类似于在函数内声明变量并对它进行管理。

States vs Props

| Conditions | States | Props |
| ---- | ---- | ---- |
| 可从父组件接收初始值 | 是 | 是 |
| 可在父组件中改变其值 | 否 | 是 |
| 在组件内设置默认值 | 是 | 是 |
| 在组件内可改变 | 是 | 否 |
| 可作为子组件的初始值 | 是 | 是 |

## 我们为什么不能直接更新状态?

如果你尝试直接改变状态，那么组件将不会重新渲染。

``` jsx
//Wrong
this.state.message = 'Hello world'
```

正确方法应该是使用 setState() 方法。它调度组件状态对象的更新。当状态更改时，组件通将会重新渲染。

``` jsx
//Correct
this.setState({ message: 'Hello World' })
```

**注意：** 你可以在 constructor 中或使用最新的 JavaScript 类属性声明语法直接设置状态对象。

另在React文档中，提到永远不要直接更改this.state，而是使用this.setState进行状态更新，这样做的两个主要原因如下：

- setState分批工作：这意味着不能期望setState立即进行状态更新，这是一个异步操作，因此状态更改可能在以后的时间点发生，这意味着手动更改状态可能会被setState覆盖。

- 性能：当使用纯组件或shouldComponentUpdate时，它们将使用===运算符进行浅表比较，但是如果更改状态，则对象引用将仍然相同，因此比较将失败。

**注意：** 为了避免避免数组/对象突变，可使用以下方法：

1. 使用slice
2. 使用Object.assign
3. 在ES6中使用Spread operator
4. 嵌套对象

## 回调函数作为 setState() 参数的目的是什么?

当 setState 完成和组件渲染后，回调函数将会被调用。由于 setState() 是异步的，回调函数用于任何后续的操作。

**注意：** 建议使用生命周期方法而不是此回调函数。

``` jsx
setState({ name: 'John' }, () => console.log('The name has updated and component re-rendered'))
```

## HTML 和 React 事件处理有什么区别?

1. 在 HTML 中事件名必须小写：

``` html
<button onclick='activateLasers()'>
```

而在 React 中它遵循 camelCase (驼峰) 惯例：

``` jsx
<button onClick={activateLasers}>
```

2. 在 HTML 中你可以返回 `false` 以阻止默认的行为：

``` html
<a href='#' onclick='console.log("The link was clicked."); return false;' />
```

而在 React 中你必须地明确地调用 `preventDefault()` ：
``` jsx
function handleClick(event) {
  event.preventDefault()
  console.log('The link was clicked.')
}
```

## 如何在 JSX 回调中绑定方法或事件处理程序?

实现这一点有三种可能的方法：

1. Binding in Constructor: 在 JavaScript 类中，方法默认不被绑定。这也适用于定义为类方法的 React 事件处理程序。通常我们在构造函数中绑定它们。
``` jsx
class Component extends React.Componenet {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick() {
    // ...
  }
}
```

2. Public class fields syntax: 如果你不喜欢 bind 方案，则可以使用 public class fields syntax 正确绑定回调。

``` jsx
handleClick = () => {
  console.log('this is:', this)
}
<button onClick={this.handleClick}>
  {'Click me'}
</button>
```

3. Arrow functions in callbacks: 你可以在回调函数中直接使用 arrow functions。
``` jsx
<button onClick={(event) => this.handleClick(event)}>
  {'Click me'}
</button>
```

**注意：** 如果回调函数作为属性传给子组件，那么这些组件可能触发一个额外的重新渲染。在这些情况下，考虑到性能，最好使用 .bind() 或 public class fields syntax 方案。

## 如何将参数传递给事件处理程序或回调函数?

你可以使用箭头函数来包装事件处理器并传递参数：

``` jsx
<button onClick={() => this.handleClick(id)} />
```

这相当于调用 .bind:

``` jsx
<button onClick={this.handleClick.bind(this, id)} />
```

## React 中的合成事件是什么?

`SyntheticEvent` 是对浏览器原生事件的跨浏览器包装。它的 API 与浏览器的原生事件相同，包括 `stopPropagation()` 和 `preventDefault()`，除了事件在所有浏览器中的工作方式相同。

## 什么是内联条件表达式?

在 JS 中你可以使用 if 语句或三元表达式，来实现条件判断。除了这些方法之外，你还可以在 JSX 中嵌入任何表达式，方法是将它们用大括号括起来，然后再加上 JS 逻辑运算符 &&。

``` jsx
<h1>Hello!</h1>
{
    messages.length > 0 && !isLogin ?
      <h2>
          You have {messages.length} unread messages.
      </h2>
      :
      <h2>
          You don't have unread messages.
      </h2>
}
```
当然如果只是想判断 if，可以如下直接判断：

``` jsx
{
    isLogin && <span>Your have been login!</span>
}
```
在上面的代码中，不需要使用`isLogin ? <span>Your have been login!</span> : null`这样的形式。

## 什么是 "key" 属性，在元素数组中使用它们有什么好处?

key 是一个特殊的字符串属性，你在创建元素数组时需要包含它。Keys 帮助 React 识别哪些项已更改、添加或删除。

我们通常使用数据中的 IDs 作为 keys:

``` jsx
const todoItems = todos.map((todo) =>
  <li key={todo.id}>
    {todo.text}
  </li>
)
```
在渲染列表项时，如果你没有稳定的 IDs，你可能会使用 index 作为 key：

``` jsx
const todoItems = todos.map((todo, index) =>
  <li key={index}>
    {todo.text}
  </li>
)
```

**注意：**

1. 由于列表项的顺序可能发生改变，因此并不推荐使用 indexes 作为 keys。这可能会对性能产生负面影响，并可能导致组件状态出现问题。
2. 如果将列表项提取为单独的组件，则在列表组件上应用 keys 而不是 li 标签。
3. 如果在列表项中没有设置 key 属性，在控制台会显示警告消息。

## refs 有什么用?

`ref` 用于返回对元素的引用。但在大多数情况下，应该避免使用它们。当你需要直接访问 DOM 元素或组件的实例时，它们可能非常有用。

## 如何创建 refs?

这里有两种方案

1. 这是最近增加的一种方案。Refs 是使用 React.createRef() 方法创建的，并通过 ref 属性添加到 React 元素上。为了在整个组件中使用refs，只需将 ref 分配给构造函数中的实例属性。
``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }
  render() {
    return <div ref={this.myRef} />
  }
}
```

2. 你也可以使用 ref 回调函数的方案，而不用考虑 React 版本。例如，访问搜索栏组件中的 input 元素如下：
``` jsx
class SearchBar extends Component {
   constructor(props) {
      super(props);
      this.txtSearch = null;
      this.state = { term: '' };
      this.setInputSearchRef = e => {
         this.txtSearch = e;
      }
   }

   onInputChange(event) {
      this.setState({ term: this.txtSearch.value });
   }

   render() {
      return (
         <input
            value={this.state.term}
            onChange={this.onInputChange.bind(this)}
            ref={this.setInputSearchRef} />
      );
   }
}
```
你也可以在使用 closures 的函数组件中使用 refs。

**注意：** 你也可以使用内联引用回调，尽管这不是推荐的方法。

## 什么是 forward refs?

Ref forwarding 是一个特性，它允许一些组件获取接收到 ref 对象并将它进一步传递给子组件。

``` jsx
const ButtonElement = React.forwardRef((props, ref) => (
  <button ref={ref} className="CustomButton">
    {props.children}
  </button>
));

// Create ref to the DOM button:
const ref = React.createRef();
<ButtonElement ref={ref}>{'Forward Ref'}</ButtonElement>
```

## callback refs 和 findDOMNode() 哪一个是首选选项?

最好是使用 callback refs 而不是 `findDOMNode()` API。因为 `findDOMNode()` 阻碍了将来对 React 的某些改进。

使用 `findDOMNode` 已弃用的方案：

``` jsx
class MyComponent extends Component {
  componentDidMount() {
    findDOMNode(this).scrollIntoView()
  }

  render() {
    return <div />
  }
}
```

推荐的方案是：

``` jsx
class MyComponent extends Component {
  componentDidMount() {
    this.node.scrollIntoView()
  }

  render() {
    return <div ref={node => this.node = node} />
  }
}
```

## 为什么 String Refs 被弃用?

如果你以前使用过 React，你可能会熟悉旧的 API，其中的 `ref` 属性是字符串，如 `ref={'textInput'}`，并且 DOM 节点的访问方式为`this.refs.textInput`。我们建议不要这样做，因为字符串引用有以下问题，并且被认为是遗留问题。字符串 refs 在 React v16 版本中被移除。

1. 由于它无法知道this，所以需要React去跟踪当前渲染的组件。这使得React变得比较慢。

2. 如果一个库在传递的子组件（子元素）上放置了一个ref，那用户就无法在它上面再放一个ref了。但函数式可以实现这种组合。

3. 它们不能与静态分析工具一起使用，如 Flow。Flow 无法猜测出 this.refs 上的字符串引用的作用及其类型。Callback refs 对静态分析更友好。

4. 下述例子中，string类型的refs写法会让ref被放置在DataTable组件中，而不是MyComponent中。

``` jsx
class MyComponent extends Component {
  renderRow = (index) => {
    // This won't work. Ref will get attached to DataTable rather than MyComponent:
    return <input ref={'input-' + index} />;

    // This would work though! Callback refs are awesome.
    return <input ref={input => this['input-' + index] = input} />;
  }

  render() {
    return <DataTable data={this.props.data} renderRow={this.renderRow} />
  }
}
```

## 什么是 Virtual DOM?

Virtual DOM (VDOM) 是 Real DOM 的内存表示形式。UI 的展示形式被保存在内存中并与真实的 DOM 同步。这是在调用的渲染函数和在屏幕上显示元素之间发生的一个步骤。整个过程被称为 reconciliation。

Real DOM vs Virtual DOM

| Real DOM | Virtual DOM |
| ---- | ---- |
| 更新较慢 | 更新较快 |
| 可以直接更新 HTML | 无法直接更新 HTML |
| 如果元素更新，则创建新的 DOM | 如果元素更新，则更新 JSX |
| DOM 操作非常昂贵 | DOM 操作非常简单 |
| 较多的内存浪费 | 没有内存浪费 |

## Virtual DOM 如何工作?

Virtual DOM 分为三个简单的步骤。

1. 每当任何底层数据发生更改时，整个 UI 都将以 Virtual DOM 的形式重新渲染。

2. 然后计算先前 Virtual DOM 对象和新的 Virtual DOM 对象之间的差异。

3. 一旦计算完成，真实的 DOM 将只更新实际更改的内容。

## Shadow DOM 和 Virtual DOM 之间有什么区别?

Shadow DOM 是一种浏览器技术，它解决了构建网络应用的脆弱性问题。Shadow DOM 修复了 CSS 和 DOM。它在网络平台中引入作用域样式。 无需工具或命名约定，你即可使用原生 JavaScript 捆绑 CSS 和标记、隐藏实现详情以及编写独立的组件。Virtual DOM 是一个由 JavaScript 库在浏览器 API 之上实现的概念。

## 什么是 React Fiber?

Fiber 是 React v16 中新的 reconciliation 引擎，或核心算法的重新实现。React Fiber 的目标是提高对动画，布局，手势，暂停，中止或者重用任务的能力及为不同类型的更新分配优先级，及新的并发原语等领域的适用性。

## React Fiber 的主要目标是什么?

React Fiber 的目标是提高其在动画、布局和手势等领域的适用性。它的主要特性是 **incremental rendering:** 将渲染任务拆分为小的任务块并将任务分配到多个帧上的能力。

## 什么是受控组件?

在随后的用户输入中，能够控制表单中输入元素的组件被称为受控组件，即每个状态更改都有一个相关联的处理程序。

例如，我们使用下面的 handleChange 函数将输入框的值转换成大写：

``` jsx
handleChange(event) {
  this.setState({value: event.target.value.toUpperCase()})
}
```

### 什么是非受控组件?

非受控组件是在内部存储其自身状态的组件，当需要时，可以使用 ref 查询 DOM 并查找其当前值。这有点像传统的 HTML。

在下面的 UserProfile 组件中，我们通过 ref 引用 name 输入框：

``` jsx
class UserProfile extends React.Component {
  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.input = React.createRef()
  }

  handleSubmit(event) {
    alert('A name was submitted: ' + this.input.current.value)
    event.preventDefault()
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          {'Name:'}
          <input type="text" ref={this.input} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
```
在大多数情况下，建议使用受控组件来实现表单。

## createElement 和 cloneElement 有什么区别?

JSX 元素将被转换为 `React.createElement()` 函数来创建 React 元素，这些对象将用于表示 UI 对象。而 `cloneElement` 用于克隆元素并传递新的属性。

## 在 React 中的提升状态是什么?

当多个组件需要共享相同的更改数据时，建议将共享状态提升到最接近的共同祖先。这意味着，如果两个子组件共享来自其父组件的相同数据，则将状态移动到父组件，而不是在两个子组件中维护局部状态。

## 组件生命周期的不同阶段是什么?

组件生命周期有三个不同的生命周期阶段：

1. **Mounting:** 组件已准备好挂载到浏览器的 DOM 中. 此阶段包含来自 constructor(), getDerivedStateFromProps(), render(), 和 componentDidMount() 生命周期方法中的初始化过程。

2. **Updating:** 在此阶段，组件以两种方式更新，发送新的属性并使用 setState() 或 forceUpdate() 方法更新状态. 此阶段包含 getDerivedStateFromProps(), shouldComponentUpdate(), render(), getSnapshotBeforeUpdate() 和 componentDidUpdate() 生命周期方法。

3. **Unmounting:** 在这个最后阶段，不需要组件，它将从浏览器 DOM 中卸载。这个阶段包含 componentWillUnmount() 生命周期方法。

值得一提的是，在将更改应用到 DOM 时，React 内部也有阶段概念。它们按如下方式分隔开：

1. **Render** 组件将会进行无副作用渲染。这适用于纯组件（Pure Component），在此阶段，React 可以暂停，中止或重新渲染。

2. **Pre-commit** 在组件实际将更改应用于 DOM 之前，有一个时刻允许 React 通过getSnapshotBeforeUpdate()捕获一些 DOM 信息（例如滚动位置）。

3. **Commit** React 操作 DOM 并分别执行最后的生命周期： componentDidMount() 在 DOM 渲染完成后调用, componentDidUpdate() 在组件更新时调用, componentWillUnmount() 在组件卸载时调用。 React 16.3+ 阶段 (也可以看交互式版本)

## React 生命周期方法有哪些?

React 16.3+

- **getDerivedStateFromProps**: 在调用render()之前调用，并在 每次 渲染时调用。 需要使用派生状态的情况是很罕见得。值得阅读 如果你需要派生状态.
- **componentDidMount**: 首次渲染后调用，所有得 Ajax 请求、DOM 或状态更新、设置事件监听器都应该在此处发生。
- **shouldComponentUpdate**: 确定组件是否应该更新。 默认情况下，它返回true。 如果你确定在更新状态或属性后不需要渲染组件，则可以返回false值。 它是一个提高性能的好地方，因为它允许你在组件接收新属性时阻止重新渲染。
- **getSnapshotBeforeUpdate**: 在最新的渲染输出提交给 DOM 前将会立即调用，这对于从 DOM 捕获信息（比如：滚动位置）很有用。
- **componentDidUpdate**: 它主要用于更新 DOM 以响应 prop 或 state 更改。 如果shouldComponentUpdate()返回false，则不会触发。
- **componentWillUnmount**: 当一个组件被从 DOM 中移除时，该方法被调用，取消网络请求或者移除与该组件相关的事件监听程序等应该在这里进行。

Before 16.3

- **componentWillMount**: 在组件render()前执行，用于根组件中的应用程序级别配置。应该避免在该方法中引入任何的副作用或订阅。
- **componentDidMount**: 首次渲染后调用，所有得 Ajax 请求、DOM 或状态更新、设置事件监听器都应该在此处发生。
- **componentWillReceiveProps**: 在组件接收到新属性前调用，若你需要更新状态响应属性改变（例如，重置它），你可能需对比this.props和nextProps并在该方法中使用this.setState()处理状态改变。
- **shouldComponentUpdate**: 确定组件是否应该更新。 默认情况下，它返回true。 如果你确定在更新状态或属性后不需要渲染组件，则可以返回false值。 它是一个提高性能的好地方，因为它允许你在组件接收新属性时阻止重新渲染。
- **componentWillUpdate**: 当shouldComponentUpdate返回true后重新渲染组件之前执行，注意你不能在这调用this.setState()
- **componentDidUpdate**: 它主要用于更新 DOM 以响应 prop 或 state 更改。 如果shouldComponentUpdate()返回false，则不会触发。
- **componentWillUnmount**: 当一个组件被从 DOM 中移除时，该方法被调用，取消网络请求或者移除与该组件相关的事件监听程序等应该在这里进行。

## 什么是高阶组件（HOC）?

高阶组件(HOC) 就是一个函数，且该函数接受一个组件作为参数，并返回一个新的组件，它只是一种模式，这种模式是由react自身的组合性质必然产生的。

我们将它们称为纯组件，因为它们可以接受任何动态提供的子组件，但它们不会修改或复制其输入组件中的任何行为。

``` jsx
const EnhancedComponent = higherOrderComponent(WrappedComponent)
```

HOC 有很多用例：

1. 代码复用，逻辑抽象化
2. 渲染劫持
3. 抽象化和操作状态（state）
4. 操作属性（props）

## 如何为高阶组件创建属性代理?

你可以使用属性代理模式向输入组件增加或编辑属性（props）：

``` jsx
function HOC(WrappedComponent) {
  return class Test extends Component {
    render() {
      const newProps = {
        title: 'New Header',
        footer: false,
        showFeatureX: false,
        showFeatureY: true
      };

      return <WrappedComponent {...this.props} {...newProps} />
    }
  }
}
```

## 什么是上下文（Context）?

Context 通过组件树提供了一个传递数据的方法，从而避免了在每一个层级手动的传递props。比如，需要在应用中许多组件需要访问登录用户信息、地区偏好、UI主题等。

``` jsx
// 创建一个 theme Context,  默认 theme 的值为 light
const ThemeContext = React.createContext('light');

function ThemedButton(props) {
  // ThemedButton 组件从 context 接收 theme
  return (
    <ThemeContext.Consumer>
      {theme => <Button {...props} theme={theme} />}
    </ThemeContext.Consumer>
  );
}

// 中间组件
function Toolbar(props) {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

class App extends React.Component {
  render() {
    return (
      <ThemeContext.Provider value="dark">
        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}
```

## children 属性是什么?

Children 是一个属性（`this.props.chldren`），它允许你将组件作为数据传递给其他组件，就像你使用的任何其他组件一样。在组件的开始和结束标记之间放置的组件树将作为children属性传递给该组件。

React API 中有许多方法中提供了这个不透明数据结构的方法，包括：`React.Children.map`、`React.Children.forEach`、`React.Children.count`、`React.Children.only`、`React.Children.toArray`。

``` jsx
const MyDiv = React.createClass({
  render: function() {
    return <div>{this.props.children}</div>
  }
})

ReactDOM.render(
  <MyDiv>
    <span>{'Hello'}</span>
    <span>{'World'}</span>
  </MyDiv>,
  node
)
```

## 怎样在 React 中写注释?

React/JSX 中的注释类似于 JavaScript 的多行注释，但是是用大括号括起来。

单行注释：

``` jsx
<div>
  {/* 单行注释（在原生 JavaScript 中，单行注释用双斜杠（//）表示） */}
  {`Welcome ${user}, let's play React`}
</div>
```

多行注释：

``` jsx
<div>
  {/* 多行注释超过
   一行 */}
  {`Welcome ${user}, let's play React`}
</div>
```

## 构造函数使用带 props 参数的目的是什么?

在调用super()方法之前，子类构造函数不能使用this引用。这同样适用于ES6子类。将props参数传递给super()的主要原因是为了在子构造函数中访问this.props。

带 props 参数:

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props)

    console.log(this.props) // prints { name: 'John', age: 42 }
  }
}
```

不带 props 参数:

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super()

    console.log(this.props) // prints undefined

    // but props parameter is still available
    console.log(props) // prints { name: 'John', age: 42 }
  }

  render() {
    // no difference outside constructor
    console.log(this.props) // prints { name: 'John', age: 42 }
  }
}
```
上面的代码片段显示this.props仅在构造函数中有所不同。 它在构造函数之外是相同的。

## 什么是调解?

当组件的props或state发生更改时，React 通过将新返回的元素与先前呈现的元素进行比较来确定是否需要实际的 DOM 更新。当它们不相等时，React 将更新 DOM 。此过程称为reconciliation。

## 如何使用动态属性名设置 state ?

如果你使用 ES6 或 Babel 转换器来转换你的 JSX 代码，那么你可以使用计算属性名称来完成此操作。

``` jsx
handleInputChange(event) {
  this.setState({ [event.target.id]: event.target.value })
}
```

## 每次组件渲染时调用函数的常见错误是什么?

你需要确保在将函数作为参数传递时未调用该函数。

``` jsx
render() {
  // Wrong: handleClick is called instead of passed as a reference!
  return <button onClick={this.handleClick()}>{'Click Me'}</button>
}
```

相反地，传递函数本身应该没有括号：

``` jsx
render() {
  // Correct: handleClick is passed as a reference!
  return <button onClick={this.handleClick}>{'Click Me'}</button>
}
```

## 为什么有组件名称要首字母大写?

这是必要的，因为组件不是 DOM 元素，它们是构造函数。 此外，在 JSX 中，小写标记名称是指 HTML 元素，而不是组件。

## 为什么 React 使用 className 而不是 class 属性?

class 是 JavaScript 中的关键字，而 JSX 是 JavaScript 的扩展。这就是为什么 React 使用 className 而不是 class 的主要原因。传递一个字符串作为 className 属性。

``` jsx
render() {
  return <span className={'menu navigation-menu'}>{'Menu'}</span>
}
```

在实际项目中，我们经常使用classnames来方便我们操作className。

## 什么是 Fragments ?

它是 React 中的常见模式，用于组件返回多个元素。Fragments 可以让你聚合一个子元素列表，而无需向 DOM 添加额外节点。

``` jsx
render() {
  return (
    <React.Fragment>
      <ChildA />
      <ChildB />
      <ChildC />
    </React.Fragment>
  )
}
```

以下是简洁语法，但是在一些工具中还不支持：

``` jsx
render() {
  return (
    <>
      <ChildA />
      <ChildB />
      <ChildC />
    </>
  )
}
```

译注：React 16 以前，render 函数的返回必须有一个根节点，否则报错。

## 为什么使用 Fragments 比使用容器 div 更好?

1. 通过不创建额外的 DOM 节点，Fragments 更快并且使用更少的内存。这在非常大而深的节点树时很有好处。
2. 一些 CSS 机制如Flexbox和CSS Grid具有特殊的父子关系，如果在中间添加 div 将使得很难保持所需的结构。
3. 在 DOM 审查器中不会那么的杂乱。

## 在 React 中什么是 Portal ?

Portal 提供了一种很好的将子节点渲染到父组件以外的 DOM 节点的方式。

``` jsx
ReactDOM.createPortal(child, container)
```
第一个参数是任何可渲染的 React 子节点，例如元素，字符串或片段。第二个参数是 DOM 元素。

## 什么是无状态组件?

如果行为独立于其状态，则它可以是无状态组件。你可以使用函数或类来创建无状态组件。但除非你需要在组件中使用生命周期钩子，否则你应该选择函数组件。无状态组件有很多好处： 它们易于编写，理解和测试，速度更快，而且你可以完全避免使用this关键字。

## 什么是有状态组件?

如果组件的行为依赖于组件的state，那么它可以被称为有状态组件。这些有状态组件总是类组件，并且具有在constructor中初始化的状态。

``` jsx
class App extends Component {
  constructor(props) {
    super(props)
    this.state = { count: 0 }
  }

  render() {
    // ...
  }
}
```

## 在 React 中如何校验 props 属性?

当应用程序以开发模式运行的时，React 将会自动检查我们在组件上设置的所有属性，以确保它们具有正确的类型。如果类型不正确，React 将在控制台中生成警告信息。由于性能影响，它在生产模式下被禁用。使用 isRequired 定义必填属性。

预定义的 prop 类型：

1. PropTypes.number
2. PropTypes.string
3. PropTypes.array
4. PropTypes.object
5. PropTypes.func
6. PropTypes.node
7. PropTypes.element
8. PropTypes.bool
9. PropTypes.symbol
10. PropTypes.any

我们可以为 User 组件定义 propTypes，如下所示：

``` jsx
import React from 'react'
import PropTypes from 'prop-types'

class User extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired
  }

  render() {
    return (
      <>
        <h1>{`Welcome, ${this.props.name}`}</h1>
        <h2>{`Age, ${this.props.age}`}</h2>
      </>
    )
  }
}
```

**注意:** 在 React v15.5 中，PropTypes 从 React.PropTypes 被移动到 prop-types 库中。

## React 的优点是什么?

1. 使用 Virtual DOM 提高应用程序的性能。
2. JSX 使代码易于读写。
3. 它支持在客户端和服务端渲染。
4. 易于与框架（Angular，Backbone）集成，因为它只是一个视图库。
5. 使用 Jest 等工具轻松编写单元与集成测试。

## React 的局限性是什么?

1. React 只是一个视图库，而不是一个完整的框架。
2. 对于 Web 开发初学者来说，有一个学习曲线。
3. 将 React 集成到传统的 MVC 框架中需要一些额外的配置。
4. 代码复杂性随着内联模板和 JSX 的增加而增加。
5. 如果有太多的小组件可能增加项目的庞大和复杂。

## 在 React v16 中的错误边界是什么?

错误边界是在其子组件树中的任何位置捕获 JavaScript 错误、记录这些错误并显示回退 UI 而不是崩溃的组件树的组件。

如果一个类组件定义了一个名为 `componentDidCatch(error, info)` 或 `static getDerivedStateFromError()` 新的生命周期方法，则该类组件将成为错误边界：

``` jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    logErrorToMyService(error, info)
  }

  static getDerivedStateFromError(error) {
     // Update state so the next render will show the fallback UI.
     return { hasError: true };
   }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>{'Something went wrong.'}</h1>
    }
    return this.props.children
  }
}
```

之后，将其作为常规组件使用：

``` jsx
<ErrorBoundary>
  <MyWidget />
</ErrorBoundary>
```

## 在 React v15 中如何处理错误边界?

React v15 使用 `unstable_handleError` 方法为错误边界提供了非常基础的支持。已在 React v16 中，将其重命名为`componentDidCatch`。

## 静态类型检查推荐的方法是什么?

通常，我们使用 PropTypes 库（在 React v15.5 之后 `React.PropTypes` 被移动到了 `prop-types` 包中），在 React 应用程序中执行类型检查。对于大型项目，建议使用静态类型检查器，比如 Flow 或 TypeScript，它们在编译时执行类型检查并提供 `auto-completion` 功能。

## react-dom 包的用途是什么?

`react-dom` 包提供了特定的 DOM 方法，可以在应用程序的顶层使用。大多数的组件不需要使用此模块。该模块中提供的一些方法如下：

1. render()
2. hydrate()
3. unmountComponentAtNode()
4. findDOMNode()
5. createPortal()

## react-dom 中 render 方法的目的是什么?

此方法用于将 React 元素渲染到所提供容器中的 DOM 结构中，并返回对组件的引用。如果 React 元素之前已被渲染到容器中，它将对其执行更新，并且只在需要时改变 DOM 以反映最新的更改。

``` jsx
ReactDOM.render(element, container[, callback])
```

如果提供了可选的回调函数，该函数将在组件被渲染或更新后执行。

## ReactDOMServer 是什么?

`ReactDOMServer` 对象使你能够将组件渲染为静态标记（通常用于 Node 服务器中），此对象主要用于服务端渲染（SSR）。以下方法可用于服务器和浏览器环境：

1. renderToString()
2. renderToStaticMarkup()

例如，你通常运行基于 Node 的 Web 服务器，如 Express，Hapi 或 Koa，然后你调用 renderToString 将根组件渲染为字符串，然后作为响应进行发送。

``` jsx
// using Express
import { renderToString } from 'react-dom/server'
import MyPage from './MyPage'

app.get('/', (req, res) => {
  res.write('<!DOCTYPE html><html><head><title>My Page</title></head><body>')
  res.write('<div id="content">')
  res.write(renderToString(<MyPage/>))
  res.write('</div></body></html>')
  res.end()
})
```

## 在 React 中如何使用 innerHTML?

`dangerouslySetInnerHTML` 属性是 React 用来替代在浏览器 DOM 中使用 innerHTML。与 innerHTML 一样，考虑到跨站脚本攻击（XSS），使用此属性也是有风险的。使用时，你只需传递以 __html 作为键，而 HTML 文本作为对应值的对象。

在本示例中 MyComponent 组件使用 `dangerouslySetInnerHTML` 属性来设置 HTML 标记：

``` jsx
function createMarkup() {
  return { __html: 'First &middot; Second' }
}

function MyComponent() {
  return <div dangerouslySetInnerHTML={createMarkup()} />
}
```

## 如何在 React 中使用样式?

style 属性接受含有 camelCased（驼峰）属性的 JavaScript 对象，而不是 CSS 字符串。这与 DOM 样式中的 JavaScript 属性一致，效率更高，并且可以防止 XSS 安全漏洞。

``` jsx
const divStyle = {
  color: 'blue',
  backgroundImage: 'url(' + imgUrl + ')'
};

function HelloWorldComponent() {
  return <div style={divStyle}>Hello World!</div>
}
```

为了与在 JavaScript 中访问 DOM 节点上的属性保持一致，样式键采用了 camelcased（例如`node.style.backgroundImage`）。

## 在 React 中事件有何不同?

处理 React 元素中的事件有一些语法差异：

1. React 事件处理程序是采用驼峰而不是小写来命名的。
2. 使用 JSX，你将传递一个函数作为事件处理程序，而不是字符串。

## 如果在构造函数中使用 setState() 会发生什么?

当你使用 `setState()` 时，除了设置状态对象之外，React 还会重新渲染组件及其所有的子组件。你会得到这样的错误：`Can only update a mounted or mounting component.`。因此我们需要在构造函数中使用 `this.state `初始化状态。

## 索引作为键的影响是什么?

Keys 应该是稳定的，可预测的和唯一的，这样 React 就能够跟踪元素。

在下面的代码片段中，每个元素的键将基于列表项的顺序，而不是绑定到即将展示的数据上。这将限制 React 能够实现的优化。

``` jsx
{todos.map((todo, index) =>
  <Todo
    {...todo}
    key={index}
  />
)}
```
假设 todo.id 对此列表是唯一且稳定的，如果将此数据作为唯一键，那么 React 将能够对元素进行重新排序，而无需重新创建它们。

``` jsx
{todos.map((todo) =>
  <Todo {...todo}
    key={todo.id} />
)}
```

## 在 componentWillMount() 方法中使用 setState() 好吗?

建议避免在 componentWillMount() 生命周期方法中执行异步初始化。在 mounting 发生之前会立即调用 componentWillMount()，且它在 render() 之前被调用，因此在此方法中更新状态将不会触发重新渲染。应避免在此方法中引入任何副作用或订阅操作。我们需要确保对组件初始化的异步调用发生在 componentDidMount() 中，而不是在 componentWillMount() 中。

``` jsx
componentDidMount() {
  axios.get(`api/todos`)
    .then((result) => {
      this.setState({
        messages: [...result.data]
      })
    })
}
```

## 如果在初始状态中使用 props 属性会发生什么?

如果在不刷新组件的情况下更改组件上的属性，则不会显示新的属性值，因为构造函数函数永远不会更新组件的当前状态。只有在首次创建组件时才会用 props 属性初始化状态。

以下组件将不显示更新的输入值：

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      records: [],
      inputValue: this.props.inputValue
    };
  }

  render() {
    return <div>{this.state.inputValue}</div>
  }
}
```

在 render 方法使用使用 props 将会显示更新的值：

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      record: []
    }
  }

  render() {
    return <div>{this.props.inputValue}</div>
  }
}
```

## 如何有条件地渲染组件?

在某些情况下，你希望根据某些状态渲染不同的组件。 JSX 不会渲染 `false` 或 `undefined`，因此你可以使用 `&&` 运算符，在某个条件为 `true` 时，渲染组件中指定的内容。

``` jsx
const MyComponent = ({ name, address }) => (
  <div>
    <h2>{name}</h2>
    {address &&
      <p>{address}</p>
    }
  </div>
)
```

如果你需要一个 `if-else` 条件，那么使用三元运算符：

``` jsx
const MyComponent = ({ name, address }) => (
  <div>
    <h2>{name}</h2>
    {address
      ? <p>{address}</p>
      : <p>{'Address is not available'}</p>
    }
  </div>
)
```

## 为什么在 DOM 元素上展开 props 需要小心?

当我们展开属性时，我们会遇到添加未知 HTML 属性的风险，这是一种不好的做法。相反，我们可以使用属性解构和...rest 运算符，因此它只添加所需的 props 属性。例如，

``` jsx
const ComponentA = () =>
  <ComponentB isDisplay={true} className={'componentStyle'} />

const ComponentB = ({ isDisplay, ...domProps }) =>
  <div {...domProps}>{'ComponentB'}</div>
```

## 在 React 中如何使用装饰器?
你可以装饰你的类组件，这与将组件传递到函数中是一样的。 装饰器是修改组件功能灵活且易读的方式。

``` jsx
@setTitle('Profile')
class Profile extends React.Component {
    //....
}

/*
  title is a string that will be set as a document title
  WrappedComponent is what our decorator will receive when
  put directly above a component class as seen in the example above
*/
const setTitle = (title) => (WrappedComponent) => {
  return class extends React.Component {
    componentDidMount() {
      document.title = title
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }
}
```

## 如何 memoize（记忆）组件?
有可用于函数组件的 memoize 库。例如 moize 库可以将组件存储在另一个组件中。

``` jsx
import moize from 'moize'
import Component from './components/Component' // this module exports a non-memoized component

const MemoizedFoo = moize.react(Component)

const Consumer = () => {
  <div>
    {'I will memoize the following entry:'}
    <MemoizedFoo/>
  </div>
}
```

## 如何实现 Server Side Rendering 或 SSR?

React 已经配备了用于处理 Node 服务器上页面渲染的功能。你可以使用特殊版本的 DOM 渲染器，它遵循与客户端相同的模式。

``` jsx
import ReactDOMServer from 'react-dom/server'
import App from './App'

ReactDOMServer.renderToString(<App />)
```

此方法将以字符串形式输出常规 HTML，然后将其作为服务器响应的一部分放在页面正文中。在客户端，React 检测预渲染的内容并无缝地衔接。

## 如何在 React 中启用生产模式?

你应该使用 Webpack 的 `DefinePlugin` 方法将 `NODE_ENV` 设置为 `production`，通过它你可以去除 `propType` 验证和额外警告等内容。除此之外，如果你压缩代码，如使用 `Uglify` 的死代码消除，以去掉用于开发的代码和注释，它将大大减少包的大小。

## 什么是 CRA 及其好处?
`create-react-app` CLI 工具允许你无需配置步骤，快速创建和运行 React 应用。

让我们使用 CRA 来创建 Todo 应用：

``` shell
# Installation
$ npm install -g create-react-app

# Create new project
$ create-react-app todo-app
$ cd todo-app

# Build, test and run
$ npm run build
$ npm run test
$ npm start
```

它包含了构建 React 应用程序所需的一切：

1. React, JSX, ES6, 和 Flow 语法支持。
2. ES6 之外的语言附加功能，比如对象扩展运算符。
3. Autoprefixed CSS，因此你不在需要 -webkit- 或其他前缀。
4. 一个快速的交互式单元测试运行程序，内置了对覆盖率报告的支持。
5. 一个实时开发服务器，用于警告常见错误。
6. 一个构建脚本，用于打包用于生产中包含 hashes 和 sourcemaps 的 JS、CSS 和 Images 文件。

## 在 mounting 阶段生命周期方法的执行顺序是什么?

在创建组件的实例并将其插入到 DOM 中时，将按以下顺序调用生命周期方法。

1. constructor()
2. static getDerivedStateFromProps()
3. render()
4. componentDidMount()

## 在 React v16 中，哪些生命周期方法将被弃用?

以下生命周期方法将成为不安全的编码实践，并且在异步渲染方面会更有问题。

1. componentWillMount()
2. componentWillReceiveProps()
3. componentWillUpdate()

从 React v16.3 开始，这些方法使用 UNSAFE_ 前缀作为别名，未加前缀的版本将在 React v17 中被移除。

## 生命周期方法 `getDerivedStateFromProps()` 的目的是什么?
新的静态 `getDerivedStateFromProps()` 生命周期方法在实例化组件之后以及重新渲染组件之前调用。它可以返回一个对象用于更新状态，或者返回 null 指示新的属性不需要任何状态更新。

``` jsx
class MyComponent extends React.Component {
  static getDerivedStateFromProps(props, state) {
    // ...
  }
}
```

此生命周期方法与 `componentDidUpdate()` 一起涵盖了 `componentWillReceiveProps()` 的所有用例。

## 生命周期方法 `getSnapshotBeforeUpdate()` 的目的是什么?

新的 `getSnapshotBeforeUpdate()` 生命周期方法在 DOM 更新之前被调用。此方法的返回值将作为第三个参数传递给componentDidUpdate()。

``` jsx
class MyComponent extends React.Component {
  getSnapshotBeforeUpdate(prevProps, prevState) {
    // ...
  }
}
```

此生命周期方法与 `componentDidUpdate()` 一起涵盖了 `componentWillUpdate()` 的所有用例。

## 推荐的组件命名方法是什么?

建议通过引用命名组件，而不是使用 displayName。

使用 displayName 命名组件:

``` jsx
export default React.createClass({
  displayName: 'TodoApp',
  // ...
})
```

推荐的方式：

``` jsx
export default class TodoApp extends React.Component {
  // ...
}
```

## 在组件类中方法的推荐顺序是什么?

从 mounting 到 render stage 阶段推荐的方法顺序：

1. static 方法
2. constructor()
3. getChildContext()
4. componentWillMount()
5. componentDidMount()
6. componentWillReceiveProps()
7. shouldComponentUpdate()
8. componentWillUpdate()
9. componentDidUpdate()
10. componentWillUnmount()
11. 点击处理程序或事件处理程序，如 onClickSubmit() 或 onChangeDescription()
12. 用于渲染的getter方法，如 getSelectReason() 或 getFooterContent()
13. 可选的渲染方法，如 renderNavigation() 或 renderProfilePicture()
14. render()

## 什么是 switching 组件?

switching 组件是渲染多个组件之一的组件。我们需要使用对象将 prop 映射到组件中。

例如，以下的 switching 组件将基于 page 属性显示不同的页面：

``` jsx
import HomePage from './HomePage'
import AboutPage from './AboutPage'
import ServicesPage from './ServicesPage'
import ContactPage from './ContactPage'

const PAGES = {
  home: HomePage,
  about: AboutPage,
  services: ServicesPage,
  contact: ContactPage
}

const Page = (props) => {
  const Handler = PAGES[props.page] || ContactPage

  return <Handler {...props} />
}

// The keys of the PAGES object can be used in the prop types to catch dev-time errors.
Page.propTypes = {
  page: PropTypes.oneOf(Object.keys(PAGES)).isRequired
}
```

## 为什么我们需要将函数传递给 setState() 方法?

这背后的原因是 `setState()` 是一个异步操作。出于性能原因，React 会对状态更改进行批处理，因此在调用 `setState()` 方法之后，状态可能不会立即更改。这意味着当你调用 `setState()` 方法时，你不应该依赖当前状态，因为你不能确定当前状态应该是什么。这个问题的解决方案是将一个函数传递给 `setState()`，该函数会以上一个状态作为参数。通过这样做，你可以避免由于 `setState()` 的异步性质而导致用户在访问时获取旧状态值的问题。

假设初始计数值为零。在连续三次增加操作之后，该值将只增加一个。

``` jsx
// assuming this.state.count === 0
this.setState({ count: this.state.count + 1 })
this.setState({ count: this.state.count + 1 })
this.setState({ count: this.state.count + 1 })
// this.state.count === 1, not 3
如果将函数传递给 setState()，则 count 将正确递增。

this.setState((prevState, props) => ({
  count: prevState.count + props.increment
}))
// this.state.count === 3 as expected
```

## 在 React 中什么是严格模式?
React.StrictMode 是一个有用的组件，用于突出显示应用程序中的潜在问题。就像 `<Fragment>`，`<StrictMode>` 一样，它们不会渲染任何额外的 DOM 元素。它为其后代激活额外的检查和警告。这些检查仅适用于开发模式。

``` jsx
import React from 'react'

function ExampleApplication() {
  return (
    <div>
      <Header />
      <React.StrictMode>
        <div>
          <ComponentOne />
          <ComponentTwo />
        </div>
      </React.StrictMode>
      <Footer />
    </div>
  )
}
```
在上面的示例中，strict mode 检查仅应用于 `<ComponentOne>` 和 `<ComponentTwo>` 组件。

## React Mixins 是什么?

Mixins 是一种完全分离组件通用功能的方法。 Mixins 不应该被继续使用，可以用高阶组件或装饰器来替换。

最常用的 mixins 是 `PureRenderMixin`。当 props 和状态与之前的 props 和状态相等时，你可能在某些组件中使用它来防止不必要的重新渲染：

``` jsx
const PureRenderMixin = require('react-addons-pure-render-mixin')

const Button = React.createClass({
  mixins: [PureRenderMixin],
  // ...
})
```

## 为什么 isMounted() 是一个反模式，而正确的解决方案是什么?

`isMounted()` 的主要场景是避免在组件卸载后调用 `setState()`，因为它会发出警告。

``` jsx
if (this.isMounted()) {
  this.setState({...})
}
```

在调用 `setState()` 之前检查 `isMounted()` 会消除警告，但也会破坏警告的目的。使用 `isMounted()` 有一种代码味道，因为你要检查的唯一原因是你认为在卸载组件后可能持有引用。

最佳解决方案是找到在组件卸载后调用 `setState()` 的位置，并修复它们。这种情况最常发生在回调中，即组件正在等待某些数据并在数据到达之前卸载。理想情况下，在卸载之前，应在 `componentWillUnmount()` 中取消任何回调。

## React 中支持哪些指针事件?

Pointer Events 提供了处理所有输入事件的统一方法。在过去，我们有一个鼠标和相应的事件监听器来处理它们，但现在我们有许多与鼠标无关的设备，比如带触摸屏的手机或笔。我们需要记住，这些事件只能在支持 Pointer Events 规范的浏览器中工作。

目前以下事件类型在 React DOM 中是可用的：

1. onPointerDown
2. onPointerMove
3. onPointerUp
4. onPointerCancel
5. onGotPointerCapture
6. onLostPointerCaptur
7. onPointerEnter
8. onPointerLeave
9. onPointerOver
10. onPointerOut

## 为什么组件名称应该以大写字母开头?

如果使用 JSX 渲染组件，则该组件的名称必须以大写字母开头，否则 React 将会抛出无法识别标签的错误。这种约定是因为只有 HTML 元素和 SVG 标签可以以小写字母开头。

定义组件类的时候，你可以以小写字母开头，但在导入时应该使用大写字母。

``` jsx
class myComponent extends Component {
  render() {
    return <div />
  }
}

export default myComponent
```

当在另一个文件导入时，应该以大写字母开头：

``` jsx
import MyComponent from './MyComponent'
```

## 在 React v16 中是否支持自定义 DOM 属性?
是的，在过去 React 会忽略未知的 DOM 属性。如果你编写的 JSX 属性 React 无法识别，那么 React 将跳过它。例如：

``` jsx
<div mycustomattribute={'something'} />
```

在 React 15 中将在 DOM 中渲染一个空的 div：

``` jsx
<div />
```

在 React 16 中，任何未知的属性都将会在 DOM 显示：

``` jsx
<div mycustomattribute='something' />
```

这对于应用特定于浏览器的非标准属性，尝试新的 DOM APIs 与集成第三方库来说非常有用。

## constructor 和 getInitialState 有什么区别?

当使用 ES6 类时，你应该在构造函数中初始化状态，而当你使用 React.createClass() 时，就需要使用 getInitialState() 方法。

使用 ES6 类:

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = { /* initial state */ }
  }
}
```

使用 `React.createClass()`:

``` jsx
const MyComponent = React.createClass({
  getInitialState() {
    return { /* initial state */ }
  }
})
```

**注意：** 在 React v16 中 `React.createClass()` 已被弃用和删除，请改用普通的 JavaScript 类。

## 是否可以在不调用 setState 方法的情况下，强制组件重新渲染?

默认情况下，当组件的状态或属性改变时，组件将重新渲染。如果你的 `render()` 方法依赖于其他数据，你可以通过调用 `forceUpdate()` 来告诉 React，当前组件需要重新渲染。

``` jsx
component.forceUpdate(callback)
```

建议避免使用 `forceUpdate()`，并且只在 `render()` 方法中读取 `this.props` 和 `this.state`。

## 在使用 ES6 类的 React 中 `super()` 和 `super(props)` 有什么区别?

当你想要在 `constructor()` 函数中访问 `this.props`，你需要将 `props` 传递给 `super()` 方法。

使用 super(props):

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props)
    console.log(this.props) // { name: 'John', ... }
  }
}
```

使用 super():

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super()
    console.log(this.props) // undefined
  }
}
```

在 `constructor()` 函数之外，访问 `this.props` 属性会显示相同的值。

## 在 JSX 中如何进行循环?

你只需使用带有 ES6 箭头函数语法的 `Array.prototype.map` 即可。例如，`items` 对象数组将会被映射成一个组件数组：

``` jsx
<tbody>
  {items.map(item => <SomeComponent key={item.id} name={item.name} />)}
</tbody>
```

你不能使用 for 循环进行迭代：

``` jsx
<tbody>
  for (let i = 0; i < items.length; i++) {
    <SomeComponent key={items[i].id} name={items[i].name} />
  }
</tbody>
```

这是因为 JSX 标签会被转换成函数调用，并且你不能在表达式中使用语句。但这可能会由于 `do` 表达式而改变，它们是第一阶段提案。

## 如何在 attribute 引号中访问 props 属性?

React (或 JSX) 不支持属性值内的变量插值。下面的形式将不起作用：

``` jsx
<img className='image' src='images/{this.props.image}' />
```

但你可以将 JS 表达式作为属性值放在大括号内。所以下面的表达式是有效的：

``` jsx
<img className='image' src={'images/' + this.props.image} />
```

使用模板字符串也是可以的：

``` jsx
<img className='image' src={`images/${this.props.image}`} />
```

## 什么是 React proptype 数组?

如果你要规范具有特定对象格式的数组的属性，请使用 `React.PropTypes.shape()` 作为 `React.PropTypes.arrayOf()` 的参数。

``` jsx
ReactComponent.propTypes = {
  arrayWithShape: React.PropTypes.arrayOf(React.PropTypes.shape({
    color: React.PropTypes.string.isRequired,
    fontSize: React.PropTypes.number.isRequired
  })).isRequired
}
```

## 如何有条件地应用样式类?

你不应该在引号内使用大括号，因为它将被计算为字符串。

``` jsx
<div className="btn-panel {this.props.visible ? 'show' : 'hidden'}">
```

相反，你需要将大括号移到外部（不要忘记在类名之间添加空格）：

``` jsx
<div className={'btn-panel ' + (this.props.visible ? 'show' : 'hidden')}>
```

模板字符串也可以工作：

``` jsx
<div className={`btn-panel ${this.props.visible ? 'show' : 'hidden'}`}>
```

## React 和 ReactDOM 之间有什么区别?

`react` 包中包含 `React.createElement()`, `React.Component`, `React.Children`，以及与元素和组件类相关的其他帮助程序。你可以将这些视为构建组件所需的同构或通用帮助程序。`react-dom` 包中包含了 `ReactDOM.render()`，在 `react-dom/server` 包中有支持服务端渲染的 `ReactDOMServer.renderToString()` 和 `ReactDOMServer.renderToStaticMarkup()` 方法。

## 为什么 ReactDOM 从 React 分离出来?

React 团队致力于将所有的与 DOM 相关的特性抽取到一个名为 ReactDOM 的独立库中。React v0.14 是第一个拆分后的版本。通过查看一些软件包，`react-native`，`react-art`，`react-canvas`，和 `react-three`，很明显，React 的优雅和本质与浏览器或 DOM 无关。为了构建更多 React 能应用的环境，React 团队计划将主要的 React 包拆分成两个：`react` 和 `react-dom`。这为编写可以在 React 和 React Native 的 Web 版本之间共享的组件铺平了道路。

## 如何使用 React label 元素?

如果你尝试使用标准的 for 属性将 `<label>` 元素绑定到文本输入框，那么在控制台将会打印缺少 HTML 属性的警告消息。

``` jsx
<label for={'user'}>{'User'}</label>
<input type={'text'} id={'user'} />
```

因为 for 是 JavaScript 的保留字，请使用 htmlFor 来替代。

``` jsx
<label htmlFor={'user'}>{'User'}</label>
<input type={'text'} id={'user'} />
```

## 如何合并多个内联的样式对象?

在 React 中，你可以使用扩展运算符:

``` jsx
<button style={{...styles.panel.button, ...styles.panel.submitButton}}>{'Submit'}</button>
```

如果你使用的是 React Native，则可以使用数组表示法：

``` jsx
<button style={[styles.panel.button, styles.panel.submitButton]}>{'Submit'}</button>
```

## 如何在调整浏览器大小时重新渲染视图?

你可以在 componentDidMount() 中监听 resize 事件，然后更新尺寸（width 和 height）。你应该在 componentWillUnmount() 方法中移除监听。

``` jsx
class WindowDimensions extends React.Component {
  componentWillMount() {
    this.updateDimensions()
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions)
  }

  updateDimensions() {
    this.setState({width: $(window).width(), height: $(window).height()})
  }

  render() {
    return <span>{this.state.width} x {this.state.height}</span>
  }
}
```

## `setState()` 和 `replaceState()` 方法之间有什么区别?

当你使用 `setState()` 时，当前和先前的状态将被合并。`replaceState()` 会抛出当前状态，并仅用你提供的内容替换它。通常使用 `setState()`，除非你出于某种原因确实需要删除所有以前的键。你还可以在 `setState()` 中将状态设置为 false/null，而不是使用 `replaceState()`。

## 如何监听状态变化?

当状态更改时将调用以下生命周期方法。你可以将提供的状态和属性值与当前状态和属性值进行比较，以确定是否发生了有意义的改变。

``` jsx
componentWillUpdate(object nextProps, object nextState)
componentDidUpdate(object prevProps, object prevState)
```

## 在 React 状态中删除数组元素的推荐方法是什么?

更好的方法是使用 Array.prototype.filter() 方法。

例如，让我们创建用于更新状态的 removeItem() 方法。

``` jsx
removeItem(index) {
  this.setState({
    data: this.state.data.filter((item, i) => i !== index)
  })
}
```

## 在 React 中是否可以不在页面上渲染 HTML 内容?

可以使用最新的版本 (>=16.2)，以下是可能的选项：

``` jsx
render() {
  return false
}
```

``` jsx
render() {
  return null
}
```

``` jsx
render() {
  return []
}
```

``` jsx
render() {
  return <React.Fragment></React.Fragment>
}
```

``` jsx
render() {
  return <></>
}
```

返回 `undefined` 是无效的。

## 如何用 React 漂亮地显示 JSON?

我们可以使用 `<pre>` 标签，以便保留 JSON.stringify() 的格式：

``` jsx
const data = { name: 'John', age: 42 }

class User extends React.Component {
  render() {
    return (
      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }
}

React.render(<User />, document.getElementById('container'))
```

## 为什么你不能更新 React 中的 props?

React 的哲学是 props 应该是 immutable 和 top-down。这意味着父级可以向子级发送任何属性值，但子级不能修改接收到的属性。

## 如何在页面加载时聚焦一个输入元素?

你可以为 input 元素创建一个 ref，然后在 componentDidMount() 方法中使用它：

``` jsx
class App extends React.Component{
  componentDidMount() {
    this.nameInput.focus()
  }

  render() {
    return (
      <div>
        <input
          defaultValue={'Won\'t focus'}
        />
        <input
          ref={(input) => this.nameInput = input}
          defaultValue={'Will focus'}
        />
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))
```

## 更新状态中的对象有哪些可能的方法?

- 1. 用一个对象调用 setState() 来与状态合并：

  - 使用 Object.assign() 创建对象的副本：

    ``` jsx
    const user = Object.assign({}, this.state.user, { age: 42 })
    this.setState({ user })
    ```

  - 使用扩展运算符：

    ``` jsx
    const user = { ...this.state.user, age: 42 }
    this.setState({ user })
    ```

- 2. 使用一个函数调用 setState()：

``` jsx
this.setState(prevState => ({
  user: {
    ...prevState.user,
    age: 42
  }
}))
```

## 为什么函数比对象更适合于 setState()?

出于性能考虑，React 可能将多个 setState() 调用合并成单个更新。这是因为我们可以异步更新 this.props 和 this.state，所以不应该依赖它们的值来计算下一个状态。

以下的 counter 示例将无法按预期更新：

``` jsx
// Wrong
this.setState({
  counter: this.state.counter + this.props.increment,
})
```

首选方法是使用函数而不是对象调用 setState()。该函数将前一个状态作为第一个参数，当前时刻的 props 作为第二个参数。

``` jsx
// Correct
this.setState((prevState, props) => ({
  counter: prevState.counter + props.increment
}))
```

## 我们如何在浏览器中找到当前正在运行的 React 版本?

你可以使用 React.version 来获取版本：

``` jsx
const REACT_VERSION = React.version

ReactDOM.render(
  <div>{`React version: ${REACT_VERSION}`}</div>,
  document.getElementById('app')
)
```

## 在 create-react-app 项目中导入 polyfills 的方法有哪些?

1. 从 core-js 中手动导入:

创建一个名为 `polyfills.js` 文件，并在根目录下的 `index.js` 文件中导入它。运行 `npm install core-js` 或 `yarn add core-js` 并导入你所需的功能特性：

``` jsx
import 'core-js/fn/array/find'
import 'core-js/fn/array/includes'
import 'core-js/fn/number/is-nan'
```

2. 使用 Polyfill 服务:

通过将以下内容添加到 `index.html` 中来获取自定义的特定于浏览器的 polyfill：

``` html
<script src='https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Array.prototype.includes'></script>
```

在上面的脚本中，我们必须显式地请求 `Array.prototype.includes` 特性，因为它没有被包含在默认的特性集中。

## 如何在 create-react-app 中使用 https 而不是 http?

你只需要使用 `HTTPS=true` 配置。你可以编辑 `package.json` 中的 `scripts` 部分：

``` json
"scripts": {
  "start": "set HTTPS=true && react-scripts start"
}
```

或直接运行 `set HTTPS=true && npm start`

## 如何避免在 create-react-app 中使用相对路径导入?

在项目的根目录中创建一个名为 .env 的文件，并写入导入路径：

``` shell
NODE_PATH=src/app
```

然后重新启动开发服务器。现在，你应该能够在没有相对路径的情况下导入 src/app 内的任何内容。

## 如何为 React Router 添加 Google Analytics?

在 history 对象上添加一个监听器以记录每个页面的访问：

``` jsx
history.listen(function (location) {
  window.ga('set', 'page', location.pathname + location.search)
  window.ga('send', 'pageview', location.pathname + location.search)
})
```

## 如何每秒更新一个组件?

你需要使用 setInterval() 来触发更改，但也需要在组件卸载时清除计时器，以防止错误和内存泄漏。

``` jsx
componentDidMount() {
  this.interval = setInterval(() => this.setState({ time: Date.now() }), 1000)
}

componentWillUnmount() {
  clearInterval(this.interval)
}
```

## 如何将 vendor prefixes 应用于 React 中的内联样式?

React不会自动应用 vendor prefixes，你需要手动添加 vendor prefixes。

``` jsx
<div style={{
  transform: 'rotate(90deg)',
  WebkitTransform: 'rotate(90deg)', // note the capital 'W' here
  msTransform: 'rotate(90deg)' // 'ms' is the only lowercase vendor prefix
}} />
```

## 如何使用 React 和 ES6 导入和导出组件?
导出组件时，你应该使用默认导出：

``` jsx
import React from 'react'
import User from 'user'

export default class MyProfile extends React.Component {
  render(){
    return (
      <User type="customer">
        //...
      </User>
    )
  }
}
```

使用 export 说明符，MyProfile 将成为成员并导出到此模块，此外在其他组件中你无需指定名称就可以导入相同的内容。

## 为什么 React 组件名称必须以大写字母开头?

在 JSX 中，小写标签被认为是 HTML 标签。但是，含有 `.` 的大写和小写标签名却不是。

1. `<component />` 将被转换为 `React.createElement('component')` (i.e, HTML 标签)
2. `<obj.component />` 将被转换为 `React.createElement(obj.component)`
3. `<Component />` 将被转换为 `React.createElement(Component)`

## 为什么组件的构造函数只被调用一次?

React 协调算法假设如果自定义组件出现在后续渲染的相同位置，则它与之前的组件相同，因此重用前一个实例而不是创建新实例。

## 在 React 中如何定义常量?

你可以使用 ES7 的 static 来定义常量。

``` jsx
class MyComponent extends React.Component {
  static DEFAULT_PAGINATION = 10
}
```

## 在 React 中如何以编程方式触发点击事件?

你可以使用 ref 属性通过回调函数获取对底层的 HTMLinputeElement 对象的引用，并将该引用存储为类属性，之后你就可以利用该引用在事件回调函数中， 使用 HTMLElement.click 方法触发一个点击事件。这可以分为两个步骤：

1. 在 render 方法创建一个 ref：

``` jsx
<input ref={input => this.inputElement = input} />
```

2. 在事件处理器中触发点击事件

``` jsx
this.inputElement.click()
```

## 在 React 中是否可以使用 async/await?

如果要在 React 中使用 `async`/`await`，则需要 Babel 和 `transform-async-to-generator` 插件。

## React 项目常见的文件结构是什么?

React 项目文件结构有两种常见的实践。

1. 按功能或路由分组:

构建项目的一种常见方法是将 CSS，JS 和测试用例放在一起，按功能或路由分组。

``` folder
common/
├─ Avatar.js
├─ Avatar.css
├─ APIUtils.js
└─ APIUtils.test.js
feed/
├─ index.js
├─ Feed.js
├─ Feed.css
├─ FeedStory.js
├─ FeedStory.test.js
└─ FeedAPI.js
profile/
├─ index.js
├─ Profile.js
├─ ProfileHeader.js
├─ ProfileHeader.css
└─ ProfileAPI.js
```

2. 按文件类型分组:

另一种流行的项目结构组织方法是将类似的文件组合在一起。

``` folder
api/
├─ APIUtils.js
├─ APIUtils.test.js
├─ ProfileAPI.js
└─ UserAPI.js
components/
├─ Avatar.js
├─ Avatar.css
├─ Feed.js
├─ Feed.css
├─ FeedStory.js
├─ FeedStory.test.js
├─ Profile.js
├─ ProfileHeader.js
└─ ProfileHeader.css
```

## 最流行的动画软件包是什么?

React Transition Group 和 React Motion 是React生态系统中流行的动画包。

## 模块化样式文件有什么好处?

建议避免在组件中对样式值进行硬编码。任何可能在不同的 UI 组件之间使用的值都应该提取到它们自己的模块中。

例如，可以将这些样式提取到单独的组件中：

``` js
export const colors = {
  white,
  black,
  blue
}

export const space = [
  0,
  8,
  16,
  32,
  64
]
```

然后在其他组件中单独导入：

``` js
import { space, colors } from './styles'
```

## 什么是 React 流行的特定 linters?

ESLint 是一个流行的 JavaScript linter。有一些插件可以分析特定的代码样式。在 React 中最常见的一个是名为 `eslint-plugin-react` npm 包。默认情况下，它将使用规则检查许多最佳实践，检查内容从迭代器中的键到一组完整的 prop 类型。另一个流行的插件是 `eslint-plugin-jsx-a11y`，它将帮助修复可访问性的常见问题。由于 JSX 提供的语法与常规 HTML 略有不同，因此常规插件无法获取 alt 文本和 tabindex 的问题。

## 如何发起 AJAX 调用以及应该在哪些组件生命周期方法中进行 AJAX 调用?

你可以使用 AJAX 库，如 Axios，jQuery AJAX 和浏览器内置的 `fetch` API。你应该在 `componentDidMount()` 生命周期方法中获取数据。这样当获取到数据的时候，你就可以使用 `setState()` 方法来更新你的组件。

例如，从 API 中获取员工列表并设置本地状态：

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      employees: [],
      error: null
    }
  }

  componentDidMount() {
    fetch('https://api.example.com/items')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            employees: result.employees
          })
        },
        (error) => {
          this.setState({ error })
        }
      )
  }

  render() {
    const { error, employees } = this.state
    if (error) {
      return <div>Error: {error.message}</div>;
    } else {
      return (
        <ul>
          {employees.map(item => (
            <li key={employee.name}>
              {employee.name}-{employees.experience}
            </li>
          ))}
        </ul>
      )
    }
  }
}
```

## 什么是渲染属性?
Render Props 是一种简单的技术，用于使用值为函数的 prop 属性在组件之间共享代码。下面的组件使用返回 React 元素的 render 属性：

``` jsx
<DataProvider render={data => (
  <h1>{`Hello ${data.target}`}</h1>
)}/>
```

像 React Router 和 DownShift 这样的库使用了这种模式。

## 什么是 React Router?

React Router 是一个基于 React 之上的强大路由库，可以帮助您快速地向应用添加视图和数据流，同时保持 UI 与 URL 同步。

## React Router 与 history 库的区别?

React Router 是`history`库的包装器，它处理浏览器的`window.history`与浏览器和哈希历史的交互。它还提供了内存历史记录，这对于没有全局历史记录的环境非常有用，例如移动应用程序开发（React Native）和使用 Node 进行单元测试。

## 在 React Router v4 中的`<Router>`组件是什么?

React Router v4 提供了以下三种类型的 `<Router>` 组件:

1. `<BrowserRouter>`
2. `<HashRouter>`
3. `<MemoryRouter>`

以上组件将创建browser，hash和memory的 history 实例。React Router v4 通过router对象中的上下文使与您的路由器关联的history实例的属性和方法可用。

## history 中的 `push()` 和 `replace()` 方法的目的是什么?

一个 `history` 实例有两种导航方法：

1. push()
2. replace()

如果您将 `history` 视为一个访问位置的数组，则`push()`将向数组添加一个新位置，`replace()`将用新的位置替换数组中的当前位置。

## 如何使用在 React Router v4 中以编程的方式进行导航?

在组件中实现操作路由/导航有三种不同的方法。

1. 使用withRouter()高阶函数：

withRouter()高阶函数将注入 history 对象作为组件的 prop。该对象提供了push()和replace()方法，以避免使用上下文。

``` jsx
import { withRouter } from 'react-router-dom' // this also works with 'react-router-native'

const Button = withRouter(({ history }) => (
  <button
    type='button'
    onClick={() => { history.push('/new-location') }}
  >
    {'Click Me!'}
  </button>
))
```

2. 使用`<Route>`组件和渲染属性模式：

`<Route>`组件传递与withRouter()相同的属性，因此您将能够通过 history 属性访问到操作历史记录的方法。

``` jsx
import { Route } from 'react-router-dom'

const Button = () => (
  <Route render={({ history }) => (
    <button
      type='button'
      onClick={() => { history.push('/new-location') }}
    >
      {'Click Me!'}
    </button>
  )} />
)
```

3. 使用上下文:

建议不要使用此选项，并将其视为不稳定的API。

``` jsx
const Button = (props, context) => (
  <button
    type='button'
    onClick={() => {
      context.history.push('/new-location')
    }}
  >
    {'Click Me!'}
  </button>
)

Button.contextTypes = {
  history: React.PropTypes.shape({
    push: React.PropTypes.func.isRequired
  })
}
```

## 如何在 React Router v4 中获取查询字符串参数?

在 React Router v4 中并没有内置解析查询字符串的能力，因为多年来一直有用户希望支持不同的实现。因此，使用者可以选择他们喜欢的实现方式。建议的方法是使用 `query-string` 库。

``` js
const queryString = require('query-string');
const parsed = queryString.parse(props.location.search);
```

如果你想要使用原生 API 的话，你也可以使用 `URLSearchParams` ：

``` js
const params = new URLSearchParams(props.location.search)
const foo = params.get('name')
```

如果使用 `URLSearchParams` 的话您应该为 IE11 使用polyfill。

## 为什么你会得到 "Router may have only one child element" 警告?

此警告的意思是Router组件下仅能包含一个子节点。

你必须将你的 Route 包装在`<Switch>`块中，因为`<Switch>`是唯一的，它只提供一个路由。

首先，您需要在导入中添加Switch：

``` jsx
import { Switch, Router, Route } from 'react-router'
```

然后在`<Switch>`块中定义路由：

``` jsx
<Router>
  <Switch>
    <Route {/* ... */} />
    <Route {/* ... */} />
  </Switch>
</Router>
```

## 如何在 React Router v4 中将 params 传递给 `history.push` 方法?

在导航时，您可以将 `props` 传递给`history`对象：

``` jsx
this.props.history.push({
  pathname: '/template',
  search: '?name=sudheer',
  state: { detail: response.data }
})
```

`search`属性用于在`push()`方法中传递查询参数。

## 如何实现默认页面或 404 页面?

`<Switch>`呈现匹配的第一个孩子`<Route>`。 没有路径的`<Route>`总是匹配。所以你只需要简单地删除 `path` 属性，如下所示：

``` jsx
<Switch>
  <Route exact path="/" component={Home}/>
  <Route path="/user" component={User}/>
  <Route component={NotFound} />
</Switch>
```

## 如何在 React Router v4 上获取历史对象?

1. 创建一个导出`history`对象的模块，并在整个项目中导入该模块。

例如， 创建`history.js`文件:

``` jsx
import { createBrowserHistory } from 'history'

export default createBrowserHistory({
  /* pass a configuration object here if needed */
})
```

2. 您应该使用`<Router>`组件而不是内置路由器。在`index.js`文件中导入上面的history.js：

``` jsx
import { Router } from 'react-router-dom'
import history from './history'
import App from './App'

ReactDOM.render((
  <Router history={history}>
    <App />
  </Router>
), holder)
```

3. 您还可以使用类似于内置历史对象的history对象的push方法：

``` js
// some-other-file.js
import history from './history'

history.push('/go-here')
```

## 登录后如何执行自动重定向?

`react-router`包在 React Router 中提供了`<Redirect>`组件。渲染`<Redirect>`将导航到新位置。与服务器端重定向一样，新位置将覆盖历史堆栈中的当前位置。

``` jsx
import React, { Component } from 'react'
import { Redirect } from 'react-router'

export default class LoginComponent extends Component {
  render() {
    if (this.state.isLoggedIn === true) {
      return <Redirect to="/your/redirect/page" />
    } else {
      return <div>{'Login Please'}</div>
    }
  }
}
```

## 什么是 React Intl?

React Intl库使 React 中的内部化变得简单，使用现成的组件和 API ，可以处理从格式化字符串，日期和数字到复数的所有功能。React Intl 是FormatJS的一部分，它通过其组件和 API 提供与 React 的绑定。

## React Intl 的主要特性是什么?

1. 用分隔符显示数字
2. 正确显示日期和时间
3. 显示相对于“现在”的日期
4. 将标签转换为字符串
5. 支持 150 多种语言
6. 支持在浏览器和 Node 中运行
7. 建立在标准之上

## 在 React Intl 中有哪两种格式化方式?

该库提供了两种格式化字符串，数字和日期的方法：React 组件或 API。

``` jsx
<FormattedMessage
  id={'account'}
  defaultMessage={'The amount is less than minimum balance.'}
/>
```

``` js
const messages = defineMessages({
  accountMessage: {
    id: 'account',
    defaultMessage: 'The amount is less than minimum balance.',
  }
})

formatMessage(messages.accountMessage)
```

## 在 React Intl 中如何使用`<FormattedMessage>`作为占位符使用?

react-intl的`<Formatted ... />`组件返回元素，而不是纯文本，因此它们不能用于占位符，替代文本等。在这种情况下，您应该使用较低级别的 API formatMessage()。您可以使用injectIntl()高阶函数将intl对象注入到组件中，然后使用该对象上使用formatMessage()格式化消息。

``` jsx
import React from 'react'
import { injectIntl, intlShape } from 'react-intl'

const MyComponent = ({ intl }) => {
  const placeholder = intl.formatMessage({id: 'messageId'})
  return <input placeholder={placeholder} />
}

MyComponent.propTypes = {
  intl: intlShape.isRequired
}

export default injectIntl(MyComponent)
```

## 如何使用 React Intl 访问当前语言环境?

您可以在应用的任何组件中使用injectIntl()获取的当前语言环境：

``` jsx
import { injectIntl, intlShape } from 'react-intl'

const MyComponent = ({ intl }) => (
  <div>{`The current locale is ${intl.locale}`}</div>
)

MyComponent.propTypes = {
  intl: intlShape.isRequired
}

export default injectIntl(MyComponent)
```


## 如何使用 React Intl 格式化日期?
injectIntl()高阶组件将允许您通过组件中的 props 访问formatDate()方法。 该方法由FormattedDate实例在内部使用，它返回格式化日期的字符串表示。

``` jsx
import { injectIntl, intlShape } from 'react-intl'

const stringDate = this.props.intl.formatDate(date, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
})

const MyComponent = ({intl}) => (
  <div>{`The formatted date is ${stringDate}`}</div>
)

MyComponent.propTypes = {
  intl: intlShape.isRequired
}

export default injectIntl(MyComponent)
```


## 在 React 测试中什么是浅层渲染（Shallow Renderer）?
浅层渲染对于在 React 中编写单元测试用例很有用。它允许您渲染一个一级深的组件并断言其渲染方法返回的内容，而不必担心子组件未实例化或渲染。

例如，如果您有以下组件：

``` jsx
function MyComponent() {
  return (
    <div>
      <span className={'heading'}>{'Title'}</span>
      <span className={'description'}>{'Description'}</span>
    </div>
  )
}
```

然后你可以如下断言：

``` jsx
import ShallowRenderer from 'react-test-renderer/shallow'

// in your test
const renderer = new ShallowRenderer()
renderer.render(<MyComponent />)

const result = renderer.getRenderOutput()

expect(result.type).toBe('div')
expect(result.props.children).toEqual([
  <span className={'heading'}>{'Title'}</span>,
  <span className={'description'}>{'Description'}</span>
])
```

## 在 React 中 TestRenderer 包是什么?

此包提供了一个渲染器，可用于将组件渲染为纯 JavaScript 对象，而不依赖于 DOM 或原生移动环境。该包可以轻松获取由 ReactDOM 或 React Native 平台所渲染的视图层次结构（类似于DOM树）的快照，而无需使用浏览器或jsdom。

``` jsx
import TestRenderer from 'react-test-renderer'

const Link = ({page, children}) => <a href={page}>{children}</a>

const testRenderer = TestRenderer.create(
  <Link page={'https://www.facebook.com/'}>{'Facebook'}</Link>
)

console.log(testRenderer.toJSON())
// {
//   type: 'a',
//   props: { href: 'https://www.facebook.com/' },
//   children: [ 'Facebook' ]
// }
```

## ReactTestUtils 包的目的是什么?

ReactTestUtils由with-addons包提供，允许您对模拟 DOM 执行操作以进行单元测试。

## 什么是 Jest?

Jest是一个由 Facebook 基于 Jasmine 创建的 JavaScript 单元测试框架，提供自动模拟依赖项和jsdom环境。它通常用于测试组件。

## Jest 对比 Jasmine 有什么优势?

与 Jasmine 相比，有几个优点：

- 自动查找在源代码中要执行的测试。
- 在运行测试时自动模拟依赖项。
- 允许您同步测试异步代码。
- 通过 jsdom 使用假的 DOM 实现运行测试，以便可以在命令行上运行测试。
- 在并行流程中运行测试，以便更快完成。

## 举一个简单的 Jest 测试用例
让我们为sum.js文件中添加两个数字的函数编写一个测试：

``` js
const sum = (a, b) => a + b

export default sum
```

创建一个名为sum.test.js的文件，其中包含实际测试：

``` js
import sum from './sum'

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3)
})
```

然后将以下部分添加到package.json：

``` json
{
  "scripts": {
    "test": "jest"
  }
}
```

最后，运行yarn test或npm test，Jest 将打印结果：

``` shell
$ yarn test
PASS ./sum.test.js
✓ adds 1 + 2 to equal 3 (2ms)
```

## 什么是 Flux?

Flux 是应用程序设计范例，用于替代更传统的 MVC 模式。它不是一个框架或库，而是一种新的体系结构，它补充了 React 和单向数据流的概念。在使用 React 时，Facebook 会在内部使用此模式。

## 什么是 Redux?

Redux 是基于 Flux设计模式 的 JavaScript 应用程序的可预测状态容器。Redux 可以与 React 一起使用，也可以与任何其他视图库一起使用。它很小（约2kB）并且没有依赖性。

## Redux 的核心原则是什么？

Redux 遵循三个基本原则：

1. **单一数据来源**： 整个应用程序的状态存储在单个对象树中。单状态树可以更容易地跟踪随时间的变化并调试或检查应用程序。
2. **状态是只读的**： 改变状态的唯一方法是发出一个动作，一个描述发生的事情的对象。这可以确保视图和网络请求都不会直接写入状态。
3. **使用纯函数进行更改**： 要指定状态树如何通过操作进行转换，您可以编写reducers。Reducers 只是纯函数，它将先前的状态和操作作为参数，并返回下一个状态。

## 与 Flux 相比，Redux 的缺点是什么?

我们应该说使用 Redux 而不是 Flux 几乎没有任何缺点。这些如下：

1. **您将需要学会避免突变**： Flux 对变异数据毫不吝啬，但 Redux 不喜欢突变，许多与 Redux 互补的包假设您从不改变状态。您可以使用 dev-only 软件包强制执行此操作，例如redux-immutable-state-invariant，Immutable.js，或指示您的团队编写非变异代码。
2. **您将不得不仔细选择您的软件包**： 虽然 Flux 明确没有尝试解决诸如撤消/重做，持久性或表单之类的问题，但 Redux 有扩展点，例如中间件和存储增强器，以及它催生了丰富的生态系统。
3. **还没有很好的 Flow 集成**： Flux 目前可以让你做一些非常令人印象深刻的静态类型检查，Redux 还不支持。

## mapStateToProps() 和 mapDispatchToProps() 之间有什么区别?

mapStateToProps()是一个实用方法，它可以帮助您的组件获得最新的状态（由其他一些组件更新）：

``` jsx
const mapStateToProps = (state) => {
  return {
    todos: getVisibleTodos(state.todos, state.visibilityFilter)
  }
}
```

mapDispatchToProps()是一个实用方法，它可以帮助你的组件触发一个动作事件（可能导致应用程序状态改变的调度动作）：

``` jsx
const mapDispatchToProps = (dispatch) => {
  return {
    onTodoClick: (id) => {
      dispatch(toggleTodo(id))
    }
  }
}
```

## 我可以在 reducer 中触发一个 Action 吗?

在 reducer 中触发 Action 是**反模式**。您的 reducer 应该没有副作用，只是接收 Action 并返回一个新的状态对象。在 reducer 中添加侦听器和调度操作可能会导致链接的 Action 和其他副作用。

## 如何在组件外部访问 Redux 存储的对象?

是的，您只需要使用createStore()从它创建的模块中导出存储。此外，它不应污染全局窗口对象。

``` jsx
store = createStore(myReducer)

export default store
```

## MVW 模式的缺点是什么?

1. DOM 操作非常昂贵，导致应用程序行为缓慢且效率低下。
2. 由于循环依赖性，围绕模型和视图创建了复杂的模型。
3. 协作型应用程序（如Google Docs）会发生大量数据更改。
4. 如果不添加太多额外代码就无法轻松撤消（及时回退）。

## Redux 和 RxJS 之间是否有任何相似之处?

这些库的目的是不同的，但是存在一些模糊的相似之处。

Redux 是一个在整个应用程序中管理状态的工具。它通常用作 UI 的体系结构。可以将其视为（一半）Angular 的替代品。 RxJS 是一个反应式编程库。它通常用作在 JavaScript 中完成异步任务的工具。把它想象成 Promise 的替代品。 Redux 使用 Reactive 范例，因为Store是被动的。Store 检测到 Action，并自行改变。RxJS也使用 Reactive 范例，但它不是一个体系结构，它为您提供了基本构建块 Observables 来完成这种模式。

## 如何在加载时触发 Action?

您可以在componentDidMount()方法中触发 Action，然后在render()方法中可以验证数据。

``` jsx
class App extends Component {
  componentDidMount() {
    this.props.fetchData()
  }

  render() {
    return this.props.isLoaded
      ? <div>{'Loaded'}</div>
      : <div>{'Not Loaded'}</div>
  }
}

const mapStateToProps = (state) => ({
  isLoaded: state.isLoaded
})

const mapDispatchToProps = { fetchData }

export default connect(mapStateToProps, mapDispatchToProps)(App)
```

## 在 React 中如何使用 Redux 的 connect() ?

您需要按照两个步骤在容器中使用您的 Store：

1. 使用mapStateToProps()： 它将 Store 中的状态变量映射到您指定的属性。

2. 将上述属性连接到容器： mapStateToProps函数返回的对象连接到容器。你可以从react-redux导入connect()。
  ``` jsx
  import React from 'react'
  import { connect } from 'react-redux'

  class App extends React.Component {
    render() {
      return <div>{this.props.containerData}</div>
    }
  }

  function mapStateToProps(state) {
    return { containerData: state.data }
  }

  export default connect(mapStateToProps)(App)
  ```

## 如何在 Redux 中重置状态?

你需要在你的应用程序中编写一个root reducer，它将处理动作委托给combineReducers()生成的 reducer。

例如，让我们在`USER_LOGOUT`动作之后让`rootReducer()`返回初始状态。我们知道，无论 Action 怎么样，当使用undefined作为第一个参数调用它们时，reducers 应该返回初始状态。

``` jsx
const appReducer = combineReducers({
  /* your app's top-level reducers */
})

const rootReducer = (state, action) => {
  if (action.type === 'USER_LOGOUT') {
    state = undefined
  }

  return appReducer(state, action)
}
```

如果使用`redux-persist`，您可能还需要清理存储空间。`redux-persist`在 storage 引擎中保存您的状态副本。首先，您需要导入适当的 storage 引擎，然后在将其设置为undefined之前解析状态并清理每个存储状态键。

``` jsx
const appReducer = combineReducers({
  /* your app's top-level reducers */
})

const rootReducer = (state, action) => {
  if (action.type === 'USER_LOGOUT') {
    Object.keys(state).forEach(key => {
      storage.removeItem(`persist:${key}`)
    })

    state = undefined
  }

  return appReducer(state, action)
}
```

## Redux 中连接装饰器的 `at` 符号的目的是什么?

`@` 符号实际上是用于表示装饰器的 JavaScript 表达式。装饰器可以在设计时注释和修改类和属性。

让我们举个例子，在没有装饰器的情况下设置 Redux 。

- 未使用装饰器:

``` jsx
import React from 'react'
import * as actionCreators from './actionCreators'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

function mapStateToProps(state) {
  return { todos: state.todos }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch) }
}

class MyApp extends React.Component {
  // ...define your main app here
}

export default connect(mapStateToProps, mapDispatchToProps)(MyApp)
```

- 使用装饰器:

``` jsx
import React from 'react'
import * as actionCreators from './actionCreators'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

function mapStateToProps(state) {
  return { todos: state.todos }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch) }
}

@connect(mapStateToProps, mapDispatchToProps)
export default class MyApp extends React.Component {
  // ...define your main app here
}
```

除了装饰器的使用外，上面的例子几乎相似。装饰器语法尚未构建到任何 JavaScript 运行时中，并且仍然是实验性的并且可能会发生变化。您可以使用babel来获得装饰器支持。

## React 上下文和 React Redux 之间有什么区别?

您可以直接在应用程序中使用**Context**，这对于将数据传递给深度嵌套的组件非常有用。而**Redux**功能更强大，它还提供了 Context API 无法提供的大量功能。此外，React Redux 在内部使用上下文，但它不会在公共 API 中有所体现。

## 为什么 Redux 状态函数称为 reducers ?

Reducers 总是返回状态的累积（基于所有先前状态和当前 Action）。因此，它们充当了状态的 Reducer。每次调用 Redux reducer 时，状态和 Action 都将作为参数传递。然后基于该 Action 减少（或累积）该状态，然后返回下一状态。您可以reduce一组操作和一个初始状态（Store），在该状态下执行这些操作以获得最终的最终状态。

## 如何在 Redux 中发起 AJAX 请求?

您可以使用redux-thunk中间件，它允许您定义异步操作。

让我们举个例子，使用fetch API将特定帐户作为 AJAX 调用获取：

``` js
export function fetchAccount(id) {
  return dispatch => {
    dispatch(setLoadingAccountState()) // Show a loading spinner
    fetch(`/account/${id}`, (response) => {
      dispatch(doneFetchingAccount()) // Hide loading spinner
      if (response.status === 200) {
        dispatch(setAccount(response.json)) // Use a normal function to set the received state
      } else {
        dispatch(someError)
      }
    })
  }
}

function setAccount(data) {
 return { type: 'SET_Account', data: data }
}
```

## 我应该在 Redux Store 中保留所有组件的状态吗?

将数据保存在 Redux 存储中，并在组件内部保持 UI 相关状态。

## 访问 Redux Store 的正确方法是什么?
在组件中访问 Store 的最佳方法是使用connect()函数，该函数创建一个包裹现有组件的新组件。此模式称为高阶组件，通常是在 React 中扩展组件功能的首选方式。这允许您将状态和 Action 创建者映射到组件，并在 Store 更新时自动传递它们。

我们来看一个使用 connect 的`<FilterLink>`组件的例子：

``` jsx
import { connect } from 'react-redux'
import { setVisibilityFilter } from '../actions'
import Link from '../components/Link'

const mapStateToProps = (state, ownProps) => ({
  active: ownProps.filter === state.visibilityFilter
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: () => dispatch(setVisibilityFilter(ownProps.filter))
})

const FilterLink = connect(
  mapStateToProps,
  mapDispatchToProps
)(Link)

export default FilterLink
```

由于它具有相当多的性能优化并且通常不太可能导致错误，因此 Redux 开发人员几乎总是建议使用connect()直接访问 Store（使用上下文API）。

``` jsx
class MyComponent {
  someMethod() {
    doSomethingWith(this.context.store)
  }
}
```

## React Redux 中展示组件和容器组件之间的区别是什么?

**展示组件**是一个类或功能组件，用于描述应用程序的展示部分。

**容器组件**是连接到 Redux Store的组件的非正式术语。容器组件订阅 Redux 状态更新和dispatch操作，它们通常不呈现 DOM 元素；他们将渲染委托给展示性的子组件。

## Redux 中常量的用途是什么?
常量允许您在使用 IDE 时轻松查找项目中该特定功能的所有用法。它还可以防止你拼写错误，在这种情况下，你会立即得到一个ReferenceError。

通常我们会将它们保存在一个文件中（constants.js或actionTypes.js）。

``` js
export const ADD_TODO = 'ADD_TODO'
export const DELETE_TODO = 'DELETE_TODO'
export const EDIT_TODO = 'EDIT_TODO'
export const COMPLETE_TODO = 'COMPLETE_TODO'
export const COMPLETE_ALL = 'COMPLETE_ALL'
export const CLEAR_COMPLETED = 'CLEAR_COMPLETED'
```

在 Redux 中，您可以在两个地方使用它们：

1. 在 Action 创建时:

让我们看看 actions.js:

``` js
import { ADD_TODO } from './actionTypes';

export function addTodo(text) {
  return { type: ADD_TODO, text }
}
```

2. 在 reducers 里:

让我们创建 reducer.js 文件:

``` js
import { ADD_TODO } from './actionTypes'

export default (state = [], action) => {
  switch (action.type) {
    case ADD_TODO:
      return [
        ...state,
        {
          text: action.text,
          completed: false
        }
      ];
    default:
      return state
  }
}
```

## 编写 mapDispatchToProps() 有哪些不同的方法?

有一些方法可以将action creators绑定到mapDispatchToProps()中的dispatch()。以下是可能的写法：

``` js
const mapDispatchToProps = (dispatch) => ({
 action: () => dispatch(action())
})
```

``` js
const mapDispatchToProps = (dispatch) => ({
 action: bindActionCreators(action, dispatch)
})
```

``` js
const mapDispatchToProps = { action }
```

第三种写法只是第一种写法的简写。

## 在 mapStateToProps() 和 mapDispatchToProps() 中使用 ownProps 参数有什么用?

如果指定了ownProps参数，React Redux 会将传递给该组件的 props 传递给你的connect函数。因此，如果您使用连接组件：

``` jsx
import ConnectedComponent from './containers/ConnectedComponent';

<ConnectedComponent user={'john'} />
```

你的mapStateToProps()和mapDispatchToProps()函数里面的ownProps将是一个对象：

``` js
{ user: 'john' }
```

您可以使用此对象来决定从这些函数返回的内容。

## 如何构建 Redux 项目目录?

大多数项目都有几个顶级目录，如下所示：

- **Components**: 用于dumb组件，Redux 不必关心的组件。
- **Containers**: 用于连接到 Redux 的smart组件。
- **Actions**: 用于所有 Action 创建器，其中文件名对应于应用程序的一部分。
- **Reducers**: 用于所有 reducer，其中文件名对应于state key。
- **Store**: 用于 Store 初始化。

这种结构适用于中小型项目。

## 什么是 redux-saga?

`redux-saga`是一个库，旨在使 React/Redux 项目中的副作用（数据获取等异步操作和访问浏览器缓存等可能产生副作用的动作）更容易，更好。

这个包在 NPM 上有发布:

``` shell
$ npm install --save redux-saga
```

## redux-saga 的模型概念是什么?

Saga就像你的项目中的一个单独的线程，它独自负责副作用。`redux-saga` 是一个 redux 中间件，这意味着它可以在项目启动中使用正常的 Redux 操作，暂停和取消该线程，它可以访问完整的 Redux 应用程序状态，并且它也可以调度 Redux 操作。

## 在 redux-saga 中 `call()` 和 `put()` 之间有什么区别?

call()和put()都是 Effect 创建函数。 call()函数用于创建 Effect 描述，指示中间件调用 promise。put()函数创建一个 Effect，指示中间件将一个 Action 分派给 Store。

让我们举例说明这些 Effect 如何用于获取特定用户数据。

``` js
function* fetchUserSaga(action) {
  // `call` function accepts rest arguments, which will be passed to `api.fetchUser` function.
  // Instructing middleware to call promise, it resolved value will be assigned to `userData` variable
  const userData = yield call(api.fetchUser, action.userId)

  // Instructing middleware to dispatch corresponding action.
  yield put({
    type: 'FETCH_USER_SUCCESS',
    userData
  })
}
```

## 什么是 Redux Thunk?

Redux Thunk中间件允许您编写返回函数而不是 Action 的创建者。 thunk 可用于延迟 Action 的发送，或仅在满足某个条件时发送。内部函数接收 Store 的方法dispatch()和getState()作为参数。

## `redux-saga` 和 `redux-thunk` 之间有什么区别?

Redux Thunk和Redux Saga都负责处理副作用。在大多数场景中，Thunk 使用Promises来处理它们，而 Saga 使用Generators。Thunk 易于使用，因为许多开发人员都熟悉 Promise，Sagas/Generators 功能更强大，但您需要学习它们。但是这两个中间件可以共存，所以你可以从 Thunks 开始，并在需要时引入 Sagas。

## 什么是 Redux DevTools?

Redux DevTools是 Redux 的实时编辑的时间旅行环境，具有热重新加载，Action 重放和可自定义的 UI。如果您不想安装 Redux DevTools 并将其集成到项目中，请考虑使用 Chrome 和 Firefox 的扩展插件。

## Redux DevTools 的功能有哪些?

1. 允许您检查每个状态和 action 负载。
2. 让你可以通过撤销回到过去。
3. 如果更改 reducer 代码，将重新评估每个已暂存的 Action。
4. 如果 Reducers 抛出错误，你会看到这发生了什么 Action，以及错误是什么。
5. 使用persistState()存储增强器，您可以在页面重新加载期间保持调试会话。

## 什么是 Redux 选择器以及使用它们的原因?

选择器是将 Redux 状态作为参数并返回一些数据以传递给组件的函数。

例如，要从 state 中获取用户详细信息：

``` js
const getUserData = state => state.user.data
```

## 什么是 Redux Form?

Redux Form与 React 和 Redux 一起使用，以使 React 中的表单能够使用 Redux 来存储其所有状态。Redux Form 可以与原始 HTML5 输入一起使用，但它也适用于常见的 UI 框架，如 Material UI，React Widgets和React Bootstrap。

## Redux Form 的主要功能有哪些?

1. 字段值通过 Redux 存储持久化。
2. 验证（同步/异步）和提交。
3. 字段值的格式化，解析和规范化。

## 如何向 Redux 添加多个中间件?

你可以使用`applyMiddleware()`。

例如，你可以添加`redux-thunk`和`logger`作为参数传递给`applyMiddleware()`：

``` js
import { createStore, applyMiddleware } from 'redux'
const createStoreWithMiddleware = applyMiddleware(ReduxThunk, logger)(createStore)
```

## 如何在 Redux 中设置初始状态?
您需要将初始状态作为第二个参数传递给 createStore ：

``` js
const rootReducer = combineReducers({
  todos: todos,
  visibilityFilter: visibilityFilter
})

const initialState = {
  todos: [{ id: 123, name: 'example', completed: false }]
}

const store = createStore(
  rootReducer,
  initialState
)
```

## Relay 与 Redux 有何不同?

Relay 与 Redux 类似，因为它们都使用单个 Store。主要区别在于 relay 仅管理源自服务器的状态，并且通过GraphQL查询（用于读取数据）和突变（用于更改数据）来使用对状态的所有访问。Relay 通过仅提取已更改的数据而为您缓存数据并优化数据提取。

## React Native 和 React 有什么区别?

**React**是一个 JavaScript 库，支持前端 Web 和在服务器上运行，用于构建用户界面和 Web 应用程序。

**React Native**是一个移动端框架，可编译为本机应用程序组件，允许您使用 JavaScript 构建本机移动应用程序（iOS，Android和Windows），允许您使用 React 构建组件。

## 什么是 Reselect 以及它是如何工作的?

Reselect是一个**选择器库**（用于 Redux ），它使用memoization概念。它最初编写用于计算类似 Redux 的应用程序状态的派生数据，但它不能绑定到任何体系结构或库。

Reselect 保留最后一次调用的最后输入/输出的副本，并仅在其中一个输入发生更改时重新计算结果。如果连续两次提供相同的输入，则 Reselect 将返回缓存的输出。它的 memoization 和缓存是完全可定制的。

## 什么是 Flow?

Flow 是一个静态类型检查器，旨在查找 JavaScript 中的类型错误。与传统类型系统相比，Flow 类型可以表达更细粒度的区别。例如，与大多数类型系统不同，Flow 能帮助你捕获涉及 `null` 的错误。

## Flow 和 PropTypes 有什么区别?

- Flow 是一个静态类型检查器（静态检查器），它使用该语言的超集，允许你在所有代码中添加类型注释，并在编译时捕获整个类的错误。

- PropTypes 是一个基本类型检查器（运行时检查器），已经被添加到 React 中。除了检查传递给给定组件的属性类型外，它不能检查其他任何内容。

如果你希望对整个项目进行更灵活的类型检查，那么 Flow/TypeScript 是更合适的选择。

## 在 React 中如何使用 Font Awesome 图标?
接下来的步骤将在 React 中引入 Font Awesome：

1. 安装 font-awesome:
``` shell
$ npm install --save font-awesome
```

2. 在 index.js 文件中导入 font-awesome:

``` js
import 'font-awesome/css/font-awesome.min.css'
```

3. 在 className 中添加 Font Awesome 类:

``` jsx
render() {
  return <div><i className={'fa fa-spinner'} /></div>
}
```

## 什么 是 React 开发者工具?

React Developer Tools 允许您检查组件层次结构，包括组件属性和状态。它既可以作为浏览器扩展（用于 Chrome 和 Firefox ），也可以作为独立的应用程序（用于其他环境，包括 Safari、IE 和 React Native）。

可用于不同浏览器或环境的官方扩展。

1. Chrome插件
2. Firefox插件
3. 独立应用 （ Safari，React Native 等）

## 在 Chrome 中为什么 DevTools 没有加载本地文件?

如果您在浏览器中打开了本地 HTML 文件（`file://...`），则必须先打开Chrome Extensions并选中“允许访问文件URL”。

## 如何在 React 中使用 Polymer?

1. 创建 Polymer 元素：

``` html
<link rel='import' href='../../bower_components/polymer/polymer.html' />
Polymer({
  is: 'calender-element',
  ready: function() {
    this.textContent = 'I am a calender'
  }
})
```

2. 通过在 HTML 文档中导入 Polymer 组件，来创建该组件对应的标签。例如，在 React 应用程序的 index.html 文件中导入。

``` html
<link rel='import' href='./src/polymer-components/calender-element.html'>
```

3. 在 JSX 文件中使用该元素：

``` jsx
import React from 'react'

class MyComponent extends React.Component {
  render() {
    return (
      <calender-element />
    )
  }
}

export default MyComponent
```


## 与 Vue.js 相比，React 有哪些优势?

与 Vue.js 相比，React 具有以下优势：

1. 在大型应用程序开发中提供更大的灵活性。
2. 更容易测试。
3. 更适合创建移动端应用程序。
4. 提供更多的信息和解决方案。

## React 和 Angular 有什么区别?

| React | Angular |
| ---- | ---- |
| React 是一个库，只有View层 | Angular是一个框架，具有完整的 MVC 功能 |
| React 可以处理服务器端的渲染 | AngularJS 仅在客户端呈现，但 Angular 2 及更高版本可以在服务器端渲染 |
| React 在 JS 中使用看起来像 HTML 的 JSX，这可能令人困惑 | Angular 遵循 HTML 的模板方法，这使得代码更短且易于理解 |
| React Native 是一种 React 类型，它用于构建移动应用程序，它更快，更稳定 | Ionic，Angular 的移动 app 相对原生 app 来说不太稳定和慢 |
| 在 React中，数据只以单一方向传递，因此调试很容易 | 在 Angular 中，数据以两种方式传递，即它在子节点和父节点之间具有双向数据绑定，因此调试通常很困难 |

## 为什么 React 选项卡不会显示在 DevTools 中?

当页面加载时，React DevTools设置一个名为__REACT_DEVTOOLS_GLOBAL_HOOK__的全局变量，然后 React 在初始化期间与该钩子通信。如果网站没有使用 React，或者如果 React 无法与 DevTools 通信，那么它将不会显示该选项卡。

## 什么是 Styled Components?

styled-components 是一个用于样式化 React 应用程序的 JavaScript 库。 它删除了样式和组件之间的映射，并允许您在 js 中编写 CSS。

## 举一个 Styled Components 的例子?
让我们创建具有特定样式的`<Title>`和`<Wrapper>`组件。

``` jsx
import React from 'react'
import styled from 'styled-components'

// Create a <Title> component that renders an <h1> which is centered, red and sized at 1.5em
const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`

// Create a <Wrapper> component that renders a <section> with some padding and a papayawhip background
const Wrapper = styled.section`
  padding: 4em;
  background: papayawhip;
`
```

Title和Wrapper变量现在是可以像任何其他 react 组件一样渲染。

``` jsx
<Wrapper>
  <Title>{'Lets start first styled component!'}</Title>
</Wrapper>
```

## 什么是 Relay?

Relay 是一个 JavaScript 框架，用于使用 React 视图层为 Web 应用程序提供数据层和客户端与服务器之间的通信。

## 如何在 `create-react-app` 中使用 TypeScript?

当您创建一个新项目带有--scripts-version选项值为react-scripts-ts时便可将 TypeScript 引入。

生成的项目结构如下所示：

``` folder
my-app/
├─ .gitignore
├─ images.d.ts
├─ node_modules/
├─ public/
├─ src/
│  └─ ...
├─ package.json
├─ tsconfig.json
├─ tsconfig.prod.json
├─ tsconfig.test.json
└─ tslint.json
```

## Reselect 库的主要功能有哪些?

1. 选择器可以计算派生数据，允许 Redux 存储最小可能状态。
2. 选择器是有效的。除非其参数之一发生更改，否则不会重新计算选择器。
3. 选择器是可组合的。它们可以用作其他选择器的输入。

## 举一个 Reselect 用法的例子?
让我们通过使用 Reselect 来简化计算不同数量的装运订单：

``` jsx
import { createSelector } from 'reselect'

const shopItemsSelector = state => state.shop.items
const taxPercentSelector = state => state.shop.taxPercent

const subtotalSelector = createSelector(
  shopItemsSelector,
  items => items.reduce((acc, item) => acc + item.value, 0)
)

const taxSelector = createSelector(
  subtotalSelector,
  taxPercentSelector,
  (subtotal, taxPercent) => subtotal * (taxPercent / 100)
)

export const totalSelector = createSelector(
  subtotalSelector,
  taxSelector,
  (subtotal, tax) => ({ total: subtotal + tax })
)

let exampleState = {
  shop: {
    taxPercent: 8,
    items: [
      { name: 'apple', value: 1.20 },
      { name: 'orange', value: 0.95 },
    ]
  }
}

console.log(subtotalSelector(exampleState)) // 2.15
console.log(taxSelector(exampleState))      // 0.172
console.log(totalSelector(exampleState))    // { total: 2.322 }
```

## Redux 中的 Action 是什么?

Actions是纯 JavaScript 对象或信息的有效负载，可将数据从您的应用程序发送到您的 Store。 它们是 Store 唯一的数据来源。 Action 必须具有指示正在执行的操作类型的 type 属性。

例如，表示添加新待办事项的示例操作：

``` js
{
  type: ADD_TODO,
  text: 'Add todo item'
}
```

## 在 React 中 statics 对象是否能与 ES6 类一起使用?

不行，statics 仅适用于 React.createClass()：

``` jsx
someComponent= React.createClass({
  statics: {
    someMethod: function() {
      // ..
    }
  }
})
```

但是你可以在 ES6+ 的类中编写静态代码，如下所示：

``` jsx
class Component extends React.Component {
  static propTypes = {
    // ...
  }

  static someMethod() {
    // ...
  }
}
```

## Redux 只能与 React 一起使用么?

Redux 可以用做任何 UI 层的数据存储。最常见的应用场景是 React 和 React Native，但也有一些 bindings 可用于 AngularJS，Angular 2，Vue，Mithril 等项目。Redux 只提供了一种订阅机制，任何其他代码都可以使用它。

## 您是否需要使用特定的构建工具来使用 Redux ?

Redux 最初是用 ES6 编写的，用 Webpack 和 Babel 编译成 ES5。 无论您的 JavaScript 构建过程如何，您都应该能够使用它。Redux 还提供了一个 UMD 版本，可以直接使用而无需任何构建过程。

## Redux Form 的 initialValues 如何从状态更新?

你需要添加enableReinitialize：true设置。

``` jsx
const InitializeFromStateForm = reduxForm({
  form: 'initializeFromState',
  enableReinitialize : true
})(UserEdit)
```

如果你的`initialValues`属性得到更新，你的表单也会更新。

## React 是如何为一个属性声明不同的类型?

你可以使用 PropTypes 中的 oneOfType() 方法。

例如，如下所示 size 的属性值可以是 string 或 number 类型。

``` jsx
Component.PropTypes = {
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
}
```

## 我可以导入一个 SVG 文件作为 React 组件么?

你可以直接将 SVG 作为组件导入，而不是将其作为文件加载。此功能仅在 react-scripts@2.0.0 及更高版本中可用。

``` jsx
import { ReactComponent as Logo } from './logo.svg'

const App = () => (
  <div>
    {/* Logo is an actual react component */}
    <Logo />
  </div>
)
```

## 为什么不建议使用内联引用回调或函数?

如果将 ref 回调定义为内联函数，则在更新期间它将会被调用两次。首先使用 null 值，然后再使用 DOM 元素。这是因为每次渲染的时候都会创建一个新的函数实例，因此 React 必须清除旧的 ref 并设置新的 ref。

``` jsx
class UserForm extends Component {
  handleSubmit = () => {
    console.log("Input Value is: ", this.input.value)
  }

  render () {
   return (
     <form onSubmit={this.handleSubmit}>
       <input
         type='text'
         ref={(input) => this.input = input} /> // Access DOM input in handle submit
       <button type='submit'>Submit</button>
     </form>
   )
 }
}
```

但我们期望的是当组件挂载时，ref 回调只会被调用一次。一个快速修复的方法是使用 ES7 类属性语法定义函数。

``` jsx
class UserForm extends Component {
 handleSubmit = () => {
   console.log("Input Value is: ", this.input.value)
 }

 setSearchInput = (input) => {
   this.input = input
 }

 render () {
   return (
     <form onSubmit={this.handleSubmit}>
       <input
         type='text'
         ref={this.setSearchInput} /> // Access DOM input in handle submit
       <button type='submit'>Submit</button>
     </form>
   )
 }
}
```

## 在 React 中什么是渲染劫持?

渲染劫持的概念是控制一个组件将从另一个组件输出什么的能力。实际上，这意味着你可以通过将组件包装成高阶组件来装饰组件。通过包装，你可以注入额外的属性或产生其他变化，这可能会导致渲染逻辑的更改。实际上它不支持劫持，但通过使用 HOC，你可以使组件以不同的方式工作。

## 什么是 HOC 工厂实现?

在 React 中实现 HOC 有两种主要方式。

1. 属性代理（PP）
2. 继承倒置（II）。

他们遵循不同的方法来操纵WrappedComponent。

**属性代理** 在这种方法中，HOC 的 render 方法返回 WrappedComponent 类型的 React 元素。我们通过 HOC 收到 props，因此定义为属性代理。

``` jsx
function ppHOC(WrappedComponent) {
 return class PP extends React.Component {
   render() {
     return <WrappedComponent {...this.props}/>
   }
 }
}
```

**继承倒置** 在这种方法中，返回的 HOC 类（Enhancer）扩展了 WrappedComponent 。它被称为继承反转，因为它不是扩展一些 Enhancer 类的 WrappedComponent，而是由 Enhancer 被动扩展。 通过这种方式，它们之间的关系似乎是逆的。

``` jsx
function iiHOC(WrappedComponent) {
 return class Enhancer extends WrappedComponent {
   render() {
     return super.render()
   }
 }
}
```

## 如何传递数字给 React 组件?

传递数字时你应该使用 {}，而传递字符串时还需要使用引号：

``` jsx
React.render(<User age={30} department={"IT"} />, document.getElementById('container'));
```

## 我需要将所有状态保存到 Redux 中吗？我应该使用 react 的内部状态吗?

这取决于开发者的决定。即开发人员的工作是确定应用程序的哪种状态，以及每个状态应该存在的位置，有些用户喜欢将每一个数据保存在 Redux 中，以维护其应用程序的完全可序列化和受控。其他人更喜欢在组件的内部状态内保持非关键或UI状态，例如“此下拉列表当前是否打开”。

以下是确定应将哪种数据放入Redux的主要规则：

1. 应用程序的其他部分是否关心此数据？
2. 您是否需要能够基于此原始数据创建更多派生数据？
3. 是否使用相同的数据来驱动多个组件？
4. 能够将此状态恢复到给定时间点（即时间旅行调试）是否对您有价值？
5. 您是否要缓存数据（即，如果已经存在，则使用处于状态的状态而不是重新请求它）？

## 在 React 中 registerServiceWorker 的用途是什么?

默认情况下，React 会为你创建一个没有任何配置的 service worker。Service worker 是一个 Web API，它帮助你缓存资源和其他文件，以便当用户离线或在弱网络时，他/她仍然可以在屏幕上看到结果，因此，它可以帮助你建立更好的用户体验，这是你目前应该了解的关于 Service worker 的内容。

``` jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
```

## React memo 函数是什么?

当类组件的输入属性相同时，可以使用 `pureComponent` 或 `shouldComponentUpdate` 来避免组件的渲染。现在，你可以通过把函数组件包装在 `React.memo` 中来实现相同的功能。

``` jsx
const MyComponent = React.memo(function MyComponent(props) {
 /* only rerenders if props change */
});
```

## React lazy 函数是什么?

使用 React.lazy 函数允许你将动态导入的组件作为常规组件进行渲染。当组件开始渲染时，它会自动加载包含 OtherComponent 的包。它必须返回一个 Promise，该 Promise 解析后为一个带有默认导出 React 组件的模块。

``` jsx
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
 return (
   <div>
     <OtherComponent />
   </div>
 );
}
```

**注意：** React.lazy 和 Suspense 还不能用于服务端渲染。如果要在服务端渲染的应用程序中进行代码拆分，我们仍然建议使用 React Loadable。

## 如何使用 setState 防止不必要的更新?

你可以把状态的当前值与已有的值进行比较，并决定是否重新渲染页面。如果没有更改，你需要返回 null 以阻止渲染，否则返回最新的状态值。例如，用户配置信息组件将按以下方式实现条件渲染：

``` js
getUserProfile = user => {
  const latestAddress = user.address;
  this.setState(state => {
    if (state.address === latestAddress) {
      return null;
    } else {
      return { title: latestAddress };
    }
  });
};
```

## 如何在 React 16 版本中渲染数组、字符串和数值?
**Arrays**: 与旧版本不同的是，在 React 16 中你不需要确保 render 方法必须返回单个元素。通过返回数组，你可以返回多个没有包装元素的同级元素。例如，让我们看看下面的开发人员列表：

``` jsx
const ReactJSDevs = () => {
  return [
    <li key="1">John</li>,
    <li key="2">Jackie</li>,
    <li key="3">Jordan</li>
  ];
}
```

你还可以将此数组项合并到另一个数组组件中：

``` jsx
const JSDevs = () => {
  return (
    <ul>
      <li>Brad</li>
      <li>Brodge</li>
      <ReactJSDevs/>
      <li>Brandon</li>
    </ul>
  );
}
```

**Strings and Numbers**: 在 render 方法中，你也可以返回字符串和数值类型：

``` jsx
// String
render() {
  return 'Welcome to ReactJS questions';
}
// Number
render() {
  return 2018;
}
```

## 如何在 React 类中使用类字段声明语法?
使用类字段声明可以使 React 类组件更加简洁。你可以在不使用构造函数的情况下初始化本地状态，并通过使用箭头函数声明类方法，而无需额外对它们进行绑定。让我们以一个 counter 示例来演示类字段声明，即不使用构造函数初始化状态且不进行方法绑定：

``` jsx
class Counter extends Component {
  state = { value: 0 };

  handleIncrement = () => {
    this.setState(prevState => ({
      value: prevState.value + 1
    }));
  };

  handleDecrement = () => {
    this.setState(prevState => ({
      value: prevState.value - 1
    }));
  };

  render() {
    return (
      <div>
        {this.state.value}

        <button onClick={this.handleIncrement}>+</button>
        <button onClick={this.handleDecrement}>-</button>
      </div>
    )
  }
}
```

## 什么是 hooks?

Hooks 是一个新的草案，它允许你在不编写类的情况下使用状态和其他 React 特性。让我们来看一个 useState 钩子示例：

``` jsx
import { useState } from 'react';

function Example() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

## Hooks 需要遵循什么规则?

为了使用 hooks，你需要遵守两个规则：

1. 仅在顶层的 React 函数调用 hooks。也就是说，你不能在循环、条件或内嵌函数中调用 hooks。这将确保每次组件渲染时都以相同的顺序调用 hooks，并且它会在多个 useState 和 useEffect 调用之间保留 hooks 的状态。
2. 仅在 React 函数中调用 hooks。例如，你不能在常规的 JavaScript 函数中调用 hooks。

## 如何确保钩子遵循正确的使用规则?
React 团队发布了一个名为eslint-plugin-react-hooks的 ESLint 插件，它实施了这两个规则。您可以使用以下命令将此插件添加到项目中，

``` shell
npm install eslint-plugin-react-hooks@next
```

并在您的 ESLint 配置文件中应用以下配置：

``` json
// Your ESLint configuration
{
  "plugins": [
    // ...
    "react-hooks"
  ],
  "rules": {
    // ...
    "react-hooks/rules-of-hooks": "error"
  }
}
```

**注意：** 此插件在 Create React App 已经默认配置。

## Flux 和 Redux 之间有什么区别?

以下是 Flux 和 Redux 之间的主要区别

| Flux | Redux |
| ---- | ---- |
| 状态是可变的 | 状态是不可变的 |
| Store 包含状态和更改逻辑 | 存储和更改逻辑是分开的 |
| 存在多个 Store | 仅存在一个 Store |
| 所有的 Store 都是断开连接的 | 带有分层 reducers 的 Store |
| 它有一个单独的 dispatcher | 没有 dispatcher 的概念 |
| React 组件监测 Store | 容器组件使用connect函数 |

## React Router V4 有什么好处?

以下是 React Router V4 模块的主要优点：

1. 在React Router v4（版本4）中，API完全与组件有关。路由器可以显示为单个组件（），它包装特定的子路由器组件（）。
2. 您无需手动设置历史记录。路由器模块将通过使用组件包装路由来处理历史记录。
3. 通过仅添加特定路由器模块（Web，core 或 native）来减少应用大小。

## 您能描述一下 componentDidCatch 生命周期方法签名吗?

在后代层级的组件抛出错误后，将调用componentDidCatch生命周期方法。该方法接收两个参数：

1. error: - 抛出的错误对象
2. info: - 具有 componentStack 键的对象，包含有关哪个组件引发错误的信息。

方法结构如下：

``` jsx
componentDidCatch(error, info)
```

## 在哪些情况下，错误边界不会捕获错误?

以下是错误边界不起作用的情况：

1. 在事件处理器内。
2. **setTimeout** 或 **requestAnimationFrame** 回调中的异步代码。
3. 在服务端渲染期间。
4. 错误边界代码本身中引发错误时。

## 为什么事件处理器不需要错误边界?

错误边界不会捕获事件处理程序中的错误。与 render 方法或生命周期方法不同，在渲染期间事件处理器不会被执行或调用。

如果仍然需要在事件处理程序中捕获错误，请使用下面的常规 JavaScript `try/catch` 语句：

``` jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  handleClick = () => {
    try {
      // Do something that could throw
    } catch (error) {
      this.setState({ error });
    }
  }

  render() {
    if (this.state.error) {
      return <h1>Caught an error.</h1>
    }
    return <div onClick={this.handleClick}>Click Me</div>
  }
}
```
上面的代码使用普通的 JavaScript `try/catch` 块而不是错误边界来捕获错误。

## try catch 与错误边界有什么区别?

Try catch 块使用命令式代码，而错误边界则是使用在屏幕上呈现声明性代码。

例如，以下是使用声明式代码的 try/catch 块：

``` jsx
try {
  showButton();
} catch (error) {
  // ...
}
```

而错误边界包装的声明式代码如下：

``` jsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

因此，如果在组件树深处某个位置组件的 componentDidUpdate 方法中，发生了由 setState 引发的错误，它仍然会正确地冒泡到最近的错误边界。

## React 16 中未捕获的错误的行为是什么?

在 React 16 中，未被任何错误边界捕获的错误将导致整个 React 组件树的卸载。这一决定背后的原因是，与其显示已损坏的界面，不如完全移除它。例如，对于支付应用程序来说，显示错误的金额比什么都不提供更糟糕。

## 放置错误边界的正确位置是什么?

错误边界使用的粒度由开发人员根据项目需要决定。你可以遵循这些方法中的任何一种：

1. 可以包装顶层路由组件以显示整个应用程序中常见的错误消息。
2. 你还可以将单个组件包装在错误边界中，以防止它们奔溃时影响到应用程序的其余部分。

## 从错误边界跟踪组件堆栈有什么好处?

除了错误消息和 JavaScript 堆栈，React 16 将使用错误边界的概念显示带有文件名和行号的组件堆栈。

## 在定义类组件时，什么是必须的方法?

在类组件中 render() 方法是唯一需要的方法。也就是说，对于类组件，除了 render() 方法之外的所有方法都是可选的。

## render 方法可能返回的类型是什么?

以下列表是 render 方法返回的类型：

1. React elements: 用于告诉 React 如何渲染 DOM 节点。它包括 HTML 元素，如 `<div />` 和用户定义的元素。
2. Arrays and fragments: 以数组的形式返回多个元素和包装多个元素的片段。
3. Portals: 将子元素渲染到不同的 DOM 子树中。
4. String and numbers: 在 DOM 中将字符串和数字都作为文本节点进行呈现。
5. Booleans or null: 不会渲染任何内容，但这些类型用于有条件地渲染内容。

## 构造函数的主要目的是什么?

使用构造函数主要有两个目的：

1. 通过将对象分配给 `this.state` 来初始化本地状态。
2. 用于为组件实例绑定事件处理方法。

例如，下面的代码涵盖了上述两种情况：

``` jsx
constructor(props) {
  super(props);
  // Don't call this.setState() here!
  this.state = { counter: 0 };
  this.handleClick = this.handleClick.bind(this);
}
```

## 是否必须为 React 组件定义构造函数?

不，这不是强制的。也就是说，如果你不需要初始化状态且不需要绑定方法，则你不需要为 React 组件实现一个构造函数。

## 什么是默认属性?
defaultProps 被定义为组件类上的属性，用于设置组件类默认的属性值。它只适用于 undefined 的属性，而不适用于 null 属性。例如，让我们为按钮组件创建默认的 color 属性：

``` jsx
class MyButton extends React.Component {
  // ...
}

MyButton.defaultProps = {
  color: 'red'
};
```

如果未设置 props.color，则会使用默认值 red。 也就是说，每当你试图访问 color 属性时，它都使用默认值。

``` jsx
render() {
   return <MyButton /> ; // props.color will be set to red
}
```

**注意：** 如果你提供的是 null 值，它会仍然保留 null 值。

## 为什么不能在 componentWillUnmount 中调用 setState() 方法?

不应在 componentWillUnmount() 中调用 setState()，因为一旦卸载了组件实例，就永远不会再次装载它。

## getDerivedStateFromError 的目的是什么?

在子代组件抛出异常后会调用此生命周期方法。它以抛出的异常对象作为参数，并返回一个值用于更新状态。该生命周期方法的签名如下：

``` jsx
static getDerivedStateFromError(error)
```

让我们举一个包含上述生命周期方法的错误边界示例，来说明 getDerivedStateFromError 的目的：

``` jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

## 当组件重新渲染时顺序执行的方法有哪些?

更新可能由属性或状态的更改引起。在重新渲染组件时，会按以下顺序调用下列方法。

1. static getDerivedStateFromProps()
2. shouldComponentUpdate()
3. render()
4. getSnapshotBeforeUpdate()
5. componentDidUpdate()

## 错误处理期间调用哪些方法?

在渲染期间，任何子组件的生命周期方法内或构造函数中出现错误时，将会调用以下方法：

1. static getDerivedStateFromError()
2. componentDidCatch()

## displayName 类属性的用途是什么?

displayName 被用于调试信息。通常，你不需要显式设置它，因为它是从定义组件的函数或类的名称推断出来的。如果出于调试目的或在创建高阶组件时显示不同的名称，可能需要显式设置它。

例如，若要简化调试，请选择一个显示名称，以表明它是 withSubscription HOC 的结果。

``` jsx
function withSubscription(WrappedComponent) {
  class WithSubscription extends React.Component {/* ... */}
  WithSubscription.displayName = `WithSubscription(${getDisplayName(WrappedComponent)})`;
  return WithSubscription;
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
```

## 支持 React 应用程序的浏览器有哪一些?

React 支持所有流行的浏览器，包括 Internet Explorer 9 和更高版本，但旧版本的浏览器（如IE 9 和 IE 10）需要一些 polyfill。如果你使用 **es5-shim and es5-sham** polyfill，那么它甚至支持不支持 ES5 方法的旧浏览器。

## unmountComponentAtNode 方法的目的是什么?

此方法可从 react-dom 包中获得，它从 DOM 中移除已装载的 React 组件，并清除其事件处理程序和状态。如果容器中没有装载任何组件，则调用此函数将不起任何作用。如果组件已卸载，则返回 true；如果没有要卸载的组件，则返回 false。该方法的签名如下：

``` jsx
ReactDOM.unmountComponentAtNode(container)
```

## 什么是代码拆分?

Code-Splitting 是 Webpack 和 Browserify 等打包工具所支持的一项功能，它可以创建多个 bundles，并可以在运行时动态加载。React 项目支持通过 dynamic import() 特性进行代码拆分。例如，在下面的代码片段中，它将使 moduleA.js 及其所有唯一依赖项作为单独的块，仅当用户点击 'Load' 按钮后才加载。

moduleA.js

``` js
const moduleA = 'Hello';

export { moduleA };
```

App.js

``` jsx
import React, { Component } from 'react';

class App extends Component {
  handleClick = () => {
    import('./moduleA')
      .then(({ moduleA }) => {
        // Use moduleA
      })
      .catch(err => {
        // Handle failure
      });
  };

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Load</button>
      </div>
    );
  }
}

export default App;
```

## 严格模式有什么好处?

在下面的情况下， 将有所帮助：

1. 使用 **unsafe lifecycle methods** 标识组件。
2. 有关 **legacy string ref** API 用法发出警告。
3. 检测无法预测的 **side effects**。
4. 检测 **legacy context** API。
5. 有关已弃用的 **findDOMNode** 用法的警告。

## 什么是 Keyed Fragments ?
使用显式 <React.Fragment> 语法声明的片段可能具有 key 。一般用例是将集合映射到片段数组，如下所示，

``` jsx
function Glossary(props) {
  return (
    <dl>
      {props.items.map(item => (
        // Without the `key`, React will fire a key warning
        <React.Fragment key={item.id}>
          <dt>{item.term}</dt>
          <dd>{item.description}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
```

**注意：** 键是唯一可以传递给 Fragment 的属性。将来，可能会支持其他属性，例如事件处理程序。

## React 支持所有的 HTML 属性么?

从 React 16 开始，完全支持标准或自定义 DOM 属性。由于 React 组件通常同时使用自定义和与 DOM 相关的属性，因此 React 与 DOM API 一样都使用 camelCase 约定。让我们对标准 HTML 属性采取一些措施：

``` jsx
<div tabIndex="-1" />      // Just like node.tabIndex DOM API
<div className="Button" /> // Just like node.className DOM API
<input readOnly={true} />  // Just like node.readOnly DOM API
```

除了特殊情况外，这些属性的工作方式与相应的 HTML 属性类似。它还支持所有 SVG 属性。

## HOC 有哪些限制?

除了它的好处之外，高阶组件还有一些注意事项。 以下列出的几个注意事项:

1. **不要在渲染方法中使用HOC：** 建议不要将 HOC 应用于组件的 render 方法中的组件。

``` jsx
render() {
  // A new version of EnhancedComponent is created on every render
  // EnhancedComponent1 !== EnhancedComponent2
  const EnhancedComponent = enhance(MyComponent);
  // That causes the entire subtree to unmount/remount each time!
  return <EnhancedComponent />;
}
```

上述代码通过重新装载，将导致该组件及其所有子组件状态丢失，会影响到性能。正确的做法应该是在组件定义之外应用 HOC ，以便仅生成一次生成的组件

2. **静态方法必须复制：** 将 HOC 应用于组件时，新组件不具有原始组件的任何静态方法

``` jsx
// Define a static method
WrappedComponent.staticMethod = function() {/*...*/}
// Now apply a HOC
const EnhancedComponent = enhance(WrappedComponent);

// The enhanced component has no static method
typeof EnhancedComponent.staticMethod === 'undefined' // true
```

您可以通过在返回之前将方法复制到输入组件上来解决此问题

``` jsx
function enhance(WrappedComponent) {
  class Enhance extends React.Component {/*...*/}
  // Must know exactly which method(s) to copy :(
  Enhance.staticMethod = WrappedComponent.staticMethod;
  return Enhance;
}
```

3. **Refs 不会被往下传递：** 对于HOC，您需要将所有属性传递给包装组件，但这对于 refs 不起作用。这是因为 ref 并不是一个类似于 key 的属性。在这种情况下，您需要使用 React.forwardRef API。

## 如何在 DevTools 中调试 forwardRefs?

**React.forwardRef**接受渲染函数作为参数，DevTools 使用此函数来确定为 ref 转发组件显示的内容。例如，如果您没有使用 displayName 属性命名 render 函数，那么它将在 DevTools 中显示为“ForwardRef”，

``` jsx
const WrappedComponent = React.forwardRef((props, ref) => {
  return <LogProps {...props} forwardedRef={ref} />;
});
```

但如果你命名 render 函数，那么它将显示为 **“ForwardRef(myFunction)”**

``` jsx
const WrappedComponent = React.forwardRef(
  function myFunction(props, ref) {
    return <LogProps {...props} forwardedRef={ref} />;
  }
);
```
作为替代方案，您还可以为 forwardRef 函数设置 displayName 属性，

``` jsx
function logProps(Component) {
  class LogProps extends React.Component {
    // ...
  }

  function forwardRef(props, ref) {
    return <LogProps {...props} forwardedRef={ref} />;
  }

  // Give this component a more helpful display name in DevTools.
  // e.g. "ForwardRef(logProps(MyComponent))"
  const name = Component.displayName || Component.name;
  forwardRef.displayName = `logProps(${name})`;

  return React.forwardRef(forwardRef);
}
```

## 什么时候组件的 props 属性默认为 true?

如果没有传递属性值，则默认为 true。此行为可用，以便与 HTML 的行为匹配。例如，下面的表达式是等价的：

``` jsx
<MyInput autocomplete />

<MyInput autocomplete={true} />
```

**注意：** 不建议使用此方法，因为它可能与 ES6 对象 shorthand 混淆（例如，{name}，它是{ name:name } 的缩写）

## 什么是 NextJS 及其主要特征?

Next.js 是一个流行的轻量级框架，用于使用 React 构建静态和服务端渲染应用程序。它还提供样式和路由解决方案。以下是 NextJS 提供的主要功能：

1. 默认服务端渲染
2. 自动代码拆分以加快页面加载速度
3. 简单的客户端路由 (基于页面)
4. 基于 Webpack 的开发环境支持 (HMR)
5. 能够使用 Express 或任何其他 Node.js HTTP 服务器
6. 可自定义你自己的 Babel 和 Webpack 配置

## 如何将事件处理程序传递给组件?

可以将事件处理程序和其他函数作为属性传递给子组件。它可以在子组件中使用，如下所示：

``` jsx
<button onClick={this.handleClick}>
```

## 在渲染方法中使用箭头函数好么?

是的，你可以用。它通常是向回调函数传递参数的最简单方法。但在使用时需要优化性能。

``` jsx
class Foo extends Component {
  handleClick() {
    console.log('Click happened');
  }
  render() {
    return <button onClick={() => this.handleClick()}>Click Me</button>;
  }
}
```

**注意：** 组件每次渲染时，在 render 方法中的箭头函数都会创建一个新的函数，这可能会影响性能。

## 如何防止函数被多次调用?

如果你使用一个事件处理程序，如 **onClick or onScroll** 并希望防止回调被过快地触发，那么你可以限制回调的执行速度。

这可以通过以下可能的方式实现：

1. **Throttling**: 基于时间的频率进行更改。例如，它可以使用 lodash 的 _.throttle 函数。
2. **Debouncing**: 在一段时间不活动后发布更改。例如，可以使用 lodash 的 _.debounce 函数。
3. **RequestAnimationFrame throttling**: 基于 requestAnimationFrame 的更改。例如，可以使用 raf-schd。

**注意：** _.debounce， _.throttle 和 raf-schd 都提供了一个 cancel 方法来取消延迟回调。所以需要调用 componentWillUnmount，或者对代码进行检查来保证在延迟函数有效期间内组件始终挂载。

## JSX 如何防止注入攻击?

React DOM 会在渲染 JSX 中嵌入的任何值之前对其进行转义。因此，它确保你永远不能注入任何未在应用程序中显式写入的内容。

``` jsx
const name = response.potentiallyMaliciousInput;
const element = <h1>{name}</h1>;
```

这样可以防止应用程序中的XSS（跨站点脚本）攻击。

## 如何更新已渲染的元素?

通过将新创建的元素传递给 ReactDOM 的 render 方法，可以实现 UI 更新。例如，让我们举一个滴答时钟的例子，它通过多次调用 render 方法来更新时间：

``` jsx
function tick() {
  const element = (
    <div>
      <h1>Hello, world!</h1>
      <h2>It is {new Date().toLocaleTimeString()}.</h2>
    </div>
  );
  ReactDOM.render(element, document.getElementById('root'));
}

setInterval(tick, 1000);
```

## 你怎么说 props 是只读的?

当你将组件声明为函数或类时，它决不能修改自己的属性。让我们来实现一个 capital 的函数：

``` jsx
function capital(amount, interest) {
   return amount + interest;
}
```

上面的函数称为“纯”函数，因为它不会尝试更改输入，并总是为相同的输入返回相同的结果。因此，React 有一条规则，即“所有 React 组件的行为都必须像纯函数一样”。

## 你认为状态更新是如何合并的?

当你在组件中调用 setState() 方法时，React 会将提供的对象合并到当前状态。例如，让我们以一个使用帖子和评论详细信息的作为状态变量的 Facebook 用户为例：

``` jsx
constructor(props) {
  super(props);
  this.state = {
    posts: [],
    comments: []
  };
}
```

现在，你可以独立调用 setState() 方法，单独更新状态变量：

``` jsx
componentDidMount() {
  fetchPosts().then(response => {
    this.setState({
      posts: response.posts
    });
  });

  fetchComments().then(response => {
    this.setState({
      comments: response.comments
    });
  });
}
```
如上面的代码段所示，`this.setState({comments})` 只会更新 comments 变量，而不会修改或替换 posts 变量。

## 如何将参数传递给事件处理程序?

在迭代或循环期间，向事件处理程序传递额外的参数是很常见的。这可以通过箭头函数或绑定方法实现。让我们以网格中更新的用户详细信息为例：

``` jsx
<button onClick={(e) => this.updateUser(userId, e)}>Update User details</button>
<button onClick={this.updateUser.bind(this, userId)}>Update User details</button>
```

在这两种方法中，合成参数 e 作为第二个参数传递。你需要在箭头函数中显式传递它，并使用 bind 方法自动转发它。

## 如何防止组件渲染?
你可以基于特定的条件通过返回 null 值来阻止组件的渲染。这样它就可以有条件地渲染组件。

``` jsx
function Greeting(props) {
  if (!props.loggedIn) {
    return null;
  }

  return (
    <div className="greeting">
      welcome, {props.name}
    </div>
  );
}
```
``` jsx
class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loggedIn: false, name: 'John'};
  }

  render() {
    return (
      <div>
        {/* Prevent component render if it is not loggedIn */}
        <Greeting loggedIn={this.state.loggedIn} />
        <UserDetails name={this.state.name}>
      </div>
    );
  }
}
```
在上面的示例中，greeting 组件通过应用条件并返回空值跳过其渲染部分。

## 安全地使用索引作为键的条件是什么?

有三个条件可以确保，使用索引作为键是安全的：

1. 列表项是静态的，它们不会被计算，也不会更改。
2. 列表中的列表项没有 ids 属性。
3. 列表不会被重新排序或筛选。

## keys 是否需要全局唯一?

数组中使用的键在其同级中应该是唯一的，但它们不需要是全局唯一的。也就是说，你可以在两个不同的数组中使用相同的键。例如，下面的 book 组件在不同的组件中使用相同的数组：

``` jsx
function Book(props) {
  const index = (
    <ul>
      {props.pages.map((page) =>
        <li key={page.id}>
          {page.title}
        </li>
      )}
    </ul>
  );
  const content = props.pages.map((page) =>
    <div key={page.id}>
      <h3>{page.title}</h3>
      <p>{page.content}</p>
      <p>{page.pageNumber}</p>
    </div>
  );
  return (
    <div>
      {index}
      <hr />
      {content}
    </div>
  );
}
```

## 用于表单处理的流行选择是什么?

Formik 是一个用于 React 的表单库，它提供验证、跟踪访问字段和处理表单提交等解决方案。具体来说，你可以按以下方式对它们进行分类：

1. 获取表单状态输入和输出的值。
2. 表单验证和错误消息。
3. 处理表单提交。

它用于创建一个具有最小 API 的可伸缩、性能良好的表单助手，以解决令人讨厌的问题。

## formik 相对于其他 redux 表单库有什么优势?

下面是建议使用 formik 而不是 redux 表单库的主要原因：

1. 表单状态本质上是短期的和局部的，因此不需要在 redux（或任何类型的flux库）中跟踪它。
2. 每次按一个键，Redux-Form 都会多次调用整个顶级 Redux Reducer。这样就增加了大型应用程序的输入延迟。
3. 经过 gzip 压缩过的 Redux-Form 为 22.5 kB，而 Formik 只有 12.7 kB。

## 为什么不需要使用继承?

在 React 中，建议使用组合而不是继承来重用组件之间的代码。继承和组合都为你提供了以一种明确和安全的方式自定义组件外观和行为所需的灵活性。但是，如果你希望在组件之间复用非 UI 功能，建议将其提取到单独的 JavaScript 模块中。之后的组件导入它并使用该函数、对象或类，而不需扩展它。

## 我可以在 React 应用程序中可以使用 web components 么?

是的，你可以在 React 应用程序中使用 Web Components。尽管许多开发人员不会使用这种组合方式，但如果你使用的是使用 Web Components 编写的第三方 UI 组件，则可能需要这种组合。例如，让我们使用 Vaadin 提供的 Web Components 日期选择器组件：

``` jsx
import React, { Component } from 'react';
import './App.css';
import '@vaadin/vaadin-date-picker';

class App extends Component {
  render() {
    return (
      <div className="App">
        <vaadin-date-picker label="When were you born?"></vaadin-date-picker>
      </div>
    );
  }
}

export default App;
```

## 什么是动态导入?

动态导入语法是 ECMAScript 提案，目前不属于语言标准的一部分。它有望在不久的将来被采纳。在你的应用程序中，你可以使用动态导入来实现代码拆分。让我们举一个加法的例子：

1. Normal Import

``` js
import { add } from './math';
console.log(add(10, 20));
```

2. Dynamic Import
``` js
import("./math").then(math => {
  console.log(math.add(10, 20));
});
```

## 什么是 loadable 组件?

如果你想要在服务端渲染的应用程序中实现代码拆分，建议使用 Loadable 组件，因为 React.lazy 和 Suspense 还不可用于服务器端渲染。Loadable 允许你将动态导入的组件作为常规的组件进行渲染。让我们举一个例子：

``` jsx
import loadable from '@loadable/component'

const OtherComponent = loadable(() => import('./OtherComponent'))

function MyComponent() {
  return (
    <div>
      <OtherComponent />
    </div>
  )
}
```

现在，其他组件将以单独的包进行加载。

## 什么是 suspense 组件?
如果父组件在渲染时包含 dynamic import 的模块尚未加载完成，在此加载过程中，你必须使用一个 loading 指示器显示后备内容。这可以使用 Suspense 组件来实现。例如，下面的代码使用 Suspense 组件：

``` jsx
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </Suspense>
    </div>
  );
}
```

正如上面的代码中所展示的，懒加载的组件被包装在 Suspense 组件中。

## 什么是基于路由的代码拆分?
进行代码拆分的最佳位置之一是路由。整个页面将立即重新渲染，因此用户不太可能同时与页面中的其他元素进行交互。因此，用户体验不会受到干扰。让我们以基于路由的网站为例，使用像 React Router 和 React.lazy 这样的库：

``` jsx
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';

const Home = lazy(() => import('./routes/Home'));
const About = lazy(() => import('./routes/About'));

const App = () => (
  <Router>
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route exact path="/" component={Home}/>
        <Route path="/about" component={About}/>
      </Switch>
    </Suspense>
  </Router>
);
```

在上面的代码中，代码拆分将发生在每个路由层级。

## 举例说明如何使用 context?

Context 旨在共享可被视为全局的数据，用于 React 组件树。例如，在下面的代码中，允许手动通过一个 theme 属性来设置按钮组件的样式。

``` jsx
//Lets create a context with a default theme value "luna"
const ThemeContext = React.createContext('luna');
// Create App component where it uses provider to pass theme value in the tree
class App extends React.Component {
  render() {
    return (
      <ThemeContext.Provider value="nova">
        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}
// A middle component where you don't need to pass theme prop anymore
function Toolbar(props) {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}
// Lets read theme value in the button component to use
class ThemedButton extends React.Component {
  static contextType = ThemeContext;
  render() {
    return <Button theme={this.context} />;
  }
}
```

## 在 context 中默认值的目的是什么?

当在组件树中的组件没有匹配到在其上方的 Provider 时，才会使用 defaultValue 参数。这有助于在不包装组件的情况下单独测试组件。下面的代码段提供了默认的主题值 Luna。

``` jsx
const defaultTheme = "Luna";
const MyContext = React.createContext(defaultTheme);
```

## 你是怎么使用 contextType?

ContextType 用于消费 context 对象。ContextType 属性可以通过两种方式使用：

1. **contextType as property of class**: 可以为类的 contextType 属性分配通过 React.createContext() 创建的 context 对象。之后，你可以在任何生命周期方法和 render 函数中使用 this.context 引用该上下文类型最近的当前值。

让我们在 MyClass 上按如下方式设置 contextType 属性：

``` jsx
class MyClass extends React.Component {
  componentDidMount() {
    let value = this.context;
    /* perform a side-effect at mount using the value of MyContext */
  }
  componentDidUpdate() {
    let value = this.context;
    /* ... */
  }
  componentWillUnmount() {
    let value = this.context;
    /* ... */
  }
  render() {
    let value = this.context;
    /* render something based on the value of MyContext */
  }
}
MyClass.contextType = MyContext;
```

2. **Static field** 你可以使用静态类属性来初始化 contextType 属性：
``` jsx
class MyClass extends React.Component {
  static contextType = MyContext;
  render() {
    let value = this.context;
    /* render something based on the value */
  }
}
```

## 什么是 consumer?
Consumer 是一个订阅上下文更改的 React 组件。它需要一个函数作为子元素，该函数接收当前上下文的值作为参数，并返回一个 React 元素。传递给函数 value 参数的参数值将等于在组件树中当前组件最近的 Provider 元素的 value 属性值。举个简单的例子：

``` jsx
<MyContext.Consumer>
  {value => /* render something based on the context value */}
</MyContext.Consumer>
```

## 在使用 context 时，如何解决性能方面的问题?

Context 使用引用标识来确定何时重新渲染，当 Provider 的父元素重新渲染时，会有一些问题即可能会在 Consumers 中触发无任何意图的渲染。 例如，下面的代码将在每次 Provider 重新渲染时，重新渲染所有的 Consumers，这是因为渲染 Provider 时，始终会为 value 属性创建一个新的对象：

``` jsx
class App extends React.Component {
  render() {
    return (
      <Provider value={{something: 'something'}}>
        <Toolbar />
      </Provider>
    );
  }
}
```

可以通过把 value 的值提升到父状态中来解决这个问题：

``` jsx
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: {something: 'something'},
    };
  }

  render() {
    return (
      <Provider value={this.state.value}>
        <Toolbar />
      </Provider>
    );
  }
}
```

## 在 HOCs 中 forward ref 的目的是什么?
因为 ref 不是一个属性，所以 Refs 不会被传递。就像 key 一样，React 会以不同的方式处理它。如果你将 ref 添加到 HOC，则该 ref 将引用最外层的容器组件，而不是包装的组件。在这种情况下，你可以使用 Forward Ref API。例如，你可以使用 React.forwardRef API 显式地将 refs 转发的内部的 FancyButton 组件。

以下的 HOC 会记录所有的 props 变化：

``` jsx
function logProps(Component) {
  class LogProps extends React.Component {
    componentDidUpdate(prevProps) {
      console.log('old props:', prevProps);
      console.log('new props:', this.props);
    }

    render() {
      const {forwardedRef, ...rest} = this.props;

      // Assign the custom prop "forwardedRef" as a ref
      return <Component ref={forwardedRef} {...rest} />;
    }
  }

  return React.forwardRef((props, ref) => {
    return <LogProps {...props} forwardedRef={ref} />;
  });
}
```

让我们使用这个 HOC 来记录所有传递到我们 “fancy button” 组件的属性：

``` jsx
class FancyButton extends React.Component {
  focus() {
    // ...
  }

  // ...
}
export default logProps(FancyButton);
```

现在让我们创建一个 ref 并将其传递给 FancyButton 组件。在这种情况下，你可以聚焦到 button 元素上。

``` jsx
import FancyButton from './FancyButton';

const ref = React.createRef();
ref.current.focus();
<FancyButton
  label="Click Me"
  handleClick={handleClick}
  ref={ref}
/>;
```

## ref 参数对于所有函数或类组件是否可用?

常规函数或类组件不会接收到 ref 参数，并且 ref 在 props 中也不可用。只有在使用 React.forwardRef 定义组件时，才存在第二个 ref 参数。

## 在组件库中当使用 forward refs 时，你需要额外的注意?

当你开始在组件库中使用 forwardRef 时，你应该将其视为一个破坏性的更改，并为库发布一个新的主要版本。这是因为你的库可能具有不同的行为，如已分配了哪些引用，以及导出哪些类型。这些更改可能会破坏依赖于旧行为的应用程序和其他库。

## 如何在没有 ES6 的情况下创建 React 类组件

如果你不使用 ES6，那么你可能需要使用 create-react-class 模块。对于默认属性，你需要在传递对象上定义 getDefaultProps() 函数。而对于初始状态，必须提供返回初始状态的单独 getInitialState 方法。

``` jsx
var Greeting = createReactClass({
  getDefaultProps: function() {
      return {
        name: 'Jhohn'
      };
    },
  getInitialState: function() {
      return {message: this.props.message};
    },
  handleClick: function() {
     console.log(this.state.message);
  },
  render: function() {
    return <h1>Hello, {this.props.name}</h1>;
  }
});
```

**注意：** 如果使用 createReactClass，则所有方法都会自动绑定。也就是说，你不需要在事件处理程序的构造函数中使用 .bind(this)。

## 是否可以在没有 JSX 的情况下使用 React?
是的，使用 React 不强制使用 JSX。实际上，当你不想在构建环境中配置编译环境时，这是很方便的。每个 JSX 元素只是调用 React.createElement(component, props, ...children) 的语法糖。例如，让我们来看一下使用 JSX 的 greeting 示例：

``` jsx
class Greeting extends React.Component {
  render() {
    return <div>Hello {this.props.message}</div>;
  }
}

ReactDOM.render(
  <Greeting message="World" />,
  document.getElementById('root')
);
```

你可以在没有 JSX 的情况下编写相同的功能，如下所示：

``` js
class Greeting extends React.Component {
  render() {
    return React.createElement('div', null, `Hello ${this.props.message}`);
  }
}

ReactDOM.render(
  React.createElement(Greeting, {message: 'World'}, null),
  document.getElementById('root')
);
```

## 什么是差异算法?

React 需要使用算法来了解如何有效地更新 UI 以匹配最新的树。差异算法将生成将一棵树转换为另一棵树的最小操作次数。然而，算法具有 O(n3) 的复杂度，其中 n 是树中元素的数量。在这种情况下，对于显示 1000 个元素将需要大约 10 亿个比较。这太昂贵了。相反，React 基于两个假设实现了一个复杂度为 O(n) 的算法：

1. 两种不同类型的元素会产生不同的树结构。
2. 开发者可以通过一个 key 属性，标识哪些子元素可以在不同渲染中保持稳定。

## 差异算法涵盖了哪些规则?

在区分两棵树时，React 首先比较两个根元素。根据根元素的类型，行为会有所不同。它在重构算法中涵盖了以下规则：

1. **不同类型的元素：**

每当根元素具有不同的类型时，React 将移除旧树并从头开始构建新树。

2. **相同类型的DOM元素：**
当比较两个相同类型的 React DOM 元素时，React 查看两者的属性，保持相同的底层 DOM 节点，并仅更新已更改的属性。让我们以相同的 DOM 元素为例，除了 className 属性，

``` jsx
<div className="show" title="ReactJS" />

<div className="hide" title="ReactJS" />
```

3. **相同类型的组件元素：**

当组件更新时，实例保持不变，以便在渲染之间保持状态。React 更新底层组件实例的 props 以匹配新元素，并在底层实例上调用 componentWillReceiveProps() 和 componentWillUpdate()。之后，调用 render() 方法，diff 算法对前一个结果和新结果进行递归。

4. **递归子节点：**

当对 DOM 节点的子节点进行递归时，React 会同时迭代两个子节点列表，并在出现差异时生成变异。例如，在子节点末尾添加元素时，在这两个树之间进行转换效果很好。

``` jsx
<ul>
  <li>first</li>
  <li>second</li>
</ul>

<ul>
  <li>first</li>
  <li>second</li>
  <li>third</li>
</ul>
```

5. **处理 Key：**

React支持 key 属性。当子节点有 key 时，React 使用 key 将原始树中的子节点与后续树中的子节点相匹配。例如，添加 key 可以使树有效地转换，

``` jsx
<ul>
  <li key="2015">Duke</li>
  <li key="2016">Villanova</li>
</ul>

<ul>
  <li key="2014">Connecticut</li>
  <li key="2015">Duke</li>
  <li key="2016">Villanova</li>
</ul>
```

## 你什么时候需要使用 refs?

这里是 refs 的一些使用场景：

1. 管理聚焦、文本选择或媒体播放。
2. 触发命令式动画。
3. 与第三方 DOM 库集成。

## 对于渲染属性来说是否必须将 prop 属性命名为 render?

即使模式名为 render props，你也不必使用名为 render 的属性名来使用此模式。也就是说，组件用于知道即将渲染内容的任何函数属性，在技术上都是一个 render props。让我们举一个名为 children 渲染属性的示例：

``` jsx
<Mouse children={mouse => (
  <p>The mouse position is {mouse.x}, {mouse.y}</p>
)}/>
```

实际上，以上的 children 属性不一定需要在 JSX 元素的 attributes 列表中命名。反之，你可以将它直接放在元素内部：

``` jsx
<Mouse>
  {mouse => (
    <p>The mouse position is {mouse.x}, {mouse.y}</p>
  )}
</Mouse>
```

当使用上述的技术，需要在 propTypes 中明确声明 children 必须为函数类型：

``` jsx
Mouse.propTypes = {
  children: PropTypes.func.isRequired
};
```

## 在 Pure Component 中使用渲染属性会有什么问题?

如果在渲染方法中创建函数，则会否定纯组件的用途。因为浅属性比较对于新属性总是返回 false，在这种情况下，每次渲染都将为渲染属性生成一个新值。你可以通过将渲染函数定义为实例方法来解决这个问题。

## 如何使用渲染属性创建 HOC?
可以使用带有渲染属性的常规组件实现大多数高阶组件（HOC）。例如，如果希望使用 withMouse HOC 而不是 <Mouse> 组件，则你可以使用带有渲染属性的常规 <Mouse> 组件轻松创建一个 HOC 组件。

``` jsx
function withMouse(Component) {
  return class extends React.Component {
    render() {
      return (
        <Mouse render={mouse => (
          <Component {...this.props} mouse={mouse} />
        )}/>
      );
    }
  }
}
```

## 什么是 windowing 技术?

Windowing 是一种技术，它在任何给定时间只呈现一小部分行，并且可以显著减少重新呈现组件所需的时间以及创建的 DOM 节点的数量。如果应用程序呈现长的数据列表，则建议使用此技术。react-window 和 react-virtualized 都是常用的 windowing 库，它提供了几个可重用的组件，用于显示列表、网格和表格数据。

## 你如何在 JSX 中打印 falsy 值?

Falsy 值比如 false，null，undefined 是有效的子元素，但它们不会呈现任何内容。如果仍要显示它们，则需要将其转换为字符串。我们来举一个如何转换为字符串的例子：

``` jsx
<div>
  My JavaScript variable is {String(myVariable)}.
</div>
```

## portals 的典型使用场景是什么?

当父组件拥有 `overflow: hidden` 或含有影响堆叠上下文的属性（z-index、position、opacity 等样式），且需要脱离它的容器进行展示时，React portal 就非常有用。例如，对话框、全局消息通知、悬停卡和工具提示。

## 如何设置非受控组件的默认值?

在 React 中，表单元素的属性值将覆盖其 DOM 中的值。对于非受控组件，你可能希望能够指定其初始值，但不会控制后续的更新。要处理这种情形，你可以指定一个 **defaultValue** 属性来取代 **value** 属性。

``` jsx
render() {
  return (
    <form onSubmit={this.handleSubmit}>
      <label>
        User Name:
        <input
          defaultValue="John"
          type="text"
          ref={this.input} />
      </label>
      <input type="submit" value="Submit" />
    </form>
  );
}
```
这同样适用于 `select` 和 `textArea` 输入框。但对于 `checkbox` 和 `radio` 控件，需要使用 **defaultChecked**。

## 你最喜欢的 React 技术栈是什么?

尽管技术栈因开发人员而异，但最流行的技术栈用于 React boilerplate 项目代码中。它主要使用 redux 和 redux saga 进行状态管理和具有副作用的异步操作，使用 react-router 进行路由管理，使用 styled-components 库开发 React 组件，使用 axios 调用 REST api，以及其他支持的技术栈，如 webpack、reseselect、esnext、babel 等。

你可以克隆 https://github.com/react-boilerplate/react-boilerplate 并开始开发任何新的 React 项目。

## Real DOM 和 Virtual DOM 有什么区别?

以下是Real DOM和Virtual DOM之间的主要区别：

| Real DOM | Virtual DOM |
| ---- | ---- |
| 更新速度慢 | 更新速度快 |
| DOM 操作非常昂贵 | DOM 操作非常简单 |
| 可以直接更新 HTML | 你不能直接更新 HTML |
| 造成太多内存浪费 | 更少的内存消耗 |
| 如果元素更新了，创建新的 DOM 节点 | 如果元素更新，则更新 JSX 元素 |

## 如何为 React 应用程序添加 bootstrap?

Bootstrap 可以通过三种可能的方式添加到 React 应用程序中：

1. 使用 Bootstrap CDN: 这是添加 bootstrap 最简单的方式。在 head 标签中添加 bootstrap 相应的 CSS 和 JS 资源。

2. 把 Bootstrap 作为依赖项： 如果你使用的是构建工具或模块绑定器（如Webpack），那么这是向 React 应用程序添加 bootstrap 的首选选项。

``` shell
npm install bootstrap
```

3. 使用 React Bootstrap 包: 在这种情况下，你可以将 Bootstrap 添加到我们的 React 应用程序中，方法是使用一个以 React 组件形式对 Bootstrap 组件进行包装后包。下面的包在此类别中很流行：
  - react-bootstrap
  - reactstrap

## 你能否列出使用 React 作为前端框架的顶级网站或应用程序?

以下是使用 React 作为前端框架的前 10 个网站：

1. Facebook
2. Uber
3. Instagram
4. WhatsApp
5. Khan Academy
6. Airbnb
7. Dropbox
8. Flipboard
9. Netflix
10. PayPal

## 是否建议在 React 中使用 CSS In JS 技术?

React 对如何定义样式没有任何意见，但如果你是初学者，那么好的起点是像往常一样在单独的 *.css 文件中定义样式，并使用类名引用它们。此功能不是 React 的一部分，而是来自第三方库。但是如果你想尝试不同的方法（JS中的CSS），那么 styled-components 库是一个不错的选择。

## 我需要用 hooks 重写所有类组件吗?

不需要。但你可以在某些组件（或新组件）中尝试使用 hooks，而无需重写任何已存在的代码。因为在 ReactJS 中目前没有移除 classes 的计划。

## 如何使用 React Hooks 获取数据?
名为 useEffect 的 effect hook 可用于使用 axios 从 API 中获取数据，并使用 useState 钩子提供的更新函数设置组件本地状态中的数据。让我们举一个例子，它从 API 中获取 react 文章列表。

``` jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState({ hits: [] });

  useEffect(async () => {
    const result = await axios(
      'http://hn.algolia.com/api/v1/search?query=react',
    );

    setData(result.data);
  }, []);

  return (
    <ul>
      {data.hits.map(item => (
        <li key={item.objectID}>
          <a href={item.url}>{item.title}</a>
        </li>
      ))}
    </ul>
  );
}

export default App;
```

记住，我们为 effect hook 提供了一个空数组作为第二个参数，以避免在组件更新时再次激活它，它只会在组件挂载时被执行。比如，示例中仅在组件挂载时获取数据。

## Hooks 是否涵盖了类的所有用例?

Hooks 并没有涵盖类的所有用例，但是有计划很快添加它们。目前，还没有与不常见的 getSnapshotBeforeUpdate 和componentDidCatch 生命周期等效的钩子。

## 什么是mvvm？

> MVVM是Model-View-ViewModel的缩写。mvvm是一种设计思想。Model 层代表数据模型，也可以在Model中定义数据修改和操作的业务逻辑；View 代表UI 组件，它负责将数据模型转化成UI 展现出来，ViewModel 是一个同步View 和 Model的对象

- 在MVVM架构下，View 和 Model 之间并没有直接的联系，而是通过ViewModel进行交互，Model 和 ViewModel 之间的交互是双向的， 因此View 数据的变化会同步到Model中，而Model 数据的变化也会立即反应到View 上。
- ViewModel 通过双向数据绑定把 View 层和 Model 层连接了起来，而View 和 Model 之间的同步工作完全是自动的，无需人为干涉，因此开发者只需关注业务逻辑，不需要手动操作DOM, 不需要关注数据状态的同步问题，复杂的数据状态维护完全由 MVVM 来统一管理

## vue的优点是什么？

- 低耦合。视图（View）可以独立于Model变化和修改，一个ViewModel可以绑定到不同的"View"上，当View变化的时候Model可以不变，当Model变化的时候View也可以不变
- 可重用性。你可以把一些视图逻辑放在一个ViewModel里面，让很多view重用这段视图逻辑
- 可测试。界面素来是比较难于测试的，而现在测试可以针对ViewModel来写

## 请详细说下你对vue生命周期的理解

> 答：总共分为8个阶段创建前/后，载入前/后，更新前/后，销毁前/后


- 创建前/后： 在beforeCreate阶段，vue实例的挂载元素el和数据对象data都为undefined，还未初始化。在created阶段，vue实例的数据对象data有了，el还没有
- 载入前/后：在beforeMount阶段，vue实例的$el和data都初始化了，但还是挂载之前为虚拟的dom节点，data.message还未替换。在mounted阶段，vue实例挂载完成，data.message成功渲染。
- 更新前/后：当data变化时，会触发beforeUpdate和updated方法
- 销毁前/后：在执行destroy方法后，对data的改变不会再触发周期函数，说明此时vue实例已经解除了事件监听以及和dom的绑定，但是dom结构依然存在

## 组件之间的传值？

### **父组件与子组件传值**

``` vue
//父组件通过标签上面定义传值
<template>
    <Main :obj="data"></Main>
</template>
<script>
    //引入子组件
    import Main form "./main"

    exprot default{
        name:"parent",
        data(){
            return {
                data:"我要向子组件传递数据"
            }
        },
        //初始化组件
        components:{
            Main
        }
    }
</script>


//子组件通过props方法接受数据

<template>
    <div>{{data}}</div>
</template>
<script>
    exprot default{
        name:"son",
        //接受父组件传值
        props:["data"]
    }
</script>

```

### **子组件向父组件传递数据**

``` vue
//子组件通过$emit方法传递参数
<template>
   <div v-on:click="events"></div>
</template>
<script>
    //引入子组件
    import Main form "./main"

    exprot default{
        methods:{
            events:function(){
            }
        }
    }
</script>


//
<template>
    <div>{{data}}</div>
</template>
<script>
    exprot default{
        name:"son",
        //接受父组件传值
        props:["data"]
    }
</script>
```

## 路由之间跳转？

### **声明式（标签跳转）**

``` vue
<router-link :to="index">
```

### **编程式（ js跳转）**

``` js
router.push('index')
```

## vuex是什么？怎么使用？哪种功能场景使用它？

> vue框架中状态管理。在main.js引入store，注入。新建了一个目录`store`，….. `export` 。场景有：单页应用中，组件之间的状态。音乐播放、登录状态、加入购物车


## 实现 Vue SSR

![Vue SSR](http://7xq6al.com1.z0.glb.clouddn.com/vue-ssr.jpg)

### **其基本实现原理**

- app.js 作为客户端与服务端的公用入口，导出 Vue 根实例，供客户端 entry 与服务端 entry 使用。客户端 entry 主要作用挂载到 DOM 上，服务端 entry 除了创建和返回实例，还进行路由匹配与数据预获取。
- webpack 为客服端打包一个 Client Bundle ，为服务端打包一个 Server Bundle 。
- 服务器接收请求时，会根据 url，加载相应组件，获取和解析异步数据，创建一个读取 Server Bundle 的 BundleRenderer，然后生成 html 发送给客户端。
- 客户端混合，客户端收到从服务端传来的 DOM 与自己的生成的 DOM 进行对比，把不相同的 DOM 激活，使其可以能够响应后续变化，这个过程称为客户端激活 。为确保混合成功，客户端与服务器端需要共享同一套数据。在服务端，可以在渲染之前获取数据，填充到 stroe 里，这样，在客户端挂载到 DOM 之前，可以直接从 store 里取数据。首屏的动态数据通过 `window.__INITIAL_STATE__ `发送到客户端

> Vue SSR 的实现，主要就是把 Vue 的组件输出成一个完整 HTML, vue-server-renderer 就是干这事的

- `Vue SSR `需要做的事多点（输出完整 HTML），除了` complier -> vnode`，还需如数据获取填充至 HTML、客户端混合（hydration）、缓存等等。
相比于其他模板引擎（ejs, jade 等），最终要实现的目的是一样的，性能上可能要差点

## Vue 组件 data 为什么必须是函数

- 每个组件都是 Vue 的实例。
- 组件共享 data 属性，当 data 的值是同一个引用类型的值时，改变其中一个会影响其他

## Vue computed 实现

- 建立与其他属性（如：data、 Store）的联系；
- 属性改变后，通知计算属性重新计算

> 实现时，主要如下

- 初始化 data， 使用 `Object.defineProperty` 把这些属性全部转为 `getter/setter`。
- 初始化 `computed`, 遍历 `computed` 里的每个属性，每个 computed 属性都是一个 watch 实例。每个属性提供的函数作为属性的 getter，使用 Object.defineProperty 转化。
- `Object.defineProperty getter` 依赖收集。用于依赖发生变化时，触发属性重新计算。
- 若出现当前 computed 计算属性嵌套其他 computed 计算属性时，先进行其他的依赖收集

## Vue complier 实现

- 模板解析这种事，本质是将数据转化为一段 html ，最开始出现在后端，经过各种处理吐给前端。随着各种 mv* 的兴起，模板解析交由前端处理。
- 总的来说，Vue complier 是将 template 转化成一个 render 字符串。

> 可以简单理解成以下步骤：

- parse 过程，将 template 利用正则转化成 AST 抽象语法树。
- optimize 过程，标记静态节点，后 diff 过程跳过静态节点，提升性能。
- generate 过程，生成 render 字符串

## 怎么快速定位哪个组件出现性能问题

> 用 timeline 工具。 大意是通过 timeline 来查看每个函数的调用时常，定位出哪个函数的问题，从而能判断哪个组件出了问题

## MVVM

### **MVVM 由以下三个内容组成**

- `View`：界面
- `Model`：数据模型
- `ViewModel`：作为桥梁负责沟通 `View` 和 `Model`

> - 在 JQuery 时期，如果需要刷新 UI 时，需要先取到对应的 DOM 再更新 UI，这样数据和业务的逻辑就和页面有强耦合
> - 在 MVVM 中，UI 是通过数据驱动的，数据一旦改变就会相应的刷新对应的 UI，UI 如果改变，也会改变对应的数据。这种方式就可以在业务处理中只关心数据的流转，而无需直接和页面打交道。ViewModel 只关心数据和业务的处理，不关心 View 如何处理数据，在这种情况下，View 和 Model 都可以独立出来，任何一方改变了也不一定需要改变另一方，并且可以将一些可复用的逻辑放在一个 ViewModel 中，让多个 View 复用这个 ViewModel

- 在 MVVM 中，最核心的也就是数据双向绑定，例如 Angluar 的脏数据检测，Vue 中的数据劫持

### **脏数据检测**

- 当触发了指定事件后会进入脏数据检测，这时会调用 $digest 循环遍历所有的数据观察者，判断当前值是否和先前的值有区别，如果检测到变化的话，会调用 $watch 函数，然后再次调用 $digest 循环直到发现没有变化。循环至少为二次 ，至多为十次
- 脏数据检测虽然存在低效的问题，但是不关心数据是通过什么方式改变的，都可以完成任务，但是这在 Vue 中的双向绑定是存在问题的。并且脏数据检测可以实现批量检测出更新的值，再去统一更新 UI，大大减少了操作 DOM 的次数

### **数据劫持**

- `Vue` 内部使用了 `Obeject.defineProperty()` 来实现双向绑定，通过这个函数可以监听到 `set` 和 `get `的事件

```javascript
var data = { name: 'yck' }
observe(data)
let name = data.name // -> get value
data.name = 'yyy' // -> change value

function observe(obj) {
  // 判断类型
  if (!obj || typeof obj !== 'object') {
    return
  }
  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key])
  })
}

function defineReactive(obj, key, val) {
  // 递归子属性
  observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      console.log('get value')
      return val
    },
    set: function reactiveSetter(newVal) {
      console.log('change value')
      val = newVal
    }
  })
}
```

> 以上代码简单的实现了如何监听数据的 set 和 get 的事件，但是仅仅如此是不够的，还需要在适当的时候给属性添加发布订阅

```html
<div>
    {{name}}
</div>
```

> 在解析如上模板代码时，遇到 `{{name}}` 就会给属性 `name` 添加发布订阅


```javascript
// 通过 Dep 解耦
class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub) {
    // sub 是 Watcher 实例
    this.subs.push(sub)
  }
  notify() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}

// 全局属性，通过该属性配置 Watcher
Dep.target = null

function update(value) {
  document.querySelector('div').innerText = value
}

class Watcher {
  constructor(obj, key, cb) {
    // 将 Dep.target 指向自己
    // 然后触发属性的 getter 添加监听
    // 最后将 Dep.target 置空
    Dep.target = this
    this.cb = cb
    this.obj = obj
    this.key = key
    // obj[key], 调用其对应的get方法，将该watcher实例添加到解偶Dep实例的的subs数组中
    this.value = obj[key]
    Dep.target = null
  }
  update() {
    // 获得新值
    this.value = this.obj[this.key]
    // 调用 update 方法更新 Dom
    this.cb(this.value)
  }
}
var data = { name: 'yck' }
observe(data)
// 模拟解析到 `{{name}}` 触发的操作
new Watcher(data, 'name', update)
// update Dom innerText
data.name = 'yyy'
```

> 接下来,对 defineReactive 函数进行改造

```javascript
function defineReactive(obj, key, val) {
  // 递归子属性
  observe(val)
  let dp = new Dep()
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      console.log('get value')
      // 将 Watcher 添加到订阅
      if (Dep.target) {
        dp.addSub(Dep.target)
      }
      return val
    },
    set: function reactiveSetter(newVal) {
      console.log('change value')
      val = newVal
      // 执行 watcher 的 update 方法
      dp.notify()
    }
  })
}
```

> 以上实现了一个简易的双向绑定，核心思路就是手动触发一次属性的 getter 来实现发布订阅的添加

### **Proxy 与 Obeject.defineProperty 对比**

- `Obeject.defineProperty` 虽然已经能够实现双向绑定了，但是他还是有缺陷的。
  - 只能对属性进行数据劫持，所以需要深度遍历整个对象
  - 对于数组不能监听到数据的变化

> 虽然 `Vue` 中确实能检测到数组数据的变化，但是其实是使用了 `hack` 的办法，并且也是有缺陷的

## vue 中的性能优化

### 1）编码优化

- 尽量减少data中的数据，data中的数据都会增加getter和setter，会收集对应的watcher
- v-if和v-for不能连用
- 如果需要使用v-for给每项元素绑定事件时使用事件代理
- SPA 页面采用keep-alive缓存组件
- 在更多的情况下，使用v-if替代v-show
- key保证唯一
- 使用路由懒加载、异步组件
- 防抖、节流
- 第三方模块按需导入
- 长列表滚动到可视区域动态加载
- 图片懒加载

### 2）用户体验优化

- 骨架屏
- PWA（渐进式WEB应用）
- 还可以使用缓存(客户端缓存、服务端缓存)优化、服务端开启gzip压缩等。

### 3）SEO优化

- 预渲染
- 服务端渲染SSR

### 4）打包优化

- 压缩代码；
- Tree Shaking/Scope Hoisting；
- 使用cdn加载第三方模块；
- 多线程打包happypack；
- splitChunks抽离公共文件；
- sourceMap优化；

说明：优化是个大工程，会涉及很多方面

## Vue 的实例生命周期

1. beforeCreate 初始化实例后 数据观测和事件配置之前调用

2. created 实例创建完成后调用

3. beforeMount 挂载开始前被用

4. mounted el 被新建 vm. $el 替换并挂在到实例上之后调用

5. beforeUpdate 数据更新时调用

6. updated 数据更改导致的 DOM 重新渲染后调用

7. beforeDestory 实例被销毁前调用

8. destroyed 实例销毁后调用

Vue2 与Vue3的生命周期对比

| 变量 | 实例化(次数) |
| ---- | ---- |
| beforeCreate(组件创建之前) | setup(组件创建之前) |
| created(组件创建完成) | setup(组件创建完成) |
| beforeMount(组件挂载之前) | onBeforeMount(组件挂载之前) |
| mounted(组件挂载完成) | onMounted(组件挂载完成) |
| beforeUpdate(数据更新，虚拟DOM打补丁之前) | onBeforeUpdate(数据更新，虚拟DOM打补丁之前) |
| updated(数据更新，虚拟DOM渲染完成) | onUpdated(数据更新，虚拟DOM渲染完成) |
| beforeDestroy(组件销毁之前) | onBeforeUnmount(组件销毁之前) |
| destroyed(组件销毁之后) | onUnmounted(组件销毁之后) |

## Vue 的双向数据绑定的原理

VUE 实现双向数据绑定的原理就是利用了 Object. defineProperty() 这个方法重新定义了对象获取属性值(get)和设置属性值(set)的操作来实现的。

Vue3. 0 将用原生 Proxy 替换 Object. defineProperty

## 为什么要替换 Object.defineProperty？（Proxy 相比于 defineProperty 的优势）

1. 在 Vue 中，Object.defineProperty 无法监控到数组下标的变化，导致直接通过数组的下标给数组设置值，不能实时响应。

2. Object.defineProperty只能劫持对象的属性,因此我们需要对每个对象的每个属性进行遍历。Vue 2.x里，是通过 递归 + 遍历 data 对象来实现对数据的监控的，如果属性值也是对象那么需要深度遍历,显然如果能劫持一个完整的对象是才是更好的选择。

而要取代它的Proxy有以下两个优点:

- 可以劫持整个对象，并返回一个新对象
- 有13种劫持操作

既然Proxy能解决以上两个问题，而且Proxy作为es6的新属性在vue2.x之前就有了，为什么vue2.x不使用Proxy呢？一个很重要的原因就是：

Proxy是es6提供的新特性，兼容性不好，最主要的是这个属性无法用polyfill来兼容

## 什么是 Proxy？

### 含义：
Proxy 是 ES6 中新增的一个特性，翻译过来意思是"代理"，用在这里表示由它来“代理”某些操作。 Proxy 让我们能够以简洁易懂的方式控制外部对对象的访问。其功能非常类似于设计模式中的代理模式。

Proxy 可以理解成，在目标对象之前架设一层“拦截”，外界对该对象的访问，都必须先通过这层拦截，因此提供了一种机制，可以对外界的访问进行过滤和改写。

使用 Proxy 的核心优点是可以交由它来处理一些非核心逻辑（如：读取或设置对象的某些属性前记录日志；设置对象的某些属性值前，需要验证；某些属性的访问控制等）。 从而可以让对象只需关注于核心逻辑，达到关注点分离，降低对象复杂度等目的。

### 基本用法：

``` js
let p = new Proxy(target, handler);
```

参数：

- target 是用Proxy包装的被代理对象（可以是任何类型的对象，包括原生数组，函数，甚至另一个代理）。
- handler 是一个对象，其声明了代理target 的一些操作，其属性是当执行一个操作时定义代理的行为的函数。
- p 是代理后的对象。当外界每次对 p 进行操作时，就会执行 handler 对象上的一些方法。Proxy共有13种劫持操作，

handler代理的一些常用的方法有如下几个：
``` txt
get： 读取
set： 修改
has： 判断对象是否有该属性
construct： 构造函数
```

### 示例：

下面就用Proxy来定义一个对象的get和set，作为一个基础demo

``` js
let obj = {};
let handler = {
    get(target, property) {
        console.log( `${property} 被读取` );
        return property in target ? target[property] : 3;
    },
    set(target, property, value) {
        console.log( `${property} 被设置为 ${value}` );
        target[property] = value;
    }
}

let p = new Proxy(obj, handler);
p.name = 'tom' //name 被设置为 tom
p.age; //age 被读取 3
```

p 读取属性的值时，实际上执行的是 handler.get() ：在控制台输出信息，并且读取被代理对象 obj 的属性。

p 设置属性值时，实际上执行的是 handler.set() ：在控制台输出信息，并且设置被代理对象 obj 的属性的值。

以上介绍了Proxy基本用法，实际上这个属性还有许多内容，具体可参考[Proxy文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

## 为什么避免 v-if 和 v-for 用在一起

当 Vue 处理指令时，v-for 比 v-if 具有更高的优先级，这意味着 v-if 将分别重复运行于每个 v-for 循环中。通过 v-if 移动到容器元素，不会再重复遍历列表中的每个值。取而代之的是，我们只检查它一次，且不会在 v-if 为否的时候运算 v-for。

## 组件的设计原则

1. 页面上每个独立的可视/可交互区域视为一个组件(比如页面的头部，尾部，可复用的区块)
2. 每个组件对应一个工程目录，组件所需要的各种资源在这个目录下就近维护(组件的就近维护思想体现了前端的工程化思想，为前端开发提供了很好的分治策略，在vue.js中，通过.vue文件将组件依赖的模板，js，样式写在一个文件中)
(每个开发者清楚开发维护的功能单元，它的代码必然存在在对应的组件目录中，在该目录下，可以找到功能单元所有的内部逻辑)
3. 页面不过是组件的容器，组件可以嵌套自由组合成完整的页面

## vue slot是做什么的?

可以插入的槽口，比如插座的插孔。

## 对于 Vue 是一套渐进式框架的理解

每个框架都不可避免会有自己的一些特点，从而会对使用者有一定的要求，这些要求就是主张，主张有强有弱，它的强势程度会影响在业务开发中的使用方式。

1、使用 vue，你可以在原有大系统的上面，把一两个组件改用它实现，当 jQuery 用；

2、也可以整个用它全家桶开发，当 Angular 用；

3、还可以用它的视图，搭配你自己设计的整个下层用。你可以在底层数据逻辑的地方用 OO(Object–Oriented )面向对象和设计模式的那套理念。 也可以函数式，都可以。

它只是个轻量视图而已，只做了自己该做的事，没有做不该做的事，仅此而已。

你不必一开始就用 Vue 所有的全家桶，根据场景，官方提供了方便的框架供你使用。

场景联想

- 场景 1： 维护一个老项目管理后台，日常就是提交各种表单了，这时候你可以把 vue 当成一个 js 库来使用，就用来收集 form 表单，和表单验证。

- 场景 2： 得到 boss 认可， 后面整个页面的 dom 用 Vue 来管理，抽组件，列表用 v-for 来循环，用数据驱动 DOM 的变化

- 场景 3: 越来越受大家信赖，领导又找你了，让你去做一个移动端 webapp，直接上了 vue 全家桶！

场景 1-3 从最初的只因多看你一眼而用了前端 js 库，一直到最后的大型项目解决方案。

## vue.js 的两个核心是什么？

数据驱动和组件化思想

## 请问 v-if 和 v-show 有什么区别

v-show 指令是通过修改元素的 display 的 CSS 属性让其显示或者隐藏

v-if 指令是直接销毁和重建 DOM 达到让元素显示和隐藏的效果

## vue 常用的修饰符

### 事件修饰符
vue为v-on提供了事件修饰符，通过点(.)表示的指令后缀来调用修饰符。

#### .stop

阻止点击事件冒泡。等同于JavaScript中的event.stopPropagation()

例如：
``` vue
<a v-on:click.stop="doThis"></a>
<a @click.stop="doThis"></a>
```

实例1，防止冒泡：
``` vue
<div id="app">
  <div class="outeer" @click.stop="outer">
    <div class="middle" @click.stop="middle">
      <button @click.stop="inner">点击我(^_^)</button>
    </div>
  </div>
</div>
```

使用了.stop后，点击子节点不会捕获到父节点的事件

#### .prevent
防止执行预设的行为（如果事件可取消，则取消该事件，而不停止事件的进一步传播），等同于JavaScript中的event.preventDefault()，prevent等同于JavaScript的event.preventDefault()，用于取消默认事件。比如我们页面的标签，当用户点击时，通常在浏览器的网址列出。

例如：
``` vue
<a v-on:submit.prevent="doThis"></a>
```

#### .capture
与事件冒泡的方向相反，事件捕获由外到内,捕获事件：嵌套两三层父子关系，然后所有都有点击事件，点击子节点，就会触发从外至内 父节点-》子节点的点击事件

``` vue
<a v-on:click.capture="doThis"></a>
```
``` vue
<div id="app">
  <div class="outeer" @click.capture="outer">
    <div class="middle" @click.capture="middle">
      <button @click.capture="inner">点击我(^_^)</button>
    </div>
  </div>
</div>
```

#### .self
只会触发自己范围内的事件，不包含子元素

``` vue
<a v-on:click.self="doThat"></a>
```
``` vue
<div id="app">
  <div class="outeer" @click.self="outer">
    <div class="middle" @click.self="middle">
      <button @click.stop="inner">点击我(^_^)</button>
    </div>
  </div>
</div>
```

#### .once

只执行一次，如果我们在@click事件上添加.once修饰符，只要点击按钮只会执行一次。
``` vue
<a @click.once="doThis"></a>
```

#### .passive
Vue 还对应 addEventListener 中的 passive 选项提供了 .passive 修饰符

``` vue
<!-- 滚动事件的默认行为 (即滚动行为) 将会立即触发 -->
<!-- 而不会等待 `onScroll` 完成  -->
<!-- 这其中包含 `event.preventDefault()` 的情况 -->
<div v-on:scroll.passive="onScroll">...</div>
```

这个 .passive 修饰符尤其能够提升移动端的性能。不要把 .passive 和 .prevent 一起使用，因为 .prevent 将会被忽略，同时浏览器可能会向你展示一个警告。请记住，.passive 会告诉浏览器你不想阻止事件的默认行为。

#### 事件修饰符还可以串联

例如：
``` vue
<a v-on:click.stop.prevent="doThis"></a>
```

注：使用修饰符时，顺序很重要；相应的代码会以同样的顺序产生。因此，用 v-on:click.prevent.self 会阻止所有的点击，而 v-on:click.self.prevent 只会阻止对元素自身的点击。

### 键盘修饰符

在JavaScript事件中除了前面所说的事件，还有键盘事件，也经常需要监测常见的键值。在Vue中允许v-on在监听键盘事件时添加关键修饰符。记住所有的keyCode比较困难，所以Vue为最常用的键盘事件提供了别名：

.enter：回车键
.tab：制表键
.delete：含delete和backspace键
.esc：返回键
.space: 空格键
.up：向上键
.down：向下键
.left：向左键
.right：向右键

例如：
``` vue
<!-- 只有在 `keyCode` 是 13 时调用 `vm.submit()` -->
<input v-on:keyup.13="submit">
```

记住所有的 keyCode 比较困难，所以 Vue 为最常用的按键提供了别名：

``` vue
<!-- 同上 -->
<input v-on:keyup.enter="submit">
<!-- 缩写语法 -->
<input @keyup.enter="submit">
```

可以通过全局 config.keyCodes 对象自定义按键修饰符别名：

``` vue
// 可以使用 `v-on:keyup.f1`
Vue.config.keyCodes.f1 = 112
```

### 3. 系统修饰键
可以用如下修饰符来实现仅在按下相应按键时才触发鼠标或键盘事件的监听器。

.ctrl
.alt
.shift
.meta

注意：在 Mac 系统键盘上，meta 对应 command 键 (⌘)。在 Windows 系统键盘 meta 对应 Windows 徽标键 (⊞)。在 Sun 操作系统键盘上，meta 对应实心宝石键 (◆)。在其他特定键盘上，尤其在 MIT 和 Lisp 机器的键盘、以及其后继产品，比如 Knight 键盘、space-cadet 键盘，meta 被标记为“META”。在 Symbolics 键盘上，meta 被标记为“META”或者“Meta”。

例如：

``` vue
<!-- Alt + C -->
<input @keyup.alt.67="clear">
<!-- Ctrl + Click -->
<div @click.ctrl="doSomething">Do something</div>
```

注意：

请注意修饰键与常规按键不同，在和 keyup 事件一起用时，事件触发时修饰键必须处于按下状态。换句话说，只有在按住 ctrl 的情况下释放其它按键，才能触发 keyup.ctrl。而单单释放 ctrl 也不会触发事件。如果你想要这样的行为，请为 ctrl 换用 keyCode：keyup.17。

#### .exact修饰符
.exact 修饰符允许你控制由精确的系统修饰符组合触发的事件。

``` vue
<!-- 即使 Alt 或 Shift 被一同按下时也会触发 -->
<button @click.ctrl="onClick">A</button>

<!-- 有且只有 Ctrl 被按下的时候才触发 -->
<button @click.ctrl.exact="onCtrlClick">A</button>

<!-- 没有任何系统修饰符被按下的时候才触发 -->
<button @click.exact="onClick">A</button>
```

#### 鼠标按钮修饰符
鼠标修饰符用来限制处理程序监听特定的滑鼠按键。常见的有：
.left
.right
.middle
这些修饰符会限制处理函数仅响应特定的鼠标按钮。

#### 自定义按键修饰符别名
在Vue中可以通过config.keyCodes自定义按键修饰符别名。例如，由于预先定义了keycode 116（即F5）的别名为f5，因此在文字输入框中按下F5，会触发prompt方法，出现alert。

``` vue
<template>
  <div class="main">
      <input type="text" @keyup.f5="prompt()" />
  </div>
</template>
<script>
export default {
  data() {
    return {
    };
  },
  methods:{
      prompt(){
          alert("aaaaa")
      }
  }

};
</script>
```

当点击f5时立马调用prompt方法。

### 4. 修饰符

### .lazy
在改变后才触发（也就是说只有光标离开input输入框的时候值才会改变）
``` vue
<input v-model.lazy="msg" />
```

### .number
将输出字符串转为Number类型·（虽然type类型定义了是number类型，但是如果输入字符串，输出的是string）
``` vue
<input v-model.number="msg" />
```

### .trim
自动过滤用户输入的首尾空格

``` vue
<input v-model.trim="msg" />
```

## v-on 可以监听多个方法吗？

肯定可以的。

解析：
``` vue
<input type="text" :value="name" @input="onInput" @focus="onFocus" @blur="onBlur" />
```

## vue 中 key 值的作用

需要使用 key 来给每个节点做一个唯一标识，Diff 算法就可以正确的识别此节点，找到正确的位置区插入新的节点 所以一句话，key 的作用主要是为了高效的更新虚拟 DOM

## vue-cli 工程升级 vue 版本

在项目目录里运行 npm upgrade vue vue-template-compiler，不出意外的话，可以正常运行和 build。如果有任何问题，删除 node_modules 文件夹然后重新运行 npm i 即可。（简单的说就是升级 vue 和 vue-template-compiler 两个插件）

## vue 事件中如何使用 event 对象？

v-on 指令（可以简写为 @）

1. 使用不带圆括号的形式，event 对象将被自动当做实参传入；

2. 使用带圆括号的形式，我们需要使用 $event 变量显式传入 event 对象。

解析：

### 一、event 对象

#### （一）事件的 event 对象

你说你是搞前端的，那么你肯定就知道事件，知道事件，你就肯定知道 event 对象吧？各种的库、框架多少都有针对 event 对象的处理。比如 jquery，通过它内部进行一定的封装，我们开发的时候，就无需关注 event 对象的部分兼容性问题。最典型的，如果我们要阻止默认事件，在 chrome 等浏览器中，我们可能要写一个：

``` js
event.preventDefault();
```

而在 IE 中，我们则需要写：
``` js
event.returnValue = false;
```
多亏了 jquery ，跨浏览器的实现，我们统一只需要写：

``` js
event.preventDefault();
```
兼容？jquery 内部帮我们搞定了。类似的还有比如阻止事件冒泡以以及事件绑定（addEventListener / attachEvent）等，简单到很多的后端都会使用 $('xxx'). bind(... )，这不是我们今天的重点，我们往下看。

#### （二）vue 中的 event 对象

我们知道，相比于 jquery，vue 的事件绑定可以显得更加直观和便捷，我们只需要在模板上添加一个 v-on 指令（还可以简写为 @），即可完成类似于 $('xxx'). bind 的效果，少了一个利用选择器查询元素的操作。我们知道，jquery 中，event 对象会被默认当做实参传入到处理函数中，如下

``` js
$("body").bind("click", function(event) {
    console.log(typeof event); // object
});
```
这里直接就获取到了 event 对象，那么问题来了，vue 中呢？

``` vue
<div id="app">
    <button v-on:click="click">click me</button>
</div>
...
var app = new Vue({
    el: '#app',
    methods: {
        click(event) {
            console.log(typeof event);    // object
        }
    }
});
```

这里的实现方式看起来和 jquery 是一致的啊，但是实际上，vue 比 jquery 要要复杂得多，jquery 官方也明确的说，v-on 不简单是 addEventListener 的语法糖。在 jquery 中，我们传入到 bind 方法中的回调，只能是一个函数表类型的变量或者一个匿名函数，传递的时候，还不能执行它（在后面加上一堆圆括号），否则就变成了取这一个函数的返回值作为事件回调。而我们知道，vue 的 v-on 指令接受的值可以是函数执行的形式，比如 v-on:click="click(233)" 。这里我们可以传递任何需要传递的参数，甚至可以不传递参数：

``` vue
<div id="app">
    <button v-on:click="click()">click me</button>
</div>
...
var app = new Vue({
    el: '#app',
    methods: {
        click(event) {
            console.log(typeof event);    // undefined
        }
    }
});
```
咦？我的 event 对象呢？怎么不见了？打印看看 arguments. length 也是 0，说明这时候确实没有实参被传入进来。T_T，那我们如果既需要传递参数，又需要用到 event 对象，这个该怎么办呢？

#### （三）$event

翻看 vue 文档，不难发现，其实我们可以通过将一个特殊变量 $event 传入到回调中解决这个问题：

``` vue
<div id="app">
    <button v-on:click="click($event, 233)">click me</button>
</div>
...
var app = new Vue({
    el: '#app',
    methods: {
        click(event, val) {
            console.log(typeof event);    // object
        }
    }
});
```

好吧，这样看起来就正常了。 简单总结来说：

使用不带圆括号的形式，event 对象将被自动当做实参传入；

使用带圆括号的形式，我们需要使用 $event 变量显式传入 event 对象。

二、乌龙 前面都算是铺垫吧，现在真正的乌龙来了。 翻看小伙伴儿的代码，偶然看到了类似下面的代码：

``` vue
<div id="app">
    <button v-on:click="click(233)">click me</button>
</div>
...
var app = new Vue({
    el: '#app',
    methods: {
        click(val) {
            console.log(typeof event);    // object
        }
    }
});
```

看到这一段代码，我的内心是崩溃的，丢进 chrome 里面一跑，尼玛还真可以，打印 arguments. length，也是正常的 1。尼玛！这是什么鬼？毁三观啊？ 既没有传入实参，也没有接收的形参，这个 event 对象的来源，要么是上级作用链，要么。。。是全局作用域。。。全局的，不禁想到了 window.event 。再次上 MDN 确认了一下，果然，window.event，ie 和 chrome 都在 window 对象上有这样一个属性：

代码丢进 Firefox 中运行，event 果然就变成了 undefined 了。额，这个我也不知道说什么了。。。

## $nextTick 的使用

### 1、什么是 Vue. nextTick()？

定义：在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM。

所以就衍生出了这个获取更新后的 DOM 的 Vue 方法。所以放在 Vue. nextTick()回调函数中的执行的应该是会对 DOM 进行操作的 js 代码；

理解：nextTick()，是将回调函数延迟在下一次 dom 更新数据后调用，简单的理解是：当数据更新了，在 dom 中渲染后，自动执行该函数，

``` vue
<template>
  <div class="hello">
    <div>
      <button id="firstBtn" @click="testClick()" ref="aa">{{testMsg}}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      testMsg:"原始值",
    }
  },
  methods:{
    testClick:function(){
      let that=this;
      that.testMsg="修改后的值";
      console.log(that.$refs.aa.innerText);   //that.$refs.aa获取指定DOM，输出：原始值
    }
  }
}
</script>
```
使用 this. $nextTick()

``` vue
methods: {
    testClick: function() {
        let that = this;
        that.testMsg = "修改后的值";
        that.$nextTick(function() {
            console.log(that.$refs.aa.innerText); //输出：修改后的值
        });
    }
}
```
注意：Vue 实现响应式并不是数据发生变化之后 DOM 立即变化，而是按一定的策略进行 DOM 的更新。$nextTick 是在下次 DOM 更新循环结束之后执行延迟回调，在修改数据之后使用 $nextTick，则可以在回调中获取更新后的 DOM，

### 2、什么时候需要用的 Vue. nextTick()？？

1. Vue 生命周期的 created()钩子函数进行的 DOM 操作一定要放在 Vue. nextTick()的回调函数中，原因是在 created()钩子函数执行的时候 DOM 其实并未进行任何渲染，而此时进行 DOM 操作无异于徒劳，所以此处一定要将 DOM 操作的 js 代码放进 Vue. nextTick()的回调函数中。与之对应的就是 mounted 钩子函数，因为该钩子函数执行时所有的 DOM 挂载已完成。

``` vue
created() {
    let that = this;
    that.$nextTick(function() { //不使用this.$nextTick()方法会报错
        that.$refs.aa.innerHTML = "created中更改了按钮内容"; //写入到DOM元素
    });
}
```

2. 当项目中你想在改变 DOM 元素的数据后基于新的 dom 做点什么，对新 DOM 一系列的 js 操作都需要放进 Vue. nextTick()的回调函数中；通俗的理解是：更改数据后当你想立即使用 js 操作新的视图的时候需要使用它

``` vue
<template>
  <div class="hello">
    <h3 id="h">{{testMsg}}</h3>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      testMsg:"原始值",
    }
  },
  methods:{
    changeTxt:function(){
      let that=this;
      that.testMsg="修改后的文本值";  //vue数据改变，改变dom结构
      let domTxt=document.getElementById('h').innerText;  //后续js对dom的操作
      console.log(domTxt);  //输出可以看到vue数据修改后DOM并没有立即更新，后续的dom都不是最新的
      if(domTxt==="原始值"){
        console.log("文本data被修改后dom内容没立即更新");
      }else {
        console.log("文本data被修改后dom内容被马上更新了");
      }
    },
  }
}
</script>
```
正确的用法是：vue 改变 dom 元素结构后使用 vue. $nextTick()方法来实现 dom 数据更新后延迟执行后续代码

``` vue
    changeTxt: function() {
        let that = this;
        that.testMsg = "修改后的文本值"; //修改dom结构

        that.$nextTick(function() { //使用vue.$nextTick()方法可以dom数据更新后延迟执行
            let domTxt = document.getElementById('h').innerText;
            console.log(domTxt); //输出可以看到vue数据修改后并没有DOM没有立即更新，
            if (domTxt === "原始值") {
                console.log("文本data被修改后dom内容没立即更新");
            } else {
                console.log("文本data被修改后dom内容被马上更新了");
            }
        });
    }
```

3. 在使用某个第三方插件时 ，希望在 vue 生成的某些 dom 动态发生变化时重新应用该插件，也会用到该方法，这时候就需要在 $nextTick 的回调函数中执行重新应用插件的方法。

Vue. nextTick(callback) 使用原理：

原因是，Vue 是异步执行 dom 更新的，一旦观察到数据变化，Vue 就会开启一个队列，然后把在同一个事件循环 (event loop) 当中观察到数据变化的 watcher 推送进这个队列。如果这个 watcher 被触发多次，只会被推送到队列一次。这种缓冲行为可以有效的去掉重复数据造成的不必要的计算和 DOm 操作。而在下一个事件循环时，Vue 会清空队列，并进行必要的 DOM 更新。 当你设置 vm. someData = 'new value'，DOM 并不会马上更新，而是在异步队列被清除，也就是下一个事件循环开始时执行更新时才会进行必要的 DOM 更新。如果此时你想要根据更新的 DOM 状态去做某些事情，就会出现问题。。为了在数据变化之后等待 Vue 完成更新 DOM ，可以在数据变化之后立即使用 Vue. nextTick(callback) 。这样回调函数在 DOM 更新完成后就会调用。

## Vue 组件中 data 为什么必须是函数
在 new Vue() 中，data 是可以作为一个对象进行操作的，然而在 component 中，data 只能以函数的形式存在，不能直接将对象赋值给它，这并非是 Vue 自身如此设计，而是跟 JavaScript 特性相关，我们来回顾下 JavaScript 的原型链

``` js
var Component = function() {};
Component.prototype.data = {
    message: "Love"
};
var component1 = new Component(),
    component2 = new Component();
component1.data.message = "Peace";
console.log(component2.data.message); // Peace
```
以上**两个实例都引用同一个原型对象，当其中一个实例属性改变时，另一个实例属性也随之改变，只有当两个实例拥有自己的作用域时，才不会互相干扰 ！！！！！**这句是重点！！！！！

``` js
var Component = function() {
    this.data = this.data();
};
Component.prototype.data = function() {
    return {
        message: "Love"
    };
};
var component1 = new Component(),
    component2 = new Component();
component1.data.message = "Peace";
console.log(component2.data.message); // Love
```

## v-for 与 v-if 的优先级

v-for 比 v-if 优先

1. v-for优先于v-if被解析；
2. 如果同时出现，每次渲染都会先执行循环再判断条件，无论如何循环都不可避免，浪费了性能；
3. 要避免出现这种情况，则在外层嵌套template，在这一层进行v-if判断，然后在内部进行v-for循环；
4. 如果条件出现在循环内部，可通过计算属性提前过滤掉那些不需要显示的项；

## vue 中子组件调用父组件的方法

可以使用下列三种方式来实现：

- 第一种方法是直接在子组件中通过 this.$parent.eventHandler 来调用父组件的方法
- 第二种方法是在子组件里用$emit 向父组件触发一个事件，父组件监听这个事件就行了
- 第三种是父组件把方法传入子组件中，在子组件里直接调用这个方法

解析：

### 第一种方法是直接在子组件中通过 this.$parent.eventHandler 来调用父组件的方法

父组件

``` vue
<template>
  <div>
    <child></child>
  </div>
</template>
<script>
  import child from '~/components/dam/child';
  export default {
    components: {
      child
    },
    methods: {
      fatherMethod() {
        console.log('测试');
      }
    }
  };
</script>
```

子组件
``` vue
<template>
    <div>
        <button @click="childMethod()">点击</button>
    </div>
</template>
<script>
    export default {
        methods: {
            childMethod() {
                this.$parent.fatherMethod();
            }
        }
    };
</script>
```

### 第二种方法是在子组件里用$emit 向父组件触发一个事件，父组件监听这个事件就行了

父组件
``` vue
<template>
    <div>
        <child @fatherMethod="fatherMethod"></child>
    </div>
</template>
<script>
    import child from "~/components/dam/child";
    export default {
        components: {
            child
        },
        methods: {
            fatherMethod() {
                console.log("测试");
            }
        }
    };
</script>
```

子组件
``` vue
<template>
    <div>
        <button @click="childMethod()">点击</button>
    </div>
</template>
<script>
    export default {
        methods: {
            childMethod() {
                this.$emit("fatherMethod");
            }
        }
    };
</script>
```

### 第三种是父组件把方法传入子组件中，在子组件里直接调用这个方法

父组件

``` vue
<template>
    <div>
        <child :fatherMethod="fatherMethod"></child>
    </div>
</template>
<script>
    import child from "~/components/dam/child";
    export default {
        components: {
            child
        },
        methods: {
            fatherMethod() {
                console.log("测试");
            }
        }
    };
</script>
```

子组件
``` vue
<template>
    <div>
        <button @click="childMethod()">点击</button>
    </div>
</template>
<script>
    export default {
        props: {
            fatherMethod: {
                type: Function,
                default: null
            }
        },
        methods: {
            childMethod() {
                if (this.fatherMethod) {
                    this.fatherMethod();
                }
            }
        }
    };
</script>
```

## vue 中父组件调用子组件的方法

使用$refs

父组件

``` vue
<template>
    <div>
        <button @click="clickParent">点击</button>
        <child ref="mychild"></child>
    </div>
</template>

<script>
    import Child from "./child";
    export default {
        name: "parent",
        components: {
            child: Child
        },
        methods: {
            clickParent() {
                this.$refs.mychild.parentHandleclick("嘿嘿嘿"); // 划重点！！！！
            }
        }
    };
</script>
```

子组件

``` vue
<template>
    <div>
        child
    </div>
</template>

<script>
    export default {
        name: "child",
        props: "someprops",
        methods: {
            parentHandleclick(e) {
                console.log(e);
            }
        }
    };
</script>
```

## vue 中 keep-alive 组件的作用

keep-alive 是 Vue 内置的一个组件，可以使被包含的组件保留状态，或避免重新渲染。

用法也很简单：

``` vue
<keep-alive>
    <component>
        <!-- 该组件将被缓存！ -->
    </component>
</keep-alive>
```
props _ include - 字符串或正则表达，只有匹配的组件会被缓存 _ exclude - 字符串或正则表达式，任何匹配的组件都不会被缓存

``` vue
// 组件 a
export default {
    name: "a",
    data() {
        return {};
    }
};
```
``` vue
<keep-alive include="a">
    <component>
        <!-- name 为 a 的组件将被缓存！ -->
    </component>
</keep-alive><!-- 可以保留它的状态或避免重新渲染 -->
```
``` vue
<keep-alive exclude="a">
    <component>
        <!-- 除了 name 为 a 的组件都将被缓存！ -->
    </component>
</keep-alive><!-- 可以保留它的状态或避免重新渲染 -->
```

但实际项目中, 需要配合 vue-router 共同使用.

router-view 也是一个组件，如果直接被包在 keep-alive 里面，所有路径匹配到的视图组件都会被缓存：

``` vue
<keep-alive>
    <router-view>
        <!-- 所有路径匹配到的视图组件都会被缓存！ -->
    </router-view>
</keep-alive>
```

如果只想 router-view 里面某个组件被缓存，怎么办？

增加 router. meta 属性

``` vue
// routes 配置
export default [{
        path: "/",
        name: "home",
        component: Home,
        meta: {
            keepAlive: true // 需要被缓存
        }
    },
    {
        path: "/:id",
        name: "edit",
        component: Edit,
        meta: {
            keepAlive: false // 不需要被缓存
        }
    }
];
```
``` vue
<keep-alive>
    <router-view v-if="$route.meta.keepAlive">
        <!-- 这里是会被缓存的视图组件，比如 Home！ -->
    </router-view>
</keep-alive>

<router-view v-if="!$route.meta.keepAlive">
    <!-- 这里是不被缓存的视图组件，比如 Edit！ -->
</router-view>
```

## vue 中如何编写可复用的组件？

总结组件的职能，什么需要外部控制（即 props 传啥），组件需要控制外部吗（$emit）, 是否需要插槽（slot）

## 什么是 vue 生命周期和生命周期钩子函数？

vue 的生命周期就是 vue 实例从创建到销毁的过程

## vue 如何监听键盘事件中的按键？

### 背景

在一些搜索框中，我们往往需要监听键盘的按下(onkeydown)或抬起(onkeyup)事件以进行一些操作。在原生js或者jQuery中，我们需要判断e.keyCode的值来获取用户所按的键。这样就存在一个问题：我们必须知道某个按键的keyCode值才能完成匹配，使用起来十分不便。

| keyCode | 实际键值 |
| ---- | ---- |
| 48到57 | 0到9 |
| 65到90 | a到z（A到Z） |
| 112到135 | F1到F24 |
| 8 | BackSpace（退格） |
| 9 | Tab |
| 13 | Enter（回车） |
| 20 | Caps_Lock（大写锁定） |
| 32 | Space（空格键） |
| 37 | Left（左箭头） |
| 38 | Up（上箭头） |
| 39 | Right（右箭头） |
| 40 | Down（下箭头） |

### 方案

在Vue中，已经为常用的按键设置了别名，这样我们就无需再去匹配keyCode，直接使用别名就能监听按键的事件。

``` vue
<input @keyup.enter="function">
```

| 别名 | 实际键值 |
| ---- | ---- |
| .delete | delete（删除）/BackSpace（退格） |
| .tab | Tab |
| .enter | Enter（回车） |
| .esc | Esc（退出） |
| .space | Space（空格键） |
| .left | Left（左箭头） |
| .up | Up（上箭头） |
| .right | Right（右箭头） |
| .down | Down（下箭头） |
| .ctrl | Ctrl |
| .alt | Alt |
| .shift | Shift |
| .meta | (window系统下是window键，mac下是command键) |

另外，Vue中还支持组合写法：

| 组合写法 | 按键组合 |
| ---- | ---- |
| @keyup.alt.67=”function” | Alt + C |
| @click.ctrl=”function” | Ctrl + Click |

注意
但是，如果是在自己封装的组件或者是使用一些第三方的UI库时，会发现并不起效果，这时就需要用到`.native`修饰符了，如：

``` vue
<el-input
  v-model="inputName"
  placeholder="搜索你的文件"
  @keyup.enter.native="searchFile(params)"
  >
</el-input>
```
如果遇到`.native`修饰符也无效的情况，可能就需要用到`$listeners`了

## vue 更新数组时触发视图更新的方法

### Vue.set 可以设置对象或数组的值，通过 key 或数组索引，可以触发视图更新

``` vue
// 数组修改

Vue.set(array, indexOfItem, newValue)
this.array.$set(indexOfItem, newValue)

// 对象修改

Vue.set(obj, keyOfItem, newValue)
this.obj.$set(keyOfItem, newValue)
```

### Vue.delete 删除对象或数组中元素，通过 key 或数组索引，可以触发视图更新

``` vue
// 数组修改

Vue.delete(array, indexOfItem)
this.array.$delete(indexOfItem)

// 对象修改

Vue.delete(obj, keyOfItem)
this.obj.$delete(keyOfItem)
```

### 数组对象直接修改属性，可以触发视图更新

``` vue
this.array[0].show = true;
this.array.forEach(function(item){
    item.show = true;
});
```

### splice 方法修改数组，可以触发视图更新

``` vue
this.array.splice(indexOfItem, 1, newElement)
```

### 数组整体修改，可以触发视图更新
``` vue
var tempArray = this.array;
tempArray[0].show = true;
this.array = tempArray;
```

### 用 Object. assign 或 lodash. assign 可以为对象添加响应式属性，可以触发视图更新
``` vue
//Object.assign的单层的覆盖前面的属性，不会递归的合并属性
this.obj = Object.assign({},this.obj,{a:1, b:2})

//assign与Object.assign一样
this.obj = _.assign({},this.obj,{a:1, b:2})

//merge会递归的合并属性
this.obj = _.merge({},this.obj,{a:1, b:2})
```

### Vue 提供了如下的数组的变异方法，可以触发视图更新
``` txt
push()
pop()
shift()
unshift()
splice()
sort()
reverse()
```

## vue 中对象更改检测的注意事项

## 解决非工程化项目初始化页面闪动问题

## v-for 产生的列表，实现 active 的切换

## v-model 语法糖的组件中的使用

## 十个常用的自定义过滤器

## vue 等单页面应用及其优缺点

优点：
1. 用户体验好、快，内容的改变不需要重新加载整个页面，避免了不必要的跳转和重复渲染。
2. 前后端职责业分离（前端负责view，后端负责model），架构清晰
3. 减轻服务器的压力

缺点：

1. SEO（搜索引擎优化）难度高
2. 初次加载页面更耗时
3. 前进、后退、地址栏等，需要程序进行管理，所以会大大提高页面的复杂性和逻辑的难度

## 什么是 vue 的计算属性？

定义： 当其依赖的属性的值发生变化的时，计算属性会重新计算。反之则使用缓存中的属性值。 计算属性和vue中的其它数据一样，都是响应式的，只不过它必须依赖某一个数据实现，并且只有它依赖的数据的值改变了，它才会更新。

## vue 父组件如何向子组件中传递数据？

props传参

## vue 弹窗后如何禁止滚动条滚动？

## vue怎么实现页面的权限控制

利用 vue-router 的 beforeEach 事件，可以在跳转页面前判断用户的权限（利用 cookie 或 token），是否能够进入此页面，如果不能则提示错误或重定向到其他页面，在后台管理系统中这种场景经常能遇到。

## `$route`和`$router`的区别

**$route** 是路由信息对象，包括path，params，hash，query，fullPath，matched，name 等路由信息参数。

**$router** 是路由实例对象，包括了路由的跳转方法，钩子函数等

## watch的作用是什么

watch 主要作用是监听某个数据值的变化。和计算属性相比除了没有缓存，作用是一样的。

借助 watch 还可以做一些特别的事情，例如监听页面路由，当页面跳转时，我们可以做相应的权限控制，拒绝没有权限的用户访问页面。

## 计算属性的缓存和方法调用的区别

计算属性是基于数据的依赖缓存，数据发生变化，缓存才会发生变化，如果数据没有发生变化，调用计算属性直接调用的是存储的缓存值；

而方法每次调用都会重新计算；所以可以根据实际需要选择使用，如果需要计算大量数据，性能开销比较大，可以选用计算属性，如果不能使用缓存可以使用方法；

其实这两个区别还应加一个watch，watch是用来监测数据的变化，和计算属性相比，是watch没有缓存，但是一般想要在数据变化时响应时，或者执行异步操作时，可以选择watch

## vue的双向绑定的原理，和angular的对比

## vue 如何优化首屏加载速度？

## vue 打包命令是什么？

``` shell
npm run build
```

## vue 打包后会生成哪些文件？

## 如何配置 vue 打包生成文件的路径？

## vue 的服务器端渲染

## vue 开发命令 npm run dev 输入后的执行过程

## 什么是 Virtual DOM？

可以看作是一个使用 javascript 模拟了 DOM 结构的树形结构

### 一、前言

虚拟DOM概念随着react的诞生而诞生，由facebook提出，其卓越的性能很快得到广大开发者的认可；继react之后vue2.0也在其核心引入了虚拟DOM的概念，本文将以vue2.0使用的snabbdom入手，来介绍虚拟DOM的主要实现原理。

### 二、虚拟DOM

在开始介绍snabbdom之前我们想来想两个问题，

（1）什么是虚拟DOM？

vdom可以看作是一个使用javascript模拟了DOM结构的树形结构，这个树结构包含整个DOM结构的信息，如下例：

``` html
<ul id="list">
  <li class="item">item1</li>
  <li class="item">item2</li>
</ul>
```

``` js
{
  tag: "ul",
  attrs: {
    id: "list"
  },
  children: [
    {
      tag: "li",
      attrs: {
        class: "item"
      },
      children: ["item1"]
    },
    {
      tag: "li",
      attrs: {
        class: "item"
      },
      children: ["item2"]
    }
  ]
}
```

可见上边的DOM结构，不论是标签名称还是标签的属性或标签的子集，都会对应在下边的树结构里。

（２）为什么要使用虚拟DOM？

之前使用原生js或者jquery写页面的时候会发现操作DOM是一件非常麻烦的一件事情，往往是DOM标签和js逻辑同时写在js文件里，数据交互时不时还要写很多的input隐藏域，如果没有好的代码规范的话会显得代码非常冗余混乱，耦合性高并且难以维护。

另外一方面在浏览器里一遍又一遍的渲染DOM是非常非常消耗性能的，常常会出现页面卡死的情况；所以尽量减少对DOM的操作成为了优化前端性能的必要手段，vdom就是将DOM的对比放在了js层，通过对比不同之处来选择新渲染DOM节点，从而提高渲染效率。

（3）vdom如何使用？

下面我将使用snabbdom的用法介绍一下vdom的使用。

### 三、snabbdom

要了解snabbdom的话有必要先去github上先了解下snabbdom： https://github.com/snabbdom/snabbdom

在这里看到官方给的一个example

``` js
var container = document.getElementById("container");

var vnode = h('div#container1.two.classes', {on: {click: someFn}}, [
  h('span', {style: {fontWeight: 'bold'}}, 'This is bold'),
  ' and this is just normal text',
  h('a', {props: {href: '/foo'}}, 'I\'ll take you places!')
]);
// Patch into empty DOM element - this modifies the DOM as a side effect
patch(container, vnode);

var newVnode = h('div#container2.two.classes', {on: {click: anotherEventHandler}}, [
  h('span', {style: {fontWeight: 'normal', fontStyle: 'italic'}}, 'This is new italic type'),
  ' and this is still just normal text',
  h('a', {props: {href: '/bar'}}, 'I\'ll take you places too!')
]);

// Second `patch` invocation
pathc(vnode, newVnode); // Snabbdom efficiently updates the old view to the new state
```

这里可以看到列出来的两个主要的核心函数，即h()函数和patch()函数，我们先来看下h()函数：

#### h函数
``` js
var vnode = h('ul#list', {} [
  h('li.item', {}, ["item1"]),
  h('li.item', {}, ["item12"]),
]);
```

``` js
{
  tag: "ul",
  attrs: {
    id: "list"
  },
  children: [
    {
      tag: "li",
      attrs: {
        class: "item"
      },
      children: ["item1"]
    },
    {
      tag: "li",
      attrs: {
        class: "item"
      },
      children: ["item2"]
    }
  ]
}
```

可以看到创建的虚拟DOM树里面的结构在左边的vnode里都有体现，所以现在看来我们的虚拟DOM结构树和snabbdom中的h()函数是完全可以对应起来的，可以通过一个方法将虚拟DOM结构转化成vnode；而上图中newVnode则指的是虚拟DOM树中的数据发生变化之后生成的vnode。

我们在回过头来看patch()函数

### patch函数

patch函数的执行分为两个阶段，两次传递的参数都是两个

第一阶段为虚拟dom的第一次渲染，传递的两个参数分别是放真实DOM的container和生成的vnode，此时patch函数的作用是用来将初次生成的真实DOM结构挂载到指定的container上面。

第二阶段传递的两个参数分别为vnode和newVnode，此时patch函数的作用是使用diff算法对比两个参数的差异，进而更新参数变化的DOM节点；

可以发发现h函数和patch函数在cnabbdom中实现vdom到真实DOM的转化起到了至关重要的作用，那么还有一个很重要的环节，patch函数中是怎么样实现对比两个vnode从而实现对真实DOM的更新的呢，这里还要提一下snabbdom的另外一个核心算法，即diff算法。

#### diff算法

其实在我们日常开发中我们都在接触类似与diff算法的一些软件，比如svn可以看到当前代码和svn服务器上代码的不同之处，再如Beyond Compare这款软件也可以为我们指出两个对比文件的不同之处

但是此处是如何实现对vnode的对比的呢？参考以下代码：

``` js
function updateChildren(vnode, newVnode) {      // 创建对比函数
    var children = vnode.children || []
    var newChildren = newVnode.children || []

    children.forEach(function(childrenVnode, index) {
        var newChildVnode = newChildren[index]  // 首先拿到对应新的节点
        if (childrenVnode.tag === newChildVnode.tag) {    // 判断节点是否相同
            updateChilren(childrenVnode, newChildVnode)   // 如果相同执行递归，深度对比节点
        } else {
            repleaseNode(childrenVnode, newChildVnode)    // 如果不同则将旧的节点替换成新的节点
        }
    })
}


function repleaseNode(vnode, newVnode) {    // 节点替换函数
    var elem = vnode.elem
    var newEle = createElement(newVnode)
}
```
此处简单的列举了一下diff算法的原理，以上是最简单的对比，更复杂的对比函数包括对节点的增删以及其它的节点逻辑就不一一赘述了，这里最重要的一部分就是递归的使用，才能将vnode进行深度对比。

## 响应式系统的基本原理

vue响应式的原理，首先对象传入vue实例作为data对象时，首先被vue遍历所有属性，调用Object.defineProperty设置为getter和setter，每个组件都有一个watcher对象，在组件渲染的过程中，把相关的数据都注册成依赖，当数据发生setter变化时，会通知watcehr，从而更新相关联的组件

## Vue.js 全局运行机制

## 如何编译 template 模板？

1. 首先第一步实例化一个vue项目
2. 模板编译是在vue生命周期的mount阶段进行的
3. 在mount阶段的时候执行了compile方法将template里面的内容转化成真正的html代码
4. parse阶段是将html转化成ast(抽象语法树)，用来表示代码的数据结构。在 Vue 中我把它理解为嵌套的、携带标签名、属性和父子关系的 JS 对象，以树来表现 DOM 结构。

``` js
html: "<div id="test">texttext</div>"
// html转换成ast
ast: {
  // 标签类型
  type: 1,
  // 标签名
  tag: "div",
  // 标签行内属性列表
  attrsList: [{name: "id", value: "test"}],
  // 标签行内属性
  attrsMap: {id: "test"},
  // 标签关系 父亲
  parent: undefined,
  // 字标签属性列表
  children: [{
      type: 3,
      text: 'texttext'
    }
  ],
  plain: true,
  attrs: [{name: "id", value: "'test'"}]
}
```
5. optimize 会对parse生成的ast树进行静态资源优化(静态内容指的是和数据没有关系，不需要每次都刷新的内容)
6. generate 函数，会将每一个ast节点创建一个内部调用的方法等待后面的调用。
``` vue
<template>
  <div id="test">
    {{val}}
    <img src="http://xx.jpg">
  </div>
</template>
// 最后输出
// {render: "with(this){return _c('div',{attrs:{"id":"test"}},[[_v(_s(val))]),_v(" "),_m(0)])}"}
```
7. 在complie过程结束之后会生成一个render字符串 ，接下来就是 new watcher这个时候会对绑定的数据执行监听，render 函数就是数据监听的回调所调用的，其结果便是重新生成 vnode。当这个 render 函数字符串在第一次 mount、或者绑定的数据更新的时候，都会被调用，生成 Vnode。如果是数据的更新，那么 Vnode 会与数据改变之前的 Vnode 做 diff，对内容做改动之后，就会更新到我们真正的 DOM 上啦

## diff 算法

## 批量异步更新策略及 nextTick 原理？

## Vue 中如何实现 proxy 代理？

webpack 自带的 devServer 中集成了 http-proxy-middleware。配置 devServer 的 proxy 选项即可
``` js
proxyTable: {
    '/api': {
        target: 'http://192.168.149.90:8080/', // 设置你调用的接口域名和端口号
        changeOrigin: true, // 跨域
        pathRewrite: {
            '^/api': '/'
        }
    }
}
```

## vue 中如何实现 tab 切换功能？

## vue 中如何利用 keep-alive 标签实现某个组件缓存功能？

## vue 中实现切换页面时为左滑出效果

## vue 中央事件总线的使用

## vue 的渲染机制

## vue 在什么情况下在数据发生改变的时候不会触发视图更新

v-for 遍历的数组，当数组内容使用的是 arr[0]. xx =xx 更改数据，vue 无法监测到 vm. arr. length = newLength 也是无法检测的到的

## vue 的优点是什么？

低耦合。视图（View）可以独立于 Model 变化和修改，一个 ViewModel 可以绑定到不同的"View"上，当 View 变化的时候 Model 可以不变，当 Model 变化的时候 View 也可以不变。

可重用性。你可以把一些视图逻辑放在一个 ViewModel 里面，让很多 view 重用这段视图逻辑。

独立开发。开发人员可以专注于业务逻辑和数据的开发（ViewModel），设计人员可以专注于页面设计。

可测试。界面素来是比较难于测试的，而现在测试可以针对 ViewModel 来写。

## vue 如何实现按需加载配合 webpack 设置

webpack 中提供了 require.ensure()来实现按需加载。以前引入路由是通过 import 这样的方式引入，改为 const 定义的方式进行引入。
不进行页面按需加载引入方式：import home from '../../common/home.vue'
进行页面按需加载的引入方式：const home = r => require.ensure( [], () => r (require('../../common/home.vue')))

在音乐 app 中使用的路由懒加载方式为：

``` js
const Recommend = (resolve) => {
  import('components/recommend/recommend').then((module) => {
    resolve(module)
  })
}

const Singer = (resolve) => {
  import('components/singer/singer').then((module) => {
    resolve(module)
  })
}
```

## 如何让 CSS 只在当前组件中起作用

将当前组件的 `<style>` 修改为 `<style scoped>`

## 指令 v-el 的作用是什么?

提供一个在页面上已存在的 DOM 元素作为 Vue 实例的挂载目标. 可以是 CSS 选择器，也可以是一个 HTMLElement 实例

## vue-loader 是什么？使用它的用途有哪些？

vue-loader 是解析 .vue 文件的一个加载器，将 template/js/style 转换成 js 模块。

用途：js 可以写 es6、style 样式可以 scss 或 less；template 可以加 jade 等。

## vue和angular的优缺点以及适用场合?

## 你们vue项目是打包了一个js文件，一个css文件，还是有多个文件？

## vue遇到的坑，如何解决的？

## vuex 工作原理详解

vuex 整体思想诞生于 flux, 可其的实现方式完完全全的使用了 vue 自身的响应式设计，依赖监听、依赖收集都属于 vue 对对象 Property set get 方法的代理劫持。最后一句话结束 vuex 工作原理，vuex 中的 store 本质就是没有 template 的隐藏着的 vue 组件；

解析：vuex的原理其实非常简单，它为什么能实现所有的组件共享同一份数据？ 因为vuex生成了一个store实例，并且把这个实例挂在了所有的组件上，所有的组件引用的都是同一个store实例。 store实例上有数据，有方法，方法改变的都是store实例上的数据。由于其他组件引用的是同样的实例，所以一个组件改变了store上的数据， 导致另一个组件上的数据也会改变，就像是一个对象的引用。

## vuex 是什么？怎么使用？哪种功能场景使用它？

vue 框架中状态管理。在 main. js 引入 store，注入。新建一个目录 store，…. . export 。场景有：单页应用中，组件之间的状态。音乐播放、登录状态、加入购物车

main. js:

``` js
import store from './store'

new Vue({
el:'#app',
store
})
```

## vuex 有哪几种属性？

有五种，分别是 State、 Getter、Mutation 、Action、 Module

vuex的State特性

1. Vuex就是一个仓库，仓库里面放了很多对象。其中state就是数据源存放地，对应于一般Vue对象里面的data
2. state里面存放的数据是响应式的，Vue组件从store中读取数据，若是store中的数据发生改变，依赖这个数据的组件也会发生更新
3. 它通过mapState把全局的 state 和 getters 映射到当前组件的 computed 计算属性中

vuex的Getter特性
1. getters 可以对State进行计算操作，它就是Store的计算属性
2. 虽然在组件内也可以做计算属性，但是getters 可以在多组件之间复用
3. 如果一个状态只在一个组件内使用，是可以不用getters

vuex的Mutation特性
1. Action 类似于 mutation，不同在于：Action 提交的是 mutation，而不是直接变更状态；Action 可以包含任意异步操作。

## 不用 Vuex 会带来什么问题？

可维护性会下降，想修改数据要维护三个地方；

可读性会下降，因为一个组件里的数据，根本就看不出来是从哪来的；

增加耦合，大量的上传派发，会让耦合性大大增加，本来 Vue 用 Component 就是为了减少耦合，现在这么用，和组件化的初衷相背。

## vue-router 如何响应 路由参数 的变化？

## 完整的 vue-router 导航解析流程

## vue-router 有哪几种导航钩子（ 导航守卫 ）？

答案：三种

- 第一种: 全局导航钩子, router.beforeEach(to, from, next)，作用：跳转前进行判断拦截；
``` js
router.beforeEach((to, from, next) => {
  // TODO
});
```

- 第二种：单独路由独享组件；
``` js
{
  path: '/home',
  name: 'home',
  component: Home,
  beforeEnter(to, from, next) {
    // TODO
  }
}
```

- 第三种：组件内的钩子。
``` js
beforeRouteEnter(to, from, next) {
  // do someting
  // 在渲染该组件的对应路由被 confirm 前调用
},
beforeRouteUpdate(to, from, next) {
  // do someting
  // 在当前路由改变，但是依然渲染该组件是调用
},
beforeRouteLeave(to, from ,next) {
  // do someting
  // 导航离开该组件的对应路由时被调用
}
```

## vue-router 的几种实例方法以及参数传递

## 怎么定义 vue-router 的动态路由？怎么获取传过来的动态参数？

在 router 目录下的 index.js 文件中，对 path 属性加上/:id。 使用 router 对象的 params.id

## vue-router 如何定义嵌套路由？

## `<router-link></router-link>` 组件及其属性

## vue-router 实现路由懒加载（ 动态加载路由 ）

vue项目实现按需加载的3种方式：vue异步组件、es提案的import()、webpack的require.ensure()

### vue异步组件技术

- vue-router配置路由，使用vue的异步组件技术，可以实现按需加载。

但是，这种情况下一个组件生成一个js文件。

举例如下：

``` vue
{
  path: '/promisedemo',
  name: 'PromiseDemo',
  component: resolve => require(['../components/PromiseDemo'], resolve)
}
```

### es提案的import()

- 推荐使用这种方式(需要webpack > 2.4)
- webpack官方文档：webpack中使用import()

vue官方文档：[路由懒加载(使用import())](https://router.vuejs.org/zh/guide/advanced/lazy-loading.html#%E6%8A%8A%E7%BB%84%E4%BB%B6%E6%8C%89%E7%BB%84%E5%88%86%E5%9D%97)

- vue-router配置路由，代码如下：

``` vue
// 下面2行代码，没有指定webpackChunkName，每个组件打包成一个js文件。
const ImportFuncDemo1 = () => import('../components/ImportFuncDemo1')
const ImportFuncDemo2 = () => import('../components/ImportFuncDemo2')
// 下面2行代码，指定了相同的webpackChunkName，会合并打包成一个js文件。
// const ImportFuncDemo = () => import(/* webpackChunkName: 'ImportFuncDemo' */ '../components/ImportFuncDemo')
// const ImportFuncDemo2 = () => import(/* webpackChunkName: 'ImportFuncDemo' */ '../components/ImportFuncDemo2')
export default new Router({
  routes: [
    {
      path: '/importfuncdemo1',
      name: 'ImportFuncDemo1',
      component: ImportFuncDemo1
    },
    {
      path: '/importfuncdemo2',
      name: 'ImportFuncDemo2',
      component: ImportFuncDemo2
    }
  ]
})
```

### webpack提供的require.ensure()

- vue-router配置路由，使用webpack的require.ensure技术，也可以实现按需加载。

这种情况下，多个路由指定相同的chunkName，会合并打包成一个js文件。

举例如下：

``` vue
{
  path: '/promisedemo',
  name: 'PromiseDemo',
  component: resolve => require.ensure([], () => resolve(require('../components/PromiseDemo')), 'demo')
},
{
  path: '/hello',
  name: 'Hello',
  // component: Hello
  component: resolve => require.ensure([], () => resolve(require('../components/Hello')), 'demo')
}
```

## vue-router 路由的两种模式

hash history

## history 路由模式与后台的配合

## vue路由实现原理? 或 vue-router原理?

说简单点，vue-router的原理就是通过对URL地址变化的监听，继而对不同的组件进行渲染。 每当URL地址改变时，就对相应的组件进行渲染。原理是很简单，实现方式可能有点复杂，主要有hash模式和history模式。

## 什么是 MVVM？

1. 拆分说明（M，V，VM 都是干啥的）
2. 之间联系（Model 和 ViewModel 的双向数据绑定）

解析：

MVVM 是 Model-View-ViewModel 的缩写。MVVM 是一种设计思想。Model 层代表数据模型，也可以在 Model 中定义数据修改和操作的业务逻辑；View 代表 UI 组件，它负责将数据模型转化成 UI 展现出来，ViewModel 是一个同步 View 和 Model 的对象（桥梁）。

在 MVVM 架构下，View 和 Model 之间并没有直接的联系，而是通过 ViewModel 进行交互，Model 和 ViewModel 之间的交互是双向的， 因此 View 数据的变化会同步到 Model 中，而 Model 数据的变化也会立即反应到 View 上。

ViewModel 通过双向数据绑定把 View 层和 Model 层连接了起来，而 View 和 Model 之间的同步工作完全是自动的，无需人为干涉，因此开发者只需关注业务逻辑，不需要手动操作 DOM, 不需要关注数据状态的同步问题，复杂的数据状态维护完全由 MVVM 来统一管理。

## MVC、MVP 与 MVVM 模式

### 一、MVC

通信方式如下

视图（View）：用户界面。 传送指令到 Controller

控制器（Controller）：业务逻辑 完成业务逻辑后，要求 Model 改变状态

模型（Model）：数据保存 将新的数据发送到 View，用户得到反馈

### 二、MVP

通信方式如下

各部分之间的通信，都是双向的。

View 与 Model 不发生联系，都通过 Presenter 传递。

View 非常薄，不部署任何业务逻辑，称为"被动视图"（Passive View），即没有任何主动性，而 Presenter 非常厚，所有逻辑都部署在那里。

### 三、MVVM

MVVM 模式将 Presenter 改名为 ViewModel，基本上与 MVP 模式完全一致。通信方式如下

唯一的区别是，它采用双向绑定（data-binding）：View 的变动，自动反映在 ViewModel，反之亦然。

## 常见的实现 MVVM 几种方式

## 解释下 Object.defineProperty()方法

这是 js 中一个非常重要的方法，ES6 中某些方法的实现依赖于它，VUE 通过它实现双向绑定，此方法会直接在一个对象上定义一个新属性，或者修改一个已经存在的属性， 并返回这个对象


### 语法
``` js
Object.defineProperty(object, attribute, descriptor)
```

- 这三个参数都是必输项
- 第一个参数为 目标对象
- 第二个参数为 需要定义的属性或者方法
- 第三个参数为 目标属性所拥有的特性

#### descriptor

前两个参数都很明确，重点是第三个参数 descriptor， 它有以下取值

- value: 属性的值
- writable: 属性的值是否可被重写（默认为 false）
- configurable: 总开关，是否可配置，若为 false, 则其他都为 false（默认为 false）
- enumerable: 属性是否可被枚举（默认为 false）
- get: 获取该属性的值时调用
- set: 重写该属性的值时调用

一个例子

``` js
var a = {};
Object.defineProperty(a, "b", {
    value: 123
});
console.log(a.b); //123
a.b = 456;
console.log(a.b); //123
a.c = 110;
for (item in a) {
    console.log(item, a[item]); //c 110
}
```

因为 writable 和 enumerable 默认值为 false, 所以对 a.b 赋值无效，也无法遍历它

### configurable

总开关，是否可配置，设置为 false 后，就不能再设置了，否则报错， 例子

``` js
var a = {};
Object.defineProperty(a, "b", {
    configurable: false
});
Object.defineProperty(a, "b", {
    configurable: true
});

//error: Uncaught TypeError: Cannot redefine property: b
```

#### writable

是否可重写

``` js
var a = {};
Object.defineProperty(a, "b", {
    value: 123,
    writable: false
});
console.log(a.b); // 打印 123
a.b = 25; // 没有错误抛出（在严格模式下会抛出，即使之前已经有相同的值）
console.log(a.b); // 打印 123， 赋值不起作用。
```

#### enumerable

属性特性 enumerable 定义了对象的属性是否可以在 for... in 循环和 Object. keys() 中被枚举

``` js
var a = {};
Object.defineProperty(a, "b", {
    value: 3445,
    enumerable: true
});
console.log(Object.keys(a)); // 打印["b"]
```

enumerable 改为 false

``` js
var a = {};
Object.defineProperty(a, "b", {
    value: 3445,
    enumerable: false //注意咯这里改了
});
console.log(Object.keys(a)); // 打印[]
```

#### set 和 get

如果设置了 set 或 get, 就不能设置 writable 和 value 中的任何一个，否则报错

``` js
var a = {};
Object.defineProperty(a, "abc", {
    value: 123,
    get: function() {
        return value;
    }
});
//Uncaught TypeError: Invalid property descriptor. Cannot both specify accessors and a value or writable attribute, #<Object> at Function.defineProperty
```

对目标对象的目标属性 赋值和取值 时， 分别触发 set 和 get 方法

``` js
var a = {};
var b = 1;
Object.defineProperty(a, "b", {
    set: function(newValue) {
        b = 99;
        console.log("你要赋值给我,我的新值是" + newValue);
    },
    get: function() {
        console.log("你取我的值");
        return 2; //注意这里，我硬编码返回2
    }
});
a.b = 1; //打印 你要赋值给我,我的新值是1
console.log(b); //打印 99
console.log(a.b); //打印 你取我的值
//打印 2    注意这里，和我的硬编码相同的
```

上面的代码中，给 a.b 赋值，b 的值也跟着改变了。原因是给 a.b 赋值，自动调用了 set 方法，在 set 方法中改变了 b 的值。vue 双向绑定的原理就是这个。

## 实现一个自己的 MVVM（原理剖析）

## 递归组件的使用

组件是可以在自己的模板中调用自身的，不过他们只能通过name选项来做这件事

## Obj.keys()与 Obj.defineProperty

## 发布-订阅模式

## 实现 MVVM 的思路分析

## mvvm 和 mvc 区别？它和其它框架（jquery）的区别是什么？哪些场景适合？

mvc 和 mvvm 其实区别并不大。都是一种设计思想。主要就是 mvc 中 Controller 演变成 mvvm 中的 viewModel。mvvm 主要解决了 mvc 中大量的 DOM 操作使页面渲染性能降低，加载速度变慢，影响用户体验。

区别：vue 数据驱动，通过数据来显示视图层而不是节点操作。

场景：数据操作比较多的场景，更加便捷

## 构建的 vue-cli 工程都到了哪些技术，它们的作用分别是什么？

1. vue. js：vue-cli 工程的核心，主要特点是 双向数据绑定 和 组件系统。

2. vue-router：vue 官方推荐使用的路由框架。

3. vuex：专为 Vue. js 应用项目开发的状态管理器，主要用于维护 vue 组件间共用的一些 变量 和 方法。

4. axios（ 或者 fetch 、ajax ）：用于发起 GET 、或 POST 等 http 请求，基于 Promise 设计。

5. vux 等：一个专为 vue 设计的移动端 UI 组件库。

6. 创建一个 emit. js 文件，用于 vue 事件机制的管理。

7. webpack：模块加载和 vue-cli 工程打包器。

## vue-cli 工程常用的 npm 命令有哪些？

npm install、npm run dev、npm run build --report 等

解析：

下载 node_modules 资源包的命令：npm install

启动 vue-cli 开发环境的 npm 命令：npm run dev

vue-cli 生成 生产环境部署资源 的 npm 命令：npm run build

用于查看 vue-cli 生产环境部署资源文件大小的 npm 命令：npm run build --report，此命令必答

命令效果：

在浏览器上自动弹出一个 展示 vue-cli 工程打包后 app. js、manifest. js、vendor. js 文件里面所包含代码的页面。可以具此优化 vue-cli 生产环境部署的静态资源，提升 页面 的加载速度。

## 请说出 vue-cli 工程中每个文件夹和文件的用处

vue-cli目录解析：

``` txt
build 文件夹：用于存放 webpack 相关配置和脚本。开发中仅 偶尔使用 到此文件夹下 webpack.base.conf.js 用于配置 less、sass等css预编译库，或者配置一下 UI 库。
config 文件夹：主要存放配置文件，用于区分开发环境、线上环境的不同。 常用到此文件夹下 config.js 配置开发环境的 端口号、是否开启热加载 或者 设置生产环境的静态资源相对路径、是否开启gzip压缩、npm run build 命令打包生成静态资源的名称和路径等。
dist 文件夹：默认 npm run build 命令打包生成的静态资源文件，用于生产部署。
node_modules：存放npm命令下载的开发环境和生产环境的依赖包。
src: 存放项目源码及需要引用的资源文件。
src下assets：存放项目中需要用到的资源文件，css、js、images等。
src下componets：存放vue开发中一些公共组件：header.vue、footer.vue等。
src下emit：自己配置的vue集中式事件管理机制。
src下router：vue-router vue路由的配置文件。
src下service：自己配置的vue请求后台接口方法。
src下page：存在vue页面组件的文件夹。
src下util：存放vue开发过程中一些公共的.js方法。
src下vuex：存放 vuex 为vue专门开发的状态管理器。
src下app.vue：使用标签<route-view></router-view>渲染整个工程的.vue组件。
src下main.js：vue-cli工程的入口文件。
index.html：设置项目的一些meta头信息和提供<div id="app"></div>用于挂载 vue 节点。
package.json：用于 node_modules资源部 和 启动、打包项目的 npm 命令管理。
```

## config 文件夹 下 index.js 的对于工程 开发环境 和 生产环境 的配置
``` txt
build 对象下 对于 生产环境 的配置：

index：配置打包后入口.html文件的名称以及文件夹名称
assetsRoot：配置打包后生成的文件名称和路径
assetsPublicPath：配置 打包后 .html 引用静态资源的路径，一般要设置成 "./"
productionGzip：是否开发 gzip 压缩，以提升加载速度

dev 对象下 对于 开发环境 的配置：

port：设置端口号
autoOpenBrowser：启动工程时，自动打开浏览器
proxyTable：vue设置的代理，用以解决 跨域 问题
```

## 请你详细介绍一些 package.json 里面的配置

``` txt
scripts：npm run xxx 命令调用node执行的 .js 文件
dependencies：生产环境依赖包的名称和版本号，即这些 依赖包 都会打包进 生产环境的JS文件里面
devDependencies：开发环境依赖包的名称和版本号，即这些 依赖包 只用于 代码开发 的时候，不会打包进 生产环境js文件 里面。
```

## vue-cli 中常用到的加载器

1. 安装 sass:

2. 安装 axios:

3. 安装 mock:

4. 安装 lib-flexible: --实现移动端自适应

5. 安装 sass-resourses-loader

## vue-cli 中怎样使用自定义的组件？有遇到过哪些问题吗？

第一步：在 components 目录新建你的组件文件（如：indexPage. vue），script 一定要 export default {}

第二步：在需要用的页面（组件）中导入：import indexPage from '@/components/indexPage. vue'

第三步：注入到 vue 的子组件的 components 属性上面, components:{indexPage}

第四步：在 template 视图 view 中使用

遇到的问题： 例如有 indexPage 命名，使用的时候则 index-page

## vue-cli 提供的几种脚手架模板

1. webpack-simple模板
2. webpack模板

## vue-cli 开发环境使用全局常量

## vue-cli 生产环境使用全局常量

## vue-cli 中自定义指令的使用

## vue 是如何对数组方法进行变异的？例如 push、pop、splice 等方法

## vue 组件之间的通信种类

1. 父组件向子组件通信
2. 子组件向父组件通信
3. 隔代组件间通信
4. 兄弟组件间通信

## 谈一谈 nextTick 的原理

- 在下次 DOM 更新循环结束之后执行延迟回调。

- nextTick主要使用了宏任务和微任务。

- 根据执行环境分别尝试采用
  Promise MutationObserver setImmediate

如果以上都不行则采用setTimeout定义了一个异步方法，多次调用nextTick会将方法存入队列中，通过这个异步方法清空当前队列。

## Vue 中的 computed 是如何实现的

## vue 如何优化首页的加载速度？vue 首页白屏是什么问题引起的？如何解决呢？

### vue 如何优化首页的加载速度？
- 路由懒加载
- ui框架按需加载
- gzip压缩

### vue 首页白屏是什么问题引起的？

- 第一种，打包后文件引用路径不对，导致找不到文件报错白屏

解决办法：修改一下config下面的index. js中bulid模块导出的路径。因为index. html里边的内容都是通过script标签引入的，而你的路径不对，打开肯定是空白的。先看一下默认的路径。

- 第二种，由于把路由模式mode设置影响

解决方法：路由里边router/index. js路由配置里边默认模式是hash，如果你改成了history模式的话，打开也会是一片空白。所以改为hash或者直接把模式配置删除，让它默认的就行 。如果非要使用history模式的话，需要你在服务端加一个覆盖所有的情况的候选资源：如果URL匹配不到任何静态资源，则应该返回一个index. html，这个页面就是你app依赖页面。

所以只要删除mode或者把mode改成hash就OK了。

- 第三种，项目中使用了es6的语法，一些浏览器不支持es6，造成编译错误不能解析而造成白屏

解决方法：

安装 npm install --save-dev babel-preset-es2015

安装 npm install --save-dev babel-preset-stage-3

在项目根目录创建一个.babelrc文件 里面内容 最基本配置是：

``` json
{
    // 此项指明，转码的规则
    "presets": [
        // env项是借助插件babel-preset-env，下面这个配置说的是babel对es6,es7,es8进行转码，并且设置amd,commonjs这样的模块化文件，不进行转码
        ["env", {
            "modules": false
        }],
        // 下面这个是不同阶段出现的es语法，包含不同的转码插件
        "stage-2"
    ],
    // 下面这个选项是引用插件来处理代码的转换，transform-runtime用来处理全局函数和优化babel编译
    "plugins": ["transform-runtime"],
    // 下面指的是在生成的文件中，不产生注释
    "comments": false,
    // 下面这段是在特定的环境中所执行的转码规则，当环境变量是下面的test就会覆盖上面的设置
    "env": {
        // test 是提前设置的环境变量，如果没有设置BABEL_ENV则使用NODE_ENV，如果都没有设置默认就是development
        "test": {
            "presets": ["env", "stage-2"],
            // instanbul是一个用来测试转码后代码的工具
            "plugins": ["istanbul"]
        }
    }
}
```

## Vue 的父组件和子组件生命周期钩子执行顺序是什么

- 加载渲染过程
  - 父beforeCreate->父created->父beforeMount->子beforeCreate->子created->子beforeMount->子mounted->父mounted

- 子组件更新过程
  - 父beforeUpdate->子beforeUpdate->子updated->父updated

- 父组件更新过程
  - 父beforeUpdate->父updated

- 销毁过程
  - 父beforeDestroy->子beforeDestroy->子destroyed->父destroyed

## 在 Vue 中，子组件为何不可以修改父组件传递的 Prop，如果修改了，Vue 是如何监控到属性的修改并给出警告的。

## 实现通信方式

### 方式1: props
1. 通过一般属性实现父向子通信
2. 通过函数属性实现子向父通信
3. 缺点: 隔代组件和兄弟组件间通信比较麻烦

### 方式2: vue自定义事件
1. vue内置实现, 可以代替函数类型的props
  - 绑定监听: \<MyComp @eventName="callback"
  - 触发(分发)事件: this.$emit("eventName", data)
2. 缺点: 只适合于子向父通信

### 方式3: 消息订阅与发布
1. 需要引入消息订阅与发布的实现库, 如: pubsub-js
  - 订阅消息: PubSub.subscribe('msg', (msg, data)=>{})
  - 发布消息: PubSub.publish(‘msg’, data)
2. 优点: 此方式可用于任意关系组件间通信

### 方式4: vuex
1. 是什么: vuex是vue官方提供的集中式管理vue多组件共享状态数据的vue插件
2. 优点: 对组件间关系没有限制, 且相比于pubsub库管理更集中, 更方便

### 方式5: slot
1. 是什么: 专门用来实现父向子传递带数据的标签
  - 子组件
  - 父组件
2. 注意: 通信的标签模板是在父组件中解析好后再传递给子组件的

## 说说Vue的MVVM实现原理

- 1. Vue作为MVVM模式的实现库的2种技术
  - 模板解析
  - 数据绑定

- 2. 模板解析: 实现初始化显示
  - 解析大括号表达式
  - 解析指令

- 3. 数据绑定: 实现更新显示
  - 通过数据劫持实现

## axios的特点有哪些？

1. Axios 是一个基于 promise 的 HTTP 库，支持promise所有的API
2. 它可以拦截请求和响应
3. 它可以转换请求数据和响应数据，并对响应回来的内容自动转换成 JSON类型的数据
4. 安全性更高，客户端支持防御 CSRF

## axios有哪些常用方法？

1. axios.get(url[, config])   //get请求用于列表和信息查询
2. axios.delete(url[, config])  //删除
3. axios.post(url[, data[, config]])  //post请求用于信息的添加
4. axios.put(url[, data[, config]])  //更新操作

## 说下你了解的axios相关配置属性？

`url` 是用于请求的服务器URL

`method` 是创建请求时使用的方法,默认是get

`baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对URL。它可以通过设置一个 `baseURL` 便于为axios实例的方法传递相对URL

`transformRequest` 允许在向服务器发送前，修改请求数据，只能用在'PUT','POST'和'PATCH'这几个请求方法

`headers` 是即将被发送的自定义请求头
``` js
headers:{'X-Requested-With':'XMLHttpRequest'},
```

`params` 是即将与请求一起发送的URL参数，必须是一个无格式对象(plainobject)或URLSearchParams对象
``` js
params:{
  ID:12345
},
```

`auth` 表示应该使用HTTP基础验证，并提供凭据
这将设置一个 `Authorization` 头，覆写掉现有的任意使用 `headers` 设置的自定义 `Authorization` 头
``` js
auth:{
  username:'janedoe',
  password:'s00pers3cret'
},
```

'proxy'定义代理服务器的主机名称和端口
`auth` 表示HTTP基础验证应当用于连接代理，并提供凭据
这将会设置一个 `Proxy-Authorization` 头，覆写掉已有的通过使用 `header` 设置的自定义 `Proxy-Authorization` 头。
``` js
proxy:{
  host:'127.0.0.1',
  port:9000,
  auth::{
    username:'mikeymike',
    password:'rapunz3l'
  }
},
```

## Vue.use是干什么的？原理是什么？

vue.use 是用来使用插件的，我们可以在插件中扩展全局组件、指令、原型方法等。

- 1. 检查插件是否注册，若已注册，则直接跳出；

- 2. 处理入参，将第一个参数之后的参数归集，并在首部塞入 this 上下文；

- 3. 执行注册方法，调用定义好的 install 方法，传入处理的参数，若没有 install 方法并且插件本身为 function 则直接进行注册；

  - 插件不能重复的加载

    install 方法的第一个参数是vue的构造函数，其他参数是Vue.use中除了第一个参数的其他参数； 代码：args.unshift(this)

  - 调用插件的install 方法 代码：typeof plugin.install === 'function'

  - 插件本身是一个函数，直接让函数执行。 代码：plugin.apply(null, args)

  - 缓存插件。 代码：installedPlugins.push(plugin)

``` ts
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}


export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
```

## new Vue() 发生了什么？

1. 结论：new Vue()是创建Vue实例，它内部执行了根实例的初始化过程。

2. 具体包括以下操作：

选项合并

`$children`，`$refs`，`$slots`，`$createElement`等实例属性的方法初始化

自定义事件处理

数据响应式处理

生命周期钩子调用 （beforecreate created）

可能的挂载

3. 总结：new Vue()创建了根实例并准备好数据和方法，未来执行挂载时，此过程还会递归的应用于它的子组件上，最终形成一个有紧密关系的组件实例树。

## 请说一下响应式数据的理解？

根据数据类型来做不同处理，数组和对象类型当值变化时如何劫持。

1. 对象内部通过defineReactive方法，使用Object. defineProperty() 监听数据属性的 get 来进行数据依赖收集，再通过 set 来完成数据更新的派发；

2. 数组则通过重写数组方法来实现的。扩展它的 7 个变更⽅法，通过监听这些方法可以做到依赖收集和派发更新；( push/pop/shift/unshift/splice/reverse/sort )

这里在回答时可以带出一些相关知识点 （比如多层对象是通过递归来实现劫持，顺带提出vue3中是使用 proxy来实现响应式数据）

补充回答：

内部依赖收集是怎么做到的，每个属性都拥有自己的dep属性，存放他所依赖的 watcher，当属性变化后会通知自己对应的 watcher去更新。

响应式流程：

1. defineReactive 把数据定义成响应式的；

2. 给属性增加一个 dep，用来收集对应的那些watcher；

3. 等数据变化进行更新

dep.depend() // get 取值：进行依赖收集

dep.notify() // set 设置时：通知视图更新

这里可以引出性能优化相关的内容：

1. 对象层级过深，性能就会差。

2. 不需要响应数据的内容不要放在data中。

3. object.freeze() 可以冻结数据。

## Vue如何检测数组变化？

数组考虑性能原因没有用defineProperty对数组的每一项进行拦截，而是选择重写数组方法。当数组调用到这 7 个方法的时候，执行 ob.dep.notify() 进行派发通知 Watcher 更新；

重写数组方法：push/pop/shift/unshift/splice/reverse/sort

补充回答：

在Vue中修改数组的索引和长度是无法监控到的。需要通过以下7种变异方法修改数组才会触发数组对应的wacther进行更新。数组中如果是对象数据类型也会进行递归劫持。

说明：那如果想要改索引更新数据怎么办？

可以通过Vue.set()来进行处理 =》 核心内部用的是 splice 方法。

``` js
// 取出原型方法；

const arrayProto = Array.prototype

// 拷贝原型方法；

export const arrayMethods = Object.create(arrayProto)

// 重写数组方法；

def(arrayMethods, method, function mutator (... args) { }

ob.dep.notify() // 调用方法时更新视图；
```

## Vue.set 方法是如何实现的？

为什么$set可以触发更新，我们给对象和数组本身都增加了dep属性，当给对象新增不存在的属性则触发对象依赖的watcher去更新，当修改数组索引时我们调用数组本身的splice方法去更新数组。

补充回答：

官方定义Vue.set(object, key, value)

如果是数组，调用重写的splice方法 （这样可以更新视图 ）
代码：target.splice(key, 1, val)

如果不是响应式的也不需要将其定义成响应式属性。

如果是对象，将属性定义成响应式的 defineReactive(ob, key, val)

通知视图更新 ob.dep.notify()

## Vue中模板编译原理？

简单说，Vue的编译过程就是将template转化为render函数的过程。会经历以下阶段：

1. 生成AST树
2. 优化
3. codegen

- 首先解析模版，生成AST语法树(一种用JavaScript对象的形式来描述整个模板)。 使用大量的正则表达式对模板进行解析，遇到标签、文本的时候都会执行对应的钩子进行相关处理。

- Vue的数据是响应式的，但其实模板中并不是所有的数据都是响应式的。有一些数据首次渲染后就不会再变化，对应的DOM也不会变化。

- 那么优化过程就是深度遍历AST树，按照相关条件对树节点进行标记。这些被标记的节点(静态节点)我们就可以跳过对它们的比对，对运行时的模板起到很大的优化作用。

- 编译的最后一步是将优化后的AST树转换为可执行的代码。

## Vue3.x响应式数据原理

Vue3.x改用Proxy替代Object.defineProperty。因为Proxy可以直接监听对象和数组的变化，并且有多达13种拦截方法。并且作为新标准将受到浏览器厂商重点持续的性能优化。

## Vue3.x中Proxy只会代理对象的第一层，那么Vue3又是怎样处理这个问题的呢？

判断当前Reflect.get的返回值是否为Object，如果是则再通过reactive方法做代理， 这样就实现了深度观测。

## Vue3.x中监测数组的时候可能触发多次get/set，那么如何防止触发多次呢？

我们可以判断key是否为当前被代理对象target自身属性，也可以判断旧值与新值是否相等，只有满足以上两个条件之一时，才有可能执行trigger。

## vue2.x中如何监测数组变化
- 使用了函数劫持的方式，重写了数组的方法，Vue将data中的数组进行了原型链重写，指向了自己定义的数组原型方法。
- 这样当调用数组api时，可以通知依赖更新。
- 如果数组中包含着引用类型，会对数组中的引用类型再次递归遍历进行监控。这样就实现了监测数组变化。

## 说一下Computed和Watch

- Computed本质是一个具备缓存的watcher，依赖的响应式属性变化才会重新计算并且更新视图。 适用于计算比较消耗性能的计算场景。当表达式过于复杂时，在模板中放入过多逻辑会让模板难以维护，可以将复杂的逻辑放入计算属性中处理。

- Watch没有缓存性，更多的是观察的作用，可以监听某些数据执行回调。常用于监听某一个值，当被监听的值发生变化时，执行对应的操作。 打开deep：true选项会深度监听对象中的属性，对对象中的每一项进行监听。 immediate: true 选项表示，初始化时就会先执行一遍该监听对应的操作

## Vue2.x和Vue3.x渲染器的diff算法分别说一下

简单来说，diff算法有以下过程

- 同级比较，再比较子节点
- 先判断一方有子节点一方没有子节点的情况(如果新的children没有子节点，将旧的子节点移除)
- 比较都有子节点的情况(核心diff)
- 递归比较子节点
- 正常Diff两个树的时间复杂度是O(n^3) ，但实际情况下我们很少会进行跨层级的移动DOM，所以Vue将Diff进行了优化，从O(n^3) -> O(n)，只有当新旧children都为多个子节点时才需要用核心的Diff算法进行同层级比较。

Vue2的核心Diff算法采用了双端比较的算法，同时从新旧children的两端开始进行比较，借助key值找到可复用的节点，再进行相关操作。相比React的Diff算法，同样情况下可以减少移动节点次数，减少不必要的性能损耗，更加的优雅。

Vue3.x借鉴了 ivi算法和 inferno算法

在创建VNode时就确定其类型，以及在mount/patch的过程中采用位运算来判断一个VNode的类型，在这个基础之上再配合核心的Diff算法，使得性能上较Vue2.x有了提升。(实际的实现可以结合Vue3.x源码看。)

## SSR了解吗？

- SSR也就是服务端渲染，也就是将Vue在客户端把标签渲染成HTML的工作放在服务端完成，然后再把html直接返回给客户端。

- SSR有着更好的SEO、并且首屏加载速度更快等优点。

- 不过它也有一些缺点，比如我们的开发条件会受到限制，服务器端渲染只支持beforeCreate和created两个钩子，当我们需要一些外部扩展库时需要特殊处理，服务端渲染应用程序也需要处于Node.js的运行环境。

- 还有就是服务器会有更大的负载需求。

## 组件中写 name选项有哪些好处及作用？

- 可以通过名字找到对应的组件（ 递归组件 ）

- 可以通过name属性实现缓存功能 (keep-alive)

- 可以通过name来识别组件（跨级组件通信时非常重要）

``` vue
Vue.extend = function () {
    if(name) {
        Sub.options.componentd[name] = Sub
    }
}
```

## 事件机制

### 1.1 事件触发三阶段

- document 往事件触发处传播，遇到注册的捕获事件会触发
- 传播到事件触发处时触发注册的事件
- 从事件触发处往 document 传播，遇到注册的冒泡事件会触发

> 事件触发一般来说会按照上面的顺序进行，但是也有特例，如果给一个目标节点同时注册冒泡和捕获事件，事件触发会按照注册的顺序执行

```
// 以下会先打印冒泡然后是捕获
node.addEventListener('click',(event) =>{
	console.log('冒泡')
},false);
node.addEventListener('click',(event) =>{
	console.log('捕获 ')
},true)
```

### 1.2 注册事件

- 通常我们使用 `addEventListener` 注册事件，该函数的第三个参数可以是布尔值，也可以是对象。对于布尔值 `useCapture` 参数来说，该参数默认值为 `false` 。`useCapture` 决定了注册的事件是捕获事件还是冒泡事件
- 一般来说，我们只希望事件只触发在目标上，这时候可以使用 `stopPropagation` 来阻止事件的进一步传播。通常我们认为 `stopPropagation` 是用来阻止事件冒泡的，其实该函数也可以阻止捕获事件。`stopImmediatePropagation` 同样也能实现阻止事件，但是还能阻止该事件目标执行别的注册事件

```javascript
node.addEventListener('click',(event) =>{
	event.stopImmediatePropagation()
	console.log('冒泡')
},false);
// 点击 node 只会执行上面的函数，该函数不会执行
node.addEventListener('click',(event) => {
	console.log('捕获 ')
},true)
```

### 1.3 事件代理

> 如果一个节点中的子节点是动态生成的，那么子节点需要注册事件的话应该注册在父节点上

```html
<ul id="ul">
	<li>1</li>
    <li>2</li>
	<li>3</li>
	<li>4</li>
	<li>5</li>
</ul>
<script>
	let ul = document.querySelector('##ul')
	ul.addEventListener('click', (event) => {
		console.log(event.target);
	})
</script>
```

> 事件代理的方式相对于直接给目标注册事件来说，有以下优点

- 节省内存
- 不需要给子节点注销事件

## 跨域

> 因为浏览器出于安全考虑，有同源策略。也就是说，如果协议、域名或者端口有一个不同就是跨域，Ajax 请求会失败

### 2.1 JSONP

> JSONP 的原理很简单，就是利用 `<script>` 标签没有跨域限制的漏洞。通过 `<script>` 标签指向一个需要访问的地址并提供一个回调函数来接收数据当需要通讯时

```html
<script src="http://domain/api?param1=a&param2=b&callback=jsonp"></script>
<script>
    function jsonp(data) {
    	console.log(data)
	}
</script>
```

- JSONP 使用简单且兼容性不错，但是只限于 get 请求

### 2.2 CORS

- `CORS`需要浏览器和后端同时支持
- 浏览器会自动进行 `CORS` 通信，实现CORS通信的关键是后端。只要后端实现了 `CORS`，就实现了跨域。
- 服务端设置 `Access-Control-Allow-Origin` 就可以开启 `CORS`。 该属性表示哪些域名可以访问资源，如果设置通配符则表示所有网站都可以访问资源


### 2.3 document.domain

- 该方式只能用于二级域名相同的情况下，比如 `a.test.com` 和 `b.test.com` 适用于该方式。
- 只需要给页面添加 `document.domain = 'test.com'` 表示二级域名都相同就可以实现跨域

### 2.4 postMessage

> 这种方式通常用于获取嵌入页面中的第三方页面数据。一个页面发送消息，另一个页面判断来源并接收消息

```javascript
// 发送消息端
window.parent.postMessage('message', 'http://test.com');

// 接收消息端
var mc = new MessageChannel();
mc.addEventListener('message', (event) => {
    var origin = event.origin || event.originalEvent.origin;
    if (origin === 'http://test.com') {
        console.log('验证通过')
    }
});
```

## Event loop

### 3.1 JS中的event loop

> 众所周知 JS 是门非阻塞单线程语言，因为在最初 JS 就是为了和浏览器交互而诞生的。如果 JS 是门多线程的语言话，我们在多个线程中处理 DOM 就可能会发生问题（一个线程中新加节点，另一个线程中删除节点）

- JS 在执行的过程中会产生执行环境，这些执行环境会被顺序的加入到执行栈中。如果遇到异步的代码，会被挂起并加入到 Task（有多种 task） 队列中。一旦执行栈为空，Event Loop 就会从 Task 队列中拿出需要执行的代码并放入执行栈中执行，所以本质上来说 JS 中的异步还是同步行为

```javascript
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

console.log('script end');
```

> 不同的任务源会被分配到不同的 `Task` 队列中，任务源可以分为 微任务（`microtask`） 和 宏任务（`macrotask`）。在 `ES6` 规范中，`microtask` 称为 jobs，macrotask 称为 task


```javascript
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

new Promise((resolve) => {
    console.log('Promise')
    resolve()
}).then(function() {
  console.log('promise1');
}).then(function() {
  console.log('promise2');
});

console.log('script end');
// script start => Promise => script end => promise1 => promise2 => setTimeout
```

> 以上代码虽然 `setTimeout` 写在 `Promise` 之前，但是因为 `Promise` 属于微任务而 `setTimeout` 属于宏任务

**微任务**

- `process.nextTick`
- `promise`
- `Object.observe`
- `MutationObserver`

**宏任务**

- `script `
- `setTimeout`
- `setInterval `
- `setImmediate `
- `I/O `
- `UI rendering`

> 宏任务中包括了 script ，浏览器会先执行一个宏任务，接下来有异步代码的话就先执行微任务

**所以正确的一次 Event loop 顺序是这样的**

- 执行同步代码，这属于宏任务
- 执行栈为空，查询是否有微任务需要执行
- 执行所有微任务
- 必要的话渲染 UI
- 然后开始下一轮 `Event loop`，执行宏任务中的异步代码

> 通过上述的 `Event loop` 顺序可知，如果宏任务中的异步代码有大量的计算并且需要操作 `DOM` 的话，为了更快的响应界面响应，我们可以把操作 `DOM` 放入微任务中

### 3.2 Node 中的 Event loop

- `Node` 中的 `Event loop` 和浏览器中的不相同。
- `Node` 的 `Event loop` 分为`6`个阶段，它们会按照顺序反复运行


```javascript
┌───────────────────────┐
┌─>│        timers         │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     I/O callbacks     │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     idle, prepare     │
│  └──────────┬────────────┘      ┌───────────────┐
│  ┌──────────┴────────────┐      │   incoming:   │
│  │         poll          │<──connections───     │
│  └──────────┬────────────┘      │   data, etc.  │
│  ┌──────────┴────────────┐      └───────────────┘
│  │        check          │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
└──┤    close callbacks    │
   └───────────────────────┘
```

**timer**

- `timers` 阶段会执行 `setTimeout` 和 `setInterval`
- 一个 timer 指定的时间并不是准确时间，而是在达到这个时间后尽快执行回调，可能会因为系统正在执行别的事务而延迟

**I/O**

- `I/O` 阶段会执行除了 `close` 事件，定时器和 `setImmediate` 的回调

idle, prepare
idle, prepare 阶段内部实现

**poll**

- `poll` 阶段很重要，这一阶段中，系统会做两件事情
  - 执行到点的定时器
  - 执行 `poll` 队列中的事件

- 并且当 poll 中没有定时器的情况下，会发现以下两件事情
  - 如果 poll 队列不为空，会遍历回调队列并同步执行，直到队列为空或者系统限制
  - 如果 poll 队列为空，会有两件事发生
  - 如果有 `setImmediate` 需要执行，`poll` 阶段会停止并且进入到 `check` 阶段执行 `setImmediate`
  - 如果没有 `setImmediate` 需要执行，会等待回调被加入到队列中并立即执行回调
  - 如果有别的定时器需要被执行，会回到 `timer` 阶段执行回调。

**check**

- `check` 阶段执行 `setImmediate`

**close callbacks**

- `close callbacks` 阶段执行 `close` 事件
- 并且在 `Node` 中，有些情况下的定时器执行顺序是随机的

```javascript
setTimeout(() => {
    console.log('setTimeout');
}, 0);
setImmediate(() => {
    console.log('setImmediate');
})
// 这里可能会输出 setTimeout，setImmediate
// 可能也会相反的输出，这取决于性能
// 因为可能进入 event loop 用了不到 1 毫秒，这时候会执行 setImmediate
// 否则会执行 setTimeout
```

> 上面介绍的都是 macrotask 的执行情况，microtask 会在以上每个阶段完成后立即执行

```javascript
setTimeout(()=>{
    console.log('timer1')

    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)

setTimeout(()=>{
    console.log('timer2')

    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)

// 以上代码在浏览器和 node 中打印情况是不同的
// 浏览器中一定打印 timer1, promise1, timer2, promise2
// node 中可能打印 timer1, timer2, promise1, promise2
// 也可能打印 timer1, promise1, timer2, promise2
```

> `Node` 中的 `process.nextTick` 会先于其他 `microtask` 执行


```javascript
setTimeout(() => {
 console.log("timer1");

 Promise.resolve().then(function() {
   console.log("promise1");
 });
}, 0);

process.nextTick(() => {
 console.log("nextTick");
});
// nextTick, timer1, promise1
```

## 四、Service Worker

> Service workers 本质上充当Web应用程序与浏览器之间的代理服务器，也可以在网络可用时作为浏览器和网络间的代理。它们旨在（除其他之外）使得能够创建有效的离线体验，拦截网络请求并基于网络是否可用以及更新的资源是否驻留在服务器上来采取适当的动作。他们还允许访问推送通知和后台同步API

**目前该技术通常用来做缓存文件，提高首屏速度**

```javascript
// index.js
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register("sw.js")
    .then(function(registration) {
      console.log("service worker 注册成功");
    })
    .catch(function(err) {
      console.log("servcie worker 注册失败");
    });
}
// sw.js
// 监听 `install` 事件，回调中缓存所需文件
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("my-cache").then(function(cache) {
      return cache.addAll(["./index.html", "./index.js"]);
    })
  );
});

// 拦截所有请求事件
// 如果缓存中已经有请求的数据就直接用缓存，否则去请求数据
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response) {
        return response;
      }
      console.log("fetch source");
    })
  );
});
```

> 打开页面，可以在开发者工具中的 Application 看到 Service Worker 已经启动了

![](https://user-gold-cdn.xitu.io/2018/3/28/1626b1e8eba68e1c?w=1770&h=722&f=png&s=192277)


> 在 Cache 中也可以发现我们所需的文件已被缓存

![](https://user-gold-cdn.xitu.io/2018/3/28/1626b20dfc4fcd26?w=1118&h=728&f=png&s=85610)

当我们重新刷新页面可以发现我们缓存的数据是从 Service Worker 中读取的

## 五、渲染机制

**浏览器的渲染机制一般分为以下几个步骤**

- 处理 `HTML` 并构建 `DOM` 树。
- 处理 `CSS` 构建 `CSSOM` 树。
- 将 `DOM` 与 `CSSOM` 合并成一个渲染树。
- 根据渲染树来布局，计算每个节点的位置。
- 调用 `GPU` 绘制，合成图层，显示在屏幕上

![](https://user-gold-cdn.xitu.io/2018/4/11/162b2ab2ec70ac5b?w=900&h=352&f=png&s=49983)

- 在构建 CSSOM 树时，会阻塞渲染，直至 CSSOM 树构建完成。并且构建 CSSOM 树是一个十分消耗性能的过程，所以应该尽量保证层级扁平，减少过度层叠，越是具体的 CSS 选择器，执行速度越慢
- 当 HTML 解析到 script 标签时，会暂停构建 DOM，完成后才会从暂停的地方重新开始。也就是说，如果你想首屏渲染的越快，就越不应该在首屏就加载 JS 文件。并且 CSS 也会影响 JS 的执行，只有当解析完样式表才会执行 JS，所以也可以认为这种情况下，CSS 也会暂停构建 DOM

### 5.1 图层

> 一般来说，可以把普通文档流看成一个图层。特定的属性可以生成一个新的图层。不同的图层渲染互不影响，所以对于某些频繁需要渲染的建议单独生成一个新图层，提高性能。但也不能生成过多的图层，会引起反作用

**通过以下几个常用属性可以生成新图层**

- 3D 变换：`translate3d`、`translateZ`
- `will-change`
- `video`、`iframe` 标签
- 通过动画实现的 `opacity` 动画转换
- `position: fixed`

### 5.2 重绘（Repaint）和回流（Reflow）

- 重绘是当节点需要更改外观而不会影响布局的，比如改变 color 就叫称为重绘
- 回流是布局或者几何属性需要改变就称为回流

> 回流必定会发生重绘，重绘不一定会引发回流。回流所需的成本比重绘高的多，改变深层次的节点很可能导致父节点的一系列回流

**所以以下几个动作可能会导致性能问题**：

- 改变 window 大小
- 改变字体
- 添加或删除样式
- 文字改变
- 定位或者浮动
- 盒模型

**很多人不知道的是，重绘和回流其实和 Event loop 有关**

- 当 Event loop 执行完 `Microtasks` 后，会判断 `document` 是否需要更新。因为浏览器是 `60Hz `的刷新率，每 `16ms `才会更新一次。
- 然后判断是否有 `resize` 或者 `scroll` ，有的话会去触发事件，所以 `resize` 和 `scroll` 事件也是至少 `16ms` 才会触发一次，并且自带节流功能。
- 判断是否触发了` media query`
- 更新动画并且发送事件
- 判断是否有全屏操作事件
- 执行 `requestAnimationFrame` 回调
- 执行 `IntersectionObserver` 回调，该方法用于判断元素是否可见，可以用于懒加载上，但是兼容性不好
- 更新界面
- 以上就是一帧中可能会做的事情。如果在一帧中有空闲时间，就会去执行 `requestIdleCallback` 回调

**减少重绘和回流**

- 使用 `translate` 替代 `top`
- 使用 `visibility` 替换` display: none` ，因为前者只会引起重绘，后者会引发回流（改变了布局）
- 不要使用 `table` 布局，可能很小的一个小改动会造成整个 table 的重新布局
- 动画实现的速度的选择，动画速度越快，回流次数越多，也可以选择使用 `requestAnimationFrame`
- `CSS` 选择符从右往左匹配查找，避免 `DOM` 深度过深
- 将频繁运行的动画变为图层，图层能够阻止该节点回流影响别的元素。比如对于 `video `标签，浏览器会自动将该节点变为图层

## 网络相关

### 1.1 DNS 预解析

- DNS 解析也是需要时间的，可以通过预解析的方式来预先获得域名所对应的 IP

```html
<link rel="dns-prefetch" href="//yuchengkai.cn">
```

### 1.2 缓存

- 缓存对于前端性能优化来说是个很重要的点，良好的缓存策略可以降低资源的重复加载提高网页的整体加载速度
- 通常浏览器缓存策略分为两种：强缓存和协商缓存

**强缓存**

> 实现强缓存可以通过两种响应头实现：`Expires `和 `Cache-Control` 。强缓存表示在缓存期间不需要请求，`state code `为 `200`

```
Expires: Wed, 22 Oct 2018 08:41:00 GMT
```

> `Expires` 是 `HTTP / 1.0` 的产物，表示资源会在 `Wed, 22 Oct 2018 08:41:00 GMT` 后过期，需要再次请求。并且 `Expires` 受限于本地时间，如果修改了本地时间，可能会造成缓存失效

```
Cache-control: max-age=30
```

> `Cache-Control` 出现于 `HTTP / 1.1`，优先级高于 `Expires` 。该属性表示资源会在 `30` 秒后过期，需要再次请求

**协商缓存**

- 如果缓存过期了，我们就可以使用协商缓存来解决问题。协商缓存需要请求，如果缓存有效会返回 304
- 协商缓存需要客户端和服务端共同实现，和强缓存一样，也有两种实现方式

Last-Modified 和 If-Modified-Since

- `Last-Modified` 表示本地文件最后修改日期，`If-Modified-Since` 会将 `Last-Modified `的值发送给服务器，询问服务器在该日期后资源是否有更新，有更新的话就会将新的资源发送回来
- 但是如果在本地打开缓存文件，就会造成 `Last-Modified` 被修改，所以在 `HTTP / 1.1` 出现了 `ETag`

ETag 和 If-None-Match

- `ETag` 类似于文件指纹，`If-None-Match` 会将当前 `ETag` 发送给服务器，询问该资源 ETag 是否变动，有变动的话就将新的资源发送回来。并且 `ETag` 优先级比 `Last-Modified` 高

**选择合适的缓存策略**

> 对于大部分的场景都可以使用强缓存配合协商缓存解决，但是在一些特殊的地方可能需要选择特殊的缓存策略

- 对于某些不需要缓存的资源，可以使用 `Cache-control: no-store` ，表示该资源不需要缓存
- 对于频繁变动的资源，可以使用 `Cache-Control: no-cache` 并配合 `ETag` 使用，表示该资源已被缓存，但是每次都会发送请求询问资源是否更新。
- 对于代码文件来说，通常使用 `Cache-Control: max-age=31536000` 并配合策略缓存使用，然后对文件进行指纹处理，一旦文件名变动就会立刻下载新的文件

### 1.3 使用 HTTP / 2.0

- 因为浏览器会有并发请求限制，在 HTTP / 1.1 时代，每个请求都需要建立和断开，消耗了好几个 RTT 时间，并且由于 TCP 慢启动的原因，加载体积大的文件会需要更多的时间
- 在 HTTP / 2.0 中引入了多路复用，能够让多个请求使用同一个 TCP 链接，极大的加快了网页的加载速度。并且还支持 Header 压缩，进一步的减少了请求的数据大小


### 1.4 预加载

- 在开发中，可能会遇到这样的情况。有些资源不需要马上用到，但是希望尽早获取，这时候就可以使用预加载
- 预加载其实是声明式的 `fetch` ，强制浏览器请求资源，并且不会阻塞 `onload` 事件，可以使用以下代码开启预加载

```html
<link rel="preload" href="http://example.com">
```

> 预加载可以一定程度上降低首屏的加载时间，因为可以将一些不影响首屏但重要的文件延后加载，唯一缺点就是兼容性不好



### 1.5 预渲染

> 可以通过预渲染将下载的文件预先在后台渲染，可以使用以下代码开启预渲染

```html
<link rel="prerender" href="http://example.com">
```

- 预渲染虽然可以提高页面的加载速度，但是要确保该页面百分百会被用户在之后打开，否则就白白浪费资源去渲染

## 优化渲染过程

### 2.1 懒执行

- 懒执行就是将某些逻辑延迟到使用时再计算。该技术可以用于首屏优化，对于某些耗时逻辑并不需要在首屏就使用的，就可以使用懒执行。懒执行需要唤醒，一般可以通过定时器或者事件的调用来唤醒

### 2.2 懒加载

- 懒加载就是将不关键的资源延后加载

> 懒加载的原理就是只加载自定义区域（通常是可视区域，但也可以是即将进入可视区域）内需要加载的东西。对于图片来说，先设置图片标签的 src 属性为一张占位图，将真实的图片资源放入一个自定义属性中，当进入自定义区域时，就将自定义属性替换为 src 属性，这样图片就会去下载资源，实现了图片懒加载

- 懒加载不仅可以用于图片，也可以使用在别的资源上。比如进入可视区域才开始播放视频等


## 安全问题：CSRF和XSS

### 1 前言

> 面试中的安全问题，明确来说，就两个方面：

- `CSRF`：基本概念、攻击方式、防御措施
- `XSS`：基本概念、攻击方式、防御措施

> 这两个问题，一般不会问太难。

> 有人问：`SQL`注入算吗？答案：这个其实跟前端的关系不是很大。


### 2 CSRF

> 问的不难，一般问：

- `CSRF`的基本概念、缩写、全称
- 攻击原理
- 防御措施

> 如果把**攻击原理**和**防御措施**掌握好，基本没什么问题。


#### 2.1 CSRF的基本概念、缩写、全称

> `CSRF`（`Cross-site request forgery`）：**跨站请求伪造**。

PS：中文名一定要记住。英文全称，如果记不住也拉倒。


#### 2.2 CSRF的攻击原理

![](http://img.smyhvae.com/20180307_1735.png)

> 用户是网站A的注册用户，且登录进去，于是网站A就给用户下发`cookie`。

> 从上图可以看出，要完成一次`CSRF`攻击，受害者必须满足两个必要的条件：

1. 登录受信任网站`A`，并在本地生成`Cookie`。（如果用户没有登录网站`A`，那么网站`B`在诱导的时候，请求网站`A`的`api`接口时，会提示你登录）
2. 在不登出`A`的情况下，访问危险网站`B`（其实是利用了网站`A`的漏洞）。

> 我们在讲`CSRF`时，一定要把上面的两点说清楚。

> 温馨提示一下，`cookie`保证了用户可以处于登录状态，但网站`B`其实拿不到 `cookie`。

> 举个例子，前段时间里，微博网站有个`api`接口有漏洞，导致很多用户的粉丝暴增。

#### 2.3 CSRF如何防御

**方法一、Token 验证：**（用的最多）

1. 服务器发送给客户端一个`token`；
2. 客户端提交的表单中带着这个`token`。
3. 如果这个 `token` 不合法，那么服务器拒绝这个请求。


**方法二：隐藏令牌：**

- 把 `token` 隐藏在 `http` 的 `head`头中。

> 方法二和方法一有点像，本质上没有太大区别，只是使用方式上有区别。


**方法三、Referer 验证：**

> `Referer` 指的是页面请求来源。意思是，**只接受本站的请求，服务器才做响应**；如果不是，就拦截。


### 3 XSS

#### 3.1 XSS的基本概念

> `XSS（Cross Site Scripting）``：**跨域脚本攻击**。

- 接下来，我们详细讲一下 `XSS` 的内容。

> 预备知识：`HTTP`、`Cookie`、`Ajax`。

#### 3.2 XSS的攻击原理

> `XSS`攻击的核心原理是：不需要你做任何的登录认证，它会通过合法的操作（比如在`url`中输入、在评论框中输入），向你的页面注入脚本（可能是`js`、`hmtl`代码块等）。

> 最后导致的结果可能是：

- 盗用`Cookie`
- 破坏页面的正常结构，插入广告等恶意内容
- `D-doss`攻击

#### 3.3 XSS的攻击方式

1. 反射型

> 发出请求时，`XSS`代码出现在`url`中，作为输入提交到服务器端，服务器端解析后响应，`XSS`代码随响应内容一起传回给浏览器，最后浏览器解析执行`XSS`代码。这个过程像一次反射，所以叫反射型`XSS`。

2. 存储型

> 存储型`XSS`和反射型`XSS`的差别在于，提交的代码会存储在服务器端（数据库、内存、文件系统等），下次请求时目标页面时不用再提交XSS代码。

#### 3.4 XSS的防范措施（encode + 过滤）

**XSS的防范措施主要有三个：**

**1. 编码**：

> 对用户输入的数据进行`HTML Entity`编码。

如上图所示，把字符转换成 转义字符。


> `Encode`的作用是将`$var`等一些字符进行转化，使得浏览器在最终输出结果上是一样的。

比如说这段代码：

```html
<script>alert(1)</script>
```

> 若不进行任何处理，则浏览器会执行alert的js操作，实现XSS注入。

> 进行编码处理之后，L在浏览器中的显示结果就是`<script>alert(1)</script>`，实现了将``$var`作为纯文本进行输出，且不引起J`avaScript`的执行。


**2、过滤：**

- 移除用户输入的和事件相关的属性。如`onerror`可以自动触发攻击，还有`onclick`等。（总而言是，过滤掉一些不安全的内容）
- 移除用户输入的`Style`节点、`Script`节点、`Iframe`节点。（尤其是`Script`节点，它可是支持跨域的呀，一定要移除）。

**3、校正**

- 避免直接对`HTML Entity`进行解码。
- 使用`DOM Parse`转换，校正不配对的`DOM`标签。

> 备注：我们应该去了解一下`DOM Parse`这个概念，它的作用是把文本解析成`DOM`结构。


比较常用的做法是，通过第一步的编码转成文本，然后第三步转成`DOM`对象，然后经过第二步的过滤。

**还有一种简洁的答案：**

首先是encode，如果是富文本，就白名单。


### 4 CSRF 和 XSS 的区别

> 面试官还可能喜欢问二者的区别。

**区别一：**

- `CSRF`：需要用户先登录网站`A`，获取 `cookie`
- `XSS`：不需要登录。


**区别二：（原理的区别）**

- `CSRF`：是利用网站`A`本身的漏洞，去请求网站`A`的`api`。
- `XSS`：是向网站 `A` 注入 `JS`代码，然后执行 `JS` 里的代码，篡改网站`A`的内容。

## 创建对象和原型链

### 1 前言

#### 1.1 面向对象的三大特性

- 封装
- 继承
- 多态

#### 1.2 原型链的知识

> 原型链是面向对象的基础，是非常重要的部分。有以下几种知识：

- 创建对象有几种方法
- 原型、构造函数、实例、原型链
- `instanceof`的原理
- `new` 运算符

### 2 创建对象有几种方法

#### 2.1 方式一：字面量

```javascript
    var obj11 = {name: 'smyh'};
    var obj12 = new Object(name: `smyh`); //内置对象（内置的构造函数）
```

> 上面的两种写法，效果是一样的。因为，第一种写法，`obj11`会指向`Object`。

- 第一种写法是：字面量的方式。
- 第二种写法是：内置的构造函数


#### 2.2 方式二：通过构造函数


```javascript
    var M = function (name) {
        this.name = name;
    }
    var obj3 = new M('smyhvae');
```

#### 2.3 方法三：Object.create

```javascript
    var p = {name:'smyhvae'};
    var obj3 = Object.create(p);  //此方法创建的对象，是用原型链连接的
```

> 第三种方法，很少有人能说出来。这种方式里，`obj3`是实例，`p`是`obj3的``原型（`name`是p原型里的属性），构造函数是`Objecet` 。

![](http://img.smyhvae.com/20180306_1633.png)


### 3 原型、构造函数、实例，以及原型链

![](http://img.smyhvae.com/20180306_1540.png)

> PS：任何一个函数，如果在前面加了`new`，那就是构造函数。

#### 3.1 原型、构造函数、实例三者之间的关系

![](http://img.smyhvae.com/20180306_2107.png)

1. 构造函数通过 `new` 生成实例
2. 构造函数也是函数，构造函数的`prototype`指向原型。（所有的函数有`prototype`属性，但实例没有 `prototype`属性）
3. 原型对象中有 `constructor`，指向该原型的构造函数。

> 上面的三行，代码演示：

```js
  var Foo = function (name) {
      this.name = name;
  }

  var fn = new Foo('smyhvae');
```

> 上面的代码中，`Foo.prototype.constructor === Foo`的结果是`true`：

![](http://img.smyhvae.com/20180306_2120.png)


4. 实例的`__proto__`指向原型。也就是说，`Foo.__proto__ === M.prototype`。

> 声明：所有的**引用类型**（数组、对象、函数）都有`__proto__`这个属性。

`Foo.__proto__ === Function.prototype`的结果为true，说明`Foo`这个普通的函数，是`Function`构造函数的一个实例。



#### 3.2 原型链

**原型链的基本原理**：任何一个**实例**，通过原型链，找到它上面的**原型**，该原型对象中的方法和属性，可以被所有的原型实例共享。


> `Object`是原型链的顶端。

- 原型可以起到继承的作用。原型里的方法都可以被不同的实例共享：

```js
  //给Foo的原型添加 say 函数
  Foo.prototype.say = function () {
      console.log('');
  }
```

**原型链的关键**：在访问一个实例的时候，如果实例本身没找到此方法或属性，就往原型上找。如果还是找不到，继续往上一级的原型上找。


#### 3.3 `instanceof`的原理

![](http://img.smyhvae.com/20180306_2209.png)


- `instanceof`的**作用**：用于判断**实例**属于哪个**构造函数**。
- `instanceof`的**原理**：判断实例对象的`__proto__`属性，和构造函数的`prototype`属性，是否为同一个引用（是否指向同一个地址）。

> - **注意1**：虽然说，实例是由构造函数 new 出来的，但是实例的`__proto__`属性引用的是构造函数的`prototype`。也就是说，实例的`__proto__`属性与构造函数本身无关。
> - **注意2**：在原型链上，原型的上面可能还会有原型，以此类推往上走，继续找`__proto__`属性。这条链上如果能找到， instanceof 的返回结果也是 true。

比如说：

- `foo instance of Foo`的结果为true，因为`foo.__proto__ === M.prototype`为`true`。
- **`foo instance of Objecet`的结果也为true**，为`Foo.prototype.__proto__ === Object.prototype`为`true`。

> 但我们不能轻易的说：`foo` 一定是 由`Object`创建的实例`。这句话是错误的。我们来看下一个问题就明白了。

#### 3.4 分析一个问题

**问题：**已知A继承了B，B继承了C。怎么判断 a 是由A**直接生成**的实例，还是B直接生成的实例呢？还是C直接生成的实例呢？

> 分析：这就要用到原型的`constructor`属性了。

- `foo.__proto__.constructor === M`的结果为`true`，但是 `foo.__proto__.constructor === Object`的结果为`false`。
- 所以，用 `consturctor`判断就比用 `instanceof`判断，更为严谨。


### 4 new 运算符

> 当`new Foo()`时发生了什么：

- 创建一个**新的空对象实例**。
- 将此空对象的隐式原型指向其构造函数的显示原型。
- 执行构造函数（传入相应的参数，如果没有参数就不用传），同时 `this` 指向这个新实例。
- 如果返回值是一个新对象，那么直接返回该对象；如果无返回值或者返回一个非对象值，那么就将步骤（1）创建的对象返回。

## 跨域通信类

### 1 前言

从本章起，对代码的要求没之前那么高了，但是，要求你对知识面的掌握要足够宽。

**前端通信类的问题，主要包括以下内容**：

1. 什么是**同源策略**及限制

> 同源策略是一个概念，就一句话。有什么限制，就三句话。能说出来即可。

2. **前后端如何通信**

> 如果你不准备，估计也就只能说出`ajax`。这个可以考察出知识面。

3. 如何创建**Ajax**

> `Ajax`在前后端通信中经常用到。做业务时，可以借助第三方的库，比如`vue`框架里的库、`jQuery`也有封装好的方法。但如果让你用原生的`js`去实现，该怎么做？

这就是考察你的动手能力，以及框架原理的掌握。如果能写出来，可以体现出你的基本功。是加分项。

4. **跨域通信**的几种方式

> 这部分非常重要。无非就是问你：什么是跨域、跨域有什么限制、**跨域有几种方式**。

下面分别讲解。


### 2 同源策略的概念和具体限制

> **同源策略**：限制从一个源加载的文档或脚本如何与来自另一个源的资源进行交互。这是一个用于隔离潜在恶意文件的关键的安全机制。（来自MDN官方的解释）

**具体解释：**

1. `源`包括三个部分：协议、域名、端口（`http`协议的默认端口是`80`）。如果有任何一个部分不同，则`源`不同，那就是跨域了。
2. `限制`：这个源的文档没有权利去操作另一个源的文档。这个限制体现在：（要记住）

- `Cookie`、`LocalStorage`和`IndexDB`无法获取。
- 无法获取和操作`DOM`。
- 不能发送`Ajax`请求。我们要注意，`Ajax`只适合**同源**的通信。

### 3 前后端如何通信

**主要有以下几种方式：**

- `Ajax`：不支持跨域。
- `WebSocket`：不受同源策略的限制，支持跨域
- `CORS`：不受同源策略的限制，支持跨域。一种新的通信协议标准。可以理解成是：**同时支持同源和跨域的Ajax**。

### 4 如何创建Ajax

> 在回答 `Ajax` 的问题时，要回答以下几个方面：

1. `XMLHttpRequest` 的工作原理
2. 兼容性处理

> `XMLHttpRequest`只有在高级浏览器中才支持。在回答问题时，这个兼容性问题不要忽略。

3. 事件的触发条件
4. 事件的触发顺序

> `XMLHttpRequest`有很多触发事件，每个事件是怎么触发的。

#### 4.1 发送 Ajax 请求的五个步骤（XMLHttpRequest的工作原理）

1. 创建`XMLHttpRequest` 对象。
2. 使用`open`方法设置请求的参数。`open(method, url, 是否异步)``。
3. 发送请求。
4. 注册事件。 注册`onreadystatechange`事件，状态改变时就会调用。

> 如果要在数据完整请求回来的时候才调用，我们需要手动写一些判断的逻辑。

5. 获取返回的数据，更新UI。

#### 4.2 发送 get 请求和 post 请求

> `get`请求举例：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
<h1>Ajax 发送 get 请求</h1>
<input type="button" value="发送get_ajax请求" id='btnAjax'>

<script type="text/javascript">
    // 绑定点击事件
    document.querySelector('#btnAjax').onclick = function () {
        // 发送ajax 请求 需要 五步

        // （1）创建异步对象
        var ajaxObj = new XMLHttpRequest();

        // （2）设置请求的参数。包括：请求的方法、请求的url。
        ajaxObj.open('get', '02-ajax.php');

        // （3）发送请求
        ajaxObj.send();

        //（4）注册事件。 onreadystatechange事件，状态改变时就会调用。
        //如果要在数据完整请求回来的时候才调用，我们需要手动写一些判断的逻辑。
        ajaxObj.onreadystatechange = function () {
            // 为了保证 数据 完整返回，我们一般会判断 两个值
            if (ajaxObj.readyState == 4 && ajaxObj.status == 200) {
                // 如果能够进到这个判断 说明 数据 完美的回来了,并且请求的页面是存在的
                // 5.在注册的事件中 获取 返回的 内容 并修改页面的显示
                console.log('数据返回成功');

                // 数据是保存在 异步对象的 属性中
                console.log(ajaxObj.responseText);

                // 修改页面的显示
                document.querySelector('h1').innerHTML = ajaxObj.responseText;
            }
        }
    }
</script>
</body>
</html>
```

> `post` 请求举例：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
<h1>Ajax 发送 get 请求</h1>
<input type="button" value="发送put_ajax请求" id='btnAjax'>
<script type="text/javascript">

    // 异步对象
    var xhr = new XMLHttpRequest();

    // 设置属性
    xhr.open('post', '02.post.php');

    // 如果想要使用post提交数据,必须添加此行
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    // 将数据通过send方法传递
    xhr.send('name=fox&age=18');

    // 发送并接受返回值
    xhr.onreadystatechange = function () {
        // 这步为判断服务器是否正确响应
        if (xhr.readyState == 4 && xhr.status == 200) {
            alert(xhr.responseText);
        }
    };
</script>
</body>
</html>
```

#### 4.3 onreadystatechange 事件

> 注册 `onreadystatechange` 事件后，每当 `readyState` 属性改变时，就会调用 `onreadystatechange` 函数。

> `readyState`：（存有 `XMLHttpRequest` 的状态。从 `0` 到 `4` 发生变化）

- `0`: 请求未初始化
- `1`: 服务器连接已建立
- `2`: 请求已接收
- `3`: 请求处理中
- `4`: 请求已完成，且响应已就绪

#### 4.4 事件的触发条件

![](http://img.smyhvae.com/20180307_1443.png)

#### 4.5 事件的触发顺序

![](http://img.smyhvae.com/20180307_1445.png)


#### 4.6 实际开发中用的 原生Ajax请求

```javascript

    var util = {};

    //获取 ajax 请求之后的json
    util.json = function (options) {

        var opt = {
            url: '',
            type: 'get',
            data: {},
            success: function () {
            },
            error: function () {
            },

        };
        util.extend(opt, options);
        if (opt.url) {
            //IE兼容性处理：浏览器特征检查。检查该浏览器是否存在XMLHttpRequest这个api，没有的话，就用IE的api
            var xhr = XMLHttpRequest ? new XMLHttpRequest() : new window.ActiveXObject('Microsoft.XMLHTTP');

            var data = opt.data,
                url = opt.url,
                type = opt.type.toUpperCase();
            dataArr = [];
        }

        for (var key in data) {
            dataArr.push(key + '=' + data[key]);
        }

        if (type === 'GET') {
            url = url + '?' + dataArr.join('&');
            xhr.open(type, url.replace(/\?$/g, ''), true);
            xhr.send();
        }

        if (type === 'POST') {
            xhr.open(type, url, true);
            // 如果想要使用post提交数据,必须添加此行
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.send(dataArr.join('&'));
        }

        xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 304) { //304表示：用缓存即可。206表示获取媒体资源的前面一部分
                var res;
                if (opt.success && opt.success instanceof Function) {
                    res = xhr.responseText;
                    if (typeof res === 'string') {
                        res = JSON.parse(res);  //将字符串转成json
                        opt.success.call(xhr, res);
                    }
                }
            } else {
                if (opt.error && opt.error instanceof Function) {
                    opt.error.call(xhr, res);
                }
            }
        };
    }


```


### 5 跨域通信的几种方式

> 方式如下：

1. `JSONP`
2. `WebSocket`
3. `CORS`
4. `Hash`
5. `postMessage`

> 上面这五种方式，在面试时，都要说出来。

#### 5.1 JSONP

> 面试会问：`JSONP`的原理是什么？怎么实现的？

- 在`CORS`和`postMessage`以前，我们一直都是通过`JSONP`来做跨域通信的。

> **JSONP的原理**：通过`<script>`标签的异步加载来实现的。比如说，实际开发中，我们发现，`head`标签里，可以通过`<script>`标签的`src`，里面放`url`，加载很多在线的插件。这就是用到了`JSONP`。

**JSONP的实现：**

> 比如说，客户端这样写：

```html
    <script src="http://www.smyhvae.com/?data=name&callback=myjsonp"></script>
```

> 上面的`src`中，`data=name`是get请求的参数，`myjsonp`是和后台约定好的函数名。
服务器端这样写：

```js
  myjsonp({
      data: {}

  })
```


> 于是，本地要求创建一个`myjsonp` 的**全局函数**，才能将返回的数据执行出来。

**实际开发中，前端的JSONP是这样实现的：**

```html
<script>

    var util = {};

    //定义方法：动态创建 script 标签
    /**
     * [function 在页面中注入js脚本]
     * @param  {[type]} url     [description]
     * @param  {[type]} charset [description]
     * @return {[type]}         [description]
     */
    util.createScript = function (url, charset) {
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        charset && script.setAttribute('charset', charset);
        script.setAttribute('src', url);
        script.async = true;
        return script;
    };


    /**
     * [function 处理jsonp]
     * @param  {[type]} url      [description]
     * @param  {[type]} onsucess [description]
     * @param  {[type]} onerror  [description]
     * @param  {[type]} charset  [description]
     * @return {[type]}          [description]
     */
    util.jsonp = function (url, onsuccess, onerror, charset) {
        var callbackName = util.getName('tt_player'); //事先约定好的 函数名
        window[callbackName] = function () {      //根据回调名称注册一个全局的函数
            if (onsuccess && util.isFunction(onsuccess)) {
                onsuccess(arguments[0]);
            }
        };
        var script = util.createScript(url + '&callback=' + callbackName, charset);   //动态创建一个script标签
        script.onload = script.onreadystatechange = function () {   //监听加载成功的事件，获取数据
            if (!script.readyState || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = null;
                // 移除该script的 DOM 对象
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                // 删除函数或变量
                window[callbackName] = null;  //最后不要忘了删除
            }
        };
        script.onerror = function () {
            if (onerror && util.isFunction(onerror)) {
                onerror();
            }
        };
        document.getElementsByTagName('head')[0].appendChild(script); //往html中增加这个标签，目的是把请求发送出去
    };

</script>

```

#### 5.2 WebSocket

> `WebSocket`的用法如下：

```javascript
    //

    var ws = new WebSocket('wss://echo.websocket.org'); //创建WebSocket的对象。参数可以是 ws 或 wss，后者表示加密。

    //把请求发出去
    ws.onopen = function (evt) {
        console.log('Connection open ...');
        ws.send('Hello WebSockets!');
    };


    //对方发消息过来时，我接收
    ws.onmessage = function (evt) {
        console.log('Received Message: ', evt.data);
        ws.close();
    };

    //关闭连接
    ws.onclose = function (evt) {
        console.log('Connection closed.');
    };
```

> 面试一般不会让你写这个代码，一般是考察你是否了解 `WebSocket`概念，知道有这么回事即可。

#### 5.3 CORS

> `CORS` 可以理解成是**既可以同步、也可以异步**的Ajax。

- fetch` 是一个比较新的`API`，用来实现`CORS`通信。用法如下：

```javascript
      // url（必选），options（可选）
      fetch('/some/url/', {
          method: 'get',
      }).then(function (response) {  //类似于 ES6中的promise

      }).catch(function (err) {
        // 出错了，等价于 then 的第二个参数，但这样更好用更直观
      });
```

> 另外，如果面试官问：“CORS为什么支持跨域的通信？”

> 答案：跨域时，浏览器会拦截`Ajax`请求，并在`http`头中加`Origin`。

#### 5.4 Hash

- `url`的`#`后面的内容就叫`Hash`。**Hash的改变，页面不会刷新**。这就是用 `Hash` 做跨域通信的基本原理。

> 补充：`url`的`?`后面的内容叫`Search`。`Search`的改变，会导致页面刷新，因此不能做跨域通信。

**使用举例：**

**场景**：我的页面 `A` 通过`iframe`或`frame`嵌入了跨域的页面 `B`。

> 现在，我这个`A`页面想给`B`页面发消息，怎么操作呢？

1. 首先，在我的`A`页面中：

```javascript
    //伪代码
    var B = document.getElementsByTagName('iframe');
    B.src = B.src + '#' + 'jsonString';  //我们可以把JS 对象，通过 JSON.stringify()方法转成 json字符串，发给 B
```

2. 然后，在`B`页面中：

```javascript
    // B中的伪代码
    window.onhashchange = function () {  //通过onhashchange方法监听，url中的 hash 是否发生变化
        var data = window.location.hash;
    };
```

#### 5.5 postMessage()方法

> `H5`中新增的`postMessage()``方法，可以用来做跨域通信。既然是H5中新增的，那就一定要提到。

**场景**：窗口 A (`http://A.com`)向跨域的窗口 B (`http://B.com`)发送信息。步骤如下

1. 在`A`窗口中操作如下：向`B`窗口发送数据：


```javascript
	// 窗口A(http:A.com)向跨域的窗口B(http:B.com)发送信息
 	Bwindow.postMessage('data', 'http://B.com'); //这里强调的是B窗口里的window对象
```

2. 在`B`窗口中操作如下：

```javascript
    // 在窗口B中监听 message 事件
    Awindow.addEventListener('message', function (event) {   //这里强调的是A窗口里的window对象
        console.log(event.origin);  //获取 ：url。这里指：http://A.com
        console.log(event.source);  //获取：A window对象
        console.log(event.data);    //获取传过来的数据
    }, false);
```

## 面向对象：类的定义和继承的几种方式
### 1 前言


> 类与实例：

- 类的声明
- 生成实例

**类与继承：**

- 如何实现继承：继承的本质就是原型链
- 继承的几种方式

### 2 类的定义、实例化

#### 2.1 类的定义/类的声明

**方式一**：用构造函数模拟类（传统写法）

```javascript
    function Animal1() {
        this.name = 'smyhvae'; //通过this，表明这是一个构造函数
    }
```

**方式二**：用 class 声明（`ES6`的写法）

```javascript
    class Animal2 {
        constructor() {  //可以在构造函数里写属性
            this.name = name;
        }
    }
```

控制台的效果：

![](http://img.smyhvae.com/20180307_0957.png)

#### 2.2 实例化

类的实例化很简单，直接 `new` 出来即可。

```javascript
    console.log(new Animal1(),new Animal2()); //实例化。如果括号里没有参数，则括号可以省略
```

![](http://img.smyhvae.com/20180307_1000.png)

### 3 继承的几种方式

> 继承的本质就是原型链。

**继承的方式有几种？每种形式的优缺点是**？这些问题必问的。其实就是考察你对原型链的掌握程度。

#### 3.1 方式一：借助构造函数


```javascript
    function Parent1() {
        this.name = 'parent1 的属性';
    }

    function Child1() {
        Parent1.call(this);         //【重要】此处用 call 或 apply 都行：改变 this 的指向
        this.type = 'child1 的属性';
    }

    console.log(new Child1);
```

>【重要】上方代码中，最重要的那行代码：在子类的构造函数里写了`Parent1.call(this);`，意思是：**让Parent的构造函数在child的构造函数中执行**。发生的变化是：**改变this的指向**，parent的实例 --> 改为指向child的实例。导致 parent的实例的属性挂在到了child的实例上，这就实现了继承。

打印结果：

![](http://img.smyhvae.com/20180307_1015.png)

> 上方结果表明：`child`先有了 `parent` 实例的属性（继承得以实现），再有了`child` 实例的属性。

**分析**：

> 这种方式，虽然改变了 `this` 的指向，但是，**Child1 无法继承 `Parent1` 的原型**。也就是说，如果我给 `Parent1` 的原型增加一个方法：

```javascript
    Parent1.prototype.say = function () {
    };
```

> 上面这个方法是无法被 `Child1` 继承的。如下：

![](http://img.smyhvae.com/20180307_1030.png)

#### 3.2 方法二：通过原型链实现继承

```javascript
    /*
    通过原型链实现继承
     */
    function Parent() {
        this.name = 'Parent 的属性';
    }

    function Child() {
        this.type = 'Child 的属性';
    }

    Child.prototype = new Parent(); //【重要】

    console.log(new Child());
```

打印结果：

![](http://img.smyhvae.com/20180307_1109.png)


> 【重要】上方代码中，最重要的那行：每个函数都有`prototype`属性，于是，构造函数也有这个属性，这个属性是一个对象。现在，**我们把`Parent`的实例赋值给了`Child`的`prototye`**，从而实现**继承**。此时，`Child`构造函数、`Parent`的实例、`Child`的实例构成一个三角关系。于是：

- `new Child.__proto__ === new Parent()`的结果为`true`

**分析：**

- 这种继承方式，**Child 可以继承 Parent 的原型**，但有个缺点：

> 缺点是：**如果修改 child1实例的name属性，child2实例中的name属性也会跟着改变**。

如下：

![](http://img.smyhvae.com/20180307_1123.png)

> 上面的代码中， `child1`修改了`arr`属性，却发现，`child2`的`arr`属性也跟着改变了。这显然不太好，在业务中，两个子模块应该隔离才对。如果改了一个对象，另一个对象却发生了改变，就不太好。

> 造成这种缺点的原因是：`child1`和`child2`共用原型。即：`chi1d1.__proto__ === child2__proto__`是严格相同。而 arr方法是在 Parent 的实例上（即 Child实例的原型）的。


#### 3.3 方式三：组合的方式：构造函数 + 原型链

就是把上面的两种方式组合起来：


```javascript
    /*
    组合方式实现继承：构造函数、原型链
     */
    function Parent3() {
        this.name = 'Parent 的属性';
        this.arr = [1, 2, 3];
    }

    function Child3() {
        Parent3.call(this); //【重要1】执行 parent方法
        this.type = 'Child 的属性';
    }
    Child3.prototype = new Parent3(); //【重要2】第二次执行parent方法

    var child = new Child3();
```

- 这种方式，能解决之前两种方式的问题：既可以继承父类原型的内容，也不会造成原型里属性的修改。
- 这种方式的缺点是：让父亲`Parent`的构造方法执行了两次。
- `ES6`中的继承方式，一带而过即可，重点是要掌握`ES5`中的继承。

## 前端错误监控

### 1 前言

> 错误监控包含的内容是：

- 前端错误的分类
- 每种错误的捕获方式
- 上报错误的基本原理

> 面试时，可能有两种问法：

- 如何监测 `js` 错误？（开门见山的方式）
- 如何保证**产品质量**？（其实问的也是错误监控）


### 2 前端错误的分类

包括两种：

- 即时运行错误（代码错误）
- 资源加载错误


### 3 每种错误的捕获方式


#### 3.1 即时运行错误的捕获方式

**方式1**：`try ... catch`。

> 这种方式要部署在代码中。

**方式2：**`window.onerror`函数。这个函数是全局的。

```js
	window.onerror = function(msg, url, row, col, error) { ... }
```

> 参数解释：

- `msg`为异常基本信息
- `source`为发生异常`Javascript`文件的`url`
- `row`为发生错误的行号

> 方式二中的`window.onerror`是属于DOM0的写法，我们也可以用DOM2的写法：`window.addEventListener("error", fn);`也可以。

**问题延伸1：**

`window.onerror`默认无法捕获**跨域**的`js`运行错误。捕获出来的信息如下：（基本属于无效信息）

> 比如说，我们的代码想引入`B`网站的`b.js`文件，怎么捕获它的异常呢？

**解决办法**：在方法二的基础之上，做如下操作：

1. 在`b.js`文件里，加入如下 `response` `header`，表示允许跨域：（或者世界给静态资源`b.js`加这个 response header）

```js
	Access-Control-Allow-Origin: *
```

2. 引入第三方的文件`b.js`时，在`<script>`标签中增加`crossorigin`属性；



**问题延伸2：**

> 只靠方式二中的`window.onerror`是不够的，因为我们无法获取文件名是什么，不知道哪里出了错误。解决办法：把**堆栈**信息作为msg打印出来，堆栈里很详细。



#### 3.2 资源加载错误的捕获方式

> 上面的`window.onerror`只能捕获即时运行错误，无法捕获资源加载错误。原理是：资源加载错误，并不会向上冒泡，`object.onerror`捕获后就会终止（不会冒泡给`window`），所以`window.onerror`并不能捕获资源加载错误。

- **方式1**：`object.onerror`。`img`标签、`script`标签等节点都可以添加`onerror`事件，用来捕获资源加载的错误。
- **方式2**：performance.getEntries。可以获取所有已加载资源的加载时长，通过这种方式，可以间接的拿到没有加载的资源错误。

举例：

> 浏览器打开一个网站，在`Console`控制台下，输入：

```js
	performance.getEntries().forEach(function(item){console.log(item.name)})
```

或者输入：

```js
	performance.getEntries().forEach(item=>{console.log(item.name)})
```


> 上面这个`api`，返回的是数组，既然是数组，就可以用`forEach`遍历。打印出来的资源就是**已经成功加载**的资源。；

![](http://img.smyhvae.com/20180311_2030.png)

> 再入`document.getElementsByTagName('img')`，就会显示出所有**需要加载**的的img集合。

> 于是，`document.getElementsByTagName('img')`获取的资源数组减去通过`performance.getEntries()`获取的资源数组，剩下的就是没有成功加载的，这种方式可以间接捕获到资源加载错误。

这种方式非常有用，一定要记住。


**方式3；**Error事件捕获。

> 源加载错误，虽然会阻止冒泡，但是不会阻止捕获。我们可以在捕获阶段绑定error事件。例如：

![](http://img.smyhvae.com/20180311_2040.png)



> **总结：**如果我们能回答出后面的两种方式，面试官对我们的印象会大大增加。既可以体现出我们对错误监控的了解，还可以体现出我们对事件模型的掌握。


### 4 错误上报的两种方式

- **方式一**：采用Ajax通信的方式上报（此方式虽然可以上报错误，但是我们并不采用这种方式）
- **方式二：**利用Image对象上报（推荐。网站的监控体系都是采用的这种方式）

> 方式二的实现方式如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>

<script>
	//通过Image对象进行错误上报
    (new Image()).src = 'http://smyhvae.com/myPath?badjs=msg';   // myPath表示上报的路径（我要上报到哪里去）。后面的内容是自己加的参数。
</script>
</body>
</html>

```


> 打开浏览器，效果如下：

![](http://img.smyhvae.com/20180311_2055.png)

上图中，红色那一栏表明，我的请求已经发出去了。点进去看看：

![](http://img.smyhvae.com/20180311_2057.png)

> 这种方式，不需要借助第三方的库，一行代码即可搞定。

## 页面布局

> 问题：假设高度默认`100px` ，请写出三栏布局，其中左栏、右栏各为`300px`，中间自适应。

![](http://img.smyhvae.com/20180305_1520.png)

分析：

初学者想到的答案有两种：

- 方法1：浮动
- 方法2：绝对定位

> 但要求你能至少写出三四种方法，才算及格。剩下的方法如下：

- 方法3：`flexbox`。移动开发里经常用到。
- 方法4：表格布局` table`。虽然已经淘汰了，但也应该了解。
- 方法5：网格布局 `grid`


**方法1、浮动：**

> 左侧设置左浮动，右侧设置右浮动即可，中间会自动地自适应。


**方法2、绝对定位：**

> 左侧设置为绝对定位， ` left：0px`。右侧设置为绝对定位， `right：0px`。中间设置为绝对定位，`left `和`right` 都为`300px`，即可。中间的宽度会自适应。


> 使用`article`标签作为容器，包裹左、中、右三个部分。


> 方法1 和方法2 的代码如下：

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        html * {
            padding: 0px;
            margin: 0px;
        }

        .layout {
            margin-bottom: 150px;
        }


        .layout article div { /*注意，这里是设置每个小块儿的高度为100px，而不是设置大容器的高度。大容器的高度要符合响应式*/
            height: 100px;
        }

        /* 方法一 start */

        .layout.float .left {
            float: left;
            width: 300px;
            background: red;
        }

        .layout.float .right {
            float: right;
            width: 300px;
            background: blue;
        }

        .layout.float .center {
            background: green;

        }

        /* 方法一 end */


        /* 方法二 start */
        .layout.absolute .left-center-right {
            position: relative;
        }

        .layout.absolute .left {
            position: absolute;
            left: 0;
            width: 300px;
            background: red;
        }

        /* 【重要】中间的区域，左侧定位300px，右侧定位为300px，即可完成。宽度会自使用 */
        .layout.absolute .center {
            position: absolute;
            left: 300px;
            right: 300px;
            background: green;
        }

        .layout.absolute .right {
            position: absolute;
            right: 0;
            width: 300px;
            background: blue;
        }


        /* 方法二 end */
    </style>
</head>

<body>

    <!-- 方法一：浮动 start -->
    <!-- 输入 section.layout.float，即可生成  -->
    <section class="layout float">
        <!-- 用  article 标签包裹左、中、右三个部分 -->
        <article class="left-right-center">
            <!-- 输入 div.left+div.right+div.center，即可生成 -->
            <div class="left">
                我是 left
            </div>
            <div class="right">
                我是 right
            </div>
            <div class="center">
                浮动解决方案
                我是 center
            </div>

        </article>

    </section>
    <!-- 方法一：浮动 end -->

    <section class="layout absolute">
        <article class="left-center-right">
            <div class="left">
                我是 left
            </div>
            <div class="right">
                我是 right
            </div>
            <div class="center">
                <h1>绝对定位解决方案</h1>
                我是 center
            </div>
        </article>
    </section>
</body>
</html>

```

效果如下：

![](http://img.smyhvae.com/20180305_1640.gif)


**方法3、flexbox布局**

> 将左中右所在的容器设置为`display: flex`，设置两侧的宽度后，然后让中间的`flex = 1`，即可。


```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        html * {
            padding: 0;
            margin: 0;
        }

        .layout article div {
            height: 100px;
        }

        .left-center-right {
            display: flex;
        }

        .layout.flex .left {
            width: 300px;
            background: red;
        }

        .layout.flex .center {
            flex: 1;
            background: green;
        }

        .layout.flex .right {
            width: 300px;
            background: blue;
        }
    </style>

</head>

<body>
    <section class="layout flex">
        <article class="left-center-right-">
            <div class="left">
                我是 left
            </div>
            <div class="center">
                <h1>flex布局解决方案</h1>
                我是 center
            </div>
            <div class="right">
                我是 right
            </div>

        </article>
    </section>

</body>

</html>


```


效果如下：

![](http://img.smyhvae.com/20180305_1700.gif)




**方法4、表格布局 table**

> 设置整个容器的宽度为`100%`，设置三个部分均为表格，然后左边的单元格为 `300px`，右边的单元格为 `300px`，即可。中间的单元格会自适应。

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        html * {
            padding: 0;
            margin: 0;
        }

        .layout.table div {
            height: 100px;
        }

        /* 重要：设置容器为表格布局，宽度为100% */
        .layout.table .left-center-right {
            width: 100%;
            display: table;
            height: 100px;

        }

        .layout.table .left-center-right div {
            display: table-cell; /* 重要：设置三个模块为表格里的单元*/
        }

        .layout.table .left {
            width: 300px;
            background: red;
        }

        .layout.table .center {
            background: green;
        }

        .layout.table .right {
            width: 300px;
            background: blue;
        }
    </style>

</head>

<body>
    <section class="layout table">
        <article class="left-center-right">
            <div class="left">
                我是 left
            </div>
            <div class="center">
                <h1>表格布局解决方案</h1>
                我是 center
            </div>
            <div class="right">
                我是 right
            </div>

        </article>
    </section>

</body>

</html>

```

![](http://img.smyhvae.com/20180305_1855.gif)

**方法5、网格布局 grid**

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        html * {
            padding: 0;
            margin: 0;
        }

        /* 重要：设置容器为网格布局，宽度为100% */
        .layout.grid .left-center-right {
            display: grid;
            width: 100%;
            grid-template-rows: 100px;
            grid-template-columns: 300px auto 300px;  /* 重要：设置网格为三列，并设置每列的宽度。即可。*/

        }

        .layout.grid .left {
            background: red;
        }

        .layout.grid .center {
            background: green;
        }

        .layout.grid .right {
            background: blue;
        }
    </style>

</head>

<body>
    <section class="layout grid">
        <article class="left-center-right">
            <div class="left">
                我是 left
            </div>
            <div class="center">
                <h1>网格布局解决方案</h1>
                我是 center
            </div>
            <div class="right">
                我是 right
            </div>

        </article>
    </section>

</body>

</html>
```


效果：

![](http://img.smyhvae.com/20180305_1920.gif)


**延伸：五种方法的对比**

> 五种方法的优缺点

- 考虑中间模块的高度问题
- 兼容性问题：实际开发中，哪个最实用？

方法1：浮动：

- 优点：兼容性好。
- 缺点：浮动会脱离标准文档流，因此要清除浮动。我们解决好这个问题即可。

方法:2：绝对定位

- 优点：快捷。
- 缺点：导致子元素也脱离了标准文档流，可实用性差。

方法3：flex 布局（CSS3中出现的）

- 优点：解决上面两个方法的不足，flex布局比较完美。移动端基本用 flex布局。

方法4：表格布局

- 优点：表格布局在很多场景中很实用，兼容性非常好。因为IE8不支持 flex，此时可以尝试表格布局
- 缺点：因为三个部分都当成了**单元格**来对待，此时，如果中间的部分变高了，其会部分也会被迫调整高度。但是，在很多场景下，我们并不需要两侧的高度增高。

> 什么时候用 `flex `布局 or 表格布局，看具体的场景。二者没有绝对的优势，也没有绝对的不足。


方法5：网格布局

- CSS3中引入的布局，很好用。代码量简化了很多。

> PS：面试提到网格布局，说明我们对新技术是有追求的。


**延伸：如果题目中去掉高度已知**

> 问题：题目中，如果去掉高度已知，我们往中间的模块里塞很多内容，让中间的模块撑开。会发生什么变化？哪个布局就不能用了？


分析：其实可以这样理解，我们回去看上面的动画效果，当中间的模块变得很挤时，会发生什么效果？就是我们想要的答案。

> 答案是：**flex 布局和表格布局可以通用**，其他三个布局都不能用了。



**总结**

> 涉及到的知识点：

- 语义化掌握到位：每个区域用`section`、`article`代表容器、`div`代表块儿。如果通篇都用 div，那就是语义化没掌握好。
- 页面布局理解深刻。
- `CSS`基础知识扎实。
- 思维灵活且积极上进。题目中可以通过`网格布局`来体现。
- 代码书写规范。注意命名。上面的代码中，没有一行代码是多的。

## 题目：谈一谈你对CSS盒模型的认识

> 专业的面试，一定会问 `CSS` 盒模型。对于这个题目，我们要回答一下几个方面：

1. 基本概念：`content`、`padding`、`margin`
2. 标准盒模型、`IE`盒模型的区别。不要漏说了`IE`盒模型，通过这个问题，可以筛选一部分人
3. `CSS`如何设置这两种模型（即：如何设置某个盒子为其中一个模型）？如果回答了上面的第二条，还会继续追问这一条。
4. `JS`如何设置、获取盒模型对应的宽和高？这一步，已经有很多人答不上来了。
5. 实例题：根据盒模型解释**边距重叠**。

> 前四个方面是逐渐递增，第五个方面，却鲜有人知。

6. `BFC`（边距重叠解决方案）或`IFC`。

> 如果能回答第五条，就会引出第六条。`BFC`是面试频率较高的。

**总结**：以上几点，从上到下，知识点逐渐递增，知识面从理论、`CSS`、`JS`，又回到`CSS`理论

接下来，我们把上面的六条，依次讲解。


**标准盒模型和IE盒子模型**


标准盒子模型：

![](http://img.smyhvae.com/2015-10-03-css-27.jpg)

`IE`盒子模型：

![](http://img.smyhvae.com/2015-10-03-css-30.jpg)

上图显示：


> 在 `CSS` 盒子模型 (`Box Model`) 规定了元素处理元素的几种方式：

- `width`和`height`：**内容**的宽度、高度（不是盒子的宽度、高度）。
- `padding`：内边距。
- `border`：边框。
- `margin`：外边距。

> `CSS`盒模型和`IE`盒模型的区别：

 - 在**标准盒子模型**中，**width 和 height 指的是内容区域**的宽度和高度。增加内边距、边框和外边距不会影响内容区域的尺寸，但是会增加元素框的总尺寸。

 - **IE盒子模型**中，**width 和 height 指的是内容区域+border+padding**的宽度和高度。


**CSS如何设置这两种模型**

代码如下：

```javascript
/* 设置当前盒子为 标准盒模型（默认） */
box-sizing: content-box;

/* 设置当前盒子为 IE盒模型 */
box-sizing: border-box;
```


> 备注：盒子默认为标准盒模型。


**JS如何设置、获取盒模型对应的宽和高**


> 方式一：通过`DOM`节点的 `style` 样式获取


```js
element.style.width/height;
```

> 缺点：通过这种方式，只能获取**行内样式**，不能获取`内嵌`的样式和`外链`的样式。

这种方式有局限性，但应该了解。



> 方式二（通用型）


```js
window.getComputedStyle(element).width/height;
```


> 方式二能兼容 `Chrome`、火狐。是通用型方式。


> 方式三（IE独有的）


```javascript
	element.currentStyle.width/height;
```

> 和方式二相同，但这种方式只有IE独有。获取到的即时运行完之后的宽高（三种css样式都可以获取）。


> 方式四


```javascript
	element.getBoundingClientRect().width/height;
```

> 此 `api` 的作用是：获取一个元素的绝对位置。绝对位置是视窗 `viewport` 左上角的绝对位置。此 `api` 可以拿到四个属性：`left`、`top`、`width`、`height`。

**总结：**

> 上面的四种方式，要求能说出来区别，以及哪个的通用型更强。


**margin塌陷/margin重叠**


**标准文档流中，竖直方向的margin不叠加，只取较大的值作为margin**(水平方向的`margin`是可以叠加的，即水平方向没有塌陷现象)。

> PS：如果不在标准流，比如盒子都浮动了，那么两个盒子之间是没有`margin`重叠的现象的。


> 我们来看几个例子。

**兄弟元素之间**

如下图所示：

![](http://img.smyhvae.com/20170805_0904.png)


**子元素和父元素之间**


```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>

        * {
            margin: 0;
            padding: 0;
        }

        .father {
            background: green;

        }

        /* 给儿子设置margin-top为10像素 */
        .son {
            height: 100px;
            margin-top: 10px;
            background: red;
        }

    </style>
</head>
<body>
<div class="father">
    <div class="son"></div>
</div>
</body>
</html>

```

> 上面的代码中，儿子的`height`是 `100p`x，`magin-top` 是`10px`。注意，此时父亲的 `height` 是`100`，而不是`110`。因为儿子和父亲在竖直方向上，共一个`margin`。

儿子这个盒子：

![](http://img.smyhvae.com/20180305_2216.png)

父亲这个盒子：

![](http://img.smyhvae.com/20180305_2217.png)


> 上方代码中，如果我们给父亲设置一个属性：`overflow: hidden`，就可以避免这个问题，此时父亲的高度是110px，这个用到的就是BFC（下一段讲解）。


**善于使用父亲的padding，而不是儿子的margin**

> 其实，这一小段讲的内容与上一小段相同，都是讲父子之间的margin重叠。

我们来看一个奇怪的现象。现在有下面这样一个结构：（`div`中放一个`p`）

```html
	<div>
		<p></p>
	</div>
```

> 上面的结构中，我们尝试通过给儿子`p`一个`margin-top:50px;`的属性，让其与父亲保持50px的上边距。结果却看到了下面的奇怪的现象：

![](http://img.smyhvae.com/20170806_1537.png)


> 此时我们给父亲`div`加一个`border`属性，就正常了：

![](http://img.smyhvae.com/20170806_1544.png)


> 如果父亲没有`border`，那么儿子的`margin`实际上踹的是“流”，踹的是这“行”。所以，父亲整体也掉下来了。

**margin这个属性，本质上描述的是兄弟和兄弟之间的距离； 最好不要用这个marign表达父子之间的距离。**

> 所以，如果要表达父子之间的距离，我们一定要善于使用父亲的padding，而不是儿子的`margin。


**BFC（边距重叠解决方案）**

> `BFC（Block Formatting Context）`：块级格式化上下文。你可以把它理解成一个独立的区域。

另外还有个概念叫`IFC`。不过，`BFC`问得更多。

**BFC 的原理/BFC的布局规则【非常重要】**

> `BFC` 的原理，其实也就是 `BFC` 的渲染规则（能说出以下四点就够了）。包括：

1. BFC **内部的**子元素，在垂直方向，**边距会发生重叠**。
2. BFC在页面中是独立的容器，外面的元素不会影响里面的元素，反之亦然。（稍后看`举例1`）
3. **BFC区域不与旁边的`float box`区域重叠**。（可以用来清除浮动带来的影响）。（稍后看`举例2`）
4. 计算`BFC`的高度时，浮动的子元素也参与计算。（稍后看`举例3`）

**如何生成BFC**

> 有以下几种方法：

- 方法1：`overflow`: 不为`visible`，可以让属性是 `hidden`、`auto`。【最常用】
- 方法2：浮动中：`float`的属性值不为`none`。意思是，只要设置了浮动，当前元素就创建了`BFC`。
- 方法3：定位中：只要`posiiton`的值不是 s`tatic`或者是`relative`即可，可以是`absolute`或`fixed`，也就生成了一个`BFC`。
- 方法4：`display`为`inline-block`, `table-cell`, `table-caption`, `flex`, `inline-flex`

**BFC 的应用**


**举例1：**解决 margin 重叠

> 当父元素和子元素发生 `margin` 重叠时，解决办法：**给子元素或父元素创建BFC**。

比如说，针对下面这样一个 `div` 结构：


```html
<div class="father">
    <p class="son">
    </p>
</div>
```

> 上面的`div`结构中，如果父元素和子元素发生`margin`重叠，我们可以给子元素创建一个 `BFC`，就解决了：


```html
<div class="father">
    <p class="son" style="overflow: hidden">
    </p>
</div>
```

> 因为**第二条：BFC区域是一个独立的区域，不会影响外面的元素**。


**举例2**：BFC区域不与float区域重叠：

针对下面这样一个div结构；

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>

        .father-layout {
            background: pink;
        }

        .father-layout .left {
            float: left;
            width: 100px;
            height: 100px;
            background: green;
        }

        .father-layout .right {
            height: 150px;  /*右侧标准流里的元素，比左侧浮动的元素要高*/
            background: red;
        }

    </style>
</head>
<body>

<section class="father-layout">
    <div class="left">
        左侧，生命壹号
    </div>
    <div class="right">
        右侧，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，
    </div>
</section>

</body>
</html>
```

效果如下：

![](http://img.smyhvae.com/20180306_0825.png)

> 上图中，由于右侧标准流里的元素，比左侧浮动的元素要高，导致右侧有一部分会跑到左边的下面去。

**如果要解决这个问题，可以将右侧的元素创建BFC**，因为**第三条：BFC区域不与`float box`区域重叠**。解决办法如下：（将right区域添加overflow属性）

```html
    <div class="right" style="overflow: hidden">
        右侧，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，smyhvae，
    </div>
```


![](http://img.smyhvae.com/20180306_0827.png)

上图表明，解决之后，`father-layout`的背景色显现出来了，说明问题解决了。


**举例3：**清除浮动

现在有下面这样的结构：


```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>

        .father {
            background: pink;
        }

        .son {
            float: left;
            background: green;
        }

    </style>
</head>
<body>

<section class="father">
    <div class="son">
        生命壹号
    </div>

</section>
</body>
</html>
```

效果如下：

![](http://img.smyhvae.com/20180306_0840.png)

上面的代码中，儿子浮动了，但由于父亲没有设置高度，导致看不到父亲的背景色（此时父亲的高度为0）。正所谓**有高度的盒子，才能关住浮动**。

> 如果想要清除浮动带来的影响，方法一是给父亲设置高度，然后采用隔墙法。方法二是 BFC：给父亲增加 `overflow=hidden`属性即可， 增加之后，效果如下：

![](http://img.smyhvae.com/20180306_0845.png)

> 为什么父元素成为BFC之后，就有了高度呢？这就回到了**第四条：计算BFC的高度时，浮动元素也参与计算**。意思是，**在计算BFC的高度时，子元素的float box也会参与计算**


## DOM事件的总结

**知识点主要包括以下几个方面：**

- 基本概念：`DOM`事件的级别

> 面试不会直接问你，DOM有几个级别。但会在题目中体现：“请用`DOM2` ....”。


- `DOM`事件模型、`DOM`事件流

> 面试官如果问你“**DOM事件模型**”，你不一定知道怎么回事。其实说的就是**捕获和冒泡**。

**DOM事件流**，指的是事件传递的**三个阶段**。

- 描述`DOM`事件捕获的具体流程

> 讲的是事件的传递顺序。参数为`false`（默认）、参数为`true`，各自代表事件在什么阶段触发。

能回答出来的人，寥寥无几。也许有些人可以说出一大半，但是一字不落的人，极少。

- `Event`对象的常见应用（`Event`的常用`api`方法）

> `DOM`事件的知识点，一方面包括事件的流程；另一方面就是：怎么去注册事件，也就是监听用户的交互行为。第三点：在响应时，`Event`对象是非常重要的。

**自定义事件（非常重要）**

> 一般人可以讲出事件和注册事件，但是如果让你讲**自定义事件**，能知道的人，就更少了。

**DOM事件的级别**

> `DOM`事件的级别，准确来说，是**DOM标准**定义的级别。包括：

**DOM0的写法：**

```javascript
  element.onclick = function () {

  }
```


> 上面的代码是在 `js` 中的写法；如果要在`html`中写，写法是：在`onclick`属性中，加 `js` 语句。


**DOM2的写法：**


```javascript
  element.addEventListener('click', function () {

  }, false);
```

>【重要】上面的第三参数中，**true**表示事件在**捕获阶段**触发，**false**表示事件在**冒泡阶段**触发（默认）。如果不写，则默认为false。


**DOM3的写法：**


```javascript
    element.addEventListener('keyup', function () {

    }, false);
```

> `DOM3`中，增加了很多事件类型，比如鼠标事件、键盘事件等。

> PS：为何事件没有`DOM1`的写法呢？因为，`DOM1`标准制定的时候，没有涉及与事件相关的内容。

**总结**：关于“DOM事件的级别”，能回答出以上内容即可，不会出题目让你做。

**DOM事件模型**

> `DOM`事件模型讲的就是**捕获和冒泡**，一般人都能回答出来。

- 捕获：从上往下。
- 冒泡：从下（目标元素）往上。

**DOM事件流**

> `DOM`事件流讲的就是：浏览器在于当前页面做交互时，这个事件是怎么传递到页面上的。

**完整的事件流，分三个阶段：**

1. 捕获：从 `window` 对象传到 目标元素。
2. 目标阶段：事件通过捕获，到达目标元素，这个阶段就是目标阶段。
3. 冒泡：从**目标元素**传到 `Window` 对象。

![](http://img.smyhvae.com/20180306_1058.png)

![](http://img.smyhvae.com/20180204_1218.jpg)


**描述DOM事件捕获的具体流程**

> 很少有人能说完整。

**捕获的流程**


![](http://img.smyhvae.com/20180306_1103.png)

**说明**：捕获阶段，事件依次传递的顺序是：`window` --> `document` --> `html`--> `body` --> 父元素、子元素、目标元素。

- PS1：第一个接收到事件的对象是 **window**（有人会说`body`，有人会说`html`，这都是错误的）。
- PS2：`JS`中涉及到`DOM`对象时，有两个对象最常用：`window`、`doucument`。它们俩也是最先获取到事件的。

代码如下：

```javascript
    window.addEventListener("click", function () {
        alert("捕获 window");
    }, true);

    document.addEventListener("click", function () {
        alert("捕获 document");
    }, true);

    document.documentElement.addEventListener("click", function () {
        alert("捕获 html");
    }, true);

    document.body.addEventListener("click", function () {
        alert("捕获 body");
    }, true);

    fatherBox.addEventListener("click", function () {
        alert("捕获 father");
    }, true);

    childBox.addEventListener("click", function () {
        alert("捕获 child");
    }, true);

```


**补充一个知识点：**

> 在 `js`中：

- 如果想获取 `body` 节点，方法是：`document.body`；
- 但是，如果想获取 `html`节点，方法是`document.documentElement`。


**冒泡的流程**

> 与捕获的流程相反


**Event对象的常见 api 方法**

> 用户做的是什么操作（比如，是敲键盘了，还是点击鼠标了），这些事件基本都是通过`Event`对象拿到的。这些都比较简单，我们就不讲了。我们来看看下面这几个方法：

**方法一**

```javascript
    event.preventDefault();
```

- 解释：阻止默认事件。
- 比如，已知`<a>`标签绑定了click事件，此时，如果给`<a>`设置了这个方法，就阻止了链接的默认跳转。

**方法二：阻止冒泡**

> 这个在业务中很常见。

> 有的时候，业务中不需要事件进行冒泡。比如说，业务这样要求：单击子元素做事件`A`，单击父元素做事件B，如果不阻止冒泡的话，出现的问题是：单击子元素时，子元素和父元素都会做事件`A`。这个时候，就要用到阻止冒泡了。


> `w3c`的方法：（火狐、谷歌、`IE11`）

```javascript
    event.stopPropagation();
```

> `IE10`以下则是：

```javascript
	event.cancelBubble = true;
```

> 兼容代码如下：

```javascript
   box3.onclick = function (event) {

        alert("child");

        //阻止冒泡
        event = event || window.event;

        if (event && event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    }
```

> 上方代码中，我们对`box3`进行了阻止冒泡，产生的效果是：事件不会继续传递到 `father`、`grandfather`、`body`了。


**方法三：设置事件优先级**


```javascript
    event.stopImmediatePropagation();
```

这个方法比较长，一般人没听说过。解释如下：

> 比如说，我用`addEventListener`给某按钮同时注册了事件`A`、事件`B`。此时，如果我单击按钮，就会依次执行事件A和事件`B`。现在要求：单击按钮时，只执行事件A，不执行事件`B`。该怎么做呢？这是时候，就可以用到`stopImmediatePropagation`方法了。做法是：在事件A的响应函数中加入这句话。

> 大家要记住 `event` 有这个方法。

**属性4、属性5（事件委托中用到）**


```javascript

    event.currentTarget   //当前所绑定的事件对象。在事件委托中，指的是【父元素】。

    event.target  //当前被点击的元素。在事件委托中，指的是【子元素】。

```

上面这两个属性，在事件委托中经常用到。


> **总结**：上面这几项，非常重要，但是容易弄混淆。


**自定义事件**

> 自定义事件的代码如下：


```javascript
    var myEvent = new Event('clickTest');
    element.addEventListener('clickTest', function () {
        console.log('smyhvae');
    });

	//元素注册事件
    element.dispatchEvent(myEvent); //注意，参数是写事件对象 myEvent，不是写 事件名 clickTest

```

> 上面这个事件是定义完了之后，就直接自动触发了。在正常的业务中，这个事件一般是和别的事件结合用的。比如延时器设置按钮的动作：

```javascript
    var myEvent = new Event('clickTest');

    element.addEventListener('clickTest', function () {
        console.log('smyhvae');
    });

    setTimeout(function () {
        element.dispatchEvent(myEvent); //注意，参数是写事件对象 myEvent，不是写 事件名 clickTest
    }, 1000);
```

## HTTP协议

一面中，如果有笔试，考HTTP协议的可能性较大。

### 1. 前言

一面要讲的内容：

- `HTTP`协议的主要特点
- `HTTP`报文的组成部分
- `HTTP`方法
- `get` 和 `post`的区别
- `HTTP`状态码
- 什么是持久连接
- 什么是管线化

二面要讲的内容；

- 缓存
- `CSRF`攻击
- TSL 协商

### 2. HTTP协议的主要特点

- 简单快速
- 灵活
- **无连接**
- **无状态**

> 通常我们要答出以上四个内容。如果实在记不住，一定要记得后面的两个：**无连接、无状态**。


我们分别来解释一下。


#### 2.1 简单快速

> **简单**：每个资源（比如图片、页面）都通过 url 来定位。这都是固定的，在`http`协议中，处理起来也比较简单，想访问什么资源，直接输入url即可。


#### 2.2 灵活

> `http`协议的头部有一个`数据类型`，通过`http`协议，就可以完成不同数据类型的传输。

#### 2.3 无连接

> 连接一次，就会断开，不会继续保持连接。

#### 2.4 无状态

> 客户端和服务器端是两种身份。第一次请求结束后，就断开了，第二次请求时，**服务器端并没有记住之前的状态**，也就是说，服务器端无法区分客户端是否为同一个人、同一个身份。

> 有的时候，我们访问网站时，网站能记住我们的账号，这个是通过其他的手段（比如 `session`）做到的，并不是`http`协议能做到的。


### 3 HTTP报文的组成部分

![](http://img.smyhvae.com/20180306_1400.png)

> 在回答此问题时，我们要按照顺序回答：

- 先回答的是，`http`报文包括：**请求报文**和**响应报文**。
- 再回答的是，每个报文包含什么部分。
- 最后回答，每个部分的内容是什么

#### 3.1 请求报文包括：

![](http://img.smyhvae.com/20180228_1505.jpg)

- 请求行：包括请求方法、请求的`url`、`http`协议及版本。
- 请求头：一大堆的键值对。
- **空行**指的是：当服务器在解析请求头的时候，如果遇到了空行，则表明，后面的内容是请求体
- 请求体：数据部分。

#### 3.2 响应报文包括：

![](http://img.smyhvae.com/20180228_1510.jpg)


- 状态行：`http`协议及版本、状态码及状态描述。
- 响应头
- 空行
- 响应体


### 4 HTTP方法

包括：

- `GET`：获取资源
- `POST`：传输资源
- `put`：更新资源
- `DELETE`：删除资源
- `HEAD`：获得报文首部

> `HTTP`方法有很多，但是上面这五个方法，要求在面试时全部说出来，不要漏掉。

- `get` `和 `post` 比较常见。
- `put` 和 `delete` 在实际应用中用的很少。况且，业务中，一般不删除服务器端的资源。
- `head` 可能偶尔用的到。


### 5 get 和 post的区别

![](http://img.smyhvae.com/20180306_1415.png)

- 区别有很多，如果记不住，面试时，至少要任意答出其中的三四条。
- 有一点要强调，**get是相对不隐私的，而post是相对隐私的**。

> 我们大概要记住以下几点：

1. 浏览器在回退时，`get` **不会重新请求**，但是`post`会重新请求。【重要】
2. `get`请求会被浏览器**主动缓存**，而`post`不会。【重要】
3. `get`请求的参数，会报**保留**在浏览器的**历史记录**里，而`post`不会。做业务时要注意。为了防止`CSRF`攻击，很多公司把`get`统一改成了`post`。
4. `get`请求在`url`中`传递的参数有大小限制，基本是`2kb`，不同的浏览器略有不同。而post没有注意。
5. `get`的参数是直接暴露在`url`上的，相对不安全。而`post`是放在请求体中的。


### 6 http状态码

> `http`状态码分类：

![](http://img.smyhvae.com/20180306_1430.png)

> 常见的`http`状态码：

![](http://img.smyhvae.com/20180306_1431.png)


**部分解释**：

- `206`的应用：`range`指的是请求的范围，客户端只请求某个大文件里的一部分内容。比如说，如果播放视频地址或音频地址的前面一部分，可以用到`206`。
- `301`：重定向（永久）。
- `302`：重定向（临时）。
- `304`：我这个服务器告诉客户端，你已经有缓存了，不需要从我这里取了。

![](http://img.smyhvae.com/20180306_1440.png)

- `400`和`401`用的不多,未授权。`403`指的是请求被拒绝。`404`指的是资源不存在。

### 7 持久链接/http长连接

> 如果你能答出持久链接，这是面试官很想知道的一个点。

- **轮询**：`http1.0`中，客户端每隔很短的时间，都会对服务器发出请求，查看是否有新的消息，只要轮询速度足够快，例如`1`秒，就能给人造成交互是实时进行的印象。这种做法是无奈之举，实际上对服务器、客户端双方都造成了大量的性能浪费。
- **长连接**：`HTTP1.1`中，通过使用`Connection:keep-alive`进行长连接，。客户端只请求一次，但是服务器会将继续保持连接，当再次请求时，避免了重新建立连接。

> 注意，`HTTP 1.1`默认进行持久连接。在一次 `TCP` 连接中可以完成多个 `HTTP` 请求，但是对**每个请求仍然要单独发 header**，`Keep-Alive`不会永久保持连接，它有一个保持时间，可以在不同的服务器软件（如`Apache`）中设定这个时间。


### 8 长连接中的管线化

> 如果能答出**管线化**，则属于加分项。

#### 8.1 管线化的原理

> 长连接时，**默认**的请求这样的：

```
	请求1 --> 响应1 -->请求2 --> 响应2 --> 请求3 --> 响应3
```


> 管线化就是，我把现在的请求打包，一次性发过去，你也给我一次响应回来。


#### 8.2 管线化的注意事项

> 面试时，不会深究管线化。如果真要问你，就回答：“我没怎么研究过，准备回去看看~”

### 9 TSL 协商

Transport Layer Security (TLS) 是一个为计算机网络提供通信安全的加密协议。它广泛应用于大量应用程序，其中之一即浏览网页。网站可以使用 TLS 来保证服务器和网页浏览器之间的所有通信安全。

整个 TLS 握手过程包含以下几个步骤：

- 客户端向服务器发送 『Client hello』 信息，附带着客户端随机值和支持的密码组合。
- 服务器返回给客户端 『Server hello』信息，附带着服务器随机值。
- 服务器返回给客户端认证证书及或许要求客户端返回一个类似的证书。服务器返回『Server hello done』信息。
- 如果服务器要求客户端发送一个证书，客户端进行发送。
- 客户端创建一个随机的 Pre-Master 密钥然后使用服务器证书中的公钥来进行加密，向服务器发送加密过的 Pre-Master 密钥。
- 服务器收到 Pre-Master 密钥。服务器和客户端各自生成基于 Pre-Master 密钥的主密钥和会话密钥。
- 客户端给服务器发送一个 『Change cipher spec』的通知，表明客户端将会开始使用新的会话密钥来哈希和加密消息。客户端也发送了一个 『Client finished』的消息。
- 服务器接收到『Change cipher spec』的通知然后使用会话钥匙来切换其记录层安全状态为对称加密状态。服务器返回客户端一个 『Server finished』消息。
- 客户端和服务器现在可以通过建立的安全通道来交换程序数据。所有客户端和服务器之间发送的信息都会使用会话密钥进行加密。

每当发生任何验证失败的时候，用户会收到警告。比如服务器使用自签名的证书。

## HTML

**语义化**

- HTML标签的语义化是指：通过使用包含语义的标签（如h1-h6）恰当地表示文档结构
- css命名的语义化是指：为html标签添加有意义的class

- 为什么需要语义化：
  - 去掉样式后页面呈现清晰的结构
  - 盲人使用读屏器更好地阅读
  - 搜索引擎更好地理解页面，有利于收录
  - 便团队项目的可持续运作及维护

**简述一下你对HTML语义化的理解？**
- 用正确的标签做正确的事情。
- html语义化让页面的内容结构化，结构更清晰，便于对浏览器、搜索引擎解析;
- 即使在没有样式CSS情况下也以一种文档格式显示，并且是容易阅读的;
- 搜索引擎的爬虫也依赖于HTML标记来确定上下文和各个关键字的权重，利于SEO;
- 使阅读源代码的人对网站更容易将网站分块，便于阅读维护理解

**Doctype作用？标准模式与兼容模式各有什么区别?**

- `<!DOCTYPE>`声明位于位`于HTML`文档中的第一行，处于 `<html>` 标签之前。告知浏览器的解析器用什么文档标准解析这个文档。`DOCTYPE`不存在或格式不正确会导致文档以兼容模式呈现
- 标准模式的排版 和JS运作模式都是以该浏览器支持的最高标准运行。在兼容模式中，页面以宽松的向后兼容的方式显示,模拟老式浏览器的行为以防止站点无法工作

**HTML5 为什么只需要写 <!DOCTYPE HTML>？**

- HTML5 不基于 SGML，因此不需要对DTD进行引用，但是需要doctype来规范浏览器的行为（让浏览器按照它们应该的方式来运行）
-  而HTML4.01基于SGML,所以需要对DTD进行引用，才能告知浏览器文档所使用的文档类型

**行内元素有哪些？块级元素有哪些？ 空(void)元素有那些？**

- 行内元素有：`a b span img input select strong`（强调的语气）
- 块级元素有：`div ul ol li dl dt dd h1 h2 h3 h4…p`
- 常见的空元素:` <br> <hr> <img> <input> <link> <meta>`

**页面导入样式时，使用link和@import有什么区别？**

- `link`属于`XHTML`标签，除了加载`CSS`外，还能用于定义`RSS`,定义`rel`连接属性等作用；而`@import`是`CSS`提供的，只能用于加载`CSS`
- 页面被加载的时，`link`会同时被加载，而`@import`引用的`CSS`会等到页面被加载完再加载
- `import`是`CSS2.1` 提出的，只在`IE5`以上才能被识别，而`link`是`XHTML`标签，无兼容问题

**介绍一下你对浏览器内核的理解？**

- 主要分成两部分：渲染引擎(`layout engineer`或`Rendering Engine`)和`JS`引擎

- 渲染引擎：负责取得网页的内容（HTML、XML、图像等等）、整理讯息（例如加入CSS等），以及计算网页的显示方式，然后会输出至显示器或打印机。浏览器的内核的不同对于网页的语法解释会有不同，所以渲染的效果也不相同。所有网页浏览器、电子邮件客户端以及其它需要编辑、显示网络内容的应用程序都需要内核
- JS引擎则：解析和执行javascript来实现网页的动态效果
- 最开始渲染引擎和JS引擎并没有区分的很明确，后来JS引擎越来越独立，内核就倾向于只指渲染引擎

**常见的浏览器内核有哪些？**

- `Trident`内核：`IE,MaxThon,TT,The World,360`,搜狗浏览器等。[又称MSHTML]
- `Gecko`内核：`Netscape6`及以上版本，`FF,MozillaSuite/SeaMonkey`等
- `Presto`内核：`Opera7`及以上。      [`Opera`内核原为：Presto，现为：`Blink`;]
- `Webkit`内核：`Safari,Chrome`等。   [ `Chrome`的`Blink`（`WebKit`的分支）]

**html5有哪些新特性、移除了那些元素？如何处理HTML5新标签的浏览器兼容问题？如何区分 HTML 和 HTML5？**

- HTML5 现在已经不是 SGML 的子集，主要是关于图像，位置，存储，多任务等功能的增加
  - 绘画 canvas
  - 用于媒介回放的 video 和 audio 元素
  - 本地离线存储 localStorage 长期存储数据，浏览器关闭后数据不丢失
  - sessionStorage 的数据在浏览器关闭后自动删除
  - 语意化更好的内容元素，比如 article、footer、header、nav、section
  - 表单控件，calendar、date、time、email、url、search
  - 新的技术webworker, websocket, Geolocation

-  移除的元素：
  - 纯表现的元素：basefont，big，center，font, s，strike，tt，u
  - 对可用性产生负面影响的元素：frame，frameset，noframes

- 支持HTML5新标签：
  - IE8/IE7/IE6支持通过document.createElement方法产生的标签
  - 可以利用这一特性让这些浏览器支持HTML5新标签
  - 浏览器支持新标签后，还需要添加标签默认的样式

- 当然也可以直接使用成熟的框架、比如html5shim

```
<!--[if lt IE 9]>
<script> src="http://html5shim.googlecode.com
/svn/trunk/html5.js"</script><![endif]-->
```

- 如何区分HTML5： DOCTYPE声明\新增的结构元素\功能元素

**HTML5的离线储存怎么使用，工作原理能不能解释一下？**

- 在用户没有与因特网连接时，可以正常访问站点或应用，在用户与因特网连接时，更新用户机器上的缓存文件

- 原理：HTML5的离线存储是基于一个新建的.appcache文件的缓存机制(不是存储技术)，通过这个文件上的解析清单离线存储资源，这些资源就会像cookie一样被存储了下来。之后当网络在处于离线状态下时，浏览器会通过被离线存储的数据进行页面展示

- 如何使用：
  - 页面头部像下面一样加入一个manifest的属性；
  - 在cache.manifest文件的编写离线存储的资源
  - 在离线状态时，操作window.applicationCache进行需求实现
```
CACHE MANIFEST
    #v0.11
    CACHE:
    js/app.js
    css/style.css
    NETWORK:
    resourse/logo.png
    FALLBACK:
    / /offline.html
```

**浏览器是怎么对HTML5的离线储存资源进行管理和加载的呢？**

- 在线的情况下，浏览器发现html头部有manifest属性，它会请求manifest文件，如果是第一次访问app，那么浏览器就会根据manifest文件的内容下载相应的资源并且进行离线存储。如果已经访问过app并且资源已经离线存储了，那么浏览器就会使用离线的资源加载页面，然后浏览器会对比新的manifest文件与旧的manifest文件，如果文件没有发生改变，就不做任何操作，如果文件改变了，那么就会重新下载文件中的资源并进行离线存储。

- 离线的情况下，浏览器就直接使用离线存储的资源。

**请描述一下 cookies，sessionStorage 和 localStorage 的区别？**

- cookie是网站为了标示用户身份而储存在用户本地终端（Client Side）上的数据（通常经过加密）
- cookie数据始终在同源的http请求中携带（即使不需要），记会在浏览器和服务器间来回传递
- `sessionStorage`和`localStorage`不会自动把数据发给服务器，仅在本地保存
- 存储大小：
  - `cookie`数据大小不能超过4k
  - `sessionStorage`和`localStorage`虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大

- 有期时间：
  - `localStorage` 存储持久数据，浏览器关闭后数据不丢失除非主动删除数据
  - `sessionStorage`  数据在当前浏览器窗口关闭后自动删除
  - `cookie`  设置的`cookie`过期时间之前一直有效，即使窗口或浏览器关闭

**iframe有那些缺点？**

- iframe会阻塞主页面的Onload事件
- 搜索引擎的检索程序无法解读这种页面，不利于SEO
- iframe和主页面共享连接池，而浏览器对相同域的连接有限制，所以会影响页面的并行加载
- 使用`iframe`之前需要考虑这两个缺点。如果需要使用`iframe`，最好是通过`javascript`动态给`iframe`添加`src`属性值，这样可以绕开以上两个问题

**Label的作用是什么？是怎么用的？**

- label标签来定义表单控制间的关系,当用户选择该标签时，浏览器会自动将焦点转到和标签相关的表单控件

**HTML5的form如何关闭自动完成功能？**

- 给不想要提示的 form 或某个 input 设置为 autocomplete=off。

**如何实现浏览器内多个标签页之间的通信? (阿里)**

- WebSocket、SharedWorker
- 也可以调用localstorge、cookies等本地存储方式

**webSocket如何兼容低浏览器？(阿里)**

- Adobe Flash Socket 、
- ActiveX HTMLFile (IE) 、
- 基于 multipart 编码发送 XHR 、
- 基于长轮询的 XHR

**页面可见性（Page Visibility API） 可以有哪些用途？**

- 通过 visibilityState 的值检测页面当前是否可见，以及打开网页的时间等;
- 在页面被切换到其他后台进程的时候，自动暂停音乐或视频的播放

**如何在页面上实现一个圆形的可点击区域？**

- map+area或者svg
- border-radius
- 纯js实现 需要求一个点在不在圆上简单算法、获取鼠标坐标等等

**实现不使用 border 画出1px高的线，在不同浏览器的标准模式与怪异模式下都能保持一致的效果**

```
<div style="height:1px;overflow:hidden;background:red"></div>
```

**网页验证码是干嘛的，是为了解决什么安全问题**

- 区分用户是计算机还是人的公共全自动程序。可以防止恶意破解密码、刷票、论坛灌水
- 有效防止黑客对某一个特定注册用户用特定程序暴力破解方式进行不断的登陆尝试

**title与h1的区别、b与strong的区别、i与em的区别？**

- `title`属性没有明确意义只表示是个标题，H1则表示层次明确的标题，对页面信息的抓取也有很大的影响
- `strong`是标明重点内容，有语气加强的含义，使用阅读设备阅读网络时：`<strong>`会重读，而`<B>`是展示强调内容
- i内容展示为斜体，em表示强调的文本

**页面导入样式时，使用 link 和 @import 有什么区别？**

* link 属于HTML标签，除了加载CSS外，还能用于定 RSS等；@import 只能用于加载CSS
* 页面加载的时，link 会同时被加载，而 @import 引用的 CSS 会等到页面被加载完再加载
* @import 只在 IE5 以上才能被识别，而 link 是HTML标签，无兼容问题

**介绍一下你对浏览器内核的理解？**

* 浏览器内核主要分为两部分：渲染引擎(layout engineer 或 Rendering Engine) 和 JS引擎
* 渲染引擎负责取得网页的内容进行布局计和样式渲染，然后会输出至显示器或打印机
* JS引擎则负责解析和执行JS脚本来实现网页的动态效果和用户交互
* 最开始渲染引擎和JS引擎并没有区分的很明确，后来JS引擎越来越独立，内核就倾向于只指渲染引擎

**常见的浏览器内核有哪些？**

* Blink内核：新版 Chrome、新版 Opera
* Webkit内核：Safari、原Chrome
* Gecko内核：FireFox、Netscape6及以上版本
* Trident内核（又称MSHTML内核）：IE、国产浏览器
* Presto内核：原Opera7及以上

**HTML5有哪些新特性？**

* 新增选择器 document.querySelector、document.querySelectorAll
* 拖拽释放(Drag and drop) API
* 媒体播放的 video 和 audio
* 本地存储 localStorage 和 sessionStorage
* 离线应用 manifest
* 桌面通知 Notifications
* 语意化标签 article、footer、header、nav、section
* 增强表单控件 calendar、date、time、email、url、search
* 地理位置 Geolocation
* 多任务 webworker
* 全双工通信协议 websocket
* 历史管理 history
* 跨域资源共享(CORS) Access-Control-Allow-Origin
* 页面可见性改变事件 visibilitychange
* 跨窗口通信 PostMessage
* Form Data 对象
* 绘画 canvas

**HTML5移除了那些元素？**

* 纯表现的元素：basefont、big、center、font、s、strike、tt、u
* 对可用性产生负面影响的元素：frame、frameset、noframes

**如何处理HTML5新标签的浏览器兼容问题？**

* 通过 document.createElement 创建新标签
* 使用垫片 html5shim.js

**如何区分 HTML 和 HTML5？**

- DOCTYPE声明、新增的结构元素、功能元素

**HTML5的离线储存工作原理能不能解释一下，怎么使用？**

* HTML5的离线储存原理：
  - 用户在线时，保存更新用户机器上的缓存文件；当用户离线时，可以正常访离线储存问站点或应用内容

* HTML5的离线储存使用：

    - 在文档的 html 标签设置 manifest 属性，如 manifest="/offline.appcache"
    - 在项目中新建 manifest 文件，manifest 文件的命名建议：xxx.appcache
    - 在 web 服务器配置正确的 MIME-type，即 text/cache-manifest

**浏览器是怎么对HTML5的离线储存资源进行管理和加载的？**


* 在线的情况下，浏览器发现 html 标签有 manifest 属性，它会请求 manifest 文件
* 如果是第一次访问app，那么浏览器就会根据 manifest 文件的内容下载相应的资源并且进行离线存储
* 如果已经访问过app且资源已经离线存储了，浏览器会对比新的 manifest 文件与旧的 manifest 文件，如果文件没有发生改变，就不做任何操作。如果文件改变了，那么就会重新下载文件中的资源并进行离线存储
* 离线的情况下，浏览器就直接使用离线存储的资源。

**iframe 有那些优点和缺点？**

* 优点：
     - 用来加载速度较慢的内容（如广告）
     - 可以使脚本可以并行下载
     - 可以实现跨子域通信

* 缺点：
     - iframe 会阻塞主页面的 onload 事件
     - 无法被一些搜索引擎索识别
     - 会产生很多页面，不容易管理

**label 的作用是什么？怎么使用的？**

* label标签来定义表单控件的关系：
  - 当用户选择label标签时，浏览器会自动将焦点转到和label标签相关的表单控件上

* 使用方法1：
  - `<label for="mobile">Number:</label>`
  - `<input type="text" id="mobile"/>`

* 使用方法2：
  - `<label>Date:<input type="text"/></label>`

**如何实现浏览器内多个标签页之间的通信？**

* iframe + contentWindow
* postMessage
* SharedWorker(Web Worker API)
* storage 事件(localStorge API)
* WebSocket

**webSocket 如何兼容低浏览器？**

* Adobe Flash Socket
* ActiveX HTMLFile (IE)
* 基于 multipart 编码发送 XHR
* 基于长轮询的 XHR

**页面可见性（Page Visibility API） 可以有哪些用途？**

* 在页面被切换到其他后台进程的时候，自动暂停音乐或视频的播放
* 当用户浏览其他页面，暂停网站首页幻灯自动播放
* 完成登陆后，无刷新自动同步其他页面的登录状态

**title 与 h1 的区别、b 与 strong 的区别、i 与 em 的区别？**

* title 表示是整个页面标题，h1 则表示层次明确的标题，对页面信息的抓取有很大的影响
- `strong`是标明重点内容，有语气加强的含义，使用阅读设备阅读网络时：`<strong>`会重读，而`<B>`是展示强调内容
- i内容展示为斜体，em表示强调的文本

**是展示强调内容**

  * i 内容展示为斜体，em 表示强调的文本
  * 自然样式标签：b, i, u, s, pre
  * 语义样式标签：strong, em, ins, del, code
  * 应该准确使用语义样式标签, 但不能滥用。如果不能确定时，首选使用自然样式标签

## CSS

**display: none; 与 visibility: hidden; 的区别**

- 联系：它们都能让元素不可见
- 区别：
  - `display:none`;会让元素完全从渲染树中消失，渲染的时候不占据任何空间；`visibility: hidden`;不会让元素从渲染树消失，渲染师元素继续占据空间，只是内容不可见
  - `display: none`;是非继承属性，子孙节点消失由于元素从渲染树消失造成，通过修改子孙节点属性无法显示；`visibility:hidden`;是继承属性，子孙节点消失由于继承了`hidden`，通过设置`visibility: visible`;可以让子孙节点显式
  - 修改常规流中元素的`display`通常会造成文档重排。修改`visibility`属性只会造成本元素的重绘
  - 读屏器不会读取`display: none;`元素内容；会读取`visibility: hidden`元素内容

**css hack原理及常用hack**

- 原理：利用不同浏览器对CSS的支持和解析结果不一样编写针对特定浏览器样式。
- 常见的hack有
  - 属性hack
  - 选择器hack
  - IE条件注释

**link 与 @import 的区别**

 - `link` 是`HTML`方式， `@import` 是`CSS`方式
 - `link `最大限度支持并行下载，` @import` 过多嵌套导致串行下载，出现FOUC
 - `link` 可以通过 `rel="alternate stylesheet"` 指定候选样式
 - 浏览器对 `link` 支持早于` @import` ，可以使用 `@import` 对老浏览器隐藏样式
 - `@import` 必须在样式规则之前，可以在`css`文件中引用其他文件
 - 总体来说：`link`优于`@import`

**CSS有哪些继承属性**

- 关于文字排版的属性如：
  - `font`
	- `word-break`
	- `letter-spacing`
	- `text-align`
	- `text-rendering`
	- `word-spacing`
	- `white-space`
	- `text-indent`
	- `text-transform`
	- `text-shadow`
  - `line-height`
  - `color`
  - `visibility`
  - `cursor`

**display,float,position的关系**

- 如果 `display` 为`none`，那么`position`和`float`都不起作用，这种情况下元素不产生框
- 否则，如果`position`值为`absolute`或者`fixed`，框就是绝对定位的，`float`的计算值为`none`，`display`根据下面的表格进行调整
- 否则，如果`float`不是`none`，框是浮动的，`display`根据下表进行调整
- 否则，如果元素是根元素，`display`根据下表进行调整
- 其他情况下`display`的值为指定值 总结起来：绝对定位、浮动、根元素都需要调整 `display`

 ![图片转自网络](https://images2018.cnblogs.com/blog/715962/201805/715962-20180513012245079-391725349.png)

**外边距折叠(collapsing margins)**

- 毗邻的两个或多个 `margin` 会合并成一个`margin`，叫做外边距折叠。规则如下：
  - 两个或多个毗邻的普通流中的块元素垂直方向上的`margin`会折叠
  - 浮动元素或`inline-block`元素或绝对定位元素的`margin`不会和垂直方向上的其他元素的margin折叠
  - 创建了块级格式化上下文的元素，不会和它的子元素发生margin折叠
  - 元素自身的`margin-bottom`和`margin-top`相邻时也会折


**介绍一下标准的CSS的盒子模型？低版本IE的盒子模型有什么不同的？**

- 有两种， IE 盒子模型、W3C 盒子模型；
- 盒模型： 内容(content)、填充(padding)、边界(margin)、 边框(border)；
- 区  别： IE的content部分把 border 和 padding计算了进去;

**CSS选择符有哪些？哪些属性可以继承？**

- id选择器（ # myid）
- 类选择器（.myclassname）
- 标签选择器（div, h1, p）
- 相邻选择器（h1 + p）
- 子选择器（ul > li）
- 后代选择器（li a）
- 通配符选择器（ * ）
- 属性选择器（a[rel = "external"]）
- 伪类选择器（a:hover, li:nth-child）

- 可继承的样式： `font-size font-family color, UL LI DL DD DT`
- 不可继承的样式：`border padding margin width height `

**CSS优先级算法如何计算？**

- 优先级就近原则，同权重情况下样式定义最近者为准
- 载入样式以最后载入的定位为准
- 优先级为: `!important >  id > class > tag` important 比 内联优先级高

**CSS3新增伪类有那些？**

```
p:first-of-type 选择属于其父元素的首个 <p> 元素的每个 <p> 元素。
p:last-of-type  选择属于其父元素的最后 <p> 元素的每个 <p> 元素。
p:only-of-type  选择属于其父元素唯一的 <p> 元素的每个 <p> 元素。
p:only-child        选择属于其父元素的唯一子元素的每个 <p> 元素。
p:nth-child(2)  选择属于其父元素的第二个子元素的每个 <p> 元素。

:after          在元素之前添加内容,也可以用来做清除浮动。
:before         在元素之后添加内容
:enabled
:disabled       控制表单控件的禁用状态。
:checked        单选框或复选框被选中
```

**如何居中div？如何居中一个浮动元素？如何让绝对定位的div居中？**

- 给`div`设置一个宽度，然后添加`margin:0 auto`属性

```
div{
    width:200px;
    margin:0 auto;
 }
 ```
- 居中一个浮动元素

```
//确定容器的宽高 宽500 高 300 的层
//设置层的外边距

 .div {
      width:500px ; height:300px;//高度可以不设
      margin: -150px 0 0 -250px;
      position:relative;         //相对定位
      background-color:pink;     //方便看效果
      left:50%;
      top:50%;
 }
 ```

 - 让绝对定位的div居中

```
  position: absolute;
  width: 1200px;
  background: none;
  margin: 0 auto;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  ```

**display有哪些值？说明他们的作用**

- block         象块类型元素一样显示。
- none          缺省值。象行内元素类型一样显示。
- inline-block  象行内元素一样显示，但其内容象块类型元素一样显示。
- list-item     象块类型元素一样显示，并添加样式列表标记。
- table         此元素会作为块级表格来显示
- inherit       规定应该从父元素继承 display 属性的值

**position的值relative和absolute定位原点是？**

- absolute
    - 生成绝对定位的元素，相对于值不为 static的第一个父元素进行定位。
- fixed （老IE不支持）
    - 生成绝对定位的元素，相对于浏览器窗口进行定位。
- relative
    - 生成相对定位的元素，相对于其正常位置进行定位。
- static
    - 默认值。没有定位，元素出现在正常的流中（忽略 top, bottom, left, right - z-index 声明）。
- inherit
    - 规定从父元素继承 position 属性的值

**CSS3有哪些新特性？**

 - 新增各种CSS选择器  （: not(.input)：所有 class 不是“input”的节点）
 - 圆角           （border-radius:8px）
 - 多列布局        （multi-column layout）
 - 阴影和反射        （Shadow\Reflect）
 - 文字特效      （text-shadow、）
 - 文字渲染      （Text-decoration）
 - 线性渐变      （gradient）
 - 旋转          （transform）
 - 增加了旋转,缩放,定位,倾斜,动画，多背景
 - `transform:\scale(0.85,0.90)\ translate(0px,-30px)\ skew(-9deg,0deg)\Animation:`

**用纯CSS创建一个三角形的原理是什么？**

```
// 把上、左、右三条边隐藏掉（颜色设为 transparent）
#demo {
  width: 0;
  height: 0;
  border-width: 20px;
  border-style: solid;
  border-color: transparent transparent red transparent;
}
```

**一个满屏 品 字布局 如何设计?**

- 简单的方式：
    - 上面的div宽100%，
    - 下面的两个div分别宽50%，
    - 然后用float或者inline使其不换行即可

**经常遇到的浏览器的兼容性有哪些？原因，解决方法是什么，常用hack的技巧 ？**

- png24位的图片在iE6浏览器上出现背景，解决方案是做成PNG8.
- 浏览器默认的margin和padding不同。解决方案是加一个全局的*{margin:0;padding:0;}来统一
- IE下,可以使用获取常规属性的方法来获取自定义属性,也可以使用getAttribute()获取自定义属性;
- Firefox下,只能使用getAttribute()获取自定义属性。
   - 解决方法:统一通过getAttribute()获取自定义属性

-  IE下,even对象有x,y属性,但是没有pageX,pageY属性
-  Firefox下,event对象有pageX,pageY属性,但是没有x,y属性

**li与li之间有看不见的空白间隔是什么原因引起的？有什么解决办法？**

- 行框的排列会受到中间空白（回车\空格）等的影响，因为空格也属于字符,这些空白也会被应用样式，占据空间，所以会有间隔，把字符大小设为0，就没有空格了

**为什么要初始化CSS样式**

- 因为浏览器的兼容问题，不同浏览器对有些标签的默认值是不同的，如果没对CSS初始化往往会出现浏览器之间的页面显示差异

**对BFC规范(块级格式化上下文：block formatting context)的理解？**

- 一个页面是由很多个 Box 组成的,元素的类型和 display 属性,决定了这个 Box 的类型
- 不同类型的 Box,会参与不同的 Formatting Context（决定如何渲染文档的容器）,因此Box内的元素会以不同的方式渲染,也就是说BFC内部的元素和外部的元素不会互相影响

**css定义的权重**

```
// 以下是权重的规则：标签的权重为1，class的权重为10，id的权重为100，以下/// 例子是演示各种定义的权重值：

/*权重为1*/
div{
}
/*权重为10*/
.class1{
}
/*权重为100*/
#id1{
}
/*权重为100+1=101*/
#id1 div{
}
/*权重为10+1=11*/
.class1 div{
}
/*权重为10+10+1=21*/
.class1 .class2 div{
}

// 如果权重相同，则最后定义的样式会起作用，但是应该避免这种情况出现
```

**display:inline-block 什么时候会显示间隙？(携程)**

- 移除空格、使用margin负值、使用font-size:0、letter-spacing、word-spacing

**谈谈浮动和清除浮动**

- 浮动的框可以向左或向右移动，直到他的外边缘碰到包含框或另一个浮动框的边框为止。由于浮动框不在文档的普通流中，所以文档的普通流的块框表现得就像浮动框不存在一样。浮动的块框会漂浮在文档普通流的块框上


**介绍一下标准的CSS的盒子模型？低版本IE的盒子模型有什么不同的？**

* 盒子模型构成：内容(content)、内填充(padding)、 边框(border)、外边距(margin)
* IE8及其以下版本浏览器，未声明 DOCTYPE，内容宽高会包含内填充和边框，称为怪异盒模型(IE盒模型)
* 标准(W3C)盒模型：元素宽度 = width + padding + border + margin
* 怪异(IE)盒模型：元素宽度 = width + margin
* 标准浏览器通过设置 css3 的 box-sizing: border-box 属性，触发“怪异模式”解析计算宽高

**box-sizing 常用的属性有哪些？分别有什么作用？**

* box-sizing: content-box;  // 默认的标准(W3C)盒模型元素效果
* box-sizing: border-box;   // 触发怪异(IE)盒模型元素的效果
* box-sizing: inherit;      //  继承父元素 box-sizing 属性的值

**CSS选择器有哪些？**

* id选择器        #id
* 类选择器        .class
* 标签选择器      div, h1, p
* 相邻选择器      h1 + p
* 子选择器        ul > li
* 后代选择器      li a
* 通配符选择器    *
* 属性选择器      a[rel='external']
* 伪类选择器      a:hover, li:nth-child

**CSS哪些属性可以继承？哪些属性不可以继承？**

* 可以继承的样式：font-size、font-family、color、list-style、cursor
* 不可继承的样式：width、height、border、padding、margin、background

**CSS如何计算选择器优先？**

* 相同权重，定义最近者为准：行内样式 > 内部样式 > 外部样式
* 含外部载入样式时，后载入样式覆盖其前面的载入的样式和内部样式
* 选择器优先级: 行内样式[1000] > id[100] > class[10] > Tag[1]
* 在同一组属性设置中，!important 优先级最高，高于行内样式

**CSS3新增伪类有哪些？**

- :root           选择文档的根元素，等同于 html 元素

- :empty          选择没有子元素的元素
- :target         选取当前活动的目标元素
- :not(selector)  选择除 selector 元素意外的元素

- :enabled        选择可用的表单元素
- :disabled       选择禁用的表单元素
- :checked        选择被选中的表单元素

- :after          在元素内部最前添加内容
- :before         在元素内部最后添加内容

- :nth-child(n)      匹配父元素下指定子元素，在所有子元素中排序第n
- :nth-last-child(n) 匹配父元素下指定子元素，在所有子元素中排序第n，从后向前数
- :nth-child(odd)
- :nth-child(even)
- :nth-child(3n+1)
- :first-child
- :last-child
- :only-child

- :nth-of-type(n)      匹配父元素下指定子元素，在同类子元素中排序第n
- :nth-last-of-type(n) 匹配父元素下指定子元素，在同类子元素中排序第n，从后向前数
- :nth-of-type(odd)
- :nth-of-type(even)
- :nth-of-type(3n+1)
- :first-of-type
- :last-of-type
- :only-of-type

- ::selection     选择被用户选取的元素部分
- :first-line     选择元素中的第一行
- :first-letter   选择元素中的第一个字符

**请列举几种隐藏元素的方法**

* visibility: hidden;   这个属性只是简单的隐藏某个元素，但是元素占用的空间任然存在
* opacity: 0;           CSS3属性，设置0可以使一个元素完全透明
* position: absolute;   设置一个很大的 left 负值定位，使元素定位在可见区域之外
* display: none;        元素会变得不可见，并且不会再占用文档的空间。
* transform: scale(0);  将一个元素设置为缩放无限小，元素将不可见，元素原来所在的位置将被保留
* `<div hidden="hidden">` HTML5属性,效果和display:none;相同，但这个属性用于记录一个元素的状态
* height: 0;            将元素高度设为 0 ，并消除边框
* filter: blur(0);      CSS3属性，将一个元素的模糊度设置为0，从而使这个元素“消失”在页面中

**rgba() 和 opacity 的透明效果有什么不同？**
* opacity 作用于元素以及元素内的所有内容（包括文字）的透明度
* rgba() 只作用于元素自身的颜色或其背景色，子元素不会继承透明效果

**css 属性 content 有什么作用？**

- content 属性专门应用在 before/after 伪元素上，用于插入额外内容或样式

**CSS3有哪些新特性？**

- 新增选择器     p:nth-child(n){color: rgba(255, 0, 0, 0.75)}
- 弹性盒模型     display: flex;
- 多列布局       column-count: 5;
- 媒体查询       @media (max-width: 480px) {.box: {column-count: 1;}}
- 个性化字体     @font-face{font-family: BorderWeb; src:url(BORDERW0.eot);}
- 颜色透明度     color: rgba(255, 0, 0, 0.75);
- 圆角           border-radius: 5px;
- 渐变           background:linear-gradient(red, green, blue);
- 阴影           box-shadow:3px 3px 3px rgba(0, 64, 128, 0.3);
- 倒影           box-reflect: below 2px;
- 文字装饰       text-stroke-color: red;
- 文字溢出       text-overflow:ellipsis;
- 背景效果       background-size: 100px 100px;
- 边框效果       border-image:url(bt_blue.png) 0 10;
- 转换
  - 旋转          transform: rotate(20deg);
  - 倾斜          transform: skew(150deg, -10deg);
  - 位移          transform: translate(20px, 20px);
  - 缩放          transform: scale(.5);
- 平滑过渡       transition: all .3s ease-in .1s;
- 动画           @keyframes anim-1 {50% {border-radius: 50%;}} animation: anim-1 1s;

**请解释一下 CSS3 的 Flexbox（弹性盒布局模型）以及适用场景？**

- Flexbox 用于不同尺寸屏幕中创建可自动扩展和收缩布局

**经常遇到的浏览器的JS兼容性有哪些？解决方法是什么？**

* 当前样式：getComputedStyle(el, null) VS el.currentStyle
* 事件对象：e VS window.event
* 鼠标坐标：e.pageX, e.pageY VS window.event.x, window.event.y
* 按键码：e.which VS event.keyCode
* 文本节点：el.textContent VS el.innerText

**li与li之间有看不见的空白间隔是什么原因引起的？有什么解决办法？**

* li排列受到中间空白(回车/空格)等的影响，因为空白也属于字符，会被应用样式占据空间，产生间隔
* 解决办法：在ul设置设置font-size=0,在li上设置需要的文字大小

**什么是外边距重叠？ 重叠的结果是什么？**

* 外边距重叠就是 margin-collapse
* 相邻的两个盒子（可能是兄弟关系也可能是祖先关系）的外边距可以结合成一个单独的外边距。
这种合并外边距的方式被称为折叠，结合而成的外边距称为折叠外边距

* 折叠结果遵循下列计算规则：
    - 两个相邻的外边距都是正数时，折叠结果是它们两者之间较大的值
    - 两个相邻的外边距都是负数时，折叠结果是两者绝对值的较大值
    - 两个外边距一正一负时，折叠结果是两者的相加的和

**请写出多种等高布局**

* 在列的父元素上使用这个背景图进行Y轴的铺放，从而实现一种等高列的假像
* 模仿表格布局等高列效果：兼容性不好，在ie6-7无法正常运行
* css3 flexbox 布局： .container{display: flex; align-items: stretch;}

**css垂直居中的方法有哪些？**

* 如果是单行文本, line-height 设置成和 height 值

```
.vertical {
      height: 100px;
      line-height: 100px;
    }
```
* 已知高度的块级子元素，采用绝对定位和负边距

```
.container {
  position: relative;
}
.vertical {
  height: 300px;  /*子元素高度*/
  position: absolute;
  top:50%;  /*父元素高度50%*/
  margin-top: -150px; /*自身高度一半*/
}
```

 * 未知高度的块级父子元素居中，模拟表格布局
 * 缺点：IE67不兼容，父级 overflow：hidden 失效

```
.container {
      display: table;
    }
    .content {
      display: table-cell;
      vertical-align: middle;
    }

```

* 新增 inline-block 兄弟元素，设置 vertical-align
   - 缺点：需要增加额外标签，IE67不兼容

```

.container {
  height: 100%;/*定义父级高度，作为参考*/
}
.extra .vertical{
  display: inline-block;  /*行内块显示*/
  vertical-align: middle; /*垂直居中*/
}
.extra {
  height: 100%; /*设置新增元素高度为100%*/
}
```
* 绝对定位配合 CSS3 位移

```
.vertical {
  position: absolute;
  top:50%;  /*父元素高度50%*/
  transform:translateY(-50%, -50%);
}
```

* CSS3弹性盒模型

```
.container {
  display:flex;
  justify-content: center; /*子元素水平居中*/
  align-items: center; /*子元素垂直居中*/
}
```

**圣杯布局的实现原理？**

* 要求：三列布局；中间主体内容前置，且宽度自适应；两边内容定宽
  * 好处：重要的内容放在文档流前面可以优先渲染
  * 原理：利用相对定位、浮动、负边距布局，而不添加额外标签


```css
  .container {
      padding-left: 150px;
      padding-right: 190px;
  }
  .main {
      float: left;
      width: 100%;
  }
  .left {
      float: left;
      width: 190px;
      margin-left: -100%;
      position: relative;
      left: -150px;
  }
  .right {
      float: left;
      width: 190px;
      margin-left: -190px;
      position: relative;
      right: -190px;
  }
```

**什么是双飞翼布局？实现原理？**

- 双飞翼布局：对圣杯布局（使用相对定位，对以后布局有局限性）的改进，消除相对定位布局
- 原理：主体元素上设置左右边距，预留两翼位置。左右两栏使用浮动和负边距归位，消除相对定位。


```css
.container {
    /*padding-left:150px;*/
    /*padding-right:190px;*/
}
.main-wrap {
    width: 100%;
    float: left;
}
.main {
    margin-left: 150px;
    margin-right: 190px;
}
.left {
    float: left;
    width: 150px;
    margin-left: -100%;
    /*position: relative;*/
    /*left:-150px;*/
}
.right {
    float: left;
    width: 190px;
    margin-left: -190px;
    /*position:relative;*/
    /*right:-190px;*/
}
```

**在CSS样式中常使用 px、em 在表现上有什么区别？**

* px 相对于显示器屏幕分辨率，无法用浏览器字体放大功能
* em 值并不是固定的，会继承父级的字体大小： em = 像素值 / 父级font-size

**为什么要初始化CSS样式？**

* 不同浏览器对有些标签样式的默认值解析不同
* 不初始化CSS会造成各现浏览器之间的页面显示差异
* 可以使用 reset.css 或 Normalize.css 做 CSS 初始化

**解释下什么是浮动和它的工作原理？**


* 非IE浏览器下，容器不设高度且子元素浮动时，容器高度不能被内容撑开。
此时，内容会溢出到容器外面而影响布局。这种现象被称为浮动（溢出）。
* 工作原理：
  - 浮动元素脱离文档流，不占据空间（引起“高度塌陷”现象）
  - 浮动元素碰到包含它的边框或者其他浮动元素的边框停留

**浮动元素引起的问题？**

* 父元素的高度无法被撑开，影响与父元素同级的元素
* 与浮动元素同级的非浮动元素会跟随其后

**列举几种清除浮动的方式？**

* 添加额外标签，例如 `<div style="clear:both"></div>`
* 使用 br 标签和其自身的 clear 属性，例如 `<br clear="all" />`
* 父元素设置 overflow：hidden; 在IE6中还需要触发 hasLayout，例如zoom：1;
* 父元素也设置浮动
* 使用 :after 伪元素。由于IE6-7不支持 :after，使用 zoom:1 触发 hasLayout

**清除浮动最佳实践（after伪元素闭合浮动）：**

```
.clearfix:after{
    content: "\200B";
    display: table;
    height: 0;
    clear: both;
  }
  .clearfix{
    *zoom: 1;
  }
  ```

  **什么是 FOUC(Flash of Unstyled Content)？ 如何来避免 FOUC？**

* 当使用 @import 导入 CSS 时，会导致某些页面在 IE 出现奇怪的现象：
没有样式的页面内容显示瞬间闪烁，这种现象称为“文档样式短暂失效”，简称为FOUC
 * 产生原因：当样式表晚于结构性html加载时，加载到此样式表时，页面将停止之前的渲染。
 * 等待此样式表被下载和解析后，再重新渲染页面，期间导致短暂的花屏现象。
 * 解决方法：使用 link 标签将样式表放在文档 head

**介绍使用过的 CSS 预处理器？**

* CSS 预处理器基本思想：为 CSS 增加了一些编程的特性（变量、逻辑判断、函数等）
* 开发者使用这种语言进行进行 Web 页面样式设计，再编译成正常的 CSS 文件使用
* 使用 CSS 预处理器，可以使 CSS 更加简洁、适应性更强、可读性更佳，无需考虑兼容性
* 最常用的 CSS 预处理器语言包括：Sass（SCSS）和 LESS

**CSS优化、提高性能的方法有哪些？**

* 多个css合并，尽量减少HTTP请求
* 将css文件放在页面最上面
* 移除空的css规则
* 避免使用CSS表达式
* 选择器优化嵌套，尽量避免层级过深
* 充分利用css继承属性，减少代码量
* 抽象提取公共样式，减少代码量
* 属性值为0时，不加单位
* 属性值为小于1的小数时，省略小数点前面的0
* css雪碧图

**浏览器是怎样解析CSS选择器的？**

- 浏览器解析 CSS 选择器的方式是从右到左

**在网页中的应该使用奇数还是偶数的字体？**

- 在网页中的应该使用“偶数”字体：
  * 偶数字号相对更容易和 web 设计的其他部分构成比例关系
  * 使用奇数号字体时文本段落无法对齐
  * 宋体的中文网页排布中使用最多的就是 12 和 14

**margin和padding分别适合什么场景使用？**

* 需要在border外侧添加空白，且空白处不需要背景（色）时，使用 margin
* 需要在border内测添加空白，且空白处需要背景（色）时，使用 padding

**抽离样式模块怎么写，说出思路？**

- CSS可以拆分成2部分：公共CSS 和 业务CSS：
  - 网站的配色，字体，交互提取出为公共CSS。这部分CSS命名不应涉及具体的业务
  - 对于业务CSS，需要有统一的命名，使用公用的前缀。可以参考面向对象的CSS

**元素竖向的百分比设定是相对于容器的高度吗？**

- 元素竖向的百分比设定是相对于容器的宽度，而不是高度

**全屏滚动的原理是什么？ 用到了CSS的那些属性？**

* 原理类似图片轮播原理，超出隐藏部分，滚动时显示
* 可能用到的CSS属性：overflow:hidden; transform:translate(100%, 100%); display:none;

**什么是响应式设计？响应式设计的基本原理是什么？如何兼容低版本的IE？**

* 响应式设计就是网站能够兼容多个终端，而不是为每个终端做一个特定的版本
* 基本原理是利用CSS3媒体查询，为不同尺寸的设备适配不同样式
* 对于低版本的IE，可采用JS获取屏幕宽度，然后通过resize方法来实现兼容：


```javascript
$(window).resize(function () {
  screenRespond();
});
screenRespond();
function screenRespond(){
var screenWidth = $(window).width();
if(screenWidth <= 1800){
  $("body").attr("class", "w1800");
}
if(screenWidth <= 1400){
  $("body").attr("class", "w1400");
}
if(screenWidth > 1800){
  $("body").attr("class", "");
}
}
```

**什么是视差滚动效果，如何给每页做不同的动画？**

 * 视差滚动是指多层背景以不同的速度移动，形成立体的运动效果，具有非常出色的视觉体验
 * 一般把网页解剖为：背景层、内容层和悬浮层。当滚动鼠标滚轮时，各图层以不同速度移动，形成视差的

* 实现原理
  - 以 “页面滚动条” 作为 “视差动画进度条”
  - 以 “滚轮刻度” 当作 “动画帧度” 去播放动画的
  - 监听 mousewheel 事件，事件被触发即播放动画，实现“翻页”效果

**a标签上四个伪类的执行顺序是怎么样的？**

```link > visited > hover > active```

- L-V-H-A love hate 用喜欢和讨厌两个词来方便记忆

**伪元素和伪类的区别和作用？**

- 伪元素 -- 在内容元素的前后插入额外的元素或样式，但是这些元素实际上并不在文档中生成。
- 它们只在外部显示可见，但不会在文档的源代码中找到它们，因此，称为“伪”元素。例如：

```
p::before {content:"第一章：";}
p::after {content:"Hot!";}
p::first-line {background:red;}
p::first-letter {font-size:30px;}

```

- 伪类 -- 将特殊的效果添加到特定选择器上。它是已有元素上添加类别的，不会产生新的元素。例如：

```
a:hover {color: #FF00FF}
p:first-child {color: red}
```

**::before 和 :after 中双冒号和单冒号有什么区别？**

* 在 CSS 中伪类一直用 : 表示，如 :hover, :active 等
* 伪元素在CSS1中已存在，当时语法是用 : 表示，如 :before 和 :after
* 后来在CSS3中修订，伪元素用 :: 表示，如 ::before 和 ::after，以此区分伪元素和伪类
* 由于低版本IE对双冒号不兼容，开发者为了兼容性各浏览器，继续使使用 :after 这种老语法表示伪元素
* 综上所述：::before 是 CSS3 中写伪元素的新语法； :after 是 CSS1 中存在的、兼容IE的老语法


**如何修改Chrome记住密码后自动填充表单的黄色背景？**

- 产生原因：由于Chrome默认会给自动填充的input表单加上 input:-webkit-autofill 私有属性造成的
- 解决方案1：在form标签上直接关闭了表单的自动填充：autocomplete="off"
- 解决方案2：input:-webkit-autofill { background-color: transparent; }

**input [type=search] 搜索框右侧小图标如何美化？**

```css
input[type="search"]::-webkit-search-cancel-button{
  -webkit-appearance: none;
  height: 15px;
  width: 15px;
  border-radius: 8px;
  background:url("images/searchicon.png") no-repeat 0 0;
  background-size: 15px 15px;
}
```

**网站图片文件，如何点击下载？而非点击预览？**

`<a href="logo.jpg" download>下载</a>`
`<a href="logo.jpg" download="网站LOGO" >下载</a>`

**iOS safari 如何阻止“橡皮筋效果”？**

```javascript
  $(document).ready(function(){
      var stopScrolling = function(event) {
          event.preventDefault();
      }
      document.addEventListener('touchstart', stopScrolling, false);
      document.addEventListener('touchmove', stopScrolling, false);
  });
```

**你对 line-height 是如何理解的？**

* line-height 指一行字的高度，包含了字间距，实际上是下一行基线到上一行基线距离
* 如果一个标签没有定义 height 属性，那么其最终表现的高度是由 line-height 决定的
* 一个容器没有设置高度，那么撑开容器高度的是 line-height 而不是容器内的文字内容
* 把 line-height 值设置为 height 一样大小的值可以实现单行文字的垂直居中
* line-height 和 height 都能撑开一个高度，height 会触发 haslayout，而 line-height 不会

**line-height 三种赋值方式有何区别？（带单位、纯数字、百分比）**

* 带单位：px 是固定值，而 em 会参考父元素 font-size 值计算自身的行高
* 纯数字：会把比例传递给后代。例如，父级行高为 1.5，子元素字体为 18px，则子元素行高为 1.5 * 18 = 27px
* 百分比：将计算后的值传递给后代

**设置元素浮动后，该元素的 display 值会如何变化？**

- 设置元素浮动后，该元素的 display 值自动变成 block

**怎么让Chrome支持小于12px 的文字？**

```css
  .shrink{
    -webkit-transform:scale(0.8);
    -o-transform:scale(1);
    display:inline-block;
  }
```

**让页面里的字体变清晰，变细用CSS怎么做？（IOS手机浏览器字体齿轮设置）**

```css
  -webkit-font-smoothing: antialiased;
```

**font-style 属性 oblique 是什么意思？**

- font-style: oblique; 使没有 italic 属性的文字实现倾斜

**如果需要手动写动画，你认为最小时间间隔是多久？**

- 16.7ms 多数显示器默认频率是60Hz，即1秒刷新60次，所以理论上最小间隔: 1s / 60 * 1000 ＝ 16.7ms

**display:inline-block 什么时候会显示间隙？**

* 相邻的 inline-block 元素之间有换行或空格分隔的情况下会产生间距
* 非 inline-block 水平元素设置为 inline-block 也会有水平间距
* 可以借助 vertical-align:top; 消除垂直间隙
* 可以在父级加 font-size：0; 在子元素里设置需要的字体大小，消除垂直间隙
* 把 li 标签写到同一行可以消除垂直间隙，但代码可读性差

**overflow: scroll 时不能平滑滚动的问题怎么处理？**

- 监听滚轮事件，然后滚动到一定距离时用 jquery 的 animate 实现平滑效果。

**一个高度自适应的div，里面有两个div，一个高度100px，希望另一个填满剩下的高度**

 - 方案1：
    `.sub { height: calc(100%-100px); }`
 - 方案2：
    `.container { position:relative; }`
    `.sub { position: absolute; top: 100px; bottom: 0; }`
 - 方案3：
    `.container { display:flex; flex-direction:column; }`
    `.sub { flex:1; }`


## JavaScript

**JavaScript的组成**

- JavaScript 由以下三部分组成：
  - ECMAScript（核心）：JavaScript 语言基础
  - DOM（文档对象模型）：规定了访问HTML和XML的接口
  - BOM（浏览器对象模型）：提供了浏览器窗口之间进行交互的对象和方法

**JS的基本数据类型和引用数据类型**

- 基本数据类型：undefined、null、boolean、number、string、symbol
- 引用数据类型：object、array、function

**检测浏览器版本版本有哪些方式？**
- 根据 navigator.userAgent   //  UA.toLowerCase().indexOf('chrome')
- 根据 window 对象的成员       // 'ActiveXObject' in window

**介绍JS有哪些内置对象？**

- 数据封装类对象：Object、Array、Boolean、Number、String
- 其他对象：Function、Arguments、Math、Date、RegExp、Error
- ES6新增对象：Symbol、Map、Set、Promises、Proxy、Reflect

**说几条写JavaScript的基本规范？**

- 代码缩进，建议使用“四个空格”缩进
- 代码段使用花括号{}包裹
- 语句结束使用分号;
- 变量和函数在使用前进行声明
- 以大写字母开头命名构造函数，全大写命名常量
- 规范定义JSON对象，补全双引号
- 用{}和[]声明对象和数组

**如何编写高性能的JavaScript？**

* 遵循严格模式："use strict";
* 将js脚本放在页面底部，加快渲染页面
* 将js脚本将脚本成组打包，减少请求
* 使用非阻塞方式下载js脚本
* 尽量使用局部变量来保存全局变量
* 尽量减少使用闭包
* 使用 window 对象属性方法时，省略 window
* 尽量减少对象成员嵌套
* 缓存 DOM 节点的访问
* 通过避免使用 eval() 和 Function() 构造器
* 给 setTimeout() 和 setInterval() 传递函数而不是字符串作为参数
* 尽量使用直接量创建对象和数组
* 最小化重绘(repaint)和回流(reflow)


**描述浏览器的渲染过程，DOM树和渲染树的区别？**

- 浏览器的渲染过程：
  - 解析HTML构建 DOM(DOM树)，并行请求 css/image/js
  - CSS 文件下载完成，开始构建 CSSOM(CSS树)
  - CSSOM 构建结束后，和 DOM 一起生成 Render Tree(渲染树)
  - 布局(Layout)：计算出每个节点在屏幕中的位置
  - 显示(Painting)：通过显卡把页面画到屏幕上

- DOM树 和 渲染树 的区别：
  - DOM树与HTML标签一一对应，包括head和隐藏元素
  - 渲染树不包括head和隐藏元素，大段文本的每一个行都是独立节点，每一个节点都有对应的css属性

**重绘和回流（重排）的区别和关系？**

- 重绘：当渲染树中的元素外观（如：颜色）发生改变，不影响布局时，产生重绘
- 回流：当渲染树中的元素的布局（如：尺寸、位置、隐藏/状态状态）发生改变时，产生重绘回流
- 注意：JS获取Layout属性值（如：offsetLeft、scrollTop、getComputedStyle等）也会引起回流。因为浏览器需要通过回流计算最新值
- 回流必将引起重绘，而重绘不一定会引起回流


**如何最小化重绘(repaint)和回流(reflow)？**

- 需要要对元素进行复杂的操作时，可以先隐藏(display:"none")，操作完成后再显示
- 需要创建多个DOM节点时，使用DocumentFragment创建完后一次性的加入document
- 缓存Layout属性值，如：var left = elem.offsetLeft; 这样，多次使用 left 只产生一次回流
- 尽量避免用table布局（table元素一旦触发回流就会导致table里所有的其它元素回流）
- 避免使用css表达式(expression)，因为每次调用都会重新计算值（包括加载页面）
- 尽量使用 css 属性简写，如：用 border 代替 border-width, border-style, border-color
- 批量修改元素样式：elem.className 和 elem.style.cssText 代替 elem.style.xxx

**script 的位置是否会影响首屏显示时间？**

- 在解析 HTML 生成 DOM 过程中，js 文件的下载是并行的，不需要 DOM 处理到 script 节点。因此，script的位置不影响首屏显示的开始时间。
- 浏览器解析 HTML 是自上而下的线性过程，script作为 HTML 的一部分同样遵循这个原则
- 因此，script 会延迟 DomContentLoad，只显示其上部分首屏内容，从而影响首屏显示的完成时间

**解释JavaScript中的作用域与变量声明提升？**

- JavaScript作用域：
  - 在Java、C等语言中，作用域为for语句、if语句或{}内的一块区域，称为作用域；
  - 而在 JavaScript 中，作用域为function(){}内的区域，称为函数作用域。

- JavaScript变量声明提升：
  -  在JavaScript中，函数声明与变量声明经常被JavaScript引擎隐式地提升到当前作用域的顶部。
  -  声明语句中的赋值部分并不会被提升，只有名称被提升
  -  函数声明的优先级高于变量，如果变量名跟函数名相同且未赋值，则函数声明会覆盖变量声明
  -  如果函数有多个同名参数，那么最后一个参数（即使没有定义）会覆盖前面的同名参数

**介绍JavaScript的原型，原型链？有什么特点？**

- 原型：
  - JavaScript的所有对象中都包含了一个 `[__proto__]` 内部属性，这个属性所对应的就是该对象的原型
  - JavaScript的函数对象，除了原型 `[__proto__]` 之外，还预置了 prototype 属性
  - 当函数对象作为构造函数创建实例时，该 prototype 属性值将被作为实例对象的原型 `[__proto__]`。

- 原型链：
  -  当一个对象调用的属性/方法自身不存在时，就会去自己 `[__proto__]` 关联的前辈 prototype 对象上去找
  -  如果没找到，就会去该 prototype 原型 `[__proto__]` 关联的前辈 prototype 去找。依次类推，直到找到属性/方法或 undefined 为止。从而形成了所谓的“原型链”


- 原型特点：
  - JavaScript对象是通过引用来传递的，当修改原型时，与之相关的对象也会继承这一改变


**JavaScript有几种类型的值？，你能画一下他们的内存图吗**

- 原始数据类型（Undefined，Null，Boolean，Number、String）-- 栈
- 引用数据类型（对象、数组和函数）-- 堆
- 两种类型的区别是：存储位置不同：
- 原始数据类型是直接存储在栈(stack)中的简单数据段，占据空间小、大小固定，属于被频繁使用数据；
- 引用数据类型存储在堆(heap)中的对象，占据空间大、大小不固定，如果存储在栈中，将会影响程序运行的性能；
- 引用数据类型在栈中存储了指针，该指针指向堆中该实体的起始地址。
- 当解释器寻找引用值时，会首先检索其在栈中的地址，取得地址后从堆中获得实体。

**JavaScript如何实现一个类，怎么实例化这个类？**

- 构造函数法（this + prototype） -- 用 new 关键字 生成实例对象
  - 缺点：用到了 this 和 prototype，编写复杂，可读性差

```javascript
  function Mobile(name, price){
     this.name = name;
     this.price = price;
   }
   Mobile.prototype.sell = function(){
      alert(this.name + "，售价 $" + this.price);
   }
   var iPhone7 = new Mobile("iPhone7", 1000);
   iPhone7.sell();
```
- Object.create 法 -- 用 Object.create() 生成实例对象
- 缺点：不能实现私有属性和私有方法，实例对象之间也不能共享数据

```javascript
 var Person = {
     firstname: "Mark",
     lastname: "Yun",
     age: 25,
     introduce: function(){
         alert('I am ' + Person.firstname + ' ' + Person.lastname);
     }
 };

 var person = Object.create(Person);
 person.introduce();

 // Object.create 要求 IE9+，低版本浏览器可以自行部署：
 if (!Object.create) {
　   Object.create = function (o) {
　　　 function F() {}
　　　 F.prototype = o;
　　　 return new F();
　　};
　}
```
- 极简主义法（消除 this 和 prototype） -- 调用 createNew() 得到实例对象
  - 优点：容易理解，结构清晰优雅，符合传统的"面向对象编程"的构造

```javascript
 var Cat = {
   age: 3, // 共享数据 -- 定义在类对象内，createNew() 外
   createNew: function () {
     var cat = {};
     // var cat = Animal.createNew(); // 继承 Animal 类
     cat.name = "小咪";
     var sound = "喵喵喵"; // 私有属性--定义在 createNew() 内，输出对象外
     cat.makeSound = function () {
       alert(sound);  // 暴露私有属性
     };
     cat.changeAge = function(num){
       Cat.age = num; // 修改共享数据
     };
     return cat; // 输出对象
   }
 };

 var cat = Cat.createNew();
 cat.makeSound();
```

- ES6 语法糖 class -- 用 new 关键字 生成实例对象

```javascript
     class Point {
       constructor(x, y) {
         this.x = x;
         this.y = y;
       }
       toString() {
         return '(' + this.x + ', ' + this.y + ')';
       }
     }

  var point = new Point(2, 3);
  ```

**Javascript如何实现继承？**

- 构造函数绑定：使用 call 或 apply 方法，将父对象的构造函数绑定在子对象上


```javascript   　
function Cat(name,color){
 　Animal.apply(this, arguments);
 　this.name = name;
 　this.color = color;
}
```
- 实例继承：将子对象的 prototype 指向父对象的一个实例

```javascript
Cat.prototype = new Animal();
Cat.prototype.constructor = Cat;
```

- 拷贝继承：如果把父对象的所有属性和方法，拷贝进子对象

```javascript         　　
    function extend(Child, Parent) {
  　　　var p = Parent.prototype;
  　　　var c = Child.prototype;
  　　　for (var i in p) {
  　　　   c[i] = p[i];
  　　　}
  　　　c.uber = p;
  　 }
  ```
- 原型继承：将子对象的 prototype 指向父对象的 prototype

```javascript
    function extend(Child, Parent) {
        var F = function(){};
      　F.prototype = Parent.prototype;
      　Child.prototype = new F();
      　Child.prototype.constructor = Child;
      　Child.uber = Parent.prototype;
    }
  ```
- ES6 语法糖 extends：class ColorPoint extends Point {}

```javascript
    class ColorPoint extends Point {
       constructor(x, y, color) {
          super(x, y); // 调用父类的constructor(x, y)
          this.color = color;
       }
       toString() {
          return this.color + ' ' + super.toString(); // 调用父类的toString()
       }
    }
  ```

**Javascript作用链域?**

- 全局函数无法查看局部函数的内部细节，但局部函数可以查看其上层的函数细节，直至全局细节
- 如果当前作用域没有找到属性或方法，会向上层作用域查找，直至全局函数，这种形式就是作用域链

**谈谈this对象的理解**

- this 总是指向函数的直接调用者
- 如果有 new 关键字，this 指向 new 出来的实例对象
- 在事件中，this指向触发这个事件的对象
- IE下 attachEvent 中的this总是指向全局对象Window

**eval是做什么的？**

**eval的功能是把对应的字符串解析成JS代码并运行**

- 应该避免使用eval，不安全，非常耗性能（先解析成js语句，再执行）
- 由JSON字符串转换为JSON对象的时候可以用 eval('('+ str +')');

**什么是 Window 对象? 什么是 Document 对象?**

- Window 对象表示当前浏览器的窗口，是JavaScript的顶级对象。
- 我们创建的所有对象、函数、变量都是 Window 对象的成员。
- Window 对象的方法和属性是在全局范围内有效的。
- Document 对象是 HTML 文档的根节点与所有其他节点（元素节点，文本节点，属性节点, 注释节点）
-  Document 对象使我们可以通过脚本对 HTML 页面中的所有元素进行访问
-  Document 对象是 Window 对象的一部分，可通过 window.document 属性对其进行访问

**介绍 DOM 的发展**

- DOM：文档对象模型（Document Object Model），定义了访问HTML和XML文档的标准，与编程语言及平台无关
- DOM0：提供了查询和操作Web文档的内容API。未形成标准，实现混乱。如：document.forms['login']
- DOM1：W3C提出标准化的DOM，简化了对文档中任意部分的访问和操作。如：JavaScript中的Document对象
- DOM2：原来DOM基础上扩充了鼠标事件等细分模块，增加了对CSS的支持。如：getComputedStyle(elem, pseudo)
- DOM3：增加了XPath模块和加载与保存（Load and Save）模块。如：XPathEvaluator

**介绍DOM0，DOM2，DOM3事件处理方式区别**

- DOM0级事件处理方式：
    - `btn.onclick = func;`
    - `btn.onclick = null;`
- DOM2级事件处理方式：
    - `btn.addEventListener('click', func, false);`
    - `btn.removeEventListener('click', func, false);`
    - `btn.attachEvent("onclick", func);`
    - `btn.detachEvent("onclick", func);`
- DOM3级事件处理方式：
    - `eventUtil.addListener(input, "textInput", func);`
    -  `eventUtil` 是自定义对象，`textInput` 是DOM3级事件

**事件的三个阶段**

- 捕获、目标、冒泡

**介绍事件“捕获”和“冒泡”执行顺序和事件的执行次数？**

- 按照W3C标准的事件：首是进入捕获阶段，直到达到目标元素，再进入冒泡阶段
- 事件执行次数（DOM2-addEventListener）：元素上绑定事件的个数
  - 注意1：前提是事件被确实触发
  - 注意2：事件绑定几次就算几个事件，即使类型和功能完全一样也不会“覆盖”
- 事件执行顺序：判断的关键是否目标元素
  - 非目标元素：根据W3C的标准执行：捕获->目标元素->冒泡（不依据事件绑定顺序）
  - 目标元素：依据事件绑定顺序：先绑定的事件先执行（不依据捕获冒泡标准）
  - 最终顺序：父元素捕获->目标元素事件1->目标元素事件2->子元素捕获->子元素冒泡->父元素冒泡
  - 注意：子元素事件执行前提    事件确实“落”到子元素布局区域上，而不是简单的具有嵌套关系

**在一个DOM上同时绑定两个点击事件：一个用捕获，一个用冒泡。事件会执行几次，先执行冒泡还是捕获？**

* 该DOM上的事件如果被触发，会执行两次（执行次数等于绑定次数）
* 如果该DOM是目标元素，则按事件绑定顺序执行，不区分冒泡/捕获
* 如果该DOM是处于事件流中的非目标元素，则先执行捕获，后执行冒泡


**事件的代理/委托**

* 事件委托是指将事件绑定目标元素的到父元素上，利用冒泡机制触发该事件
  * 优点：
    - 可以减少事件注册，节省大量内存占用
    - 可以将事件应用于动态添加的子元素上
  * 缺点：
    使用不当会造成事件在不应该触发时触发
  * 示例：

```
ulEl.addEventListener('click', function(e){
    var target = event.target || event.srcElement;
    if(!!target && target.nodeName.toUpperCase() === "LI"){
        console.log(target.innerHTML);
    }
}, false);
```

**IE与火狐的事件机制有什么区别？ 如何阻止冒泡？**

* IE只事件冒泡，不支持事件捕获；火狐同时支持件冒泡和事件捕获

**IE的事件处理和W3C的事件处理有哪些区别？**

* 绑定事件
  - W3C: targetEl.addEventListener('click', handler, false);
  - IE: targetEl.attachEvent('onclick', handler);

* 删除事件
  - W3C: targetEl.removeEventListener('click', handler, false);
  - IE: targetEl.detachEvent(event, handler);

* 事件对象
  - W3C: var e = arguments.callee.caller.arguments[0]
  - IE: window.event

* 事件目标
  - W3C: e.target
  - IE: window.event.srcElement

* 阻止事件默认行为
  - W3C: e.preventDefault()
  - IE: window.event.returnValue = false

* 阻止事件传播
  - W3C: e.stopPropagation()
  - IE: window.event.cancelBubble = true


**W3C事件的 target 与 currentTarget 的区别？**

* target 只会出现在事件流的目标阶段
* currentTarget 可能出现在事件流的任何阶段
* 当事件流处在目标阶段时，二者的指向相同
* 当事件流处于捕获或冒泡阶段时：currentTarget 指向当前事件活动的对象(一般为父级)

**如何派发事件(dispatchEvent)？（如何进行事件广播？）**

* W3C: 使用 dispatchEvent 方法
* IE: 使用 fireEvent 方法

```javascript
var fireEvent = function(element, event){
    if (document.createEventObject){
        var mockEvent = document.createEventObject();
        return element.fireEvent('on' + event, mockEvent)
    }else{
        var mockEvent = document.createEvent('HTMLEvents');
        mockEvent.initEvent(event, true, true);
        return !element.dispatchEvent(mockEvent);
    }
}
```

**什么是函数节流？介绍一下应用场景和原理？**


* 函数节流(throttle)是指阻止一个函数在很短时间间隔内连续调用。
只有当上一次函数执行后达到规定的时间间隔，才能进行下一次调用。
但要保证一个累计最小调用间隔（否则拖拽类的节流都将无连续效果）

* 函数节流用于 onresize, onscroll 等短时间内会多次触发的事件

* 函数节流的原理：使用定时器做时间节流。
当触发一个事件时，先用 setTimout 让这个事件延迟一小段时间再执行。
如果在这个时间间隔内又触发了事件，就 clearTimeout 原来的定时器，
再 setTimeout 一个新的定时器重复以上流程。

* 函数节流简单实现：

```javascript
function throttle(method, context) {
     clearTimeout(methor.tId);
     method.tId = setTimeout(function(){
         method.call(context);
     }， 100); // 两次调用至少间隔 100ms
}
// 调用
window.onresize = function(){
    throttle(myFunc, window);
}
```

**区分什么是“客户区坐标”、“页面坐标”、“屏幕坐标”？**

* 客户区坐标：鼠标指针在可视区中的水平坐标(clientX)和垂直坐标(clientY)
* 页面坐标：鼠标指针在页面布局中的水平坐标(pageX)和垂直坐标(pageY)
* 屏幕坐标：设备物理屏幕的水平坐标(screenX)和垂直坐标(screenY)

**如何获得一个DOM元素的绝对位置？**

* elem.offsetLeft：返回元素相对于其定位父级左侧的距离
* elem.offsetTop：返回元素相对于其定位父级顶部的距离
* elem.getBoundingClientRect()：返回一个DOMRect对象，包含一组描述边框的只读属性，单位像素

**分析 ['1', '2', '3'].map(parseInt) 答案是多少？**

- 答案:[1, NaN, NaN]
* parseInt(string, radix) 第2个参数 radix 表示进制。省略 radix 或 radix = 0，则数字将以十进制解析
* map 每次为 parseInt 传3个参数(elem, index, array)，其中 index 为数组索引
* 因此，map 遍历 ["1", "2", "3"]，相应 parseInt 接收参数如下

```
parseInt('1', 0);  // 1
parseInt('2', 1);  // NaN
parseInt('3', 2);  // NaN
```
-  所以，parseInt 参数 radix 不合法，导致返回值为 NaN

**new 操作符具体干了什么？**

- 创建实例对象，this 变量引用该对象，同时还继承了构造函数的原型
- 属性和方法被加入到 this 引用的对象中
- 新创建的对象由 this 所引用，并且最后隐式的返回 this

**用原生JavaScript的实现过什么功能吗？**

- 封装选择器、调用第三方API、设置和获取样式

**解释一下这段代码的意思吗？**

```javascript
  [].forEach.call($$("*"), function(el){
      el.style.outline = "1px solid #" + (~~(Math.random()*(1<<24))).toString(16);
  })
 ```
- 解释：获取页面所有的元素，遍历这些元素，为它们添加1像素随机颜色的轮廓(outline)
- 1. `$$(sel)` // $$函数被许多现代浏览器命令行支持，等价于 document.querySelectorAll(sel)
- 2. `[].forEach.call(NodeLists)` // 使用 call 函数将数组遍历函数 forEach 应到节点元素列表
- 3. `el.style.outline = "1px solid #333"` // 样式 outline 位于盒模型之外，不影响元素布局位置
- 4. `(1<<24)` // parseInt("ffffff", 16) == 16777215 == 2^24 - 1 // 1<<24 == 2^24 == 16777216
- 5. `Math.random()*(1<<24)` // 表示一个位于 0 到 16777216 之间的随机浮点数
- 6. `~~Math.random()*(1<<24)` // `~~` 作用相当于 parseInt 取整
- 7. `(~~(Math.random()*(1<<24))).toString(16)` // 转换为一个十六进制-


** JavaScript实现异步编程的方法？**

* 回调函数
* 事件监听
* 发布/订阅
* Promises对象
* Async函数[ES7]

**web开发中会话跟踪的方法有哪些**

- cookie
- session
- url重写
- 隐藏input
- ip地址

**介绍js的基本数据类型**

- Undefined、Null、Boolean、Number、String

**介绍js有哪些内置对象？**

- Object 是 JavaScript 中所有对象的父对象
- 数据封装类对象：Object、Array、Boolean、Number 和 String
- 其他对象：Function、Arguments、Math、Date、RegExp、Error





**说几条写JavaScript的基本规范？**

- 不要在同一行声明多个变量
- 请使用 ===/!==来比较true/false或者数值
- 使用对象字面量替代new Array这种形式
- 不要使用全局函数
- Switch语句必须带有default分支
- 函数不应该有时候有返回值，有时候没有返回值
- If语句必须使用大括号
- for-in循环中的变量 应该使用var关键字明确限定作用域，从而避免作用域污

**JavaScript原型，原型链 ? 有什么特点？**

- 每个对象都会在其内部初始化一个属性，就是prototype(原型)，当我们访问一个对象的属性时
- 如果这个对象内部不存在这个属性，那么他就会去prototype里找这个属性，这个prototype又会有自己的prototype，于是就这样一直找下去，也就是我们平时所说的原型链的概念
- 关系：`instance.constructor.prototype = instance.__proto__`
- 特点：
  - JavaScript对象是通过引用来传递的，我们创建的每个新对象实体中并没有一份属于自己的原型副本。当我们修改原型时，与之相关的对象也会继承这一改变。

-  当我们需要一个属性的时，Javascript引擎会先看当前对象中是否有这个属性， 如果没有的
-  就会查找他的Prototype对象是否有这个属性，如此递推下去，一直检索到 Object 内建对象

**JavaScript有几种类型的值？，你能画一下他们的内存图吗？**

- 栈：原始数据类型（Undefined，Null，Boolean，Number、String）
- 堆：引用数据类型（对象、数组和函数）

- 两种类型的区别是：存储位置不同；
- 原始数据类型直接存储在栈(stack)中的简单数据段，占据空间小、大小固定，属于被频繁使用数据，所以放入栈中存储；
- 引用数据类型存储在堆(heap)中的对象,占据空间大、大小不固定,如果存储在栈中，将会影响程序运行的性能；引用数据类型在栈中存储了指针，该指针指向堆中该实体的起始地址。当解释器寻找引用值时，会首先检索其
- 在栈中的地址，取得地址后从堆中获得实体

![](https://camo.githubusercontent.com/d1947e624a0444d1032a85800013df487adc5550/687474703a2f2f7777772e77337363686f6f6c2e636f6d2e636e2f692f63745f6a735f76616c75652e676966)

**Javascript如何实现继承？**

- 构造继承
- 原型继承
- 实例继承
- 拷贝继承

- 原型prototype机制或apply和call方法去实现较简单，建议使用构造函数与原型混合方式

```
 function Parent(){
        this.name = 'wang';
    }

    function Child(){
        this.age = 28;
    }
    Child.prototype = new Parent();//继承了Parent，通过原型

    var demo = new Child();
    alert(demo.age);
    alert(demo.name);//得到被继承的属性
  }
```

**javascript创建对象的几种方式？**

> javascript创建对象简单的说,无非就是使用内置对象或各种自定义对象，当然还可以用JSON；但写法有很多种，也能混合使用

- 对象字面量的方式

```
person={firstname:"Mark",lastname:"Yun",age:25,eyecolor:"black"};
```

- 用function来模拟无参的构造函数

```
 function Person(){}
    var person=new Person();//定义一个function，如果使用new"实例化",该function可以看作是一个Class
        person.name="Mark";
        person.age="25";
        person.work=function(){
        alert(person.name+" hello...");
    }
person.work();
```

- 用function来模拟参构造函数来实现（用this关键字定义构造的上下文属性）

```
function Pet(name,age,hobby){
       this.name=name;//this作用域：当前对象
       this.age=age;
       this.hobby=hobby;
       this.eat=function(){
          alert("我叫"+this.name+",我喜欢"+this.hobby+",是个程序员");
       }
    }
    var maidou =new Pet("麦兜",25,"coding");//实例化、创建对象
    maidou.eat();//调用eat方法
```

- 用工厂方式来创建（内置对象）

```
var wcDog =new Object();
     wcDog.name="旺财";
     wcDog.age=3;
     wcDog.work=function(){
       alert("我是"+wcDog.name+",汪汪汪......");
     }
     wcDog.work();
```

- 用原型方式来创建

```
function Dog(){

     }
     Dog.prototype.name="旺财";
     Dog.prototype.eat=function(){
     alert(this.name+"是个吃货");
     }
     var wangcai =new Dog();
     wangcai.eat();

```

- 用混合方式来创建

```
 function Car(name,price){
      this.name=name;
      this.price=price;
    }
     Car.prototype.sell=function(){
       alert("我是"+this.name+"，我现在卖"+this.price+"万元");
      }
    var camry =new Car("凯美瑞",27);
    camry.sell();
```

**Javascript作用链域?**

- 全局函数无法查看局部函数的内部细节，但局部函数可以查看其上层的函数细节，直至全局细节
- 当需要从局部函数查找某一属性或方法时，如果当前作用域没有找到，就会上溯到上层作用域查找
- 直至全局函数，这种组织形式就是作用域链

**谈谈This对象的理解**

- this总是指向函数的直接调用者（而非间接调用者）
- 如果有new关键字，this指向new出来的那个对象
- 在事件中，this指向触发这个事件的对象，特殊的是，IE中的attachEvent中的this总是指向全局对象Window


**eval是做什么的？**

- 它的功能是把对应的字符串解析成JS代码并运行
- 应该避免使用eval，不安全，非常耗性能（2次，一次解析成js语句，一次执行）
- 由JSON字符串转换为JSON对象的时候可以用eval，var obj =eval('('+ str +')')

**null，undefined 的区别？**

- undefined   表示不存在这个值。
- undefined :是一个表示"无"的原始值或者说表示"缺少值"，就是此处应该有一个值，但是还没有定义。当尝试读取时会返回 undefined
- 例如变量被声明了，但没有赋值时，就等于undefined

- null 表示一个对象被定义了，值为“空值”
- null : 是一个对象(空对象, 没有任何属性和方法)
- 例如作为函数的参数，表示该函数的参数不是对象；

-  在验证null时，一定要使用　=== ，因为 == 无法分别 null 和　undefined

**写一个通用的事件侦听器函数**

```
 // event(事件)工具集，来源：github.com/markyun
    markyun.Event = {
        // 页面加载完成后
        readyEvent : function(fn) {
            if (fn==null) {
                fn=document;
            }
            var oldonload = window.onload;
            if (typeof window.onload != 'function') {
                window.onload = fn;
            } else {
                window.onload = function() {
                    oldonload();
                    fn();
                };
            }
        },
        // 视能力分别使用dom0||dom2||IE方式 来绑定事件
        // 参数： 操作的元素,事件名称 ,事件处理程序
        addEvent : function(element, type, handler) {
            if (element.addEventListener) {
                //事件类型、需要执行的函数、是否捕捉
                element.addEventListener(type, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + type, function() {
                    handler.call(element);
                });
            } else {
                element['on' + type] = handler;
            }
        },
        // 移除事件
        removeEvent : function(element, type, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(type, handler, false);
            } else if (element.datachEvent) {
                element.detachEvent('on' + type, handler);
            } else {
                element['on' + type] = null;
            }
        },
        // 阻止事件 (主要是事件冒泡，因为IE不支持事件捕获)
        stopPropagation : function(ev) {
            if (ev.stopPropagation) {
                ev.stopPropagation();
            } else {
                ev.cancelBubble = true;
            }
        },
        // 取消事件的默认行为
        preventDefault : function(event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        },
        // 获取事件目标
        getTarget : function(event) {
            return event.target || event.srcElement;
        },
        // 获取event对象的引用，取到事件的所有信息，确保随时能使用event；
        getEvent : function(e) {
            var ev = e || window.event;
            if (!ev) {
                var c = this.getEvent.caller;
                while (c) {
                    ev = c.arguments[0];
                    if (ev && Event == ev.constructor) {
                        break;
                    }
                    c = c.caller;
                }
            }
            return ev;
        }
    };
```

**["1", "2", "3"].map(parseInt) 答案是多少？**

-  [1, NaN, NaN] 因为 parseInt 需要两个参数 (val, radix)，其中 radix 表示解析时用的基数。
-  map 传了 3 个 (element, index, array)，对应的 radix 不合法导致解析失败。

**事件是？IE与火狐的事件机制有什么区别？ 如何阻止冒泡？**

- 我们在网页中的某个操作（有的操作对应多个事件）。例如：当我们点击一个按钮就会产生一个事件。是可以被 JavaScript 侦测到的行为
- 事件处理机制：IE是事件冒泡、Firefox同时支持两种事件模型，也就是：捕获型事件和冒泡型事件
- ev.stopPropagation();（旧ie的方法 ev.cancelBubble = true;）

**什么是闭包（closure），为什么要用它？**

- 闭包是指有权访问另一个函数作用域中变量的函数，创建闭包的最常见的方式就是在一个函数内创建另一个函数，通过另一个函数访问这个函数的局部变量,利用闭包可以突破作用链域

- 闭包的特性：
  - 函数内再嵌套函数
  - 内部函数可以引用外层的参数和变量
  - 参数和变量不会被垃圾回收机制回收

**javascript 代码中的"use strict";是什么意思 ? 使用它区别是什么？**

- use strict是一种ECMAscript 5 添加的（严格）运行模式,这种模式使得 Javascript 在更严格的条件下运行,使JS编码更加规范化的模式,消除Javascript语法的一些不合理、不严谨之处，减少一些怪异行为

**如何判断一个对象是否属于某个类？**

```
// 使用instanceof （待完善）
   if(a instanceof Person){
       alert('yes');
   }
```

**new操作符具体干了什么呢?**

- 创建一个空对象，并且 this 变量引用该对象，同时还继承了该函数的原型
- 属性和方法被加入到 this 引用的对象中
- 新创建的对象由 this 所引用，并且最后隐式的返回 this

```
var obj  = {};
obj.__proto__ = Base.prototype;
Base.call(obj);
```



**js延迟加载的方式有哪些？**

- defer和async、动态创建DOM方式（用得最多）、按需异步载入js

**Ajax 是什么? 如何创建一个Ajax？**

> ajax的全称：Asynchronous Javascript And XML

- 异步传输+js+xml
- 所谓异步，在这里简单地解释就是：向服务器发送请求的时候，我们不必等待结果，而是可以同时做其他的事情，等到有了结果它自己会根据设定进行后续操作，与此同时，页面是不会发生整页刷新的，提高了用户体验

- 创建XMLHttpRequest对象,也就是创建一个异步调用对象
- 建一个新的HTTP请求,并指定该HTTP请求的方法、URL及验证信息
- 设置响应HTTP请求状态变化的函数
- 发送HTTP请求
- 获取异步调用返回的数据
- 用JavaScript和DOM实现局部刷新

**同步和异步的区别?**

- 同步：浏览器访问服务器请求，用户看得到页面刷新，重新发请求,等请求完，页面刷新，新内容出现，用户看到新内容,进行下一步操作
- 异步：浏览器访问服务器请求，用户正常操作，浏览器后端进行请求。等请求完，页面不刷新，新内容也会出现，用户看到新内容



**异步加载JS的方式有哪些？**

- defer，只支持IE
- async：
- 创建script，插入到DOM中，加载完毕后callBack


**documen.write和 innerHTML的区别**

- document.write只能重绘整个页面
- innerHTML可以重绘页面的一部分


**DOM操作——怎样添加、移除、移动、复制、创建和查找节点?**

- （1）创建新节点
  - createDocumentFragment() //创建一个DOM片段
  - createElement()   //创建一个具体的元素
  - createTextNode()   //创建一个文本节点
- （2）添加、移除、替换、插入
  - appendChild()
  - removeChild()
  - replaceChild()
  - insertBefore() //在已有的子节点前插入一个新的子节点
- （3）查找
  - getElementsByTagName()    //通过标签名称
  - getElementsByName()    // 通过元素的Name属性的值(IE容错能力较强，会得到一个数组，其中包括id等于name值的)
  - getElementById()    //通过元素Id，唯一性

**那些操作会造成内存泄漏？**

- 内存泄漏指任何对象在您不再拥有或需要它之后仍然存在
- 垃圾回收器定期扫描对象，并计算引用了每个对象的其他对象的数量。如果一个对象的引用数量为 0（没有其他对象引用过该对象），或对该对象的惟一引用是循环的，那么该对象的内存即可回收
- setTimeout 的第一个参数使用字符串而非函数的话，会引发内存泄漏
- 闭包、控制台日志、循环（在两个对象彼此引用且彼此保留时，就会产生一个循环）




**渐进增强和优雅降级**

- 渐进增强 ：针对低版本浏览器进行构建页面，保证最基本的功能，然后再针对高级浏览器进行效果、交互等改进和追加功能达到更好的用户体验。

- 优雅降级 ：一开始就构建完整的功能，然后再针对低版本浏览器进行兼容




**Javascript垃圾回收方法**

- 标记清除（mark and sweep）

> - 这是JavaScript最常见的垃圾回收方式，当变量进入执行环境的时候，比如函数中声明一个变量，垃圾回收器将其标记为“进入环境”，当变量离开环境的时候（函数执行结束）将其标记为“离开环境”
> - 垃圾回收器会在运行的时候给存储在内存中的所有变量加上标记，然后去掉环境中的变量以及被环境中变量所引用的变量（闭包），在这些完成之后仍存在标记的就是要删除的变量了

**引用计数(reference counting)**

> 在低版本IE中经常会出现内存泄露，很多时候就是因为其采用引用计数方式进行垃圾回收。引用计数的策略是跟踪记录每个值被使用的次数，当声明了一个 变量并将一个引用类型赋值给该变量的时候这个值的引用次数就加1，如果该变量的值变成了另外一个，则这个值得引用次数减1，当这个值的引用次数变为0的时 候，说明没有变量在使用，这个值没法被访问了，因此可以将其占用的空间回收，这样垃圾回收器会在运行的时候清理掉引用次数为0的值占用的空间

**js继承方式及其优缺点**

- 原型链继承的缺点
  - 一是字面量重写原型会中断关系，使用引用类型的原型，并且子类型还无法给超类型传递参数。

- 借用构造函数（类式继承）
  - 借用构造函数虽然解决了刚才两种问题，但没有原型，则复用无从谈起。所以我们需要原型链+借用构造函数的模式，这种模式称为组合继承

- 组合式继承
  - 组合式继承是比较常用的一种继承方法，其背后的思路是使用原型链实现对原型属性和方法的继承，而通过借用构造函数来实现对实例属性的继承。这样，既通过在原型上定义方法实现了函数复用，又保证每个实例都有它自己的属性。

**defer和async**

- defer并行加载js文件，会按照页面上script标签的顺序执行async并行加载js文件，下载完成立即执行，不会按照页面上script标签的顺序执行

**用过哪些设计模式？**

- 工厂模式：
  - 主要好处就是可以消除对象间的耦合，通过使用工程方法而不是new关键字。将所有实例化的代码集中在一个位置防止代码重复
  - 工厂模式解决了重复实例化的问题 ，但还有一个问题,那就是识别问题，因为根本无法 搞清楚他们到底是哪个对象的实例
```
function createObject(name,age,profession){//集中实例化的函数var obj = new Object();
    obj.name = name;
    obj.age = age;
    obj.profession = profession;
    obj.move = function () {
        return this.name + ' at ' + this.age + ' engaged in ' + this.profession;
    };
    return obj;
}
var test1 = createObject('trigkit4',22,'programmer');//第一个实例var test2 = createObject('mike',25,'engineer');//第二个实例

```

- 构造函数模式
  - 使用构造函数的方法 ，即解决了重复实例化的问题 ，又解决了对象识别的问题，该模式与工厂模式的不同之处在于

- 构造函数方法没有显示的创建对象 (new Object());

- 直接将属性和方法赋值给 this 对象;

- 没有 renturn 语句

**说说你对闭包的理解**

- 使用闭包主要是为了设计私有的方法和变量。闭包的优点是可以避免全局变量的污染，缺点是闭包会常驻内存，会增大内存使用量，使用不当很容易造成内存泄露。在js中，函数即闭包，只有函数才会产生作用域的概念

- 闭包有三个特性：
  - 1.函数嵌套函数

  - 2.函数内部可以引用外部的参数和变量

  - 3.参数和变量不会被垃圾回收机制回收



**请解释一下 JavaScript 的同源策略**

- 概念:同源策略是客户端脚本（尤其是Javascript）的重要的安全度量标准。它最早出自Netscape Navigator2.0，其目的是防止某个文档或脚本从多个不同源装载。这里的同源策略指的是：协议，域名，端口相同，同源策略是一种安全协议
- 指一段脚本只能读取来自同一来源的窗口和文档的属性

**为什么要有同源限制？**

- 我们举例说明：比如一个黑客程序，他利用Iframe把真正的银行登录页面嵌到他的页面上，当你使用真实的用户名，密码登录时，他的页面就可以通过Javascript读取到你的表单中input中的内容，这样用户名，密码就轻松到手了。
- 缺点
  - 现在网站的JS都会进行压缩，一些文件用了严格模式，而另一些没有。这时这些本来是严格模式的文件，被 merge后，这个串就到了文件的中间，不仅没有指示严格模式，反而在压缩后浪费了字节

**实现一个函数clone，可以对JavaScript中的5种主要的数据类型（包括Number、String、Object、Array、Boolean）进行值复制**

```
Object.prototype.clone = function(){

            var o = this.constructor === Array ? [] : {};

            for(var e in this){

                    o[e] = typeof this[e] === "object" ? this[e].clone() : this[e];

            }

            return o;
    }

```

**说说严格模式的限制**

  - 严格模式主要有以下限制：

  - 变量必须声明后再使用

  - 函数的参数不能有同名属性，否则报错

  - 不能使用with语句

  - 不能对只读属性赋值，否则报错

  - 不能使用前缀0表示八进制数，否则报错

  - 不能删除不可删除的属性，否则报错

  - 不能删除变量delete prop，会报错，只能删除属性delete global[prop]

  - eval不会在它的外层作用域引入变量

  - eval和arguments不能被重新赋值

  - arguments不会自动反映函数参数的变化

  - 不能使用arguments.callee

  - 不能使用arguments.caller

  - 禁止this指向全局对象

  - 不能使用fn.caller和fn.arguments获取函数调用的堆栈

  - 增加了保留字（比如protected、static和interface）

**如何删除一个cookie**

- 将时间设为当前时间往前一点

```
var date = new Date();

date.setDate(date.getDate() - 1);//真正的删除
```
setDate()方法用于设置一个月的某一天

- expires的设置

```
  document.cookie = 'user='+ encodeURIComponent('name')  + ';expires = ' + new Date(0)
```


**编写一个方法 求一个字符串的字节长度**

- 假设：一个英文字符占用一个字节，一个中文字符占用两个字节

```
function GetBytes(str){

        var len = str.length;

        var bytes = len;

        for(var i=0; i<len; i++){

            if (str.charCodeAt(i) > 255) bytes++;

        }

        return bytes;

    }

alert(GetBytes("你好,as"));

```

**请解释什么是事件代理**

- 事件代理（Event Delegation），又称之为事件委托。是 JavaScript 中常用绑定事件的常用技巧。顾名思义，“事件代理”即是把原本需要绑定的事件委托给父元素，让父元素担当事件监听的职务。事件代理的原理是DOM元素的事件冒泡。使用事件代理的好处是可以提高性能

**attribute和property的区别是什么？**

- attribute是dom元素在文档中作为html标签拥有的属性；
- property就是dom元素在js中作为对象拥有的属性。

- 对于html的标准属性来说，attribute和property是同步的，是会自动更新的
- 但是对于自定义的属性来说，他们是不同步的

**页面编码和被请求的资源编码如果不一致如何处理？**

 * 后端响应头设置 charset
 * 前端页面`<meta>`设置 charset


**把`<script>`放在`</body>`之前和之后有什么区别？浏览器会如何解析它们？**

 * 按照HTML标准，在`</body>`结束后出现`<script>`或任何元素的开始标签，都是解析错误
 * 虽然不符合HTML标准，但浏览器会自动容错，使实际效果与写在`</body>`之前没有区别
 * 浏览器的容错机制会忽略`<script>`之前的`</body>`，视作`<script>`仍在 body 体内。省略`</body>`和`</html>`闭合标签符合HTML标准，服务器可以利用这一标准尽可能少输出内容

**延迟加载JS的方式有哪些？**

* 设置`<script>`属性 defer="defer" （脚本将在页面完成解析时执行）
* 动态创建 script DOM：document.createElement('script');
* XmlHttpRequest 脚本注入
* 延迟加载工具 LazyLoad

**异步加载JS的方式有哪些？**

* 设置`<script>`属性 async="async" （一旦脚本可用，则会异步执行）
* 动态创建 script DOM：document.createElement('script');
* XmlHttpRequest 脚本注入
* 异步加载库 LABjs
* 模块加载器 Sea.js

**JavaScript 中，调用函数有哪几种方式？**

* 方法调用模式          Foo.foo(arg1, arg2);
* 函数调用模式          foo(arg1, arg2);
* 构造器调用模式        (new Foo())(arg1, arg2);
* call/applay调用模式   Foo.foo.call(that, arg1, arg2);
* bind调用模式          Foo.foo.bind(that)(arg1, arg2)();


**简单实现 Function.bind 函数？**

```javascript
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(that) {
      var func = this, args = arguments;
      return function() {
        return func.apply(that, Array.prototype.slice.call(args, 1));
      }
    }
  }
  // 只支持 bind 阶段的默认参数：
  func.bind(that, arg1, arg2)();

  // 不支持以下调用阶段传入的参数：
  func.bind(that)(arg1, arg2);
```

** 列举一下JavaScript数组和对象有哪些原生方法？**

* 数组：
    - arr.concat(arr1, arr2, arrn);
    - arr.join(",");
    - arr.sort(func);
    - arr.pop();
    - arr.push(e1, e2, en);
    - arr.shift();
    - unshift(e1, e2, en);
    - arr.reverse();
    - arr.slice(start, end);
    - arr.splice(index, count, e1, e2, en);
    - arr.indexOf(el);
    - arr.includes(el);   // ES6

* 对象：
    -  object.hasOwnProperty(prop);
    -  object.propertyIsEnumerable(prop);
    -  object.valueOf();
    -  object.toString();
    -  object.toLocaleString();
    -  Class.prototype.isPropertyOf(object);

**Array.splice() 与 Array.splice() 的区别？**

* slice -- “读取”数组指定的元素，不会对原数组进行修改
  - 语法：arr.slice(start, end)
  - start 指定选取开始位置（含）
  - end 指定选取结束位置（不含）

 * splice
   - “操作”数组指定的元素，会修改原数组，返回被删除的元素
   - 语法：arr.splice(index, count, [insert Elements])
   - index 是操作的起始位置
   - count = 0 插入元素，count > 0 删除元素
   - [insert Elements] 向数组新插入的元素

**JavaScript 对象生命周期的理解？**

* 当创建一个对象时，JavaScript 会自动为该对象分配适当的内存
* 垃圾回收器定期扫描对象，并计算引用了该对象的其他对象的数量
* 如果被引用数量为 0，或惟一引用是循环的，那么该对象的内存即可回收

**哪些操作会造成内存泄漏？**

-  JavaScript 内存泄露指对象在不需要使用它时仍然存在，导致占用的内存不能使用或回收

- 未使用 var 声明的全局变量
- 闭包函数(Closures)
- 循环引用(两个对象相互引用)
- 控制台日志(console.log)
- 移除存在绑定事件的DOM元素(IE)

## JQuery
**你觉得jQuery或zepto源码有哪些写的好的地方**

- jquery源码封装在一个匿名函数的自执行环境中，有助于防止变量的全局污染，然后通过传入window对象参数，可以使window对象作为局部变量使用，好处是当jquery中访问window对象的时候，就不用将作用域链退回到顶层作用域了，从而可以更快的访问window对象。同样，传入undefined参数，可以缩短查找undefined时的作用域链

```
 (function( window, undefined ) {

         //用一个函数域包起来，就是所谓的沙箱

         //在这里边var定义的变量，属于这个函数域内的局部变量，避免污染全局

         //把当前沙箱需要的外部变量通过函数参数引入进来

         //只要保证参数对内提供的接口的一致性，你还可以随意替换传进来的这个参数

        window.jQuery = window.$ = jQuery;

    })( window );
```

- jquery将一些原型属性和方法封装在了jquery.prototype中，为了缩短名称，又赋值给了jquery.fn，这是很形象的写法
- 有一些数组或对象的方法经常能使用到，jQuery将其保存为局部变量以提高访问速度
- jquery实现的链式调用可以节约代码，所返回的都是同一个对象，可以提高代码效率


**jQuery 的实现原理？**

- `(function(window, undefined) {})(window);`
- jQuery 利用 JS 函数作用域的特性，采用立即调用表达式包裹了自身，解决命名空间和变量污染问题

- `window.jQuery = window.$ = jQuery;`
- 在闭包当中将 jQuery 和 $ 绑定到 window 上，从而将 jQuery 和 $ 暴露为全局变量

**jQuery.fn 的 init 方法返回的 this 指的是什么对象？ 为什么要返回 this？**

* jQuery.fn 的 init 方法 返回的 this 就是 jQuery 对象
* 用户使用 jQuery() 或 $() 即可初始化 jQuery 对象，不需要动态的去调用 init 方法

**jQuery.extend 与 jQuery.fn.extend 的区别？**

* `$.fn.extend()` 和 `$.extend()` 是 jQuery 为扩展插件提拱了两个方法
* `$.extend(object)`; // 为jQuery添加“静态方法”（工具方法）

``` js
$.extend({
　　min: function(a, b) { return a < b ? a : b; },
　　max: function(a, b) { return a > b ? a : b; }
});
$.min(2,3); //  2
$.max(4,5); //  5
```

* `$.extend([true,] targetObject, object1[, object2]);` // 对targt对象进行扩展

``` js
var settings = {validate:false, limit:5};
var options = {validate:true, name:"bar"};
$.extend(settings, options);  // 注意：不支持第一个参数传 false
// settings == {validate:true, limit:5, name:"bar"}
```

* `$.fn.extend(json);` // 为jQuery添加“成员函数”（实例方法）

``` js
$.fn.extend({
   alertValue: function() {
      $(this).click(function(){
        alert($(this).val());
      });
   }
});

$("#email").alertValue();
```

**jQuery 的属性拷贝(extend)的实现原理是什么，如何实现深拷贝？**

- 浅拷贝（只复制一份原始对象的引用）
`var newObject = $.extend({}, oldObject);`

- 深拷贝（对原始对象属性所引用的对象进行进行递归拷贝）
`var newObject = $.extend(true, {}, oldObject);`

**jQuery 的队列是如何实现的？队列可以用在哪些地方？**

* jQuery 核心中有一组队列控制方法，由 queue()/dequeue()/clearQueue() 三个方法组成。
* 主要应用于 animate()，ajax，其他要按时间顺序执行的事件中

``` javascript
var func1 = function(){alert('事件1');}
var func2 = function(){alert('事件2');}
var func3 = function(){alert('事件3');}
var func4 = function(){alert('事件4');}

// 入栈队列事件
$('#box').queue("queue1", func1);  // push func1 to queue1
$('#box').queue("queue1", func2);  // push func2 to queue1

// 替换队列事件
$('#box').queue("queue1", []);  // delete queue1 with empty array
$('#box').queue("queue1", [func3, func4]);  // replace queue1

// 获取队列事件（返回一个函数数组）
$('#box').queue("queue1");  // [func3(), func4()]

// 出栈队列事件并执行
$('#box').dequeue("queue1"); // return func3 and do func3
$('#box').dequeue("queue1"); // return func4 and do func4

// 清空整个队列
$('#box').clearQueue("queue1"); // delete queue1 with clearQueue
```

**jQuery 中的 bind(), live(), delegate(), on()的区别？**


* bind 直接绑定在目标元素上
* live 通过冒泡传播事件，默认document上，支持动态数据
* delegate 更精确的小范围使用事件代理，性能优于 live
* on 是最新的1.9版本整合了之前的三种方式的新事件绑定机制

**是否知道自定义事件？ jQuery 里的 fire 函数是什么意思，什么时候用？**

* 事件即“发布/订阅”模式，自定义事件即“消息发布”，事件的监听即“订阅订阅”
* JS 原生支持自定义事件，示例：

```javascript
  document.createEvent(type); // 创建事件
  event.initEvent(eventType, canBubble, prevent); // 初始化事件
  target.addEventListener('dataavailable', handler, false); // 监听事件
  target.dispatchEvent(e);  // 触发事件
```

- jQuery 里的 fire 函数用于调用 jQuery 自定义事件列表中的事件


**jQuery 通过哪个方法和 Sizzle 选择器结合的？**


* Sizzle 选择器采取 Right To Left 的匹配模式，先搜寻所有匹配标签，再判断它的父节点
* jQuery 通过 $(selecter).find(selecter); 和 Sizzle 选择器结合

**jQuery 中如何将数组转化为 JSON 字符串，然后再转化回来？**

```javascript
// 通过原生 JSON.stringify/JSON.parse 扩展 jQuery 实现
 $.array2json = function(array) {
    return JSON.stringify(array);
 }

 $.json2array = function(array) {
    // $.parseJSON(array); // 3.0 开始，已过时
    return JSON.parse(array);
 }

 // 调用
 var json = $.array2json(['a', 'b', 'c']);
 var array = $.json2array(json);
```

**jQuery 一个对象可以同时绑定多个事件，这是如何实现的？**

```javascript
  $("#btn").on("mouseover mouseout", func);

  $("#btn").on({
      mouseover: func1,
      mouseout: func2,
      click: func3
  });
```

**针对 jQuery 的优化方法？**

* 缓存频繁操作DOM对象
* 尽量使用id选择器代替class选择器
* 总是从#id选择器来继承
* 尽量使用链式操作
* 使用时间委托 on 绑定事件
* 采用jQuery的内部函数data()来存储数据
* 使用最新版本的 jQuery

**jQuery 的 slideUp 动画，当鼠标快速连续触发, 动画会滞后反复执行，该如何处理呢?**

* 在触发元素上的事件设置为延迟处理：使用 JS 原生 setTimeout 方法
* 在触发元素的事件时预先停止所有的动画，再执行相应的动画事件：$('.tab').stop().slideUp();

**jQuery UI 如何自定义组件？**

- 通过向 $.widget() 传递组件名称和一个原型对象来完成
- `$.widget("ns.widgetName", [baseWidget], widgetPrototype);`

**jQuery 与 jQuery UI、jQuery Mobile 区别？**

* jQuery 是 JS 库，兼容各种PC浏览器，主要用作更方便地处理 DOM、事件、动画、AJAX

* jQuery UI 是建立在 jQuery 库上的一组用户界面交互、特效、小部件及主题

* jQuery Mobile 以 jQuery 为基础，用于创建“移动Web应用”的框架

**jQuery 和 Zepto 的区别？ 各自的使用场景？**


* jQuery 主要目标是PC的网页中，兼容全部主流浏览器。在移动设备方面，单独推出 jQuery Mobile
* Zepto 从一开始就定位移动设备，相对更轻量级。它的 API 基本兼容 jQuery，但对PC浏览器兼容不理想

## Ajax

- 什么是` Ajax`? 如何创建一个`Ajax`？

* `AJAX(Asynchronous Javascript And XML) `= 异步 `JavaScript` + `XML` 在后台与服务器进行异步数据交换，不用重载整个网页，实现局部刷新。

* 创建 `ajax` 步骤：
  - 1.创建 `XMLHttpRequest` 对象
  - 2.创建一个新的 `HTTP` 请求，并指定该 `HTTP` 请求的类型、验证信息
  - 3.设置响应 `HTTP` 请求状态变化的回调函数
  - 4.发送 `HTTP` 请求
  - 5.获取异步调用返回的数据
  - 6.使用 `JavaScript` 和 `DOM` 实现局部刷新

```js
var xhr = new XMLHttpRequest();
xhr.open("POST", url, true);
xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
        fn.call(this, xhr.responseText);
    }
};
xhr.send(data);
```

## HTTP

**http状态码有那些？分别代表是什么意思？**

```
 简单版
    [
        100  Continue   继续，一般在发送post请求时，已发送了http header之后服务端将返回此信息，表示确认，之后发送具体参数信息
        200  OK         正常返回信息
        201  Created    请求成功并且服务器创建了新的资源
        202  Accepted   服务器已接受请求，但尚未处理
        301  Moved Permanently  请求的网页已永久移动到新位置。
        302 Found       临时性重定向。
        303 See Other   临时性重定向，且总是使用 GET 请求新的 URI。
        304  Not Modified 自从上次请求后，请求的网页未修改过。

        400 Bad Request  服务器无法理解请求的格式，客户端不应当尝试再次使用相同的内容发起请求。
        401 Unauthorized 请求未授权。
        403 Forbidden   禁止访问。
        404 Not Found   找不到如何与 URI 相匹配的资源。

        500 Internal Server Error  最常见的服务器端错误。
        503 Service Unavailable 服务器端暂时无法处理请求（可能是过载或维护）。
    ]
```

**一个页面从输入 URL 到页面加载显示完成，这个过程中都发生了什么？（流程说的越详细越好）**


- 注：这题胜在区分度高，知识点覆盖广，再不懂的人，也能答出几句，
- 而高手可以根据自己擅长的领域自由发挥，从URL规范、HTTP协议、DNS、CDN、数据库查询、
- 到浏览器流式解析、CSS规则构建、layout、paint、onload/domready、JS执行、JS API绑定等等；

- 详细版：
    - 浏览器会开启一个线程来处理这个请求，对 URL 分析判断如果是 http 协议就按照 Web 方式来处理;
    - 调用浏览器内核中的对应方法，比如 WebView 中的 loadUrl 方法;
    - 通过DNS解析获取网址的IP地址，设置 UA 等信息发出第二个GET请求;
    - 进行HTTP协议会话，客户端发送报头(请求报头);
    - 进入到web服务器上的 Web Server，如 Apache、Tomcat、Node.JS 等服务器;
    - 进入部署好的后端应用，如 PHP、Java、JavaScript、Python 等，找到对应的请求处理;
    - 处理结束回馈报头，此处如果浏览器访问过，缓存上有对应资源，会与服务器最后修改时间对比，一致则返回304;
    - 浏览器开始下载html文档(响应报头，状态码200)，同时使用缓存;
    - 文档树建立，根据标记请求所需指定MIME类型的文件（比如css、js）,同时设置了cookie;
    - 页面开始渲染DOM，JS根据DOM API操作DOM,执行事件绑定等，页面显示完成。

- 简洁版：
    - 浏览器根据请求的URL交给DNS域名解析，找到真实IP，向服务器发起请求；
    - 服务器交给后台处理完成后返回数据，浏览器接收文件（HTML、JS、CSS、图象等）；
    - 浏览器对加载到的资源（HTML、JS、CSS等）进行语法解析，建立相应的内部数据结构（如HTML的DOM）；
    - 载入解析到的资源文件，渲染页面，完成。

**说说TCP传输的三次握手四次挥手策略**

- 为了准确无误地把数据送达目标处，TCP协议采用了三次握手策略。用TCP协议把数据包送出去后，TCP不会对传送 后的情况置之不理，它一定会向对方确认是否成功送达。握手过程中使用了TCP的标志：SYN和ACK

- 发送端首先发送一个带SYN标志的数据包给对方。接收端收到后，回传一个带有SYN/ACK标志的数据包以示传达确认信息。 最后，发送端再回传一个带ACK标志的数据包，代表“握手”结束。 若在握手过程中某个阶段莫名中断，TCP协议会再次以相同的顺序发送相同的数据包

**断开一个TCP连接则需要“四次握手”：**

- 第一次挥手：主动关闭方发送一个FIN，用来关闭主动方到被动关闭方的数据传送，也就是主动关闭方告诉被动关闭方：我已经不 会再给你发数据了(当然，在fin包之前发送出去的数据，如果没有收到对应的ack确认报文，主动关闭方依然会重发这些数据)，但是，此时主动关闭方还可 以接受数据

- 第二次挥手：被动关闭方收到FIN包后，发送一个ACK给对方，确认序号为收到序号+1（与SYN相同，一个FIN占用一个序号）

- 第三次挥手：被动关闭方发送一个FIN，用来关闭被动关闭方到主动关闭方的数据传送，也就是告诉主动关闭方，我的数据也发送完了，不会再给你发数据了

- 第四次挥手：主动关闭方收到FIN后，发送一个ACK给被动关闭方，确认序号为收到序号+1，至此，完成四次挥手

**TCP和UDP的区别**

- TCP（Transmission Control Protocol，传输控制协议）是基于连接的协议，也就是说，在正式收发数据前，必须和对方建立可靠的连接。一个TCP连接必须要经过三次“对话”才能建立起来

- UDP（User Data Protocol，用户数据报协议）是与TCP相对应的协议。它是面向非连接的协议，它不与对方建立连接，而是直接就把数据包发送过去！ UDP适用于一次只传送少量数据、对可靠性要求不高的应用环境



**HTTP和HTTPS**

- HTTP协议通常承载于TCP协议之上，在HTTP和TCP之间添加一个安全协议层（SSL或TSL），这个时候，就成了我们常说的HTTPS
- 默认HTTP的端口号为80，HTTPS的端口号为443

**为什么HTTPS安全**

- 因为网络请求需要中间有很多的服务器路由器的转发。中间的节点都可能篡改信息，而如果使用HTTPS，密钥在你和终点站才有。https之所以比http安全，是因为他利用ssl/tls协议传输。它包含证书，卸载，流量转发，负载均衡，页面适配，浏览器适配，refer传递等。保障了传输过程的安全性

**关于Http 2.0 你知道多少？**

- HTTP/2引入了“服务端推（server push）”的概念，它允许服务端在客户端需要数据之前就主动地将数据发送到客户端缓存中，从而提高性能。

- HTTP/2提供更多的加密支持

- HTTP/2使用多路技术，允许多个消息在一个连接上同时交差。

- 它增加了头压缩（header compression），因此即使非常小的请求，其请求和响应的header都只会占用很小比例的带宽

**GET和POST的区别，何时使用POST？**

-  GET：一般用于信息获取，使用URL传递参数，对所发送信息的数量也有限制，一般在2000个字符
-  POST：一般用于修改服务器上的资源，对所发送的信息没有限制。
-  GET方式需要使用Request.QueryString来取得变量的值，而POST方式通过Request.Form来获取变量的值，也就是说Get是通过地址栏来传值，而Post是通过提交表单来传值。
-  然而，在以下情况中，请使用 POST 请求：
   - 无法使用缓存文件（更新服务器上的文件或数据库）

   - 向服务器发送大量数据（POST 没有数据量限制）

   - 发送包含未知字符的用户输入时，POST 比 GET 更稳定也更可靠



**说说网络分层里七层模型是哪七层**

  - 应用层：应用层、表示层、会话层（从上往下）（HTTP、FTP、SMTP、DNS）

  - 传输层（TCP和UDP）

  - 网络层（IP）

  - 物理和数据链路层（以太网）

- 每一层的作用如下：

  - 物理层：通过媒介传输比特,确定机械及电气规范（比特Bit）
数据链路层：将比特组装成帧和点到点的传递（帧Frame）
  - 网络层：负责数据包从源到宿的传递和网际互连（包PackeT）
  - 传输层：提供端到端的可靠报文传递和错误恢复（段Segment）
  - 会话层：建立、管理和终止会话（会话协议数据单元SPDU）
  - 表示层：对数据进行翻译、加密和压缩（表示协议数据单元PPDU）
  - 应用层：允许访问OSI环境的手段（应用协议数据单元APDU）

**讲讲304缓存的原理**

- 服务器首先产生ETag，服务器可在稍后使用它来判断页面是否已经被修改。本质上，客户端通过将该记号传回服务器要求服务器验证其（客户端）缓存
- 304是HTTP状态码，服务器用来标识这个文件没修改，不返回内容，浏览器在接收到个状态码后，会使用浏览器已缓存的文件
- 客户端请求一个页面（A）。 服务器返回页面A，并在给A加上一个ETag。 客户端展现该页面，并将页面连同ETag一起缓存。 客户再次请求页面A，并将上次请求时服务器返回的ETag一起传递给服务器。 服务器检查该ETag，并判断出该页面自上次客户端请求之后还未被修改，直接返回响应304（未修改——Not Modified）和一个空的响应体

**HTTP/2 与 HTTP/1.x 的关键区别**

  * 二进制协议代替文本协议，更加简洁高效
  * 针对每个域只使用一个多路复用的连接
  * 压缩头部信息减小开销
  * 允许服务器主动推送应答到客户端的缓存中

**一个页面从输入 URL 到页面加载显示完成，这个过程中都发生了什么？**

- 01.浏览器查找域名对应的IP地址(DNS 查询：浏览器缓存->系统缓存->路由器缓存->ISP DNS 缓存->根域名服务器)
- 02.浏览器向 Web 服务器发送一个 HTTP 请求（TCP三次握手）
- 03.服务器 301 重定向（从 http://example.com 重定向到 http://www.example.com）
- 04.浏览器跟踪重定向地址，请求另一个带 www 的网址
- 05.服务器处理请求（通过路由读取资源）
- 06.服务器返回一个 HTTP 响应（报头中把 Content-type 设置为 'text/html'）
- 07.浏览器进 DOM 树构建
- 08.浏览器发送请求获取嵌在 HTML 中的资源（如图片、音频、视频、CSS、JS等）
- 09.浏览器显示完成页面
- 10.浏览器发送异步请求

## 前端工程化相关
**什么是单页面应用(SPA)？**

* 单页面应用(SPA)是指用户在浏览器加载单一的HTML页面，后续请求都无需再离开此页
* 目标：旨在用为用户提供了更接近本地移动APP或桌面应用程序的体验。

* 流程：第一次请求时，将导航页传输到客户端，其余请求通过 REST API 获取 JSON 数据
* 实现：数据的传输通过 Web Socket API 或 RPC(远程过程调用)。

* 优点：用户体验流畅，服务器压力小，前后端职责分离
* 缺点：关键词布局难度加大，不利于 SEO

**什么是“前端路由”? 什么时候适用“前端路由”? 有哪些优点和缺点?**

* 前端路由通过 URL 和 History 来实现页面切换
* 应用：前端路由主要适用于“前后端分离”的单页面应用(SPA)项目
* 优点：用户体验好，交互流畅
* 缺点：浏览器“前进”、“后退”会重新请求，无法合理利用缓存

**模块化开发怎么做？**

* 封装对象作为命名空间 -- 内部状态可以被外部改写
* 立即执行函数(IIFE) -- 需要依赖多个JS文件，并且严格按顺序加载
* 使用模块加载器 -- require.js, sea.js, EC6 模块

**通行的 Javascript 模块的规范有哪些？**

* CommonJS -- 主要用在服务器端 node.js

```javascript
var math = require('./math');
math.add(2,3);
```

* AMD(异步模块定义) -- require.js

```javascript
require(['./math'], function (math) {
    math.add(2, 3);
});
```

* CMD(通用模块定义) -- sea.js
```javascript
var math = require('./math');
math.add(2,3);
```

* ES6 模块


```javascript
import {math} from './math';
math.add(2, 3);
```

**AMD 与 CMD 规范的区别？**


* 规范化产出：
  - AMD 由 RequireJS 推广产出
  - CMD 由 SeaJS 推广产出

* 模块的依赖:
  - AMD 提前执行，推崇依赖前置
  - CMD 延迟执行，推崇依赖就近

* API 功能:
  - AMD 的 API 默认多功能（分全局 require 和局部 require）
  - CMD 的 API 推崇职责单一纯粹（没有全局 require）

 * 模块定义规则：
   - AMD 默认一开始就载入全部依赖模块


```javascript
  define(['./a', './b'], function(a, b) {
      a.doSomething();
      b.doSomething();
  });
```

- CMD 依赖模块在用到时才就近载入

```javascript
  define(function(require, exports, module) {
      var a = require('./a');
      a.doSomething();
      var b = require('./b');
      b.doSomething();
  })
```

**requireJS的核心原理是什么？**

- 每个模块所依赖模块都会比本模块预先加载

**对 Node.js 的优点、缺点提出了自己的看法？ Node.js的特点和适用场景？**

* Node.js的特点：单线程，非阻塞I/O，事件驱动
* Node.js的优点：擅长处理高并发；适合I/O密集型应用

- Node.js的缺点：不适合CPU密集运算；不能充分利用多核CPU；可靠性低，某个环节出错会导致整个系统崩溃

 - Node.js的适用场景：
    - RESTful API
    - 实时应用：在线聊天、图文直播
    - 工具类应用：前端部署(npm, gulp)
    - 表单收集：问卷系统

**如何判断当前脚本运行在浏览器还是node环境中？**

- 判断 Global 对象是否为 window，如果不为 window，当前脚本没有运行在浏览器中

**什么是 npm ？**

- npm 是 Node.js 的模块管理和发布工具

**什么是 WebKit ？**

* WebKit 是一个开源的浏览器内核，由渲染引擎(WebCore)和JS解释引擎(JSCore)组成
* 通常所说的 WebKit 指的是 WebKit(WebCore)，主要工作是进行 HTML/CSS 渲染
* WebKit 一直是 Safari 和 Chrome(之前) 使用的浏览器内核，后来 Chrome 改用Blink 内核

**如何测试前端代码? 知道 Unit Test，BDD, TDD 么? 怎么测试你的前端工程(mocha, jasmin..)?**

* 通过为前端代码编写单元测试(Unit Test)来测试前端代码
* Unit Test：一段用于测试一个模块或接口是否能达到预期结果的代码
* BDD：行为驱动开发 -- 业务需求描述产出产品代码的开发方法
* TDD：测试驱动开发 -- 单元测试用例代码产出产品代码的开发方法
* 单元测试框架：


```javascript
// mocha 示例
describe('Test add', function() {
  it('1 + 2 = 3', function() {
      expect(add(1, 2)).to.be.equal(3);
  });
});

// jasmin 示例
describe('Test add', function () {
    it('1 + 2 = 3', function () {
        expect(add(1, 2)).toEqual(3);
    });
});
```

**介绍你知道的前端模板引擎？**

-  artTemplate, underscore, handlebars

**什么是 Modernizr？ Modernizr 工作原理？**

* Modernizr 是一个开源的 JavaScript 库，用于检测用户浏览器对 HTML5 与 CSS3 的支持情况

**移动端最小触控区域是多大？**

- 44 * 44 px

**移动端的点击事件的延迟时间是多长，为什么会有延迟？ 如何解决这个延时？**

* 移动端 click 有 300ms 延迟，浏览器为了区分“双击”（放大页面）还是“单击”而设计
* 解决方案：
  - 禁用缩放(对safari无效)
  - 使用指针事件(IE私有特性，且仅IE10+)
  - 使用 Zepto 的 tap 事件(有点透BUG)
  - 使用 FastClick 插件(体积大[压缩后8k])

**什么是函数式编程？**

* 函数式编程是一种"编程范式"，主要思想是把运算过程尽量写成一系列嵌套的函数调用
* 例如：var result = subtract(multiply(add(1,2), 3), 4);

* 函数式编程的特点：
    - 函数核心化：函数可以作为变量的赋值、另一函数的参数、另一函数的返回值
    - 只用“表达式”，不用“语句”：要求每一步都是单纯的运算，都必须有返回值
    - 没有"副作用"：所有功能只为返回一个新的值，不修改外部变量
    - 引用透明：运行不依赖于外部变量，只依赖于输入的参数

* 函数式编程的优点：
    - 代码简洁，接近自然语言，易于理解
    - 便于维护，利于测试、除错、组合
    - 易于“并发编程“，不用担心一个线程的数据，被另一个线程修改
    - 可“热升级”代码，在运行状态下直接升级代码，不需要重启，也不需要停机

**什么是函数柯里化Currying)？**

* 柯里化：
  - 通常也称部分求值，含义是给函数分步传递参数，每次递参部分应用参数，并返回一个更具体的函数，继续接受剩余参数
  - 期间会连续返回具体函数，直至返回最后结果。因此，函数柯里化是逐步传参，逐步缩小函数的适用范围，逐步求解的过程
  - 柯里化的作用：延迟计算；参数复用；动态创建函数

* 柯里化的缺点：
  - 函数柯里化会产生开销（函数嵌套，比普通函数占更多内存），但性能瓶颈首先来自其它原因（DOM 操作等）

**什么是依赖注入？**

- 当一个类的实例依赖另一个类的实例时，自己不创建该实例，由IOC容器创建并注入给自己，因此称为依赖注入。
- 依赖注入解决的就是如何有效组织代码依赖模块的问题

**设计模式：什么是 singleton, factory, strategy, decorator？**

* Singleton(单例)   一个类只有唯一实例，这个实例在整个程序中有一个全局的访问点
* Factory (工厂)    解决实列化对象产生重复的问题
* Strategy(策略)    将每一个算法封装起来，使它们还可以相互替换，让算法独立于使用
* Observer(观察者)  多个观察者同时监听一个主体，当主体对象发生改变时，所有观察者都将得到通知
* Prototype(原型)   一个完全初始化的实例，用于拷贝或者克隆
* Adapter(适配器)   将不同类的接口进行匹配调整，尽管内部接口不兼容，不同的类还是可以协同工作
* Proxy(代理模式)   一个充当过滤转发的对象用来代表一个真实的对象
* Iterator(迭代器)  在不需要直到集合内部工作原理的情况下，顺序访问一个集合里面的元素
* Chain of Responsibility(职责连)  处理请求组成的对象一条链，请求链中传递，直到有对象可以处理

**什么是前端工程化？**

* 前端工程化就是把一整套前端工作流程使用工具自动化完成


* 前端开发基本流程：
  - 项目初始化：yeoman, FIS
  - 引入依赖包：bower, npm
  - 模块化管理：npm, browserify, Webpack
  - 代码编译：babel, sass, less
  - 代码优化(压缩/合并)：Gulp, Grunt
  - 代码检查：JSHint, ESLint
  - 代码测试：Mocha
* 目前最知名的构建工具：Gulp, Grunt, npm + Webpack

**介绍 Yeoman 是什么？**

* Yeoman --前端开发脚手架工具，自动将最佳实践和工具整合起来构建项目骨架
* Yeoman 其实是三类工具的合体，三类工具各自独立：
  - yo --- 脚手架，自动生成工具（相当于一个粘合剂，把 Yeoman 工具粘合在一起）
  - Grunt、gulp --- 自动化构建工具 （最初只有grunt，之后加入了gulp）
  - Bower、npm --- 包管理工具 （原来是bower，之后加入了npm）

**介绍 WebPack 是什么？ 有什么优势？**

* WebPack 是一款[模块加载器]兼[打包工具]，用于把各种静态资源（js/css/image等）作为模块来使用
* WebPack 的优势：
  - WebPack 同时支持 commonJS 和 AMD/CMD，方便代码迁移
  - 不仅仅能被模块化 JS ，还包括 CSS、Image 等
  - 能替代部分 grunt/gulp 的工作，如打包、压缩混淆、图片base64
  - 扩展性强，插件机制完善，特别是支持 React 热插拔的功能

**介绍类库和框架的区别？**

* 类库是一些函数的集合，帮助开发者写WEB应用，起主导作用的是开发者的代码
* 框架是已实现的特殊WEB应用，开发者只需对它填充具体的业务逻辑，起主导作用是框架


**什么是 MVC/MVP/MVVM/Flux？**

* MVC(Model-View-Controller)
  - V->C, C->M, M->V
  - 通信都是单向的；C只起路由作用，业务逻辑都部署在V
  - Backbone


* MVP(Model-View-Presenter)
  - V<->P, P<->M
  - 通信都是双向的；V和M不发生联系(通过P传)；V非常薄，逻辑都部署在P
  - Riot.js

* MVVM(Model-View-ViewModel)
  - V->VM, VM<->M
  - 采用双向数据绑定：View 和 ViewModel 的变动都会相互映射到对象上面
  - Angular

* Flux(Dispatcher-Store-View)
  - Action->Dispatcher->Store->View, View->Action
  - Facebook 为了解决在 MVC 应用中碰到的工程性问题提出一个架构思想
  - 基于一个简单的原则：数据在应用中单向流动（单向数据流）
  - React(Flux 中 View，只关注表现层)

**Backbone 是什么？**

- Backbone 是一个基于 jquery 和 underscore 的前端(MVC)框架

**AngularJS 是什么？**

- AngularJS 是一个完善的前端 MVVM 框架，包含模板、数据双向绑定、路由、模块化、服务、依赖注入等
- AngularJS 由 Google 维护，用来协助大型单一页面应用开发。


**React 是什么？**

* React 不是 MV* 框架，用于构建用户界面的 JavaScript 库，侧重于 View 层
* React 主要的原理：
  - 虚拟 DOM + diff 算法 -> 不直接操作 DOM 对象
  - Components 组件 -> Virtual DOM 的节点
  - State 触发视图的渲染 -> 单向数据绑定
  - React 解决方案：React + Redux + react-router + Fetch + webpack

**react-router 路由系统的实现原理？**

- 实现原理：location 与 components 之间的同步

* 路由的职责是保证 UI 和 URL 的同步
* 在 react-router 中，URL 对应 Location 对象，UI 由 react components 决定
* 因此，路由在 react-router 中就转变成 location 与 components 之间的同步

**Meteor 是什么**

- Meteor 是一个全栈开发框架，基础构架是 Node.JS + MongoDB，并把延伸到了浏览器端。
- Meteor 统一了服务器端和客户端的数据访问，使开发者可以轻松完成全栈式开发工作。

## JSON和XML

**XML和JSON的区别？**

- 数据体积方面
  - JSON相对于XML来讲，数据的体积小，传递的速度更快些。

- 数据交互方面
  - JSON与JavaScript的交互更加方便，更容易解析处理，更好的数据交互

- 数据描述方面
  - JSON对数据的描述性比XML较差

- 传输速度方面
  - JSON的速度要远远快于XML

**JSON 的了解？**

- JSON(JavaScript Object Notation) 是一种轻量级的数据交换格式
- 它是基于JavaScript的一个子集。数据格式简单, 易于读写, 占用带宽小

- JSON字符串转换为JSON对象:

``` js
var obj =eval('('+ str +')');
var obj = str.parseJSON();
var obj = JSON.parse(str);
```

- JSON对象转换为JSON字符串：

``` js
var last=obj.toJSONString();
var last=JSON.stringify(obj);
```

## localStorage

**浏览器本地存储**

- 在较高版本的浏览器中，js提供了sessionStorage和globalStorage。在HTML5中提供了localStorage来取代globalStorage
- html5中的Web Storage包括了两种存储方式：sessionStorage和localStorage
- sessionStorage用于本地存储一个会话（session）中的数据，这些数据只有在同一个会话中的页面才能访问并且当会话结束后数据也随之销毁。因此sessionStorage不是一种持久化的本地存储，仅仅是会话级别的存储
- 而localStorage用于持久化的本地存储，除非主动删除数据，否则数据是永远不会过期的

**web storage和cookie的区别**

- Web Storage的概念和cookie相似，区别是它是为了更大容量存储设计的。Cookie的大小是受限的，并且每次你请求一个新的页面的时候Cookie都会被发送过去，这样无形中浪费了带宽，另外cookie还需要指定作用域，不可以跨域调用
- 除此之外，WebStorage拥有setItem,getItem,removeItem,clear等方法，不像cookie需要前端开发者自己封装setCookie，getCookie
- 但是cookie也是不可以或缺的：cookie的作用是与服务器进行交互，作为HTTP规范的一部分而存在 ，而Web Storage仅仅是为了在本地“存储”数据而生
- 浏览器的支持除了IE７及以下不支持外，其他标准浏览器都完全支持(ie及FF需在web服务器里运行)，值得一提的是IE总是办好事，例如IE7、IE6中的userData其实就是javascript本地存储的解决方案。通过简单的代码封装可以统一到所有的浏览器都支持web storage
- localStorage和sessionStorage都具有相同的操作方法，例如setItem、getItem和removeItem等

**cookie 和session 的区别：**

- 1、cookie数据存放在客户的浏览器上，session数据放在服务器上。

- 2、cookie不是很安全，别人可以分析存放在本地的COOKIE并进行COOKIE欺骗

    - 考虑到安全应当使用session。

- 3、session会在一定时间内保存在服务器上。当访问增多，会比较占用你服务器的性能

    - 考虑到减轻服务器性能方面，应当使用COOKIE。

- 4、单个cookie保存的数据不能超过4K，很多浏览器都限制一个站点最多保存20个cookie。

- 5、所以个人建议：

    - 将登陆信息等重要信息存放为SESSION

    - 其他信息如果需要保留，可以放在COOKIE中

**描述 cookies、sessionStorage 和 localStorage 的区别？**

* 与服务器交互：
  - cookie 是网站为了标示用户身份而储存在用户本地终端上的数据（通常经过加密）
  - cookie 始终会在同源 http 请求头中携带（即使不需要），在浏览器和服务器间来回传递
  - sessionStorage 和 localStorage 不会自动把数据发给服务器，仅在本地保存

 * 存储大小：

  - cookie 数据根据不同浏览器限制，大小一般不能超过 4k
  - sessionStorage 和 localStorage 虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大

* 有期时间：
    - localStorage    存储持久数据，浏览器关闭后数据不丢失除非主动删除数据
    - sessionStorage  数据在当前浏览器窗口关闭后自动删除
    - cookie           设置的cookie过期时间之前一直有效，与浏览器是否关闭无关

## 移动端适配

**移动端（Android、IOS）怎么做好用户体验?**


* 清晰的视觉纵线
* 信息的分组、极致的减法
* 利用选择代替输入
* 标签及文字的排布方式
* 依靠明文确认密码
* 合理的键盘利用

**前端页面有哪三层构成，分别是什么？作用是什么？**

* 结构层：由 (X)HTML 标记语言负责，解决页面“内容是什么”的问题
* 表示层：由 CSS 负责，解决页面“如何显示内容”的问题
* 行为层：由 JS 脚本负责，解决页面上“内容应该如何对事件作出反应”的问题

## 前端模块化

**说说你对AMD和Commonjs的理解**

- CommonJS是服务器端模块的规范，Node.js采用了这个规范。CommonJS规范加载模块是同步的，也就是说，只有加载完成，才能执行后面的操作。AMD规范则是非同步加载模块，允许指定回调函数
- AMD推荐的风格通过返回一个对象做为模块对象，CommonJS的风格通过对module.exports或exports的属性赋值来达到暴露模块对象的目的

**模块化开发怎么做？**

- 立即执行函数,不暴露私有成员

```
var module1 = (function(){
　　　　var _count = 0;
　　　　var m1 = function(){
　　　　　　//...
　　　　};
　　　　var m2 = function(){
　　　　　　//...
　　　　};
　　　　return {
　　　　　　m1 : m1,
　　　　　　m2 : m2
　　　　};
　　})();
```

**AMD（Modules/Asynchronous-Definition）、CMD（Common Module Definition）规范区别？**

- Asynchronous Module Definition，异步模块定义，所有的模块将被异步加载，模块加载不影响后面语句运行。所有依赖某些模块的语句均放置在回调函数中

```
// CMD
define(function(require, exports, module) {
    var a = require('./a')
    a.doSomething()
    // 此处略去 100 行
    var b = require('./b') // 依赖可以就近书写
    b.doSomething()
    // ...
})

// AMD 默认推荐
define(['./a', './b'], function(a, b) { // 依赖必须一开始就写好
    a.doSomething()
    // 此处略去 100 行
    b.doSomething()
    // ...
})
```

**对前端模块化的认识**

- AMD 是 RequireJS 在推广过程中对模块定义的规范化产出
- CMD 是 SeaJS 在推广过程中对模块定义的规范化产出
- AMD 是提前执行，CMD 是延迟执行
- AMD推荐的风格通过返回一个对象做为模块对象，CommonJS的风格通过对module.exports或exports的属性赋值来达到暴露模块对象的目的

## 性能优化

**如何进行网站性能优化**

- content方面
  - 减少HTTP请求：合并文件、CSS精灵、inline Image
  - 减少DNS查询：DNS查询完成之前浏览器不能从这个主机下载任何任何文件。方法：DNS缓存、将资源分布到恰当数量的主机名，平衡并行下载和DNS查询
  - 避免重定向：多余的中间访问
  - 使Ajax可缓存
  - 非必须组件延迟加载
  - 未来所需组件预加载
  - 减少DOM元素数量
  - 将资源放到不同的域下：浏览器同时从一个域下载资源的数目有限，增加域可以提高并行下载量
  - 减少iframe数量
  - 不要404

- Server方面
  - 使用CDN
  - 添加Expires或者Cache-Control响应头
  - 对组件使用Gzip压缩
  - 配置ETag
  - Flush Buffer Early
  - Ajax使用GET进行请求
  - 避免空src的img标签
- Cookie方面
  - 减小cookie大小
  - 引入资源的域名不要包含cookie

- css方面
  - 将样式表放到页面顶部
  - 不使用CSS表达式
  - 不使用IE的Filter

- Javascript方面
  - 将脚本放到页面底部
  - 将javascript和css从外部引入
  - 压缩javascript和css
  - 删除不需要的脚本
  - 减少DOM访问
  - 合理设计事件监听器

- 图片方面
  - 优化图片：根据实际颜色需要选择色深、压缩
  - 优化css精灵
  - 不要在HTML中拉伸图片
  - 保证favicon.ico小并且可缓存

- 移动方面
  - 保证组件小于25k
  - `Pack Components into a Multipart Document`

**你有用过哪些前端性能优化的方法？**

- 减少http请求次数：CSS Sprites, JS、CSS源码压缩、图片大小控制合适；网页Gzip，CDN托管，data缓存 ，图片服务器。
-  前端模板 JS+数据，减少由于HTML标签导致的带宽浪费，前端用变量保存AJAX请求结果，每次操作本地变量，不用请求，减少请求次数
-  用innerHTML代替DOM操作，减少DOM操作次数，优化javascript性能。
-  当需要设置的样式很多时设置className而不是直接操作style
-  少用全局变量、缓存DOM节点查找的结果。减少IO读取操作
-  避免使用CSS Expression（css表达式)又称Dynamic properties(动态属性)
-  图片预加载，将样式表放在顶部，将脚本放在底部  加上时间戳
-  避免在页面的主体布局中使用table，table要等其中的内容完全下载之后才会显示出来，显示比div+css布局慢

**谈谈性能优化问题**

- 代码层面：避免使用css表达式，避免使用高级选择器，通配选择器
- 缓存利用：缓存Ajax，使用CDN，使用外部js和css文件以便缓存，添加Expires头，服务端配置Etag，减少DNS查找等
- 请求数量：合并样式和脚本，使用css图片精灵，初始首屏之外的图片资源按需加载，静态资源延迟加载
- 请求带宽：压缩文件，开启GZIP

**代码层面的优化**
- 用hash-table来优化查找

- 少用全局变量

- 用innerHTML代替DOM操作，减少DOM操作次数，优化javascript性能

- 用setTimeout来避免页面失去响应

- 缓存DOM节点查找的结果

- 避免使用CSS Expression

- 避免全局查询

- 避免使用with(with会创建自己的作用域，会增加作用域链长度)

- 多个变量声明合并

- 避免图片和iFrame等的空Src。空Src会重新加载当前页面，影响速度和效率

- 尽量避免写在HTML标签中写Style属性

**前端性能优化最佳实践？**

* 性能评级工具（PageSpeed 或 YSlow）
* 合理设置 HTTP 缓存：Expires 与 Cache-control
* 静态资源打包，开启 Gzip 压缩（节省响应流量）
* CSS3 模拟图像，图标base64（降低请求数）
* 模块延迟(defer)加载/异步(async)加载
* Cookie 隔离（节省请求流量）
* localStorage（本地存储）
* 使用 CDN 加速（访问最近服务器）
* 启用 HTTP/2（多路复用，并行加载）
* 前端自动化（gulp/webpack）

## 图片相关

**PNG,GIF,JPG的区别及如何选**

- GIF：
  - 8位像素，256色
  - 无损压缩
  - 支持简单动画
  - 支持boolean透明
  - 适合简单动画

- JPEG：
  - 颜色限于256
  - 有损压缩
  - 可控制压缩质量
  - 不支持透明
  - 适合照片

- PNG：
  - 有PNG8和truecolor PNG
  - PNG8类似GIF颜色上限为256，文件小，支持alpha透明度，无动画
  - 适合图标、背景、按钮


## SEO

### 前端需要注意哪些SEO

- 合理的title、description、keywords：搜索对着三项的权重逐个减小，title值强调重点即可，重要关键词出现不要超过2次，而且要靠前，不同页面title要有所不同；description把页面内容高度概括，长度合适，不可过分堆砌关键词，不同页面description有所不同；keywords列举出重要关键词即可
- 语义化的HTML代码，符合W3C规范：语义化代码让搜索引擎容易理解网页
- 重要内容HTML代码放在最前：搜索引擎抓取HTML顺序是从上到下，有的搜索引擎对抓取长度有限制，保证重要内容一定会被抓取
- 重要内容不要用js输出：爬虫不会执行js获取内容
- 少用iframe：搜索引擎不会抓取iframe中的内容
- 非装饰性图片必须加alt
- 提高网站速度：网站速度是搜索引擎排序的一个重要指标

**如何做SEO优化?**

* 标题与关键词
- 设置有吸引力切合实际的标题，标题中要包含所做的关键词

* 网站结构目录
- 最好不要超过三级，每级有“面包屑导航”，使网站成树状结构分布

* 页面元素
- 给图片标注"Alt"可以让搜索引擎更友好的收录

* 网站内容
- 每个月每天有规律的更新网站的内容，会使搜索引擎更加喜欢

* 友情链接
- 对方一定要是正规网站，每天有专业的团队或者个人维护更新

* 内链的布置
- 使网站形成类似蜘蛛网的结构，不会出现单独连接的页面或链接

* 流量分析
- 通过统计工具(百度统计，CNZZ)分析流量来源，指导下一步的SEO

## ES6

### 1、ES5、ES6和ES2015有什么区别?

> `ES2015`特指在`2015`年发布的新一代`JS`语言标准，`ES6`泛指下一代JS语言标准，包含`ES2015`、`ES2016`、`ES2017`、`ES2018`等。现阶段在绝大部分场景下，`ES2015`默认等同`ES6`。`ES5`泛指上一代语言标准。`ES2015`可以理解为`ES5`和`ES6`的时间分界线

### 2、babel是什么，有什么作用?

> `babel`是一个 `ES6` 转码器，可以将 `ES6` 代码转为 `ES5` 代码，以便兼容那些还没支持`ES6`的平台

### 3、let有什么用，有了var为什么还要用let？

> 在`ES6`之前，声明变量只能用`var`，`var`方式声明变量其实是很不合理的，准确的说，是因为`ES5`里面没有块级作用域是很不合理的。没有块级作用域回来带很多难以理解的问题，比如`for`循环`var`变量泄露，变量覆盖等问题。`let`声明的变量拥有自己的块级作用域，且修复了`var`声明变量带来的变量提升问题。

### 4、举一些ES6对String字符串类型做的常用升级优化?

**优化部分**

> `ES6`新增了字符串模板，在拼接大段字符串时，用反斜杠`(`)`取代以往的字符串相加的形式，能保留所有空格和换行，使得字符串拼接看起来更加直观，更加优雅

**升级部分**

> `ES6`在`String`原型上新增了`includes()`方法，用于取代传统的只能用`indexOf`查找包含字符的方法(`indexOf`返回`-1`表示没查到不如`includes`方法返回`false`更明确，语义更清晰), 此外还新增了`startsWith()`, `endsWith(),` `padStart()`,`padEnd()`,`repeat()`等方法，可方便的用于查找，补全字符串

### 5、举一些ES6对Array数组类型做的常用升级优化

**优化部分**

- 数组解构赋值。`ES6`可以直接以`let [a,b,c] = [1,2,3]`形式进行变量赋值，在声明较多变量时，不用再写很多`let(var),`且映射关系清晰，且支持赋默认值
-  扩展运算符。`ES6`新增的扩展运算符(`...`)(重要),可以轻松的实现数组和松散序列的相互转化，可以取代`arguments`对象和`apply`方法，轻松获取未知参数个数情况下的参数集合。（尤其是在`ES5`中，`arguments`并不是一个真正的数组，而是一个类数组的对象，但是扩展运算符的逆运算却可以返回一个真正的数组）。扩展运算符还可以轻松方便的实现数组的复制和解构赋值（`let a = [2,3,4]`; `let b = [...a]`）

**升级部分**

> `ES6`在`Array`原型上新增了`find()`方法，用于取代传统的只能用`indexOf`查找包含数组项目的方法,且修复了`indexOf`查找不到`NaN的bug([NaN].indexOf(NaN) === -1)`.此外还新增了`copyWithin()`,` includes()`, `fill()`,`flat()`等方法，可方便的用于字符串的查找，补全,转换等

### 6、举一些ES6对Number数字类型做的常用升级优化

**优化部分**

> ES6在`Number`原型上新增了`isFinite()`, `isNaN()`方法，用来取代传统的全局`isFinite(),` `isNaN()`方法检测数值是否有限、是否是`NaN`。`ES5`的`isFinite()`, `isNaN()`方法都会先将非数值类型的参数转化为`Number`类型再做判断，这其实是不合理的，最造成i`sNaN('NaN') === true`的奇怪行为`--'NaN'`是一个字符串，但是`isNaN`却说这就是`NaN`。而`Number.isFinite()`和`Number.isNaN()`则不会有此类问题(`Number.isNaN('NaN') === false`)。（`isFinite()`同上）

**升级部分**

> `ES6`在`Math`对象上新增了`Math.cbrt()`，`trunc()`，`hypot()`等等较多的科学计数法运算方法，可以更加全面的进行立方根、求和立方根等等科学计算

### 7、举一些ES6对Object类型做的常用升级优化?(重要)

**优化部分**

> 对象属性变量式声明。`ES6`可以直接以变量形式声明对象属性或者方法，。比传统的键值对形式声明更加简洁，更加方便，语义更加清晰

```js
let [apple, orange] = ['red appe', 'yellow orange'];
let myFruits = {apple, orange};    // let myFruits = {apple: 'red appe', orange: 'yellow orange'};
```

> 尤其在对象解构赋值(见优化部分b.)或者模块输出变量时，这种写法的好处体现的最为明显

```js
let {keys, values, entries} = Object;
let MyOwnMethods = {keys, values, entries}; // let MyOwnMethods = {keys: keys, values: values, entries: entries}
```

可以看到属性变量式声明属性看起来更加简洁明了。方法也可以采用简洁写法

```js
let es5Fun = {
    method: function(){}
};
let es6Fun = {
    method(){}
}
```

> 对象的解构赋值。 `ES6`对象也可以像数组解构赋值那样，进行变量的解构赋值

```js
let {apple, orange} = {apple: 'red appe', orange: 'yellow orange'};
```

> 对象的扩展运算符(`...`)。 ES6对象的扩展运算符和数组扩展运算符用法本质上差别不大，毕竟数组也就是特殊的对象。对象的扩展运算符一个最常用也最好用的用处就在于可以轻松的取出一个目标对象内部全部或者部分的可遍历属性，从而进行对象的合并和分解

```js
let {apple, orange, ...otherFruits} = {apple: 'red apple', orange: 'yellow orange', grape: 'purple grape', peach: 'sweet peach'};
// otherFruits  {grape: 'purple grape', peach: 'sweet peach'}
// 注意: 对象的扩展运算符用在解构赋值时，扩展运算符只能用在最有一个参数(otherFruits后面不能再跟其他参数)
let moreFruits = {watermelon: 'nice watermelon'};
let allFruits = {apple, orange, ...otherFruits, ...moreFruits};
```

> `super` 关键字。`ES6`在`Class`类里新增了类似`this`的关键字`super`。同`this`总是指向当前函数所在的对象不同，`super`关键字总是指向当前函数所在对象的原型对象

**升级部分**

> `ES6`在`Object`原型上新增了`is()`方法，做两个目标对象的相等比较，用来完善`'==='`方法。`'==='`方法中`NaN === NaN //false`其实是不合理的，`Object.is`修复了这个小`bug`。`(Object.is(NaN, NaN) // true)`

> `ES6`在`Object`原型上新增了`assign()`方法，用于对象新增属性或者多个对象合并

```js
const target = { a: 1 };
const source1 = { b: 2 };
const source2 = { c: 3 };
Object.assign(target, source1, source2);
target // {a:1, b:2, c:3}
```

> **注意**: `assign`合并的对象`target`只能合并`source1`、s`ource2`中的自身属性，并不会合并`source1`、`source2`中的继承属性，也不会合并不可枚举的属性，且无法正确复制get和set属性（会直接执行`get/set`函数，取`return`的值）

- `ES6`在`Object`原型上新增了`getOwnPropertyDescriptors()`方法，此方法增强了`ES5`中`getOwnPropertyDescriptor()`方法，可以获取指定对象所有自身属性的描述对象。结合`defineProperties()`方法，可以完美复制对象，包括复制`get`和`set`属性
- `ES6`在`Object`原型上新增了`getPrototypeOf()`和`setPrototypeOf()`方法，用来获取或设置当前对象的`prototype`对象。这个方法存在的意义在于，`ES5`中获取设置`prototype`对像是通过`__proto__`属性来实现的，然而`__proto__`属性并不是ES规范中的明文规定的属性，只是浏览器各大产商“私自”加上去的属性，只不过因为适用范围广而被默认使用了，再非浏览器环境中并不一定就可以使用，所以为了稳妥起见，获取或设置当前对象的`prototype`对象时，都应该采用ES6新增的标准用法
- `ES6`在`Object`原型上还新增了`Object.keys()`，`Object.values()`，`Object.entries()`方法，用来获取对象的所有键、所有值和所有键值对数组

### 8、举一些ES6对Function函数类型做的常用升级优化?

**优化部分**

> 箭头函数(核心)。箭头函数是ES6核心的升级项之一，箭头函数里没有自己的this,这改变了以往JS函数中最让人难以理解的this运行机制。主要优化点

- 箭头函数内的this指向的是函数定义时所在的对象，而不是函数执行时所在的对象。ES5函数里的this总是指向函数执行时所在的对象，这使得在很多情况下`this`的指向变得很难理解，尤其是非严格模式情况下，`this`有时候会指向全局对象，这甚至也可以归结为语言层面的bug之一。ES6的箭头函数优化了这一点，它的内部没有自己的`this`,这也就导致了`this`总是指向上一层的`this`，如果上一层还是箭头函数，则继续向上指，直到指向到有自己`this`的函数为止，并作为自己的`this`
- 箭头函数不能用作构造函数，因为它没有自己的`this`，无法实例化
- 也是因为箭头函数没有自己的this,所以箭头函数 内也不存在`arguments`对象。（可以用扩展运算符代替）
- 函数默认赋值。`ES6`之前，函数的形参是无法给默认值得，只能在函数内部通过变通方法实现。`ES6`以更简洁更明确的方式进行函数默认赋值

```js
function es6Fuc (x, y = 'default') {
    console.log(x, y);
}
es6Fuc(4) // 4, default
```

**升级部分**

> ES6新增了双冒号运算符，用来取代以往的`bind`，`call`,和`apply`。(浏览器暂不支持，`Babel`已经支持转码)

```js
foo::bar;
// 等同于
bar.bind(foo);

foo::bar(...arguments);
// 等同于
bar.apply(foo, arguments);
```

### 9、Symbol是什么，有什么作用？

> `Symbol`是`ES6`引入的第七种原始数据类型（说法不准确，应该是第七种数据类型，Object不是原始数据类型之一，已更正），所有Symbol()生成的值都是独一无二的，可以从根本上解决对象属性太多导致属性名冲突覆盖的问题。对象中`Symbol()`属性不能被`for...in`遍历，但是也不是私有属性

### 10、Set是什么，有什么作用？

> `Set`是`ES6`引入的一种类似`Array`的新的数据结构，`Set`实例的成员类似于数组`item`成员，区别是`Set`实例的成员都是唯一，不重复的。这个特性可以轻松地实现数组去重

### 11、Map是什么，有什么作用？

> `Map`是`ES6`引入的一种类似`Object`的新的数据结构，`Map`可以理解为是`Object`的超集，打破了以传统键值对形式定义对象，对象的`key`不再局限于字符串，也可以是`Object`。可以更加全面的描述对象的属性

### 12、Proxy是什么，有什么作用？

> `Proxy`是`ES6`新增的一个构造函数，可以理解为JS语言的一个代理，用来改变JS默认的一些语言行为，包括拦截默认的`get/set`等底层方法，使得JS的使用自由度更高，可以最大限度的满足开发者的需求。比如通过拦截对象的`get/set`方法，可以轻松地定制自己想要的`key`或者`value`。下面的例子可以看到，随便定义一个`myOwnObj`的`key`,都可以变成自己想要的函数`

```js
function createMyOwnObj() {
	//想把所有的key都变成函数，或者Promise,或者anything
	return new Proxy({}, {
		get(target, propKey, receiver) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					let randomBoolean = Math.random() > 0.5;
					let Message;
					if (randomBoolean) {
						Message = `你的${propKey}运气不错，成功了`;
						resolve(Message);
					} else {
						Message = `你的${propKey}运气不行，失败了`;
						reject(Message);
					}
				}, 1000);
			});
		}
	});
}

let myOwnObj = createMyOwnObj();

myOwnObj.hahaha.then(result => {
	console.log(result) //你的hahaha运气不错，成功了
}).catch(error => {
	console.log(error) //你的hahaha运气不行，失败了
})

myOwnObj.wuwuwu.then(result => {
	console.log(result) //你的wuwuwu运气不错，成功了
}).catch(error => {
	console.log(error) //你的wuwuwu运气不行，失败了
})
```

### 13、Reflect是什么，有什么作用？

> `Reflect`是`ES6`引入的一个新的对象，他的主要作用有两点，一是将原生的一些零散分布在`Object`、`Function`或者全局函数里的方法(如`apply`、`delete`、`get`、`set`等等)，统一整合到`Reflect`上，这样可以更加方便更加统一的管理一些原生`API`。其次就是因为`Proxy`可以改写默认的原生API，如果一旦原生`API`别改写可能就找不到了，所以`Reflect`也可以起到备份原生API的作用，使得即使原生`API`被改写了之后，也可以在被改写之后的`API`用上默认的`API`

### 14、Promise是什么，有什么作用？

> `Promise`是`ES6`引入的一个新的对象，他的主要作用是用来解决JS异步机制里，回调机制产生的“回调地狱”。它并不是什么突破性的`API`，只是封装了异步回调形式，使得异步回调可以写的更加优雅，可读性更高，而且可以链式调用

### 15、Iterator是什么，有什么作用？(重要)

- `Iterator`是`ES6`中一个很重要概念，它并不是对象，也不是任何一种数据类型。因为`ES6`新增了`Set`、`Map`类型，他们和`Array`、`Object`类型很像，`Array`、`Object`都是可以遍历的，但是`Set`、`Map`都不能用for循环遍历，解决这个问题有两种方案，一种是为`Set`、`Map`单独新增一个用来遍历的`API`，另一种是为`Set`、`Map`、`Array`、`Object`新增一个统一的遍历`API`，显然，第二种更好，`ES6`也就顺其自然的需要一种设计标准，来统一所有可遍历类型的遍历方式。`Iterator`正是这样一种标准。或者说是一种规范理念
- 就好像`JavaScript`是`ECMAScript`标准的一种具体实现一样，`Iterator`标准的具体实现是`Iterator`遍历器。`Iterator`标准规定，所有部署了`key`值为`[Symbol.iterator]`，且`[Symbol.iterator]`的`value`是标准的`Iterator`接口函数(标准的`Iterator`接口函数: 该函数必须返回一个对象，且对象中包含`next`方法，且执行`next()`能返回包含`value/done`属性的`Iterator`对象)的对象，都称之为可遍历对象，`next()`后返回的`Iterator`对象也就是`Iterator`遍历器

```js
//obj就是可遍历的，因为它遵循了Iterator标准，且包含[Symbol.iterator]方法，方法函数也符合标准的Iterator接口规范。
//obj.[Symbol.iterator]() 就是Iterator遍历器
let obj = {
  data: [ 'hello', 'world' ],
  [Symbol.iterator]() {
    const self = this;
    let index = 0;
    return {
      next() {
        if (index < self.data.length) {
          return {
            value: self.data[index++],
            done: false
          };
        } else {
          return { value: undefined, done: true };
        }
      }
    };
  }
};
```

> `ES6`给`Set`、`Map`、`Array`、`String`都加上了`[Symbol.iterator]`方法，且`[Symbol.iterator]`方法函数也符合标准的`Iterator`接口规范，所以`Set`、`Map`、`Array`、`String`默认都是可以遍历的

```js
//Array
let array = ['red', 'green', 'blue'];
array[Symbol.iterator]() //Iterator遍历器
array[Symbol.iterator]().next() //{value: "red", done: false}

//String
let string = '1122334455';
string[Symbol.iterator]() //Iterator遍历器
string[Symbol.iterator]().next() //{value: "1", done: false}

//set
let set = new Set(['red', 'green', 'blue']);
set[Symbol.iterator]() //Iterator遍历器
set[Symbol.iterator]().next() //{value: "red", done: false}

//Map
let map = new Map();
let obj= {map: 'map'};
map.set(obj, 'mapValue');
map[Symbol.iterator]().next()  {value: Array(2), done: false}

```

### 16、for...in 和for...of有什么区别？

> 如果看到问题十六，那么就很好回答。问题十六提到了ES6统一了遍历标准，制定了可遍历对象，那么用什么方法去遍历呢？答案就是用`for...of`。ES6规定，有所部署了载了`Iterator`接口的对象(可遍历对象)都可以通过`for...of`去遍历，而`for..in`仅仅可以遍历对象

- 这也就意味着，数组也可以用`for...of`遍历，这极大地方便了数组的取值，且避免了很多程序用`for..in`去遍历数组的恶习

### 17、Generator函数是什么，有什么作用？

- 如果说`JavaScript`是`ECMAScript`标准的一种具体实现、`Iterator`遍历器是`Iterator`的具体实现，那么`Generator`函数可以说是`Iterator`接口的具体实现方式。
- 执行`Generator`函数会返回一个遍历器对象，每一次`Generator`函数里面的`yield`都相当一次遍历器对象的`next()`方法，并且可以通过`next(value)`方法传入自定义的value,来改变`Generator`函数的行为。
- `Generator`函数可以通过配合`Thunk` 函数更轻松更优雅的实现异步编程和控制流管理。

### 18、async函数是什么，有什么作用？

> `async`函数可以理解为内置自动执行器的`Generator`函数语法糖，它配合`ES6`的`Promise`近乎完美的实现了异步编程解决方案

### 19、Class、extends是什么，有什么作用？

> `ES6` 的`class`可以看作只是一个`ES5`生成实例对象的构造函数的语法糖。它参考了`java`语言，定义了一个类的概念，让对象原型写法更加清晰，对象实例化更像是一种面向对象编程。`Class`类可以通过`extends`实现继承。它和ES5构造函数的不同点

类的内部定义的所有方法，都是不可枚举的

```js
///ES5
function ES5Fun (x, y) {
	this.x = x;
	this.y = y;
}
ES5Fun.prototype.toString = function () {
	 return '(' + this.x + ', ' + this.y + ')';
}
var p = new ES5Fun(1, 3);
p.toString();
Object.keys(ES5Fun.prototype); //['toString']

//ES6
class ES6Fun {
	constructor (x, y) {
		this.x = x;
		this.y = y;
	}
	toString () {
		return '(' + this.x + ', ' + this.y + ')';
	}
}

Object.keys(ES6Fun.prototype); //[]
```

- `ES6`的`class`类必须用`new`命令操作，而`ES5`的构造函数不用`new`也可以执行。
- `ES6`的`class`类不存在变量提升，必须先定义`class`之后才能实例化，不像`ES5`中可以将构造函数写在实例化之后。
- `ES5` 的继承，实质是先创造子类的实例对象`this`，然后再将父类的方法添加到`this`上面。`ES6` 的继承机制完全不同，实质是先将父类实例对象的属性和方法，加到`this`上面（所以必须先调用`super`方法），然后再用子类的构造函数修改`this`。

### 20、module、export、import是什么，有什么作用？

- `module`、`export`、`import`是`ES6`用来统一前端模块化方案的设计思路和实现方案。`export`、`import`的出现统一了前端模块化的实现方案，整合规范了浏览器/服务端的模块化方法，用来取代传统的`AMD/CMD`、`requireJS`、`seaJS`、`commondJS`等等一系列前端模块不同的实现方案，使前端模块化更加统一规范，`JS`也能更加能实现大型的应用程序开发。
- `import`引入的模块是静态加载（编译阶段加载）而不是动态加载（运行时加载）。
- `import`引入`export`导出的接口值是动态绑定关系，即通过该接口，可以取到模块内部实时的值

### 21、日常前端代码开发中，有哪些值得用ES6去改进的编程优化或者规范？

- 常用箭头函数来取代`var self = this`;的做法。
- 常用`let`取代`var`命令。
- 常用数组/对象的结构赋值来命名变量，结构更清晰，语义更明确，可读性更好。
- 在长字符串多变量组合场合，用模板字符串来取代字符串累加，能取得更好地效果和阅读体验。
- 用`Class`类取代传统的构造函数，来生成实例化对象。
- 在大型应用开发中，要保持`module`模块化开发思维，分清模块之间的关系，常用`import`、`export`方法。



### 22、ES6的了解

> 新增模板字符串（为JavaScript提供了简单的字符串插值功能）、箭头函数（操作符左边为输入的参数，而右边则是进行的操作以及返回的值Inputs=>outputs。）、for-of（用来遍历数据—例如数组中的值。）arguments对象可被不定参数和默认参数完美代替。ES6将promise对象纳入规范，提供了原生的Promise对象。增加了let和const命令，用来声明变量。增加了块级作用域。let命令实际上就增加了块级作用域。ES6规定，var命令和function命令声明的全局变量，属于全局对象的属性；let命令、const命令、class命令声明的全局变量，不属于全局对象的属性。。还有就是引入module模块的概念

### 23、说说你对Promise的理解

- 依照 Promise/A+ 的定义，Promise 有四种状态：
  - pending: 初始状态, 非 fulfilled 或 rejected.

  - fulfilled: 成功的操作.

  - rejected: 失败的操作.

  - settled: Promise已被fulfilled或rejected，且不是pending

- 另外， fulfilled 与 rejected 一起合称 settled
- Promise 对象用来进行延迟(deferred) 和异步(asynchronous ) 计算

### 24、Promise 的构造函数

- 构造一个 Promise，最基本的用法如下：

```js
var promise = new Promise(function(resolve, reject) {

        if (...) {  // succeed

            resolve(result);

        } else {   // fails

            reject(Error(errMessage));

        }
    });
```

- Promise 实例拥有 then 方法（具有 then 方法的对象，通常被称为thenable）。它的使用方法如下：
```
promise.then(onFulfilled, onRejected)
```

- 接收两个函数作为参数，一个在 fulfilled 的时候被调用，一个在rejected的时候被调用，接收参数就是 future，onFulfilled 对应 resolve, onRejected 对应 reject

**什么是 Promise ？**

* Promise 就是一个对象，用来表示并传递异步操作的最终结果
* Promise 最主要的交互方式：将回调函数传入 then 方法来获得最终结果或出错原因
* Promise 代码书写上的表现：以“链式调用”代替回调函数层层嵌套（回调地狱）

### 25、谈一谈你了解ECMAScript6的新特性？

* 块级作用区域              `let a = 1;`
* 可定义常量                `const PI = 3.141592654;`
* 变量解构赋值              `var [a, b, c] = [1, 2, 3];`
* 字符串的扩展(模板字符串)  ` var sum = `${a + b}`;`
* 数组的扩展(转换数组类型)   `Array.from($('li'));`
* 函数的扩展(扩展运算符)     `[1, 2].push(...[3, 4, 5]);`
* 对象的扩展(同值相等算法)   ` Object.is(NaN, NaN);`
* 新增数据类型(Symbol)      `let uid = Symbol('uid');`
* 新增数据结构(Map)        ` let set = new Set([1, 2, 2, 3]);`
* for...of循环            `for(let val of arr){};`
* Promise对象            ` var promise = new Promise(func);`
* Generator函数          ` function* foo(x){yield x; return x*x;}`
* 引入Class(类)          ` class Foo {}`
* 引入模块体系            ` export default func;`
* 引入async函数[ES7]

```js
async function asyncPrint(value, ms) {
      await timeout(ms);
      console.log(value)
     }

```

### 26、Object.is() 与原来的比较操作符 ===、== 的区别？

-  == 相等运算符，比较时会自动进行数据类型转换
-  === 严格相等运算符，比较时不进行隐式类型转换
-  Object.is 同值相等算法，在 === 基础上对 0 和 NaN 特别处理

```
+0 === -0 //true
NaN === NaN // false

Object.is(+0, -0) // false
Object.is(NaN, NaN) // true
```

### 27、什么是 Babel

* Babel 是一个 JS 编译器，自带一组 ES6 语法转化器，用于转化 JS 代码。
这些转化器让开发者提前使用最新的 JS语法(ES6/ES7)，而不用等浏览器全部兼容。
* Babel 默认只转换新的 JS 句法(syntax)，而不转换新的API。

## 如何解决跨域问题

**JSONP：**

- 原理是：动态插入`script`标签，通过`script`标签引入一个`js`文件，这个`js`文件载入成功后会执行我们在`url`参数中指定的函数，并且会把我们需要的`json`数据作为参数传入
- 由于同源策略的限制，`XmlHttpRequest`只允许请求当前源（域名、协议、端口）的资源，为了实现跨域请求，可以通过`script`标签实现跨域请求，然后在服务端输出`JSON`数据并执行回调函数，从而解决了跨域的数据请求
- 优点是兼容性好，简单易用，支持浏览器与服务器双向通信。缺点是只支持GET请求
- `JSONP`：`json+padding`（内填充），顾名思义，就是把`JSON`填充到一个盒子里

```js
  function createJs(sUrl){

      var oScript = document.createElement('script');
      oScript.type = 'text/javascript';
      oScript.src = sUrl;
      document.getElementsByTagName('head')[0].appendChild(oScript);
  }

  createJs('jsonp.js');

  box({
     'name': 'test'
  });

  function box(json){
      alert(json.name);
  }
```

**CORS**

- 服务器端对于`CORS`的支持，主要就是通过设置`Access-Control-Allow-Origin`来进行的。如果浏览器检测到相应的设置，就可以允许`Ajax`进行跨域的访问


**通过修改document.domain来跨子域**

- 将子域和主域的`document.domain`设为同一个主域.前提条件：这两个域名必须属于同一个基础域名!而且所用的协议，端口都要一致，否则无法利用`document.domain`进行跨域。主域相同的使用`document.domain`

**使用window.name来进行跨域**

- `window`对象有个name属性，该属性有个特征：即在一个窗口(`window`)的生命周期内,窗口载入的所有的页面都是共享一个`window.name`的，每个页面对window.name都有读写的权限，`window.name`是持久存在一个窗口载入过的所有页面中的

**使用HTML5中新引进的window.postMessage方法来跨域传送数据**

- 还有`flash`、在服务器上设置代理页面等跨域方式。个人认为`window.name`的方法既不复杂，也能兼容到几乎所有浏览器，这真是极好的一种跨域方法


**如何解决跨域问题?**

- `jsonp`、 `iframe`、`window.name`、`window.postMessage`、服务器上设置代理页面

- 如何解决跨域问题?

  * `document.domain + iframe`：要求主域名相同 //只能跨子域
  * `JSONP(JSON with Padding)``：`response: callback(data)`` //只支持 GET 请求
  * 跨域资源共享`CORS(XHR2)``：`Access-Control-Allow` //兼容性 IE10+
  * 跨文档消息传输(HTML5)：`postMessage + onmessage`  //兼容性 IE8+
  * `WebSocket(HTML5)：new WebSocket(url) + onmessage` //兼容性 IE10+
  * 服务器端设置代理请求：服务器端不受同源策略限制

## Cookie

**请你谈谈Cookie的弊端**

- cookie虽然在持久保存客户端数据提供了方便，分担了服务器存储的负担，但还是有很多局限性的
- 第一：每个特定的域名下最多生成20个cookie

- 1.IE6或更低版本最多20个cookie

- 2.IE7和之后的版本最后可以有50个cookie。

- 3.Firefox最多50个cookie

- 4.chrome和Safari没有做硬性限制

**请你谈谈Cookie的弊端？**

* 每个特定的域名下最多生成的 cookie 个数有限制
* IE 和 Opera 会清理近期最少使用的 cookie，Firefox 会随机清理 cookie
* cookie 的最大大约为 4096 字节，为了兼容性，一般设置不超过 4095 字节
* 如果 cookie 被人拦截了，就可以取得所有的 session 信息

## MVC

**说说你对MVC和MVVM的理解**

- MVC
  - View 传送指令到 Controller

  - Controller 完成业务逻辑后，要求 Model 改变状态

  - Model 将新的数据发送到 View，用户得到反馈

所有通信都是单向的


## Git

**git fetch和git pull的区别**

- git pull：相当于是从远程获取最新版本并merge到本地
- git fetch：相当于是从远程获取最新版本到本地，不会自动merge


## 数据结构

**栈和队列的区别?**

- 栈的插入和删除操作都是在一端进行的，而队列的操作却是在两端进行的。
- 队列先进先出，栈先进后出。
- 栈只允许在表尾一端进行插入和删除，而队列只允许在表尾一端进行插入，在表头一端进行删除

**栈和堆的区别？**

- 栈区（stack）—   由编译器自动分配释放   ，存放函数的参数值，局部变量的值等。
- 堆区（heap）   —   一般由程序员分配释放，   若程序员不释放，程序结束时可能由OS回收。
- 堆（数据结构）：堆可以被看成是一棵树，如：堆排序；
- 栈（数据结构）：一种先进后出的数据结构

**快速 排序的思想并实现一个快排？**

"快速排序"的思想很简单，整个排序过程只需要三步：

- （1）在数据集之中，找一个基准点
- （2）建立两个数组，分别存储左边和右边的数组
- （3）利用递归进行下次比较

```js
function quickSort(arr){
    if(arr.length<=1){
        return arr;//如果数组只有一个数，就直接返回；
    }

    var num = Math.floor(arr.length/2);//找到中间数的索引值，如果是浮点数，则向下取整

    var numValue = arr.splice(num,1);//找到中间数的值
    var left = [];
    var right = [];

    for(var i=0;i<arr.length;i++){
        if(arr[i]<numValue){
            left.push(arr[i]);//基准点的左边的数传到左边数组
        }
        else{
           right.push(arr[i]);//基准点的右边的数传到右边数组
        }
    }

    return quickSort(left).concat([numValue],quickSort(right));//递归不断重复比较
}

alert(quickSort([32,45,37,16,2,87]));//弹出“2,16,32,37,45,87”
```

## 数据库

**说说mongoDB和MySQL的区别**

- `MySQL`是传统的关系型数据库，MongoDB则是非关系型数据库
- `mongodb`以BSON结构（二进制）进行存储，对海量数据存储有着很明显的优势。
- 对比传统关系型数据库,NoSQL有着非常显著的性能和扩展性优势，与关系型数据库相比，MongoDB的优点有： ①弱一致性（最终一致），更能保证用户的访问速度： ②文档结构的存储方式，能够更便捷的获取数据

## 手写代码

**手写事件侦听器，并要求兼容浏览器**

``` js
var eventUtil = {
  getEvent: function(event) {
      return event || window.event;
  },

  getTarget: function(event) {
      return event.target || event.srcElement;
  },

  addListener: function(element, type, hander) {
      if (element.addEventListener) {
          element.addEventListener(type, hander, false);
      } else if (element.attachEvent) {
          element.attachEvent('on' + type, hander);
      } else {
          element['on' + type] = hander;
      }
  },

  removeListener: function(element, type, hander) {
      if (element.removeEventListener) {
          element.removeEventListener(type, hander, false);
      } else if (element.deattachEvent) {
          element.detachEvent(type, hander);
      } else {
          element['on' + type] = null;
      }
  },

  preventDefault: function(event) {
      if (event.preventDefault) {
          event.preventDefault();
      } else {
          event.returnValue = false;
      }
  },

  stopPropagation: function(event) {
      if (event.stopPropagation) {
          event.stopPropagation();
      } else {
          event.cancelBubble = true;
      }
  }
};

// 调用
(function() {
  var btn = document.getElementById("btn");
  var link = document.getElementsByTagName("a")[0];

  eventUtil.addListener(btn, "click", function(event) {
      var event = eventUtil.getEvent(event);
      var target = eventUtil.getTarget(event);
      alert(event.type);
      alert(target);
      eventUtil.stopPropagation(event);
  });

  eventUtil.addListener(link, "click", function(event) {
      alert("prevent default event");
      var event = eventUtil.getEvent(event);
      eventUtil.preventDefault(event);
  });

  eventUtil.addListener(document.body, "click", function() {
      alert("click body");
  });
})();
```

**手写事件模型**

``` js
var Event = (function () {
    var list = {}, bind, trigger, remove;
    bind = function (key, fn) {
        if (!list[key]) {
            list[key] = [];
        }
        list[key].push(fn);
    };
    trigger = function () {
        var key = Array.prototype.shift.call(arguments);
        var fns = list[key];
        if (!fns || fns.length === 0) {
            return false;
        }
        for (var i = 0, fn; fn = fns[i++];) {
            fn.apply(this, arguments);
        }
    };
    remove = function (key, fn) {
        var fns = list[key];
        if (!fns) {
            return false;
        }
        if (!fn) {
            fns & (fns.length = 0);
        } else {
            for (var i = fns.length - 1; i >= 0; i--) {
                var _fn = fns[i];
                if (_fn === fn) {
                    fns.splice(i, 1);
                }
            }
        }
    };
    return {
        bind: bind,
        trigger: trigger,
        remove: remove
    }
})();

// 调用
Event.bind('Hit', function(){ console.log('bind event'); }); // 绑定事件
Event.trigger("Hit", function(){ console.log('trigger event'); }); // 触发事件
```

**手写事件代理，并要求兼容浏览器**

``` js
function delegateEvent(parentEl, selector, type, fn) {
    var handler = function(e){
          var e = e || window.event;
          var target = e.target || e.srcElement;
          if (matchSelector(target, selector)) {
              if(fn) {
                  fn.call(target, e);
              }
          }
    };
    if(parentEl.addEventListener){
        parentEl.addEventListener(type, handler);
    }else{
        parentEl.attachEvent("on" + type, handler);
    }
}
/**
 * support #id, tagName, .className
 */
function matchSelector(ele, selector) {
    // if use id
    if (selector.charAt(0) === "#") {
        return ele.id === selector.slice(1);
    }
    // if use class
    if (selector.charAt(0) === ".") {
        return (" " + ele.className + " ").indexOf(" " + selector.slice(1) + " ") != -1;
    }
    // if use tagName
    return ele.tagName.toLowerCase() === selector.toLowerCase();
}

// 调用
var box = document.getElementById("box");
delegateEvent(box, "a", "click", function(){
    console.log(this.href);
})
```

**手写事件触发器，并要求兼容浏览器**

``` js
var fireEvent = function(element, event){
    if (document.createEventObject){
        var mockEvent = document.createEventObject();
        return element.fireEvent('on' + event, mockEvent)
    }else{
        var mockEvent = document.createEvent('HTMLEvents');
        mockEvent.initEvent(event, true, true);
        return element.dispatchEvent(mockEvent);
    }
}
```

**手写 Function.bind 函数**

``` js
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      throw new TypeError("'this' is not function");
    }

    // bind's default arguments, array without first element
    // first part arguments for the function
    var aBindArgs = Array.prototype.slice.call(arguments, 1);
    var fToBind = this; // the function will be binding
    var fNOP = function () {};
    var fBound = function () {
          // target this will be binding
          var oThis = this instanceof fNOP ? this : oThis || this;
          // last part arguments for the function
          var aCallArgs = Array.prototype.slice.call(arguments);
          // complete arguments for the function
          var aFuncArgs = aBindArgs.concat(aCallArgs);
          return fToBind.apply(oThis, aFuncArgs);
        };

    // fBound extends fToBind
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// 调用
var add = function(a, b, c){ return a + b + c;};
var newAdd = add.bind(null, 1, 2);
var result = newAdd(3);
```

**手写数组快速排序**

``` js
var quickSort = function(arr) {
    if (arr.length <= 1) { return arr; }
    var pivotIndex = Math.floor(arr.length / 2);
    var pivot = arr.splice(pivotIndex, 1)[0];
    var left = [];
    var right = [];
    for (var i = 0, len = arr.length; i < len; i++){
        if (arr[i] < pivot) {
          left.push(arr[i]);
        } else {
          right.push(arr[i]);
        }
    }
    return quickSort(left).concat([pivot], quickSort(right));
};

// 调用
quickSort([9, 4, 2, 8, 1, 5, 3, 7]);
```

**手写数组冒泡排序**

``` js
var bubble = function(arr){
    var maxIndex = arr.length - 1, temp, flag;
    for (var i = maxIndex; i > 0; i--) {
        flag = true
        for (var j = 0; j < i; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                flag = false;
            }
        }
        if(! flag){
            break;
        }
    }
    return arr;
}
// 调用
var arr = bubble([13, 69, 28, 93, 55, 75, 34]);
```

**手写数组去重**


``` js
Array.prototype.unique = function() { return [...new Set(this)];};
// 调用
[1, 2, 3, 3, 2, 1].unique();

function unique1(arr){
    var hash = {}, result = [];
    for(var i=0, len=arr.length; i<len; i++){
        if(! hash[arr[i]]){
          result.push(arr[i]);
          hash[arr[i]] = true;
        }
    }
    return result;
}
// 调用
unique1([1, 2, 3, 3, 2, 1]);

Array.prototype.unique2 = function(){
    this.sort();
    var result = [this[0]];
    var len = this.length;
    for(var i = 0; i < len; i++){
        if(this[i] !== result[result.length - 1]){
          result.push(this[i]);
        }
    }
    return result;
}
// 调用
[1, 2, 3, 3, 2, 1].unique2();

function unique3(arr){
    var result = [];
    for(var i=0; i<arr.length; i++){
        if(result.indexOf(arr[i]) == -1){
          result.push(arr[i]);
        }
    }
    return result;
}

// 调用
unique3([1, 2, 3, 3, 2, 1]);
```

**将url的查询参数解析成字典对象**


``` js
function parseQuery(url) {
  url = url == null ? window.location.href : url;
  var search = url.substring(url.lastIndexOf("?") + 1);
  var hash = {};
  var reg = /([^?&=]+)=([^?&=]*)/g;
  search.replace(reg, function (match, $1, $2) {
      var name = decodeURIComponent($1);
      var val = decodeURIComponent($2);
      hash[name] = String(val);
      return match;
  });
  return hash;
}
```

**封装函数节流函数**

``` js
var throttle = function(fn, delay, mustRunDelay){
  var timer = null;
  var t_start;
  return function(){
    var context = this, args = arguments, t_curr = +new Date();
    clearTimeout(timer);
    if(!t_start){
      t_start = t_curr;
    }
    if(t_curr - t_start >= mustRunDelay){
      fn.apply(context, args);
      t_start = t_curr;
    } else {
      timer = setTimeout(function(){
        fn.apply(context, args);
      }, delay);
    }
  };
};

// 调用（两次间隔50ms内连续触发不执行，但每累计100ms至少执行一次
window.onresize = throttle(myFunc, 50, 100);
```

**用JS实现千位分隔符**

``` js
function test1(num){
  var str = (+ num) + '';
  var len = str.length;
  if(len <= 3) return str;
  num = '';
  while(len > 3){
      len -= 3;
      num = ',' + str.substr(len, 3) + num;
  }
  return str.substr(0, len) + num;
}

function test2(num){
  // ?= 正向匹配:匹配位置
  // ?! 正向不匹配:排除位置
  var str = (+num).toString();
  var reg = /(?=(?!\b)(\d{3})+$)/g;
  return str.replace(reg, ',');
}
```

## 线程与进程的区别

* 一个程序至少有一个进程，一个进程至少有一个线程
* 线程的划分尺度小于进程，使得多线程程序的并发性高
* 进程在执行过程中拥有独立的内存单元，而多个线程共享内存
* 线程不能够独立执行，必须应用程序提供多个线程执行控制

## 其他

**如何评价AngularJS和BackboneJS**

- backbone具有依赖性，依赖underscore.js。Backbone + Underscore + jQuery(or Zepto)就比一个AngularJS 多出了2 次HTTP请求.

- Backbone的Model没有与UI视图数据绑定，而是需要在View中自行操作DOM来更新或读取UI数据。AngularJS与此相反，Model直接与UI视图绑定，Model与UI视图的关系，通过directive封装，AngularJS内置的通用directive，就能实现大部分操作了，也就是说，基本不必关心Model与UI视图的关系，直接操作Model就行了，UI视图自动更新
- AngularJS的directive，你输入特定数据，他就能输出相应UI视图。是一个比较完善的前端MVW框架，包含模板，数据双向绑定，路由，模块化，服务，依赖注入等所有功能，模板功能强大丰富，并且是声明式的，自带了丰富的 Angular 指令

**谈谈你对重构的理解**

- 网站重构：在不改变外部行为的前提下，简化结构、添加可读性，而在网站前端保持一致的行为。也就是说是在不改变UI的情况下，对网站进行优化， 在扩展的同时保持一致的UI

- 对于传统的网站来说重构通常是：

  - 表格(table)布局改为DIV+CSS

  - 使网站前端兼容于现代浏览器(针对于不合规范的CSS、如对IE6有效的)

  - 对于移动平台的优化

  - 针对于SEO进行优化

  - 深层次的网站重构应该考虑的方面

**说说你对前端架构师的理解**

- 负责前端团队的管理及与其他团队的协调工作，提升团队成员能力和整体效率；带领团队完成研发工具及平台前端部分的设计、研发和维护； 带领团队进行前端领域前沿技术研究及新技术调研，保证团队的技术领先负责前端开发规范制定、功能模块化设计、公共组件搭建等工作，并组织培训

**什么样的前端代码是好的**

- 高复用低耦合，这样文件小，好维护，而且好扩展。

**谈谈你对webpack的看法**

> WebPack 是一个模块打包工具，你可以使用WebPack管理你的模块依赖，并编绎输出模块们所需的静态文件。它能够很好地管理、打包Web开发中所用到的HTML、Javascript、CSS以及各种静态文件（图片、字体等），让开发过程更加高效。对于不同类型的资源，webpack有对应的模块加载器。webpack模块打包器会分析模块间的依赖关系，最后 生成了优化且合并后的静态资源

**页面重构怎么操作？**

* 网站重构：不改变UI的情况下，对网站进行优化，在扩展的同时保持一致的UI。

* 页面重构可以考虑的方面：
    - 升级第三方依赖
    - 使用HTML5、CSS3、ES6 新特性
    - 加入响应式布局
    - 统一代码风格规范
    - 减少代码间的耦合
    - 压缩/合并静态资源
    - 程序的性能优化
    - 采用CDN来加速资源加载
    - 对于JS DOM的优化
    - HTTP服务器的文件缓存

**列举IE与其他浏览器不一样的特性？**

* IE 的渲染引擎是 Trident 与 W3C 标准差异较大：例如盒子模型的怪异模式
* JS 方面有很多独立的方法，例如事件处理不同：绑定/删除事件，阻止冒泡，阻止默认事件等
* CSS 方面也有自己独有的处理方式，例如设置透明，低版本IE中使用滤镜的方式

**是否了解公钥加密和私钥加密？**


* 私钥用于对数据进行签名，公钥用于对签名进行验证
* 网站在浏览器端用公钥加密敏感数据，然后在服务器端再用私钥解密

**WEB应用从服务器主动推送Data到客户端有那些方式？**
* AJAX 轮询
* html5 服务器推送事件
`(new EventSource(SERVER_URL)).addEventListener("message", func);`
* html5 Websocket
 - `(new WebSocket(SERVER_URL)).addEventListener("message", func);`

**你怎么看待 Web App/hybrid App/Native App？（移动端前端 和 Web 前端区别？）**

* Web App(HTML5)：采用HTML5生存在浏览器中的应用，不需要下载安装
  - 优点：开发成本低，迭代更新容易，不需用户升级，跨多个平台和终端
  - 缺点：消息推送不够及时，支持图形和动画效果较差，功能使用限制（相机、GPS等）

 * Hybrid App(混合开发)：UI WebView，需要下载安装
   - 优点：接近 Native App 的体验，部分支持离线功能
   - 缺点：性能速度较慢，未知的部署时间，受限于技术尚不成熟

* Native App(原生开发)：依托于操作系统，有很强的交互，需要用户下载安装使用

  - 优点：用户体验完美，支持离线工作，可访问本地资源（通讯录，相册）
  - 缺点：开发成本高（多系统），开发成本高（版本更新），需要应用商店的审核

**Web 前端开发的注意事项？**

* 特别设置 meta 标签 viewport
* 百分比布局宽度，结合 box-sizing: border-box;
* 使用 rem 作为计算单位。rem 只参照跟节点 html 的字体大小计算
* 使用 css3 新特性。弹性盒模型、多列布局、媒体查询等
* 多机型、多尺寸、多系统覆盖测试

**在设计 Web APP 时，应当遵循以下几点**

* 简化不重要的动画/动效/图形文字样式
* 少用手势，避免与浏览器手势冲突
* 减少页面内容，页面跳转次数，尽量在当前页面显示
* 增强 Loading 趣味性，增强页面主次关系

**平时如何管理你的项目？**

* 规定全局样式、公共脚本
* 严格要求代码注释(html/js/css)
* 严格要求静态资源存放路径
* Git 提交必须填写说明

**如何设计突发大规模并发架构？**

* 及时响应(NoSQL缓存)
* 数据安全(数据备份)
* 负载均衡

**说说最近最流行的一些东西吧？**

- ES6、Node、React、Webpack

## 开放性的题目

**对前端工程师这个职位是怎么样理解的？它的前景会怎么样？**

- 前端是最贴近用户的程序员，比后端、数据库、产品经理、运营、安全都近
  - 实现界面交互
  - 提升用户体验
  - 有了`Node.js`，前端可以实现服务端的一些事情
- 前端是最贴近用户的程序员，前端的能力就是能让产品从 `90`分进化到 `100` 分，甚至更好，
- 参与项目，快速高质量完成实现效果图，精确到`1px`
- 与团队成员，`UI`设计，产品经理的沟通；
- 做好的页面结构，页面重构和用户体验；
- 处理`hack`，兼容、写出优美的代码格式；
- 针对服务器的优化、拥抱最新前端技术。

**平时如何管理你的项目？**

- 先期团队必须确定好全局样式（`globe.css`），编码模式(`utf-8`) 等；
- 编写习惯必须一致（例如都是采用继承式的写法，单样式都写成一行）；
- 标注样式编写人，各模块都及时标注（标注关键样式调用的地方）；
- 页面进行标注（例如 页面 模块 开始和结束）；
- `CSS`跟`HTML` 分文件夹并行存放，命名都得统一（例如`style.css`）；
- `JS` 分文件夹存放 命名以该JS功能为准的英文翻译
- 图片采用整合的 `images.png` `png8` 格式文件使用
- 尽量整合在一起使用方便将来的管理

### 一些开放性题目

- 自我介绍：除了基本个人信息以外，面试官更想听的是你与众不同的地方和你的优势
- 项目介绍
- 如何看待前端开发？
- 平时是如何学习前端开发的？
- 未来三到五年的规划是怎样的？

**你觉得前端工程的价值体现在哪**

- 为简化用户使用提供技术支持（交互部分）
- 为多个浏览器兼容性提供支持
- 为提高用户浏览速度（浏览器性能）提供支持
- 为跨平台或者其他基于`webkit`或其他渲染引擎的应用提供支持
- 为展示数据提供支持（数据接口）

## 数据结构与算法之美

《[数据结构与算法之美](https://time.geekbang.org/column/126)》是极客时间上的一个算法学习系列，在学习之后特在此做记录和总结。

数据结构和算法是相辅相成的，数据结构是为算法服务的，算法要作用在特定的数据结构之上。
* 从广义上讲，数据结构就是指一组数据的存储结构。算法就是操作数据的一组方法。
* 从狭义上讲，是指某些著名的数据结构和算法，比如队列、栈、堆、二分查找、动态规划等。

### 一、时间复杂度分析

大 O 复杂度表示法，实际上并不具体表示代码真正的执行时间，而是表示代码执行时间随数据规模增长的变化趋势，所以，也叫作渐进时间复杂度（asymptotic time complexity），简称时间复杂度。

分析一段代码的时间复杂度有三个比较实用的方法：
1. 只关注循环执行次数最多的一段代码。例如代码被执行了 n 次，所以总的时间复杂度就是 O(n)。
2. 加法法则：总复杂度等于量级最大的那段代码的复杂度。例如两段代码的复杂度分别为O(n) 和 O(n^2)，那么整段代码的时间复杂度就为 O(n^2)。
3. 乘法法则：嵌套代码的复杂度等于嵌套内外代码复杂度的乘积。假设 T1(n) = O(n)，T2(n) = O(n^2)，则 T1(n) * T2(n) = O(n^3)

**1）多项式量级**

非多项式量级只有两个：O(2^n) 和 O(n!)。接下来主要来看几种常见的多项式时间复杂度。
1. O(1)，并不是指只执行了一行代码，只要算法中不存在循环语句、递归语句，即使有成千上万行的代码，其时间复杂度也是Ο(1)。
2. O(logn)、O(nlogn)，假设代码的执行次数是2^x=n，那么x=x=log2^n，因此这段代码的时间复杂度就是 O(log2^n)。
3. O(m+n)、O(m*n)，因为无法事先评估 m 和 n 谁的量级大，所以在表示复杂度的时候，就不能简单地利用加法法则，省略掉其中一个。

**2）最好和最坏**

最好情况时间复杂度就是，在最理想的情况下，执行这段代码的时间复杂度。例如在最理想的情况下，要查找的变量 x 正好是数组的第一个元素。

最坏情况时间复杂度就是，在最糟糕的情况下，执行这段代码的时间复杂度。如果数组中没有要查找的变量 x，那么需要把整个数组都遍历一遍才行。

### 二、数据结构

**1）数组**

数组（Array）是一种线性表数据结构。它用一组连续的内存空间，来存储一组具有相同类型的数据。
1. 线性表（Linear List）就是数据排成像一条线一样的结构。每个线性表上的数据最多只有前和后两个方向。比如数组、链表、队列、栈等。
2. 在非线性表中，数据之间并不是简单的前后关系。比如二叉树、堆、图等。

在面试的时候，常常会问数组和链表的区别，很多人都回答说，“链表适合插入、删除，时间复杂度 O(1)；数组适合查找，查找时间复杂度为 O(1)”。

实际上，这种表述是不准确的。数组是适合查找操作，但是查找的时间复杂度并不为 O(1)。即便是排好序的数组，你用二分查找，时间复杂度也是 O(logn)。

所以，正确的表述应该是，数组支持随机访问，根据下标随机访问的时间复杂度为 O(1)。

**2）链表**

数组和链表的区别如下：
1. 数组需要一块连续的内存空间来存储，对内存的要求比较高。链表恰恰相反，它并不需要一块连续的内存空间，它通过“指针”将一组零散的内存块串联起来使用。
2. 链表删除一个数据是非常快速的，只需考虑相邻结点的指针改变，所以对应的时间复杂度是 O(1)。而链表随机访问的性能没有数组好，需要 O(n) 的时间复杂度。

三种最常见的链表结构，它们分别是：单链表、双向链表和循环链表。
1. 单链表通过指针将一组零散的内存块串联在一起。其中，把内存块称为链表的“结点”。为了将所有的结点串起来，每个链表的结点除了存储数据之外，还需要记录链上的下一个结点的地址。把这个记录下个结点地址的指针叫作后继指针 next。
2. 循环链表是一种特殊的单链表。其优点是从链尾到链头比较方便。当要处理的数据具有环型结构特点时，就特别适合采用循环链表。
3. 双向链表支持两个方向，每个结点不止有一个后继指针 next 指向后面的结点，还有一个前驱指针 prev 指向前面的结点。

检查链表代码是否正确的边界条件有这样几个：
1. 如果链表为空时，代码是否能正常工作？
2. 如果链表只包含一个结点时，代码是否能正常工作？
3. 如果链表只包含两个结点时，代码是否能正常工作？
4. 代码逻辑在处理头结点和尾结点的时候，是否能正常工作？

5 个常见的链表操作。
1. 单链表反转
2. 链表中环的检测
3. 两个有序的链表合并
4. 删除链表倒数第 n 个结点
5. 求链表的中间结点

**3）栈**

后进者先出，先进者后出，这就是典型的“栈”结构。从栈的操作特性上来看，栈是一种“操作受限”的线性表，只允许在一端插入和删除数据。

栈既可以用数组来实现（顺序栈），也可以用链表来实现（链式栈）。

比较经典的一个应用场景就是函数调用栈。另一个常见的应用场景，编译器如何利用栈来实现表达式求值。

除了用栈来实现表达式求值，还可以借助栈来检查表达式中的括号是否匹配。比如，{[] ()[{}]}或[{()}([])]等都为合法格式，而{[}()]或[({)]为不合法的格式。

**4）队列**

先进者先出，这就是典型的“队列”。队列跟栈非常相似，支持的操作也很有限

对于栈来说，只需要一个栈顶指针就可以了。但是队列需要两个指针：一个是 head 指针，指向队头；一个是 tail 指针，指向队尾。

作为一种非常基础的数据结构，队列的应用也非常广泛。
1. 循环队列长得像一个环。原本数组是有头有尾的，是一条直线。现在把首尾相连，扳成了一个环。
2. 阻塞队列是在队列为空的时候，从队头取数据会被阻塞。如果队列已经满了，那么插入数据的操作就会被阻塞，直到队列中有空闲位置后再插入数据。
3. 并发队列最简单直接的实现方式是直接在 enqueue()、dequeue() 方法上加锁，但是锁粒度大并发度会比较低，同一时刻仅允许一个存或者取操作。

**5）跳表**

跳表（Skip List）是一种各方面性能都比较优秀的动态数据结构，可以支持快速地插入、删除、查找操作，可以替代红黑树（Red-black Tree）。

在链表上加一层索引之后，查找一个结点需要遍历的结点个数减少了，也就是说查找效率提高了。这种链表加多级索引的结构，就是跳表。

在一个单链表中查询某个数据的时间复杂度是 O(n)，在跳表中查询任意数据的时间复杂度就是 O(logn)，空间复杂度是 O(n)。

**6）散列表**

散列表（Hash Table）平时也叫“哈希表”或者“Hash 表”。散列表用的是数组支持的按照下标随机访问数据的特性，时间复杂度是 O(1) ，所以散列表其实就是数组的一种扩展，由数组演化而来。

散列函数定义成 hash(key)，其中 key 表示元素的键值，hash(key) 的值表示经过散列函数计算得到的散列值。其设计的基本要求：
1. 散列函数计算得到的散列值是一个非负整数；
2. 如果 key1 = key2，那 hash(key1) == hash(key2)；
3. 如果 key1 ≠ key2，那 hash(key1) ≠ hash(key2)。

常用的散列冲突解决方法有两类，开放寻址法（open addressing）和链表法（chaining）。
1. 开放寻址法的核心思想是，如果出现了散列冲突，就重新探测一个空闲位置，将其插入。
2. 在散列表中，每个“桶（bucket）”或者“槽（slot）”会对应一条链表，所有散列值相同的元素我们都放到相同槽位对应的链表中。

**7）二叉树**

树（Tree）有三个比较相似的概念：高度（Height）、深度（Depth）、层（Level）。

除了叶子节点之外，每个节点都有左右两个子节点，这种二叉树就叫做满二叉树。

子节点都在最底下两层，最后一层的叶子节点都靠左排列，并且除了最后一层，其他层的节点个数都要达到最大，这种二叉树叫做完全二叉树。

二叉树的遍历有三种，前序遍历、中序遍历和后序遍历。遍历的时间复杂度是 O(n)。
1. 前序遍历是指，对于树中的任意节点来说，先打印这个节点，然后再打印它的左子树，最后打印它的右子树。
2. 中序遍历是指，对于树中的任意节点来说，先打印它的左子树，然后再打印它本身，最后打印它的右子树。
3. 后序遍历是指，对于树中的任意节点来说，先打印它的左子树，然后再打印它的右子树，最后打印这个节点本身。

二叉查找树（Binary Search Tree，BST）要求，在树中的任意一个节点，其左子树中的每个节点的值，都要小于这个节点的值，而右子树节点的值都大于这个节点的值。

中序遍历二叉查找树，可以输出有序的数据序列，时间复杂度是 O(n)，非常高效。

**8）红黑树**

平衡二叉树的严格定义是这样的：二叉树中任意一个节点的左右子树的高度相差不能大于 1。

红黑树的英文是“Red-Black Tree”，简称 R-B Tree。它是一种不严格的平衡二叉查找树。

红黑树中的节点，一类被标记为黑色，一类被标记为红色。除此之外，一棵红黑树还需要满足这样几个要求：
1. 根节点是黑色的；
2. 每个叶子节点都是黑色的空节点（NIL），也就是说，叶子节点不存储数据；
3. 任何相邻的节点都不能同时为红色，也就是说，红色节点是被黑色节点隔开的；
4. 每个节点，从该节点到达其可达叶子节点的所有路径，都包含相同数目的黑色节点；

**9）堆**

堆（Heap）是一种特殊的树。
1. 堆是一个完全二叉树；
2. 堆中每一个节点的值都必须大于等于或小于等于其子树中每个节点的值，前者叫大顶堆，后者叫小顶堆。

完全二叉树比较适合用数组来存储。数组中下标为 i 的节点的左子节点，就是下标为 i*2 的节点，右子节点就是下标为 i*2+1 的节点，父节点就是下标为 2/i​ 的节点。

将堆进行调整，让其重新满足堆的特性，这个过程叫做堆化（heapify）。堆化非常简单，就是顺着节点所在的路径，向上或者向下，对比，然后交换。

堆这种数据结构几个非常重要的应用：优先级队列、求 Top K 和求中位数。

**10）图**

图（Graph）和树比起来，这是一种更加复杂的非线性表结构。

树中的元素称为节点，图中的元素就叫做顶点（vertex）。图中的一个顶点可以与任意其他顶点建立连接关系。把这种建立的关系叫做边（edge）。度（degree）就是跟顶点相连接的边的条数。

把这种边有方向的图叫做“有向图”。以此类推，把边没有方向的图就叫做“无向图”。在有向图中，把度分为入度（In-degree）和出度（Out-degree）。

**11）Trie树**

Trie 树，也叫“字典树”。它是一个树形结构，一种专门处理字符串匹配的数据结构，可解决在一组字符串集合中快速查找某个字符串的问题。

Trie 树的本质，就是利用字符串之间的公共前缀，将重复的前缀合并在一起。

每次查询时，如果要查询的字符串长度是 k，那只需要比对大约 k 个节点，就能完成查询操作。

跟原本那组字符串的长度和个数没有任何关系。所以说，构建好 Trie 树后，在其中查找字符串的时间复杂度是 O(k)，k 表示要查找的字符串的长度。

### 三、算法

**1）递归**

只要同时满足以下三个条件，就可以用递归来解决。
1. 一个问题的解可以分解为几个子问题的解。
2. 这个问题与分解之后的子问题，除了数据规模不同，求解思路完全一样。
3. 存在递归终止条件。

写递归代码的关键就是找到如何将大问题分解为小问题的规律，并且基于此写出递推公式，然后再推敲终止条件，最后将递推公式和终止条件翻译成代码。

对于递归代码，这种试图想清楚整个递和归过程的做法，实际上是进入了一个思维误区。很多时候，我们理解起来比较吃力，主要原因就是自己给自己制造了这种理解障碍。

因此，编写递归代码的关键是，只要遇到递归，我们就把它抽象成一个递推公式，不用想一层层的调用关系，不要试图用人脑去分解递归的每个步骤。

**2）排序**

分析一个排序算法，要从几个方面入手：
1. 排序算法的执行效率，衡量方面：
	* 最好情况、最坏情况、平均情况时间复杂度。
	* 时间复杂度的系数、常数 、低阶。
	* 比较次数和交换（或移动）次数。
2. 排序算法的内存消耗，针对排序算法的空间复杂度，我们还引入了一个新的概念，原地排序（Sorted in place），特指空间复杂度是 O(1) 的排序算法。
3. 排序算法的稳定性，如果待排序的序列中存在值相等的元素，经过排序之后，相等元素之间原有的先后顺序不变。

常见的排序算法有：
1. 冒泡排序（Bubble Sort），只会操作相邻的两个数据。每次冒泡操作都会对相邻的两个元素进行比较，看是否满足大小关系要求。如果不满足就让它俩互换。
2. 插入排序（Insertion Sort），取未排序区间中的元素，在已排序区间中找到合适的插入位置将其插入，并保证已排序区间数据一直有序。
3. 选择排序（Selection Sort），思路有点类似插入排序，也分已排序区间和未排序区间，但是选择排序每次会从未排序区间中找到最小的元素，将其放到已排序区间的末尾。
4. 归并排序（Merge Sort），如果要排序一个数组，先把数组从中间分成前后两部分，然后对前后两部分分别排序，再将排好序的两部分合并在一起，这样整个数组就都有序了。
5. 快速排序（Quick Sort），利用的也是分治思想，如果要排序数组中下标从 p 到 r 之间的一组数据，选择 p 到 r 之间的任意一个数据作为 pivot（分区点）。遍历 p 到 r 之间的数据，将小于 pivot 的放到左边，将大于 pivot 的放到右边，将 pivot 放到中间。归并排序和快速排序的区别：
	* 归并排序的处理过程是由下到上的，先处理子问题，然后再合并。归并排序虽然是稳定的、时间复杂度为 O(nlogn) 的排序算法，但是它是非原地排序算法。
	* 快排正好相反，它的处理过程是由上到下的，先分区，然后再处理子问题。快速排序通过设计巧妙的原地分区函数，可以实现原地排序。
6. 桶排序（Bucket Sort），将要排序的数据分到几个有序的桶里，每个桶里的数据再单独进行排序。
7. 计数排序（Counting Sort），桶排序的一种特殊情况。当要排序的 n 个数据，所处的范围并不大的时候，比如最大值是 k，就可以把数据划分成 k 个桶。每个桶内的数据值都是相同的，省掉了桶内排序的时间。
8. 堆排序，堆排序的过程大致分解成两个大的步骤，首先将数组原地建成一个堆，建堆结束之后，数组中的数据已经是按照大顶堆的特性来组织的。数组中的第一个元素就是堆顶，也就是最大的元素。把它跟最后一个元素交换，那最大元素就放到了下标为 n 的位置。

**3）二分查找**

二分查找（Binary Search）针对的是一个有序的数据集合，查找思想有点类似分治思想。每次都通过跟区间的中间元素对比，将待查找的区间缩小为之前的一半，直到找到要查找的元素，或者区间被缩小为 0。

容易出错的 3 个地方
1. 循环退出条件，注意是 low<=high，而不是 low。
2. mid 的取值，如果 low 和 high 比较大的话，两者之和就有可能会溢出。改成 low + ((high - low) >> 1) 即可。
3. low 和 high 的更新，low=mid+1，high=mid-1。注意这里的 +1 和 -1。

二分查找的时间复杂度是 O(logn)，查找数据的效率非常高。不过，并不是什么情况下都可以用二分查找，它的应用场景是有很大局限性的。
1. 二分查找依赖的是顺序表结构，简单点说就是数组。
2. 二分查找针对的是有序数据。
3. 数据量太小不适合二分查找。
4. 数据量太大也不适合二分查找。

变形问题：
1. 查找第一个值等于给定值的元素。
2. 查找最后一个值等于给定值的元素。
3. 查找第一个大于等于给定值的元素。
4. 查找最后一个小于等于给定值的元素。

**4）哈希算法**

哈希算法历史悠久，业界著名的哈希算法也有很多，比如 MD5、SHA 等。

将任意长度的二进制值串映射为固定长度的二进制值串，这个映射的规则就是哈希算法，而通过原始数据映射之后得到的二进制值串就是哈希值。

设计一个优秀的哈希算法需要满足的几点要求：
1. 从哈希值不能反向推导出原始数据（所以哈希算法也叫单向哈希算法）；
2. 对输入数据非常敏感，哪怕原始数据只修改了一个 Bit，最后得到的哈希值也大不相同；
3. 散列冲突的概率要很小，对于不同的原始数据，哈希值相同的概率非常小；
4. 哈希算法的执行效率要尽量高效，针对较长的文本，也能快速地计算出哈希值。

哈希算法的应用选了最常见的七个，分别是安全加密、唯一标识、数据校验、散列函数、负载均衡、数据分片、分布式存储。

**5）字符串匹配**

1. BF 算法是Brute Force的简称，中文叫作暴力匹配算法，也叫朴素匹配算法。在字符串 A 中查找字符串 B，那字符串 A 就是主串，字符串 B 就是模式串。把主串的长度记作 n，模式串的长度记作 m。
2. RK 算法全称叫 Rabin-Karp 算法，每次检查主串与子串是否匹配，需要依次比对每个字符。通过哈希算法对主串中的 n-m+1 个子串分别求哈希值，然后逐个与模式串的哈希值比较大小。
3. BM 算法全称叫 Boyer-Moore 算法， 其性能是著名的KMP 算法的 3 到 4 倍。在模式串与主串匹配的过程中，当模式串和主串某个字符不匹配的时候，能够跳过一些肯定不会匹配的情况，将模式串往后多滑动几位。
4. KMP 算法的核心思想和 BM 算法非常相近。假设主串是 a，模式串是 b。在模式串与主串匹配的过程中，当遇到不可匹配的字符的时候，希望找到一些规律，可以将模式串往后多滑动几位，跳过那些肯定不会匹配的情况。
5. 多模式串匹配算法只需要扫描一遍主串，就能在主串中一次性查找多个模式串是否存在，从而大大提高匹配效率。对敏感词字典进行预处理，构建成 Trie 树结构。经典的多模式串匹配算法：AC 自动机。

**6）贪心算法**

贪心算法（greedy algorithm）有很多经典的应用，比如霍夫曼编码（Huffman Coding）、Prim 和 Kruskal 最小生成树算法、还有 Dijkstra 单源最短路径算法。

贪心算法解决问题的步骤：
1. 第一步，当看到这类问题的时候，首先要联想到贪心算法：针对一组数据，定义了限制值和期望值，希望从中选出几个数据，在满足限制值的情况下，期望值最大。
2. 第二步，尝试看下这个问题是否可以用贪心算法解决：每次选择当前情况下，在对限制值同等贡献量的情况下，对期望值贡献最大的数据。
3. 第三步，举几个例子看下贪心算法产生的结果是否是最优的。

实际上，用贪心算法解决问题的思路，并不总能给出最优解。贪心算法的题目包括分糖果、钱币找零、区间覆盖等。

**7）分治算法**

分治算法（divide and conquer）的核心思想其实就是四个字，分而治之 ，也就是将原问题划分成 n 个规模较小，并且结构与原问题相似的子问题，递归地解决这些子问题，然后再合并其结果，就得到原问题的解。

分治算法的递归实现中，每一层递归都会涉及这样三个操作：
1. 分解：将原问题分解成一系列子问题；
2. 解决：递归地求解各个子问题，若子问题足够小，则直接求解；
3. 合并：将子问题的结果合并成原问题。

分治算法能解决的问题，一般需要满足下面这几个条件：
1. 原问题与分解成的小问题具有相同的模式；
2. 原问题分解成的子问题可以独立求解，子问题之间没有相关性，这一点是分治算法跟动态规划的明显区别；
3. 具有分解终止条件，也就是说，当问题足够小时，可以直接求解；
4. 可以将子问题合并成原问题，而这个合并操作的复杂度不能太高，否则就起不到减小算法总体复杂度的效果了。

**8）回溯算法**

回溯的处理思想，有点类似枚举搜索。枚举所有的解，找到满足期望的解。为了有规律地枚举所有可能的解，避免遗漏和重复，把问题求解的过程分为多个阶段。

每个阶段，都会面对一个岔路口，先随意选一条路走，当发现这条路走不通的时候（不符合期望的解），就回退到上一个岔路口，另选一种走法继续走。

回溯算法的应用包括深度优先搜索、八皇后、0-1 背包问题、图的着色、旅行商问题、数独、全排列、正则表达式匹配等。

**9）动态规划**

动态规划（Dynamic Programming）比较适合用来求解最优问题，比如求最大值、最小值等等。

它的主要学习难点跟递归类似，那就是，求解问题的过程不太符合人类常规的思维方式。

把问题分解为多个阶段，每个阶段对应一个决策。记录每一个阶段可达的状态集合（去掉重复的），然后通过当前阶段的状态集合，来推导下一个阶段的状态集合，动态地往前推进。

一个模型”指的是动态规划适合解决的问题的模型。这个模型定义为“多阶段决策最优解模型”。“三个特征”分别是最优子结构、无后效性和重复子问题。
1. 最优子结构指的是，问题的最优解包含子问题的最优解。反过来说就是，可以通过子问题的最优解，推导出问题的最优解。
2. 无后效性有两层含义，第一层含义是，在推导后面阶段的状态的时候，只关心前面阶段的状态值，不关心这个状态是怎么一步一步推导出来的。第二层含义是，某阶段状态一旦确定，就不受之后阶段的决策影响。
3. 重复子问题。如果用一句话概括一下，那就是，不同的决策序列，到达某个相同的阶段时，可能会产生重复的状态。

解决动态规划问题，一般有两种思路。
1. 状态转移表法。状态表一般都是二维的，所以你可以把它想象成二维数组。其中，每个状态包含三个变量，行、列、数组值。根据决策的先后过程，从前往后递推关系，分阶段填充状态表中的每个状态。
2. 状态转移方程法。根据最优子结构，写出递归公式，也就是所谓的状态转移方程。

## 说说TS和ES的区别，以及TS带来的好处？

目标：生命周期较长（常常持续几年）的复杂SPA应用，保障开发效率的同时提升代码的可维护性和线上运行时质量。

- 从开发效率上看，虽然需要多写一些类型定义代码，但TS在VSCode、WebStorm等IDE下可以做到智能提示，智能感知bug，同时我们项目常用的一些第三方类库框架都有TS类型声明，我们也可以给那些没有TS类型声明的稳定模块写声明文件，如我们的前端KOP框架(目前还是蚂蚁内部框架，类比dva)，这在团队协作项目中可以提升整体的开发效率。
- 从可维护性上看，长期迭代维护的项目开发和维护的成员会有很多，团队成员水平会有差异，而软件具有熵的特质，长期迭代维护的项目总会遇到可维护性逐渐降低的问题，有了强类型约束和静态检查，以及智能IDE的帮助下，可以降低软件腐化的速度，提升可维护性，且在重构时，强类型和静态类型检查会帮上大忙，甚至有了类型定义，会不经意间增加重构的频率（更安全、放心）。
- 从线上运行时质量上看，我们现在的SPA项目的很多bug都是由于一些调用方和被调用方（如组件模块间的协作、接口或函数的调用）的数据格式不匹配引起的，由于TS有编译期的静态检查，让我们的bug尽可能消灭在编译器，加上IDE有智能纠错，编码时就能提前感知bug的存在，我们的线上运行时质量会更为稳定可控。

TS适合大规模JavaScript应用，正如他的官方宣传语JavaScript that scales。从以下几点可以看到TS在团队协作、可维护性、易读性、稳定性（编译期提前暴露bug）等方面上有着明显的好处：

- 加上了类型系统，对于阅读代码的人和编译器都是友好的。对阅读者来说，类型定义加上IDE的智能提示，增强了代码的易读型；对于编译器来说，类型定义可以让编译器揪出隐藏的bug。
- 类型系统+静态分析检查+智能感知/提示，使大规模的应用代码质量更高，运行时bug更少，更方便维护。
- 有类似VSCode这样配套的IDE支持，方便的查看类型推断和引用关系，可以更方便和安全的进行重构，再也不用全局搜索，一个个修改了。
- 给应用配置、应用状态、前后端接口及各种模块定义类型，整个应用都是一个个的类型定义，使协作更为方便、高效和安全。

## TypeScript 简介及优缺点
TypeScript 是 JavaScript 的一个超集，提供了类型系统和对ES6的支持，可编译成纯 JavaScript，可以运行在任何浏览器上，TS编译工具也可运行在任何服务器和系统上

### 优点
- （1）增强代码的可读性和可维护性，强类型的系统相当于最好的文档，在编译时即可发现大部分的错误，增强编辑器的功能。
- （2）包容性，js文件可以直接改成 ts 文件，不定义类型可自动推论类型，可以定义几乎一切类型，ts 编译报错时也可以生成 js 文件，兼容第三方库，即使不是用ts编写的
- （3）有活跃的社区，大多数的第三方库都可提供给 ts 的类型定义文件，完全支持 es6 规范

### 缺点
- （1）增加学习成本，需要理解接口（Interfaces）和泛型（Generics），类（class），枚举类型（Enums）
- （2）短期增加开发成本，增加类型定义，但减少维护成本
- （3）ts 集成到构建流程需要一定的工作量
- （4）和有些库结合时不是很完美

## TypeScript中的void和null与undefined两种类型的区别是什么？

ts中的null和undefined是其他类型的子类型，可以赋值给其他类型：

``` ts
// 方式1
let a: number = null;
// 方式2
let a: number = undefind;
// 方式3
let a: null;
let b: number = a;
//方式4
let a: undefined;
let b: number = a;
```

但是void和其他类型是平等关系，不能直接赋值:

``` ts
let a: void;
// 错误
let b: number = a;
```

严格模式中

严格模式通过tsconfig.json配置，配置如下：

``` json
{
    "compilerOptions": { // 编译选项,可以被忽略，这时编译器会使用默认值
        "strictNullChecks": true, // 在严格的null检查模式下，null和undefined值不包含在任何类型里，只允许赋值给void和本身对应的类型。
    }
}
```

严格模式下，undefined和null不能给其他类型赋值，只能给他们自己的类型赋值。
``` ts
let a: null = null;
let b: undefined = undefined;
```


但是undefined可以给void赋值：

``` ts
let c: void = undefined;
```

## TypeScript的类型推论


### 类型推论
如果没有明确的指定类型，那么 TypeScript 会依照类型推论（Type Inference）的规则推断出一个类型。

### 什么是类型推论

以下代码虽然没有指定类型，但是会在编译的时候报错：

``` ts
let myFavoriteNumber = 'seven';
myFavoriteNumber = 7;

// index.ts(2,1): error TS2322: Type 'number' is not assignable to type 'string'.
```

事实上，它等价于：

``` ts
let myFavoriteNumber: string = 'seven';
myFavoriteNumber = 7;

// index.ts(2,1): error TS2322: Type 'number' is not assignable to type 'string'.
```

TypeScript 会在没有明确的指定类型的时候推测出一个类型，这就是类型推论。

**如果定义的时候没有赋值，不管之后有没有赋值，都会被推断成 `any` 类型而完全不被类型检查：**

``` ts
let myFavoriteNumber;
myFavoriteNumber = 'seven';
myFavoriteNumber = 7;
```

## 在TypeScript中，readonly和const两个关键字有什么区别？

### 相同点

readonly和const这二者都是常量，一旦初始化就不能在改变

### 不同点

1. const只能在声明时初始化，而readonly既可以在声明中初始化，又可以在构造函数中初始化；
2. const隐含static，不可以再写static const；readonly则不默认static，如需要可以写static readonly；
3. const是编译期静态解析的常量（因此其表达式必须在编译时就可以求值）；readonly则是运行期动态解析的常量；
4. const既可用来修饰类中的成员，也可修饰函数体内的局部变量；readonly只可以用于修饰类中的成员。


## 什么是泛型？

泛型是程序设计语言中的一种风格或范式，相当于类型模板，允许在声明类、接口或函数等成员时忽略类型，而在未来使用时再指定类型，其主要目的是为它们提供有意义的约束，提升代码的可重用性。

### 一、泛型参数

当一个函数需要能处理多种类型的参数和返回值，并且还得约束它们之间的关系（例如类型要相同）时，就可以采用泛型的语法，如下所示。

``` ts
function send<T>(data: T): T {
  return data;
}
```

函数名称后面跟了，其中把T称为泛型参数或泛型变量，表示某种数据类型。注意，T只是个占位符，可以命名的更含语义，例如TKey、TValue等。在使用时，既可以指定类型，也可以利用类型推论自动确定类型，如下所示。

``` ts
send<number>(10);        //指定类型
send(10);            　　//类型推论
```

当需要处理T类型的数组时，可以像下面这么写。

``` ts
function send<T>(data: T[]): T[] {
  return data;
}

send<number>([1, 2, 3]);
```

当指定一个泛型函数的类型时，需要包含泛型参数，如下所示，其中泛型参数和函数参数的名称都可与定义时的不同。

``` ts
let func: (<U>(data: U) => U) = send;
```

泛型参数还支持传递多个，只需在声明时增加类型占位符即可。在下面的示例中，将T和U合并成了一个元组类型，还有许多其它用法，将在后面讲解。

``` ts
function send<T, U>(data: [T, U]): [T, U] {
  return data;
}
send<number, string>([1, "a"]);
```

### 二、泛型接口

在接口中，可利用泛型来约束函数的结构，如下所示，接口中声明的调用签名包含泛型参数。

``` ts
interface Func {
  <T>(str: T): T;
}
function send<T>(str: T): T {
  return str;
}
let fn: Func = send;
```

泛型参数还可以作为接口的一个参数存在，即把用尖括号包裹的泛型参数移到接口名称之后，如下所示。

``` ts
interface Func<T> {
  (str: T): T;
}
function send<T>(str: T): T {
  return str;
}
let fn: Func<string> = send;
```

当把Func接口作为类型使用时，需要向其传入一个类型，例如上面赋值语句中的string。

### 三、泛型类

泛型类与泛型接口类似，也是在名称后添加泛型参数，如下所示，其中send属性中的“=>”符号不表示箭头函数，而是用来定义方法的返回值类型。

``` ts
class Person<T> {
  name: T;
  send: (data: T) => T;
}
```

在实例化泛型类时，需要为其指定一种类型，如下所示。

``` ts
let person = new Person<string>();
person.send = function(data) {
  return data;
}
```

注意，类的静态部分不能使用泛型参数。

### 四、泛型约束

在使用泛型时，由于事先不清楚参数的数据类型，因此不能随意调用它的属性或方法，甚至无法对其使用运算符。在下面的示例中，访问了data的length属性，但由于编译器无法确定它的类型，因此就会报错。

``` ts
function send<T>(data: T): T {
  console.log(data.length);
  return data;
}
```

TypeScript允许为泛型参数添加约束条件，从而就能调用相应的属性或方法了，如下所示，通过extends关键字约束T必须是string的子类型。

``` ts
function send<T extends string>(data: T): T {
  console.log(data.length);
  return data;
}
```

在添加了这个约束之后，send()函数就无法接收数字类型的参数了，如下所示。

``` ts
send("10");        //正确
send(10);          //错误
```

#### 1）创建类的实例

在使用泛型创建类的工厂函数时，需要声明T类型拥有构造函数，如下所示。

``` ts
class Programmer {}
function create<T>(ctor: {new(): T}): T {
  return new ctor();
}
create(Programmer);
```

用“{new(): T}”替代原先的类型占位符，表示可以被new运算符实例化，并且得到的是T类型，另一种相同作用的写法如下所示。

``` ts
function create<T>(ctor: new()=>T): T {
  return new ctor();
}
```

#### 2）多个泛型参数

在TypeScript中，多个泛型参数之间也可以相互约束，如下所示，创建了基类Person和派生类Programmer，并将create()函数中的T约束为U的子类型。

``` ts
class Person { }
class Programmer extends Person { }
function create<T extends U, U>(target: T, source: U): T {
  return target;
}
```

当传递给create()函数的参数不符合约束条件时，就会在编译阶段报错，如下所示。

``` ts
create(Programmer, Person);        //正确
create(Programmer, 10);            //错误
```

## TypeScript 类型兼容性整理

### 一、介绍

TypeScript里的类型兼容性是基于结构子类型的。结构类型是一种只使用其成员来描述类型的方式。

它正好与名义(nominal)类型形成对比。

TypeScript的结构性子类型是根据JavaScript代码的典型写法来设计的。因为JavaScript里广泛的使用匿名对象，例如函数表达式和对象字面量，所以使用结构类型系统来描述类型比名义类型系统更好。

#### 1.基本规则，具有相同的属性

``` ts
// 基本规则是具有相同的属性
// 类似继承，子类型中的属性在父类中都存在，反之则编译失败
// 特别说明，TypeScript中类的属性默认值都为undefined
// 属性为undefined的不会编译到js文件中去
interface Named {
    name: string;
}
class Person {
    name: string;
    age:number;
}
let p: Named;
//Person没有继承Named
//同样编译通过，运行通过
p = new Person();
p.name = '张三丰';
console.info(p);
```

### 二、函数兼容性

#### 1. 形参

``` ts
// 函数兼容性比较
// 形参需要包含关系
// 形参1是形参2的子类型，参数名字可以不相同
let x = (a: number) => 0;
let y = (b: number, s: string) => 0;
x = y; // 编译报错，x参数中没有s参数
y = x;
```

#### 2. 返回类型

``` ts
// 返回类型，需要被包含关系
// 返回类型1,是返回类型2的子类型
let x = () => ({name:'Alice'});
let y = () => ({name:'Alice',location:'Seattle'});
y = x; // 编译报错，x中没有返回参数location
x = y;
```

#### 3. 可选参数及剩余参数

比较函数兼容性的时候，可选参数与必须参数是可互换的。 源类型上有额外的可选参数不是错误，目标类型的可选参数在源类型里没有对应的参数也不是错误。

当一个函数有剩余参数时，它被当做无限个可选参数。

这对于类型系统来说是不稳定的，但从运行时的角度来看，可选参数一般来说是不强制的，因为对于大多数函数来说相当于传递了一些undefinded。

### 三、枚举

枚举类型与数字类型兼容，并且数字类型与枚举类型兼容。不同枚举类型之间是不兼容的。

``` ts
// 枚举
// 枚举类型与数字类型兼容，并且数字黑星与枚举类型兼容。不同枚举类型之间是不兼容的.
enum Status {
  Ready,
  Warting
}
enum Color {
  Red,
  Blue,
  Green
}
console.log(Status.Ready == 0); // 输出true
let status = Status.Ready; // 输出0
console.log(status);
status = 2;
console.log(status); // 输出2
//status = Color.Blue; / /编译报错，不同枚举类型之间不兼容
```

### 四、类

类与对象字面量和接口差不多，但有一点不同：类有静态部分和实例部分的类型。 比较两个类类型的对象时，只有实例的成员会被比较。 静态成员和构造函数不在比较的范围内。

``` ts
class Animal {
  feet: number;
  constructor(name: string, numFeet: number) { }
}

class Size {
  feet: number;
  constructor(numFeet: number) { }
}

let a: Animal;
let s: Size;

a = s;  // OK
s = a;  // OK
```

私有成员会影响兼容性判断。 当类的实例用来检查兼容时，如果目标类型包含一个私有成员，那么源类型必须包含来自同一个类的这个私有成员。 这允许子类赋值给父类，但是不能赋值给其它有同样类型的类。

### 五、泛型

因为TypeScript是结构性的类型系统，类型参数只影响使用其做为类型一部分的结果类型。

``` ts
interface Empty<T> {
}
let x: Empty<number>;
let y: Empty<string>;

x = y;  // okay, y matches structure of x
```

### 六、高级注册

目前为止，我们使用了`兼容性`，它在语言规范里没有定义。 在TypeScript里，有两种类型的兼容性：子类型与赋值。 它们的不同点在于，赋值扩展了子类型兼容，允许给 **any** 赋值或从**any**取值和允许数字赋值给枚举类型或枚举类型赋值给数字。

语言里的不同地方分别使用了它们之中的机制。 实际上，类型兼容性是由赋值兼容性来控制的甚至在 **implements** 和 **extends** 语句里。


## 接口interface和类型别名type的用法区别

### 定义对象类型

接口interface和类型别名type用来定义对象类型时，都可以支持，而且泛型也可以使用。

``` ts
interface IPerson<T> {
  age: T;
  name: string
};

const hank1: IPerson<number> = {
  age: 18,
  name: 'hank',
};

type TPerson<T> = {
  age: T;
  name: string
};

const hank2: TPerson<number> = {
  age: 18,
  name: 'hank',
};
```

### 定义简单(基本数据)类型

类型别名type可以用来定义简单类型时，接口interface不支持定义简单类型

``` ts
type Name = string | number;

const name = 'hank';
```

### 定义函数类型

接口interface和类型别名type都支持用来定义函数类型，具体写法会存在区别，

``` ts
interface ISetPerson {
  (age: number, name: string) => void;
}

const setPerson1: ISetPerson = (age: number, name: string): void => {};

type TSetPerson = (age: number, name: string) => void;

const setPerson2: TSetPerson = (age: number, name: string): void => {};
```

### 被类实现

接口interface可以被类实现(implements)，类型别名无法被类实现

``` ts
interface ISetPerson {
  setPerson(age: number, name: string) => void;
}

class Person implements ISetPerson {
  setPerson(age: number, name: string): void => {

  }
}
```

### 自己能否继承(extends)

接口interface能继承(extends)其他的的接口，但是类型别名无法继承(extends)其他的类型别名，但可以使用交叉类型代替extends来达到同样的效果

``` ts
interface ICommon {
  sex: string
};

interface IPerson<T> extends ICommon {
  age: T;
  name: string
};

const hank1: IPerson<number> = {
  sex: 'Man',
  age: 18,
  name: 'hank',
};

type TCommon = {
  sex: string,
};

type TPerson<T> = {
  age: T;
  name: string
} & TCommon; // 交叉类型

const hank2: TPerson<number> = {
  sex: 'Man',
  age: 18,
  name: 'hank',
};
```

类型别名type可以使用联合类型、交叉类型还有元组等类型

``` ts

interface ICommon {
  sex: string
};

interface IPerson<T> extends ICommon {
  age: T;
  name: string
};

type TCommon = {
  sex: string,
};

type TPerson<T> = {
  age: T;
  name: string
} & TCommon; // 交叉类型

// 联合类型
type P1 = IPerson<number> | TPerson<number>;
// 元组
type P2 = [IPerson<number>, TPerson<number>];
```

### 结合typeof使用

类型别名type最大的特点是可以结合typeof使用

``` ts
class Person {
  setPerson(age: number, name: string) {

  }
}

type TPerson = typeof Person;

const CPerson: TPerson = class {
  setPerson(age: number, name: string) {

  }
}
```

## TypeScript 中的 d.ts 文件有什么作用

TypeScript 相比 JavaScript 增加了类型声明。这些类型声明帮助编译器识别类型，从而帮助开发者在编译阶段就能发现错误。

d.ts类型定义文件，我感觉现在对我的用处就是编辑器的智能提示

## TypeScript 命名空间和模块

### 命名空间和模块

关于术语的说明：值得注意的是，在TypeScript 1.5中，命名法已经改变。

"内部模块"现在是"命名空间"。

"外部模块"现在只是"模块"，以便与ECMAScript 2015的术语保持一致（即module X {相当于现在首选的namespace X {）。

### 使用命名空间

命名空间只是全局命名空间中的JavaScript对象。
这使命名空间成为一个非常简单的构造。
它们可以跨多个文件，并且可以使用--outFile连接。
命名空间可以是在Web应用程序中构建代码的好方法，所有依赖项都包含在HTML页面中的\<script>标记中。

就像所有全局命名空间污染一样，很难识别组件依赖性，尤其是在大型应用程序中。

### 使用模块

就像命名空间一样，模块可以包含代码和声明。
主要区别在于模块声明了它们的依赖关系。

模块还依赖于模块加载器（例如CommonJs/Require.js）。
对于小型JS应用程序而言，这可能不是最佳选择，但对于大型应用程序，成本具有长期模块化和可维护性优势。
模块为捆绑提供了更好的代码重用，更强的隔离和更好的工具支持。

值得注意的是，对于Node.js应用程序，模块是构造代码的默认方法和推荐方法。

从ECMAScript 2015开始，模块是该语言的本机部分，并且应该受到所有兼容引擎实现的支持。
因此，对于新项目，模块将是推荐的代码组织机制。

### 命名空间和模块的缺陷

下面我们将描述使用命名空间和模块时的各种常见缺陷，以及如何避免它们。

``` ts
/// <reference>-ing a module
```

一个常见的错误是尝试使用/// \<reference ... />语法来引用模块文件，而不是使用import语句。
为了理解这种区别，我们首先需要了解编译器如何根据导入的路径找到模块的类型信息（例如...在,import x from "...";const x = require("...");等等。路径。

编译器将尝试使用适当的路径查找.ts，.tsx和.d.ts。
如果找不到特定文件，则编译器将查找环境模块声明。
回想一下，这些需要在.d.ts文件中声明。

myModules.d.ts

``` ts
// In a .d.ts file or .ts file that is not a module:
declare module "SomeModule" {
  export function fn(): string;
}
```

myOtherModule.ts
``` ts
/// <reference path="myModules.d.ts" />
import * as m from "SomeModule";
```

这里的引用标记允许我们找到包含环境模块声明的声明文件。
这就是使用几个TypeScript示例使用的node.d.ts文件的方式。

### 无需命名空间

如果您要将程序从命名空间转换为模块，则可以很容易地得到如下所示的文件：

shapes.ts

``` ts
export namespace Shapes {
  export class Triangle { /* ... */ }
  export class Square { /* ... */ }
}
```

这里的顶级模块Shapes无缘无故地包装了Triangle和Square。
这对您的模块的消费者来说是令人困惑和恼人的：

shapeConsumer.ts

``` ts
import * as shapes from "./shapes";
let t = new shapes.Shapes.Triangle(); // shapes.Shapes?
```

TypeScript中模块的一个关键特性是两个不同的模块永远不会为同一范围提供名称。
因为模块的使用者决定分配它的名称，所以不需要主动地将命名空间中的导出符号包装起来。

为了重申您不应该尝试命名模块内容的原因，命名空间的一般概念是提供构造的逻辑分组并防止名称冲突。
由于模块文件本身已经是逻辑分组，并且其顶级名称由导入它的代码定义，因此不必为导出的对象使用其他模块层。

这是一个修改过的例子：
shapes.ts

``` ts
export class Triangle { /* ... */ }
export class Square { /* ... */ }
```

shapeConsumer.ts

``` ts
import * as shapes from "./shapes";
let t = new shapes.Triangle();
```

### 模块的权衡

正如JS文件和模块之间存在一对一的对应关系一样，TypeScript在模块源文件与其发出的JS文件之间具有一对一的对应关系。
这样做的一个结果是，根据您定位的模块系统，无法连接多个模块源文件。
例如，在定位commonjs或umd时不能使用outFile选项，但使用TypeScript 1.8及更高版本时，可以在定位amd或system时使用outFile。

## TypeScript 装饰器

装饰器（Decorator）可声明在类及其成员（例如属性、方法等）之上，为它们提供一种标注，用于分离复杂逻辑或附加额外逻辑，其语法形式为@expression。expression是一个会在运行时被调用的函数，它的参数是被装饰的声明信息。假设有一个@sealed装饰器，那么可以像下面这样定义sealed()函数。

``` ts
function sealed(target) {
  //...
}
```

有两种方式可以开启装饰器，第一种是在输入命令时添加--experimentalDecorators参数，如下所示，其中--target参数不能省略，它的值为“ES5”。

``` shell
tsc default.ts --target ES5 --experimentalDecorators
```

第二种是在tsconfig.json配置文件中添加experimentalDecorators属性，如下所示，对应的target属性也不能省略。

``` json
{
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true
  }
}
```

### 一、类装饰器

类装饰器用于监听、修改或替换类的构造函数，并将其作为类装饰器唯一可接收的参数。当装饰器返回undefined时，延用原来的构造函数；而当装饰器有返回值时，会用它来覆盖原来的构造函数。下面的示例会通过类装饰器封闭类的构造函数和原型，其中@sealed声明在类之前。

``` ts
@sealed
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
```

在经过TypeScript编译后，将会生成一个__decorated()函数，并应用到Person类上，如下所示。

``` js
var Person = /** @class */ (function() {
  function Person(name) {
    this.name = name;
  }
  Person = __decorate([sealed], Person);
  return Person;
})();
```

注意，类装饰器不能出现在.d.ts声明文件和外部类之中。

### 二、方法装饰器

方法装饰器声明在类的方法之前，作用于方法的属性描述符，比类装饰器还多一个重载限制。它能接收三个参数，如下所列：

- （1）对于静态成员来说是类的构造函数，而对于实例成员则是类的原型对象。
- （2）成员的名字，一个字符串或符号。
- （3）成员的属性描述符，当输出版本低于ES5时，该值将会是undefined。

当方法装饰器返回一个值时，会覆盖当前方法的属性描述符。下面是一个简单的例子，方法装饰器的第一个参数是Person.prototype，第二个是“cover”，调用getName()方法得到的将是“freedom”，而不是原先的“strick”。

``` ts
class Person {
  @cover
  getName(name) {
    return name;
  }
}
function cover(target: any, key: string, descriptor: PropertyDescriptor) {
  descriptor.value = function() {
    return "freedom";
  };
  return descriptor;
}
let person = new Person();
person.getName("strick");        //"freedom"
```

### 三、访问器装饰器

访问器装饰器声明在类的访问器属性之前，作用于相应的属性描述符，其限制与类装饰器相同，而接收的三个参数与方法装饰器相同。并且还需要注意一点，TypeScript不允许同时装饰一个成员的get和set访问器，只能应用在第一个访问器上。

以下面的Person类为例，定义了一个访问器属性name，当访问它时，得到的将是“freedom”，而不是原先的“strick”。

``` ts
class Person {
  private _name: string;
  @access
  get name() {
    return this._name;
  }
  set name(name) {
    this._name = name;
  }
}
function access(target: any, key: string, descriptor: PropertyDescriptor) {
  descriptor.get = function() {
    return "freedom";
  };
  return descriptor;
}
let person = new Person();
person.name = "strick";
console.log(person.name);        //"freedom"
```

### 四、属性装饰器

属性装饰器声明在属性之前，其限制与访问器装饰器相同，但只能接收两个参数，不存在第三个属性描述符参数，并且没有返回值。仍然以下面的Person类为例，定义一个name属性，并且在@property装饰器中修改其值。

``` ts
class Person {
  @property
  name: string;
}
function property(target: any, key: string) {
  Object.defineProperty(target, key, {
    value: "freedom"
  });
}
let person = new Person();
person.name = "strick";
console.log(person.name);        //"freedom"
```

### 五、参数装饰器

参数装饰器声明在参数之前，它没有返回值，其限制与方法装饰器相同，并且也能接收三个参数，但第三个参数表示装饰的参数在函数的参数列表中所处的位置（即索引）。下面用一个例子来演示参数装饰器的用法，需要与方法装饰器配合。

``` ts
let params = [];
class Person {
  @func
  getName(@required name) {
    return name;
  }
}
```

在@func中调用getName()方法，并向其传入params数组中的值，@required用于修改指定位置的参数的值，如下所示。

``` ts
function func(target: any, key: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = function () {
    return method.apply(this, params);
  };
  return descriptor;
}
function required(target: any, key: string, index: number) {
  params[index] = "freedom";
}
```

当实例化Person类，调用getName()方法，得到的将是“freedom”。

``` ts
let person = new Person();
person.getName("strick");        //"freedom"
```

### 六、装饰器工厂

装饰器工厂是一个能接收任意个参数的函数，用来包裹装饰器，使其更易使用，它能返回上述任意一种装饰器函数。接下来改造方法装饰器一节中的cover()函数，接收一个字符串类型的value参数，返回一个方法装饰器函数，如下所示。

``` ts
function cover(value: string) {
  return function(target: any, key: string, descriptor: PropertyDescriptor) {
    descriptor.value = function() {
      return value;
    };
    return descriptor;
  };
}
```

在将@cover作用于类中的方法时，需要传入一个字符串，如下所示。

``` ts
class Person {
  @cover("freedom")
  getName(name) {
    return name;
  }
}
```

### 七、装饰器组合

将多个装饰器应用到同一个声明上时，既可以写成一行，也可以写成多行，如下所示。

``` ts
/****** 一行 ******/
@first @second desc
/****** 多行 ******/
@first
@second
desc
```

这些装饰器的求值方式与复合函数类似，先由上至下依次执行装饰器，再将求值结果作为函数，由下至上依次调用。例如定义两个装饰器工厂函数，如下代码所示，在函数体和返回的装饰器中都会打印一个数字。

``` ts
function first() {
  console.log(1);
  return function(target: any, key: string, descriptor: PropertyDescriptor) {
    console.log(2);
  };
}
function second() {
  console.log(3);
  return function(target: any, key: string, descriptor: PropertyDescriptor) {
    console.log(4);
  };
}
```

将它们先后声明到类中的同一个方法，如下代码所示。根据求值顺序可知，先打印出1和3，再打印出4和2。

``` ts
class Person {
  @first()
  @second()
  getName(name) {
    return name;
  }
}
```

## 简单描述下微信小程序的相关文件类型？

微信小程序项目结构主要有四个文件类型, 如下

1. WXML （WeiXin Markup Language）是框架设计的一套标签语言，结合基础组件. 事件系统，可以构建出页面的结构。内部主要是微信自己定义的一套组件。

2. WXSS (WeiXin Style Sheets)是一套样式语言，用于描述 WXML 的组件样式，

3. js 逻辑处理，网络请求

4. json 小程序设置，如页面注册，页面标题及tabBar。

## 你是怎么封装微信小程序的数据请求的？

1. 将所有的接口放在统一的js文件中并导出

2. 在app. js中创建封装请求数据的方法

3. 在子页面中调用封装的方法请求数据

## 有哪些参数传值的方法？

1. 给HTML元素添加data-*属性来传递我们需要的值，然后通过e. currentTarget. dataset或onload的param参数获取。但data-名称不能有大写字母和不可以存放对象

2. 设置id 的方法标识来传值通过e. currentTarget. id获取设置的id的值, 然后通过设置全局对象的方式来传递数值

3. 在navigator中添加参数传值

## 你使用过哪些方法，来提高微信小程序的应用速度？

1. 提高页面加载速度

2. 用户行为预测

3. 减少默认data的大小

4. 组件化方案

## 小程序与原生App哪个好？

小程序除了拥有公众号的低开发成本. 低获客成本低以及无需下载等优势，在服务请求延时与用户使用体验是都得到了较大幅度 的提升，使得其能够承载跟复杂的服务功能以及使用户获得更好的用户体验

## 简述微信小程序原理？

微信小程序采用JavaScript. WXML. WXSS三种技术进行开发，从技术讲和现有的前端开发差不多，但深入挖掘的话却又有所不同。

JavaScript：首先JavaScript的代码是运行在微信App中的，并不是运行在浏览器中，因此一些H5技术的应用，需要微信App提供对应的API支持，而这限制住了H5技术的应用，且其不能称为严格的H5，可以称其为伪H5，同理，微信提供的独有的某些API，H5也不支持或支持的不是特别好。

WXML：WXML微信自己基于XML语法开发的，因此开发时，只能使用微信提供的现有标签，HTML的标签是无法使用的。

WXSS：WXSS具有CSS的大部分特性，但并不是所有的都支持，而且支持哪些，不支持哪些并没有详细的文档。

微信的架构，是数据驱动的架构模式，它的UI和数据是分离的，所有的页面更新，都需要通过对数据的更改来实现。

小程序分为两个部分webview和appService。其中webview主要用来展现UI，appService有来处理业务逻辑. 数据及接口调用。它们在两个进程中运行，通过系统层JSBridge实现通信，实现UI的渲染. 事件的处理

## 分析下微信小程序的优劣势？

优势：

1. 无需下载，通过搜索和扫一扫就可以打开。

2. 良好的用户体验：打开速度快。

3. 开发成本要比App要低。

4. 安卓上可以添加到桌面，与原生App差不多。

5. 为用户提供良好的安全保障。小程序的发布，微信拥有一套严格的审查流程， 不能通过审查的小程序是无法发布到线上的。

劣势：

1. 限制较多。页面大小不能超过1M。不能打开超过5个层级的页面。

2. 样式单一。小程序的部分组件已经是成型的了，样式不可以修改。例如：幻灯片. 导航。

3. 推广面窄，不能分享朋友圈，只能通过分享给朋友，附近小程序推广。其中附近小程序也受到微信的限制。

4. 依托于微信，无法开发后台管理功能。

## 微信小程序与H5的区别？

1. 运行环境的不同

传统的HTML5的运行环境是浏览器，包括webview，而微信小程序的运行环境并非完整的浏览器，是微信开发团队基于浏览器内核完全重构的一个内置解析器，针对小程序专门做了优化，配合自己定义的开发语言标准，提升了小程序的性能。

2. 开发成本的不同

只在微信中运行，所以不用再去顾虑浏览器兼容性，不用担心生产环境中出现不可预料的奇妙BUG

3. 获取系统级权限的不同

系统级权限都可以和微信小程序无缝衔接

4. 应用在生产环境的运行流畅度

长久以来，当HTML5应用面对复杂的业务逻辑或者丰富的页面交互时，它的体验总是不尽人意，需要不断的对项目优化来提升用户体验。但是由于微信小程序运行环境独立

## 怎么解决小程序的异步请求问题？
在回调函数中调用下一个组件的函数：

app. js

``` js
success: function(info) {
    that.apirtnCallback(info)
}
```

index. js

``` js
onLoad: function() {
    app.apirtnCallback = res => {
        console.log(res)
    }
}
```

## 小程序的双向绑定和vue哪里不一样？

小程序直接this. data的属性是不可以同步到视图的，必须调用

``` js
this.setData({
    noBind: true
})
```

## 小程序的wxss和css有哪些不一样的地方？

1. wxss的图片引入需使用外链地址；

2. 没有Body, 样式可直接使用import导入；

## webview中的页面怎么跳回小程序中？

首先要引入最新版的jweixin-1.3.2.js，然后

``` js
wx.miniProgram.navigateTo({
    url: '/pages/login/login' + '$params'
})
```

## 小程序关联微信公众号如何确定用户的唯一性？

使用wx. getUserInfo方法withCredentials为 true 时 可获取encryptedData，里面有 union_id。后端需要进行对称解密

## 如何实现下拉刷新？

用view代替scroll-view, , 设置onPullDownRefresh函数实现

## 使用webview直接加载要注意哪些事项？

1. 必须要在小程序后台使用管理员添加业务域名；

2. h5页面跳转至小程序的脚本必须是jweixin-1.3.2.js及以上；

3. 微信分享只可以都是小程序的主名称了，如果要自定义分享的内容，需小程序版本在1.7.1以上；

4. h5的支付不可以是微信公众号的appid，必须是小程序的appid，而且用户的openid也必须是用户和小程序的。

## 小程序调用后台接口遇到哪些问题？

1. 数据的大小有限制，超过范围会直接导致整个小程序崩溃，除非重启小程序；

2. 小程序不可以直接渲染文章内容页这类型的html文本内容，若需显示要借住插件，但插件渲染会导致页面加载变慢，所以最好在后台对文章内容的html进行过滤，后台直接处理批量替换p标签div标签为view标签，然后其它的标签让插件来做，减轻前端的时间。

## webview的页面怎么跳转到小程序导航的页面？

小程序导航的页面可以通过switchTab，但默认情况是不会重新加载数据的。 若需加载新数据，则在success属性中加入以下代码即可：

``` js
success: function(e) {
    var page = getCurrentPages().pop();
    if (page == undefined || page == null) return;
    page.onLoad();
}
```

webview的页面，则通过

``` js
wx.miniProgram.switchTab({
    url: '/pages/index/index'
})
```

## 小程序和Vue写法的区别？

1. 循环遍历的时候：小程序是wx:for="list"，而Vue是v-for="(item, index) in list"

2. 调用data模型的时候：小程序是this.data.uinfo，而Vue是this.uinfo；给模型赋值也不一样，小程序是this.setData({uinfo:1})，而Vue是直接this.uinfo=1

## 小程序生命周期

``` js
// app.js
App({
  onLaunch(options) {
    // Do something initial when launch.
  },
  onShow(options) {
    // Do something when show.
  },
  onHide() {
    // Do something when hide.
  },
  onError(msg) {
    console.log(msg)
  },
  globalData: 'I am global data'
})
```

``` js
//index.js
Page({
  data: {
    text: "This is page data."
  },
  onLoad: function(options) {
    // 页面创建时执行
  },
  onShow: function() {
    // 页面出现在前台时执行
  },
  onReady: function() {
    // 页面首次渲染完毕时执行
  },
  onHide: function() {
    // 页面从前台变为后台时执行
  },
  onUnload: function() {
    // 页面销毁时执行
  },
  onPullDownRefresh: function() {
    // 触发下拉刷新时执行
  },
  onReachBottom: function() {
    // 页面触底时执行
  },
  onShareAppMessage: function () {
    // 页面被用户分享时执行
  },
  onPageScroll: function() {
    // 页面滚动时执行
  },
  onResize: function() {
    // 页面尺寸变化时执行
  },
  onTabItemTap(item) {
    // tab 点击时执行
    console.log(item.index)
    console.log(item.pagePath)
    console.log(item.text)
  },
  // 事件响应函数
  viewTap: function() {
    this.setData({
      text: 'Set some data for updating view.'
    }, function() {
      // this is setData callback
    })
  },
  // 自由数据
  customData: {
    hi: 'MINA'
  }
})
```