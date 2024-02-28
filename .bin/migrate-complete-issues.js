/**
 * 将`hankliu62.github.com`仓库中的面试题相关的Issues全部状态改成closed
 */

const { fetchAllIssues, closeIssue } = require('./libs/issues');
const { GithubRepoBlog } = require('./constant');

async function run() {
  const issues = await fetchAllIssues(GithubRepoBlog);

  if (issues.length) {
    let index = 0;
    async function loopCreateIssue() {
      if (index === issues.length) {
        return;
      }

      const res = await closeIssue(
        GithubRepoBlog,
        issues[index].number
      );
      console.log(index, res.status, issues[index].title);
      index ++;
      setTimeout(loopCreateIssue, 500);
    }

    loopCreateIssue();
  }
}

run();