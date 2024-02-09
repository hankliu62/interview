## 什么是loader？有哪些常见的loader？怎么配置loader？

Webpack默认只认识JS，对于非JS的文件，比方说样式，图片，文件，json等等，就需要一些工具来帮忙翻译。而loader，就是那个翻译官，可以解析非原生JS的代码或文件。

常见的Webpack loader有：

- babel-loader：处理ES6的loader。
- css-loader：处理CSS的loader。
- style-loader：将CSS插入到HTML页面中的<style>标签的loader。
- less-loader：处理less的loader。
- file-loader：处理文件的loader。
- url-loader：处理文件的loader，类似于file-loader，但可以将小文件转换为Data URL。
- image-webpack-loader：处理图片的loader。
- eslint-loader：运行ESLint检查的loader。

loader配置步骤：

1. npm下载对应的loader。
2. 在module选项里配置rules，每个rule是个对象，用来表示对一个文件的处理规则，test表示要处理的文件，use里可以通过配置多个loader来处理。要注意loader的执行顺序为：从下到上，从右到左。

``` javascript
module.exports = {
  // loader
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          { loader: 'sass-loader' },
        ],
      },
    ],
  },
};
```

## 什么是plugin？有哪些常见的plugin？怎么配置plugin？

plugin，即插件。Webpack插件是对Webpack功能的扩展和增强，可以帮助我们在打包过程中自动执行一些额外的操作，例如生成HTML文件、压缩代码、提取CSS等。

常见的plugin有：

- HtmlWebpackPlugin：根据模板生成HTML文件，可以自动引入打包后的资源。
- UglifyJsPlugin：压缩JavaScript代码。
- CleanWebpackPlugin：在每次构建前清理输出目录。
- MiniCssExtractPlugin：将CSS代码提取到单独的文件中。
- DefinePlugin：定义全局常量，可以在代码中直接使用。
- CopyWebpackPlugin：将文件复制到输出目录。
- ProvidePlugin：自动加载模块，使其在所有模块中可用。

plugin配置步骤：

1. npm下载要用的plugin。
2. 在plugins选项里配置plugin，每个plugin是一个类，new这个类，然后可以根据文档和需求配置option即可。

``` javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // ...其他配置
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
}
```

## 什么是文件指纹

Webpack的文件指纹是指在打包过程中为每个文件生成唯一的标识符，以便于版本管理和缓存控制。比方说Vue项目打包后生成的css文件和js文件，一般都会有奇奇怪怪的文件名，那就是文件指纹。

文件指纹的实现原理是根据文件内容生成哈希值，一般是利用Webpack内置的`HashedModuleIdsPlugin`和`MiniCssExtractPlugin`来实现。

## 什么是Source Map？怎么配置？

### Source Map概念

在开发过程中，我们经常需要对编译后的代码进行调试，但是编译后的代码往往很难阅读和理解。Source Map（源映射）是一种文件格式，它可以将编译后的代码映射回源代码。通过使用Source Map，我们可以在浏览器中直接调试源代码，而不需要在编译后的代码中进行调试。

比如Vue项目，跑在浏览器里的代码其实并不是你写的.Vue文件，而是经过编译后的。可是平时调试的时候，我们写的代码位置却能和浏览器控制台对应上。

而帮我们做这个事情的，就是Source Map。

### Source Map原理

Source Map包含了源代码和编译后的代码之间的映射关系，通常是一个JSON文件，它包含了每行代码的映射信息，例如源文件路径、行号、列号等。当浏览器执行编译后的代码时，它会通过Source Map将执行位置映射回源代码的位置，从而使得开发者可以直接在源代码中进行调试。

### 怎么配置Source Map

在Webpack中，可以使用devtool配置选项来生成Source Map。常用的选项有：

- **eval**：生成每个模块的eval代码，并且模块执行完后，eval代码被执行。这种方式速度很快，但是不适合生产环境。
- **source-map**：生成独立的source-map文件，适合生产环境，但是会增加构建时间和文件大小。
- **cheap-source-map**：生成source-map，但是不包含列信息，适合大型项目。
- **cheap-module-source-map**：生成source-map，同时会将loader的sourcemap也加入进来。

