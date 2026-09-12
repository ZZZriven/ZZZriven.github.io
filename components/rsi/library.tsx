'use client';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowUpRight, BookOpen, Search, Shuffle, X } from 'lucide-react';
import { papers, categories, categoryDescriptions, modes, filterPapers, formatDate, collectionUpdated, modeLabel } from '@/lib/papers';

const readingPaths = [
  {title: '从反馈到持续学习', description: '先理解一次回答如何被修订，再看经验和参数如何进入下一轮。', ids: ['2303.17651', '2303.11366', '2203.14465']},
  {title: '从系统优化到自修改', description: '分清优化目标与优化器，追踪哪一部分变化真正接管了后续改进。', ids: ['2401.10020', '2310.02304', '2505.22954']},
  {title: '检验改进是否成立', description: '关注反馈可靠性、经验保留的作用和独立评测，检查结果能否持续。', ids: ['2310.01798', '2608.04003', '2608.20318']},
];

const sorts = [{value: 'newest', label: '首次提交 · 最新优先'}, {value: 'oldest', label: '首次提交 · 最早优先'}, {value: 'updated', label: '已核实版本 · 最新优先'}];
type Filters = {query: string; category: string; sort: string; mode: string};
const initial: Filters = {query: '', category: '全部论文', sort: 'newest', mode: 'all'};
type ModelContext = {registerTool: (tool: {name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => unknown}, options: {signal: AbortSignal}) => void | Promise<void>};
function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {query: (params.get('q') ?? '').slice(0, 300), category: categories.find(c => c === params.get('category')) ?? initial.category,
    mode: modes.find(m => m.value === params.get('mode'))?.value ?? initial.mode, sort: sorts.find(s => s.value === params.get('sort'))?.value ?? initial.sort};
}
function writeFilters(filters: Filters) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(filters)) {
    const param = key === 'query' ? 'q' : key;
    if (value === initial[key as keyof Filters]) url.searchParams.delete(param); else url.searchParams.set(param, value);
  }
  window.history.replaceState(window.history.state, '', url);
}
export function Library() {
  const [filters, setFilters] = useState<Filters>(initial);
  const {query, category, mode, sort} = filters;
  const filtered = useMemo(() => filterPapers(query, category, sort, mode), [query, category, sort, mode]);
  const active = query !== '' || category !== initial.category || mode !== initial.mode || sort !== initial.sort;
  function update(values: Partial<Filters>) {const next = {...filters, ...values}; setFilters(next); writeFilters(next);}
  function reset() {setFilters(initial); writeFilters(initial);}
  useEffect(() => {
    const restore = () => setFilters(readFilters()); restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    const context = (document as Document & {modelContext?: ModelContext}).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'search_papers', title: '搜索 RSI 论文',
      description: '按关键词、研究分类和 RSI 关联类型搜索论文，并更新页面中的筛选与结果。',
      inputSchema: {type: 'object', properties: {query: {type: 'string', maxLength: 300}, category: {type: 'string', enum: [...categories]}, mode: {type: 'string', enum: modes.map(m => m.value)}, sort: {type: 'string', enum: sorts.map(s => s.value)}}, additionalProperties: false},
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('输入必须是对象');
        const args = input as Partial<Filters>;
        if (Object.keys(args).some(k => !Object.keys(initial).includes(k))) throw new Error('不支持的参数');
        if (args.query !== undefined && (typeof args.query !== 'string' || args.query.length > 300)) throw new Error('搜索词必须是最多 300 字符的文本');
        if (args.category !== undefined && !categories.some(c => c === args.category)) throw new Error('无效分类');
        if (args.mode !== undefined && !modes.some(m => m.value === args.mode)) throw new Error('无效关联类型');
        if (args.sort !== undefined && !sorts.some(s => s.value === args.sort)) throw new Error('无效排序');
        const next = {...initial, ...args};
        const matches = filterPapers(next.query, next.category, next.sort, next.mode);
        flushSync(() => setFilters(next)); writeFilters(next);
        return {...next, count: matches.length, papers: matches.map(p => ({id: p.id, title: p.title, category: p.category, mode: p.mode, url: '/rsi/papers/' + p.id + '/', date: p.date}))};
      },
    };
    try {Promise.resolve(context.registerTool(tool, {signal: lifecycle.signal})).catch(() => {});} catch {}
    return () => lifecycle.abort();
  }, []);
  function randomPaper() {if (filtered.length) window.location.assign('/rsi/papers/' + filtered[Math.floor(Math.random() * filtered.length)].id + '/');}
  return <main id="main" className="rsi-main">
    <header className="research-hero">
      <div className="hero-copy"><p className="overline"><span className="live-dot"/> AN OPEN RESEARCH LIBRARY</p><h1>理解 AI 如何<br/><span>学会自我改进。</span></h1><p className="hero-description">梳理递归自我改进的研究脉络。<br/>从问题、洞察到方法与证据，读懂每一次改进。</p><a href="#library" className="hero-link">探索论文 <ArrowDown size={16}/></a></div>
      <div className="hero-map" aria-label="自我改进研究框架：系统、反馈、更新；递归层改进更新机制">
        <div className="map-top"><span>THE IMPROVEMENT LOOP</span><span>↗ RSI</span></div>
        <div className="loop-diagram"><div className="loop-node"><span>01 / SYSTEM</span><strong>执行任务</strong><small>模型 · 智能体 · 工具</small></div><span className="loop-arrow" aria-hidden="true">→</span><div className="loop-node"><span>02 / FEEDBACK</span><strong>获得反馈</strong><small>环境 · 验证器 · 评判</small></div><span className="loop-arrow" aria-hidden="true">→</span><div className="loop-node"><span>03 / UPDATE</span><strong>更新系统</strong><small>权重 · 记忆 · 代码</small></div></div>
        <div className="loop-return"><span aria-hidden="true">↑</span><span>把改进保留到下一轮</span><span aria-hidden="true">↲</span></div>
        <div className="recursive-note"><span>RECURSIVE LAYER</span><p>进一步改进「产生改进的机制」。</p></div>
        <div className="map-caption">概念示意 · 单次输出修订未必形成持久改进</div>
      </div>
    </header>
    <div className="collection-strip"><div><strong>{papers.length}</strong><span>篇论文解析</span></div><div><strong>{String(categories.length - 1).padStart(2, '0')}</strong><span>个研究方向</span></div><div><BookOpen size={16}/><span>逐篇追溯原文</span></div><p>最近整理 <time dateTime={collectionUpdated}>{formatDate(collectionUpdated)}</time></p></div>
    <section id="library" className="library-section" aria-labelledby="library-title">
      <aside className="category-sidebar"><p className="overline">RESEARCH AREAS</p><h2 id="library-title">研究分类</h2><nav aria-label="按研究方向筛选">{categories.map((c, i) => <button type="button" aria-pressed={category === c} key={c} onClick={() => update({category: c})}><span className="category-number">{i === 0 ? '＋' : String(i).padStart(2, '0')}</span><span>{c}</span><small>{c === '全部论文' ? papers.length : papers.filter(p => p.category === c).length}</small></button>)}</nav><a href="#methodology" className="taxonomy-shortcut">这些分类意味着什么？ <ArrowUpRight size={14}/></a><p className="sidebar-note">按主要研究问题归类，结合系统更新方式阅读；跨方向工作用关键词补充定位。</p></aside>
      <div className="library-content"><div className="library-heading"><div><p className="overline">THE COLLECTION</p><h2>{category}</h2></div><button className="random-button" type="button" onClick={randomPaper} disabled={!filtered.length}><Shuffle size={16}/><span>随机一篇</span></button></div><p className="category-description">{categoryDescriptions[category]}</p>
        <div className="rsi-search"><Search size={18}/><input type="search" aria-label="搜索论文、作者或关键词" placeholder="搜索论文、作者、关键词或解析内容…" value={query} maxLength={300} onChange={e => update({query: e.target.value})}/>{query && <button type="button" aria-label="清空搜索" onClick={() => update({query: ''})}><X size={16}/></button>}<kbd aria-hidden="true">⌕</kbd></div>
        <div className="filter-row"><label><span>RSI 关联</span><select aria-label="RSI 关联类型" value={mode} onChange={e => update({mode: e.target.value})}>{modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label><label><span className="sr-only">论文排序</span><select aria-label="论文排序" value={sort} onChange={e => update({sort: e.target.value})}>{sorts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label></div>
        <output className="rsi-result-count" aria-live="polite"><span>显示 <strong>{filtered.length}</strong> / {papers.length} 篇论文</span>{active && <button type="button" onClick={reset}>重置筛选 <X size={12}/></button>}<span className="result-hint">每篇均附结构化解析</span></output>
        <div id="papers" className="rsi-paper-list">{filtered.length ? filtered.map((p, index) => <article className="rsi-paper" key={p.id}><a className="paper-link" href={'/rsi/papers/' + p.id + '/'} aria-labelledby={'paper-' + p.id}><span className="paper-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div className="paper-body"><div className="paper-meta"><span className="category-tag">{p.category}</span><span className={'mode-tag mode-' + p.mode}>{modeLabel(p.mode)}</span><time dateTime={p.date}>{formatDate(p.date)}</time></div><h3 id={'paper-' + p.id}>{p.title}</h3><p className="paper-english">{p.en}</p><p className="paper-summary">{p.summary}</p><div className="paper-foot"><div className="paper-tags">{p.keywords.slice(0, 3).map(k => <span key={k}>{k}</span>)}</div><span className="paper-read">阅读解析 <ArrowUpRight size={14}/></span></div></div></a></article>) : <div className="rsi-empty"><Search size={28}/><h3>没有找到匹配的论文</h3><p>试试更短的关键词，或清除分类与关联类型。</p><button className="rsi-button" type="button" onClick={reset}>重置筛选</button></div>}</div>
        <div className="index-end"><span/>{filtered.length ? '已显示全部 ' + filtered.length + ' 篇' : '继续探索其他研究方向'}<span/></div>
      </div>
    </section>
    <section id="methodology" className="methodology-section"><div className="section-heading"><div><p className="overline">HOW TO READ THE FIELD</p><h2>先辨清，什么在改进。</h2></div><span className="section-index">01 / METHODOLOGY</span></div><p className="section-intro">论文按主要研究问题划分为七个方向；方法论文说明改进目标，综述、理论与评测各自标清研究用途。再独立标注系统更新方式，区分输出修订、持久系统优化、改进器自修改，以及相关能力或外部产物优化。</p>
      <div className="method-grid"><article><span className="method-index">01</span><h3>改进对象 <small>WHAT</small></h3><p>先定位论文的核心问题：输出、记忆、模型、智能体，还是搜索与科研。以评测或综述为主要贡献的论文，分别归入对应研究方向。</p></article><article><span className="method-index">02</span><h3>改进闭环 <small>HOW</small></h3><p>明确被优化的系统边界：变更是否保留？是固定优化器更新目标系统，还是更新后的改进器接手下一轮？外部产物变好需单独说明。</p></article><article><span className="method-index">03</span><h3>证据边界 <small>EVIDENCE</small></h3><p>结合独立评测、迁移能力、迭代轮数与计算成本读结果。任务分数提高，不能直接推出开放式递归改进。</p></article></div>
      <div className="mode-explainer"><div><span className="mode-tag mode-refinement">单次输出修订</span><p>改写当前任务输出，不保留系统更新。</p></div><div><span className="mode-tag mode-persistent">持久系统优化</span><p>权重、提示、记忆或代码进入后续尝试或任务；优化器可以固定。</p></div><div><span className="mode-tag mode-recursive">改进器自修改</span><p>显式改写承担后续改进的程序或策略，并由改后版本继续改进。</p></div><div><span className="mode-tag mode-enabling">相关能力与产物优化</span><p>主要研究相关能力或外部产物优化；混合实验逐篇说明系统更新范围。</p></div><div><span className="mode-tag mode-foundation">综述、理论与评测</span><p>用于梳理概念、建立理论、衡量能力或分析局限。</p></div></div>
      <p className="classification-note">主标签概括论文的主要贡献，混合实验的更新方式在解析中分别说明。这些标签不是能力高低排名。标题中的 “self-improving” 或 “recursive” 本身不构成分类证据；每篇解析说明对象、反馈和更新范围。模型与奖励共同训练归入持久系统优化，不能仅据此认定改进程序已自修改。</p>
    </section>
    <section id="resources" className="resources-section"><div className="section-heading"><div><p className="overline">READING PATHS</p><h2>沿着问题，深入研究。</h2></div><span className="section-index">02 / READING PATHS</span></div><p className="section-intro">从代表论文开始，逐步比较方法、适用范围与证据。每篇解析附 arXiv 原文和实际核验范围。</p><div className="reading-paths">{readingPaths.map((path, index) => <article key={path.title}><span className="resource-kind">路径 0{index + 1}</span><h3>{path.title}</h3><p>{path.description}</p><ol>{path.ids.map(id => papers.find(p => p.id === id)).filter(p => p !== undefined).map(p => <li key={p.id}><a href={'/rsi/papers/' + p.id + '/'}>{p.title}<ArrowUpRight size={14}/></a></li>)}</ol></article>)}</div></section>
  </main>;
}
