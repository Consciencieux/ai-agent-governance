---
id: FINDING-0012
status: Confirmed
type: defect
observed_in: gen1
---

# FINDING-0012：check-lock.js 是只读提示（read-only advisory），不是并发安全锁（concurrency-safe lock；TOCTOU race）

## 分类

- 严重度：中
- 影响范围：skill
- 研究方向：F. 可移植性 / 运行时边界

## 观察

`scripts/check-lock.js`（INSTALLED，随 INIT 复制到被治理项目）声称做多 Agent lock check，但实际只是**读** `.governance/state.json` 的 `locked` 字段并输出 exit 0/1。它不写、不拿锁、无原子 compare-and-set，存在 TOCTOU race。

## 证据

```text
// check-lock.js 头部注释：
// Lock Check — read-only. Verifies no other agent holds a lock in .governance/state.json.

function readState() {
  return { state: JSON.parse(fs.readFileSync(STATE, "utf8")), missing: false, error: null };
  ...
}
function lockedValue(state) {
  const v = state.locked;
  // 任何非空值视为 held，malformed-but-parseable 状态 fail closed
}
```

实现只有 `readFileSync` + 判断 `locked`，没有写锁文件、没有原子 get-and-set、没有 lease/超时。两个 agent 同时读到「未锁」会同时继续执行。

## 根因

- 设计目标是「另一 agent 持锁时 exit 1」，但 read-only 检查无法原子地阻止并发——检查与执行之间没有锁边界。
- 项目注释也明确它是 read-only，不是 authorization mechanism。

## 影响

- 多 Agent 并发时锁检查可被竞态绕过。
- 被治理项目（INSTALLED 脚本）用它做「多 Agent 协作」的锁协调时，实际无严格互斥。

## 关闭条件

1. 明确 check-lock.js 的定位：advisory 检查，不是互斥锁（文档层面修正，避免误用）。
2. 或实现真正的原子锁（写锁文件 + compare-and-set + 超时过期）。

## 解决情况

（待填。）

## 关联

- GitHub Issue #6

## 回归保护

若实现原子锁：一个并发测试证明两个进程同时 check+acquire 时只有一个成功；若维持 advisory 定位：文档断言它不是互斥锁，防止误用。
