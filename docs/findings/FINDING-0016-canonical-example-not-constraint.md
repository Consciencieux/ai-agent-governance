---
id: FINDING-0016
status: Confirmed
type: mechanism-gap
observed_in: gen1
---

# FINDING-0016：规范示例仅供参考，不是约束

## 分类

- 严重度：中
- 影响范围：repo、skill
- 研究方向：G. 证据 / 研究方法论

## 观察

项目通过「标准 CHANGELOG 条目示例」「标准文档示例」来减少 drift。但 example exists ≠ agent must follow it：如果 Agent 不读取、不模仿，系统没有任何机械后果。示例只是参考，不是约束。

## 证据

- Issue #7 §16：示例存在 ≠ Agent 必须遵循；不读取、不模仿时零机械后果。
- 与 FINDING-0009 观察同源：canonical example 想防的漂移（条目膨胀、格式不一致）在示例存在的情况下仍发生。
- **advisory-only carrier 效果≈无 carrier**（Issue #7 §14）：CHANGELOG content boundary 规则（记录什么/不记录什么）在 v0.15.0 落地后，entry 平均长度反而上升约 67%（413 → 690 字符）；对应的 `check-changelog-narration.js` 只匹配少量关键词且 `always exit 0`（advisory，不阻断）。规则存在 + AI 阅读 + advisory checker 存在 → 结果仍朝相反方向发展。

## 根因

示例把「期望形态」写在自然语言里，没有把可观察特征拆成 machine checks。机器无法验证「AI 有没有参考这个 example」。

## 影响

- 靠示例约束的规则实际无 enforcement。
- 示例越多，维护面越大，但约束强度不增加。

## 关闭条件

把示例中可观察的特征拆成机械检查，而不是检查「AI 是否参考了示例」：

```text
heading structure
pointer syntax
target existence
forbidden narration markers
```

示例保留为人类参考，机器只验证可判定的特征。

## 解决情况

（待填。）

## 关联

- GitHub Issue #7

## 回归保护

对每个「标准示例」关联的规则，至少一个机械 check 覆盖其特征子集（heading/pointer/target/marker），使示例的约束部分可判定。
