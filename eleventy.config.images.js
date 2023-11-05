const path = require('node:path');
const eleventyImage = require('@11ty/eleventy-img');

module.exports = (config) => {
  // Eleventy Image shortcode
  // https://www.11ty.dev/docs/plugins/image/
  config.addAsyncShortcode('image', async function imageShortcode(src, alt, widths, sizes) {
    // Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
    // Warning: Avif can be resource-intensive so take care!
    let formats = ['avif', 'webp', 'auto'];
    let file = relativeToInputPath(this.page.inputPath, src);
    let metadata = await eleventyImage(file, {
      widths: widths || ['auto'],
      formats,
      outputDir: path.join(config.dir.output, 'img'), // Advanced usage note: `config.dir` works here because we’re using addPlugin.
    });

    // TODO loading=eager and fetchpriority=high
    let imageAttributes = {
      alt,
      sizes,
      loading: 'lazy',
      decoding: 'async',
    };
    return eleventyImage.generateHTML(metadata, imageAttributes);
  });
};

function relativeToInputPath(inputPath, relativeFilePath) {
  let split = inputPath.split('/');
  split.pop();

  return path.resolve(split.join(path.sep), relativeFilePath);
}
