# Audit 开发说明 v0.12

日期：2026-10-02。目标：原版工程，管理员平台层 Audit 入口。此文档说明原型中可检查的交互和后续开发边界。

## 已实现

- 实例／工作区审计两种查看范围；工作区用下拉选择，沿用原版既有平台层导航，不另增一级功能模块。
- 默认最近七个日历日；按浏览器本地时区显示及筛选时间。筛选工作区、用户、Action、Object Type、Audit ID、Object ArtifactID、最小执行时间；Details 支持 is like / is not like。日期范围非法时阻止应用。
- 统计记录数、用户数、动作数和最近活动。Group By 可选 Action / User Name，点击统计条过滤；Pivot On 可选 Action / Object Type。此版提供固定组件，不实现任意小组件编辑器／自定义持久化视图。
- 列表支持时间排序、分页、跨页选择及清除选择。变更筛选或范围清除选择，防止误操作隐藏记录；仅查看相应工作区的数据。
- Details 表格／JSON、字段前后值、查询文本。未修改字段的事件明确显示无字段变更。
- 工作区审计可选择 CSV / XLSX 和当前筛选结果／所选记录，生成可下载文件。CSV 有 BOM、正确引号转义及公式注入防护；XLSX 为真实 OOXML 工作簿，单表、文本单元格、冻结表头与自动筛选。Details 内保留字段名、前后值，避免伪造独立导出字段。导出不保留列表排序。
- 撤回在工作区范围进行，先扫描列出可撤回与排除原因、恢复后的值，再运行。仅处理 Document 的最新 Update / Update - Mass Edit / Update - Propagation；仅支持官方列出的九类字段；必填字段不能恢复成 null；单次上限 5,000。旧记录保留，追加新记录并关联原 Audit ID。
- 撤回仅作用于 Audit 的示例编码状态。详情“示例编码状态”显示最新结果；没有联动现有 Viewer 的编码表单，也没有写入真实文档。
- 本次原型登录／退出记在 Admin Case，标记“本次会话”；25 条示例单独标记。刷新清空会话修改并重建示例。撤回后在本次 SPA 会话内跨页保留。
- 去除旧版通过通用 notify/toast 自动生成审计的逻辑，避免验证错误、下载提示等混入官方动作列表。进入／离开工作区不伪装为官方事件。其他业务模块尚未接入自动采集；审计页的覆盖示例不等于整个系统已埋点。

## 官方依据与本轮核对发现

本地官方文件：D:\\Relativity\\工作成果\\05_学习资料\\05_RelativityOne_官方User_Guide与产品学习资料_2026-09-21\\02_产品全景_建议优先\\RelativityOne - Admin Guide.pdf

SHA256：101AB4E55AAC173A00180C24C29AEFB7F5445D7C3A543A2A712823949DE07C29。

已阅读第 74–89 页 Audit 章节，渲染并查看第 77、79、80 页原产品界面。封面目录沿用本地资料包名称，正文已有 Relativity aiR 品牌；不当作 Relativity Server 所有版本的通用说明。

| 官方页码 | 原型采用规则 |
| --- | --- |
| 74–77 | 实例审计、列表、Dashboard、Group By / Pivot On、默认最近七天；SQL 迁移前停留天数不等于总审计保留期限 |
| 77–78 | Audit ID、Timestamp、Action、Object Type、Execution Time、Object ArtifactID、User Name 基础筛选；Field、Old Value、New Value 不直接筛选，使用 Details |
| 78–79 | Details 的 Table / JSON；Field Changes 旧值／新值 |
| 80–81 | 仅工作区可导出，CSV / XLSX，保留筛选、不保留排序；前后值在 Details 内 |
| 81–83 | 实例级需系统管理员；可过滤工作区；撤回只在工作区；最新文档修改、字段类型、必填和 5,000 条限制；每次撤回追加审计 |
| 87–89 | Create / Update / Delete、Document Query、View、导入导出、Markup、Security、Production、文件／影像等动作；登录、失败登录、登出、安全预览等在 Admin Case |

