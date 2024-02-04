## url构成
- protocol 协议，常用的协议是http
- hostname 主机地址，可以是域名，也可以是IP地址
- port 端口 http协议默认端口是：80端口，如果不写默认就是:80端口
- path 路径 网络资源在服务器中的指定路径
- parameter 参数 如果要向服务器传入参数，在这部分输入
- query 查询字符串 如果需要从服务器那里查询内容，在这里编辑
- fragment 片段 网页中可能会分为不同的片段，如果想访问网页后直接到达指定位置，可以在这部分设置

## hash和history

### hash

http://xxx.abc.com/#/xx。 有带#号，后面就是hash值的变化。改变后面的hash值，它不会向服务器发出请求，因此也就不会刷新页面。并且每次hash值发生改变的时候，会触发`hashchange`事件。因此我们可以通过监听该事件，来知道hash值发生了哪些变化。

### history

HTML5的History API为浏览器的全局history对象增加了该扩展方法。它是一个浏览器的一个接口，在window对象中提供了onpopstate事件来监听历史栈的改变，只要历史栈有信息发生改变的话，就会触发该事件。提供了如下事件：

- history,go(-1); //
- history.back(); // 回退一条记录
- history.forward(); // 前进一条记录
- history.pushState(data[,title][,url]); // 向历史记录中追加一条记录
- history.replaceState(data[,title][,url]); // 替换当前页在历史记录中的信息。

## vue3带来的新特性/亮点

- Performance
  Proxy
- tree sharking
- composition api
  defineComponent, onMounted, onUnmounted, ref, setup 类似react hocks，代替mixin
- Fragment, Teleport, Suspense
  类似ReactFragment，Portal，Suspense
- Typescript

- Custom Render API
  这个api定义了虚拟DOM的渲染规则，这意味着使用自定义API可以达到跨平台的目的。

## 尾递归优化递归

``` js
function factorial(n)
{
    if (n === 1) {
      return 1;
    }

    return n * factorial(n - 1);
}
```

``` js
function factorialTailRecursion(n, acc)
{
    if (n === 1) {
      return acc;
    }

    return factorialTailRecursion(n - 1, acc * n);
}
```

## 揭秘React形成合成事件的过程

React的事件处理使用合成事件(SyntheticEvent)，不是原生事件。

1. 合成事件的异步访问

合适事件为了节约性能，使用对象池。当一个合成事件对象被使用完毕，即调用该对象的同步代码执行完毕，该对象会被再次利用。
其属性会被重置为null。所以异步访问合适事件的属性，是无效的。

解决方法有两种：

1.1 用变量记录事件属性值

用变量记录合成事件的属性值，在异步程序中访问，就没有任何问题了。

``` js
function onClick(event) {
  console.log(event); // => nullified object.
  console.log(event.type); // => "click"
  const eventType = event.type; // => "click"

  setTimeout(function() {
    console.log(event.type); // => null
    console.log(eventType); // => "click"
  }, 0);
}
```

1.2 用e.persist()方法

e.persist()方法，会将当前的合成事件对象，从对象池中移除，就不会回收该对象了。对象可以被异步程序访问到。

2. 合成事件阻止冒泡

2.1 e.stopPropagation

只能阻止合成事件间冒泡，即下层的合成事件，不会冒泡到上层的合成事件。事件本身还都是在document上执行。最多只能阻止document事件不能再冒泡到window上。

2.2 e.nativeEvent.stopImmediatePropagation

能阻止合成事件不会冒泡到document上。

可以实现点击空白处关闭菜单的功能：

- 在菜单打开的一刻，在document上动态注册事件，用来关闭菜单。
- 点击菜单内部，由于不冒泡，会正常执行菜单点击。
- 点击菜单外部，执行document上事件，关闭菜单。
- 在菜单关闭的一刻，在document上移除该事件，这样就不会重复执行该事件，浪费性能。

也可以在window上注册事件，这样可以避开document。

## px rem em vh vw的区别

px：指像素，相对长度单位，网页设计常用的基本单位。像素px是相对于显示器分辨率而言的。


em：相对长度单位。相对当前对象内文本的字体尺寸（参考物是父元素的font-size）

如果当前父元素的字体尺寸未设置，则相对于浏览器的默认字体尺寸。

特点：1、em的值并不是固定的；2、em会继承父级元素的字体大小。



rem：css3新增的一个相对单位，rem是相对于HTML根元素的字体大小（font-size）来计算的长度单位。

没有设置HTML的字体大小，就会以浏览器默认字体大小（16px）。

em与rem的区别：rem是相对于根元素（html）的字体大小，而em是相对于其父元素的字体大小。

两者使用规则：

1、如果这个属性根据它的font-size进行测量，则使用em

2、其他的一切事物属性均使用rem .



vw、vh、vmax、vmin这四个单位都是基于视口，

vw是相对视口（viewport）的宽度而定的，长度等于视口宽度的1/100

假如浏览器的宽度为200px，那么1vw就等于2px（200px/100）

vh是相对视口（viewport）的高度而定的。。。。

vmin和vmax是相对视口的高度和宽度两者之间的最小值或最大值。

## LRU

内存管理的一种页面置换算法，对于在内存中但又不用的数据块（内存块）叫做LRU，操作系统会根据哪些数据属于LRU而将其移出内存而腾出空间来加载另外的数据。

## keep-alive实现原理

keep-alive是Vue.js的一个内置组件。它能够不活动的组件实例保存在内存中，而不是直接将其销毁，它是一个抽象组件，不会被渲染到真实DOM中，也不会出现在父组件链中。

它提供了include与exclude两个属性，允许组件有条件地进行缓存。

## 深入keep-alive组件实现

说完了keep-alive组件的使用，我们从源码角度看一下keep-alive组件究竟是如何实现组件的缓存的呢？

created与destroyed钩子

created钩子会创建一个cache对象，用来作为缓存容器，保存vnode节点。

``` vue
created () {
    /* 缓存对象 */
    this.cache = Object.create(null)
    // 记录缓存组件vnode的个数
    this.keys = []
},
```

destroyed钩子则在组件被销毁的时候清除cache缓存中的所有组件实例。

``` vue
/* destroyed钩子中销毁所有cache中的组件实例 */
destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
},
```

### render

``` vue
render () {
  const vnode: VNode = getFirstComponentChild(this.$slots.default)
  const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
  if (componentOptions) {
    // check pattern
    const name: ?string = getComponentName(componentOptions)
    if (name && (
      (this.include && !matches(this.include, name)) ||
      (this.exclude && matches(this.exclude, name))
    )) {
      return vnode
    }

    const { cache, keys } = this
    const key: ?string = vnode.key == null
      // same constructor may get registered as different local components
      // so cid alone is not enough (#3269)
      ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
      : vnode.key
    if (cache[key]) {
      vnode.componentInstance = cache[key].componentInstance
      // make current key freshest
      remove(keys, key)
      keys.push(key)
    } else {
      cache[key] = vnode
      keys.push(key)
      // prune oldest entry
      if (this.max && keys.length > parseInt(this.max)) {
        pruneCacheEntry(cache, keys[0], keys, this._vnode)
      }
    }

    vnode.data.keepAlive = true
  }
  return vnode
}
```

### watch

用watch来监听include与exclude这两个属性的改变，在改变的时候修改cache缓存中的缓存数据。

``` vue
watch: {
    /* 监视include以及exclude，在被修改的时候对cache进行修正 */
    include (val: string | RegExp) {
        pruneCache(this.cache, this._vnode, name => matches(val, name))
    },
    exclude (val: string | RegExp) {
        pruneCache(this.cache, this._vnode, name => !matches(val, name))
    }
},
```

## JSBridge

// WebViewJavascriptBridge是提前注入的一个全局变量用于javascript调用native提供的函数

This lib will inject a WebViewJavascriptBridge Object to window object. You can listen to WebViewJavascriptBridgeReady event to ensure window.WebViewJavascriptBridge is exist, as the blow code shows:

``` js
    if (window.WebViewJavascriptBridge) {
        //do your work here
    } else {
        document.addEventListener(
            'WebViewJavascriptBridgeReady'
            , function() {
                //do your work here
            },
            false
        );
    }
```
Or put all JsBridge function call into window.WVJBCallbacks array if window.WebViewJavascriptBridge is undefined, this taks queue will be flushed when WebViewJavascriptBridgeReady event triggered.

Copy and paste setupWebViewJavascriptBridge into your JS:

``` js
function setupWebViewJavascriptBridge(callback) {
	if (window.WebViewJavascriptBridge) {
        return callback(WebViewJavascriptBridge);
    }
	if (window.WVJBCallbacks) {
        return window.WVJBCallbacks.push(callback);
    }
	window.WVJBCallbacks = [callback];
}
```
Call setupWebViewJavascriptBridge and then use the bridge to register handlers or call Java handlers:

``` js
setupWebViewJavascriptBridge(function(bridge) {
	bridge.registerHandler('JS Echo', function(data, responseCallback) {
		console.log("JS Echo called with:", data);
		responseCallback(data);
    });
	bridge.callHandler('ObjC Echo', {'key':'value'}, function(responseData) {
		console.log("JS received response:", responseData);
	});
});
```

