import { docsLlms } from '@/lib/source';

// Every docs page as Markdown in one file, for AI assistants.
export const revalidate = false;

export async function GET() {
  return (await docsLlms.serve('/llms-full.txt'))!;
}
