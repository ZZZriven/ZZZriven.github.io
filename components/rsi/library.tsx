'use client';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, Search, Shuffle, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { categories, papers, filterPapers, formatDate, collectionUpdated } from '@/lib/papers';

const sorts = [{value: 'newest', label: '首次提交 · 最新优先'}, {value: 'oldest', label: '首次提交 · 最早优先'}, {value: 'updated', label: '修订日期 · 最新优先'}];
const descriptions: Record<string, string> = {
  '全部论文': '从系统自修改，到自训练、反馈与理论边界。',
  '智能体进化': '改写代码、积累技能，观察系统如何改变自己的工作方式。',
  '自博弈与课程': '由模型生成任务与课程，用可验证反馈推进学习。',
  '自训练与反馈': '区分权重更新、反思记忆与推理时的答案修订。',
  '理论与边界': '检查改进成立的条件，以及结论能够推广到哪里。',
};
type SearchInput = {query?: string; category?: string; sort?: string};
type ModelContext = {registerTool: (tool: {name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => unknown}, options: {signal: AbortSignal}) => void | Promise<void>};

export function Library() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部论文');
  const [sort, setSort] = useState('newest');
  const filtered = useMemo(() => filterPapers(query, category, sort), [query, category, sort]);
  useEffect(() => {
    const context = (document as Document & {modelContext?: ModelContext}).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'search_papers', title: '搜索 RSI 论文',
      description: '搜索已收录论文，并更新页面中可见的搜索词、分类、排序和结果。',
      inputSchema: {type: 'object', properties: {query: {type: 'string', maxLength: 300}, category: {type: 'string', enum: [...categories]}, sort: {type: 'string', enum: ['newest', 'oldest', 'updated']}}, additionalProperties: false},
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('输入必须是对象');
        const args = input as SearchInput;
        if (Object.keys(args).some(k => !['query', 'category', 'sort'].includes(k))) throw new Error('不支持的参数');
        if (args.query !== undefined && (typeof args.query !== 'string' || args.query.length > 300)) throw new Error('搜索词必须是最多 300 字符的文本');
        if (args.category !== undefined && !categories.some(c => c === args.category)) throw new Error('无效分类');
        if (args.sort !== undefined && !sorts.some(s => s.value === args.sort)) throw new Error('无效排序');
        const q = args.query ?? '', c = args.category ?? '全部论文', s = args.sort ?? 'newest';
        const matches = filterPapers(q, c, s);
        flushSync(() => {setQuery(q); setCategory(c); setSort(s);});
        return {query: q, category: c, sort: s, count: matches.length, papers: matches.map(p => ({id: p.id, title: p.title, url: '/rsi/papers/' + p.id + '/', date: p.date}))};
      },
    };
    try { Promise.resolve(context.registerTool(tool, {signal: lifecycle.signal})).catch(() => {}); } catch {}
    return () => lifecycle.abort();
  }, []);
  function reset() {setQuery(''); setCategory('全部论文'); setSort('newest');}
  function randomPaper() {if (filtered.length) window.location.assign('/rsi/papers/' + filtered[Math.floor(Math.random() * filtered.length)].id + '/');}

  return <main id="main" className="rsi-main">
    <section className="rsi-intro"><div><p className="overline">RECURSIVE SELF-IMPROVEMENT</p><h1>追踪智能的<span>自我进化。</span></h1><p className="hero-description">精选论文、中文速读与研究边界。<br className="mobile-break"/>理解系统如何改进自身。</p></div><dl className="collection-stats"><div><dd>{String(papers.length).padStart(2, '0')}</dd><dt>精选论文</dt></div><div><dd>04</dd><dt>研究方向</dt></div><div className="collection-date"><dt>最近整理</dt><dd>{formatDate(collectionUpdated)}</dd></div></dl></section>

    <section className="rsi-library" aria-labelledby="library-title"><div className="library-heading"><div><span className="overline">THE READING INDEX</span><h2 id="library-title">论文库<span className="heading-slash">/</span><span className="library-total">{papers.length}</span></h2></div><div className="library-tools"><div className="rsi-search"><Search size={18}/><input type="search" aria-label="搜索论文、作者或关键词" placeholder="搜索论文、作者或关键词" value={query} maxLength={300} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="清空搜索" onClick={() => setQuery('')}><X size={16}/></button>}</div><button className="random-button" onClick={randomPaper} disabled={!filtered.length}><Shuffle size={17}/><span>随机一篇</span></button></div></div>
      <Tabs value={category} onValueChange={value => setCategory(String(value))} className="rsi-tabs"><div className="tab-scroll"><TabsList variant="line" className="rsi-tab-list" aria-label="按研究方向筛选">{categories.map(c => <TabsTrigger value={c} key={c} className="rsi-tab">{c}<span>{c === '全部论文' ? papers.length : papers.filter(p => p.category === c).length}</span></TabsTrigger>)}</TabsList></div>
        <div className="library-description"><p>{descriptions[category]}</p><Select value={sort} onValueChange={v => setSort(v ?? 'newest')} items={sorts}><SelectTrigger className="rsi-sort" aria-label="论文排序"><SelectValue/></SelectTrigger><SelectContent className="rsi-select" align="end">{sorts.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
        <p className="rsi-result-count" role="status" aria-live="polite">{query ? '搜索结果' : '正在浏览'} <strong>{filtered.length}</strong> 篇{query && <button onClick={reset}>重置筛选 <X size={12}/></button>}</p>
        {categories.map(c => <TabsContent key={c} value={c}>{filtered.length ? <div className="rsi-paper-grid">{filtered.map(p => <article className="rsi-paper" key={p.id}><div className="paper-labels"><span className="paper-category">{p.category}</span><span className="paper-level">{p.level}</span></div><h3><a href={'/rsi/papers/' + p.id + '/'}>{p.title}<ArrowUpRight size={19}/></a></h3><p className="paper-english">{p.en}</p><p className="paper-summary">{p.summary}</p><div className="paper-tags">{p.keywords.slice(0, 3).map(k => <span key={k}>{k}</span>)}</div><div className="paper-foot"><span>arXiv:{p.id}</span><time dateTime={p.date}>{formatDate(p.date)}</time></div></article>)}</div> : <Empty className="rsi-empty"><Search size={28}/><EmptyTitle>没有找到匹配的论文</EmptyTitle><EmptyDescription>试试英文简称、作者或更短的关键词，也可以切换研究方向。</EmptyDescription><button className="rsi-button" onClick={reset}>重置筛选</button></Empty>}</TabsContent>)}
      </Tabs>
      <div className="index-end"><span/>{filtered.length ? '已显示全部 ' + filtered.length + ' 篇' : '换个关键词，继续探索'}<span/></div>
      <aside className="collection-note"><span className="overline">READ WITH CONTEXT</span><p>自我修订、技能积累、模型训练与递归自修改，指向不同的改进对象。阅读时请结合每篇论文的机制与证据边界判断。</p><span>精选起始库 · 按条目维护</span></aside>
    </section>
  </main>;
}
