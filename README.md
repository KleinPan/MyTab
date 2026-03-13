# MyTab Portal

一个偏 iTab 风格的新标签页扩展（Chrome Manifest V3）：保留常用效率模块，并直接抓取多个门户站点热榜数据。

## 功能

- 门户热榜聚合（非 TopHub 二次抓取）：
  - 知乎热榜 API
  - B 站热门 API
  - 微博热搜 API
- 倒数日（本地持久化）
- 待办事项（本地持久化）
- 快捷图标卡（本地持久化）

## 本地使用

1. 打开 `chrome://extensions`
2. 开启开发者模式
3. 选择“加载已解压的扩展程序”并指向本目录

## CI 打包

仓库已提供 `Build Browser Extension` 工作流：

- `workflow_dispatch` 手动触发
- push 到 `main` 或发起 PR 自动触发

产物为 `mytab-lite.zip`，可下载后安装验证。
