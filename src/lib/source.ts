import { llms, loader } from 'fumadocs-core/source';
import { defineDocs } from 'fumadocs-mdx/macro';

/**
 * The docs content. Pages live in src/content/docs as MDX; folder order and
 * titles come from each folder's meta.json.
 */
const docs = defineDocs({
  dir: 'src/content/docs',
  docs: {
    // Keeps each page's Markdown so it can be served to AI agents as-is.
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

/**
 * The docs for AI agents: /llms.txt, /llms-full.txt, a .md twin of every page
 * and an llms-full.txt per section.
 */
export const docsLlms = llms(source, {
  // Every folder (Your data, Models, Chat, Reference) gets its own
  // llms-full.txt, e.g. /docs/data/llms-full.txt, so agents can read one part.
  section: () => true,
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${page.data.description ? `> ${page.data.description}\n\n` : ''}${await page.data.getText('processed')}`,
});
