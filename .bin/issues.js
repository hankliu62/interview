const { Octokit } = require('octokit');

// const auth = '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';
const auth = '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';

/**
 * 根据分页获取数据
 *
 * @param {*} page
 * @returns
 */
async function fetchIssues(page, options = {}) {
  const octokit = new Octokit({
    auth: auth
  })

  const res = await octokit.request('GET /repos/hankliu62/hankliu62.github.com/issues', {
    owner: 'hankliu62',
    repo: 'hankliu62.github.com',
    labels: 'interview questions',
    per_page: 30,
    page: page || 1,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    },
    direction: 'asc',
    ...options,
  });


  // 请求成功
  if (res.status === 200) {
    return res.data;
  } else {
    throw res;
  }
}

/**
 * 获取所有问题
 * @returns
 */
async function fetchAllIssues(options = {}) {
  return new Promise((resolve, reject) => {
    // 问题列表
    const questions = [];
    let page = 1;
    async function loopFetchIssue() {
      const currentQuestions = await fetchIssues(page, options);
      if (currentQuestions.length) {
        for (const question of currentQuestions) {
          questions.push(question);
        }
        page ++;
        setTimeout(loopFetchIssue, 100);
      } else {
        resolve(questions);
      }
    }

    loopFetchIssue();
  });
}

/**
 * 根据获取所有的标签
 *
 * @param {*} page
 * @returns
 */
async function fetchLabels(page, options = {}) {
  const octokit = new Octokit({
    auth: auth
  })

  const res = await octokit.request('GET /repos/hankliu62/hankliu62.github.com/labels', {
    owner: 'hankliu62',
    repo: 'hankliu62.github.com',
    per_page: 100,
    page: page || 1,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    },
    direction: 'asc',
  });


  // 请求成功
  if (res.status === 200) {
    return res.data;
  } else {
    throw res;
  }
}

/**
 * 生成问题
 *
 * @param {*} title
 * @param {*} answer
 */
async function createIssue(title, answer, options = {}) {
  const octokit = new Octokit({
    auth: auth
  })

  const res = await octokit.request('POST /repos/hankliu62/hankliu62.github.com/issues', {
    owner: 'hankliu62',
    repo: 'hankliu62.github.com',
    title: title,
    body: answer,
    assignees: [
      'hankliu62'
    ],
    labels: [
      'interview questions'
    ],
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    },
    ...options,
  });

  return res;
}

/**
 * 获得所有问题的名称Set
 * @returns
 */
async function getIssuesTitleSet(options = {}) {
  const set = new Set()
  const issues = await fetchAllIssues(options);
  for (const issue of issues) {
    set.add(issue.title.trim());
  }

  return set;
}

/**
 * 获得所有标签的名称Set
 * @returns
 */
async function getLabelsNameSet() {
  const set = new Set()
  const issues = await fetchLabels(1);
  for (const issue of issues) {
    set.add(issue.name.trim());
  }

  return set;
}

module.exports = {
  fetchIssues,
  fetchAllIssues,
  createIssue,
  getIssuesTitleSet,
  fetchLabels,
  getLabelsNameSet,
}