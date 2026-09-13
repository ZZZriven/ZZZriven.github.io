/* oxlint-disable nextjs/no-html-link-for-pages -- Native links keep exported GitHub Pages routes independent of client routing. */
'use client';
import { useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { EvolutionBackground } from '@/components/rsi/evolution-background';
import { siteOwner } from '@/lib/site';
import { papers } from '@/lib/papers';
import arxivFeed from '@/content/arxiv-feed.json';

export function SiteFrame({children}: {children: React.ReactNode}) {
  const [about, setAbout] = useState(false);
  return <div className="rsi-site">
    <EvolutionBackground/>
    <a className="skip-link" href="#main">跳到正文</a>
    <header className="rsi-header">
      <a className="rsi-brand" href="/rsi/" aria-label="RSI Paper 首页"><span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 28 32" fill="none"><path d="M5 2c0 9 18 9 18 18 0 5-5 9-9 10M23 2c0 9-18 9-18 18 0 5 5 9 9 10M7 7h14M6 22h16M9 27h10" stroke="currentColor" strokeWidth="1.5"/></svg></span><strong>RSI <span>Paper</span></strong></a>
      <nav className="rsi-nav" aria-label="站点导航"><a href="/rsi/#library">Papers</a><a href="/rsi/#arxiv-feed">arXiv Feed</a><a href="/rsi/#methodology">Methodology</a><a href="/rsi/#resources">Reading Paths</a><button onClick={() => setAbout(true)}>关于</button><a href="/" className="personal-home-link">个人主页 <ArrowUpRight size={14}/></a></nav>
    </header>
    {children}
    <footer className="rsi-footer"><div><span className="footer-wordmark">RSI Paper</span><p>Read. Reflect. Evolve.</p></div><div className="rsi-credit"><span>由 <a href="https://github.com/BORAN002">{siteOwner.name}</a> 创建与维护</span><a href={'mailto:' + siteOwner.email}>{siteOwner.email}</a><a href="https://github.com/BORAN002/boran002.github.io">网站源码 <ArrowUpRight size={13}/></a></div></footer>
    <Dialog open={about} onOpenChange={setAbout}><DialogContent className="rsi-dialog" showCloseButton={false}>
      <DialogClose className="dialog-close" aria-label="关闭关于本站"><X size={20}/></DialogClose>
      <p className="overline">ABOUT RSI PAPER</p>
      <DialogTitle className="dialog-title">关于 RSI Paper</DialogTitle>
      <DialogDescription>聚焦 Recursive Self-Improvement、Self-Evolving Agents 及相关机制，以中文解析连接英文原论文。</DialogDescription>
      <div className="about-sections"><section><h3>Research Scope</h3><p>关注 Agent code、model weights、curriculum、feedback 与 memory 的改进。收录相关研究，不代表所有 self-feedback 方法都已实现 Recursive Self-Improvement。</p></section><section><h3>Notes &amp; Evidence</h3><p>每篇论文围绕 12 个问题展开，从 Research Problem、Idea Reconstruction 和 Method，读到 Assumption、Counterexample 与 Follow-up。段落分别标为 Paper Claim、Prior Work、Inference、Hypothesis，附原始来源与核验范围。</p></section><section><h3>Daily Discovery</h3><p>当前有 {papers.length} 篇精选论文解析。每日发现的相关论文进入 arXiv Feed，附原始 abstract 与 provisional classification；标为 Awaiting Analysis 的条目尚未完成逐篇解析。{arxivFeed.status === 'ok' && arxivFeed.updatedAt ? <>最近一次成功抓取：<time dateTime={arxivFeed.updatedAt}>{new Date(arxivFeed.updatedAt).toLocaleString('zh-CN', {timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false})}</time>（UTC+8）。</> : <>首次成功抓取后将在页面显示更新时间。</>}检索与分类有覆盖边界，这份阅读目录不代表全部最新研究。</p></section><section><h3>创建与联系</h3><p>{siteOwner.name}<br/><a href={'mailto:' + siteOwner.email}>{siteOwner.email}</a></p></section></div>
    </DialogContent></Dialog>
  </div>;
}
