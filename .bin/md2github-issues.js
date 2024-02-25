const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { createIssue, getIssuesTitleSet } = require('./libs/issues');
const { getLabelsNameSet } = require('./libs/labels');
const { GithubRepoBlog, GithubRepoInterview } = require('./constant');

async function run() {
  const mdDir = path.join(process.cwd(), 'docs');

  const arguments = process.argv.splice(2);

  let type = arguments[0];
  let apiOptions;

  // 源文件名
  let mdFile = path.join(mdDir, 'interview-mini.md');
  if (type) {
    const labelSet = await getLabelsNameSet(GithubRepoInterview);
    if (labelSet.has(type)) {
      mdFile = path.join(mdDir, `interview-${type}.md`);
      apiOptions = { labels: [type].filter(Boolean) }
    } else {
      label = undefined;
    }
  }

  console.log(type, apiOptions);

  const readStream = fs.createReadStream(mdFile);
  const rl = readline.createInterface({
    input: readStream,
    output: process.stdout,
    terminal: false
  });

  // 问题列表
  const questions = [];
  // 问题
  let title = '';
  // 答案
  let answer = [];
  rl.on('line', (line) => {
    // 问题开头
    if (line.indexOf('## ') === 0) {
      if (title) {
        questions.push({ title, answer: answer.join('\r\n') });
      }
      answer = [];
      title = line.replace("## ", '').trim();
    } else {
      answer.push(line);
    }
  });

  rl.on('close', async () => {
    title && questions.push({ title, answer: answer.join('\r\n') });
    console.log('文件读取完毕');
    // console.log(questions);

    const titleSet = await getIssuesTitleSet(GithubRepoInterview, apiOptions);

    if (questions.length) {
      let index = 0;
      async function loopCreateIssue() {
        if (index === questions.length) {
          return;
        }

        if (titleSet.has(questions[index].title)) {
          index ++;
          loopCreateIssue();
          return;
        }

        const res = await createIssue(
          GithubRepoInterview,
          questions[index].title,
          (questions[index].answer || '').trim(),
          apiOptions,
        );
        console.log(index, res.status, questions[index].title);
        index ++;
        setTimeout(loopCreateIssue, 1000);
      }

      loopCreateIssue();
    }
  });
}

run();
