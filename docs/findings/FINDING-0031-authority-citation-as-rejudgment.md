---
id: FINDING-0031
status: Confirmed
type: control-gap
observed_in: gen2
---

# FINDING-0031：用既有权威结论冒充「重新判断」

## 分类

- 严重度：高（对话面判断任务）
- 影响范围：repo、skill（任何要求 Agent 重评分类 / 裁决的会话）
- 研究方向：C. 执行强度缺口 · G. 证据 / 研究方法论

## 观察

用户明确要求「重新判断 / 重新评估」时，Agent 常以既有权威状态代替本次推理：引用 `Resolved` Finding、Accepted ADR、Archived Plan，或说「当时已经考虑过了」，却不按当前证据重新跑分类。结果是**复读**，不是**重评**。

这与「读到规则却不遵守」（FINDING-0003 Evidence 2）相邻但不同：那里是 cite → violate；这里是 cite → **假装已经完成用户刚下达的重评任务**。

主因是 **Agent 行为**（把文档里的旧裁决当成这次任务的推理）。治理体系最多事后要求诚实标签，**没有 carrier** 能在对话里红掉「这次其实没重评」。

## 证据

1. **2026-09-15 会话（本仓）**：用户要求重评「机械 vs 规则 / judgment」分类是否仍合理。Agent 多次答「约定已合理 / 8 类不用翻案 / 已经考虑过了」，把 FINDING-0003 Resolved 与 ADR-0026 当终态，直到用户指出「让你重新判断，你却说判断过了」。后续重评才拆出四类义务（`mechanical` / `require_review` / `unmechanized` / `inherent_judgment`），并落入 PLAN-0057 JSON 库存——说明首次回复并未执行重评。
2. **同族失效**：FINDING-0003 C03（read → cited → violated）证明自然语言进入上下文 ≠ 程序级保证；本条证明「权威已结案」≠「对本轮指令已重新裁决」。
3. **门禁边界**：PLAN-0057 / `capability-enforcement` 门禁只证明分类表完整与 mechanical carrier 路径存在，**明确不证明** Agent 遵守了 `unmechanized` / `inherent_judgment`，更不能证明对话里发生了重评。

## 根因

1. **权威替代推理**：Agent 优化「给出有出处的稳妥答案」，在「重评」任务上误用「查到已有结论」为完成条件。
2. **状态语义被误读**：`Resolved` / `Accepted` / `Archived` 表示**历史切片的关闭**，不表示「禁止或豁免对本题再裁决」。
3. **无对话面 carrier**：重评是 `inherent_judgment`（或人授核对）面；仓库门禁无法观测「本轮是否从证据重跑了分类」。

## 影响

- 用户以为得到了新裁决，实际是旧文档摘要 → 决策与分类漂移被掩盖。
- 加重「治理文档越厚、对话越像复读机」的注意力与信任问题（与 FINDING-0015 同向）。
- 将模型偷懒误诊为「治理体系不许重评」，耽误真正该改的行为纪律与（若有）人授核对协议。

## 关闭条件

1. 权威正文或 Agent 协议中有显式规则：**当用户要求重新判断时，禁止仅以既有 Finding/ADR/Plan 状态收束**；必须给出基于当前证据的新裁决表（可与旧结论相同，但须重跑推理并标明「本次重评结论」）。
2. 至少一次表征或人工复核清单能区分「引用旧结论」与「本轮重评输出」（例如要求输出差分：维持 / 改判 / 拆分，且改判项不得空）。
3. 不把「对话重评已发生」宣称为 mechanical deny；若无法机械观测，关闭叙述必须保持 `inherent_judgment` / `require_review`，不得把门禁绿写成重评完成。

## 解决情况

（待填。）PLAN-0057 只修了**义务分类库存**的 SSOT 形状，不关闭本条。

## 关联

- FINDING-0003（声明强度 ≠ 执行强度；cite≠compliance）
- FINDING-0015（静态长文注意力；记忆当 dispatcher）
- FINDING-0017（ADR Accepted ≠ 持续约束——记录面；本条为对话面）
- ADR-0026（Q3 兑现分类；2026-09-15 窄修正）
- PLAN-0057（INSTALLED 义务库存；门禁不证明重评）

## 回归保护

当前无 mechanical oracle。「用户要求重评却只复读权威」依赖人工/会话复核。未来若增加协议条款或表征测试，须验证：**禁止用 Resolved/Accepted 单句代替重评表**，且不得把门禁绿宣称为关闭本 Finding。
