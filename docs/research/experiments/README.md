# 实验记录

本目录保存研究实验记录（**事后测量**，不是执行前操作手册）。与 TASK Plan 的分工见 RESEARCH-0013：Plan = 短合同/假设；本目录 = 做了什么、数据、结果。每个实验一个文件：

```text
docs/research/experiments/
├── README.md                                  # 本页
└── experiment-0001-<slug>.md                  # 实验记录
```

## 建议的命名方式

```text
experiment-0001-static-vs-dynamic-policy.md
experiment-0002-full-vs-incremental-validation.md
```

## 实验文件结构（建议）

```markdown
---
id: EXPERIMENT-0001
title: ...
status: proposed           # proposed / running / completed / aborted
research: RESEARCH-0003    # 关联评价框架
hypothesis: ...
created: ...
updated: ...
---

# 实验标题

## 假设

## 方法

## 测量

## 结果

## 结论

## 复现
```

## 待办实验（见 RESEARCH-0003-evaluation-framework.md）

1. 静态 AGENTS vs decision-point policy injection（FINDING-0015）
2. full test vs incremental dispatcher（ADR-0014，Migration Mode 提供数据）
3. Generation-1 vs Generation-2 对比
