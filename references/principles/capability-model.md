# Capability 与路由原则

## Hard Rules（L1）

1. **Capability 显式** — 可调用的治理能力必须可命名；禁止只存在于散文里、无法被路由引用的「隐式能力」。
2. **Task → Capability 可判定** — 给定任务类别（及必要上下文），适用 Capability 集合须可解析；禁止默认「加载整棵治理树」。
3. **链路完整** — 新增 Capability 须声明：Task trigger → Capability → Authority → Execution → Verification（缺一不可宣称已接入）。
4. **Authority 单一** — 每个 Capability 的语义权威有且仅有一个 owner 引用；执行器与投影不得另立第二权威正文。
5. **超预算须显式** — 若存在加载预算，超出部分进 defer/deferral，禁止静默丢弃机械项或静默全量加载。

## Recommended Patterns（L2）

- 图或表表达 Task↔Capability 适用关系；Detector/CLI 与人读图同源
- Capability 叶短小、单职责；编排留在薄入口或 dispatcher，不塞进叶正文
- Characterization tests 钉住解析结果，而不是只钉住文件存在

## Project Customization（L3）

- 图文件路径、CTRL/Capability 编号、Phase 剧本、本仓 router CLI **均属 L3**，不得升格为 portable L1
- 是否把 router 装进被治理项目默认面由项目/后续 Horizon 定；原则包只要求「有可判定路由」，不要求安装某一实现
