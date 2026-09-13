# System Review（repo-keep · PLAN-0043）

**档位：** ADR-0024 `repo-keep` — 本仓可运行；**不**进入 skill 默认子技能。  
**配对：** [review-kinds.md](review-kinds.md) · 不要替代 [Implementation Review](../../../references/templates/sub-skills.md)（§ review-manager）。

## 何时用

- 怀疑「局部越修越精致、整体不简单」
- producer / product 耦合、Control 拓扑、Dispatcher/适用性、迁移期双权威
- 连续多轮 Implementation Review 后用户仍感觉系统变重

## 不问什么

- 不把 PR 逐行 bug 清单当主输出（那是 Implementation）
- 不评价 RESEARCH 主张是否成立（那是 Research Review）
- 不借机 Active PLAN-0037 或重写全部 Gen1 gate

## 必问清单（固定；可增补备注，不可换成 Impl 五域）

1. **控制拓扑**：语义 / evaluator / gate / test 是否被混成一个文件或一个「全面审查」？
2. **所有权**：共享语义是否仍双写（repo vs skill）？ADR-0020 / ADR-0024 是否被绕过？
3. **适用性**：规则是否在错误 task_class 上静默加载（路由负向）？
4. **耦合**：repo-infra 修复是否未传播到 INSTALLED（或反向）？
5. **复杂度方向**：本次变更是降低注意力负担，还是增加必须记住的规则面？
6. **过度工程**：是否引入无当前需求证明的机制（工程克制）？
7. **迁移诚实性**：是否把 checkpoint 绿当成产品可用 / 2.0 可发？

## 工作流（默认只读）

1. 选定范围（子系统 / 路径 / 近期架构变更），**先不改代码**。
2. 对照上表取证（文件 + 节 + 行为）。
3. 每条发现标注 Finding Level（L0–L4，见 review-kinds）。
4. 搜同类实例；L0 复发 → 上查 L1+。
5. 输出：**分类后的 Finding/观察列表** + 建议处置（修局部 / 开 Finding / ADR / Plan）。**分类完成前禁止边审边修。**

## 输出模板

```text
System Review
范围: …
只读至分类: yes
发现:
- [Ln] 摘要 — 证据 — 建议处置
升级自 Impl（若有）: …
不做: INSTALLED 默认子技能化 / Phase 8 偷跑 / PLAN-0037
```

## 路由

- `task_class`: `system_review`
- Capability: `review-system`
- Authority: 本文件
