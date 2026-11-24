import { createRelativeLink } from 'fumadocs-ui/mdx';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/docs/mdx';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, techArticleSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';
import { source } from '@/lib/source';

const GITHUB_CONTENT = 'https://github.com/Kakaw-AI/frontend/blob/master/src/content/docs';

/** The Markdown twin of a page, served by the llms.mdx route through a rewrite. */
const markdownUrl = (url: string) => `${url}.md`;

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <JsonLd
        data={[
          techArticleSchema({ title: page.data.title, description: page.data.description ?? '', path: page.url }),
          breadcrumbSchema([
            { name: 'Docs', path: '/docs' },
            ...(page.url === '/docs' ? [] : [{ name: page.data.title, path: page.url }]),
          ]),
        ]}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      {/* For readers who work with an AI assistant: copy the page, or open it in one. */}
      <div className="flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl(page.url)} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl(page.url)}
          githubUrl={`${GITHUB_CONTENT}/${encodeURI(page.path)}`}
        />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const meta = pageMetadata({ title: page.data.title, description: page.data.description ?? '', path: page.url });
  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      // Agents reading the HTML find the Markdown here.
      types: { 'text/markdown': markdownUrl(page.url) },
    },
  };
}
