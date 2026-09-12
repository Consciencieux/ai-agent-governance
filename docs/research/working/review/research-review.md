# Research Review（repo-keep · PLAN-0043）

**档位：** ADR-0024 `repo-keep` — 本仓可运行；**不**进入 skill 默认子技能。  
**配对：** [review-kinds.md](review-kinds.md) · 不替代 Implementation / System Review。

## 何时用

- 审查 RESEARCH / 评价框架 / 成熟度主张是否被证据支撑
- 问「我们如何理解这个系统」「机械绿是否被误当成语义正确」
- 对 Zero-Attention / 动态策略注入等研究问题做方法学检查

## 不问什么

- 不扫 PR 缺陷（Implementation）
- 不直接裁决架构迁移动线（可建议开 System Review 或 ADR；本类不代替 ADR）
- 不把「测试数量」当作研究结论

## 必问清单

1. **主张 ↔ 证据**：文中主张是否指向可核验证据（文件 / 测量 / Finding）？
2. **层混淆**：是否把 Research 描述写成 ADR 规范或 Plan 施工？
3. **指标诚实**：是否用 N/N tests 或 checker 绿代替 invariant / oracle 覆盖？
4. **可证伪性**：结论怎样会被证伪？有没有负向证据路径？
5. **范围**：是否把 later/deferred 写成已交付？
6. **注意力模型**：是否假设 Agent 会稳定记住长规则，而无机械兜底？

## 工作流（默认只读）

1. 选定 RESEARCH / 评价文档 / 主张集合。
2. 逐条映射主张 → 证据；缺口记为 L4（或 L2 若已伪装成控制）。
3. 输出：主张表 + 证据缺口 + 建议（补 RESEARCH / 开 Finding / 降级措辞）。**分类完成前不改产品行为。**

## 输出模板

```text
Research Review
范围: …
只读至分类: yes
主张检查:
- 主张 — 证据 — 缺口 — 建议
不做: 伪装成 PR review / 偷跑 Phase 8 / Active PLAN-0037
```

## 路由

- `task_class`: `system_review` 的对称类 `research_review`
- Capability: `review-research`
- Authority: 本文件
