# 交互地图 / Interaction Map

这里记录“用户点什么、状态如何变化、代码在哪里”。调整交互时先查本文件，再改对应页面；不要在聊天记录里寻找历史约定。

## 全局

| 入口 | 行为 | 代码 |
| --- | --- | --- |
| 左侧导航 | 切换页面并回到页面顶部 | `src/App.tsx`、`src/components/AppShell.tsx` |
| 全局搜索 | 进入 Documents | `src/components/AppShell.tsx` |
| Scope、通知、帮助、用户菜单 | 打开或关闭弹层 | `src/App.tsx`、`src/components/AppShell.tsx` |
| Toast | 操作后显示约 3.2 秒 | `src/App.tsx`、`src/components/UI.tsx` |

## 页面交互

| 页面 | 主要交互 | 状态入口 |
| --- | --- | --- |
| Home | 工作流卡片和待关注事项跳转到对应页面 | `src/pages/HomePage.tsx` |
| Users / Groups | 新建、编辑、保存并新建、保存并返回、用户启用确认、用户组成员的双栏添加与移除 | `src/pages/UsersPage.tsx`、`src/components/UserForm.tsx`、`src/components/TransferList.tsx` |
| Workspaces 的记录详情 | Manage Workspace Permissions → 组列表 / 添加移除组 / 编辑权限 / 复制权限 / 预览；可按需载入截图示例组 | `src/components/WorkspacePermissions.tsx` |
| Edit Permissions | Features → Object Security → Tab Visibility → Other Settings → Review and Save → Save；支持撤回、取消和换组确认 | `src/components/PermissionEditor.tsx`、`src/state/permissions.ts` |
| Preview | 按组的已保存权限显示可见标签；文档、审阅队列、审阅中心空态，审阅管理的 Review Library；Exit Preview 返回详情 | `src/components/PermissionPreview.tsx` |
| Advanced Settings | Edit → Select Workspace Admin Group → 单选 → Set → Save；取消丢弃暂存选择 | `src/components/WorkspaceAdvanced.tsx` |
| Processing | 新建数据源弹层、输入方式、Inventory 开关、异常重试 | `src/pages/ProcessingPage.tsx` |
| Documents | 文件夹、搜索条件、保存搜索、结果行、锁定文档提示 | `src/pages/DocumentsPage.tsx` |
| Analytics | 标签页、增量索引运行状态、新建分析集 | `src/pages/AnalyticsPage.tsx` |
| Review | 文档切换、Viewer 标签、缩放、相关项标签、必填编码校验、Save & Next | `src/pages/ReviewPage.tsx` |
| Redact | 遮盖工具、示例遮盖、泄漏检查、提交复核 | `src/pages/RedactionPage.tsx` |
| Production | 输出选项、制作前校验、阻断后跳转 Redact、运行制作 | `src/pages/ProductionPage.tsx` |
| Tasks | 后台任务列表和任务状态展示 | `src/pages/TasksPage.tsx` |

## 跨页面状态

- `qcPassed` 位于 `src/App.tsx`，由 Redaction 页面设置，Production 页面读取。
- `page` 位于 `src/App.tsx`，由全局导航和页面跳转共同更新。
- `src/state/Administration.tsx` 共享客户、事项、工作区、用户和组；页面切换保留数据，刷新恢复初始值。工作区关联从组的 `workspaceIds` 派生，用户通过组成员关系查看工作区关联。
- 工作区权限按 `permissions[workspaceId][groupId]` 保存，编辑草稿仅在最终 Save 时写入；复制使用深拷贝。删除组同时清理其权限和管理员组引用。
- 各页面其余状态目前是演示状态，只存在于当前浏览器会话，不连接后端。

## 调整交互的最小步骤

1. 在本文件找到目标页面和交互入口。
2. 在对应 `src/pages/*.tsx` 修改状态或事件处理。
3. 新增提示文案时先写入 `src/constants/copy.ts`。
4. 运行 `npm.cmd run check` 和 `npm.cmd run build`。
5. 双击 `preview.cmd` 验证完整路径。
