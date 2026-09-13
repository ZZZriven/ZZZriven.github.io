import data from '@/content/deep-notes.json';
export const sections = [
 {id:'problem',title:'Research Problem & Background',question:'问题为什么重要，解决它有什么价值？'},
 {id:'prior-work',title:'Prior Work & Research Gap',question:'前人做到哪一步，缺口在哪里？'},
 {id:'idea-reconstruction',title:'Idea Reconstruction',question:'从已有知识与失败模式出发，如何走到这个想法？'},
 {id:'intuition',title:'Core Intuition',question:'用一个清楚的视角抓住方法本质。'},
 {id:'method',title:'Method & Worked Example',question:'沿着输入、处理、输出走完 Pipeline。'},
 {id:'mathematics',title:'Mathematical Foundations',question:'从符号、直觉与简单例子理解理论。'},
 {id:'experiments',title:'Experiments & Claims',question:'Research Question → Experiment → Answer'},
 {id:'takeaways',title:'Takeaways',question:'这篇论文改变了哪些判断？'},
 {id:'assumptions',title:'Most Fragile Assumption',question:'哪一个假设失效会动摇方法？'},
 {id:'reproduction',title:'One-Week Reproduction',question:'用一周检验一个最小且明确的命题。'},
 {id:'counterexample',title:'Counterexample Design',question:'如何构造有辨识力的反例？'},
 {id:'follow-up',title:'Follow-up Research',question:'从缺陷与需求推导新的研究问题。'},
] as const;
export type ClaimKind = 'paper' | 'prior' | 'inference' | 'hypothesis';
export const claimKinds:Record<ClaimKind,{label:string;description:string}> = {
 paper:{label:'Paper Claim',description:'原论文明确提出或报告的内容'},
 prior:{label:'Prior Work',description:'相关文献中已有的知识与结论'},
 inference:{label:'Inference',description:'基于证据的解释、重建或教学推演'},
 hypothesis:{label:'Hypothesis',description:'待验证的猜测、实验计划或新研究提案'},
};
export type Block = {kind:ClaimKind; text:string; refs?:string[]; equation?:string};
export type Note = {reviewedAt:string; coverage:string; sections:Record<string,Block[]>; references:{id:string;title:string;url:string;scope:string}[]};
export const deepNotes = data as Record<string,Note>;
