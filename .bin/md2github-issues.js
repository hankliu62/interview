const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { createIssue, getIssuesTitleSet, getLabelsNameSet } = require('./issues');

async function run() {
  const mdDir = path.join(process.cwd(), 'markdown');

  const arguments = process.argv.splice(2);

  let type = arguments[0];
  let apiOptions;

  // 源文件名
  let mdFile = path.join(mdDir, 'interview-mini.md');
  if (type) {
    const labelSet = await getLabelsNameSet();
    if (labelSet.has(type)) {
      mdFile = path.join(mdDir, `interview-${type}.md`);
      apiOptions = { labels: ['interview questions', type].filter(Boolean) }
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

    const titleSet = getIssuesTitleSet(apiOptions);

    if (questions.length) {
      let index = 0;
      async function loopCreateIssue() {
        if (index === questions.length) {
          return;
        }

        if ((await titleSet).has(questions[index].title)) {
          index ++;
          loopCreateIssue();
          return;
        }

        const res = await createIssue(
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
