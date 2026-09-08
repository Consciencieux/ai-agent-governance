---
id: FINDING-0001
status: Confirmed
type: architecture-gap
direction: A
root_cause: R5
severity: Critical
affected:
  - repo
  - skill
github_issue: 7
opened: 2026-09-08
updated: 2026-09-09
resolved:
related:
  plans:
    - PLAN-0031
  adrs:
    - ADR-0006
---

# Producer / Product 治理耦合：物理边界已分开，语义与执行仍混杂

## 观察 Observation

本仓库的 producer（本仓库自身的 repo-tools / repo-workflows / docs / tests 治理）与 product（随 tarball 分发到被治理项目的 skill 载荷）在**物理**上已经分离（`package-skill.sh` 只打包 `SKILL.md` + `references/` + `scripts/` + `LICENSE`），但在 **policy、checker、执行语义**上仍混杂：同一套规则、同一类 checker、同一套执行假设在两个域里以不同形态存在。

## 证据 Evidence

- **A01 逻辑耦合**：`AGENTS.md` 的 `scope = both`（payload / repo-infra）把「两个领域共享原则」错误等同于「两个领域共用文件/实现」，ownership 边界模糊。
- **A03 control-level 隐性狗粮**：本仓库的 `npm run check` 直接执行 skill runtime checker（`check-doc-consistency.js` 等），repo 域控制平面与 product 域执行器没有分离——ADR-0006 只豁免了 artifact-level no-dogfooding（`verify_governance.js` 在本仓库预期退出 1），没解决 shared governance semantics。
- **A04 repo 修复不传播到 skill**：历史多次出现 repo 侧修了、skill 侧没修（release-provenance 陷阱同时存在于 `skill-release.md` 与 `references/workflows/release.md` + 生成的 release-manager 子技能）。
- **A05 `scope = both` 模糊**：`Target: both` 计划要求枚举每个域的同步点，但「共享原则」与「共用文件」没有显式建模，枚举靠手工。

## 根因 Root cause

- 三个 distribution role（INSTALLED / SKILL-INTERNAL / REPO-ONLY）描述的是**文件去哪里**，不是**规则语义属于哪个域**。
- 缺少 `affected: [repo, skill]` 式的显式归属声明（本 findings schema 已引入，尚未进入规则文件）。
- producer / product 的共享契约（哪些规则两域必须一致、由谁负责同步）没有单一事实源。

## 影响 Impact

- MIGRATE 流程基于被治理项目自己的 CHANGELOG 生成迁移清单，若 skill 侧规则漂移，升级路径不可预测。
- cross-profile closure（修 repo 必须同时确认 skill 已修）没有第一代机制。
- 若在 R5 未解决前直接设计 Rule Registry / Dispatcher，会把 `repo / skill / both` 的混乱直接编码进新架构。

## 关闭条件 Resolution criteria

1. 定义 producer / product 的共享契约清单（哪些规则两域必须一致）。
2. `affected` / ownership 字段进入规则文件（不只是 findings schema）。
3. cross-profile closure 有第一代机制：对每个双域规则，关闭条件 = repo fixed + skill fixed + cross-profile regression exists。

## 解决 Resolution

（进行中，状态保持 `Confirmed`。2026-09-09：boundary defined / remediation underway——Phase 1（PLAN-0031）定义 Producer/Product 边界与 ownership inventory，确立「共享语义只有一个 authoritative owner」原则；正式 cross-profile closure contract 与 CONTROL-X 落地在 Phase 3+，届时才将本 Finding 置为 `Resolved`。R5 应优先于 R1–R4 处理。）

## 回归保护 Regression protection

cross-profile regression：对每个声明 `affected: [repo, skill]` 的规则，一个测试证明两侧实现一致或至少都在受保护状态。
