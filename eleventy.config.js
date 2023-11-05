const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');
const pluginBundle = require('@11ty/eleventy-plugin-bundle');
const pluginReveal = require('./eleventy.config.reveal.js');
const pluginImages = require('./eleventy.config.images.js');

module.exports = (config) => {
  config.addPassthroughCopy({ './public/': '/' });
  config.addWatchTarget('content/**/*.{svg,webp,png,jpeg}');
  config.addPlugin(pluginReveal);
  config.addPlugin(pluginImages);
  config.addPlugin(EleventyHtmlBasePlugin);
  config.addPlugin(pluginBundle);
  config.setServerPassthroughCopyBehavior('passthrough');

  return {
    templateFormats: ['md', 'njk', 'html'],
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'content', // default: "."
      output: '_site',
    },
  };
};
