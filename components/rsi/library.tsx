'use client';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowUpRight, BookOpen, Search, Shuffle, X } from 'lucide-react';
import { papers, categories, categoryDescriptions, modes, filterPapers, formatDate, collectionUpdated, modeLabel } from '@/lib/papers';
import resources from '@/content/resources.json';

const sorts = [{value: 'newest', label: '首次提交 · 最新优先'}, {value: 'oldest', label: '首次提交 · 最早优先'}, {value: 'updated', label: '已核实修订 · 最新优先'}];
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
    <div className="collection-strip"><div><strong>{papers.length}</strong><span>篇论文解析</span></div><div><strong>07</strong><span>个研究方向</span></div><div><BookOpen size={16}/><span>逐篇追溯原文</span></div><p>最近整理 <time dateTime={collectionUpdated}>{formatDate(collectionUpdated)}</time></p></div>
    <section id="library" className="library-section" aria-labelledby="library-title">
      <aside className="category-sidebar"><p className="overline">RESEARCH AREAS</p><h2 id="library-title">研究分类</h2><nav aria-label="按研究方向筛选">{categories.map((c, i) => <button type="button" aria-pressed={category === c} key={c} onClick={() => update({category: c})}><span className="category-number">{i === 0 ? '＋' : String(i).padStart(2, '0')}</span><span>{c}</span><small>{c === '全部论文' ? papers.length : papers.filter(p => p.category === c).length}</small></button>)}</nav><a href="#methodology" className="taxonomy-shortcut">这些分类意味着什么？ <ArrowUpRight size={14}/></a><p className="sidebar-note">按主要改进对象归类，结合关联类型阅读。收录相关方法不等于认定其实现完整 RSI。</p></aside>
      <div className="library-content"><div className="library-heading"><div><p className="overline">THE COLLECTION</p><h2>{category}</h2></div><button className="random-button" type="button" onClick={randomPaper} disabled={!filtered.length}><Shuffle size={16}/><span>随机一篇</span></button></div><p className="category-description">{categoryDescriptions[category]}</p>
        <div className="rsi-search"><Search size={18}/><input type="search" aria-label="搜索论文、作者或关键词" placeholder="搜索论文、作者、关键词或解析内容…" value={query} maxLength={300} onChange={e => update({query: e.target.value})}/>{query && <button type="button" aria-label="清空搜索" onClick={() => update({query: ''})}><X size={16}/></button>}<kbd aria-hidden="true">⌕</kbd></div>
        <div className="filter-row"><label><span>RSI 关联</span><select aria-label="RSI 关联类型" value={mode} onChange={e => update({mode: e.target.value})}>{modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label><label><span className="sr-only">论文排序</span><select aria-label="论文排序" value={sort} onChange={e => update({sort: e.target.value})}>{sorts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label></div>
        <output className="rsi-result-count" aria-live="polite"><span>显示 <strong>{filtered.length}</strong> / {papers.length} 篇论文</span>{active && <button type="button" onClick={reset}>重置筛选 <X size={12}/></button>}<span className="result-hint">每篇均附结构化解析</span></output>
        <div id="papers" className="rsi-paper-list">{filtered.length ? filtered.map((p, index) => <article className="rsi-paper" key={p.id}><a className="paper-link" href={'/rsi/papers/' + p.id + '/'} aria-labelledby={'paper-' + p.id}><span className="paper-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div className="paper-body"><div className="paper-meta"><span className="category-tag">{p.category}</span><span className={'mode-tag mode-' + p.mode}>{modeLabel(p.mode)}</span><time dateTime={p.date}>{formatDate(p.date)}</time></div><h3 id={'paper-' + p.id}>{p.title}</h3><p className="paper-english">{p.en}</p><p className="paper-summary">{p.summary}</p><div className="paper-foot"><div className="paper-tags">{p.keywords.slice(0, 3).map(k => <span key={k}>{k}</span>)}</div><span className="paper-read">阅读解析 <ArrowUpRight size={14}/></span></div></div></a></article>) : <div className="rsi-empty"><Search size={28}/><h3>没有找到匹配的论文</h3><p>试试更短的关键词，或清除分类与关联类型。</p><button className="rsi-button" type="button" onClick={reset}>重置筛选</button></div>}</div>
        <div className="index-end"><span/>{filtered.length ? '已显示全部 ' + filtered.length + ' 篇' : '继续探索其他研究方向'}<span/></div>
      </div>
    </section>
    <section id="methodology" className="methodology-section"><div className="section-heading"><div><p className="overline">HOW TO READ THE FIELD</p><h2>先辨清，什么在改进。</h2></div><span className="section-index">01 / METHODOLOGY</span></div><p className="section-intro">本站综合 Awesome RSI 与自进化综述建立阅读分类：以主要研究对象划分七个方向，再独立标注与 RSI 的关联。它是便于检索的编辑分类，并非统一的学界分级。</p>
      <div className="method-grid"><article><span className="method-index">01</span><h3>改进对象 <small>WHAT</small></h3><p>区分当前输出、记忆与技能、模型与奖励、智能体代码，以及自动搜索与科研。综述和评测单独归类。</p></article><article><span className="method-index">02</span><h3>改进闭环 <small>HOW</small></h3><p>反馈从哪里来？哪些变化被保留？改进器本身是否更新？每篇都记录改进对象、反馈来源和 RSI 关联判断。</p></article><article><span className="method-index">03</span><h3>证据边界 <small>EVIDENCE</small></h3><p>结合独立评测、迁移能力、迭代轮数与计算成本读结果。任务分数提高，不能直接推出开放式递归改进。</p></article></div>
      <div className="mode-explainer"><div><span className="mode-tag mode-refinement">单次输出修订</span><p>修订当前回答，无持久系统更新。</p></div><div><span className="mode-tag mode-persistent">持久自我改进</span><p>权重、记忆或代码保留到后续尝试或任务。</p></div><div><span className="mode-tag mode-recursive">递归机制探索</span><p>改进机制也参与更新；仍须读其边界。</p></div><div><span className="mode-tag mode-foundation">基础与评测</span><p>综述、理论、评测或局限研究。</p></div></div>
      <p className="methodology-citation">框架参考 <a href="https://github.com/lobehub/awesome-rsi" target="_blank" rel="noreferrer">LobeHub Awesome RSI ↗</a> 的范围区分，以及 <a href="https://github.com/Prism-Shadow/awesome-rsi" target="_blank" rel="noreferrer">Prism-Shadow Awesome RSI ↗</a> 的方法与评测维度。后者的 RSI mode 指 Online / Offline，和本站“关联类型”不是同一维度。</p>
    </section>
    <section id="resources" className="resources-section"><div className="section-heading"><div><p className="overline">KEEP EXPLORING</p><h2>沿着来源，继续阅读。</h2></div><span className="section-index">02 / RESOURCES</span></div><p className="section-intro">论文库用于发现研究，逐篇解析回到原始论文核验。精选资源于 {formatDate(collectionUpdated)} 整理。</p><div className="resource-grid">{resources.map(r => <a key={r.url} href={r.url} target="_blank" rel="noreferrer"><span className="resource-kind">{r.kind}</span><h3>{r.name}<ArrowUpRight size={17}/></h3><p>{r.description}</p></a>)}</div></section>
  </main>;
}
