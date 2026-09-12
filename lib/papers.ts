import data from '@/content/papers.json';
export const categories = ['全部论文', '输出修订', '记忆与技能', '模型与奖励', '智能体与代码', '搜索与科研', '评测与边界', '综述与框架'] as const;
export const categoryDescriptions: Record<string, string> = {
  '全部论文': '围绕核心研究问题浏览论文，并独立查看系统更新方式与证据。',
  '输出修订': '通过反馈与反思改写当前答案，关注推理阶段的改进。',
  '记忆与技能': '研究记忆、技能与上下文的组织和更新，逐篇说明是否在后续尝试或任务中保留。',
  '模型与奖励': '通过自训练、自博弈和自奖励，更新模型参数与学习信号。',
  '智能体与代码': '优化提示词、工作流、工具和智能体实现，包含自修改代码。',
  '搜索与科研': '研究进化搜索、程序发现与自动实验；区分外部产物优化和研究系统自身更新。',
  '评测与边界': '检查泛化、反馈可靠性、计算成本及自我改进的适用边界。',
  '综述与框架': '比较自进化与递归改进的定义、分类体系和研究议程。',
};
export const modes = [
  {value: 'all', label: '所有关联类型'},
  {value: 'refinement', label: '单次输出修订'},
  {value: 'persistent', label: '持久系统优化'},
  {value: 'recursive', label: '改进器自修改'},
  {value: 'enabling', label: '相关能力与产物优化'},
  {value: 'foundation', label: '综述、理论与评测'},
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
export const siteOrigin = 'https://zzzriven.github.io';
export const collectionUpdated = '2026-09-12';
export function formatDate(date: string) {return date.replaceAll('-', '.');}
export function modeLabel(mode: string) {return modes.find(m => m.value === mode)?.label ?? mode;}
export function filterPapers(query = '', category = '全部论文', sort = 'newest', mode = 'all') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return papers.filter(p => (category === '全部论文' || p.category === category)
    && (mode === 'all' || p.mode === mode)
    && words.every(w => [p.title, p.en, p.authors, p.summary, p.id, p.level, p.category, p.problem, p.insight, p.observation, p.method, p.result, p.boundary, p.relation, p.outlook, p.feedback, p.evidence, modeLabel(p.mode), ...p.keywords].join(' ').toLocaleLowerCase().includes(w)))
    .sort((a, b) => (sort === 'oldest' ? a.date.localeCompare(b.date) : sort === 'updated' ? (b.updated ?? b.date).localeCompare(a.updated ?? a.date) : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id));
}
