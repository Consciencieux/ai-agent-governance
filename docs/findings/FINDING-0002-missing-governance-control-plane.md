---
id: FINDING-0002
status: Confirmed
type: architecture-gap
observed_in: gen1
---

# FINDING-0002：缺少统一的治理执行架构（Missing Governance Control Plane）

## 分类

- 严重度：严重
- 影响范围：repo、skill
- 研究方向：B. 政策 / 控制平面

## 观察

系统核心问题不是「验证太少」或「验证太多」，而是**验证责任分配错误**：Agent 承担了过多规则记忆、适用性判断和门禁触发；JS 承担了大量无差别机械检查；两者之间缺少统一的规则模型、触发器、调度器和真正的 enforcement point。

```text
Markdown / AGENTS / SKILL / policies
                ↓
             AI 阅读
                ↓
          AI 理解并记住
                ↓
       AI 判断当前哪些规则适用
                ↓
       AI 判断应该运行哪个 gate
                ↓
          npm run check:*
                ↓
       JS checker / test runner
                ↓
             exit 0/1
```

真正机械化的只有最后一截。体系是 **prompt-triggered, mechanically-executed governance**，而非 **system-triggered, policy-driven enforcement**。

## 证据

- **B02 document-centric**：Markdown 同时承担 normative specification、agent prompt、human documentation 和部分操作指南；机器看不到 rule id / trigger / mode / mechanism / enforcement point。
- **B04 缺 Rule Registry**：系统不知道某条规则的 id、适用条件、mechanism、enforcement strength。
- **B05 npm scripts 充当 dispatcher**：`check:*` 靠手工 `&&` 组合串起 checker，npm scripts 不知道「这次真正改了什么、哪些 rule applicable、哪些 gate 可以安全跳过」。

## 根因

Rule → applicability → mechanism → evidence → decision → boundary 这条链不存在。规则存在于语言层，不能被系统直接编排。

## 影响

- 治理可靠性上限 = Agent 注意力可靠性。
- 几乎所有后续问题（declaration-enforcement gap、trigger coverage gap、validation routing 失衡）的共同根因。

## 关闭条件

1. 定义最小 Policy Model（`id / mode / trigger / mechanism`）。
2. 统一 Dispatcher 入口（`inspect diff → classify context → load rules → calculate applicable controls → run minimal mechanisms → collect evidence → allow/deny/warn/review`）。
3. 统一 Evidence Model（rule / tool / query / exitCode / timestamp / resultHash）。

## 解决情况

（待填。）

## 关联

- GitHub Issue #7
- RESEARCH-0009
- FINDING-0015
- FINDING-0025
- FINDING-0026

## 回归保护

对每条已注册 rule 的触发路径负向测试：模拟「Agent 忘记运行」场景，证明另一条自动路径仍会拦截。
