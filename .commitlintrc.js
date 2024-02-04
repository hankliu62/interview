/**
 * Level [0..2]: 0: 禁用该规则；1: 触发即警告； 2: 触发即错误。
 * Applicable always|never: never inverts the rule.
 * Value: value to use for this rule.
 */

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "update",
        "fix",
        "refactor",
        "optimize",
        "style",
        "docs",
        "chore",
      ],
    ],
    "type-case": [0],
    "type-empty": [0],
    "scope-empty": [2, "never"], // (scope)必须存在
    "scope-case": [2, "always", ["camel-case", "kebab-case", "pascal-case"]], // (scope)只能是数组中的集中类型[小驼峰，中划线，大驼峰]
    "subject-full-stop": [0, "never"],
    "subject-case": [0, "never"],
    "header-max-length": [2, "always", 120], // header最长120
  },
};
