const { nav, sidebar } = require('../../conf');

module.exports = {
  base: '/weblog/',
  title: 'askura',
  description: "askura's weblog",

  themeConfig: {
    nav,
    sidebar,
    lastUpdated: 'Last Updated',

    docsRepo: 'https://github.com/arkusa/askura',
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,
    editLinkText: '编辑此页面'
  },
  markdown: {
    lineNumbers: true
  }
};
