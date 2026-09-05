import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, BookOpen, FileText } from 'lucide-react';
import { papers, formatDate } from '@/lib/papers';

export function generateStaticParams() { return papers.map(p => ({id: p.id})); }
export const dynamicParams = false;

export async function generateMetadata({params}: {params: Promise<{id: string}>}): Promise<Metadata> {
  const {id} = await params;
  const p = papers.find(p => p.id === id);
  if (!p) return {title: '论文未找到 · RSI 观察站', robots: {index: false}};
  return {title: p.title + ' · RSI 观察站', description: p.summary, alternates: {canonical: '/rsi/papers/' + id + '/'}};
}

export default async function PaperPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const p = papers.find(p => p.id === id);
  if (!p) notFound();
  const source = 'https://arxiv.org/abs/' + p.id + (p.version ?? '');
  const pdf = 'https://arxiv.org/pdf/' + p.id + (p.version ?? '');
  const sections = [
    {id: 'question', label: '研究问题', content: p.problem},
    {id: 'method', label: '核心方法', content: p.method},
    {id: 'evidence', label: '论文报告的结果', content: p.result},
    {id: 'limits', label: '阅读提醒', content: p.boundary},
  ];
  return <main id="main" className="reading-main">
    <div className="reading-breadcrumb"><a href="/rsi/"><ArrowLeft size={15}/>返回论文库</a><span>RESEARCH NOTE / {p.id}</span></div>
    <div className="reading-layout"><article className="reading-article">
      <header className="reading-header"><div className="reading-labels"><span>{p.category}</span><span>改进对象 / {p.level}</span></div><h1>{p.title}</h1><p className="reading-english">{p.en}</p><p className="reading-authors">{p.authors}</p><div className="reading-dates"><span>首次提交 <time dateTime={p.date}>{formatDate(p.date)}</time></span>{p.updated && <span>修订 <time dateTime={p.updated}>{formatDate(p.updated)}</time> · {p.version}</span>}</div><div className="reading-links"><a className="rsi-button primary" href={source} target="_blank" rel="noreferrer"><BookOpen size={16}/>arXiv 原文<ArrowUpRight size={16}/></a><a className="rsi-button" href={pdf} target="_blank" rel="noreferrer"><FileText size={16}/>阅读 PDF<ArrowUpRight size={16}/></a></div></header>
      <div className="reading-summary"><span className="overline">IN A NUTSHELL</span><p>{p.summary}</p></div>
      <div className="reading-sections">{sections.map((s, i) => <section id={s.id} key={s.id}><span className="reading-section-number">0{i + 1}</span><div><h2>{s.label}{s.id === 'limits' && <small>本站判断</small>}</h2><p>{s.content}</p></div></section>)}</div>
      <aside className="rsi-relation" id="rsi-relation"><span className="overline">THE RSI CONNECTION</span><h2>与递归自我改进的关系</h2><p>{p.relation}</p></aside>
      <div className="reading-source"><h2>来源与说明</h2><p>中文速读依据 <a href={source} target="_blank" rel="noreferrer">arXiv 摘要与元信息 <ArrowUpRight size={12}/></a> 整理。“阅读提醒”和 RSI 关联分析为本站判断，完整实验设置、结论及适用条件请以原论文为准。</p><span>arXiv:{p.id}{p.version ? ' · ' + p.version : ''}</span></div>
      <a className="reading-return" href="/rsi/"><ArrowLeft size={17}/>继续浏览论文库</a>
    </article><aside className="reading-sidebar"><div className="reading-sidebar-inner"><p className="overline">ON THIS PAGE</p><nav aria-label="论文阅读目录">{sections.map((s, i) => <a href={'#' + s.id} key={s.id}><span>0{i + 1}</span>{s.label}</a>)}<a href="#rsi-relation"><span>05</span>与 RSI 的关系</a></nav><div className="sidebar-paper-info"><span>改进对象</span><strong>{p.level}</strong><span>关键词</span><div>{p.keywords.map(k => <span key={k}>{k}</span>)}</div></div></div></aside></div>
  </main>;
}
