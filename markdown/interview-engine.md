## 什么是前端工程化？

- 模块化：AMD、CMD、commonjs、ESM。
- 自动化：自动化测试、自动化构建、自动化部署。
- 规范化：Vue编码规范、React编码规范、Git提交规范、文档规范。
- 各种工具：Webpack、Rollup、Vite、Babel、PostCSS。

## 包管理器用的哪个？
npm、cnpm、yarn、pnpm，或者有些大公司会自建包管理器。

npm和yarn的原理类似，但是yarn相对来说速度更快。

pnpm与npm、yarn不同，pnpm不会将每个包都复制到项目的node_modules文件夹中，而是将所有包放在一个公共存储库中，并且在需要使用包时将其链接到项目中。这种方法可以减少磁盘使用量，并提高安装和更新速度。

推荐使用yarn和pnpm，速度更快，更稳定。

## 有没有写过自动化测试，怎么做前端自动化测试？

### 测试的优缺点

- 优点：提高测试效率、确保代码质量，重构舒服
- 缺点：学习成本高，需要额外的时间来思考和编写测试代码

### 测试的分类

- 单元测试：针对代码的最小单元进行测试，例如测试函数或模块等。
- 集成测试：将多个模块组合在一起进行测试，确保它们在一起能够正确地工作。
- 端到端测试：模拟用户在应用程序中执行操作的场景，例如点击按钮、输入文本等。

### 测试常用框架

- **Jest**：基础测试框架，一般测试就是选个基础框架，然后再选一些测试工具。

- **vue-test-utils**：vue-test-utils 是一个 Vue.js 官方的单元测试实用工具库，提供了许多 API 来方便地测试 Vue 组件。在单元测试中，可以通过模拟组件的 props、methods、data 等属性和方法，以及通过创建 wrapper 对象来访问组件实例的生命周期钩子函数，来进行组件的测试。此外，还可以使用 snapshot 测试来测试组件的渲染输出是否符合预期。

- **Cypress**：Cypress是一个用于 Web 应用程序的端到端测试工具，它可以模拟用户操作和行为，以及监控页面状态和 DOM 变化等。

- **Enzyme**：Enzyme 是一个 React 组件测试实用工具库，提供了许多 API 来方便地测试 React 组件。在单元测试中，可以通过模拟组件的 props、state、函数和生命周期钩子等属性和方法，以及通过创建 wrapper 对象来访问组件实例的 DOM 节点和事件，来进行组件的测试。

### 测试检验结果

通过测试覆盖率当成测试的检验结果，测试覆盖率是衡量测试用例覆盖源代码的程度的指标，包括行覆盖率、分支覆盖率、函数覆盖率和语句覆盖率。测试覆盖率可以评估测试用例的质量和完整性，帮助开发人员确定需要更多测试的部分，并作为一种度量软件质量的指标。覆盖率越高，说明被测试的代码被验证的越充分，软件更加稳定和可靠。

### 总结

一般在项目里如果只是做UI开发，大多数情况下不用写自动化测试，但是一些封装的工具，组件库，插件之类的，可以写测试提高代码健壮性。

## 什么是持续集成？
持续集成，简称CI。CI有以下好处：

- CI作为敏捷开发重要的一步，其目的在于让产品快速迭代的同时，尽可能保持高质量.
- CI可以增加项目可见性，降低项目失败风险的开发实践。其每一次代码更新，都要通过自动化测试来检测代码和功能的正确性，只有通过自动测试的代码才能进行后续的交付和部署.
- CI 是团队成员间（产研测）更好地协调工作，更好的适应敏捷迭代开发，自动完成减少人工干预，保证每个时间点上团队成员提交的代码都能成功集成的，可以很好的用于对各种WEB、APP项目的打包.

一般是借助Jenkins、Docker、Travis、GitLab等工具来实现，大多数时候是由后端或者运维来做这个事的，但是在公司没有专业运维的情况下，前端负责人也可以考虑给项目上持续集成。

## 用过Babel吗？讲一下你对Babel的了解？

Babel是一个JS编译器，用通俗的话解释就是它主要用于将高版本的JavaScript代码转为向后兼容的JS代码，从而能让我们的代码运行在更低版本的浏览器或者其他的环境中。

Babel的核心就是plugin、preset。

1. **plugin**：Babel功能的实现就是靠着各种plugin，Babel插件包括语法插件和转换插件。

2. **preset**：预设，一组plugin的组合，共同完成一个大功能。

Babel执行原理:

1. 解析: 将代码字符串转换成 AST抽象语法树
2. 转换: 访问AST的节点进行变换操作生成新的 AST
3. 生成: 以新的AST为基础生成代码

## ESLint有什么用？你有用它来规范过团队代码吗？
ESLint是JS代码检查工具，可以用来规范前端代码风格和发现潜在的代码错误。

很多初学者不愿意用这样的代码检查工具，因为总会报错。但是对于有经验的开发者或者说团队管理者来说，它可以规范团队小伙伴的编码风格。

ESLint常用的配置有：

- rules：指定规则，包括警告和错误规则，可以覆盖继承规则集中的规则或自定义规则。
- plugins：指定插件，可以使用已有的插件如eslint-plugin-react或自定义插件。

## 讲一下你了解哪些前端模块化规范？

1. ES6 模块化：ES6 模块化是一种 JavaScript 模块化规范，是 ES6 中新增的语言特性。在 ES6 中，每个模块都是一个独立的文件，并通过 export 导出模块，通过 import 导入模块。例如：

