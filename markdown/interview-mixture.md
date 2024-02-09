## JS和WebView之间通信有哪些方式？
内嵌到App的网页，经常需要和App原生之间通信，比如说某些活动页需要获取用户的登陆状态和登录信息。

原生和JS之间通信包括JS调原生和原生调JS，作为前端同学，我们只需要管JS怎么调原生就可以了：

1. URL Schema：URL Schema一般用于在网页端唤醒App，比如微信分享和微信支付功能就需要在浏览器里打开微信App。一般开发中原生小伙伴会给前端一个URL，在前端打开这个URL就可以进入App的对应页面。
2. 拦截弹窗：前端调用alert()、confirm()、prompt()弹窗方法，并传递参数，原生拦截弹窗(不让弹窗弹起)，并且获取其中的参数。
3. 注入对象：原生往window里注入全局的对象，里面包含原生提供给前端的接口，前端只需要调这个接口方法，就能调用原生的方法了。

在项目中，通常原生Android和IOS的小伙伴会封装好一些常见的接口，比如获取用户信息等，然后会提供文档给前端调用。如果有的小伙伴的公司还没有类似的文档，那不妨考虑推动一下JSBridge文档在公司里的落地，既提升了团队之间的沟通效率，也可以作为自己的基建经验写到简历中。

## 什么是PWA，有哪些应用？

PWA可以在桌面和移动设备上提供类似 Native 应用程序的功能和体验。

举个简单的例子，我们有时候在手机上查看一些技术文档，通过PWA里的Service Worker，就可以将网页应用保存到手机桌面，像使用App一样浏览文档网页。

PWA应用主要考虑两件事：

1. Service Worker： 浏览器提供的API，可以实现离线访问和推送通知等功能。
2. Web App Manifest配置：配置文件，可以配置App的名称、图标、颜色和启动 URL 等。

## 讲一下小程序的双线程实现原理？

小程序的本质其实和Hybrid类似，主要依靠的就是WebView，但小程序对安全有更高的要求，所以小程序不允许用户直接操作Dom。

WebWorker就相当于一个天然的沙箱，既可以运行JS，又可以限制用户操作Dom和Bom。小程序的框架层就是放在WebWorker线程的，这样用户只能依靠JS实现纯计算和数据处理。

当setData时，WebWorker线程会使用postMessage通知主线程更新。

## Hybrid、React Native和Flutter原理有什么区别，怎么做技术选型？
Hybrid：就是给H5网页套个App壳子，核心页面利用H5开发，一些需要原生参与的功能由原生给前端提供API。Hybrid最大的优点是开发效率高，成本低但是体验相对较差，只能开发一些比较简单的应用。

React Native：利用React的虚拟Dom可以跨平台的特性，使用JavaScriptCore引擎来执行JS，逻辑部分运行的是JS代码，UI渲染和事件交互是由JS引擎通知原生来实现的，也就是说React Native的UI是由原生画的。

Flutter：Hybrid是UI是浏览器画的，React Native的UI是JS通知原生画的，而Flutter的UI是Dart语言自己画的，Flutter利用Skia库实现了一套自己的渲染引擎。因此Flutter的体验和性能相对Hybrid和React Native要更好。

混合开发对原生能力的要求还是挺高的，对于一款成熟的商业App，完全交由前端同学来做是有一定风险的。在大多数公司，一般是主要业务用原生开发，一些交互简单或者变动频繁的页面，可以用Hybrid，RN或者Flutter开发，提升UI开发的效率。

## 什么是热重载，有什么好处，Flutter热重载是怎么实现的？
热重载，就是指保存一行代码，不用重启应用，直接就能看到效果，而且只改变修改了的部分。

开发过原生Android和IOS应用的小伙伴们应该知道，一般我们写好代码，保存，编译到看到效果，可能需要几秒到几十秒，如果项目规模很大的时候，甚至需要好几分钟才能看到效果。而Flutter提供的这种热重载功能，显然是让App开发效率大幅提升的。

Flutter的热重载实现机制，是基于Flutter的运行时编译(JIT)。Flutter既支持JIT,又支持AOT，开发模式下使用JIT可以实现热重载，但是会稍微牺牲一点App运行性能。生产环境使用AOT，提升App性能。

Flutter热重载的大致流程如下：

1. 改动代码：当我们改动代码保存后，Flutter热重载模块会扫描工程中的文件，检查是否有增删改，直到找到上次编译之后发生变化的Dart代码。
2. 增量编译：对修改的文件编译生成增量文件。
3. 更新增量文件：将增量文件通过Http端口推送到Dart VM中，并与之前的增量文件合并生成新的增量文件并加载。(Flutter代码是在Dart VM中运行的)
4. 更新UI：重置UI线程，通知Flutter Framework重建Widget。

## 什么是热修复，Flutter有哪些热修复方案？
热修复，举个简单的例子，App刚上架就出了Bug，这时候要想修改就得重新发版，用户得重新安装，不仅麻烦，还会导致客户流失。而热修复就是为了解决这个问题的。

所以现在的热修复主要是一些大公司自行实现的方案，市面上可以使用的方案有：

1. Tinker：腾讯出品。
2. Bugly：腾讯出品。

虽然热修复可以快速地修复应用程序中的问题，但是由于其动态加载补丁的机制，可能会带来一些潜在的安全风险，而且在IOS平台，其实是限制热修复的，所以热修复方案需要慎用。Flutter官方原本准备开发CodePush用于热更新，出于安全考虑以及平台限制，也停止开发了。

