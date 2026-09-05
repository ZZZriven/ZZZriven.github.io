'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export function EvolutionBackground() {
  const video = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
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
    return () => {
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const playing = motionAllowed && pageVisible && !paused && !failed;
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let active = true;
    if (playing) void element.play().catch(() => {if (active) setPaused(true);});
    else element.pause();
    return () => {active = false; element.pause();};
  }, [playing]);

  return <>
    <div className="evolution-background" aria-hidden="true">
      <img className="evolution-poster" src="/media/evolution-poster.jpg" alt="" width="1600" height="900" fetchPriority="high"/>
      {motionAllowed && !failed && <video ref={video} className={ready ? 'evolution-video is-ready' : 'evolution-video'} src="/media/evolution-loop.mp4" poster="/media/evolution-poster.jpg" muted loop playsInline preload="metadata" onPlaying={() => setReady(true)} onError={() => {setFailed(true); setReady(false);}}/>}
      <div className="evolution-scrim"/>
    </div>
    {motionAllowed && !failed && <button className="motion-control" type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? '播放背景动画' : '暂停背景动画'} title={paused ? '播放背景动画' : '暂停背景动画'} aria-pressed={paused}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>}
  </>;
}
