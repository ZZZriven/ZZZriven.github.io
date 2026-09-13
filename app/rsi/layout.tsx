import './rsi.css';
import './dna-background.css';
import type { Metadata } from 'next';
import { SiteFrame } from '@/components/rsi/site-frame';
import { siteOwner } from '@/lib/site';
export const metadata: Metadata = {
  title: 'RSI Paper · Recursive Self-Improvement & Self-Evolving Agents',
  description: '精选 Recursive Self-Improvement 与 Self-Evolving Agents 研究，按七个研究方向分类，提供 Research Problem、Insight、Observation、Method、Results、Limitations 与 Outlook，附 arXiv 原文与每日发现。',
  authors: [{ name: siteOwner.name, url: 'https://github.com/BORAN002' }],
  creator: siteOwner.name,
  alternates: { canonical: '/rsi/' },
  icons: { icon: '/rsi-icon.svg' },
};
export default function RsiLayout({children}: {children: React.ReactNode}) {
  return <SiteFrame>{children}</SiteFrame>;
}