It same with https://github.com/marcuswestin/WebViewJavascriptBridge, that would be easier for you to define same behavior in different platform between Android and iOS. Meanwhile, writing concise code.

### 注册监听事件

这段代码是固定的，必须要放到js中

``` js
/*这段代码是固定的，必须要放到js中*/
function setupWebViewJavascriptBridge(callback) {
  // Android使用
  if (window.WebViewJavascriptBridge) {
    callback(WebViewJavascriptBridge)
  } else {
    document.addEventListener(
      'WebViewJavascriptBridgeReady',
      function() {
        callback(WebViewJavascriptBridge)
      },
      false
    );
  }
  //iOS使用
  if (window.WebViewJavascriptBridge) {
    return callback(WebViewJavascriptBridge);
  } if (window.WVJBCallbacks) {
    return window.WVJBCallbacks.push(callback);
  }

  window.WVJBCallbacks = [callback];
  var WVJBIframe = document.createElement('iframe');
  WVJBIframe.style.display = 'none';
  WVJBIframe.src = 'wvjbscheme://__BRIDGE_LOADED__';
  document.documentElement.appendChild(WVJBIframe);
  setTimeout(function() {
    document.documentElement.removeChild(WVJBIframe)
  }, 0);
}
```

### 原生调用js
在 setupWebViewJavascriptBridge 中注册原生调用的js

``` js
//在改function 中添加原生调起js方法
setupWebViewJavascriptBridge(function(bridge) {
  //注册原生调起方法
  //参数1： buttonjs 注册flag 供原生使用，要和原生统一
  //参数2： data  是原生传给js 的数据
  //参数3： responseCallback 是js 的回调，可以通过该方法给原生传数据
  bridge.registerHandler("buttonjs", function(data, responseCallback) {
    document.getElementById("show").innerHTML = "buuton js" + data;
    responseCallback("button js callback");
  });
});
```

### js 调用原生方法
``` js
setupWebViewJavascriptBridge(function(bridge) {
  document.getElementById('enter3').onclick = function (e) {
  var data = "good hello"
  //参数1： pay 注册flag 供原生使用，要和原生统一
  //参数2： 是调起原生时向原生传递的参数
  //参数3： 原生调用回调返回的数据
  bridge.callHandler('getBlogNameFromObjC', data, function(resp) {
    document.getElementById("show").innerHTML = "payInterface" + resp;
  });
});
```


## script阻塞DOM解析

浏览器解析html文件时，从上向下解析构建DOM树。当解析到script标签时，会暂停DOM构建。先把脚本加载并执行完毕，才会继续向下解析。js脚本的存在会阻塞DOM解析，进而影响页面渲染速度。
我们可以做以下处理：

1. 将script标签放在html文件底部，避免解析DOM时被其阻塞

2. 延迟脚本

在script标签上设置defer属性

``` html
<script type="text/javascript" defer src="1.js"></script>
```


告知浏览器立即下载脚本，但延迟执行。当浏览器解析完html文档时，再执行脚本。

3. 异步脚本

``` html
<script type="text/javascript" async src="1.js"></script>
<script type="text/javascript" async src="2.js"></script>
```

和defer功能类似，区别在于不会严格按照script标签顺序执行脚本，也就是说脚本2可能先于脚本1执行。脚本都会在onload事件前执行，但可能会在 DOMContentLoaded 事件触发前后执行。

注意：defer和async都只适用于外部脚本

## babel原理

### 核心成员

- babel-core：babel转译器本身，提供了babel的转译API，如babel.transform等，用于对代码进行转译。像webpack的babel-loader 就是调用这些API来完成转译过程的。
- babylon：js的词法解析器
- babel-traverse：用于对AST（抽象语法树，想了解的请自行查询编译原理）的遍历，主要给plugin用
- babel-generator：根据AST生成代码

（1）babel的转译过程分为三个阶段：parsing、transforming、generating，以ES6代码转译为ES5代码为例，babel转译的具体过程如下：

- ES6代码输入

- babylon进行解析得到AST

- plugin用babel-traverse对AST树进行遍历转译,得到新的AST树

- 用babel-generator通过AST树生成ES5代码

ES6代码输入 ==》 babylon进行解析 ==》 得到AST
==》 plugin用babel-traverse对AST树进行遍历转译 ==》 得到新的AST树
==》 用babel-generator通过AST树生成ES5代码

注：

babel只是转译新标准引入的语法，比如ES6的箭头函数转译成ES5的函数；而新标准引入的新的原生对象，部分原生对象新增的原型方法，新增的API等（如Proxy、Set等），这些babel是不会转译的。需要用户自行引入polyfill来解决

## git rebase 和 git merge 有啥区别？

rebase会把你当前分支的 commit 放到公共分支的最后面,所以叫变基。

merge 会把公共分支和你当前的commit 合并在一起，形成一个新的 commit 提交

## IntersectionObserver

IntersectionObserver接口(从属于Intersection Observer API)为开发者提供了一种可以异步监听目标元素与其祖先或视窗(viewport)交叉状态的手段。祖先元素与视窗(viewport)被称为根(root)。

### API

``` js
var io = new IntersectionObserver(callback, options)

io.observe(document.querySelector('img'))  // 开始观察，接受一个DOM节点对象
io.unobserve(element)  // 停止观察 接受一个element元素
io.disconnect()  // 关闭观察器
```

#### options

- root

用于观察的根元素，默认是浏览器的视口，也可以指定具体元素，指定元素的时候用于观察的元素必须是指定元素的子元素

- threshold

用来指定交叉比例，决定什么时候触发回调函数，是一个数组，默认是[0]。

``` js
const options = {
    root: null,
    threshold: [0, 0.5, 1] // 我们指定了交叉比例为0，0.5，1，当观察元素img0%、50%、100%时候就会触发回调函数
}
var io = new IntersectionObserver(callback, options)
io.observe(document.querySelector('img'))
```

- rootMargin

用来扩大或者缩小视窗的的大小，使用css的定义方法，10px 10px 30px 20px表示top、right、bottom 和 left的值


#### callback

callback函数会触发两次，元素进入视窗（开始可见时）和元素离开视窗（开始不可见时）都会触发

``` ts
callback: (entries: IntersectionObserverEntry[]) => void;
```

### IntersectionObserverEntry

IntersectionObserverEntry提供观察元素的信息，有七个属性。

- boundingClientRect 目标元素的矩形信息
- intersectionRatio 相交区域和目标元素的比例值 intersectionRect/boundingClientRect 不可见时小于等于0
- intersectionRect 目标元素和视窗（根）相交的矩形信息 可以称为相交区域
- isIntersecting 目标元素当前是否可见 Boolean值 可见为true
- rootBounds 根元素的矩形信息，没有指定根元素就是当前视窗的矩形信息
- target 观察的目标元素
- time 返回一个记录从IntersectionObserver的时间到交叉被触发的时间的时间戳


### 懒加载

``` js

let io;

function callback(entries) {
  entries.forEach((item) => { // 遍历entries数组
    if(item.isIntersecting) { // 当前元素可见
      item.target.src = item.target.dataset.src  // 替换src
      io.unobserve(item.target)  // 停止观察当前元素 避免不可见时候再次调用callback函数
    }
  })
}

io = new IntersectionObserver(callback)

let ings = document.querySelectorAll('[data-src]') // 将图片的真实url设置为data-src src属性为占位图 元素可见时候替换src

imgs.forEach((item) => {  // io.observe接受一个DOM元素，添加多个监听 使用forEach
  io.observe(item)
})
```

## 反向代理和正向代理

### 正向代理

正向代理类似一个跳板机，代理访问外部资源

比如我们国内访问谷歌，直接访问访问不到，我们可以通过一个正向代理服务器，请求发到代理服，代理服务器能够访问谷歌，这样由代理去谷歌取到返回数据，再返回给我们，这样我们就能访问谷歌了

用途：
- 访问原来无法访问的资源，如google

- 可以做缓存，加速访问资源

- 对客户端访问授权，上网进行认证

- 代理可以记录用户访问记录（上网行为管理），对外隐藏用户信息

### 反向代理

反向代理（Reverse Proxy）实际运行方式是指以代理服务器来接受internet上的连接请求，然后将请求转发给内部网络上的服务器，并将从服务器上得到的结果返回给internet上请求连接的客户端，此时代理服务器对外就表现为一个服务器

用途:

- 保证内网的安全，阻止web攻击，大型网站，通常将反向代理作为公网访问地址，Web服务器是内网

- 负载均衡，通过反向代理服务器来优化网站的负载

### 总结

正向代理即是客户端代理, 代理客户端, 服务端不知道实际发起请求的客户端.

反向代理即是服务端代理, 代理服务端, 客户端不知道实际提供服务的服务端

## Chrome打开一个页面需要启动多少进程

最新的Chrome浏览器包括；1个浏览器主进程（Browser）、1个GPU进程、一个网络（NetWork）进程和多个插件进程。

- 浏览器进程：主要负责界面显示、用户交互、子进程管理，同时提供存储功能；

- 渲染进程：核心人物是将HTML、CSS和JavaScript引擎V8都是及逆行在该进程中，漠然情况下，Chrome会为每个Ta标签创建一个渲染进程。出于安全考虑；显然进程都是运行在沙箱模式下。

