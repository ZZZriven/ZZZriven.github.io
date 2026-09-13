# 个人主页与 RSI Paper

- 个人主页：https://boran002.github.io/
- RSI Paper：https://boran002.github.io/rsi/
- 鹈鹕骑行：https://boran002.github.io/pelican-cycling.html

RSI Paper 保留原有全屏 DNA 粒子螺旋背景，以暖白底、深灰文字、鼠尾草绿与柔和金色统一导航、论文索引与详情页的视觉设计，收录 46 篇结构化中文论文解析。页面支持全文检索、七方向分类、RSI 关联类型、日期排序和筛选范围内的随机阅读。论文每页 12 篇；查询参数保留筛选条件及页码，可复制当前网址分享。筛选变化回到第一页，越界或无效页码会规范化，翻页后键盘焦点移至结果标题。

## 分类与来源

主分类：输出修订、记忆与技能、模型与奖励、智能体与代码、搜索与科研、评测与边界、综述与框架。每篇按主要研究问题归档，关键词补充交叉机制。

关联类型独立标注为 refinement（单次输出修订）、persistent（持久系统优化）、recursive（改进器自修改）、enabling（相关能力与产物优化）或 foundation（综述、理论与评测）。这些主标签区分更新方式和研究用途，不是能力高低排名；混合实验的不同更新范围在解析中分别说明。持久系统优化允许固定优化器，可限于跨尝试保留，跨任务迁移以证据为准。改进器自修改要求明确改变接管后续改进的程序或策略，不能仅凭论文题名或模型与奖励共同训练判定。

论文直接在 arXiv 检索和核验，当前 46 篇的题名、首次提交日期、版本和修订日期已用 arXiv 元数据交叉核对。所有论文引用仅指向 arXiv 摘要、PDF 或正文。站内提供三条主题阅读路径。

`content/papers.json` 每篇包含：

- `id / title / en / authors`：arXiv ID、中文标题、原题、作者。
- `date / updated / version`：首次提交和已核实版本。未核实修订信息为 null；“修订排序”对 null 回退首次日期。
- `category / mode / level / keywords`：主分类、关联类型、改进对象、关键词。
- `summary / problem / insight / observation / method / result / boundary / relation / outlook`：摘要、Research problem、Insight、Observation、Method、结果、局限、RSI 关联与展望。
- `feedback / evidence`：反馈来源与证据边界。
- `reviewedAt / sources`：整理日期和实际阅读来源。每个来源的 `basis` 写明摘要、正文相关章节的核验范围。

洞察、局限分析、关联分类和未来展望包含编辑判断，页面明确标注。不要把局部实验分数或输出自反馈写成完整 RSI 证据；数据集子集、成本和迁移范围应具体说明。当前为人工维护的精选论文库，不是实时全量索引。

## 编辑入口

- `components/rsi/library.tsx`：检索、分类导航、方法论和站内阅读路径。
- `lib/papers.ts`：数据类型、分类说明和组合筛选。
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
npx tsc --noEmit
npm run lint
npm run build:pages
```

GitHub Pages 从 main 的 `/docs` 发布。构建会校验所有预期路由，再更新 docs 并保留 `.nojekyll`。提交源码及构建产物后推送 main 即可发布。生产页面可通过独立网址打开或刷新，无需后端。

验证应覆盖所有论文静态路由、原文及站内链接、桌面/手机排版、分类与关联类型组合、全文检索、无结果重置和 URL 恢复。WebMCP `search_papers` 保留为可选增强，不影响普通浏览器手动使用。

## 个人主页与素材

个人主页继续使用鹈鹕海岸骑行动画，其源文件为 `public/pelican-cycling.html`。首页通过 `?background=1` 复用，保留暂停、减少动态效果和独立页面入口。RSI 页面在桌面加载原有静音 DNA 螺旋视频，并提供暂停/继续按钮；手机、节省流量和减少动态效果模式使用原始静态封面，页面切到后台时暂停播放。

`public/fonts/` 为本地 Inter 拉丁字体及 OFL 许可；中文使用系统字体。DNA 背景素材位于 `public/media/`，首页与论文详情共用。原始媒体文件保持不变，视频与静态封面应用相同的 CSS 浅色滤镜和奶油色遮罩；论文正文使用不透明暖白纸面，动画不会透过文字区域。

### 验证说明

每次界面更新后应重新执行生产静态导出、TypeScript、修改文件的 oxlint，以及上述浏览器检查，再记录当次结果。全仓 lint 的既有问题应与本次修改产生的问题分别记录。生成的 `docs/` 已从源码 lint 中排除。

本轮验证（2026-09-12）：生产导出 48 页、TypeScript、本次修改文件 oxlint 和浏览器检查通过。覆盖全部 46 个详情页、四页论文不重复不遗漏、分页网址恢复、无效页码、筛选与搜索重置、排序、随机范围、键盘焦点、弹窗浅色主题与 Escape、DNA 播放暂停及减少动态效果。320、360、390、600、601、768、850、1024、1440 像素下的列表与详情无水平溢出，无运行时异常或资源失败。全仓先前已知的 20 个 lint 问题未纳入本轮修改。
