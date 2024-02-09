## TS有什么优缺点？为什么要用TS？

### TS 的优点：

- 可以减少低级的语法错误。
- 规范团队代码，对大型项目来说规范很重要。
- 智能提示，定义类型能让编辑器更好的自动提示，提升编码效率。

### TS 的缺点：

- 学习成本高。
- 开发成本高，又要做业务又要编写类型文件，有时候还得解决奇奇怪怪的报错。

### 适用场景：

- 大型项目和团队开发。
- 库和框架开发。
- 对于一些重要的逻辑或者代码，可以使用TS来增强其可靠性。

## 什么是泛型,有什么作用？

TS泛型简单来说就是类型参数，在定义某些函数、接口和类时，不写死类型，而是改用类型参数的形式，让类型更加灵活。

举个简单的例子，我们定义一个数据响应体的接口：

``` typescript
interface IResponseData<T>{
    code: number;
    message?: string;
    data: T;
}
```

其中data的类型并没有写死，而是可以在我们使用的时候传入：

``` typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// 使用时传入User类型
const response: IResponseData<User> = {
  code: 200,
  message: "Success",
  data: {
    id: 1,
    name: "xiaoming",
    email: "xxx@qq.com"
  }
};
```

## 类型别名type和接口interface有什么区别？

1. 类型别名不能被继承或者实现，接口可以被继承或者实现。
2. 类型别名可以定义任何类型，包括联合类型、交叉类型、字面量类型、原始类型等。接口只能定义对象类型，包括属性、方法、索引等。
3. 类型别名通常用于为复杂类型创建别名，以方便在代码中使用。接口通常用于定义某个实体的结构，以及实现该结构的对象或类。

总结一下，如果你需要定义一个对象类型，或者需要使用继承和实现的特性，那么应该使用接口；如果你需要定义任意类型的别名，或者需要定义联合类型和交叉类型等复杂类型，那么应该使用类型别名。

## 什么是装饰器？

装饰器的作用，简单来说就是代码复用，和Java里的注解以及Rust里的属性宏类似。

把通用的代码封装成装饰器，然后在使用的时候就可以将`@xxx`添加在方法或者类上，方法和类就得到了加强，特别简洁优雅。

例如mobx里的`@observable`以及NestJS里的`@Controller`。

举个简单的自定义装饰器例子，我们来实现一个自动打印函数参数以及返回值的装饰器。

首先来定义装饰器：

``` Typescript
// target表示装饰的目标对象
// propertyKey表示装饰的属性或方法名
// descriptor表示属性或方法的描述符
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`调用 ${propertyKey}，参数为: ${JSON.stringify(args)}`);
    const result = originalMethod.apply(this, args);
    console.log(`方法 ${propertyKey} 返回值为: ${JSON.stringify(result)}`);
    return result;
  };

  return descriptor;
}
```

然后使用一下这个装饰器：

``` typescript
class Test {
  @log
  add(a: number, b: number) {
    return a + b;
  }
}

const test = new Test();
console.log(test.add(2, 3)); // 会打印出参数2,3和返回值5
```

## 什么是类型体操，有哪些应用？

TS类型体操指的是用各种技巧和骚操作来创建复杂类型。

类型体操一般在业务项目里出现的少，在三方库里出现的多，比如Vue3源码里面就有很多复杂的类型体操运算。

关于类型体操，褒贬不一，有人认为是秀操作，实际作用不大，也有人认为很高级。

我个人是不太倾向在前端项目里执着于玩类型体操的，但是一些常见的TS技巧是需要学习的，比如类型别名、交叉类型和联合类型、条件类型、工具类型、泛型，在处理复杂类型运算的时候，就很有用。

## any用的多吗，有什么弊端？

使用any类型的主要目的是在不清楚变量类型的情况下避免编译错误，但是，频繁地使用any类型那就等于白白浪费了TS的类型检查能力。

正确的做法是尽可能避免使用any类型，尽可能地使用明确的类型，这样可以提高代码的可读性和可维护性，并且可以减少潜在的运行时错误。

但是有时候时间紧任务重又不得不用，所以一句话总结就是，尽量不用，不到万不得已不轻易用any。

## 你知道哪些工具类型，怎么用？

工具类型主要用于处理和转换已有类型，它们不是实际的类型，而是用来处理类型的工具。简单来说，工具类型可以认为是TS类型的工具函数，把原有类型当参数来处理。

举一个简单的Partial工具类型应用的例子：

``` typescript
// 已有类型User
interface User {
  name: string;
  age: number;
}

// 新类型PartialUser，使用Partial将属性都变成可选
type PartialUser = Partial<User>; // { name?: string; age?: number; }
```

常用工具类型有：

- **Partial<T>**：将类型 T 的所有属性变为可选属性。
- **Required<T>**：将类型 T 的所有属性变为必选属性。
- **Readonly<T>**：将类型 T 的所有属性变为只读属性。
- **Record<K, T>**：创建一个类型，其中属性名为类型 K 中的值，属性值为类型 T 中的值。
- **Pick<T, K>**：从类型 T 中选择属性名为类型 K 中的属性，创建一个新类型。
- **Omit<T, K>**：从类型 T 中排除属性名为类型 K 中的属性，创建一个新类型。
- **Exclude<T, U>**：从类型 T 中排除类型 U 中的所有属性。
- **Extract<T, U>**：从类型 T 中提取类型 U 中存在的所有属性。
- **NonNullable<T>**：从类型 T 中移除 null 和 undefined。
- **ReturnType<T>**：获取函数类型 T 的返回值类型。

## TS里怎么处理第三方库类型，怎么给第三方库编写类型文件？

TS社区维护了一个名为DefinitelyTyped的项目，提供了大量的第三方库的类型定义文件，大多数三方库类型文件都可以直接在这里面下载。

但是如果第三方库没有提供类型定义文件时，我们可以通过手动编写类型文件的方式，为第三方库添加类型支持。

给三方库编写类型的文件步骤如下：

1. 创建d.ts文件：在项目中创建一个新的d.ts文件，文件名可以与库名相同，例如`lodash.d.ts`。

2. 定义模块：使用`declare module`语句定义模块名，模块名应与库的导出模块名一致。例如，对于lodash库，可以这样定义模块：

``` Typescript
declare module 'lodash' {
  // 在此处添加类型定义
}
```

3. 添加类型定义：在模块内部添加对应的类型定义，例如函数、变量、类等。根据需要，可以使用 interface、type、class 等关键字定义不同类型的接口。

4. 导出类型：使用 export 关键字导出需要公开的类型。例如，对于以下的 utils 函数，可以这样定义：

``` typescript
declare module 'lodash' {
  function utils(...args: any[]): any;
  export { utils };
}
```

5. 使用类型文件：在需要使用第三方库的地方，通过import语句引入类型定义即可：

``` typescript
import { utils } from 'lodash';
```

## React项目怎么使用TS？Vue项目怎么使用TS？

### React：
React脚手架自带TS模板，新建项目的时候，带上参数即可。

React项目里需要考虑类型的地方主要有：

- 定义props和state的类型。
- 事件处理函数中事件对象的类型，尽量不要用any。
- 对三方库的封装要考虑类型。
- 对于Hooks的参数和返回值的约束类型。
- 数据接口需要定义类型。

### Vue：

- Vue2项目可以通过添加 class-component 和 vue-property-decorator 库来使用TS。

- Vue3对TS支持更好，可以通过vue-cli或者vite来直接启动TS模板的脚手架。