- GPU进程：其实，Chrome刚开始发布的时候是没有GPU进程的。而GPU的使用初衷是为了实现3DCSS的效果，只是随后网页、Chrome的UI界面都选择采取GPU来绘制，这使得GPU成为浏览器普遍的需求。最后，Chrome在奇多进程架构上也引入了GPU进程。

- 网络进程：主要负责网页的网络资源加载，之前是作为一个模块运行在浏览器进程在里面的，直至最近才独立出来，成为一个单独的进程。

- 插件进程：主要是负责插件的运行，因插件容易崩溃，所以需要通过插件进程来隔离，以保证插件进程崩溃不会对浏览器和页面造成影响

## E2E

E2E（End To End）即端对端测试，属于黑盒测试，通过编写测试用例，自动化模拟用户操作，确保组件间通信正常，程序流数据传递如预期。

典型E2E测试框架对比

| 名称 | 断言 | 是否跨浏览器支持 | 实现 | 官网 | 是否开源 |
| ---- | ---- | ---- | ---- | ---- |
| nightwatch | assert 和 Chai Expect | 是 | selenium | http://nightwatchjs.org/ | 是 |
| cypress | Chai、Chai-jQuery 等 | 否 | Chrome | https://www.cypress.io/ | 是 |
| testcafe | 自定义的断言 | 是 | 不是基于 selenium 实现 | https://devexpress.github.io/testcafe/ | 是 |
| katalon | TDD/BDD | 是 | 未知 | https://www.katalon.com/katalon-studio/ | 否 |

## REST

REST就是用URL定位资源，用HTTP描述操作。

URI使用名词而不是动词，且推荐用复数。

BAD
- /getProducts
- /listOrders
- /retrieveClientByOrder?orderId=1

GOOD
- GET /products : will return the list of all products
- POST /products : will add a product to the collection
- GET /products/4 : will retrieve product #4
- PATCH/PUT /products/4 : will update profduct #4

## Promise、Generator、Async三者的区别

### Promise

Promise有三种状态：pending(进行中)、resolved(成功)、rejected(失败)

缺点

- 无法取消Promise，一旦新建它就会立即执行，无法中途取消。

- 如果不设置回调函数，Promise内部抛出的错误，不会反应到外部。

- 当处于Pending状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成）。

- Promise 真正执行回调的时候，定义 Promise 那部分实际上已经走完了，所以 Promise 的报错堆栈上下文不太友好。

### Generator

Generator 是ES6引入的新语法，Generator是一个可以暂停和继续执行的函数。
简单的用法，可以当做一个Iterator来用，进行一些遍历操作。复杂一些的用法，他可以在内部保存一些状态，成为一个状态机。

Generator 基本语法包含两部分：函数名前要加一个星号；函数内部用 yield 关键字返回值。


yield，表达式本身没有返回值，或者说总是返回undefined。


next，方法可以带一个参数，该参数就会被当作上一个yield表达式的返回值。

``` js
function * foo(x) {

    var y = 2 * (yield (x + 1));

    var z = yield (y / 3);

    return (x + y + z);

}

var b = foo(5);

b.next() // { value:6, done:false }

b.next(12) // { value:8, done:false }

b.next(13) // { value:42, done:true }
```

### Async(推荐使用～～)
Async 是 Generator 的一个语法糖。

async 对应的是 * 。

await 对应的是 yield 。

async/await 自动进行了 Generator 的流程控制。

``` js
async function fetchUser() {

  const user = await ajax()

  console.log(user)
}
```

- 注意：若明确是当前函数内部需要异步转同步执行，再使用async。原因：babel会识别并将async编译成promise，造成编译后代码量增加。

## webpack hash chunkhash contenthash

Webpack里面有三种hash，分别是：hash, chunkhash, contenthash

我们的浏览器会缓存我们的文件。缓存是把双刃剑，好处是浏览器读取缓存的文件，能带来更佳的用户体验（不需要额外流量，速度更快）；坏处是有时候我们修改了文件内容，但是浏览器依然读取缓存的文件（也就是旧文件），导致用户看到的文件不是最新的。

hash能够帮助我们缓存已经及时的更新缓存文件。

### hash

hash是项目级别的，多个入口文件输出的所有构建的文件是使用同一个hash。

缺点是假如我只改了其中一个文件，但是所有文件的文件名里面的hash都是一样的。这样会导致本来应该被浏览器缓存的文件，强制要去服务器读取一遍，但是这个文件又和之前的旧文件并没有区别，这样就很不好了。那能不能做到只有改变了文件，hash值才变，而没有改变的文件，文件名里面的hash值就不变呢？答案就是chunkhash。

### chunkhash

chunkhash是模块级别的，它根据不同的入口文件(Entry)进行依赖文件解析、构建对应的chunk，生成对应的hash值。我们在生产环境里把一些公共库和程序入口文件区分开，单独打包构建，接着我们采用chunkhash的方式生成hash值，那么只要我们不改动公共库的代码，就可以保证其hash值不会受影响。

缺点就是一般我们会将css单独提取到一个文件中，当我们改变依赖的css文件的js文件的时候，依赖他的其它们文件构建的文件的hash值也会发送改变，即使我们的css文件并没有任何的改变，单独提取出来的css文件的hash值也发生了改变。

### contenthash

contenthash是文件级别的。

contenthash表示由文件内容产生的hash值，内容不同产生的contenthash值也不一样。在项目中，通常做法是把项目中css都抽离出对应的css文件来加以引用。

## 对称加密和非对称加密


对称加密：

在对称加密算法中，加密和解密使用的是同一把钥匙，即：使用相同的密匙对同一密码进行加密和解密；

优点：算法简单，加密解密容易，效率高，执行快。

缺点：相对来说不算特别安全，只有一把钥匙，密文如果被拦截，且密钥也被劫持，那么，信息很容易被破译。

非对称加密：

在非对称加密算法中，公钥和私钥不是同一把密钥，用户A会将公钥公开，发送给用户B，保留住自己的私钥，用户B发送数据给A时，用A的公钥加密数据，然后发送给A，A收到加密数据后用自己的私钥解密数据。

优点：安全，即使密文被拦截、公钥被获取，但是无法获取到私钥，也就无法破译密文。作为接收方，务必要保管好自己的密钥。

缺点：加密算法及其复杂，安全性依赖算法与密钥，而且加密和解密效率很低。

## devicePixelRatio

物理像素和css像素比例

## vue修饰符

- .capture

添加事件监听器时使用事件捕获模式

- .passive

默认行为将会立即触发

修饰符尤其能够提升移动端的性能。

``` vue
<!-- 滚动事件的默认行为 (即滚动行为) 将会立即触发 -->
<!-- 而不会等待 `onScroll` 完成  -->
<!-- 这其中包含 `event.preventDefault()` 的情况 -->
<div v-on:scroll.passive="onScroll">...</div>
```

- .self

添加事件监听器时使用事件捕获模式

## v-model的实现原理

你可以用 `v-model` 指令在表单 `<input>`、`<textarea>` 及 `<select>` 元素上创建双向数据绑定。它会根据控件类型自动选取正确的方法来更新元素。尽管有些神奇，但 `v-model` 本质上不过是语法糖。它负责监听用户的输入事件以更新数据，并对一些极端场景进行一些特殊处理。

`v-model` 在内部为不同的输入元素使用不同的 `property` 并抛出不同的事件：

- `text` 和 `textarea` 元素使用 `value` property 和 `input` 事件；
- `checkbox` 和 `radio` 使用 `checked` property 和 `change` 事件；
- `select` 字段将 `value` 作为 property 并将 `change` 作为事件。

``` vue
<input v-model="msg">

// 相当于

<input v-bind:value="msg" @input="msg=$event.target.value">
```

## vm.$isServer

当前 Vue 实例是否运行于服务器。

## vm.$attrs

包含了父作用域中不作为 prop 被识别 (且获取) 的 attribute 绑定 (class 和 style 除外)。当一个组件没有声明任何 prop 时，这里会包含所有父作用域的绑定 (class 和 style 除外)，并且可以通过 v-bind="$attrs" 传入内部组件——在创建高级别的组件时非常有用。

## vm.$listeners

包含了父作用域中的 (不含 .native 修饰器的) v-on 事件监听器。它可以通过 v-on="$listeners" 传入内部组件——在创建更高层次的组件时非常有用。

## WeakSet

对象是一些对象值的集合, 并且其中的每个对象值都只能出现一次。在WeakSet的集合中是唯一的

它和 Set 对象的区别有两点:

- 与Set相比，WeakSet 只能是对象的集合，而不能是任何类型的任意值。
- WeakSet持弱引用：集合中对象的引用为弱引用。 如果没有其他的对WeakSet中对象的引用，那么这些对象会被当成垃圾回收掉。 这也意味着WeakSet中没有存储当前对象的列表。 正因为这样，WeakSet 是不可枚举的。

## WeakMap

对象是一组键/值对的集合，其中的键是弱引用的。其键必须是对象，而值可以是任意的。

它和 Map 对象的区别有两点:

- 原生的 WeakMap 持有的是每个键对象的“弱引用”，这意味着在没有其他引用存在时垃圾回收能正确进行。原生 WeakMap 的结构是特殊且有效的，其用于映射的 key 只有在其没有被回收时才是有效的。

