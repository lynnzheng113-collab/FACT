# FACT 交互原型 · 原版

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

本产品仅供电脑端使用。当前版本新增双语登录与角色化导航：管理员区分工作区外的平台管理和工作区内案件流程；用户／律师保留工作区选择、文档和审阅批次基础页面。


原型覆盖 57 项 P0 与 70 项 P1 的关键闭环：Workspace、Processing、Documents/Search、Analytics、Review、Imaging/Redact、Production/Export 和 Task Center。页面内保留对应的 REL 功能 ID。

这是前端演示状态，没有连接真实后端，也没有在真实 RelativityOne 租户中验证精确按钮位置和权限组合。

## 预览与协作

- 本地预览链接只在启动服务的电脑上有效：`http://127.0.0.1:5173/`。
- GitHub Pages 线上预览：<https://lynnzheng113-collab.github.io/FACT/>。
- GitLab 远程仓库需要 GitLab 凭据；GitLab Pages 地址以项目的 `Deploy → Pages` 配置为准。

## 撤回

本目录是 FACT 原型的 Git 仓库。若需要撤回某一轮改动，优先使用该轮提交的 `git revert <commit>`；未提交的修改可用 `git diff` 检查后再处理。按项目约定，只有你明确说“提交”时才创建 Git commit。

## 双版本隔离（2026-09-27）

- 本目录：`D:\Relativity\工作成果\04_交互原型\原版`，用途：保留完整参考原型并独立迭代。
- 两份均从 `965afa35dbf2dc639cdb38fca21461bfd95e187d` 开始，各自拥有完整 `.git`、源码、依赖与构建目录；没有共享 worktree、目录链接或硬链接。
- 双击本目录 `preview.cmd` 打开开发预览；也可执行 `npm.cmd run dev`。端口固定为 `5173`，占用时不会自动切换到另一版。
- 构建后运行 `npm.cmd run preview` 使用 `4173`；只运行 `npm.cmd run build` 不会启动预览。
- `preview.ps1` 会核对服务的版本和工程路径，只复用当前目录的实例。两套 URL 使用不同端口，浏览器本地存储也按来源分开。
- 保留现有 origin / gitlab 远程和 main 上游设置。
- 修改、安装依赖、构建、提交只在本目录执行，不自动同步另一份。本地“更新互不干扰”不代表将来接入同一后端后仍自动隔离；届时须分别配置数据/环境。
- 本次分离没有创建提交或推送；配置及说明的差异保留为待提交修改。
