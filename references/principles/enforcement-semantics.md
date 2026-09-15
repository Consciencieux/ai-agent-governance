# Enforcement 语义原则

> SKILL-INTERNAL。描述检查结果与规则分层的最小形状。**不**规定本仓脚本名或 CTRL 编号。

## Hard Rules（L1）

1. **四值可陈述** — 可检查义务的结果语义必须落在：`allow` · `deny` · `warn` · `require_review`（或项目等价四值）。禁止只用退出码暗示强度却无词汇。
2. **判断型分层** — 判断型义务不得与可机械判定义务共用无标记的同一 MUST 强度措辞；须显式标 `judgment` / `mechanical`（或等价分层）。
3. **carrier 可指** — 声称有 enforcement 的判断型规则，必须能指出观测载体（数据模型、清单、attestation、或显式 `require_review` 门）。无 carrier 不得宣称 fail-closed。
4. **示例非约束** — 示例 / 样板不得升格为硬约束。

## Recommended Patterns（L2）

- 在 policy 或 principles 中维护小表：规则类 → enforcement 值 → carrier
- Agent 协议路径标 `require_review`，不要假装 `deny`
- 机械 classifier（如 git consent 分类）输出「需要人授」时，人授仍由协议完成
- 兑现**分类**（mechanical / require_review / unmechanized / inherent_judgment）与上列四值正交；分类权威是 INSTALLED `capability-enforcement.json`，不是叶卡散文

## Project Customization（L3）

- 具体四值标签文案、carrier 文件格式、是否装 runtime hook **均属 L3**
- 本仓 CTRL / Gate 名不得升格为 portable L1
