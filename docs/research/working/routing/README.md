# routing/ — Task→Capability 施工产物

Phase 5（PLAN-0038 / PLAN-0039）的 **repo-only** 路由工作稿。

| 文件 | 用途 |
| --- | --- |
| `call-topology.md` | 调用拓扑架构（节点 / 边 / 分层 / 解析；非目录树） |
| `task-capability-map.md` | 该图的本仓实例（种子 · 映射 · 夹具；人权威） |
| `graph.v0.json` | 机器投影（机权威；与 map 对账；含 `authorities`） |
| `projection-table.md` | Phase 5c Capability→Authority 投影表（施工权威） |

**不是** INSTALLED 载荷。

| 阶段 | 消费方式 |
| --- | --- |
| 5a（PLAN-0038 Implemented） | 人工 / Agent 查表；表征套件 |
| 5b（PLAN-0039 Implemented） | `repo-tools/lib/routing.js` + `node repo-tools/route-task.js`；**同一套解析** |
| 5c（PLAN-0040 Implemented） | 按 Capability 投影；`authorities` + lifecycle 横切叶；见 PLAN-0040 |

```bash
# 显式 task
node repo-tools/route-task.js --task edit_scripts --trees scripts

# 路径推断
node repo-tools/route-task.js --path scripts/foo.js --json

# 表征
node tests/run-tests.js --suite routing
```

权威链：RESEARCH-0012 → `call-topology.md` → map（人）→ `graph.v0.json` / `routing.js`（机）→ CLI → AGENTS 指针 →（5c）磁盘投影。

**纪律摘要：** Gen1 无真正能力路由图；搬家按 Capability 重排功能，不跟 1.0 目录骨架；禁止平行第三套查找模型。