- WeakMap 的 key 是不可枚举的 (没有方法能给出所有的 key)。如果key 是可枚举的话，其列表将会受垃圾回收机制的影响，从而得到不确定的结果。因此，如果你想要这种类型对象的 key 值的列表，你应该使用 Map。


## react-router

子组件获得 react-router 的history对象
``` jsx
//子组件中引入
import { withRouter } from "react-router-dom";

//暴露的时候  EggRid是自己的组件
export default withRouter(EggRid);
//这样就能拿到this.props.history了
```

### history 属性值

- history.length - 历史堆栈中的条目数
- history.location - 当前的 location
- history.action - 当前导航操作

### 监听

可以使用history.listen监听当前位置的更改：

``` js
const unlisten = history.listen((location, action) => {
  console.log(
    `The current URL is ${location.pathname}${location.search}${location.hash}`
  );
  console.log(`The last navigation action was ${action}`);
});

//  取消监听
unlisten();
```

location对象实现 window.location 接口的子集，包括：

- location.pathname - The path of the URL
- location.search - The URL query string
- location.hash - The URL hash fragment

Location还可以具有以下属性：

- location.state - 当前location不存在于URL中的一些额外状态 (createBrowserHistory、createMemoryHistory支持该属性)
- location.key - 表示当前loaction的唯一字符串 (createBrowserHistory、createMemoryHistory支持该属性)

### 导航

history对象可以使用以下方法以编程方式更改当前位置：

- history.push(path, [state])
- history.replace(path, [state])
- history.go(n)
- history.goBack()
- history.goForward()

使用push或replace时，可以将url路径和状态指定为单独的参数，也可以将object等单个位置中的所有内容作为第一个参数：

- 一个url路径
- 一个路径对象 { pathname, search, hash, state }

``` js
// Push a new entry onto the history stack.
history.push('/home');

// Push a new entry onto the history stack with a query string
// and some state. Location state does not appear in the URL.
history.push('/home?the=query', { some: 'state' });

// If you prefer, use a single location-like object to specify both
// the URL and state. This is equivalent to the example above.
history.push({
  pathname: '/home',
  search: '?the=query',
  state: { some: 'state' }
});

// Go back to the previous history entry. The following
// two lines are synonymous.
history.go(-1);
history.goBack();
```

## 其它

1. 使用basename

如果应用程序中的所有URL都与其他“base”URL相关，请使用 basename 选项。此选项将给定字符串添加到您使用的所有URL的前面。

``` js
const history = createHistory({
  basename: '/the/base'
});

history.listen(location => {
  console.log(location.pathname); // /home
});

history.push('/home'); // URL is now /the/base/home
```

注意：在createMemoryHistory中不支持basename属性。

2. 在CreateBrowserHistory中强制刷新整页

默认情况下，createBrowserHistory使用HTML5 pushState和replaceState来防止在导航时从服务器重新加载整个页面。如果希望在url更改时重新加载，请使用forceRefresh选项。

``` js
const history = createBrowserHistory({
  forceRefresh: true
});
```

3. 修改createHashHistory中的Hash类型

默认情况下，createHashHistory在基于hash的URL中使用'/'。可以使用hashType选项使用不同的hash格式。

``` js
const history = createHashHistory({
  hashType: 'slash' // the default
});

history.push('/home'); // window.location.hash is #/home

const history = createHashHistory({
  hashType: 'noslash' // Omit the leading slash
});

history.push('/home'); // window.location.hash is #home

const history = createHashHistory({
  hashType: 'hashbang' // Google's legacy AJAX URL format
});

history.push('/home'); // window.location.hash is #!/home
```

## 一个 tcp 连接能发几个 http 请求？

如果是 HTTP 1.0 版本协议，一般情况下，不支持长连接，因此在每次请求发送完毕之后，TCP 连接即会断开，因此一个 TCP 发送一个 HTTP 请求，但是有一种情况可以将一条 TCP 连接保持在活跃状态，那就是通过 Connection 和 Keep-Alive 首部，在请求头带上 Connection: Keep-Alive，并且可以通过 Keep-Alive 通用首部中指定的，用逗号分隔的选项调节 keep-alive 的行为，如果客户端和服务端都支持，那么其实也可以发送多条，不过此方式也有限制，可以关注《HTTP 权威指南》4.5.5 节对于 Keep-Alive 连接的限制和规则。
而如果是 HTTP 1.1 版本协议，支持了长连接，因此只要 TCP 连接不断开，便可以一直发送 HTTP 请求，持续不断，没有上限；
同样，如果是 HTTP 2.0 版本协议，支持多用复用，一个 TCP 连接是可以并发多个 HTTP 请求的，同样也是支持长连接，因此只要不断开 TCP 的连接，HTTP 请求数也是可以没有上限地持续发送

## Virtual Dom 的优势在哪里？

其次是 VDOM 和真实 DOM 的区别和优化：

- 虚拟 DOM 不会立马进行排版与重绘操作
- 虚拟 DOM 进行频繁修改，然后一次性比较并修改真实 DOM 中需要改的部分，最后在真实 DOM 中进行排版与重绘，减少过多DOM节点排版与重绘损耗
- 虚拟 DOM 有效降低大面积真实 DOM 的重绘与排版，因为最终与真实 DOM 比较差异，可以只渲染局部

## 如何选择图片格式，例如 png, webp

| 图片格式 | 压缩方式 | 透明度 | 动画 | 浏览器兼容 | 适应场景 |
| ---- | ---- | ---- | ---- | ---- | ---- |

| JPEG | 有损压缩 | 不支持 | 不支持 | 所有 | 复杂颜色及形状、尤其是照片 |
| GIF | 无损压缩 | 支持 | 支持 | 所有 | 简单颜色，动画 |
| PNG | 无损压缩 | 支持 | 不支持 | 所有 | 需要透明时 |
| APNG | 无损压缩 | 支持 | 支持 | Firefox SafariIOS Safari | 需要半透明效果的动画 |
| WebP | 有损压缩 | 支持 | 支持 | Chrome OperaAndroid ChromeAndroid Browser | 复杂颜色及形状浏览器平台可预知 |
| SVG | 无损压缩 | 支持 | 支持 | 所有（IE8以上）||

## 如何判断 0.1 + 0.2 与 0.3 相等？

- 非是 ECMAScript 独有
- IEEE754 标准中 64 位的储存格式，比如 11 位存偏移值
- 其中涉及的三次精度丢失

## 了解v8引擎吗，一段js代码如何执行的

在执行一段代码时，JS 引擎会首先创建一个执行栈

然后JS引擎会创建一个全局执行上下文，并push到执行栈中, 这个过程JS引擎会为这段代码中所有变量分配内存并赋一个初始值（undefined），在创建完成后，JS引擎会进入执行阶段，这个过程JS引擎会逐行的执行代码，即为之前分配好内存的变量逐个赋值(真实值)。

如果这段代码中存在function的声明和调用，那么JS引擎会创建一个函数执行上下文，并push到执行栈中，其创建和执行过程跟全局执行上下文一样。但有特殊情况，即当函数中存在对其它函数的调用时，JS引擎会在父函数执行的过程中，将子函数的全局执行上下文push到执行栈，这也是为什么子函数能够访问到父函数内所声明的变量。

还有一种特殊情况是，在子函数执行的过程中，父函数已经return了，这种情况下，JS引擎会将父函数的上下文从执行栈中移除，与此同时，JS引擎会为还在执行的子函数上下文创建一个闭包，这个闭包里保存了父函数内声明的变量及其赋值，子函数仍然能够在其上下文中访问并使用这边变量/常量。当子函数执行完毕，JS引擎才会将子函数的上下文及闭包一并从执行栈中移除。

最后，JS引擎是单线程的，那么它是如何处理高并发的呢？即当代码中存在异步调用时JS是如何执行的。比如setTimeout或fetch请求都是non-blocking的，当异步调用代码触发时，JS引擎会将需要异步执行的代码移出调用栈，直到等待到返回结果，JS引擎会立即将与之对应的回调函数push进任务队列中等待被调用，当调用(执行)栈中已经没有需要被执行的代码时，JS引擎会立刻将任务队列中的回调函数逐个push进调用栈并执行。这个过程我们也称之为事件循环。

## common.js 和 es6 中模块引入的区别？

CommonJS 是一种模块规范，最初被应用于 Nodejs，成为 Nodejs 的模块规范。运行在浏览器端的 JavaScript 由于也缺少类似的规范，在 ES6 出来之前，前端也实现了一套相同的模块规范 (例如: AMD)，用来对前端模块进行管理。自 ES6 起，引入了一套新的 ES6 Module 规范，在语言标准的层面上实现了模块功能，而且实现得相当简单，有望成为浏览器和服务器通用的模块解决方案。但目前浏览器对 ES6 Module 兼容还不太好，我们平时在 Webpack 中使用的 export 和 import，会经过 Babel 转换为 CommonJS 规范。在使用上的差别主要有：

1. CommonJS 模块输出的是一个值的拷贝，ES6 模块输出的是值的引用。
2. CommonJS 模块是运行时加载，ES6 模块是编译时输出接口。
3. CommonJs 是单个值导出，ES6 Module可以导出多个
4. CommonJs 是动态语法可以写在判断里，ES6 Module 静态语法只能写在顶层
5. CommonJs 的 this 是当前模块，ES6 Module的 this 是 undefined