官方入口：[Audit](https://help.relativity.com/RelativityOne/Content/Relativity/Audit/Audit.htm)。本轮在线访问因沙箱网络限制及自动审批服务 503 未完成；以上结论来自实际读取的本地官方 PDF，而非实时官网核验。

修正前轮调研中的暂定建议：安全／登录事件可在 Audit 内出现，不能一律拆到独立 Security Log；本轮不新增四套日志入口。Task / Processing 的完整生命周期日志仍由对应模块负责。Result、Error、Job ID 并非所有 Audit 事件的通用顶层字段，本版不为每条事件强造值。

## 接后端前需要落实

- 用实际 API 契约替换本地 ID、示例与内存状态；核实动作、权限、分页、日期时区、服务器查询和导出任务的版本约定。
- 后端在写入业务数据的实际事务／任务边界采集事件；不从前端提示推断成功。导出、筛选、详情和撤回都必须进行服务器授权。
- 撤回需在提交时重新验证最新版本、字段类型／必填、权限和并发冲突；生产环境应返回逐条结果。当前仅模拟示例记录，不声称完整后台实现。
- 不新增普通管理员编辑／删除 Audit 的入口。日志总保留期限、不可篡改机制、迁移容错、Audit Migration Reports、Workspace Settings、批量后端任务及全量事件覆盖不在本轮实现范围。
- 未把 Assist 的临时事件类型加入本版；参考 Searching Guide 的版本限制单独规划。

## 修改文件

| 文件 | 内容 |
| --- | --- |
| src/pages/AuditPage.tsx（新增） | 审计视图、图表、筛选、列表、详情、导出及撤回弹窗 |
| src/state/audit.ts（新增） | 类型、示例初始化、筛选和撤回规则 |
| src/state/auditExport.ts（新增） | CSV / XLSX 文件生成与下载 |
| src/styles/audit.css（新增） | 桌面 Audit 和弹窗样式 |
| src/constants/copy.ts | 双语文案、样例、可见参数及 v0.12 版本标识 |
| src/styles/vars.css | Audit 使用的尺寸变量 |
| src/App.tsx | 新页接入、会话审计状态、登录／退出；去除通用提示记录 |
| src/pages/AccessPages.tsx | 移除被替换的旧 Audit 页面，保留其他页面 |
| docs/CONTENT_AND_VERSIONING.md | 记录 v0.12 变更 |
| 本文 | 官方对应关系、实现范围与交接说明 |

## 验证与归档

- npm.cmd run check、npm.cmd run build 通过。构建仍提示主包大于 500 kB，未扩展到打包优化。
- 独立无头 Edge 验证实例权限展示、Admin Case 登录、范围隔离、分页、Details JSON、ESC 关闭、筛选及日期错误、空态、图表联动、CSV / XLSX 下载、撤回排除条件与新记录；原有 Production / Export / Documents 可达，无 pageerror。
- 已检查 1600×1000、1366×768 桌面截图；横向滚动限制在宽表格内部。XLSX 解压、CRC、所有 XML、单元格数及 Details JSON 解析通过。
- 验证材料、脚本、官方截图位于：D:\\Relativity\\工作准备\\草稿与中间产物\\Audit_v0.12_2026-10-02。
- 迁移清单为同目录 migration.json；被替换的五个原文件及旧 dist 保存到 D:\\Relativity\\工作准备\\历史版本\\04_交互原型\\原版_Audit更新前_v0.11_2026-10-02。
- 工程保持原路径；构建输出 dist 是运行所需文件。脚本、截图、导出验证文件均留在准备区；未移动现有工程说明与其他模块，因为它们未被本轮替代；MVP 版未改动。
- 撤回本轮：先归档当前这批文件，再按 migration.json 把五个旧文件及旧 dist 恢复到原路径，并移出本轮新增的五个文件。不执行整个仓库 reset，避免覆盖后续改动。
- 本轮未创建 commit 或推送；提交／发布需按用户后续指示进行。

