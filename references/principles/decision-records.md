# 决策记录原则

## Hard Rules（L1）

1. **ADR = 长期选择** — 决策、理由、后果、替代方案；禁止把研究过程或施工手册写进 ADR 当正文权威。
2. **不改写历史** — 已 Accepted 的决策正文不静默改写；修正用 dated amendment / Narrow amendment，或 Supersede 并指向新 ADR。
3. **Research 不做最终裁决** — Research 可提假设与证据；「做出选择」属于 ADR。禁止把「已采纳假设」只写在 Research 里当施工权威。
4. **Plan 不替代 ADR** — Plan 执行合同可引用 ADR；不得在 Plan 内重新立法并当作跨任务长期规则。
5. **Finding 不是规范源** — Finding 提供问题与 outcome 关闭条件；日常规则权威在政策/入口/ADR，不在 Finding。

## Recommended Patterns（L2）

- 状态机：Proposed → Accepted → Deprecated / Superseded（项目可增减，但须可解析）
- 入口与原则索引只保留指针到 ADR，不摘抄决策全文
- 跨 profile 共享语义：一个 semantic owner，多 consumer 实现（见 producer/product 分离）

## Project Customization（L3）

- ADR 目录名、编号、是否归档子目录由项目定
- 是否要求 amendment 必须带日期由项目 README/ADR 规范定
- 本仓 ADR 编号与 Phase 决策表不是 L1
