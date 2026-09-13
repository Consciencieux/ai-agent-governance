# Control 形状原则

> SKILL-INTERNAL。描述「若采用 Control」时的最小形状。**不**规定任何项目的 `CTRL-NNNN` 编号、本仓路径或 registry 文件名。

## Hard Rules（L1）

1. **身份可引用** — 若采用 Control，每条义务须有稳定可引用 identity（格式由项目自定）。
2. **语义单家** — 规则语义有且仅有一个 authoritative owner（文件 + 节）；interim 实现家必须显式标 interim。
3. **适用可陈述** — 须能陈述何时适用；不要求自动 dispatcher。
4. **Binding 可追踪** — profile × evaluator/CLI × enforcement boundary → decision effect 可写清；Gate / npm script 不是 Control 本体。
5. **编号非 portable 不变量** — 禁止把某一参考实现的 Control 编号写成跨项目硬约束。
6. **禁止路径即身份** — 禁止用「同一 JS 文件」推断「同一 Control」。
7. **Guarantee 非单值槽** — 禁止把 guarantee level 建成 Control 级单值字段（应为 binding/边界上的派生投影）。

## Recommended Patterns（L2）

- 双 profile 都有实现时，用**同一** canonical negative fixture 打两侧（CONTROL-X 形状）；禁止两侧各写语义不同的夹具
- 机读投影可以存在，但 schema 权威与语义权威必须分开
- 证据（表征测试、门禁、人工审查）挂在 Control 上可发现，不靠口头宣称

## Project Customization（L3）

- identity 字符串格式、序列化目录、registry 文件名、本仓 `CTRL-NNNN` **均属 L3**
- 是否实现 Dispatcher / 全量 Evidence Model 由后续 Horizon 决定；本原则只锁形状，不锁调度器
