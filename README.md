# MyTab Lite

一个轻量版浏览器新标签页扩展（Chrome Manifest V3），风格参考 TopHub / iTab，并聚焦**单一热点数据源**。

## 功能

- 热榜：默认尝试抓取 `tophub.today`（通过 `r.jina.ai` 代理文本化抓取），失败时自动回退示例数据。
- 倒数日：本地持久化。
- 待办事项：本地持久化，支持勾选完成和删除。
- 图标卡：快捷导航，支持重置默认。

## 本地加载

1. 打开 Chrome 扩展管理页：`chrome://extensions`
2. 开启“开发者模式”
3. 选择“加载已解压的扩展程序”，指向本仓库目录

## 触发 CI 打包

仓库包含 `Build Browser Extension` workflow，可通过以下方式触发：

- 在 GitHub Actions 页面手动触发 `workflow_dispatch`
- 推送到 `main` 或提交 PR 时自动触发

CI 会输出 `mytab-lite.zip` 产物，可直接用于安装验证。
