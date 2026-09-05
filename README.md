# 个人主页与 RSI 观察站

- 个人主页：https://zzzriven.github.io/
- RSI 观察站：https://zzzriven.github.io/rsi/

个人主页保留简洁空壳，个人资料待填写。RSI 观察站提供午夜蓝与琥珀金的进化首屏、纸白阅读区、可选深色阅读模式、中文论文速读、搜索、四类研究方向、日期排序及随机阅读。

## 更新论文

编辑 content/papers.json。每篇包含：

- id：arXiv 编号，同时作为文章网址，必须唯一。
- title / en / authors：中文标题、英文原题、作者。
- date / updated / version：首次提交日期、核对过的修订日期与版本。没有核对的修订信息保留 null。
- category：智能体进化、自博弈与课程、自训练与反馈、理论与边界。
- keywords / level：检索关键词、具体改进对象。
- summary / problem / method / result：摘要速读、问题、方法与论文报告的结果。
- boundary / relation：本站阅读提醒与 RSI 关联判断。

结果数字应在原始来源核实。自反馈、答案修订与完整递归自我改进不能混为一谈。当前为人工维护的精选起始库，未启用自动抓取。

修改 lib/papers.ts 中的 collectionUpdated 为实际整理日期。

## 修改个人主页、署名或外观

- app/page.tsx：个人主页空壳及 RSI 入口。
- lib/site.ts：RSI 观察站的维护者姓名与联系邮箱。
- app/globals.css：全站色彩、阅读主题、响应式布局。
- components/rsi/library.tsx：论文检索与列表。
- components/rsi/evolution-hero.tsx：视频背景、研究方向入口、概念流程和动效控制。
- app/rsi/papers/[id]/page.tsx：文章详情及静态页面生成。
- app/rsi/layout.tsx：RSI 站标题、简介和作者信息。

## 本地预览与发布

需要 Node.js 22.13 或以上版本。

~~~sh
npm ci
npm run dev
~~~

打开开发服务器输出地址下的 /rsi/。

更新并发布：

~~~sh
npm run build:pages
git add app components content lib public scripts docs
git commit -m "Update RSI observatory"
git push
~~~

GitHub Pages 从 main 分支的 /docs 目录发布。构建后必须将生成的 docs 一起提交，包含所有论文详情页及静态资源。docs/.nojekyll 必须保留。

静态首页、论文库和每个详情页均可通过独立网址打开或刷新，不需要服务器。新增论文时会生成对应页面和网站地图。

## 验证

发布前执行生产构建和 TypeScript 检查，并检查所有静态路由、资源、论文日期排序及搜索分类行为。该项目未进行浏览器视觉测试。

搜索功能保留可选的 WebMCP 接口，普通浏览器不支持时不影响手动操作。当前环境未提供可用于本轮验证的 WebMCP 上下文，因此不宣称该接口已在本轮浏览器中验证。

## 技术

React + Vinext 静态导出，使用 GitHub Pages 托管。无数据库、登录系统或访问统计。深浅主题偏好仅保存在浏览器本地。

## 进化首屏与素材

视频来自用户提供的设计参考，用作进化的视觉隐喻。它不代表本站运行了 AI 训练或真实的改进过程。

参考视频：
https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_044635_8daabe05-1a5c-491c-920f-4b0bd8f04812.mp4

- public/media/evolution-loop.mp4：8 秒静音 H.264 视频，720p，约 1.8 MB。
- public/media/evolution-poster.jpg：同一素材的静态封面。
- public/fonts/：本地托管的 Inter 拉丁字体与 OFL 许可；中文使用系统字体回退。

视频仅在桌面宽度、不要求减少动态效果且未开启节省流量时加载；离开视口或切换到后台会暂停。播放失败保留静态封面。四张研究方向卡片会清除搜索词、选择相应分类并定位到论文库，数量直接由论文数据计算。

默认阅读区为纸白色；顶部开关切换到深色阅读模式。个人主页仍保留空壳。
