const path = require('node:path');
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
  config.addTransform('prettier', (content, outputPath) => {
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

const isVerticalSeparator = (token) => token.type === 'inline' && token.content === '===';
const isHorizontalSeparator = (token) => token.type === 'hr' && token.markup === '---';
const NOTES_SEPARATOR = new RegExp(/^s*notes?:/, 'i');
const isNotesSeparator = (token) =>
  Boolean(token.type === 'inline' && token.content.match(NOTES_SEPARATOR));
const isSep = (token) => isHorizontalSeparator(token) || isVerticalSeparator(token);

const renderOpening = (tokens, idx, options, env, slf) =>
  `<${tokens[idx].tag}${slf.renderAttrs(tokens[idx])}>`;

const renderClosing = (tokens, idx, options, env, slf) => `</${tokens[idx].tag}>`;

function nextDivider(tokens, start) {
  for (let i = start; i < tokens.length; i++) {
    if (isSep(tokens[i]) || isNotesSeparator(tokens[i])) {
      return i;
    }
  }
}

function previousSlideOpen(tokens, before) {
  for (let i = before - 1; i >= 0; i--) {
    if (tokens[i].type === 'slide_open') {
      return i;
    }
  }
  return -1;
}

function presentationOpen(state) {
  const token = new state.Token('pres_open', 'section', 1);
  token.block = true;
  token.attrs = [['class', 'reveal']];
  return token;
}

const presentationClose = (state) => new state.Token('pres_close', 'section', -1);

function slidesOpen(state) {
  const token = new state.Token('slides_open', 'div', 1);
  token.block = true;
  token.attrs = [['class', 'slides']];
  return token;
}

const slidesClose = (state) => new state.Token('slides_close', 'div', -1);

let openSlides = 0;

function slideOpen(state) {
  openSlides++;
  return new state.Token('slide_open', 'section', 1);
}

function slideClose(state) {
  openSlides--;
  return new state.Token('slide_close', 'section', -1);
}

function notesOpen(state) {
  const token = new state.Token('notes_open', 'aside', 1);
  token.block = true;
  token.attrs = [['class', 'notes']];
  return token;
}

const notesClose = (state) => new state.Token('notes_close', 'aside', -1);

function markdownItRevealjs(md, options) {
  md.renderer.rules.pres_open = renderOpening;
  md.renderer.rules.pres_close = renderClosing;
  md.renderer.rules.slide_open = renderOpening;
  md.renderer.rules.slide_close = renderClosing;
  md.renderer.rules.notes_open = renderOpening;
  md.renderer.rules.notes_close = renderClosing;

  md.core.ruler.push('revealjs', (state) => {
    let openNotes = false;
    let divIdx = 0;
    while (true) {
      divIdx = nextDivider(state.tokens, divIdx);
      if (divIdx === undefined) {
        break;
      }
      const divider = state.tokens[divIdx];
      if (isSep(divider) && openSlides === 0) {
        state.tokens.unshift(slideOpen(state));
        divIdx++; // we added a token at the beginning, we need to update divIdx
      }
      const tags = [];
      if (isHorizontalSeparator(divider)) {
        if (openNotes) {
          tags.push(notesClose(state));
          openNotes = false;
        }
        while (openSlides > 0) {
          tags.push(slideClose(state));
        }
        tags.push(slideOpen(state));
        // because "---" is hijacked from plain markdown, it translates
        // to one token which we remove
        state.tokens.splice(divIdx, 1, ...tags);
      } else if (isVerticalSeparator(divider)) {
        if (openNotes) {
          tags.push(notesClose(state));
          openNotes = false;
        }
        // if it is a vertical separator, we need to wrap the current slide
        // in it's own section
        if (openSlides === 1) {
          const slideOpenIdx = previousSlideOpen(state.tokens, divIdx);
          state.tokens.splice(
            slideOpenIdx,
            1,
            state.tokens[slideOpenIdx], // reuse it to avoid increasing openSlides
            slideOpen(state),
          );
          divIdx++; // we added a token before the divider, we need to update divIdx
        }
        // if the current slide is already a vertical child, we need to close
        // it; this will be indicated by a nesting level of two:
        // <section horizontal-parent>
        //    <section current-vertical-child>
        //    <!-- this is where we are right now -->
        if (openSlides === 2) {
          tags.push(slideClose(state));
        }
        tags.push(slideOpen(state));
        // because this is a custom token, it is first wrapped by the processor
        // in a paragraph, so we need to replace para_open, sep, para_close
        state.tokens.splice(divIdx - 1, 3, ...tags);
      } else if (isNotesSeparator(divider)) {
        openNotes = true;
        tags.push(notesOpen(state));
        state.tokens.splice(divIdx - 1, 3, ...tags);
        divIdx++; // we added a token at the beginning, we need to update divIdx
      }
    }

    if (openNotes) {
      state.tokens.push(notesClose(state));
      openNotes = false;
    }
    while (openSlides > 0) {
      state.tokens.push(slideClose(state));
    }
    state.tokens.unshift(slidesOpen(state));
    state.tokens.unshift(presentationOpen(state));
    state.tokens.push(slidesClose(state));
    state.tokens.push(presentationClose(state));
  });
}
