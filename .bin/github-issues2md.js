const fs = require('fs');
const path = require('path');
const { fetchAllIssues } = require('./libs/issues');
const { GithubRepoBlog } = require('./constant');

const mdDir = path.join(process.cwd(), 'markdown');

const Orders = {
  'all': -1,
  'javascript': 0,
  'html': 1,
  'css': 2,
  'react': 3,
  'vue': 4,
  'webpack': 5,
  'typescript': 6,
  'engine': 7,
  'algorithm': 8,
  'node': 9,
  'mixture': 10,
  'project': 11,
  'handwritten': 12,
  'visualization': 13,
}

/**
 * 生产MD文件
 */
const generateMd = async () => {
  const issues = await fetchAllIssues(GithubRepoBlog);

  const questions = [];

  const sortedIssues = issues.sort((pre, next) => {
    const preLabel = (pre.labels.filter((item) => item.name !== 'interview questions')[0] || {}).name || 'all';
    const nextLabel = (next.labels.filter((item) => item.name !== 'interview questions')[0] || {}).name || 'all';
    return Orders[preLabel] - Orders[nextLabel]
  })

  for (const item of sortedIssues) {
    questions.push([`## ${item.title}`, (item.body||'').trim()].filter(Boolean).join('\r\n\r\n'));
    // questions.push([`## ${item.title}`].filter(Boolean).join('\r\n\r\n'))
  }

  // console.log(questions);

  const content = questions.join('\r\n\r\n');
  const filePath = path.join(mdDir, 'interview-last.md');

  // 调用writeFile函数进行文件写入操作
  fs.writeFile(filePath, content, (err) => {
    if (err) throw err; // 若发生错误则抛出异常
    console.log(`成功地将数据写入${filePath}文件！`);
  });
}

generateMd();
