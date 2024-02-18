/**
 * 将`interview`仓库中的Issues分类生成博客分钟文章迁移到`hankliu62.github.com`仓库下
 *
 * 注：
 *  - 只能生成Markdown文件，无法创建到`hankliu62.github.com`仓库中，建Issue的参数body长度有限制，不能超过65536个字符
 *  - 改成面试题目
 */
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs')
const { fetchAllIssues, createIssue, updateIssue, getIssuesTitleMap } = require('./libs/issues');
const { fetchLabels } = require('./libs/labels');
const { GithubRepoInterview, GithubRepoBlog } = require('./constant');

/**
 * 根据标签获取Issues，并生成文章
 * @param {*} label
 */
async function generateBlogByLabel(label, titleMap) {
  const mdDir = path.join(process.cwd(), 'markdown', 'interview');
  const issues = await fetchAllIssues(GithubRepoInterview, { labels: label.name });
  const title = `${label.description}的面试题`

  const labelNames = ['blog', 'interview', label.name]

  const questions = [
    `---`,
    `title: ${title}`,
    `date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
    `tag: [${labelNames.join(', ')}]`,
    `---`
  ];

  const titleQuestions = [...questions];

  for (const item of issues) {
    questions.push([`## ${item.title}`, (item.body||'').trim()].filter(Boolean).join('\r\n\r\n'));
    titleQuestions.push(`## ${item.title}`, `[答案详情](${item.html_url})`);
  }

  const filePath = path.join(mdDir, `interview-${label.name.replace(/\s+/g, '-')}.md`);

  // 调用writeFile函数进行文件写入操作
  fs.writeFile(filePath, questions.join('\r\n\r\n'), (err) => {
    if (err) throw err; // 若发生错误则抛出异常
    console.log(`成功地将数据写入${filePath}文件！`);
  });

  // 内容
  let content = questions.join('\r\n\r\n');
  // 建Issue的参数body长度有限制，不能超过65536个字符
  if (content.length >= 65536) {
    content = titleQuestions.join('\r\n\r\n');
  }
  // 存在更新Issue内容
  if (titleMap.has(title)) {
    const current = titleMap.get(title);
    // 存在，更新
    const res = await updateIssue(
      GithubRepoBlog,
      current.number,
      content,
      { labels: labelNames },
    );

    console.log('update', res.status, title);
  } else {
    // 不存在，新增
    const res = await createIssue(
      GithubRepoBlog,
      title,
      content,
      { labels: labelNames },
    );

    console.log('create', res.status, title);
  }
}

async function run() {
  const fetchedLabels = await fetchLabels(GithubRepoInterview);

  const titleMap = await getIssuesTitleMap(GithubRepoBlog, { labels: 'blog' });

  const labels = fetchedLabels.filter((item) => (item.name !== 'no answer'));

  if (labels.length) {
    let index = 0;
    async function loopGenerateBlog() {
      if (index === labels.length) {
        return;
      }

      await generateBlogByLabel(labels[index], titleMap);
      console.log(index, labels[index].name);
      index ++;
      setTimeout(loopGenerateBlog, 1000);
    }

    loopGenerateBlog();
  }
}

run();