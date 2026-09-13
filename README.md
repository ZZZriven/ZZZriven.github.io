# 个人主页与 RSI Paper

- 个人主页：https://boran002.github.io/
- RSI Paper：https://boran002.github.io/rsi/
- 鹈鹕骑行：https://boran002.github.io/pelican-cycling.html

RSI Paper 保留原有全屏 DNA 粒子螺旋背景，以暖白底、深灰文字、鼠尾草绿与柔和金色统一导航、论文索引与详情页的视觉设计，收录 46 篇结构化中文论文解析。页面支持解析全文检索、五个可重叠 Evolution Targets、Paper Type / Loop Role / Evidence / Persistence 独立筛选、日期排序和筛选范围内的随机阅读。arXiv ID 精确匹配对应论文。论文每页 12 篇；查询参数保留筛选条件及页码，可复制当前网址分享。筛选变化回到第一页，越界或无效页码会规范化，翻页后键盘焦点移至结果标题。

## 分类与来源

Operational Definition：在明确的 System Boundary 内，系统利用 Feedback 持久更新承担后续改进功能的组件，更新后的组件重新参与生成学习经验、提出、评价、选择或整合后续版本。分别判断 Persistent Update、Recursive Mechanism 和 Demonstrated Recursive Gain；结构性反馈不代表已经证明改进能力提高。

五个 Targets 为 Model Evolution、Prompt & Context Evolution、Memory Evolution、Tool & Skill Evolution、Architecture Evolution。Paper Type 独立区分 Method、Survey、Theory、Benchmark 和 Empirical Analysis。当前 46 篇记录为 52 个 Experiment / Variant；跨轴筛选必须匹配同一个 Variant，避免把不同实验的属性拼接。具体标准见 [TAXONOMY.md](scripts/TAXONOMY.md)。旧分类与 mode 参数仅用于保持历史链接可用。

所有 46 篇提供十二部分解析，共 552 个章节，包括背景、已有缺口、Idea Reconstruction、Intuition、完整 Pipeline、数学基础、实验逻辑、Takeaways、脆弱假设、一周复现、Counterexample 和 Follow-up。每段区分 Paper Claim、Prior Work、Inference、Hypothesis；所有引用固定来源版本。思路重建不代表作者真实心理过程，教学例子与原文案例分别说明，Follow-up 的新颖性保持待验证。详细写作标准见 [PAPER_READING_GUIDE.md](scripts/PAPER_READING_GUIDE.md)。

三份数据按 arXiv ID 对齐：

- `content/papers.json`：题名、作者、提交及版本日期、短摘要；旧 category / mode 与短解析字段保留兼容。
- `content/taxonomy.json`：Paper Type、Topics、逐 Variant 的 Target / Role / Persistence / Recursive Reuse / Evidence、边界、反馈、判定依据与原文。
- `content/deep-notes.json`：十二项完整解析、四类信息标记、固定版本引用和实际核验范围。

arXiv Feed 每天 09:00 Asia/Singapore 通过当前任务中的自动化收集；运行依赖电脑和 Codex 在线。Feed 初筛仅提供 Provisional Topics / Paper Type，无法判定时保留 Unclassified。完成原文核验和十二项解析后才进入精选集合。失败不覆盖最近成功的记录；无成功记录时明确显示 Awaiting first successful sync。运行流程见 [ARXIV.md](scripts/ARXIV.md)。

## 编辑入口

- `components/rsi/library.tsx`：检索、分类导航、方法论和站内阅读路径。
- `lib/papers.ts`：数据类型、分类说明和组合筛选。
- `lib/notes.ts`：十二项解析与四类信息 Schema。
- `components/rsi/methodology.tsx`：RSI 工作定义、分类标准和边界案例。
- `app/rsi/papers/[id]/page.tsx`：论文详情和静态路由。
- `app/rsi/rsi.css`：RSI 界面配色及响应式布局。
- `app/rsi/dna-background.css`：原始 DNA 背景、遮罩及阅读区域对比度。
- `app/globals.css`：公共基础与个人主页样式。
- `components/rsi/site-frame.tsx`：导航、页脚、关于弹窗。
- `lib/site.ts`：维护者联系信息。

更新论文后同步 `lib/papers.ts` 的实际整理日期。新增论文自动加入详情页导出与 sitemap。原有十篇 ID 和网址保持可用。

## 预览与发布

需要 Node.js 22.13 或以上。

```sh
npm ci
npm run dev
npm run check:papers
npm run test:arxiv
npx tsc --noEmit
npm run lint
npm run build:pages
```

GitHub Pages 从 main 的 `/docs` 发布。构建会校验所有预期路由，再更新 docs 并保留 `.nojekyll`。提交源码及构建产物后推送 main 即可发布。生产页面可通过独立网址打开或刷新，无需后端。

验证应覆盖所有论文静态路由、原文及站内链接、桌面/手机排版、跨 Variant 分类轴组合、全文检索、无结果重置和 URL 恢复。WebMCP `search_papers` 保留为可选增强，不影响普通浏览器手动使用。

## 个人主页与素材

个人主页继续使用鹈鹕海岸骑行动画，其源文件为 `public/pelican-cycling.html`。首页通过 `?background=1` 复用，保留暂停、减少动态效果和独立页面入口。RSI 页面在桌面加载原有静音 DNA 螺旋视频，并提供暂停/继续按钮；手机、节省流量和减少动态效果模式使用原始静态封面，页面切到后台时暂停播放。

`public/fonts/` 为本地 Inter 拉丁字体及 OFL 许可；中文使用系统字体。DNA 背景素材位于 `public/media/`，首页与论文详情共用。原始媒体文件保持不变，视频与静态封面应用相同的 CSS 浅色滤镜和奶油色遮罩；论文正文使用不透明暖白纸面，动画不会透过文字区域。

### 验证说明

每次界面更新后应重新执行生产静态导出、TypeScript、修改文件的 oxlint，以及上述浏览器检查，再记录当次结果。全仓 lint 的既有问题应与本次修改产生的问题分别记录。生成的 `docs/` 已从源码 lint 中排除。

本轮验证（2026-09-13）：生产导出 48 页、TypeScript、修改文件 oxlint、22 项 Collector 测试及数据完整性检查通过。浏览器检查覆盖 46 个详情页的十二项解析与引用、52 个 Variant、独立分类轴及同一 Variant 约束、全文与精确 ID 搜索、历史链接和 URL 恢复、四页论文不重复不遗漏、随机范围、键盘焦点、浅色弹窗及 DNA 动画。320–1440 像素的九档宽度无水平溢出。此前全仓已知的 20 个无关 lint 问题未纳入本轮修改。实际 Collector 尝试遇到超时及 HTTP 429，未改写 feed 的成功时间。
