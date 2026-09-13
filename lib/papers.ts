import data from '@/content/papers.json';
import terminology from '@/content/terminology.json';
export const categories = ['All Papers', 'Output Refinement', 'Memory & Skills', 'Models & Rewards', 'Agents & Code', 'Search & Discovery', 'Evaluation & Limits', 'Surveys & Frameworks'] as const;
export const categoryDescriptions: Record<string, string> = {
  'All Papers': '围绕 Research Problem 浏览论文，并独立查看系统更新方式与证据。',
  'Output Refinement': '通过 feedback 与 reflection 改写当前答案，关注 inference-time 的改进。',
  'Memory & Skills': '研究 memory、skills 与 context 的组织和更新，逐篇说明是否在后续尝试或任务中保留。',
  'Models & Rewards': '通过 self-training、self-play 和 self-rewarding，更新 model parameters 与学习信号。',
  'Agents & Code': '优化 prompt、workflow、tools 和 Agent 实现，包含代码 self-modification。',
  'Search & Discovery': '研究 evolutionary search、program discovery 与自动实验；区分外部产物优化和研究系统自身更新。',
  'Evaluation & Limits': '检查 generalization、feedback 可靠性、compute cost 及 self-improvement 的适用边界。',
  'Surveys & Frameworks': '比较 Self-Evolution 与 Recursive Self-Improvement 的定义、taxonomy 和研究议程。',
};
export const modes = [
  {value: 'all', label: 'All Relations'},
  {value: 'refinement', label: 'Output Refinement'},
  {value: 'persistent', label: 'Persistent System Improvement'},
  {value: 'recursive', label: 'Improver Self-Modification'},
  {value: 'enabling', label: 'Enabling Methods & Artifacts'},
  {value: 'foundation', label: 'Surveys, Theory & Evaluation'},
] as const;
export type Mode = Exclude<typeof modes[number]['value'], 'all'>;
export type Paper = {
  id: string; title: string; en: string; authors: string; date: string;
  updated: string | null; version: string | null; category: string; keywords: string[];
  level: string; summary: string; problem: string; insight: string; observation: string;
  method: string; result: string; boundary: string; relation: string; outlook: string;
  mode: Mode; feedback: string; evidence: string; reviewedAt: string;
  sources: {label: string; url: string; basis: string}[];
};
export const papers = data as Paper[];
export const siteOrigin = 'https://boran002.github.io';
export const collectionUpdated = papers.reduce((latest, p) => p.reviewedAt > latest ? p.reviewedAt : latest, '');
export function formatDate(date: string) {return date.replaceAll('-', '.');}
export function modeLabel(mode: string) {return modes.find(m => m.value === mode)?.label ?? mode;}
export function normalizeCategory(value: string | null): typeof categories[number] {
  return categories.find(c => c === value) ?? categories.find(c => (terminology.categories as Record<string, string[]>)[c]?.includes(value ?? '')) ?? 'All Papers';
}
const searchIndex = new Map(papers.map(p => {
  const content = [p.title, p.en, p.authors, p.summary, p.id, p.level, p.category, p.problem, p.insight, p.observation, p.method, p.result, p.boundary, p.relation, p.outlook, p.feedback, p.evidence, modeLabel(p.mode), ...p.keywords].join(' ').toLocaleLowerCase();
  const aliases = Object.entries({...terminology.categories, ...terminology.terms}).filter(([term]) => content.includes(term.toLocaleLowerCase())).flatMap(([, words]) => words);
  return [p.id, content + ' ' + aliases.join(' ')] as const;
}));
export function filterPapers(query = '', category = 'All Papers', sort = 'newest', mode = 'all') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const canonicalCategory = normalizeCategory(category);
  return papers.filter(p => (canonicalCategory === 'All Papers' || p.category === canonicalCategory)
    && (mode === 'all' || p.mode === mode)
    && words.every(w => searchIndex.get(p.id)?.includes(w)))
    .sort((a, b) => (sort === 'oldest' ? a.date.localeCompare(b.date) : sort === 'updated' ? (b.updated ?? b.date).localeCompare(a.updated ?? a.date) : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id));
}
