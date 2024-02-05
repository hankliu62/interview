/** @type {import('next').NextConfig} */
// 需要设置options，只移除@uiw库中的css等文件，不然nomaco-editor无样式
import NextRemoveImports from "next-remove-imports";
const removeImports = NextRemoveImports({
  test: /node_modules\/@uiw([\S\s]*?)\.(tsx|ts|js|mjs|jsx)$/,
  matchImports: "\\.(less|css|scss|sass|styl)$",
});

const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    ROUTE_PREFIX: "",
  },
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


// 是否通过github actions部署
const isGithubActions = process.env.GITHUB_ACTIONS || false;

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, "");
  // 用于为静态资源（如图像、样式表、JavaScript 文件等）设置 URL 前缀
  // 这在将应用部署到自定义域名或 CDN 上时特别有用，因为它允许您将静态资源存储在不同的位置
  nextConfig.assetPrefix = `/${repo}/`;
  // 用于为应用设置基础路径
  // 这在将应用部署到子目录下时特别有用，因为它允许您指定应用所在的目录
  nextConfig.basePath = `/${repo}`;
  nextConfig.env.ROUTE_PREFIX = `/${repo}`;

  console.log("next config:", nextConfig);
}

export default removeImports(nextConfig);
