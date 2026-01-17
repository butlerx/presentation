import markdownIt from 'markdown-it';
import { EleventyHtmlBasePlugin } from '@11ty/eleventy';
import pluginBundle from '@11ty/eleventy-plugin-bundle';
import pluginReveal from './eleventy.config.reveal.mjs';
import pluginImages from './eleventy.config.images.mjs';

const md = new markdownIt({ html: true });

export default function (config) {
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
}
