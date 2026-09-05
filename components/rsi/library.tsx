'use client';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, Search, Shuffle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { papers, filterPapers, formatDate, collectionUpdated } from '@/lib/papers';

const sorts = [{value: 'newest', label: '首次提交 · 最新优先'}, {value: 'oldest', label: '首次提交 · 最早优先'}, {value: 'updated', label: '修订日期 · 最新优先'}];
type SearchInput = {query?: string; sort?: string};
type ModelContext = {registerTool: (tool: {name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => unknown}, options: {signal: AbortSignal}) => void | Promise<void>};

export function Library() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const filtered = useMemo(() => filterPapers(query, '全部论文', sort), [query, sort]);
  useEffect(() => {
    const context = (document as Document & {modelContext?: ModelContext}).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'search_papers', title: '搜索 RSI 论文',
      description: '搜索所有已收录论文，并更新页面中可见的搜索词、排序和结果。',
      inputSchema: {type: 'object', properties: {query: {type: 'string', maxLength: 300}, sort: {type: 'string', enum: ['newest', 'oldest', 'updated']}}, additionalProperties: false},
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('输入必须是对象');
        const args = input as SearchInput;
        if (Object.keys(args).some(k => !['query', 'sort'].includes(k))) throw new Error('不支持的参数');
        if (args.query !== undefined && (typeof args.query !== 'string' || args.query.length > 300)) throw new Error('搜索词必须是最多 300 字符的文本');
        if (args.sort !== undefined && !sorts.some(s => s.value === args.sort)) throw new Error('无效排序');
        const q = args.query ?? '', s = args.sort ?? 'newest';
        const matches = filterPapers(q, '全部论文', s);
        flushSync(() => {setQuery(q); setSort(s);});
        return {query: q, sort: s, count: matches.length, papers: matches.map(p => ({id: p.id, title: p.title, url: '/rsi/papers/' + p.id + '/', date: p.date}))};
      },
    };
    try { Promise.resolve(context.registerTool(tool, {signal: lifecycle.signal})).catch(() => {}); } catch {}
    return () => lifecycle.abort();
  }, []);
  function reset() {setQuery(''); setSort('newest');}
  function randomPaper() {if (filtered.length) window.location.assign('/rsi/papers/' + filtered[Math.floor(Math.random() * filtered.length)].id + '/');}

  return <main id="main" className="rsi-main">
    <header className="index-heading"><div><p className="overline">RECURSIVE SELF-IMPROVEMENT</p><h1>递归自我改进<span>研究</span></h1></div><p className="index-updated">最近整理 <time dateTime={collectionUpdated}>{formatDate(collectionUpdated)}</time></p></header>
    <div className="index-toolbar"><div className="rsi-search"><Search size={19}/><input type="search" aria-label="搜索论文、作者或关键词" placeholder="搜索论文、作者或关键词" value={query} maxLength={300} onChange={e => setQuery(e.target.value)}/>{query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={17}/></button>}</div><div className="index-actions"><Select value={sort} onValueChange={v => setSort(v ?? 'newest')} items={sorts}><SelectTrigger className="rsi-sort" aria-label="论文排序"><SelectValue/></SelectTrigger><SelectContent className="rsi-select" align="end">{sorts.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select><button className="random-button" type="button" onClick={randomPaper} disabled={!filtered.length}><Shuffle size={17}/><span>随机一篇</span></button></div></div>
    <p className="rsi-result-count" role="status" aria-live="polite">{query ? '搜索结果' : '全部论文'}<strong>{filtered.length}</strong>{query && <span>/ {papers.length}</span>}<span>篇</span>{query && <button type="button" onClick={reset}>重置 <X size={13}/></button>}</p>
    <div id="papers" className="rsi-paper-list">{filtered.length ? filtered.map((p, index) => <article className="rsi-paper" key={p.id}><a className="paper-link" href={'/rsi/papers/' + p.id + '/'} aria-labelledby={'paper-' + p.id}><div className="paper-index"><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><time dateTime={p.date}>{formatDate(p.date)}</time></div><div className="paper-body"><h2 id={'paper-' + p.id}>{p.title}</h2><p className="paper-english">{p.en}</p><p className="paper-summary">{p.summary}</p><div className="paper-foot"><span className="paper-arxiv">arXiv:{p.id}</span><div className="paper-tags">{p.keywords.slice(0, 3).map(k => <span key={k}>{k}</span>)}</div></div></div><ArrowUpRight className="paper-arrow" size={22} strokeWidth={1.4}/></a></article>) : <Empty className="rsi-empty"><Search size={28}/><EmptyTitle>没有找到匹配的论文</EmptyTitle><EmptyDescription>试试英文简称、作者或更短的关键词。</EmptyDescription><button className="rsi-button" type="button" onClick={reset}>重置搜索</button></Empty>}</div>
    <div className="index-end"><span/>{filtered.length ? '已显示全部 ' + filtered.length + ' 篇' : '换个关键词，继续探索'}<span/></div>
  </main>;
}