## Tree-Shaking的工作原理

Tree-shaking （树摇）最早是由Rollup实现，是一种采用删除不需要的额外代码的方式优化代码体积的技术，webpack2借鉴了这个特性也增加了tree-shaking的功能。

tree-shaking 只能在静态modules下工作，在ES6之前我们使用CommonJS规范引入模块，具体采用require()的方式动态引入模块，这个特性可以通过判断条件解决按需记载的优化问题

是CommonJS规范无法确定在实际运行前需要或者不需要某些模块，所以CommonJS不适合tree-shaking机制。

在JavaScript模块话方案中，只有ES6的模块方案：import()引入模块的方式采用静态导入，可以采用一次导入所有的依赖包再根据条件判断的方式，获取不需要的包，然后执行删除操作。

Tree-shaking的实现原理

### 利用ES6模块特性：

1. 只能作为模块顶层的语句出现
2. import的模块名只能是字符串常量
3. 引入的模块不能再进行修改

### 代码删除

uglify：判断程序流，判断变量是否被使用和引用，进而删除代码

### 实现原理可以简单的概况：

1. ES6 Module引入进行静态分析，故而编译的时候正确判断到底加载了那些模块
2. 静态分析程序流，判断那些模块和变量未被使用或者引用，进而删除对应代码

注:

- Tree-shaking不能移除export default方式导出的模块而导入的一个整体的模块，所以应该尽量避免使用export default { A, B, C }导出的方式，而应该替换成 export { A, B, C } 的方式到处


## 设计WebSDK站在什么样的角度思考问题

- 使用者方便的角度，接口尽可能的简单
  - 多通道API接口兼容性的抹平
  - 形成场景模式的使用线，根据不同的场景将多个API调用合并成一个，尽可能的简化API的调用。

- 事件监听回调函数的链式操作和设置属性同步方法的链式操作

- 工厂方法的模式创建多通道的实例

- 单实例埋点添加，保证出现问题后方便定位问题

- 说明文档
  - 保持简单清晰，在线版和SDK包（如果有）离线版共存
  - 跟随SDK及时更新，注明更新时间及对应版本号，若新版改动较大，需要保持老版文档及入口
  - 如果使用了第三方库，需要包含详尽的使用步骤、注意事项以及问题解决方法

- 提供Demo
  - 保证Demo可用并随SDK或开发工具的更新保持同步更新
  - Demo中应包含完整的SDK功能示例

## webpack插件

1. 编写一个JavaScript命名函数。
2. 在它的原型上定义一个apply方法。
3. 指定挂载的webpack事件钩子。
4. 处理webpack内部实例的特定数据。
5. 功能完成后调用webpack提供的回调。

### webpack构建的主要钩子

Compiler暴露了和webpack整个生命周期相关的钩子

#### Compiler钩子

- entryOption: 在 entry 配置项处理过之后，执行插件。

- afterPlugins: 设置完初始插件之后，执行插件。参数：compiler

- afterResolvers: resolver 安装完成之后，执行插件。参数：compiler

- environment: environment 准备好之后，执行插件。

- afterEnvironment: environment 安装完成之后，执行插件。

- beforeRun: compiler.run() 执行之前，添加一个钩子。参数：compiler

- run: 开始读取 records 之前，钩入(hook into) compiler。参数：compiler

- watchRun: 监听模式下，一个新的编译(compilation)触发之后，执行一个插件，但是是在实际编译开始之前。参数：compiler

- watchRun: 监听模式下，一个新的编译(compilation)触发之后，执行一个插件，但是是在实际编译开始之前。参数：compiler

- normalModuleFactory: NormalModuleFactory 创建之后，执行插件。参数：normalModuleFactory

- contextModuleFactory: ContextModuleFactory 创建之后，执行插件。参数：contextModuleFactory

- beforeCompile: 编译(compilation)参数创建之后，执行插件。参数：compilationParams

- compile: 一个新的编译(compilation)创建之后，钩入(hook into) compiler。参数：compilationParams

- thisCompilation: 触发 compilation 事件之前执行（查看下面的 compilation）。参数：compilation

- compilation: 编译(compilation)创建之后，执行插件。参数：compilation

- make: 分析模块依赖。参数：compilation

- afterCompile:

- shouldEmit: 此时返回 true/false。参数：compilation

- needAdditionalPass:

- emit: 生成资源到 output 目录之前。参数：compilation

- afterEmit: 生成资源到 output 目录之后。参数：compilation

- done: 编译(compilation)完成。参数：stats

- failed: 编译(compilation)失败。参数：error

- invalid: 监听模式下，编译无效时。参数：fileName, changeTime

- watchClose: 监听模式停止

#### Compilation钩子

Compilation暴露了与模块和依赖有关的粒度更小的事件钩子。

在编译阶段，模块会被加载(loaded)、封存(sealed)、优化(optimized)、分块(chunked)、哈希(hashed)和重新创建(restored)。

从上面的示例可以看到，compilation是Compiler生命周期中的一个步骤，使用compilation相关钩子的通用写法为:

- buildModule: 在模块构建开始之前触发。参数：module

- rebuildModule: 在重新构建一个模块之前触发。参数：module

...

- seal: 编译(compilation)停止接收新模块时触发。

- unseal: 编译(compilation)开始接收新模块时触发。

...

- optimize: 优化阶段开始时触发。


## CDN缓存

http缓存是浏览器端缓存，cdn是服务器端缓存。

客户端浏览器先检查是否有本地缓存是否过期，如果过期，则向CDN边缘节点发起请求，CDN边缘节点会检测用户请求数据的缓存是否过期，如果没有过期，则直接响应用户请求，此时一个完成http请求结束；如果数据已经过期，那么CDN还需要向源站发出回源请求（back to the source request）,来拉取最新的数据。

## DNS缓存

### 浏览器DNS缓存

浏览器DNS缓存的时间跟DNS服务器返回的TTL值无关。

浏览器在获取网站域名的实际IP地址后会对其IP进行缓存，减少网络请求的损耗。每种浏览器都有一个固定的DNS缓存时间，其中Chrome的过期时间是1分钟，在这个期限内不会重新请求DNS。Chrome浏览器看本身的DNS缓存时间比较方便，在地址栏输入

``` url
chrome://net-internals/#dns
```

### 系统DNS缓存

系统缓存会参考DNS服务器响应的TTL值，但是不完全等于TTL值。

### ISP DNS缓存

ISP（电信运营商）缓存有些不靠谱，有些缓存服务器会忽略网站DNS提供的TTL，自己设置一个较长的TTL，导致顶级DNS更新时不能及时拿到新的IP地址。

## vue中methods与computed，filters，watch的区别

### methods

不是响应式的

methods属性里面的方法会在数据发生变化的时候你，只要引用了此里面分方法，方法就会自动执行。这个属性没有依赖缓存。

### computed

响应式的

computed属性，是一个计算属性，该属性里面的方法名相当于data属性里面的key，他可以作为key值使用，该属性里面的方法必须要有return返回值，这个返回值就是（value值）。computed属性是有依赖缓存的。

### filters

filters属性，是过滤器属性，在vue2.0以后取消了vue本身自带的过滤器，但是我们可以通过自定义过滤器来实现相应的功能。改属性里面的方法需要有一个参数，这个参数是我们在运用过滤器的时候的数据，通过各过滤器方法的返回值，就是我们在页面上实际渲染的东西。

### watch

watch属性，是监听属性。这个监听的是data属性里面的数据，当这个数据发生变化时，将自动执行这个函数。

## scoped style

当 `<style>` 标签带有 scoped attribute 的时候，它的 CSS 只会应用到当前组件的元素上。这类似于 Shadow DOM 中的样式封装。

``` css
/deep/ .abc {

}
```

## CSS Modules

网页样式的一种描述方法，可以保证某个组件的样式，不会影响到其他组件。

CSS Modules 提供各种插件，支持不同的构建工具。本文使用的是 Webpack 的css-loader插件，它在css-loader后面加了一个查询参数modules，表示打开 CSS Modules 功能。

``` js
module: {
  rules: [
    // ...
    {
      test: /\.css$/,
      loader: "css-loader?modules"
    },
  ]
}
```

### 局部作用域

CSS的规则都是全局的，任何一个组件的样式规则，都对整个页面有效。

产生局部作用域的唯一方法，就是使用一个独一无二的class的名字，不会与其他选择器重名。这就是 CSS Modules 的做法。

``` jsx
import React from 'react';
import style from './App.css';

export default () => {
  return (
    <h1 className={style.title}>
      Hello World
    </h1>
  );
};
```

``` css
/* App.css */

.title {
  color: red;
}
```

最终会编译成

``` html
<h1 class="_3zyde4l1yATCOkgn-DBWEL">
  Hello World
</h1>

<style>
  ._3zyde4l1yATCOkgn-DBWEL {
    color: red;
  }
</style>
```

### 全局作用域

CSS Modules 允许使用`:global(.className)`的语法，声明一个全局规则。凡是这样声明的class，都不会被编译成哈希字符串。

CSS Modules 还提供一种显式的局部作用域语法`:local(.className)`，等同于`.className`

