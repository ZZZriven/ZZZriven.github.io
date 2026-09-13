/* oxlint-disable nextjs/no-html-link-for-pages -- Native links keep exported GitHub Pages routes independent of client routing. */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, BookOpen, FileText } from 'lucide-react';
import { papers, formatDate, modeLabel } from '@/lib/papers';

export function generateStaticParams() {return papers.map(p => ({id: p.id}));}
export const dynamicParams = false;
export async function generateMetadata({params}: {params: Promise<{id: string}>}): Promise<Metadata> {
  const {id} = await params;
  const p = papers.find(p => p.id === id);
  if (!p) return {title: '论文未找到 · RSI Paper', robots: {index: false}};
  return {title: p.en + ' · RSI Paper', description: p.summary, alternates: {canonical: '/rsi/papers/' + id + '/'}};
}
export default async function PaperPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const p = papers.find(p => p.id === id);
  if (!p) notFound();
  const source = 'https://arxiv.org/abs/' + p.id + (p.version ?? '');
  const pdf = 'https://arxiv.org/pdf/' + p.id + (p.version ?? '');
  const sections = [
    {id: 'problem', label: 'Research Problem', content: p.problem, editorial: false},
    {id: 'insight', label: 'Insight', content: p.insight, editorial: true},
    {id: 'observation', label: 'Observation', content: p.observation, editorial: false},
    {id: 'method', label: 'Method', content: p.method, editorial: false},
    {id: 'results', label: 'Results', content: p.result, editorial: false},
    {id: 'limits', label: 'Limitations', content: p.boundary, editorial: true},
    {id: 'outlook', label: 'Outlook', content: p.outlook, editorial: true},
  ];
  const related = papers.filter(other => other.id !== p.id && other.category === p.category).slice(0, 3);
  return <main id="main" className="reading-main">
    <div className="reading-breadcrumb"><a href={'/rsi/?category=' + encodeURIComponent(p.category) + '#library'}><ArrowLeft size={14}/>{p.category}</a><span>RESEARCH NOTE / {p.id}</span></div>
    <div className="reading-layout"><article className="reading-article">
      <header className="reading-header"><div className="reading-labels"><a className="category-tag" href={'/rsi/?category=' + encodeURIComponent(p.category) + '#library'}>{p.category}</a><span className={'mode-tag mode-' + p.mode}>{modeLabel(p.mode)}</span></div><h1>{p.en}</h1><p className="reading-english">{p.title}</p><p className="reading-authors">{p.authors}</p><div className="reading-dates"><span>Submitted <time dateTime={p.date}>{formatDate(p.date)}</time></span>{p.updated && <span>Verified Version <time dateTime={p.updated}>{formatDate(p.updated)}</time> · {p.version}</span>}<span>Note Updated <time dateTime={p.reviewedAt}>{formatDate(p.reviewedAt)}</time></span></div><div className="reading-links"><a className="rsi-button primary" href={source} target="_blank" rel="noreferrer"><BookOpen size={15}/>arXiv<ArrowUpRight size={14}/></a><a className="rsi-button" href={pdf} target="_blank" rel="noreferrer"><FileText size={15}/>Read PDF<ArrowUpRight size={14}/></a></div></header>
      <div className="reading-summary"><span className="overline">SUMMARY</span><p>{p.summary}</p></div>
      <dl className="evidence-strip"><div><dt>Improvement Target</dt><dd>{p.level}</dd></div><div><dt>Feedback</dt><dd>{p.feedback}</dd></div><div style={{gridColumn: '1 / -1'}}><dt>Evidence Scope</dt><dd>{p.evidence}</dd></div></dl>
      <div className="reading-sections">{sections.map((s, i) => <section id={s.id} key={s.id}><span className="reading-section-number">0{i + 1}</span><div><h2>{s.label}{s.editorial && <small>本站解读</small>}</h2><p>{s.content}</p></div></section>)}</div>
      <aside className="rsi-relation" id="rsi-relation"><span className="overline">EDITORIAL NOTE · 本站判断</span><h2>Relation to RSI</h2><p>{p.relation}</p></aside>
      <div className="reading-source" id="sources"><h2>Sources &amp; Verification</h2><p>以下标注本条目实际使用的材料。Insight、Limitations、Relation to RSI 与 Outlook 含本站解读；Observation 与 Results 在论文原始设置下成立。基于 abstract 的核验不等同于全文复现。</p><ul>{p.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a><span>{s.basis}</span></li>)}</ul><span>arXiv:{p.id}{p.version ? ' · ' + p.version : ''} / REVIEWED {formatDate(p.reviewedAt)}</span></div>
      {related.length > 0 && <section className="related-papers"><h2>Related Papers</h2>{related.map(other => <a key={other.id} href={'/rsi/papers/' + other.id + '/'}>{other.en} ↗</a>)}</section>}
      <a className="reading-return" href="/rsi/#library"><ArrowLeft size={16}/>返回全部论文</a>
    </article><aside className="reading-sidebar"><div className="reading-sidebar-inner"><p className="overline">CONTENTS</p><nav aria-label="论文阅读目录">{sections.map((s, i) => <a href={'#' + s.id} key={s.id}><span>0{i + 1}</span>{s.label}</a>)}<a href="#rsi-relation"><span>08</span>Relation to RSI</a><a href="#sources"><span>09</span>Sources &amp; Verification</a></nav><div className="sidebar-paper-info"><span>Research Area</span><strong>{p.category}</strong><span>RSI Relation</span><strong>{modeLabel(p.mode)}</strong><span>Keywords</span><div>{p.keywords.map(k => <span key={k}>{k}</span>)}</div></div></div></aside></div>
  </main>;
}
