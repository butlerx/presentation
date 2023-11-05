const { name, homepage, description, author } = require('../../package.json');

module.exports = {
  title: name,
  url: homepage,
  language: 'en',
  description,
  author,
};
