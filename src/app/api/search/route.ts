import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

// Docs search for the search dialog. Built from the pages at build time.
export const { GET } = createFromSource(source, {
  language: 'english',
});
