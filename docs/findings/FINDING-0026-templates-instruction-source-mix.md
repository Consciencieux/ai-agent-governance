---
id: FINDING-0026
status: Confirmed
type: architecture-gap
observed_in: gen1
---

# FINDING-0026：`templates/` 把可执行指令源与物化模板混在同一目录

## 分类

- 严重度：中
- 影响范围：repo、skill
- 研究方向：B. 政策 / 控制平面

## 观察

`references/templates/` 按 Generation-1 生成器视角分类：「被拿来生成别的文件，所以放 templates。」因此同一目录里同时住着：

- 真正进入 Agent 执行上下文的 instruction source（`agents-md.template.md`、`sub-skills.md`）
- 生成 machine state 的模板（`git-policy.template.md`、`sync-rules.template.md`）
- 只提供初始化便利的 boilerplate（`env-example.template.md`、`feature-doc.template.md`、`gitmessage.template.md`）

`sub-skills.md` 尤其不是普通模板。`init-spec.json` 把它定义为 `type: generated` / `generator: sub-skills`，输出 `.governance/generated/skills/`。语义上它是多个可执行 Agent instruction module 的聚合源文件（capability sources / skill registry + skill bodies），却以「模板」身份进入目录。

`init-spec.json` 自己也写明：distribution role 不能从目录或文件名推断，必须人工声明。目录结构已经无法表达真实职责。

## 证据

- 物理树：`references/templates/` 当前 8 个文件，职责跨运行时指令、machine state、bootstrap boilerplate 三类（清单与判断表见 RESEARCH-0009）。
- `sub-skills.md` 约 31 KB，内含 `repository-inspection`、`ci-generator`、`governance-validator`、`state-manager`、`drift-check`、`release-manager`、`plan-manager`、`review-manager`；生成器再拆成 leaf。部分 leaf（`drift-check`）自身又叠加 drift / activity / freshness / consistency。
- 截至 v1.0.0，`agents-md.template.md` 被触碰 24 次、`sub-skills.md` 18 次，与 `release.md` / `lifecycle.policy.md` 同属最高频 instruction 面；它们的演化形态更接近运行时合同，而不是偶发 bootstrap 文件。
- 物化契约不得不靠人工声明 role，正是因为 `copy / template / generated / rename / one-to-many` 已经超出目录名能表达的范围。

## 根因

Generation-1 按**物理生成方式**给文件归类，而不是按**语义责任**归类。模板被当成知识分类，于是「生成 AGENTS 的 runtime contract」和「生成 `.env.example`」看起来是同类。

这是 FINDING-0002 / FINDING-0025 在 authoring 布局上的一例：没有 Control / Capability identity 时，生成器的输入目录就变成默认分类法。

## 影响

- 人和 Agent 会把 `sub-skills.md` 理解成「又一份模板」，低估它是日常 instruction path 的核心。
- 后续拆分若仍按 `templates/` 边界思考，只会继续把 instruction module 和 boilerplate 绑在一起移动。
- 无路由地拆 `sub-skills.md` 而不建立 capability registry，会把一个 authoring monolith 变成许多无 dispatcher 的小文件（FINDING-0015）。

## 关闭条件

1. 可执行 instruction module（含 sub-skill 源、AGENTS 模板）按 capability / runtime instruction 分类，不再与 bootstrap boilerplate 共用「模板」语义。
2. 真正的物化模板（env / feature-doc / hooks 等）保留为 materialization mechanism。
3. 若保留 sub-skill 机制：一能力一源文件 + 薄 registry；不再用单一 30 KB 聚合正文充当 registry。
4. 目录重排必须伴随显式路由与 applicability，且不得在 Phase 2 提前移动。

## 解决情况

（未解决。）问题模型已写入 RESEARCH-0009 v3。仍在 Phase 2：先记录责任边界，不移动 `references/`。处置属于后续阶段（与 ADR-0014 机械冻结、ADR-0018 Phase 4 及以后的 keep / wrap / extract / rewrite / retire 一致）。

## 关联

- RESEARCH-0009
- ADR-0022
- FINDING-0015
- FINDING-0002
- FINDING-0025
- `references/init-spec.json` § invariants（distribution roles are declared, not inferred）

## 回归保护

当前无机械 gate 检测「目录名是否等于语义责任」——这正是本 Finding 的内容。关闭时需要：capability 源与 boilerplate 的分类可被声明并对账，而不是靠目录名推断。在此之前，禁止把「挪到更细的 Markdown 目录」当成关闭。
