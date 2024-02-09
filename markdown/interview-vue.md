## 如果让你封装一个通用的弹框组件，你会从哪些方面考虑
1. 首先写好弹框的样式布局和交互，完成一个基础版本。

2. 组件API设计：提取出通用的props,event,slot,作为API让使用者使用的时候去传值。

3. 进一步思考：考虑弹框层级问题，可以通过手动挂载将弹框和#app元素放在同一层级，或者使用Vue3提供的Teleport组件。

组件封装和组件库的问题，还可以更深入地和面试官聊。比如：

- 组件库的组件通信问题.
- 组件库文档设计问题。
- render函数在组件封装的应用。
- 作用域插槽在组件封装的应用。
- 组件库动画组件的封装。
- TS在组件库的应用。
- 自动化测试在组件库的应用。
- ...

关于Vue组件库的方方面面，后续我也将会出专栏详细讲解，感兴趣的小伙伴可以持续关注。

## Vue组件通信有哪些方式，适用场景分别是什么

- 父 -> 子：props。
- 子 -> 父：自定义事件。
- provie/inject：父级组件 -> 子孙组件。
- Event Bus：适用于任意组件之间通信，利用$on和$emit通过事件传递数据，也常用于封装组件库时的组件通信。
- 通过组件实例，比如通过$children获取子组件实例，然后就可以在父组件中调用子组件的方法。
- Vuex：适用于复杂应用的全局状态管理。

## Vue哪个生命周期发送数据请求
1. created：发送请求时机通常越早越好，beforeCreate最早，但是很多时候我们发送请求需要依赖data和props中的数据或者调用methods里的方法,而这些是在created实例创建之后才有的，所以一般发送请求会放在created。

2. mounted：除了created之外，mounted也常用来发送请求，其实这两者区别通常不大。因为生命周期是同步的，而请求是异步的。不管在created还是mounted里发请求，都不会阻塞页面渲染，请求都是在下一次事件循环才完成的。

## Vue的data为什么必须是函数
组件是用来复用的，且Vue组件和Vue实例之间是通过原型链来继承的。如果data是一个对象，那么在组件复用时，多个组件将共享一个data对象，这样一个组件的状态改变会影响到其他组件。

将data选项定义为函数，因为函数每次调用返回的都是一个全新的对象，从而避免状态影响。

## computed和watch使用场景有什么不同，实现原理呢

### computed

- computed是值，依赖于其它的状态。比如购物车的总价格，可以根据其它几个价格算得。
- computed有缓存特性，只要依赖的状态没有改变，computed的值就会被缓存起来。当依赖发生变化时，才会重新计算。

### watch

- watch用于监听状态的变化，比方说监听路由，一旦监听的状态发生变化，就执行某个函数。
- watch有两个参数也是面试常考点，
  - immediate：当我们希望在组件初始化时执行一次watch函数，就可以开启immediate选项
  - deep：深度监听，开启此选项当监听的对象的某个属性值发生变化，也会触发watch监听函数

实现原理：

- computed和watch都是基于Vue响应式原理，首先通过initWatcher和initComputed来解析watch和computed选项，然后遍历，给每个watch和computed添加Watcher对象。
- 不同的是给computed添加的Watcher对象是lazy Watcher，默认不执行，取值的时候才执行。
- computed的缓存特性是通过Watcher对象的dirty属性来实现的。

## Vue怎么实现数据响应式

- **数据劫持**：Vue实现数据响应式的核心是使用了Object.defineProperty方法对数据对象进行劫持，实现对数据的监听。

- **依赖搜集**：Vue之所以可以做到细粒度的更新，不需要像React那样全量diff，核心就在于Vue的依赖搜集。当数据对象的属性被读取时，会触发getter并创建Watcher对象，Watcher对象存储的就是依赖关系，然后将Watcher对象存到依赖收集器（Dep）对象中，这样就完成了依赖收集。

关于Vue响应式实现原理，此处只是做了一个大略简短的总结，至于其中细节，后续我也会出文章和专栏详细讲解。

## Vue2中怎么检测数组的变化

