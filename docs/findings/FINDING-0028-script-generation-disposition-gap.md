---
id: FINDING-0028
status: Confirmed
type: architecture-gap
observed_in: gen2
---

# FINDING-0028：脚本机械面分得清分发角色，分不清代际与处置状态

## 分类

- 严重度：中
- 影响范围：repo、skill
- 研究方向：A. 生产者 / 产品分离（兼及 B. 控制平面机械身份）

## 观察

在 Gen2 迁移分支上，Agent / 贡献者可以回答「这个 `.js` 会不会进 tarball、谁该调用它」，但**不能**可靠回答：

```text
这是 1.0 遗留且应 retire / wrap 的外壳？
还是 2.0 新建且应保留的入口？
还是同一 CTRL 的双 profile（repo vs skill）？
```

物理与角色边界是清楚的：

| 位置 | 分发 |
| --- | --- |
| `scripts/` | 进包（INSTALLED 或 SKILL-INTERNAL） |
| `repo-tools/` | REPO-ONLY，永不分发 |

但**代际 / 处置**没有一等公民标签。结果是机械面混层：

1. **同目录叠 Gen1 外壳 + Gen2 内核** — 例：`scripts/check-secrets.js` 仍是装入项目的薄 WRAP；`scripts/evaluators/ctrl-0001-secret-protection.js` 已是 Phase 4 strangler 语义。整文件既不是「全废」也不是「全新」。
2. **同名双入口** — `scripts/check-secrets.js` 与 `repo-tools/check-secrets.js` 不是废 vs 新，而是 ADR-0020 下同一 CTRL 的 skill / repo profile。
3. **本仓门禁仍狗粮 INSTALLED 脚本** — `package.json` 的 `check` 仍调用 `scripts/check-doc-consistency.js` 等；角色上是产品面，使用上像 repo 门禁，加剧「这是不是 2.0 本仓脚本」的误判。
4. **能力台账 ≠ 文件垃圾清单** — RESEARCH-0006 对账的是 capability keep/wrap/extract/rewrite/retire，**不**裁决「此路径可删」。

较新的 Phase 5b 施工件（`repo-tools/route-task.js`、`repo-tools/lib/routing.js`）靠头注释写 PLAN-0039 才能辨认——这是**散文约定**，不是可门禁的 inventory。

## 证据

- 目录契约：`docs/product/en/architecture.md` / AGENTS § 分发角色 — `scripts/` vs `repo-tools/` 物理边界。
- 双 CLI：`scripts/check-secrets.js`（PAYLOAD WRAP）与 `repo-tools/check-secrets.js`（REPO-ONLY profile）头注释并列存在。
- Strangler 叠层：`scripts/check-secrets.js` 显式 `require("./evaluators/ctrl-0001-secret-protection.js")`。
- Dogfood：`package.json` `"check"` 同时串 `scripts/check-doc-consistency.js` 与多个 `repo-tools/*`。
- 5b 新件：`repo-tools/route-task.js` / `lib/routing.js` 仅头注释声明 PLAN-0039；无 `generation` / `disposition` 机读字段。
- RESEARCH-0006：能力保存矩阵；明确不按旧文件一对一迁移、不产出脚本 retire 清单。

## 根因

仓库把**分发角色**（ADR-0006 / init-spec / 目录边界）做成了硬契约，把**代际处置**留在 Plan/Research 散文与头注释里。Phase 4 strangler 允许「旧 CLI 路径 + 新 evaluator」共存，却没有要求每个机械文件声明 `generation` + `disposition`（keep / wrap / extract / rewrite / retire）+ owning CTRL/Capability。

因此「找规则」成本在 Markdown 侧由 Task→Capability 图缓解之后，**找脚本**仍可能回到目录浏览 + 口头历史。

## 若关闭，世界应变成什么样

存在一份 **script inventory**（或等价机读面），至少对 `scripts/**` 与 `repo-tools/**` 的每个入口声明：

| 字段 | 含义 |
| --- | --- |
| path | 仓库路径 |
| distribution_role | INSTALLED / SKILL-INTERNAL / REPO-ONLY |
| generation | gen1_carrier / gen2_native / dual_profile / … |
| disposition | keep / wrap / extract / rewrite / retire / undecided |
| owns | CTRL id 和/或 Capability id（可空） |
| evidence | PLAN / ADR / RESEARCH 指针 |

并且：

- 新增机械入口必须登记（fail-closed 或表征夹具）；
- `disposition: retire` 有明确删除/停用条件；
- 本仓 `npm run check` 不得在无声明的情况下把 INSTALLED CLI 当 repo profile（与 ADR-0020 对齐）。

关闭**不**要求立刻删光 Gen1 脚本；要求**不可再靠猜测**区分遗留与新建。

## 非目标

- 不在本 Finding 内执行大规模删脚本或目录搬家（≠ PLAN-0040 文档投影）。
- 不把 RESEARCH-0006 能力行改写成文件清单而不经 Plan。
- 不引入第三套 Task→Capability 查找模型。

## 关联

- ADR-0020 Producer/Product 执行分离 · ADR-0006 分发边界
- RESEARCH-0006 Gen1 能力基线 · FINDING-0001 / A03 隐性狗粮
- PLAN-0035 Phase 4 strangler · PLAN-0039（5b 新 CLI 仅注释可辨）
- L0 计划：[PLAN-0041](../plans/PLAN-0041-script-inventory.md)（**Implemented**）· [`script-inventory.v0.json`](../research/working/script-inventory.v0.json)
- 仍开：repo dogfood INSTALLED CLI、按 `retire` 隔离/删除（**禁止**按 `v1.0.2` 整夹搬走）

## 回归保护

（部分满足，Finding **未**关闭）L0：`tests/suites/script-inventory.test.js` — 缺登记则红；v0 禁止非空 `retire`。关闭仍需：dogfood 拆分或显式 dual_profile 声明门禁；`retire` 删除条件与引用清零。