### 定制哈希类名

css-loader默认的哈希算法是`[hash:base64]`，这会将.title编译成`._3zyde4l1yATCOkgn-DBWEL`这样的字符串。

webpack.config.js里面可以定制哈希字符串的格式。

``` js
module: {
  loaders: [
    // ...
    {
      test: /\.css$/,
      loader: "style-loader!css-loader?modules&localIdentName=[path][name]---[local]---[hash:base64:5]"
    },
  ]
}
```

### Class 的的组合

``` css
.className {
  background-color: blue;
}

.title {
  composes: className;
  color: red;
}
```

编译成

``` css
._2DHwuiHWMnKTOYG45T0x34 {
  color: red;
}

._10B-buq6_BEOTOl9urIjf8 {
  background-color: blue;
}
```

``` html
<h1 class="_2DHwuiHWMnKTOYG45T0x34 _10B-buq6_BEOTOl9urIjf8">
  Hello World
</h1>
```

### 组合输入其他模块

``` css
/* another.css */
.className {
  background-color: blue;
}
```

``` css
.title {
  composes: className from './another.css';
  color: red;
}
```

### 输入变量

CSS Modules 支持使用变量，不过需要安装 PostCSS 和 postcss-modules-values。

webpack.config.js

``` js
var values = require('postcss-modules-values');

module.exports = {
  entry: __dirname + '/index.js',
  output: {
    publicPath: '/',
    filename: './bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          'babel-loader'
        ],
        query: {
          presets: ['es2015', 'stage-0', 'react']
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            }
          },
          'postcss-loader'
        ]
      },
    ]
  },
  postcss: [
    values
  ]
};
```

``` css
/* color.css */

@value blue: #0c77f8;
@value red: #ff0000;
@value green: #aaf200;
```

``` css
@value colors: "./colors.css";
@value blue, red, green from colors;

.title {
  color: red;
  background-color: blue;
}
```

## Vue两个简易代替vuex的方法

### eventBus

声明一个全局Vue实例变量 eventBus , 把所有的通信数据，事件监听都存储到这个变量上

### Vue.observable

让一个对象可响应。Vue 内部会用它来处理 data 函数返回的对象。

返回的对象可以直接用于渲染函数和计算属性内，并且会在发生变更时触发相应的更新。也可以作为最小化的跨组件状态存储器，用于简单的场景：


## PerformanceObserver

接口用于观察性能评估事件，并在浏览器的性能时间表中记录新的性能指标时通知它们。

``` js
const performanceMetrics = {};
function perfObserver(list, observer) {
   // 处理 “measure” 事件
  var entries = list.getEntries();
  for (const entry of entries) {
        // `entry` is a PerformanceEntry instance.
        // `name` will be either 'first-paint' or 'first-contentful-paint'.
        const metricName = entry.name;
        const time = Math.round(entry.startTime + entry.duration);
        // 获得FP，首次渲染事件
        if (metricName === 'first-paint') {
            performanceMetrics.fp = time;
        }
        // 获得FCP，首次文档渲染事件
        if (metricName === 'first-contentful-paint') {
            performanceMetrics.fcp = time;
        }
  }
}
var observer2 = new PerformanceObserver(perfObserver);
observer2.observe({entryTypes: ["paint"]});
```


## 网页移动端调试工具

### vConsole

引入vconsole到项目中：

``` html
<script src="path/to/vconsole.min.js"></script>
<script>
// init vConsole
var vConsole = new VConsole();
console.log('Hello world');
</script>
```

或者通过import 初试化：
``` js
import VConsole from 'vconsole/dist/vconsole.min.js' //import vconsole
let vConsole = new VConsole() // 初始化
```

项目运行，点击页面右下角vconsole图标，即可看到debug内容
如果想要查看接口调用情况，和浏览器一样直接点击network按钮即可

### AlloyLever

AlloyLever是腾讯AlloyTeam团队开源的一款Web 开发调试工具。和vConsole类似

通过npm安装：
``` shell
npm install alloylever
```

使用：
在你的页面任何地方引用下面脚本就可以，但是该js必须引用在其他脚本之前。
``` html
<script src="alloylever.js"></script>
```
务必记住，该js必须引用在其他脚本之前！

### Eruda

使用手机端网页的调试工具Eruda在你的代码里面，加入下面两行代码，就可以轻轻松松实现手机调试了
``` html
<script src="//cdn.jsdelivr.net/npm/eruda"></script>
<script>
eruda.init();
console.log('控制台打印信息');
</script>
```

ps：想要在手机上查看，可以使手机跟你的电脑在同一个局域网内，然后访问电脑的ip，然后就能查看你做的h5页面了

### spy-debugger

spy-debugger 是一个一站式页面调试、抓包工具。远程调试任何手机浏览器页面，任何手机移动端webview（如：微信，HybridApp等）。支持HTTP/HTTPS，无需USB连接设备。

特性

1. 页面调试＋抓包
2. 操作简单，无需USB连接设备
3. 支持HTTPS。
4. spy-debugger内部集成了weinre、node-mitmproxy、AnyProxy。
5. 自动忽略原生App发起的https请求，只拦截webview发起的https请求。对使用了SSL pinning技术的原生App不造成任何影响。
6. 可以配合其它代理工具一起使用(默认使用AnyProxy) (设置外部代理)

### DevTools

android&Html5混合开发WebView调试必备神器DevTools，chrome浏览器调试手机端WebView

DevTools能在浏览器上调试手机中的webview代码，给手机端调试带来了极大的便利!

操作步骤:

1. 打开手机开发者选项，开启USB调试
2. 打开待调试的webview
3. 手机通过USB数据线跟电脑连接
4. 打开chrome浏览器，输入:chrome://inspect/#devices
5. 点击inspect，进入调试页面进行调试，之后就可以直接在电脑上操作手机啦

DevTools需要外网环境才能访问，在内网环境测试的要保证电脑与外网联通；


## dev-server是怎么跑起来

webpack-dev-server 可以作为命令行工具使用，核心模块依赖是 webpack 和 webpack-dev-middleware。webpack-dev-server 负责启动一个 express 服务器监听客户端请求；实例化 webpack compiler；启动负责推送 webpack 编译信息的 websocket 服务器；负责向 bundle.js 注入和服务端通信用的 websocket 客户端代码和处理逻辑。webpack-dev-middleware 把 webpack compiler 的 outputFileSystem 改为 in-memory fileSystem；启动 webpack watch 编译；处理浏览器发出的静态资源的请求，把 webpack 输出到内存的文件响应给浏览器。

每次 webpack 编译完成后向客户端广播 ok 消息，客户端收到信息后根据是否开启 hot 模式使用 liveReload 页面级刷新模式或者 hotReload 模块热替换。hotReload 存在失败的情况，失败的情况下会降级使用页面级刷新。

开启 hot 模式，即启用 HMR 插件。hot 模式会向服务器请求更新过后的模块，然后对模块的父模块进行回溯，对依赖路径进行判断，如果每条依赖路径都配置了模块更新后所需的业务处理回调函数则是 accepted 状态，否则就降级刷新页面。判断 accepted 状态后对旧的缓存模块和父子依赖模块进行替换和删除，然后执行 accept 方法的回调函数，执行新模块代码，引入新模块，执行业务处理代码。

https://blog.csdn.net/LuckyWinty/article/details/109507412

## 使用过webpack里面哪些plugin和loader

## webpack整个生命周期，loader和plugin有什么区别

Loader，直译为"加载器"。主要是用来解析和检测对应资源，负责源文件从输入到输出的转换，它专注于实现资源模块加载

Plugin，直译为"插件"。主要是通过webpack内部的钩子机制，在webpack构建的不同阶段执行一些额外的工作，它的插件是一个函数或者是一个包含apply方法的对象，接受一个compile对象，通过webpack的钩子来处理资源

### Loader开发思路

- 通过module.exports导出一个函数

- 该函数默认参数一个参数source(即要处理的资源文件)

- 在函数体中处理资源(loader里配置响应的loader后)

- 通过return返回最终打包后的结果(这里返回的结果需为字符串形式)

### Plugin开发思路

- 通过钩子机制实现

- 插件必须是一个函数或包含apply方法的对象

- 在方法体内通过webpack提供的API获取资源做响应处理

- 将处理完的资源通过webpack提供的方法返回该资源

## webpack打包的整个过程

- 初始化参数：根据用户在命令窗口输入的参数以及 webpack.config.js 文件的配置，得到最后的配置。
- 开始编译：根据上一步得到的最终配置初始化得到一个 compiler 对象，注册所有的插件 plugins，插件开始监听 webpack 构建过程的生命周期的环节（事件），不同的环节会有相应的处理，然后开始执行编译。
- 确定入口：根据 webpack.config.js 文件中的 entry 入口，开始解析文件构建 AST 语法树，找出依赖，递归下去。
- 编译模块：递归过程中，根据文件类型和 loader 配置，调用相应的 loader 对不同的文件做不同的转换处理，再找出该模块依赖的模块，然后递归本步骤，直到项目中依赖的所有模块都经过了本步骤的编译处理。
- 编译过程中，有一系列的插件在不同的环节做相应的事情，比如 UglifyPlugin 会在 loader 转换递归完对结果使用 UglifyJs 压缩覆盖之前的结果；再比如 clean-webpack-plugin ，会在结果输出之前清除 dist 目录等等。
- 完成编译并输出：递归结束后，得到每个文件结果，包含转换后的模块以及他们之间的依赖关系，根据 entry 以及 output 等配置生成代码块 chunk。
- 打包完成：根据 output 输出所有的 chunk 到相应的文件目录。

