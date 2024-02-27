/**
 * 将`hankliu62.github.com`仓库中的Issues迁移到`interview`仓库下
 */

const { fetchAllIssues, getIssuesTitleSet, createIssue } = require('./libs/issues');
const { GithubRepoBlog, GithubRepoInterview } = require('./constant');

async function run() {
  const issues = await fetchAllIssues(GithubRepoBlog);

  const titleSet = await getIssuesTitleSet(GithubRepoInterview, { labels: [] });

  if (issues.length) {
    let index = 0;
    async function loopCreateIssue() {
      if (index === issues.length) {
        return;
      }

      const issue = issues[index]
      if (titleSet.has(issue.title)) {
        index ++;
        loopCreateIssue();
        return;
      }

      const labelNames = (issue.labels || []).map((label) => label.name).filter((item) => item !== 'interview questions');
      const answer = (issue.body || '').trim();
      if (!answer) {
        labelNames.push('no answer');
      }
      const res = await createIssue(
        GithubRepoInterview,
        issue.title,
        answer,
        { labels: Array.from(new Set(labelNames)) },
      );
      console.log(index, res.status, issue.title);
      index ++;
      setTimeout(loopCreateIssue, 1000);
    }

    loopCreateIssue();
  }
}

run();