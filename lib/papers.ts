import data from '@/content/papers.json';
import taxonomyData from '@/content/taxonomy.json';
import { deepNotes } from '@/lib/notes';
import terminology from '@/content/terminology.json';
export const categories = ['All Papers', 'Model Evolution', 'Prompt & Context Evolution', 'Memory Evolution', 'Tool & Skill Evolution', 'Architecture Evolution'] as const;
export const categoryDescriptions: Record<string, string> = {
  'All Papers': '按 Update Target 浏览，独立筛选 Paper Type、Loop Role 与 Evidence。跨对象研究可出现在多个主题；外部产物与基础研究同样保留。',
  'Model Evolution': 'Model Parameters、Adapters 等的更新；Generator、Solver 和 Evaluator 的功能角色分别标注。',
  'Prompt & Context Evolution': '更新 Prompts、策略指令与 Context 构造方式；区别跨任务保留和当前任务的临时修订。',
  'Memory Evolution': '更新持久记录、经验组织与 Memory 管理方式，标明实际保留到哪一类后续任务。',
  'Tool & Skill Evolution': '生成、修订和复用 Tools、Skills 及调用接口；静态工具使用与可保留更新分开判断。',
  'Architecture Evolution': 'Agent Control、Workflow、Routing 与协作结构的更新；具体区分 Solver 和 Improver。',
};
export const paperTypes = ['All Types', 'Method', 'Survey', 'Theory', 'Benchmark', 'Empirical Analysis'];
export const loopRoles = ['All Roles', 'Solver', 'Experience Generator', 'Evaluator', 'Proposer', 'Selector', 'Integrator'];
export const evidenceTypes = ['All Evidence', 'Task Gain', 'Held-out Transfer', 'Recursive Reuse', 'Improver Quality Gain', 'Controlled Successor Gain', 'Negative Result', 'Theoretical Guarantee', 'Benchmark Measurement', 'Conceptual Synthesis', 'Feasibility Demonstration'];
export const retentionTypes = ['All Persistence', 'Ephemeral', 'Across Attempts', 'Across Tasks', 'Across Improvement Rounds', 'Across Training Updates', 'Not Applicable'];
export type Variant = {name:string; targets:string[]; roles:string[]; persistence:string; recursiveReuse:string; evidence:string[]; boundary:string; rationale:string; feedback:string; scope:string; source:string};
export type Taxonomy = {paperType:string; topics:string[]; reviewedAt:string; assessment:string; variants:Variant[]};
export type Paper = {
  id: string; title: string; en: string; authors: string; date: string;
  updated: string | null; version: string | null; category: string; keywords: string[];
  level: string; summary: string; problem: string; insight: string; observation: string;
  method: string; result: string; boundary: string; relation: string; outlook: string;
  mode: string; feedback: string; evidence: string; reviewedAt: string;
  sources: {label: string; url: string; basis: string}[]; taxonomy: Taxonomy;
};
export const papers: Paper[] = data.map(p => ({...p, taxonomy: (taxonomyData as Record<string, Taxonomy>)[p.id]}));
export const siteOrigin = 'https://boran002.github.io';
export const collectionUpdated = '2026-09-13';
export function formatDate(date: string) {return date.replaceAll('-', '.');}
export const legacyCategories: Record<string,string> = {
  '输出修订':'Output Refinement', '记忆与技能':'Memory & Skills', '模型与奖励':'Models & Rewards',
  '智能体与代码':'Agents & Code', '搜索与科研':'Search & Discovery', '评测与边界':'Evaluation & Limits', '综述与框架':'Surveys & Frameworks',
};
export function normalizeCategory(value: string | null): string {
  if (!value || value === '全部论文') return 'All Papers';
  return categories.find(c => c === value) ?? legacyCategories[value] ?? (Object.values(legacyCategories).includes(value) ? value : 'All Papers');
}
export function matchesCategory(p:Paper, category:string) {return category === 'All Papers' || p.taxonomy.topics.includes(category) || p.category === category;}
export type PaperFilters = {query:string; category:string; sort:string; type:string; role:string; evidence:string; retention:string; mode:string; page:number};
export const initialFilters: PaperFilters = {query:'', category:'All Papers', sort:'newest', type:'All Types', role:'All Roles', evidence:'All Evidence', retention:'All Persistence', mode:'all', page:1};
const searchIndex = new Map(papers.map(p => {
  const content = [p.title,p.en,p.authors,p.id,p.summary,p.problem,p.insight,p.method,p.result,p.boundary,p.relation,p.outlook,...p.keywords,JSON.stringify(p.taxonomy),JSON.stringify(deepNotes[p.id]?.sections ?? {})].join(' ').toLocaleLowerCase();
  const aliases = Object.entries({...terminology.categories,...terminology.terms}).filter(([term]) => content.includes(term.toLocaleLowerCase())).flatMap(([,words]) => words);
  return [p.id,content+' '+aliases.join(' ')] as const;
}));
export function filterPapers(filters: Partial<PaperFilters> = {}) {
  const f = {...initialFilters,...filters};
  const words=f.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return papers.filter(p => matchesCategory(p,normalizeCategory(f.category))
    && (f.type === 'All Types' || p.taxonomy.paperType === f.type)
    && (f.mode === 'all' || p.mode === f.mode)
    && p.taxonomy.variants.some(v => (f.category === 'All Papers' || !categories.some(c => c === f.category) || p.taxonomy.paperType !== 'Method' || v.targets.includes(f.category))
      && (f.role === 'All Roles' || v.roles.includes(f.role))
      && (f.evidence === 'All Evidence' || v.evidence.includes(f.evidence))
      && (f.retention === 'All Persistence' || v.persistence === f.retention))
    && words.every(w => {const arxivId = w.match(/^(?:arxiv:)?(\d{4}\.\d{4,5})(?:v\d+)?$/); return arxivId ? p.id === arxivId[1] : searchIndex.get(p.id)?.includes(w);}))
    .sort((a,b) => (f.sort === 'oldest' ? a.date.localeCompare(b.date) : f.sort === 'updated' ? (b.updated??b.date).localeCompare(a.updated??a.date) : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id));
}