## Flutter和原生之间如何通信？

### MethodChannel

MethodChannel是一种单向通信机制，即Flutter只能向原生发送消息，原生只能向Flutter发送消息。

### EventChannel

EventChannel是一种双向通信机制，可以实现Flutter和原生之间的事件传递。Flutter可以通过EventChannel向原生发送事件，原生可以在事件通道上监听这些事件，并在事件发生时发送消息给Flutter。EventChannel主要用于实现Flutter和原生之间的流式传输数据。

### BasicMessageChannel

BasicMessageChannel是一种双向通信机制，可以实现Flutter和原生之间的消息传递。Flutter可以通过BasicMessageChannel向原生发送消息，原生可以在消息通道上监听这些消息，并在消息到达时发送回复消息给Flutter。

## 怎么开发一个Flutter插件？

1. 创建插件：在Flutter项目中创建一个新的插件，可以使用Flutter CLI命令flutter create --template=plugin <插件名称>来创建一个基础的插件模板。
2. 编写插件代码：在插件模板的基础上，根据插件的功能需求编写对应的代码。通常包括Dart部分和原生部分两个方面。
3. 实现Dart部分：在Flutter项目中创建一个Dart类，该类用于向原生平台发送消息和接收来自原生平台的消息。在该类中实现Flutter插件的方法，包括调用原生方法和处理原生回调。
4. 实现原生部分：根据插件的功能需求，在原生平台上实现相应的代码。例如，对于Android平台，需要实现一个Java类，该类实现Flutter插件所需的方法和处理Flutter消息的回调方法。对于iOS平台，需要实现一个Objective-C或Swift类，该类也实现Flutter插件所需的方法和处理Flutter消息的回调方法。
5. 集成插件：在Flutter项目中引入该插件，并在pubspec.yaml文件中声明该插件的依赖。 使用flutter pub get命令来下载插件依赖。
6. 测试插件：在Flutter项目中使用插件的API进行测试，确保插件能够正确地在Flutter应用程序中工作。
7. 发布到Flutter仓库中。

## Flutter怎么做屏幕适配？

1. **Flutter ScreenUtil库**：Flutter ScreenUtil核心原理是等比例缩放，先获取实际设备与原型设备的尺寸比例，然后根据px进行适配。

2. **MediaQuery**：类似于CSS的媒体查询，可以使用MediaQuery.of(context)获取当前BuildContext下的MediaQueryData对象，该对象包含了设备屏幕的宽、高、像素密度等信息，可以通过该信息来实现屏幕适配。

3. **FractionallySizedBox**：FractionallySizedBox小部件的作用是让子部件根据其父部件的大小调整自身的大小。可以使用FractionallySizedBox将子Widget按照相对宽度和高度的比例进行缩放，从而实现屏幕适配。

4. **AspectRatio**：和FractionallySizedBox小部件类似，可以使用AspectRatio小部件来设置子Widget的宽高比例，从而实现屏幕适配。

## Flutter怎么做性能优化？

1. 使用检测工具Flutter Inspector来定位性能问题。
2. 包体积优化：
  - 移除不必要的依赖项，对于重复的或者没有用到的三方库，及时移除。
  - 减少图像和资源文件大小：使用高压缩率的图像格式，如WebP、JPEG XR等，可以有效地减少图像文件的大小。另外，可以将应用程序中的资源文件打包为.zip文件，并使用Flutter框架提供的AssetBundle来加载资源文件。
  - 按需加载：将应用程序中的部分代码拆分成较小的模块，并在需要时动态加载，以减少应用程序包的大小。Flutter框架提供了Code Splitting功能来支持按需加载。
  - 使用AOT编译：使用AOT编译模式可以将Dart代码编译成本地机器代码，并减少应用程序包的大小。
  - 使用`flutter build apk --split-per-abi`构建单ABI架构的包。
3. 启动优化：
  - 代码分离：将大型应用程序拆分成多个小模块，使用代码分离来延迟加载这些模块，可以减少应用程序的启动时间，提高性能。
  - 减少包体积也可以提升启动速度。
  - 体验优化，给应用添加一个漂亮的Splash启动页，可以减少用户等待的焦虑。
4. 布局优化：减少Widget的嵌套：Widget的嵌套层级越深，渲染所需的时间越长，因此尽可能减少Widget的嵌套层级，可以有效提高应用的性能。
5. 列表优化：使用ListView.builder或GridView.builder：在构建长列表或网格时，使用ListView.builder或GridView.builder等构建器可以避免一次性渲染所有列表项或网格项，从而提高性能。
6. 内存优化：
  - 避免内存泄漏：尽量避免使用全局变量、在不需要的时候及时释放资源、避免使用循环引用等。
  - 优化UI布局：使用简单的UI布局和尽量减少层级嵌套可以减少Flutter应用程序的内存使用。尽量避免使用动态的布局，如Wrap、Flow等。
  - 避免重复创建对象：可以使用对象池来避免重复创建对象。
  - 减少图片大小：将应用程序中的图片文件压缩，可以减少应用程序的内存使用。Flutter框架提供了ImageProvider和ImageCache等工具来帮助管理图片资源。
7. 异步加载：在加载大量数据时，使用异步加载可以避免阻塞UI线程，提高应用程序的性能。