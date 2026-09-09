export default function Home() {
  return <main className="personal-shell">
    <div className="personal-top"><span>PERSONAL WEBSITE</span><span>ZZZriven.github.io</span></div>
    <div className="personal-body">
      <p className="overline">UNDER CONSTRUCTION</p>
      <h1>个人主页<span>。</span></h1>
      <p>个人信息待填写。</p>
      <a href="/rsi/" className="personal-project">RSI 观察站 <span aria-hidden="true">↗</span></a>
      <a href="/pelican-cycling.html" className="personal-project" style={{ marginTop: 12 }}>慢慢骑 · 鹈鹕的海岸骑行 <span aria-hidden="true">↗</span></a>
    </div>
    <footer className="personal-footer">个人主页 · 内容待填写</footer>
  </main>;
}