由于Object.defineProperty的限制性，导致Vue2的响应式无法直接监听到对象属性增加或删除的变化以及数组的变化。

Vue2重写了数组的push()、pop()、shift()、unshift()、splice()、sort()和reverse()方法，使用这些方法更改数组，Vue可以监听到。

对于更改数组索引或者更改数组指定位置元素的操作，可以使用$set这个API。

## 谈一谈对MVVM的理解？Vue实现双向数据绑定原理是什么

MVVM，简单来说，就是数据和视图的双向绑定，Model-View和View-Model。

Vue是双向绑定的，数据更改时，视图自动更改。在表单应用中，当用户输入引起页面变更的时候，v-model的数据也会自动发生更新。

React是单向绑定的，React只是当数据变更时，视图自动更新。而在用户输入的时候，数据模型不会自动变更。不过在开发表单应用的时候，我们也可以自行给React封装上双向绑定这个功能。

MVVM是UI开发的一个大趋势，除了前端之外，像Android Jetpack里的Data Binding和IOS的Swift UI，都是摒弃了以往的MVC或者MVP，采用MVVM的方式来组织代码。

Vue双向绑定实现原理：

- 双向绑定的实现分为两层：数据 -> 视图、视图 -> 数据。
- 从数据到视图的绑定就是Vue实现响应式那一套，利用数据劫持和观察者模式对数据进行监听，当数据变更时，通知视图更新。
- 从视图到数据的绑定实现原理比较简单，是通过监听输入框地input事件，将输入框的值赋给绑定的数据对象属性。

## 什么是虚拟DOM，有什么作用？有了解过diff算法吗

所谓虚拟DOM，简单点说就是个JS对象，它是比DOM更轻量级的对UI的描述。在Vue中，就是由VNode节点构成的树形对象。

### 虚拟DOM的作用

- 跨平台：因为是纯JS对象，所以可以在任意能运行JS的地方运行，比如SSR和混合开发。
- 相对还不错的渲染性能：虚拟DOM可以将DOM操作转换为JS对象操作，通过对比新旧虚拟DOM树的差异（也就是diff算法），只更新发生变化的部分，从而减少不必要的DOM操作，提高渲染性能。但是这种性能提升只是相对的，因为Svelte已经证明了不用虚拟Dom性能也可以很好。

### Vue diff算法相关知识点

- 基于Snabbdom：Vue的diff算法是基于三方库Snabbdom的diff算法基础上优化得来的。
- 采用双端比较：Vue的diff算法采用了双端比较的方式，即同时对新旧两个vnode进行比较。这种方式可以最大限度地复用已有的DOM元素，减少不必要的DOM操作，从而提高更新性能。
- 使用 key 进行原地复用：当 diff 算法比较两个vnode时，会先按照 key 值进行比较，如果 key 值相同，则认为这两个vnode是同一个节点，可以进行复用。否则，Vue会将旧节点从DOM中删除，重新创建新节点并插入到DOM中。
- 静态节点优化：Vue的diff算法对静态节点进行了优化，即对不需要更新的节点进行缓存，减少不必要的比较和更新操作。
- 当比较两个节点时，会首先比较它们的节点类型，如果不同，则直接替换。如果类型相同，则会继续比较节点的key、数据和子节点等属性，找出它们之间的差异，从而更新DOM。

## Vue模板编译原理了解吗

模板编译流程：

模板编译的目标是要把template模板转换成渲染函数，主要分成3个步骤，parse -> optimize -> generate ，记住这三个单词。

1. parse(解析模板)：首先会用正则等方式将模板解析为 AST（抽象语法树），这个过程包括词法分析和语法分析两个过程。在这个过程中，模板会被分解成一些列的节点，包括普通元素节点、文本节点、注释节点等，同时也会解析出这些节点的标签名、属性、指令等信息。

