import './rsi.css';
import './dna-background.css';
import type { Metadata } from 'next';
import { SiteFrame } from '@/components/rsi/site-frame';
import { siteOwner } from '@/lib/site';
export const metadata: Metadata = {
  title: 'RSI 研究库 · 递归自我改进论文',
  description: '精选 AI 递归自我改进与相关机制研究，按七个研究方向分类，提供 Research problem、Insight、Observation、Method、结果与展望，附原文来源及证据边界。',
  authors: [{ name: siteOwner.name, url: 'https://github.com/ZZZriven' }],
  creator: siteOwner.name,
  alternates: { canonical: '/rsi/' },
  icons: { icon: '/rsi-icon.svg' },
};
export default function RsiLayout({children}: {children: React.ReactNode}) {
  return <SiteFrame>{children}</SiteFrame>;
}
