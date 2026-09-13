/* oxlint-disable nextjs/no-html-link-for-pages -- Static export uses native document navigation. */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, BookOpen, FileText } from 'lucide-react';
import { papers, formatDate } from '@/lib/papers';
import { deepNotes, sections, claimKinds } from '@/lib/notes';
export function generateStaticParams() {return papers.map(p => ({id:p.id}));}
export const dynamicParams = false;
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata> {
  const {id}=await params; const p=papers.find(p=>p.id===id);
  return p ? {title:p.en+' · RSI Paper',description:p.summary,alternates:{canonical:'/rsi/papers/'+id+'/'}} : {title:'论文未找到 · RSI Paper',robots:{index:false}};
}
const aliases:Record<string,string[]> = {'intuition':['insight'],'experiments':['results','observation'],'assumptions':['limits'],'follow-up':['outlook']};
export default async function PaperPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const p=papers.find(p=>p.id===id); if (!p) notFound();
  const note=deepNotes[id]; if (!note) throw new Error('Missing reviewed note: '+id);
  const source='https://arxiv.org/abs/'+id+(p.version??''); const pdf=source.replace('/abs/','/pdf/');
  const related=papers.filter(o=>o.id!==id && (o.taxonomy.topics.some(t=>p.taxonomy.topics.includes(t)) || o.taxonomy.paperType===p.taxonomy.paperType)).slice(0,3);
  return <main id="main" className="reading-main">
    <div className="reading-breadcrumb"><a href="/rsi/#library"><ArrowLeft size={14}/>All Papers</a><span>RESEARCH NOTE / {id}</span></div>
    <div className="reading-layout"><article className="reading-article">
      <header className="reading-header"><div className="reading-labels"><span className="category-tag">{p.taxonomy.paperType}</span>{p.taxonomy.topics.map(t=><a className="topic-tag" key={t} href={'/rsi/?category='+encodeURIComponent(t)+'#library'}>{t}</a>)}</div><h1>{p.en}</h1><p className="reading-english">{p.title}</p><p className="reading-authors">{p.authors}</p><div className="reading-dates"><span>Submitted <time dateTime={p.date}>{formatDate(p.date)}</time></span>{p.updated && <span>Verified Version <time dateTime={p.updated}>{formatDate(p.updated)}</time> · {p.version}</span>}<span>Note Updated <time dateTime={note.reviewedAt}>{formatDate(note.reviewedAt)}</time></span></div><div className="reading-links"><a className="rsi-button primary" href={source} target="_blank" rel="noreferrer"><BookOpen size={15}/>arXiv<ArrowUpRight size={14}/></a><a className="rsi-button" href={pdf} target="_blank" rel="noreferrer"><FileText size={15}/>Read PDF<ArrowUpRight size={14}/></a></div></header>
      <div className="reading-summary"><span className="overline">THE QUESTION WORTH READING</span><p>{p.summary}</p></div>
      <details className="classification-panel" id="rsi-relation"><summary>Classification &amp; RSI Relation <span>{p.taxonomy.variants.length} Variant{p.taxonomy.variants.length>1?'s':''} · Editorial Assessment</span></summary><p>主题标签用于检索；以下按实际 Experiment / Variant 判断更新对象与证据。Not Demonstrated 表示这项研究未提供相应证据。</p>{p.taxonomy.variants.map(v=><div className="variant-card" key={v.name}><h3>{v.name}</h3><dl><div><dt>Update Target</dt><dd>{v.targets.join(' · ')||'No persistent system target in this setting'}</dd></div><div><dt>Loop Role</dt><dd>{v.roles.join(' · ')||'Not Applicable'}</dd></div><div><dt>Persistence</dt><dd>{v.persistence}</dd></div><div><dt>Recursive Reuse</dt><dd>{v.recursiveReuse}</dd></div><div><dt>Evidence</dt><dd>{v.evidence.join(' · ')}</dd></div><div><dt>System Boundary</dt><dd>{v.boundary}</dd></div><div><dt>Feedback</dt><dd>{v.feedback}</dd></div><div><dt>Evidence Scope</dt><dd>{v.scope}</dd></div></dl><p className="classification-rationale">{v.rationale}</p><a href={v.source} target="_blank" rel="noreferrer">检查原文设置 ↗</a></div>)}</details>
      <div className="claim-legend" aria-label="信息类型说明">{Object.entries(claimKinds).map(([key,c])=><div key={key}><span className={'claim-label claim-'+key}>{c.label}</span><p>{c.description}</p></div>)}</div>
      <p className="reading-policy">Idea Reconstruction 是从已知背景出发的推演，不代表作者真实心理过程。Follow-up 是研究提案；相关工作比较不等于已证实 Novelty。教学示例与原文案例在正文中区分。</p>
      <details className="mobile-contents"><summary>Contents · 12 Questions</summary><nav aria-label="移动端论文目录">{sections.map((s,i)=><a key={s.id} href={'#'+s.id}>{String(i+1).padStart(2,'0')} {s.title}</a>)}</nav></details>
      <div className="reading-sections">{sections.map((s,i)=><section id={s.id} key={s.id}>{aliases[s.id]?.map(alias=><span className="anchor-alias" id={alias} key={alias}/>)}<span className="reading-section-number">{String(i+1).padStart(2,'0')}</span><div><h2>{s.title}</h2><p className="section-question">{s.question}</p>{note.sections[s.id].map((block,j)=><div className={'analysis-block analysis-'+block.kind} key={j}><span className={'claim-label claim-'+block.kind}>{claimKinds[block.kind].label}</span><p>{block.text}</p>{block.equation && <pre className="math-block" aria-label="数学表达式">{block.equation}</pre>}{block.refs?.length ? <div className="block-citations">{block.refs.map(ref=>{const n=note.references.findIndex(r=>r.id===ref);return <a key={ref} href={'#reference-'+ref} aria-label={'来源 '+(n+1)+': '+note.references[n]?.title}>[{n+1}]</a>;})}</div>:null}</div>)}</div></section>)}</div>
      <div className="reading-source" id="sources"><h2>Sources &amp; Verification</h2><p>{note.coverage}</p><ol>{note.references.map((r,i)=><li key={r.id} id={'reference-'+r.id}><a href={r.url} target="_blank" rel="noreferrer">[{i+1}] {r.title} ↗</a><span>{r.scope}</span></li>)}</ol><span>arXiv:{id} · {p.version} / REVIEWED {formatDate(note.reviewedAt)}</span></div>
      {related.length>0 && <section className="related-papers"><h2>Continue Reading</h2>{related.map(o=><a href={'/rsi/papers/'+o.id+'/'} key={o.id}>{o.en} ↗</a>)}</section>}<a className="reading-return" href="/rsi/#library"><ArrowLeft size={16}/>返回全部论文</a>
    </article><aside className="reading-sidebar"><div className="reading-sidebar-inner"><p className="overline">12 QUESTIONS</p><nav aria-label="论文阅读目录">{sections.map((s,i)=><a href={'#'+s.id} key={s.id}><span>{String(i+1).padStart(2,'0')}</span>{s.title}</a>)}<a href="#rsi-relation">Classification &amp; RSI Relation</a><a href="#sources">Sources &amp; Verification</a></nav></div></aside></div>
  </main>;
}
