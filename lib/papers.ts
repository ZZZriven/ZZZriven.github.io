import data from '@/content/papers.json';
export const papers = data;
export type Paper = typeof papers[number];
export const categories = ['全部论文', '智能体进化', '自博弈与课程', '自训练与反馈', '理论与边界'] as const;
export const siteOrigin = 'https://zzzriven.github.io';
export const collectionUpdated = '2026-09-05';
export function formatDate(date:string){return date.replaceAll('-','.');}
export function filterPapers(query='',category='全部论文',sort='newest'){
 const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 return papers.filter(p=>(category==='全部论文'||p.category===category)&&words.every(w=>[p.title,p.en,p.authors,p.summary,p.id,p.level,p.category,...p.keywords].join(' ').toLocaleLowerCase().includes(w))).sort((a,b)=>sort==='oldest'?a.date.localeCompare(b.date):sort==='updated'?(b.updated??b.date).localeCompare(a.updated??a.date):b.date.localeCompare(a.date));
}
