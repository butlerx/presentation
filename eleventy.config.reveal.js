const path = require('node:path');
const markdownItRevealjs = require('markdown-it-revealjs');
const prettier = require('prettier');

module.exports = (config) => {
  // This enable all the dependency libraries inside the `assets` folder
  config.addPassthroughCopy({
    'node_modules/reveal.js/dist': 'assets/reveal/',
    'node_modules/reveal.js/plugin': 'assets/reveal/plugin',
  });

  config.amendLibrary('md', (mdLib) => {
    mdLib.use(markdownItRevealjs);
  });

  // Prettifies the output html so the indentations are correct
  config.addTransform('prettier', function (content, outputPath) {
    const extname = path.extname(outputPath);
    switch (extname) {
      case '.html':
        // Strip leading period from extension and use as the Prettier parser.
        const parser = extname.replace(/^./, '');
        return prettier.format(content, { parser });

      default:
        return content;
    }
  });
};
