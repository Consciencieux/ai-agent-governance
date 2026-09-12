# working/ — 施工产物（非 RESEARCH 正文）

本目录收纳 **Plan 施工权威**：机读图、台账、投影表。它们支撑 RESEARCH / Finding / Plan，**不是**又一篇系统模型，也**不是** `experiments/` 里的测量记录。

```text
docs/research/working/
├── README.md
├── routing/                    # Task→Capability 图（RESEARCH-0012 / PLAN-0038–0040）
│   ├── call-topology.md
│   ├── task-capability-map.md
│   ├── graph.v0.json
│   └── projection-table.md
└── script-inventory.md         # FINDING-0028 / PLAN-0041
    script-inventory.v0.json
```

| 槽 | 放什么 | 不放什么 |
| --- | --- | --- |
| `working/` | 当前施工用的 map / JSON / 投影 | 系统模型长文（→ `RESEARCH-xxxx`） |
| `experiments/` | 做过的测量（方法、数据、结果） | 分析文章、台账、路由图 |
| `RESEARCH-xxxx` | 如何理解系统 | 夹具 JSON、任务级 checklist |

repo-only；不得被 INSTALLED 规则引用。
