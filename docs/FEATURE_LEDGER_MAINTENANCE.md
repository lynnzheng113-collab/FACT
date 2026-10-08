# 功能台账维护

从 2026-10-08 起，最新原版是本 MVP 功能台账的基准；独立 MVP版 的 58 项清单不再作为本台账的范围上限。

## 文件职责

- `docs/feature-ledger.json`：Git 随代码维护的结构化主文件，保留稳定 FACT 编号、原优先级、原建议和人工确认内容。
- `docs/FEATURE_LEDGER.md`：由主文件生成的可读功能清单，供 GitHub 查阅和后续 PRD 引用。
- `docs/feature-ledger-baseline.json`：已核对源码指纹，防止代码与清单不同步；不是功能正确性的证明。
- 工作成果中 `02_需求与规划/09_FACT_MVP功能说明与范围确认_v<版本>_<日期>.xlsx`：业务评审用 Excel；与本清单同源，人工确认值必须先回写主文件再重新生成，不能覆盖用户填写。

## 每轮功能修改

1. 检查本仓库实际 HEAD、未提交改动和所选版本，只核对原版；不得用源码的旧版本标签替代基线。
2. 逐项更新受影响 FACT 条目：入口、角色、操作与校验、输出、当前缺口、依赖、验收建议、证据路径/锚点、核对日期、验证和提交状态。
3. 新增独立功能递增对应前缀编号；细化旧功能填写 parent，避免重复估时；撤销功能保留编号及撤销原因，不复用编号。
4. 保留原 REL/SUP 来源、优先级和人工确认；前端演示不等于后端实现，原型包含不等于已批准本期。不得按文案或成功提示认定功能完成。
5. 样式、文案或工程修改如果不影响功能，也需在变化记录里说明具体影响和核对结论；不得仅刷新日期或指纹掩盖未核对的功能变化。
6. 核对完成后运行（示例 ID 必须替换为实际项）：

   ```powershell
   node scripts/feature-ledger.mjs refresh --date 2026-10-08 --reason "具体变更及验收影响" --ids FACT-ANA-01,FACT-DOC-05 --reviewed
   npm.cmd run ledger:check
   ```

7. 同步生成 Excel 新版，保留所有人工确认单元格和说明页；实质变更递增内容版本，先在工作准备制作核对，再发布到工作成果，旧版按迁移清单归档。
8. 用户要求提交时，代码、JSON、阅读版和指纹必须在同一提交；仅说“提交”仍只做本地 commit；用户明确要求 GitHub 推送时，再 push origin，并核对远端哈希。
9. 推送前重复检查台账和适当的原型验证；发布交付说明报告台账版本及变化的 FACT 编号。

## 自动检查

本仓库已配置 `core.hooksPath=.githooks`，pre-commit/pre-push 检查源文件与台账指纹一致；GitHub Pages 构建也先执行 `ledger:check`，并在 pull_request/push 的独立检查工作流中执行。

新克隆仓库需执行 `git config core.hooksPath .githooks`；Linux/macOS 还需确认 hook 可执行（`chmod +x .githooks/pre-commit .githooks/pre-push`）。Git 不会随 clone 自动安装本地 hook 配置；远端检查在含工作流的提交推送后生效。

检查可以阻止明显漏同步，不能代替语义核对或自动推断业务需求；后续 Codex 每轮修改必须按上述流程主动维护描述和 Excel，不能只重算哈希。

## 本次基线

原版 HEAD `16848c3`（2026-10-06），源码标签仍为 v0.17（2026-10-04），另纳入核对时的未提交搜索与索引修改；114 条记录是原有84项加30条补录/细化，不代表114项都已实现。

本次类型检查在已有 AnalyticsPage 的 IndexRecord 和 SearchTermReport 的 highlightFieldOptions 上失败，台账如实保留；本轮未修改业务代码、未创建提交或推送。