2. optimize(静态分析)：静态分析是指分析模板中的所有节点，找出其中的静态节点和静态属性，并将其标记出来。所谓静态节点是指节点的内容不会发生变化的节点，例如纯文本节点、含有静态属性的节点等，而静态属性则是指节点上的属性值不会改变的属性，例如 class 和 style 属性。标记静态节点和静态属性可以帮助 Vue 在后续的更新中跳过这些节点的比对和更新过程，从而提高应用的性能。

3. generate(代码生成)：将 AST 转换为可执行的渲染函数。

## 怎么做Vue自动化测试

### 测试方案

- 测试框架：Jest或者Mocha，Vue脚手架创建项目的时候会询问，这两个选一个就行。
- 测试工具：@vue/test-utils，专门用于Vue测试的工具包。

### 测什么

- 测组件有没有正确渲染。
- 测组件API，包括props,event,slot。
- 测事件函数有没有正常触发。
- 测路由能不能正常触发。
- 测函数逻辑是否正确。
- 测计算属性。
- 测watch。
- 测Vuex。
- 等等，你写的代码几乎都可以测。。。

举一个简单的测Button按钮组件的例子：

``` javascript
// 引入需要的测试工具和Button组件
import { mount } from '@vue/test-utils'
import Button from '@/components/Button.vue'

describe('Button', () => {
  it('renders default button', () => {
    // 渲染组件
    const wrapper = mount(Button)

    // 断言组件渲染出来的html符合预期
    expect(wrapper.html()).toContain('<button class="btn">Button</button>')
  })

  it('renders primary button', () => {
    // 渲染带有primary属性的Button组件
    const wrapper = mount(Button, {
      propsData: {
        primary: true
      }
    })

    // 断言组件渲染出来的html符合预期
    expect(wrapper.html()).toContain('<button class="btn btn-primary">Button</button>')
  })

  it('triggers click event', () => {
    // 创建一个mock函数，用于测试点击事件是否被调用
    const mockFn = jest.fn()

    // 渲染Button组件，并在点击事件中调用mock函数
    const wrapper = mount(Button, {
      propsData: {
        onClick: mockFn
      }
    })

    // 触发按钮的点击事件
    wrapper.trigger('click')

    // 断言mock函数被调用
    expect(mockFn).toHaveBeenCalled()
  })
})
```

## 什么是自定义指令，怎么实现
Vue自定义指令可以用来复用代码，封装常用的DOM操作或行为。常见的自定义指令有监听滚动事件、图片懒加载、设置loading、权限管理等。

自定义指令可以全局注册或局部注册，注册后可以在模板中使用 v-前缀调用，如 v-mydirective。

自定义指令的实现需要定义一个对象，其中包含指令名称、生命周期钩子函数和更新函数等属性，具体如下：

- bind钩子函数：指令第一次绑定到元素时触发，可以用于初始化一些数据或添加事件监听器等操作。
- inserted钩子函数：指令所在元素插入到父节点后触发，常用于添加一些 UI 元素或获取焦点等操作。
- update钩子函数：指令所在元素更新时触发，可以获取新旧值并进行比较后更新UI。
- componentUpdated钩子函数：指令所在元素及其子节点全部更新后触发，常用于需要操作DOM的指令，如监听滚动事件。
- unbind钩子函数：指令与元素解绑时触发，可以清除绑定的事件监听器等操作。

举个例子：

``` javascript
Vue.directive('focus', {
  inserted: function (el) {
    el.focus()
  }
})
```
该指令实现元素自动获取焦点功能，在模板中使用该指令：

``` html
<input v-focus>
```

## keep-alive适用场景是什么，实现原理是什么
1. **适用场景**：keep-alive是Vue提供的一个内置组件，用于在组件之间缓存不活动的组件实例，从而提高组件的渲染性能。keep-alive的使用场景主要是那些需要频繁切换的组件，比如tab切换、列表滚动等。

当一个组件被包裹在keep-alive组件中时，这个组件实例将会被缓存起来。当组件被切换出去时，它的状态会被保存下来，而不是被销毁。当组件被再次渲染时，它的状态将被恢复，从而避免了重新渲染和重新创建组件实例的开销。

