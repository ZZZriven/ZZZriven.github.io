'use client';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import data from '@/content/arxiv-feed.json';
import { categories, formatDate, papers } from '@/lib/papers';

type FeedItem = {
  id: string; title: string; authors: string[]; published: string; updated: string;
  version: string; abstract: string; arxivUrl: string; pdfUrl: string;
  category: string; classificationReason: string; matchedTerms: string[];
};
const curatedIds = new Set(papers.map(p => p.id));
const items = (data.items as FeedItem[]).filter(p => !curatedIds.has(p.id));

export function ArxivInbox() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Papers');
  const [limit, setLimit] = useState(6);
  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(p => (category === 'All Papers' || p.category === category) && words.every(w => [p.title, p.abstract, p.id, p.category, ...p.authors, ...p.matchedTerms].join(' ').toLowerCase().includes(w)))
      .sort((a, b) => b.updated.localeCompare(a.updated) || a.id.localeCompare(b.id));
  }, [query, category]);
  return <section id="arxiv-feed" className="arxiv-section" aria-labelledby="arxiv-title">
    <div className="section-heading"><div><p className="overline">DAILY DISCOVERY</p><h2 id="arxiv-title">arXiv Feed<span className="feed-total">{items.length}</span></h2></div><a className="feed-back" href="#library">Paper Collection <ArrowUpRight size={14}/></a></div>
    <p className="section-intro">追踪 Recursive Self-Improvement、Self-Evolving Agents 及相关研究。这里先收录原始 Abstract 与 provisional classification；完成原文核验和结构化解析后，进入 Paper Collection。</p>
    <div className="feed-status"><span><span className="live-dot"/> Daily · 09:00 SGT</span><span>{data.updatedAt ? <>Last checked <time dateTime={data.updatedAt}>{new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Singapore', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date(data.updatedAt))} SGT</time></> : 'Awaiting first successful sync'}</span><span>Source · arXiv</span></div>
    <div className="feed-controls"><label className="feed-search"><Search size={16}/><input type="search" aria-label="Search arXiv Feed" placeholder="Search titles, authors, abstracts…" value={query} onChange={e => {setQuery(e.target.value); setLimit(6);}}/></label><select aria-label="arXiv Feed category" value={category} onChange={e => {setCategory(e.target.value); setLimit(6);}}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
    <output className="feed-result" aria-live="polite">{matches.length} papers · Awaiting Analysis</output>
    <div className="feed-list">{matches.slice(0, limit).map(p => <article className="feed-paper" key={p.id}>
      <div className="feed-paper-meta"><span className="category-tag">{p.category}</span><span className="feed-provisional">Provisional</span><span className="feed-id">arXiv:{p.id} · {p.version}</span></div>
      <h3><a href={p.arxivUrl} target="_blank" rel="noreferrer">{p.title}<ArrowUpRight size={16}/></a></h3>
      <p className="feed-authors">{p.authors.join(', ')}</p>
      <p className="feed-dates">Submitted <time dateTime={p.published}>{formatDate(p.published)}</time><span>Updated <time dateTime={p.updated}>{formatDate(p.updated)}</time></span></p>
      <p className="feed-abstract-preview" lang="en">{p.abstract}</p>
      <details><summary>Abstract & Classification</summary><div className="feed-detail"><h4>Abstract</h4><p lang="en">{p.abstract}</p><h4>Classification Rationale <span>Provisional</span></h4><p>{p.classificationReason}</p><div className="paper-tags">{p.matchedTerms.map(t => <span key={t}>{t}</span>)}</div><p className="feed-analysis-note">Awaiting Analysis · Research Problem、Insight、Observation、Method、Results、Limitations 与 Outlook 待原文核验后补充。当前分类依据 title 与 abstract，不代表已确认 RSI Relation。</p><a href={p.pdfUrl} target="_blank" rel="noreferrer">Read PDF <ArrowUpRight size={14}/></a></div></details>
    </article>)}</div>
    {!matches.length && <p className="feed-empty">{items.length ? '没有匹配的论文，试试其他关键词或分类。' : data.status === 'ok' ? '本次检索暂无尚未收录的相关论文；已有解析可在 Paper Collection 阅读。' : '首次成功检索后，将在这里显示新论文及最后检查时间。'}</p>}
    {matches.length > limit && <button type="button" className="rsi-button feed-more" onClick={() => setLimit(n => n + 6)}>Load 6 more <span>({matches.length - limit} remaining)</span></button>}
  </section>;
}
