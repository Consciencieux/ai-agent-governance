# 文档模型原则

## Hard Rules（L1）

1. **类型单责** — Research 陈述系统/证据；Finding 记录已观察问题与影响；ADR 记录长期选择与理由；Plan 是执行合同（目标/范围/阶段/验收/状态）。禁止把 Plan 写成百科，禁止在 Finding 里写规范正文或施工手册。
2. **一编号一文件** — 同一 ID 不得拆成文件夹、同号第二份文件或 stage 伴生文件。
3. **过程稿默认不落盘** — 施工表、HITL 勾选稿、提炼中间表不进入类型树；需要长期保留的结论写入已有编号对象或经 ADR 新增类型。
4. **类型树封闭** — 文档根下只允许已裁决的类型目录；不确定归属时创建 Finding 或并入已有对象，禁止 `mkdir`「先放着」。
5. **权威不双写** — 同一事实一个 canonical owner；README/入口只导航与指针，不复制规则全书。

## Recommended Patterns（L2）

- Product / Roadmap 等边界对象可多语 projection；执行对象（Plan / ADR / Finding / Research）单一 canonical 语言
- Roadmap 是索引不是第二事实源；Plan 归档 ≠ 产品 Release
- Finding 关闭条件写 **outcome**，不写实现架构/组件步骤

## Project Customization（L3）

- 具体目录名与是否三语由项目定（须存在 Research / Decision / Execution **类对象**）
- 编号前缀与位数由项目定
- 是否机械 allowlist 扫形状由项目定；有则 fail-closed，无则不得假装已机械保证
