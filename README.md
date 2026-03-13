# MyTab Portal

一个 iTab / 今日热榜风格的新标签页扩展（Chrome Manifest V3），支持多门户卡片流、开关控制和拖拽排序。

## 主要能力

- 热点聚合卡片墙（同时展示所有启用源）
  - V2EX
  - 虎嗅
  - 36Kr
  - IT之家
  - 澎湃
  - 财联社
- 源配置
  - 启用/禁用开关
  - 拖拽排序（从上到下）
  - 设置持久化到 `chrome.storage.local`
- 倒数日
- 待办事项
- 快捷图标卡

## 抓取策略

直接抓取门户网站页面（通过 `r.jina.ai/http://目标站点` 进行文本抽取），不是抓取 TopHub。

## 本地调试

1. 打开 `chrome://extensions`
2. 开启开发者模式
3. 加载已解压扩展，选择本仓库目录

## CI 打包

工作流：`Build Browser Extension`

- `workflow_dispatch` 手动触发
- 推送到 `main` 或提交 PR 自动触发

产物：`mytab-lite.zip`
