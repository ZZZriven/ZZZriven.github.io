'use client';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Search, Shuffle, X } from 'lucide-react';
import { Methodology } from '@/components/rsi/methodology';
import { ArxivInbox } from '@/components/rsi/arxiv-inbox';
import { normalizeCategory, papers, categories, categoryDescriptions, paperTypes, loopRoles, evidenceTypes, retentionTypes, initialFilters, matchesCategory, type PaperFilters, filterPapers, formatDate, collectionUpdated } from '@/lib/papers';

const readingPaths = [
  {title: 'From Feedback to Continual Learning', description: '先理解一次回答如何被修订，再看 experience 和 model parameters 如何进入下一轮。', ids: ['2303.17651', '2303.11366', '2203.14465']},
  {title: 'From Optimization to Self-Modification', description: '分清 optimization target 与 optimizer，追踪哪一部分变化真正接管了后续改进。', ids: ['2401.10020', '2310.02304', '2505.22954']},
  {title: 'Evaluating Self-Improvement', description: '关注 feedback 可靠性、experience 保留的作用和独立 evaluation，检查结果能否持续。', ids: ['2310.01798', '2608.04003', '2608.20318']},
];

const sorts = [{value: 'newest', label: '首次提交 · 最新优先'}, {value: 'oldest', label: '首次提交 · 最早优先'}, {value: 'updated', label: '已核实版本 · 最新优先'}];
const pageSize = 12;
type Filters = PaperFilters;
const initial = initialFilters;
const axes = [{key:'type',label:'Paper Type',values:paperTypes},{key:'role',label:'Loop Role',values:loopRoles},{key:'evidence',label:'Evidence',values:evidenceTypes},{key:'retention',label:'Persistence',values:retentionTypes}] as const;
const legacyModes = ['all','refinement','persistent','recursive','enabling','foundation'];
type ModelContext = {registerTool: (tool: {name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => unknown}, options: {signal: AbortSignal}) => void | Promise<void>};
function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search);
  const requestedPage = Number(params.get('page') ?? 1);
  const filters:Filters = {...initial, query: (params.get('q') ?? '').slice(0, 300), category: normalizeCategory(params.get('category')),
    mode: legacyModes.find(m => m === params.get('mode')) ?? initial.mode, sort: sorts.find(s => s.value === params.get('sort'))?.value ?? initial.sort,
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1};
  for (const axis of axes) filters[axis.key] = axis.values.find(v => v === params.get(axis.key)) ?? initial[axis.key];
  filters.page = Math.min(filters.page, Math.max(1, Math.ceil(filterPapers(filters).length / pageSize)));
  return filters;
}
function writeFilters(filters: Filters) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(filters)) {
    const param = key === 'query' ? 'q' : key;
    if (value === initial[key as keyof Filters]) url.searchParams.delete(param); else url.searchParams.set(param, String(value));
  }
  window.history.replaceState(window.history.state, '', url);
}
export function Library() {
  const [filters, setFilters] = useState<Filters>(initial);
  const {query, category, mode, sort, page} = filters;
  const filtered = useMemo(() => filterPapers(filters), [filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const active = Object.entries(filters).some(([key,value]) => key !== 'page' && value !== initial[key as keyof Filters]);
  function update(values: Partial<Filters>) {const next = {...filters, page: 1, ...values}; setFilters(next); writeFilters(next);}
  function turnPage(nextPage: number) {
    update({page: nextPage});
    document.getElementById('collection-title')?.focus({preventScroll: true});
    document.getElementById('library')?.scrollIntoView({block: 'start', behavior: 'instant'});
  }
  function reset() {setFilters(initial); writeFilters(initial);}
  useEffect(() => {
    const restore = () => {const next = readFilters(); setFilters(next); writeFilters(next);}; restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    const context = (document as Document & {modelContext?: ModelContext}).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'search_papers', title: '搜索 RSI 论文',
      description: '按关键词、Evolution Target、Paper Type、Loop Role、Evidence 和 Persistence 搜索；跨轴条件必须匹配同一个 Variant。',
      inputSchema: {type: 'object', properties: {query: {type: 'string', maxLength: 300}, category: {type: 'string', enum: [...categories]}, ...Object.fromEntries(axes.map(a => [a.key,{type:'string',enum:a.values}])), sort: {type: 'string', enum: sorts.map(s => s.value)}, page: {type: 'integer', minimum: 1}}, additionalProperties: false},
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('输入必须是对象');
        const args = input as Partial<Filters>;
        if (Object.keys(args).some(k => !Object.keys(initial).includes(k))) throw new Error('不支持的参数');
        if (args.query !== undefined && (typeof args.query !== 'string' || args.query.length > 300)) throw new Error('搜索词必须是最多 300 字符的文本');
        if (args.category !== undefined && !categories.some(c => c === args.category)) throw new Error('无效分类');
        if (args.mode !== undefined) throw new Error('mode 仅用于兼容旧链接；请使用独立分类轴');
        for (const axis of axes) if (args[axis.key] !== undefined && !axis.values.includes(args[axis.key]!)) throw new Error('无效 ' + axis.label);
        if (args.sort !== undefined && !sorts.some(s => s.value === args.sort)) throw new Error('无效排序');
        if (args.page !== undefined && (!Number.isSafeInteger(args.page) || args.page < 1)) throw new Error('页码必须是正整数');
        const next = {...initial, ...args};
        const matches = filterPapers(next);
        next.page = Math.min(next.page, Math.max(1, Math.ceil(matches.length / pageSize)));
        flushSync(() => setFilters(next)); writeFilters(next);
        return {...next, count: matches.length, papers: matches.map(p => ({id: p.id, title: p.en, topics: p.taxonomy.topics, paperType: p.taxonomy.paperType, variants: p.taxonomy.variants, url: '/rsi/papers/' + p.id + '/', date: p.date}))};
      },
    };
    try {Promise.resolve(context.registerTool(tool, {signal: lifecycle.signal})).catch(() => {});} catch {}
    return () => lifecycle.abort();
  }, []);
  function randomPaper() {if (filtered.length) window.location.assign('/rsi/papers/' + filtered[Math.floor(Math.random() * filtered.length)].id + '/');}
  return <main id="main" className="rsi-main">
    <header className="research-hero">
      <div className="hero-copy">
        <p className="overline"><span className="live-dot"/> RECURSIVE SELF-IMPROVEMENT</p>
        <h1>理解进化，<br/><span>从一篇论文开始。</span></h1>
        <p className="hero-description">探索 AI 如何改进自身。<br/>梳理问题、方法与证据，连接每一次研究进展。</p>
        <div className="hero-actions"><a href="#library" className="hero-link">浏览论文 <ArrowDown size={16}/></a><a href="#methodology" className="hero-secondary">了解分类方法 <ArrowUpRight size={15}/></a></div>
      </div>
      <div className="hero-map" aria-label="自我改进研究框架：执行任务、获得反馈、更新系统；进一步改进更新机制">
        <p className="overline">THE IDEA BEHIND RSI</p>
        <div className="loop-diagram">
          <div className="loop-node"><span>01</span><div><strong>Execute</strong><small>Model · Agent · Tools</small></div><ArrowDown size={15} aria-hidden="true"/></div>
          <div className="loop-node"><span>02</span><div><strong>Feedback</strong><small>Environment · Verifier</small></div><ArrowDown size={15} aria-hidden="true"/></div>
          <div className="loop-node"><span>03</span><div><strong>Update</strong><small>Weights · Memory · Code</small></div><ArrowUpRight size={15} aria-hidden="true"/></div>
        </div>
        <p className="recursive-note">再进一步，改进产生改进的机制。<br/><span>Persistent update 与 recursive improvement，需要分别验证。</span></p>
      </div>
    </header>
    <div className="collection-strip"><div><strong>{papers.length}</strong><span>篇论文解析</span></div><div><strong>{String(categories.length - 1).padStart(2, '0')}</strong><span>个 Evolution Targets</span></div><div className="collection-note"><span className="live-dot"/><span>Explore Self-Improvement</span></div><p>最近整理 <time dateTime={collectionUpdated}>{formatDate(collectionUpdated)}</time></p></div>
    <section id="library" className="library-section" aria-labelledby="library-title">
      <aside className="category-sidebar"><p className="overline">EXPLORE BY UPDATE TARGET</p><h2 id="library-title">Evolution Targets</h2><nav aria-label="按研究方向筛选">{categories.map((c, i) => <button type="button" aria-pressed={category === c} key={c} onClick={() => update({category: c})}><span className="category-number">{i === 0 ? '＋' : String(i).padStart(2, '0')}</span><span>{c}</span><small>{c === 'All Papers' ? papers.length : papers.filter(p => matchesCategory(p,c)).length}</small></button>)}</nav><a href="#methodology" className="taxonomy-shortcut">这些分类意味着什么？ <ArrowUpRight size={14}/></a><p className="sidebar-note">同一论文可涉及多个 Target，各主题数量不可相加。Survey 的标签表示覆盖范围，具体实验的更新对象在 Variant 中说明。</p></aside>
      <div className="library-content"><div className="library-heading"><div><p className="overline">PAPER COLLECTION</p><h2 id="collection-title" tabIndex={-1}>{category}</h2></div><button className="random-button" type="button" onClick={randomPaper} disabled={!filtered.length}><Shuffle size={16}/><span>随机一篇</span></button></div><p className="category-description">{categoryDescriptions[category] ?? '当前链接保留旧分类筛选结果。选择左侧 Evolution Target 即可切换到新版分类。'}</p>
        <div className="rsi-search"><Search size={18}/><input type="search" aria-label="搜索论文、作者或关键词" placeholder="搜索论文、作者、关键词或解析内容…" value={query} maxLength={300} onChange={e => update({query: e.target.value})}/>{query && <button type="button" aria-label="清空搜索" onClick={() => update({query: ''})}><X size={16}/></button>}<kbd aria-hidden="true">⌕</kbd></div>
        <div className="axis-filters">{axes.map(axis => <label key={axis.key}><span>{axis.label}</span><select aria-label={axis.label} value={filters[axis.key]} onChange={e => update({[axis.key]:e.target.value})}>{axis.values.map(v => <option key={v} value={v}>{v}</option>)}</select></label>)}</div>{mode !== 'all' && <p className="legacy-filter">旧链接筛选仍生效：{mode} <button type="button" onClick={() => update({mode:'all'})}>移除旧筛选</button></p>}<div className="filter-row"><span className="filter-explanation">跨轴筛选匹配同一个 Variant</span><label><span className="sr-only">论文排序</span><select aria-label="论文排序" value={sort} onChange={e => update({sort: e.target.value})}>{sorts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label></div>
        <output className="rsi-result-count" aria-live="polite"><span>找到 <strong>{filtered.length}</strong> 篇论文{filtered.length > 0 && <span className="visible-range"> / 本页 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}</span>}</span>{active && <button type="button" onClick={reset}>重置筛选 <X size={12}/></button>}<span className="result-hint">12 个问题，逐层理解论文</span></output>
        <div id="papers" className="rsi-paper-list">{filtered.length ? visible.map((p, index) => <article className="rsi-paper" key={p.id}><a className="paper-link" href={'/rsi/papers/' + p.id + '/'} aria-labelledby={'paper-' + p.id}><span className="paper-index" aria-hidden="true">{String((page - 1) * pageSize + index + 1).padStart(2, '0')}</span><div className="paper-body"><div className="paper-meta"><span className="category-tag">{p.taxonomy.paperType}</span>{p.taxonomy.topics.slice(0,2).map(t => <span className="topic-tag" key={t}>{t}</span>)}<time dateTime={p.date}>{formatDate(p.date)}</time></div><h3 id={'paper-' + p.id}>{p.en}</h3><p className="paper-english">{p.title}</p><p className="paper-summary">{p.summary}</p><div className="paper-foot"><div className="paper-tags">{p.keywords.slice(0, 3).map(k => <span key={k}>{k}</span>)}</div><span className="paper-read">阅读解析 <ArrowUpRight size={14}/></span></div></div></a></article>) : <div className="rsi-empty"><Search size={28}/><h3>没有找到匹配的论文</h3><p>试试更短的关键词，或减少分类条件。</p><button className="rsi-button" type="button" onClick={reset}>重置筛选</button></div>}</div>
        {pageCount > 1 ? <nav className="paper-pagination" aria-label="论文分页"><span>第 {page} / {pageCount} 页</span><div><button type="button" aria-label="上一页" onClick={() => turnPage(page - 1)} disabled={page === 1}><ArrowLeft size={16}/></button>{Array.from({length: pageCount}, (_, i) => <button type="button" key={i} aria-label={'第 ' + (i + 1) + ' 页'} aria-current={page === i + 1 ? 'page' : undefined} onClick={() => turnPage(i + 1)}>{String(i + 1).padStart(2, '0')}</button>)}<button type="button" aria-label="下一页" onClick={() => turnPage(page + 1)} disabled={page === pageCount}><ArrowRight size={16}/></button></div></nav> : <div className="index-end">{filtered.length ? '已显示全部 ' + filtered.length + ' 篇论文' : '从另一个问题出发，继续探索。'}</div>}
      </div>
    </section>
    <ArxivInbox/>
    <Methodology/>
    <section id="resources" className="resources-section"><div className="section-heading"><div><p className="overline">READING PATHS</p><h2>沿着问题，深入研究。</h2></div><span className="section-index">02 / READING PATHS</span></div><p className="section-intro">从代表论文开始，逐步比较 Method、适用范围与 Evidence。每篇解析附 arXiv 原文和实际核验范围。</p><div className="reading-paths">{readingPaths.map((path, index) => <article key={path.title}><span className="resource-kind">路径 0{index + 1}</span><h3>{path.title}</h3><p>{path.description}</p><ol>{path.ids.map(id => papers.find(p => p.id === id)).filter(p => p !== undefined).map(p => <li key={p.id}><a href={'/rsi/papers/' + p.id + '/'}>{p.en}<ArrowUpRight size={14}/></a></li>)}</ol></article>)}</div></section>
  </main>;
}
