# 个人主页

网站地址：https://zzzriven.github.io/

这是个人主页初版。按照要求，姓名、简介、学校 / 职位、研究方向、项目和联系方式均保留为“待填写”。

## 填写资料

- app/page.tsx：页面上的个人介绍、项目、联系方式。
- app/layout.tsx：浏览器标题与搜索引擎简介。
- app/globals.css：页面颜色、字体和排版。
- public/favicon.svg：网站图标。

联系方式尚未填写，因此页面没有不可用的邮箱或项目按钮。补充邮箱或项目地址后，再将对应文字改为链接。

## 本地预览

需要 Node.js 22.13 或以上版本。

~~~sh
npm ci
npm run dev
~~~

## 更新上线

~~~sh
npm run build:pages
git add app public scripts package.json package-lock.json docs
git commit -m "Update personal website"
git push
~~~

GitHub Pages 从 main 分支的 /docs 目录发布。每次更新源文件后，先执行 npm run build:pages，再将源文件和生成的 docs 一同提交。

docs/.nojekyll 必须保留，以便 GitHub 正确提供 _next 目录中的静态资源。无需购买域名或配置服务器。

## 技术

React + Vinext，导出为静态 HTML、CSS 和 JavaScript；无数据库、账号系统或访问统计。