## 了解过Tree-shaking吗？

### 概念
Tree-shaking又叫摇树优化，是通过静态分析消除JS模块中未使用的代码，减小项目体积。

### 原理
Tree-shaking依赖于ES6的模块机制，因为ES6模块是静态的，编译时就能确定模块的依赖关系。对于非ES6模块的代码或者动态引入的代码，无法被消除掉。

### 配置
Tree-Shaking需要配置optimization选项中的usedExports为true，同时在babel配置中使用babel-preset-env，开启modules选项为false，这样可以保证ES6模块在编译时不会被转换为CommonJS模块。

## 什么是HMR，原理是什么
HMR：即热更新，简单说就是在我们写代码保存后不需要手动刷新浏览器，就能直接看到更新后的结果，而且只改变我们更改的那部分内容。

HMR的原理：将需要更新的模块通过websocket与Webpack Dev Server建立连接，当模块发生变化时，Webpack Dev Server会将新的模块代码推送给浏览器端，浏览器端通过将新代码插入到运行时环境中，来实现实时更新。

怎么配置HMR：

1. 在配置文件中添加webpack.HotModuleReplacementPlugin插件。
2. 在webpack-dev-server的配置中添加hot: true，启用热替换。
3. 在entry中添加hot module replacement runtime。
4. 在模块代码中使用module.hot.accept方法，以接受新模块的更新。

HMR只适用于开发环境，不能用于生产环境，因为HMR需要额外的代码和性能消耗。在生产环境中，应该禁用HMR，使用正常的文件更新机制。

## 有没有写过自定义的loader？
loader本质是一个函数，接受源代码作为参数，返回处理后的结果，举个最简单的例子：

``` javascript
module.exports = function(source) {
  return source.toLowerCase();   // 将源代码所有字母转成小写
};
```

在开发自定义loader时可以借助loader-utils这个工具库，可以通过调用loader-utils中提供的API来获取loader选项、文件路径、查询字符串等信息。

loader-utils提供的常用API包括：

- getOptions(loaderContext)：获取Loader的选项，返回一个包含选项信息的对象。
- parseQuery(queryString)：解析查询字符串，返回一个包含解析结果的对象。
- stringifyRequest(loaderContext, request)：将请求转换为字符串，返回一个包含转换结果的字符串。
- getRemainingRequest(loaderContext)：获取请求中的剩余部分，返回一个包含剩余部分的字符串。
- getCurrentRequest(loaderContext)：获取当前请求的完整部分，返回一个包含当前请求的字符串。

举个例子，我们来写一个可以让使用者自己决定转成大写还是小写的自定义loader：

``` javascript
const { getOptions } = require('loader-utils');

module.exports = function(source) {
  const options = getOptions(this);
  const mode = options.mode || 'uppercase';
  if (mode === 'uppercase') {
    return source.toUpperCase();
  } else if (mode === 'lowercase') {
    return source.toLowerCase();
  } else {
    return source;
  }
};
```

然后在配置时可以通过options属性来为该loader提供选项：

``` javascript
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: [
          {
            loader: 'my-loader',
            options: {
              mode: 'lowercase',
            },
          },
        ],
      },
    ],
  },
};
```

## 有没有写过自定义的plugin？

自定义plugin本质是一个类，这个类实现了apply方法，在apply方法中，通过compiler对象注册一个或多个Webpack生命周期事件的监听器，然后在监听器函数中，实现自定义的逻辑。

举个简单的例子：

``` javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('MyPlugin', (stats) => {
      console.log('Bundle is now finished!\n');
      console.log(stats.toString());
    });
  }
}

module.exports = MyPlugin;
```
使用这个plugin：

``` javascript
const MyPlugin = require('./my-plugin');

module.exports = {
  // ...
  plugins: [
    new MyPlugin(),
  ],
};
```

当然，一般自定义的plugin不会这么简单，还需要使用一些进阶技巧，比如：

1. 合理使用Webpack的生命周期事件：
Webpack提供了许多生命周期事件，可以通过这些事件来监听Webpack构建过程中的各个阶段。在编写自定义插件时，需要选择合适的生命周期事件来监听，并在其中执行自定义逻辑。例如，如果需要在Webpack构建完成后输出一份打包报告，可以使用done事件来实现。