``` html
<template>
  <div>
    <keep-alive>
      <router-view v-if="$route.meta.keepAlive"></router-view>
    </keep-alive>
    <router-view v-if="!$route.meta.keepAlive"></router-view>
  </div>
</template>
```

2. **实现原理**：

- 抽象组件：keep-alive组件是一个抽象组件，没有模板，只包含逻辑。
- LRU缓存算法：几乎只要有缓存的地方，就有LRU缓存算法的影子。keep-alive的实现是通过在组件内部维护一个缓存对象来实现的。这个缓存对象是一个类似于LRU缓存的数据结构，它会自动缓存最近使用的组件实例，并根据缓存大小限制自动释放最不常用的组件实例。当keep-alive组件内部渲染时，它会检查缓存对象中是否已经存在对应的组件实例，如果存在则直接取出并渲染，否则就创建一个新的组件实例并添加到缓存中。

## nextTick有什么作用，实现原理是什么
nextTick使用场景很简单，一般用来操作dom。

1. **批量更新**：由于Vue的批量更新策略导致Vue的更新是异步更新，所以改变状态不能立马生效，需要等到下一次事件循环才能获取到更新后的Dom。

2. **基于事件循环**：nextTick的作用就相当于定时器或者微任务，事实上我们把nextTick换成setTimeout，也能达到一样的效果。

3. **优雅降级**：Vue在实现nextTick的时候采取了优雅降级的策略，会判断浏览器是否支持Promise，如果支持，就优先采用Promise，然后依次降级成setImeediate -> setTimeout。

## 讲一下你对SSR的了解
- 相比于SSR，我们平时开发的基于Vue的单页应用叫CSR。
- SSR的优点：更好的SEO、优化首屏加载。
- SSR缺点：学习开发成本高，运维成本高，需要额外部署，踩坑较多。
- SSR的方案：Vue有Nuxt框架，React有Next框架，当然也可以根据公司项目需求自研。
- SSR的核心概念包括：同构、数据脱水注水、服务端请求、跨平台API、服务端生命周期等等。因为篇幅限制，具体的细节和原理，之后我会出专栏讲解。
至于需不需要使用SSR，具体项目要具体对待，如果是对SEO要求特别高，且交互并不复杂的内容站，可以考虑使用SEO。

## 有用过Vue3吗，和Vue2有哪些区别
这是个开放题，不建议背答案，可以结合自己的理解和项目经历展开来讲。如果聊的好的话，没准这一个话题就能帮你获得面试官的青睐。

### 性能提升方面

- Proxy替代Object.defineProperty，性能提升，监听更完备。
- 模板编译的优化，基于Block的静态标记。
- 优化slot的生成，优化渲染函数的生成。
- 更好的Tree Shaking，对于没有用到的API，打包时会剔除，减小包体积。

### 组合API和Reactive API

- 可以从逻辑复用、自定义组合API展开讲解。
- 可以讲讲ref这个API的故事和争论。
- 可以讲讲Vue3和Vue2响应式原理实现方式的不同。

### TypeScript支持方面

Vue3源码用TypeScript重写，Vue3的API也提供了更好的TS类型定义。

### 自定义渲染器
可以讲一讲自定义渲染器能做的一些好玩的事情，比如将Vue用于WebGL或Canvas的渲染。

### 更好的源码架构：

- Monorepo把模块拆分开，逻辑更清晰，源码更容易维护。
- 模块划分也使得更多API被解耦出来，比如Reactive API。
- 源码更容易阅读，方便社区维护。

### 新的功能和组件：

- Teleport：可以将一个组件的内容渲染到任何地方，而不必受到父组件的限制，一般用于封装弹框组件。
- 更好用的组件递归。

## 你知道哪些Vue编码规范

1. if和for不能用在同一个元素。
2. 对于不会发生变化的数据，用Object.freeze()冻结。
3. 给for设置合适的key，尽量不要使用数组的索引作为key。
4. 组件命名：驼峰命名，首字母大写，组件名应该为多个单词组成。
5. props要指定类型。
6. 使用策略模式替代满屏的if/else。
7. 不要写死字符串，多个状态时要使用枚举。