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

### v0.4 · 2026-09-23

- 根据 `C:\Users\AA\Desktop\截图\03 Assign permissions` 的 41 张截图，扩展工作区权限设置与组成员预览。
- 工作区详情 → Manage Workspace Permissions → Edit Permissions，支持 Features、Object Security、Tab Visibility、Other Settings 四类配置；Review Center 的 Reviewer / Power User 角色联动对象与标签权限。
- 复核页按当前草稿计算修改前后差异；支持返回编辑、撤回全部、保存、未保存离开确认。各工作区、各组独立保存会话内权限。
- 支持添加审阅经理组、Copy From / Copy To 复制已保存权限、Preview 中的文档空态、审阅队列空态、审阅中心空态及审阅库 9 条模板；退出返回工作区详情。
- 高级设置支持选择 Workspace Admin Group，先 Set，再在高级设置 Save；取消不写入。
- 保留初始用户/组空列表；“载入截图示例组”按需添加示例组并复用已有同名客户组，重复点击不覆盖权限或成员。新关联的普通组默认不授予对象和标签权限。
- 配置仅覆盖截图实际操作的权限项。管理员角色的权限明细未展开，选择项保持禁用；审阅经理模板仅演示截图可见的导航及审阅库，不声明重现完整官方权限矩阵。Preview 是独立本地模拟视图，不改变其他业务页面的全局身份。
- 截图 17 的 Search Container 操作说明与截图 24 的汇总有差异；原型汇总按实际勾选结果生成，不硬编码截图中的最终值。
- 版本仍使用原工程目录；源码旧版按迁移清单归档至准备区。类型检查、构建、权限端到端流程、原用户流程回归及 390px 窄屏验证记录位于本轮准备区。

## 验证

```powershell
npm.cmd run check
npm.cmd run build
```

验证通过后双击项目根目录的 `preview.cmd`，或在浏览器打开 `http://127.0.0.1:5173/`。
