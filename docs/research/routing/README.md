# routing/ — Task→Capability 施工产物

Phase 5（PLAN-0038 / PLAN-0039）的 **repo-only** 路由工作稿。

| 文件 | 用途 |
| --- | --- |
| `call-topology.md` | 调用拓扑架构（节点 / 边 / 分层 / 解析；非目录树） |
| `task-capability-map.md` | 该图的本仓实例（种子 · 映射 · 夹具；人权威） |
| `graph.v0.json`（PLAN-0039） | 机器投影（机权威；与 map 对账） |

**不是** INSTALLED 载荷。

| 阶段 | 消费方式 |
| --- | --- |
| 5a（PLAN-0038 Implemented） | 人工 / Agent 查表；`AGENTS.md` 薄指针；`routing` 表征 |
| 5b（PLAN-0039 Design→…） | 共享 `resolve` + Context Detector + `repo-tools` CLI；**同一套解析** |
| 5c（5b EXIT 后另开 Plan） | 按 Capability 投影 `references/` 等；只改 `AuthorityRef`；见 `call-topology.md` § 物理拓扑 |

权威链：RESEARCH-0012（模型）→ `call-topology.md`（架构）→ map（人表）→ PLAN-0039 投影/CLI（可调用）→ 薄入口指针 →（5c）磁盘投影。

**纪律摘要：** Gen1 无真正能力路由图；搬家按 Capability 重排功能，不跟 1.0 目录骨架；禁止平行第三套查找模型。
