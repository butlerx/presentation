const markdownIt = require('markdown-it');
const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');
const pluginBundle = require('@11ty/eleventy-plugin-bundle');
const pluginReveal = require('./eleventy.config.reveal.js');
const pluginImages = require('./eleventy.config.images.js');

const md = new markdownIt({ html: true });
const imageTypes = '';

module.exports = (config) => {
  config.addWatchTarget('content/**/*.{svg,webp,png,jpeg,jpg}');
  config.addPassthroughCopy('content/img');
  config.addPlugin(pluginReveal);
  config.addPlugin(pluginImages);
  config.addPlugin(EleventyHtmlBasePlugin);
  config.addPlugin(pluginBundle);
  config.setServerPassthroughCopyBehavior('passthrough');

  config.addFilter('markdown', (content) => md.render(content));

  return {
    templateFormats: ['md', 'njk', 'html'],
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    pathPrefix: '/presentation/',
    dir: {
      input: 'content', // default: "."
      output: '_site',
    },
  };
};