2. 使用Webpack提供的钩子函数：
Webpack提供了一些钩子函数，可以方便地实现一些常见的功能，如资源解析、模块加载等。在编写自定义插件时，可以通过调用这些钩子函数来实现自定义逻辑。例如，如果需要在Webpack解析模块时，修改模块的路径或内容，可以使用normalModuleFactory钩子函数来实现。

3. 使用Webpack提供的工具函数和API：
Webpack提供了许多工具函数和API，可以帮助开发者更加方便地操作Webpack构建过程中的各种资源。在编写自定义插件时，可以使用这些工具函数和API来实现自定义逻辑。例如，如果需要将某些资源复制到输出目录下，可以使用copy-webpack-plugin插件提供的copyWebpackPlugin函数来实现。

4. 使用Webpack提供的配置项：
Webpack提供了许多配置项，可以用来控制Webpack的构建行为。在编写自定义插件时，可以通过配置这些选项来实现一些特定的构建需求。例如，如果需要在Webpack打包时生成SourceMap文件，可以使用devtool配置项来实现。

当然，想要实现能用于生产解决问题的自定义plugin的难度并不小，在后续我也会出相关的课程和专栏，来讲解如何实现真正生产可用的自定义plugin。

## Webpack打包流程是怎么样的？

1. 解析配置文件：Webpack会读取项目根目录下的Webpack配置文件，解析其中的配置项，并根据配置项构建打包流程。
2. 解析模块依赖：Webpack会从entry配置中指定的入口文件开始，递归解析模块之间的依赖关系，并构建模块依赖图谱。
3. 加载模块：Webpack会根据模块依赖图谱，加载所有需要打包的模块，通过配置的loader将文件转换成Webpack可识别的模块。
4. 执行插件：Webpack会在打包流程中执行一系列插件，插件可以用于完成各种任务，例如生成HTML文件、压缩代码等等。
5. 输出打包结果：Webpack会将打包后的代码和资源输出到指定的输出目录，可以使用配置项进行相关设置。
6. 监听变化：在开发模式下，Webpack会在代码修改后重新构建打包流程，并将修改后的代码热更新到浏览器中。

## Webpack事件机制了解吗？

### Webpack常见的事件

- before-run: 在Webpack开始执行构建之前触发，可以用于清理上一次构建的临时文件或状态。
- run: 在Webpack开始执行构建时触发。
- before-compile: 在Webpack开始编译代码之前触发，可以用于添加一些额外的编译配置或预处理代码。
- compile: 在Webpack开始编译代码时触发，可以用于监听编译过程或处理编译错误。
- this-compilation: 在创建新的Compilation对象时触发，Compilation对象代表当前编译过程中的所有状态和信息。
- compilation: 在Webpack编译代码期间触发，可以用于监听编译过程或处理编译错误。
- emit: 在Webpack生成输出文件之前触发，可以用于修改输出文件或生成一些附加文件。
- after-emit: 在Webpack生成输出文件后触发，可以用于清理中间文件或执行一些其他操作。
- done: 在Webpack完成构建时触发，可以用于生成构建报告或通知开发者构建结果。

### Webpack的事件机制
Webpack的事件机制是基于Tapable实现的，Tapable是Webpack事件机制的核心类，它封装了事件的订阅和发布机制。在Webpack中，Compiler对象和Compilation对象都是Tapable类的实例对象。

## 有了解过Webpack5吗，相比于Webpack4有哪些提升？

Webpack5相对于Webpack4有以下提升：

1. 更快的构建速度：Webpack5在构建速度方面进行了大量优化，尤其是在开发模式下，构建速度有了明显提升。
2. Tree Shaking优化：Webpack5进一步改进了Tree Shaking算法，可以更准确地判断哪些代码是无用的，从而更好地优化构建输出的文件大小。
3. 内置的持久化缓存：Webpack5在持久化缓存方面进行了优化，可以缓存每个模块的编译结果，从而加速后续的构建。
4. 支持WebAssembly：Webpack5增加了对WebAssembly的原生支持。
5. 模块联邦（Module Federation）：Webpack5引入了模块联邦的概念，可以实现多个独立的Webpack构建之间的模块共享和远程加载，为微前端架构提供了更好的支持。