``` javascript
// 导出模块
export var foo = 'bar';
export function add(x, y) {
  return x + y;
}

// 导入模块
import {foo, add} from 'module';
console.log(foo); // 'bar'
console.log(add(1, 2)); // 3
```

2. CommonJS：Node.js的模块化规范。在CommonJS中，每个模块都是一个单独的文件，并通过module.exports导出模块，通过require()导入模块。例如：

``` javascript
// 导出模块
module.exports = {
  foo: 'bar',
  add: function(x, y) {
    return x + y;
  }
};

// 导入模块
var module = require('module');
console.log(module.foo); // 'bar'
console.log(module.add(1, 2)); // 3
```

3. AMD和CMD：以前老的模块化规范，现在很少用了。

## 讲一下你最常用的git命令，你们团队的git提交规范是什么？

### 常用命令

- git init: 初始化Git仓库。
- git clone：克隆远程仓库到本地。
- git add：保存修改。
- git commit：提交修改。
- git push：将本地仓库的修改推送到远程仓库。
- git pull：从远程仓库拉取最新的修改到本地仓库。
- git stash：暂存当前工作区，以便后续恢复。
- git reset: 恢复到指定的提交。
- git revert: 撤销指定的提交。
- git branch: 列出当前所有分支。
- git checkout: 切换到指定分支或提交。
- git merge: 将指定分支合并到当前分支。

### 提交规范

一般采用 Angular 团队提出的 Commit Message Conventions。

1. 每次提交都应该包含一个 Header，格式为 `<type>(<scope>): <subject>`，其中 `<type>` 表示提交的类型，包括以下几种：feat（新功能）、fix（修复 bug）、docs（文档修改）、style（代码样式修改）、refactor（重构代码）、test（增加测试代码）、chore（构建过程或辅助工具的修改）；`<scope>` 表示影响的范围；`<subject>` 表示简要说明。
2. Header 应该在 50 个字符以内。
3. Header 应该使用英文。
4. Body 是可选的，用于更详细地说明修改内容，可以分成多行，每行不超过 72 个字符。
5. Footer 也是可选的，用于关闭 Issue 或者列举重大变化等。 这种提交规范可以帮助团队更好地管理代码，方便追踪历史修改记录，提高代码质量。

## 打包工具了解哪些，Webpack、Rollup、Parcel有什么区别？
Webpack适合打包大型项目，可以处理多种文件类型，包括 JS、CSS、图片、字体等,另外通过Loader和Plugin机制提供了丰富的扩展功能。

Rollup适合JS库打包。Rollup的特点是生成的代码简洁，不会出现冗余的代码，因此适合用于构建库或插件等独立的组件。

Parcel使用简单，适用于小型项目和个人项目打包。

## 有用过Vite吗，为什么Vite会那么快？

1. 在开发环境下利用Chrome原生支持ESM的新特性，减少了处理import的消耗。

2. 静态分析和模块预构建：Vite 在启动时，会分析项目中的所有模块，并提前编译和缓存这些模块，以便在需要时能够快速地提供给浏览器。这样可以避免了每次修改代码时重新构建的时间浪费。

3. Vite内部使用ESBuild来处理TS，比TSC性能要好很多。

## 你怎么理解前端基建？

包括但不限于：

- 规范建设，给团队指定编码和提交规范。
- 文档建设，包括组件文档、业务文档、接口文档、跨端跨部门文档。
- 安全建设。
- 性能体系、埋点体系。
- 组件库和类库建设。
- BFF方案，包括SSR和GraphQL.
- 微前端方案。
- 脚手架。
- 低代码。

## 有了解过Rust吗？在前端有哪些应用？
Rust特点：简单概括就是高性能、语法多、学习难。(鉴于此，后续我会出一个教前端同学入门Rust的专栏。)

Rust的语法特性包括：所有权、借用、trait、泛型、模式匹配、宏等。

Rust在前端领域主要应用有WASM和前端基建，并且已经有了不少实战。比如：

1. Yew：一个用Rust开发WASM应用的框架，开发体验类似于React，甚至也有Yew Hooks。
2. Deno：JS和TS运行时，相当于更安全，性能更好的Nodejs。
3. SWC：相当于Rust版的Babel。
4. Turbopack、RSpack：相当于Rust版的Webpack。

## 微前端适用于什么场景？设计一个微前端框架要怎么考虑？

微前端适用于以下场景：

1. 随着项目规模逐渐扩大，团队协作效率降低，可以考虑将大项目拆分成多个小项目，每个小项目都由独立的小型团队独立开发独立部署，
2. 团队技术栈不同，可以将项目拆分，每个子项目采用不同技术栈开发，然后用微前端框架把项目组合在一块。

设计一个微前端框架，需要考虑：

1. 样式隔离：样式隔离可以采用的方案有CSS Modules、Shadow DOM、CSS-in-JS或者命名约定的方式。
2. JS隔离：JS隔离需要创建沙箱环境，JS里可以通过Web Worker或者iframe来创建沙箱，还可以通过IIFE(立即调用表达式)来创建沙箱。
3. 应用通信：应用之间可以采取URL参数传递信息、事件总线或者全局变量(会造成命名冲突和状态污染、，不够优雅)来实现通信。
4. 路由管理：微前端中的路由管理，主要包括两个方面的内容：一是在宿主应用中对微前端应用的路由进行管理，二是在微前端应用内部实现自身的路由管理。
5. 代码共享：可以通过将公用代码提取成三方库的形式来共享代码，还可以采用Webpack5的模块联邦来实现代码共享。
