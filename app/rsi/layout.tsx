import type { Metadata } from 'next';
import { SiteFrame } from '@/components/rsi/site-frame';
import { siteOwner } from '@/lib/site';
export const metadata: Metadata = {
  title: 'RSI 观察站 · 递归自我改进论文',
  description: '精选 AI 递归自我改进与相关机制研究，提供中文论文速读、研究分类、原文链接和证据边界。',
  authors: [{ name: siteOwner.name, url: 'https://github.com/ZZZriven' }],
  creator: siteOwner.name,
  alternates: { canonical: '/rsi/' },
  icons: { icon: '/rsi-icon.svg' },
};
export default function RsiLayout({children}: {children: React.ReactNode}) {
  return <SiteFrame>{children}</SiteFrame>;
}
