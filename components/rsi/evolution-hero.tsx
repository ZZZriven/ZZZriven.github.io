'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, GitBranch, Layers3, Pause, Play, Repeat2, ScanLine } from 'lucide-react';
import { papers, formatDate, collectionUpdated } from '@/lib/papers';

const directions = [
  { name: '智能体进化', en: 'AGENT EVOLUTION', description: '改写代码、工具与工作流。', Icon: GitBranch },
  { name: '自博弈与课程', en: 'SELF-PLAY & CURRICULA', description: '让任务与能力共同演化。', Icon: Repeat2 },
  { name: '自训练与反馈', en: 'LEARNING & FEEDBACK', description: '从自身生成的反馈中学习。', Icon: Layers3 },
  { name: '理论与边界', en: 'THEORY & LIMITS', description: '探究改进成立的条件。', Icon: ScanLine },
];

export function EvolutionHero({ onSelect }: {onSelect: (category: string) => void}) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [inView, setInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(min-width: 800px) and (prefers-reduced-motion: no-preference)');
    const connection = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection;
    const updatePreference = () => setMotionAllowed(preference.matches && !connection?.saveData);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updatePreference(); updateVisibility();
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setHasEntered(true);
    }, {threshold: 0.05}) : null;
    if (!observer) {setInView(true); setHasEntered(true);}
    if (section.current) observer?.observe(section.current);
    return () => {
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
      observer?.disconnect();
    };
  }, []);

  const playing = motionAllowed && inView && pageVisible && !paused && !failed;
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (playing) { void element.play().catch(() => setPaused(true)); }
    else element.pause();
  }, [playing]);

  return <section ref={section} className="evolution-hero" aria-labelledby="evolution-heading" data-playing={playing} data-entered={hasEntered}>
    <div className="evolution-media" aria-hidden="true">
      <img className="evolution-poster" src="/media/evolution-poster.jpg" alt="" width="1600" height="900" fetchPriority="high"/>
      {motionAllowed && hasEntered && !failed && <video ref={video} className={ready ? 'evolution-video is-ready' : 'evolution-video'} src="/media/evolution-loop.mp4" poster="/media/evolution-poster.jpg" autoPlay muted loop playsInline preload="metadata" onPlaying={() => setReady(true)} onError={() => {setFailed(true); setReady(false);}}/>}
    </div>
    <div className="evolution-scrim" aria-hidden="true"/>
    <div className="evolution-topline"><span><i/> AN OBSERVATORY FOR EVOLVING INTELLIGENCE</span>{motionAllowed && !failed && <button className="motion-control" type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? '播放背景动画' : '暂停背景动画'} aria-pressed={paused}>{paused ? <Play size={13}/> : <Pause size={13}/>}<span>{paused ? '播放动效' : '暂停动效'}</span></button>}</div>
    <div className="evolution-content">
      <div className="evolution-statement"><p className="hero-kicker">RECURSIVE SELF-IMPROVEMENT</p><h1 id="evolution-heading">追踪智能的<br/><em>自我进化。</em></h1><p className="evolution-description">从系统自修改，到模型自训练。<br/>读懂每次迭代的机制、证据与边界。</p><a className="explore-papers" href="#papers">进入论文库 <ArrowDown size={17}/></a>
        <div className="evolution-window"><span className="rsi-monogram" aria-hidden="true">RSI<span>↗</span></span><div><span>递归自我改进</span><p>改进系统，<br/>也探索如何改进“改进过程”。</p></div></div>
      </div>
      <div className="research-directions"><div className="directions-label"><span>FOUR PATHS OF INQUIRY</span><span>研究路径 / 04</span></div><div className="direction-grid">{directions.map(({name, en, description, Icon}, index) => <button key={name} type="button" className={'direction-card direction-' + index} onClick={() => onSelect(name)} aria-label={'浏览' + name + '论文'}><div className="direction-top"><Icon size={23} strokeWidth={1.35}/><span>0{index + 1}</span></div><div className="direction-copy"><span className="direction-en">{en}</span><h2>{name}</h2><p>{description}</p></div><div className="direction-bottom"><span>{String(papers.filter(p => p.category === name).length).padStart(2, '0')} 篇论文</span><span className="direction-arrow"><ArrowUpRight size={16}/></span></div></button>)}</div></div>
    </div>
    <div className="evolution-foot"><div className="loop-caption"><span>改进循环</span><small>概念示意</small></div><ol className="iteration-loop">{['提出修改', '执行与评估', '保留有效变化', '继续迭代'].map((label, index) => <li key={label}><span className="loop-step">0{index + 1}</span>{label}{index < 3 && <span className="loop-arrow" aria-hidden="true">→</span>}</li>)}</ol><span className="metaphor-label">EVOLUTION AS A METAPHOR</span></div>
    <div className="hero-meta"><span><strong>{papers.length}</strong> 篇精选研究<span className="meta-separator">/</span>持续整理中的阅读索引</span><span>最近整理 <time dateTime={collectionUpdated}>{formatDate(collectionUpdated)}</time></span></div>
  </section>;
}
