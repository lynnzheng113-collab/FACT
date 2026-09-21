# Relativity P0 + P1 交互原型

## 打开原型

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

修改后运行 `npm.cmd run build`，确认 TypeScript 和生产构建通过。

## 当前范围

原型覆盖 57 项 P0 与 70 项 P1 的关键闭环：Workspace、Processing、Documents/Search、Analytics、Review、Imaging/Redact、Production/Export 和 Task Center。页面内保留对应的 REL 功能 ID。

这是前端演示状态，没有连接真实后端，也没有在真实 RelativityOne 租户中验证精确按钮位置和权限组合。

## 撤回

当前 `D:\Relativity` 不是 Git 仓库。本次所有新增内容都在本目录；若需要撤回整次交付，可先将本目录移动到备份位置。以后初始化 Git 后，你说“提交”，即可按约定提交当前修改。