## 讲一下你对模块联邦的理解？
模块联邦是实现多个项目之间共享代码的机制。

举个例子，假设我们有一个微前端应用，其中包含了一个商品管理应用和一个订单管理应用，这两个应用都需要使用到同一个UI组件库。

为了避免重复的代码，我们可以将UI组件库拆分成一个独立的子应用作为模块提供方，然后通过模块联邦的方式在商品管理应用和订单管理应用中动态加载该组件库。

在模块提供方里配置`ModuleFederationPlugin`：

``` javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      name: 'app1',   // 应用名
      filename: 'remoteEntry.js',
      exposes: {     // 需要共享的模块和对应的路径
        './Button': './src/components/Button',
      },
      shared: ['react', 'react-dom'], // 共享的第三方库
    }),
  ],
};
```

然后在模块调用方里配置`ModuleFederationPlugin`：

``` javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      name: 'app2',  // 调用方应用名
      filename: 'remoteEntry.js',
      remotes: {
        app1: 'app1@http://localhost:3001/remoteEntry.js', // 模块提供方的路径
      },
      shared: ['react', 'react-dom'],  // 共享的第三方库
    }),
  ],
};
```

## Webpack怎么优化开发环境？

开发环境常见的问题有：

1. 启动慢。
2. 编译慢，尤其是当项目变大时，修改一行代码要等好几秒甚至十几秒才能看到效果。
3. 占用内存高，当模块数变多时，项目运行占用内存飙升，导致电脑卡顿，影响开发效率。

优化措施：

1. 使用缓存：可以使用Webpack的缓存功能，将打包结果缓存起来以避免重复构建。可以使用cache-loader或hard-source-webpack-plugin等插件来实现缓存。
2. 使用 DllPlugin：DllPlugin 是 Webpack 的一个插件，它可以将一些不经常变动的第三方库预先打包好，然后在开发过程中直接使用。这样可以减少每次构建时对这些库的重复打包，提高构建速度。
3. 配置合适的SourceMap策略：在开发环境下，开启 SourceMap 可以帮助我们快速定位错误和调试代码。但是开启 SourceMap 会降低构建速度，所以需要权衡是否开启。
4. 多线程并行打包：可以使用thread-loader或happypack开启多线程并行构建，但是并不是一定会提升性能，需要结合场景来自行取舍，比较适合单个耗时长的任务。
5. 配置模块解析：Webpack 在模块解析时会搜索 node_modules 目录，这个过程比较耗时。为了减少搜索时间，我们可以使用 resolve.alias 配置选项来告诉 Webpack 直接使用特定的路径来查找模块。
6. 使用新技术，比如Webpack5或者Vite这些性能更好的构建工具。

## Webpack怎么优化打包结果？

优化打包结果的核心目标就是让打出来的包体积更小。

1. 打包体积分析：使用webpack-bundle-analyzer来分析，一般脚手架里直接运行命令行就能生成打包体积图，很方便，然后可以根据包体积能定向优化。
2. 代码压缩：使用UglifyJsPlugin、MiniCssExtractPlugin等插件来对JS代码和CSS代码进行压缩，减小代码体积，实际开发中一般脚手架也会默认有压缩的配置。
3. 使用懒加载：可以使用Webpack的动态导入功能，实现懒加载，在需要时再加载代码块。这可以缩短首屏加载时间，提升体验。
4. 开启gzip：使用compression-webpack-plugin插件，生成额外的gzip静态文件，然后部署时再开启Nginx的gzip即可。
5. 使用splitChunks提取公共代码，在脚手架中一般是默认开启的。
6. 分离第三方库：将第三方库从应用程序代码中分离出来，单独打包，这样可以提高缓存效率并减小应用程序代码的大小。
7. 开启Tree Shaking，对于Vue和React项目，一般是默认开启Tree Shaking的，我们在编写代码时尽量使用ES模块化语法，就可以了。