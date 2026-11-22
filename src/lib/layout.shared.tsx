import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Wordmark } from '@/components/Logo';

/** Header and links shared by the docs layouts. */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-baseline gap-2">
          <Wordmark className="text-xl" />
          <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-on-surface-variant">Docs</span>
        </span>
      ),
      url: '/docs',
    },
    // The site has one light theme.
    themeSwitch: { enabled: false },
    links: [
      { text: 'Home', url: '/' },
      { text: 'Open Kakaw', url: '/chat' },
    ],
  };
}
