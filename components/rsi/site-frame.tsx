/* oxlint-disable nextjs/no-html-link-for-pages -- Native links keep exported GitHub Pages routes independent of client routing. */
'use client';
import { useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { EvolutionBackground } from '@/components/rsi/evolution-background';
import { siteOwner } from '@/lib/site';
import { papers } from '@/lib/papers';

export function SiteFrame({children}: {children: React.ReactNode}) {
  const [about, setAbout] = useState(false);
  return <div className="rsi-site">
    <EvolutionBackground/>
    <a className="skip-link" href="#main">跳到正文</a>
    <header className="rsi-header">
      <a className="rsi-brand" href="/rsi/" aria-label="RSI Paper 首页"><span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 28 32" fill="none"><path d="M5 2c0 9 18 9 18 18 0 5-5 9-9 10M23 2c0 9-18 9-18 18 0 5 5 9 9 10M7 7h14M6 22h16M9 27h10" stroke="currentColor" strokeWidth="1.5"/></svg></span><strong>RSI <span>Paper</span></strong></a>
      <nav className="rsi-nav" aria-label="站点导航"><a href="/rsi/#library">论文</a><a href="/rsi/#methodology">分类方法</a><a href="/rsi/#resources">阅读路径</a><button onClick={() => setAbout(true)}>关于</button><a href="/" className="personal-home-link">个人主页 <ArrowUpRight size={14}/></a></nav>
    </header>
    {children}
    <footer className="rsi-footer"><div><span className="footer-wordmark">RSI Paper</span><p>Read. Reflect. Evolve.</p></div><div className="rsi-credit"><span>由 <a href="https://github.com/ZZZriven">{siteOwner.name}</a> 创建与维护</span><a href={'mailto:' + siteOwner.email}>{siteOwner.email}</a><a href="https://github.com/ZZZriven/ZZZriven.github.io">网站源码 <ArrowUpRight size={13}/></a></div></footer>
    <Dialog open={about} onOpenChange={setAbout}><DialogContent className="rsi-dialog" showCloseButton={false}>
      <DialogClose className="dialog-close" aria-label="关闭关于本站"><X size={20}/></DialogClose>
      <p className="overline">ABOUT RSI PAPER</p>
      <DialogTitle className="dialog-title">关于 RSI Paper</DialogTitle>
      <DialogDescription>一个聚焦 AI 递归自我改进及相关机制的中文论文阅读站。</DialogDescription>
      <div className="about-sections"><section><h3>收录范围</h3><p>关注智能体代码、模型权重、课程、反馈与记忆的改进。收录相关研究，不代表将所有自反馈方法都视为完整的递归自我改进。</p></section><section><h3>笔记与证据</h3><p>每篇提供 Research problem、Insight、Observation、Method、结果与展望。来源区标注实际核验范围；核心洞察、局限分析、RSI 关联与展望含本站解读，实验结论以原论文为准。</p></section><section><h3>内容维护</h3><p>当前收录 {papers.length} 篇精选论文，按条目维护，尚未启用自动抓取。这是一份精选阅读起点，不是所有最新研究的完整目录。</p></section><section><h3>创建与联系</h3><p>{siteOwner.name}<br/><a href={'mailto:' + siteOwner.email}>{siteOwner.email}</a></p></section></div>
    </DialogContent></Dialog>
  </div>;
}