## 一般怎么组织CSS（Webpack）
## 如何配置把js、css、html单独打包成一个文件
## webpack和gulp的优缺点

| | gulp | webpack |
| ---- | ---- | ---- |
| 定位 | 基于任务流的自动化打包工具 | 模块化打包工具 |
| 优点 | 易于学习和理解, 适合多页面应用开发 | 可以模块化的打包任何资源,适配任何模块系统,适合SPA单页应用的开发 |
| 缺点 | 不太适合单页或者自定义模块的开发 | 学习成本低,配置复杂,通过babel编译后的js代码打包后体积过 |

## 使用webpack构建时有无做一些自定义操作
## webpack的热更新是如何做到的？说明其原理？

## loader原理，css-loader与style-loader

1. css-loader 的作用是处理css中的 @import 和 url 这样的外部资源

2. style-loader 的作用是把样式插入到 DOM中，方法是在head中插入一个style标签，并把样式写入到这个标签的 innerHTML里

loader的原理

loader能把源文件翻译成新的结果，一个文件可以链式经过多个loader编译。以处理scss文件为例:

- sass-loader把scss转成css

- css-loader找出css中的依赖，压缩资源

- style-loader把css转换成脚本加载的JavaScript代码

## Redux应用场景

### 1. Redux应用场景

在react中，数据在组件中单向流动的，数据只能从父组件向子组件流通（通过props），而两个非父子关系的组件之间通信就比较麻烦，redux的出现就是为了解决这个问题，它将组件之间需要共享的数据存储在一个store里面，其他需要这些数据的组件通过订阅的方式来刷新自己的视图。

### 2. Redux设计思想
它将整个应用状态存储到store里面，组件可以派发（dispatch）修改数据（state）的行为（action）给store，store内部修改之后，其他组件可以通过订阅（subscribe）中的状态state来刷新（render）自己的视图。


### 3. Redux应用的三大原则

- 单一数据源
我们可以把Redux的状态管理理解成一个全局对象，那么这个全局对象是唯一的，所有的状态都在全局对象store下进行统一”配置”，这样做也是为了做统一管理，便于调试与维护。

- State是只读的
与React的setState相似，直接改变组件的state是不会触发render进行渲染组件的。同样，在Redux中唯一改变state的方法就是触发action，action是一个用于描述发生了什么的“关键词”，而具体使action在state上更新生效的是reducer，用来描述事件发生的详细过程，reducer充当了发起一个action连接到state的桥梁。这样做的好处是当开发者试图去修改状态时，Redux会记录这个动作是什么类型的、具体完成了什么功能等（更新、传播过程），在调试阶段可以为开发者提供完整的数据流路径。

- Reducer必须是一个纯函数
Reducer用来描述action如何改变state，接收旧的state和action，返回新的state。Reducer内部的执行操作必须是无副作用的，不能对state进行直接修改，当状态发生变化时，需要返回一个全新的对象代表新的state。这样做的好处是，状态的更新是可预测的，另外，这与Redux的比较分发机制相关，阅读Redux判断状态更新的源码部分(combineReducers)，发现Redux是对新旧state直接用==来进行比较，也就是浅比较，如果我们直接在state对象上进行修改，那么state所分配的内存地址其实是没有变化的，“==”是比较对象间的内存地址，因此Redux将不会响应我们的更新。之所以这样处理是避免对象深层次比较所带来的性能损耗（需要递归遍历比较）。

### 4. 源码实现

#### 4.1 createStore

``` js
export default function createStore(reducer, initialState) {
    let state = initialState //状态
    let listeners = []
    //获取当前状态
    function getState() {
      return state
    }
    //派发修改指令给reducer
    function dispatch(action) {
      //reducer修改之后返回新的state
      state = reducer(state,action)
      //执行所有的监听函数
      listeners.forEach(listener => listener())
    }

    //订阅 状态state变化之后需要执行的监听函数
    function subscribe(listener) {
      listeners.push(listener) //监听事件
      return function () {
        let index = listeners.indexOf(listener)
        listeners.splice(index,1)
      }
    }
    //在仓库创建完成之后会先派发一次动作，目的是给初始化状态赋值
    dispatch({type:'@@REDUX_INIT'})
    return {
      getState,
      dispatch,
      subscribe
    }
  }
```

action_type.js

``` js
export const ADD = 'ADD'
export const MINUS = 'MINUS'
```

reducer.js

``` js
import * as TYPES from './actions_type'
let initialState = {number: 0}
export default function reducer (state = initialState, action) {
    switch (action.type) {
        case TYPES.ADD:
            return {number: state.number + 1}
         case TYPES.MINUS:
            return {number: state.number - 1}
         default:
             return state
    }
}
```

store.js

``` js
import {createStore} from 'redux'
import reducer from './reducer'
const store = createStore(reducer)
export default store
```

组件Counter.js

``` jsx
import React, {useState,useEffect} from 'react'
import store from '../store'
import * as TYPES from '../store/actions_type'
//类组件写法：
export default class Counter extends React.Component {
    state = {number: store.getState().number}
    componentDidMount() {
        //当状态发生变化后会让订阅函数执行，会更新当前组件状态，状态更新之后就会刷新组件
        this.unSubscribe = store.subscribe( () => {
            this.setState({number: store.getState().number})
        })
    }
    //组件销毁的时候取消监听函数
    componentWillUnmount() {
        this.unSubscribe()
    }
    render() {
        return (
            <div>
                <p>{this.state.number}</p>
                <button onClick={()=> store.dispatch({type:TYPES.ADD})}>+</button>
                <button onClick={()=> store.dispatch({type:TYPES.MINUS})}>-</button>
            </div>
        )
    }
}
//函数组件写法：
export default function Counter (props) {
    let [number,setNumber] = useState(store.getState().number)
    //订阅
    useEffect(() => {
        return store.subscribe(() => { //这个函数会返回一个销毁函数，此销毁函数会自动在组件销毁的时候调用
            setNumber(store.getState().number)
        })
    },[]) // useEffect的第二个参数是依赖变量的数组，当这个依赖数组发生变化的时候才会执行函数
    // 传入空数组，只会执行一遍
    return (
        <div>
            <p>{store.getState().number}</p>
            <button onClick={()=> store.dispatch({type:TYPES.ADD})}>+</button>
            <button onClick={()=> store.dispatch({type:TYPES.MINUS})}>-</button>
        </div>
    )
 }
 /**
  * 对于组件来说仓库有两个作用
  * 1.输出：把仓库中的状态在组件中显示
  * 2.输入：在组件里可以派发动作给仓库，从而修改仓库中的状态
  * 3.组件需要订阅状态变化事件，当仓库中的状态发生改变之后需要刷新组件
  */
```

#### 4.2 bindActionCreators

简易版

``` js
export default function (actionCreators, dispatch) {
    let boundActionsCreators = {}
    //循环遍历重写action
    for(let key in actionCreators) {
        boundActionsCreators[key] = function(...args) {
            //其实dispatch方法会返回派发的action
            return dispatch(actionCreators[key](...args))
        }
    }
    return boundActionsCreators
}
```

源码版
``` js
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(this, arguments))
  }
}

/**
    参数说明：
        actionCreators: action create函数，可以是一个单函数，也可以是一个对象，这个对象的所有元素都是action create函数
        dispatch: store.dispatch方法
*/
export default function bindActionCreators(actionCreators, dispatch) {
  // 如果actionCreators是一个函数的话，就调用bindActionCreator方法对action create函数和dispatch进行绑定
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }
  // actionCreators必须是函数或者对象中的一种，且不能是null
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${actionCreators === null ? 'null' : typeof actionCreators}. ` +
      `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  // 获取所有action create函数的名字
  const keys = Object.keys(actionCreators)
  // 保存dispatch和action create函数进行绑定之后的集合
  const boundActionCreators = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const actionCreator = actionCreators[key]
    // 排除值不是函数的action create
    if (typeof actionCreator === 'function') {
      // 进行绑定
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  // 返回绑定之后的对象
  /**
      boundActionCreators的基本形式就是
      {
      actionCreator: function() {dispatch(actionCreator.apply(this, arguments))}
      }
  */
  return boundActionCreators
}
```

Counter.js
``` js
import React, {useState,useEffect} from 'react'
import store from '../store'
import actions from '../store/actions_type'
import { bindActionCreators } from 'redux'

let boundActions = bindActionCreators(actions, store.dispatch)
//类组件
export default class Counter extends React.Component {
    state = {number: store.getState().number}
    componentDidMount() {
        //当状态发生变化后会让订阅函数执行，会更新当前组件状态，状态更新之后就会刷新组件
        this.unSubscribe = store.subscribe( () => {
            this.setState({number: store.getState().number})
        })
    }
    //组件销毁的时候取消监听函数
    componentWillUnmount() {
        this.unSubscribe()
    }
    render() {
        return (
            <div>
                <p>{this.state.number}</p>
                <button onClick={boundActions.add}>+</button>
                <button onClick={boundActions.minus}>-</button>
            </div>
        )
    }
}

```

