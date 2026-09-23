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

## 验证

```powershell
npm.cmd run check
npm.cmd run build
```

验证通过后双击项目根目录的 `preview.cmd`，或在浏览器打开 `http://127.0.0.1:5173/`。
