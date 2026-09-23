# 文案与版本维护 / Content & Versioning

## 日常修改入口

| 要改的内容 | 文件 | 说明 |
| --- | --- | --- |
| 页面标题、按钮、提示、表头、双语演示数据、可见数字 | `src/constants/copy.ts` | 所有用户可见文案的唯一入口 |
| 颜色、间距、字号、控件尺寸 | `src/styles/vars.css` | 先改变量，再由样式引用 |
| 页面布局与页面内交互 | `src/pages/` | 按页面名查找，例如 `ReviewPage.tsx` |
| 全局导航、通知、帮助、用户菜单 | `src/components/AppShell.tsx` | 影响所有页面 |
| 通用按钮、表单、弹层、表格控件 | `src/components/UI.tsx` | 影响多个页面 |
| 通用样式 | `src/styles/app.css` | 仅在变量不足时修改 |

## 版本规则

1. 每轮涉及产品内容或交互的修改，先更新 `src/constants/copy.ts` 中的 `copy.meta.version`。
2. 在本文件底部追加一条版本记录，写清楚改了什么、影响哪些页面、如何验证。
3. 不把可见文案直接写进 JSX、CSS 或交互逻辑。
4. 演示数据也属于可见内容，统一放在 `copy.ts`。

## 版本记录

### v0.1 · 2026-09-21

- 初始 P0 + P1 交互原型。
- 覆盖 Workspace、Processing、Documents、Analytics、Review、Redact、Production 和 Tasks。

### v0.3 · 2026-09-23

- 依据 `C:\Users\AA\Desktop\截图\02 User` 的 22 张截图，增加 Users、Groups 和工作区组关联流程，沿用现有中英双语风格。
- 用户表单覆盖基本信息、访问、权限开关与默认设置；支持 Save、Save & New、Save & Back、席位确认、编辑和删除。
- 用户组支持双栏选择成员、添加完成提示、移除成员及关联工作区展示；工作区详情的 Manage Workspace Permissions 支持添加/移除组。
- 客户、事项、工作区、用户和组使用同一份浏览器内演示状态，跨页面保留；刷新页面恢复初始数据。
- 类型检查、生产构建和浏览器端完整创建/关联/移除/取消流程通过；检查 1440px 桌面和 390px 窄屏，未发现运行错误。
- 具体对象权限、标签可见性和真实异步后台任务不在本轮模拟范围内；不创建真实账号或发送邮件。

## 验证

```powershell
npm.cmd run check
npm.cmd run build
```

验证通过后双击项目根目录的 `preview.cmd`，或在浏览器打开 `http://127.0.0.1:5173/`。
