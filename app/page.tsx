export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">跳转到正文</a>
      <div className="site-shell">
        <header className="sidebar">
          <a className="wordmark" href="#" aria-label="个人主页首页">me<span>.</span></a>
          <div className="sidebar-name">个人主页</div>
          <div className="sidebar-caption">Personal website</div>
          <nav aria-label="页面导航">
            <a href="#about"><span>01</span> 关于</a>
            <a href="#projects"><span>02</span> 项目</a>
            <a href="#contact"><span>03</span> 联系</a>
          </nav>
          <div className="sidebar-footnote">内容待填写</div>
        </header>
        <main id="main">
          <section id="about" className="intro" aria-labelledby="name">
            <div className="eyebrow"><span className="blue-dot" /> PERSONAL WEBSITE</div>
            <h1 id="name">姓名待填写<span className="name-period">.</span></h1>
            <p className="intro-lead">个人简介待填写</p>
            <p className="intro-copy">关于我的介绍待填写。</p>
            <a className="intro-link" href="#projects">浏览项目 <span aria-hidden="true">↓</span></a>
            <dl className="focus-list">
              <div><dt>学校 / 职位</dt><dd>待填写</dd></div>
              <div><dt>研究方向</dt><dd>待填写</dd></div>
            </dl>
          </section>
          <section id="projects" className="section" aria-labelledby="projects-title">
            <div className="section-title"><span className="section-number">02 /</span><h2 id="projects-title">项目</h2><span className="section-label">PROJECTS</span></div>
            <article className="project-card">
              <div className="project-topline"><span className="project-kind">SELECTED PROJECT</span><span className="project-state">待填写</span></div>
              <h3>项目名称待填写</h3>
              <p className="project-description">项目介绍待填写。</p>
              <div className="project-bottom"><span>项目链接待填写</span></div>
            </article>
          </section>
          <section id="contact" className="section contact" aria-labelledby="contact-title">
            <div className="section-title"><span className="section-number">03 /</span><h2 id="contact-title">联系</h2><span className="section-label">CONTACT</span></div>
            <dl className="contact-list">
              <div className="contact-row"><dt>EMAIL</dt><dd>邮箱待填写</dd></div>
              <div className="contact-row"><dt>GITHUB</dt><dd>GitHub 链接待填写</dd></div>
            </dl>
          </section>
          <footer><span>© 2026 个人主页</span><span>内容待填写</span></footer>
        </main>
      </div>
    </>
  );
}