#### 4.3 combineReducer

``` js
/**
 * 合并reducer
 * 1.拿到子reducer，然后合并成一个reducer
 * @param {*} state
 * @param {*} action
 */
export default  function combineReducers(reducers) {
    //state是合并后得state = {counter1:{number:0},counter2:{number:0}}
    return function (state={}, action) {
        let nextState = {}
        // debugger
        for(let key in reducers) {
            let reducerForKey = reducers[key] //key = counter1,
            //老状态
            let previousStateForKey = state[key] //{number:0}
            let nextStateForKey = reducerForKey(previousStateForKey,action) //执行reducer，返回新得状态
            nextState[key] = nextStateForKey //{number: 1}
        }
        return nextState
    }
}
```

### react-redux Provider和connect

Provider.js

``` js
import React from 'react'
import ReactReduxContext from './context'
/**
 * Provider 有个store属性，需要向下传递这个属性
 * @param {*} props
 */
export default function (props) {
    return (
        <ReactReduxContext.Provider value={{store:props.store}}>
            {props.children}
        </ReactReduxContext.Provider>
    )
}
```

connect.js

``` js
import React, {useContext, useState, useEffect} from 'react'
import ReactReduxContext from './context'
import { bindActionCreators } from 'redux'

export default function (mapStateToProps,mapDispatchToProps) {
    return function(OldComponent){
        //返回一个组件
        return function(props) {
            //获取state
            let context = useContext(ReactReduxContext) //context.store
            let [state,setState] = useState(mapStateToProps(context.store.getState()))
            //利用useState只会在初始化的时候绑定一次
            let [boundActions] = useState(() => bindActionCreators(mapDispatchToProps,context.store.dispatch))
            //订阅事件
            useEffect(() => {
                return context.store.subscribe(() => {
                    setState(mapStateToProps(context.store.getState()))
                })
            },[])
            //派发事件 这种方式派发事件的时候每次render都会进行一次事件的绑定，耗费性能
            // let boundActions = bindActionCreators(mapDispatchToProps,context.store.dispatch)
            //返回组件
            return <OldComponent {...props} {...state} {...boundActions} />
        }
    }
}
```

#### 4.5 redux 中间件middlewares

正常我们的redux是这样的工作流程，action -> reducer ，这相当于是同步操作，由dispatch触发action之后直接去reducer执行相应的操作。但有时候我们会实现一些异步任务，像点击按钮 -> 获取服务器数据 ->渲染视图，这个时候就需要引入中间件改变redux同步执行流程，形成异步流程来实现我们的任务。有了中间件redux的工作流程就是action -> 中间件 -> reducer ，点击按钮就相当于dispatch 触发action，接着就是服务器获取数据middlewares执行，成功获取数据后触发reducer对应的操作，更新需要渲染的视图数据。

中间件的机制就是改变数据流，实现异步action，日志输出，异常报告等功能。

##### 4.5.1 日志中间件

``` js
import {createStore} from 'redux'
import reducer from './reducers/Counter'
const store = createStore(reducer)
//1.备份原生的dispatch方法
// let dispatch = store.dispatch
// //2.重写dispatch方法 做一些额外操作
// store.dispatch = function (action) {
//     console.log('老状态',store.getState())
//     //触发原生dispatch方法
//     dispatch(action)
//     console.log('新状态', store.getState())
// }

function logger ({dispatch, getState}) { //dispatch是重写后的dispatch
    return function (next) { //next代表原生的dispatch方法，调用下一个中间件或者store.dispatch 级联
        //改写后的dispatch方法
        return function (action) {
            console.log('老状态', getState())
            next(action) //store.dispatch(action)
            console.log('新状态', getState())
            // dispatch(action) //此时的dispatch是重写后的dispatch方法，这样会造成死循环
        }
    }
}

function applyMiddleware(middleware) { //middleware = logger
    return function(createStore) {
        return function (reducer) {
            let store = createStore(reducer) // 返回的是原始的未修改后的store
            let dispatch
            middleware = middleware({ //logger执行 需要传参getState 和 dispatch 此时的 middleware = function(next)
                getState: store.getState,
                dispatch: action => dispatch(action) //指向改写后的新的dispatch 不能是store.dispatch
            })
            dispatch = middleware(store.dispatch) //执行上面返回的middleware ，store.dispatch 代表next
            return {
                ...store,
                dispatch
            }
        }
    }
}
let store = applyMiddleware(logger)(createStore)(reducer)
export default store
```

##### 4.5.2 thunk中间件

``` js
function thunk ({dispatch, getState}) {
    return function (next) {
        return function (action) {
            if(typeof action === 'function') {
                action(dispatch, getState)
            }else {
                next(action)
            }
        }
    }
}

function applyMiddleware(middleware) { //middleware = logger
    return function(createStore) {
        return function (reducer) {
            let store = createStore(reducer) // 返回的是原始的未修改锅的store
            let dispatch
            middleware = middleware({ //logger执行 需要传参getState 和 dispatch 此时的 middleware = function(next)
                getState: store.getState,
                dispatch: action => dispatch(action) //指向改写后的新的dispatch 不能是store.dispatch
            })
            dispatch = middleware(store.dispatch) //执行上面返回的middleware ，store.dispatch 代表next
            return {
                ...store,
                dispatch
            }
        }
    }
}
let store = applyMiddleware(thunk)(createStore)(reducer)
export default store
```

##### 4.5.3 级联中间件

上面我们调用的中间件都是单个调用，传进applyMiddleware的参数也是单个的，但是我们要想一次调用多个中间件，那么传到applyMiddleware的参数就是个数组，这个时候就需要级联处理，让他们一次执行。

``` js
function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}


function applyMiddleware(...middlewares) { //middleware = logger
    return function(createStore) {
        return function (reducer) {
            let store = createStore(reducer) // 返回的是原始的未修改锅的store
            let dispatch = () => {
              throw new Error(
                'Dispatching while constructing your middleware is not allowed. ' +
                  'Other middleware would not be applied to this dispatch.'
              )
            }
            let middlewareAPI = {
                getState: store.getState,
                dispatch: action => dispatch(action) //指向改写后的新的dispatch 不能是store.dispatch
            }
            chain= middlewares.map(middleware => middleware(middlewareAPI))
            dispatch = compose(...chain)(store.dispatch)
            // dispatch = middleware(store.dispatch) //执行上面返回的middleware ，store.dispatch 代表next
            return {
                ...store,
                dispatch
            }
        }
    }
}
let store = applyMiddleware(promise,thunk, logger)(createStore)(reducer)
```

## React怎么做数据的检查和变化

setState之后，会把当前的component放到dirtyComponents = [], 在batchUpdateTransaction的close阶段，遍历dirtyComponents，对状态发生改变的Component进行update，该Component执行render方法，可以得到renderedElement，然后renderedElement进行递归的update，这样子组件就会re-render，根据当前的props得到新的markup，这样整个虚拟DOM树就进行了更新

## TLS原理

Transport Layer Security (TLS) 是一个为计算机网络提供通信安全的加密协议。它广泛应用于大量应用程序，其中之一即浏览网页。网站可以使用 TLS 来保证服务器和网页浏览器之间的所有通信安全。

整个 TLS 握手过程包含以下几个步骤：

- 客户端向服务器发送 『Client hello』 信息，附带着客户端随机值(random_C)和支持的加密算法组合。
- 服务器返回给客户端 『Server hello』信息，附带着服务器随机值(random_S)，以及选择一个客户端发送过来加密算法。
- 服务器返回给客户端认证证书及或许要求客户端返回一个类似的证书，认证证书里面携带服务端的公钥信息。
- 服务器返回『Server hello done』信息。
- 如果服务器要求客户端发送一个证书，客户端进行发送。
- 客户端创建一个随机的 Pre-Master 密钥然后使用服务器证书中的公钥来进行加密，向服务器发送加密过的 Pre-Master 密钥。
- 服务器收到 Pre-Master 密钥。服务器和客户端各自生成基于 Pre-Master 密钥的主密钥和会话密钥。两个明文随机数 random_C 和 random_S 与自己计算产生的 pre-master，计算得到协商密钥enc_key=Fuc(random_C, random_S, pre-master)
- 客户端给服务器发送一个 『Change cipher spec』的通知，表明客户端将会开始使用协商密钥和加密算法进行加密通信。
- 客户端也发送了一个 『Client finished』的消息。
- 服务器接收到『Change cipher spec』的通知然后使用协商密钥和加密算法进行加密通信。
- 服务器返回客户端一个 『Server finished』消息。
- 客户端和服务器现在可以通过建立的安全通道来交换程序数据。所有客户端和服务器之间发送的信息都会使用会话密钥进行加密。

每当发生任何验证失败的时候，用户会收到警告。比如服务器使用自签名的证书。

## WeakRef 和 FinalizationRegistry

WeakRef是一个更高级的API，它提供了真正的弱引用。

WeakRef 和 FinalizationRegistry 属于高级Api，在Chrome v84 和 Node.js 13.0.0 后开始支持。一般情况下不建议使用。