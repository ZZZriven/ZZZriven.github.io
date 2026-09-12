/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation, including the standalone HTML animation. */
import { PelicanBackground } from '@/components/pelican-background';

export default function Home() {
  return <div className="personal-home">
    <PelicanBackground/>
    <main className="personal-shell">
    <div className="personal-top"><span>PERSONAL WEBSITE</span><span>ZZZriven.github.io</span></div>
    <div className="personal-body">
      <p className="overline">UNDER CONSTRUCTION</p>
      <h1>个人主页<span>。</span></h1>
      <p>个人信息待填写。</p>
      <nav className="personal-projects" aria-label="主页项目">
        <a href="/rsi/" className="personal-project">RSI Paper <span aria-hidden="true">↗</span></a>
        <a href="/pelican-cycling.html" className="personal-ride-link">去海边兜风 <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
    <footer className="personal-footer"><span>个人主页 · 内容待填写</span><span className="personal-motto">把日子，骑慢一点。</span></footer>
    </main>
  </div>;
}
