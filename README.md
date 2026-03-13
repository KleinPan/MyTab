# MyTab Portal

一个 iTab 风格的新标签页扩展（Chrome Manifest V3），支持**多门户热榜卡片墙**，并提供“可配置开关 + 拖拽排序”。

## 主要能力

- 门户热榜（卡片化展示，类似今日热榜聚合视图）
  - V2EX
  - 虎嗅
  - 36Kr
  - IT之家
  - 澎湃
  - 财联社
- 源配置面板：
  - 开关启用/禁用数据源
  - 拖拽排序数据源卡片
  - 配置持久化到 `chrome.storage.local`
- 倒数日（本地持久化）
- 待办事项（本地持久化）
- 快捷图标卡（本地持久化）

> 热榜数据抓取策略：直接面向门户网站页面内容抓取（通过 `r.jina.ai/http://目标站点` 做文本抽取），不是抓取 TopHub 站点。

## 本地调试

1. 打开 `chrome://extensions`
2. 开启开发者模式
3. 加载已解压扩展，选择本仓库目录

## CI 打包

使用仓库中的 `Build Browser Extension` workflow：

- `workflow_dispatch` 手动触发
- 推送到 `main` 或提交 PR 自动触发

产物：`mytab-lite.zip`
