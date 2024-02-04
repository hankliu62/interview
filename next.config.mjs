/** @type {import('next').NextConfig} */
// 需要设置options，只移除@uiw库中的css等文件，不然nomaco-editor无样式
import NextRemoveImports from "next-remove-imports";
const removeImports = NextRemoveImports({
  test: /node_modules\/@uiw([\S\s]*?)\.(tsx|ts|js|mjs|jsx)$/,
  matchImports: "\\.(less|css|scss|sass|styl)$",
});

const nextConfig = {
  webpack: (cfg) => {
    cfg.module.rules.push(
        {
            test: /\.md$/,
            loader: 'frontmatter-markdown-loader',
            options: { mode: ['react-component'] }
        }
    )
    return cfg
  }
};


export default removeImports(nextConfig);
