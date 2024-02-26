/**
 * 将`hankliu62.github.com`仓库中的标签迁移到`interview`仓库下
 */

const { fetchLabels, getLabelsNameSet, createLabel } = require('./libs/labels');
const { GithubRepoBlog, GithubRepoInterview } = require('./constant');

async function run() {
  const fetchedLabels = await fetchLabels(GithubRepoBlog);

  const labels = fetchedLabels.filter((item) =>
    /^面试题-(.*)相关$|^面试题-(.*)$/.test(item.description || "")
  )
  .map((item) => ({
    ...item,
    description: item.description.replace(
      /^面试题-(.*)$/,
      "$1"
    ),
  }))

  const labelSet = await getLabelsNameSet(GithubRepoInterview);

  if (labels.length) {
    let index = 0;
    async function loopCreateLabel() {
      if (index === labels.length) {
        return;
      }

      if (labelSet.has(labels[index].name)) {
        index ++;
        loopCreateLabel();
        return;
      }

      const res = await createLabel(
        GithubRepoInterview,
        labels[index].name,
        labels[index].color,
        (labels[index].description || '').trim(),
      );
      console.log(index, res.status, labels[index].name);
      index ++;
      setTimeout(loopCreateLabel, 1000);
    }

    loopCreateLabel();
  }
}

run();