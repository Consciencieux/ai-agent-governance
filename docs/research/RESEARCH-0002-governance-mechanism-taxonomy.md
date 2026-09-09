---
id: RESEARCH-0002
status: Active
version: 1
subject_generation: gen1
---

# RESEARCH-0002：治理机制分类

> Generation-1 门禁不是单一机制，而是几类 checker 的组合。本文档是机制分类，也是未来 Rule Registry 设计的基础。

**总体判断**：当前门禁主要是「基于文件系统状态 + 文本模式匹配 + 简单结构解析 + 测试执行」的规则集合，**还不是基于统一语义模型的治理执行系统**。

## 机制概览

```text
                当前 Gate

          文件状态
              |
              |
     ┌────────┼────────┐
     ▼        ▼        ▼
  存在性    文本匹配   结构解析
  check     regex     parser

     ▼        ▼        ▼

        一致性比较
             |
             ▼

        测试执行
             |
             ▼

        exit 0 / 1
```

占比最高的是：**文本匹配 + 文件一致性 + 测试 runner**。而不是「理解规则 → 判断适用范围 → 自动选择控制 → 证明满足 invariant」。

## 1. 文件存在性检查（Existence Check）

```text
目标路径 → 文件是否存在？ → 不存在 fail / 存在 pass
```

- 典型用途：防止关键治理文件被删除、防止发布包缺文件、防止目录结构漂移（AGENTS.md / SKILL.md / policy / template / generated artifact）
- **优点**：可靠、快、几乎无 false positive
- **限制**：只能证明文件存在，不能证明内容正确、真的被使用、规则真的生效

## 2. 文本匹配检查（Text / Regex Check）

```text
读取文件 → regex/string search → 找到/没找到 → pass/fail
```

- 典型用途：AGENTS.md 是否含 MUST/MUST NOT、package.json 是否含 check:full、CHANGELOG 是否含禁止表达
- **优点**：实现简单、适合稳定格式、易加 regression test
- **限制**：容易假阳性（ADR 正文出现 Unreleased 被当状态标记）；容易假阴性（`npm\ntest` 绕过 `includes("npm test")`）

## 3. 结构解析检查（Structured Parsing）

```text
文件 → parser → AST/object/tree → 规则判断
```

- 典型用途：解析 package.json（scripts/dependencies/version）、YAML GitHub Actions（jobs/steps/uses）、Markdown headings（## 结构）
- 比纯 grep 可靠，因为理解结构

## 4. 一致性检查（Consistency / Drift Check）

```text
source of truth → derive value → compare targets
```

- 典型用途：版本一致性（package.json vs CHANGELOG vs manifest vs generator sentinel）、ADR 状态、README 数字、generated metadata
- 已接近 invariant checking

## 5. 测试执行型 Gate（Behavioral Test）

```text
运行测试 → exit code → 0 pass / 非0 fail
```

- 验证「某个行为是否符合预期」
- **negative test**（输入违规 fixture → checker 应该失败）是比 regex 更可靠的一类
- **当前问题**：很多测试偏 feature test（checker 能运行）而非 invariant protection test（把 bug 改回来测试一定红）

## 6. Git diff / impact-aware 检查（当前最少）

```text
git diff → 知道改了什么 → 选择相关 rule → 运行相关 gate
```

- 理想：README 改 → docs checks；generator 改 → generator contract tests
- 当前：本地 AI 判断 scope 选 check:xxx；CI push → 无条件 npm run check
- **缺少真正 dispatcher**

## 缺失的中间层

当前：

```text
文件 → checker → exit code
```

缺少：

```text
Rule → Trigger → Mechanism → Evidence → Decision
```

例如规则「修改 validator-command 时必须检查所有 sibling instance」：当前没有结构化 sibling 列表、没有 instance model、没有触发条件、没有 closure checker，只能靠 AI 记得检查（FINDING-0003）。

## 与下一代的关系

机制分类是未来 **Rule Registry + Dispatcher** 的基础：每条 rule 可以映射到一种或多种机制，机制是 primitive（可复用），而非特定事故 checker。见 FINDING-0002 / FINDING-0019。
