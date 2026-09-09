'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export function PelicanBackground() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const receivePlayback = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'pelican-playback' && typeof event.data.paused === 'boolean') {
        setPaused(event.data.paused);
      }
    };
    window.addEventListener('message', receivePlayback);
    frame.current?.contentWindow?.postMessage({ type: 'pelican-playback-request' }, window.location.origin);
    return () => {
      window.removeEventListener('message', receivePlayback);
    };
  }, []);

  const requestPlayback = () => frame.current?.contentWindow?.postMessage(
    { type: 'pelican-playback-request' }, window.location.origin,
  );

  const togglePlayback = () => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    frame.current?.contentWindow?.postMessage(
      { type: 'pelican-set-paused', paused: nextPaused }, window.location.origin,
    );
  };

  return <>
    <div className="pelican-background" aria-hidden="true">
      <iframe ref={frame} src="/pelican-cycling.html?background=1" title="鹈鹕的海岸骑行背景" tabIndex={-1} onLoad={requestPlayback}/>
      <div className="pelican-scrim"/>
    </div>
    <button className="pelican-motion-control" type="button" onClick={togglePlayback} aria-label={paused ? '播放背景动画' : '暂停背景动画'} aria-pressed={paused}>
      {paused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}
      <span>{paused ? '继续骑行' : '暂停动画'}</span>
    </button>
  </>;
}
