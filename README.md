# Relativity P0 + P1 交互原型

## 打开原型

最简单的方式：双击项目根目录的 `preview.cmd`。它会启动本地服务并打开固定预览地址：

`http://127.0.0.1:5173/`

也可以手动运行：

开发模式：

```powershell
npm.cmd run dev
```

浏览器打开命令输出的本地地址。生产构建：

```powershell
npm.cmd run build
```

构建结果在 `dist`。

## 常用修改位置

- 所有界面文案、双语样例数据、状态、功能 ID：`src/constants/copy.ts`
- 所有颜色、间距、尺寸、字号：`src/styles/vars.css`
- 页面布局与交互：`src/pages/`
- 全局导航和弹层：`src/components/`
- 组件样式：`src/styles/app.css`

更完整的维护说明：

- 文案与版本：`docs/CONTENT_AND_VERSIONING.md`
- 交互地图：`docs/INTERACTION_MAP.md`

修改后运行 `npm.cmd run build`，确认 TypeScript 和生产构建通过。

## 当前范围

原型覆盖 57 项 P0 与 70 项 P1 的关键闭环：Workspace、Processing、Documents/Search、Analytics、Review、Imaging/Redact、Production/Export 和 Task Center。页面内保留对应的 REL 功能 ID。

这是前端演示状态，没有连接真实后端，也没有在真实 RelativityOne 租户中验证精确按钮位置和权限组合。

## 预览与协作

- 本地预览链接只在启动服务的电脑上有效。
- 合作方的稳定链接需要公司 GitLab 管理员启用 GitLab Pages；启用后从项目的 `Deploy → Pages` 获取地址。
- 当前项目是私有项目，合作方需要先被加入 GitLab 项目成员。

## 撤回

本目录是 FACT 原型的 Git 仓库。若需要撤回某一轮改动，优先使用该轮提交的 `git revert <commit>`；未提交的修改可用 `git diff` 检查后再处理。按项目约定，只有你明确说“提交”时才创建 Git commit。
