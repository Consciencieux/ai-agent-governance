---
id: RESEARCH-0015
status: Active
version: 2
---

# RESEARCH-0015：论文实验装置钉点与四门冻结

本文件是 **本仓作为论文实验装置时的引用钉点 / 导出约定 / 假绿 Option B 出处**。它回答：「论文仓引用本技能时钉哪个版本？主实验四门如何冻结？假绿回顾从哪几个历史 commit 检出？」

它**不是** Finding（假绿病例在 FINDING-0034 / 0035 / 0003）。它**不是** ADR 的完整替代（产品路径仍在 ADR-0025；本文件被 ADR-0025 2026-09-17 修正引用）。夹具树与三臂跑数在论文仓施工，不在本仓 Active Plan。

## 研究对象

把本仓库 `scripts/` 中 **INSTALLED** 校验器当作外部论文实验的可复现装置时：版本钉点、CLI 契约冻结面、导出闭包、已退役假绿脚本的 last-present SHA。

## 研究动机

论文仓 `agent-governance-paper` 已冻结主张与方法，但夹具依赖本仓脚本字节。若不钉 SemVer/commit、不冻结四门 CLI，Unreleased 卫生改动会让夹具与正文对不上；假绿回顾若无 last-present SHA，Option B 无法复现。钉点必须与**即将承载 Unreleased 的发布边界**一致，不得钉已过期的上一 tag。

## 模型

### 1. 引用钉点（必用）

| 项 | 值 |
| --- | --- |
| 产品 SemVer | **`v2.2.0`**（下一发布边界；人裁定 2026-09-17） |
| 标签指向的 commit | **发布打 tag 后填写**（`git rev-parse v2.2.0^{commit}`） |
| 主实验四门 | `verify-governance.js`（源 `verify_governance.js`）、`check-secrets.js`、`check-sync.js`、`check-sibling-closure.js` |

正文与分类表引用 **`v2.2.0`**，不要写浮动的 `Unreleased` / `HEAD`，也不要钉已过期的 `v2.1.1`。  
`v2.2.0` tag **尚未存在**时：冻结约定已生效（以当前工作树四门 CLI 为准）；论文跑数与补充材料导出须等 tag 落地后用 **`--ref v2.2.0`**。

### 2. 四门冻结（实验窗口）

自本钉点裁定起、至论文主表定稿前：

- **禁止**改动上述四门（及其 paper profile 闭包依赖：`secret-scan-facts.js`、`ctrl-0001`，以及 verify 所需的 `check-lock` / `check-git-policy` 等）的 CLI 契约：exit code、`--json` 形状、默认 gate vs advisory。
- 文档路由、REPO-ONLY 门禁、非四门 INSTALLED 脚本的卫生改动可以继续，并进入 `v2.2.0` 发布面。
- **禁止**为论文「有效性」新增 checker；假绿回顾只用已退役材料（§4），不得复活进日常 `check`。

解冻条件：论文补充材料写明新 pin（新 tag 或新 SHA），并重跑夹具基线。规范落点：ADR-0025 后续修正（2026-09-17）。

### 3. 导出 INSTALLED 脚本

```bash
# 论文夹具推荐：钉 v2.2.0 字节（tag 落地后）
node repo-tools/export-installed-scripts.js --out /path/to/agent-governance-paper/fixtures/_scripts --profile paper --ref v2.2.0

# tag 前仅本地预演（不得写入论文补充材料当最终 pin）
node repo-tools/export-installed-scripts.js --out /tmp/gov-scripts --profile paper

# INIT 全部 scripts/ copy 产物
node repo-tools/export-installed-scripts.js --out /tmp/all-installed --profile all-installed --ref v2.2.0
```

`paper` 配置写出 `verify-governance.js`（已改名）及密钥 / 同步 / sibling / lock / git-policy / consent 闭包；目标目录写入 `EXPORT-MANIFEST.json`（含 `cited_product_version: "2.2.0"` 与 `ref_commit`）。

**不要**用本仓 `repo-tools/` 日常门禁充当用户项目门。

### 4. 假绿回顾 Option B（历史检出）

主有效性表**不得**计入下列脚本。若补充材料要「检出已删逻辑再跑」，用下表 **last-present** commit（文件仍在树中的最后一次）：

| 对象 | Finding | last-present (文件仍在) | 退役 commit |
| --- | --- | --- | --- |
| `repo-tools/check-terminology.js` | FINDING-0034 | `aa41f76dcc49c3c37a1123a7e4a682d352199ccc` | `ec23fdc08d0aac25181513d75f4278dc1710e5e7` |
| `repo-tools/check-changelog-narration.js` | FINDING-0035 | `ee86fba5610e42415ba32539001aab3cfc7febc3` | `8ef3c7b7966befa3caa3baeda39a785df807b147` |
| `scripts/lib/doc-consistency/numeric-claims.js` | FINDING-0035 | `9d74222ff48e13f4ff734c232875f9b5c314b135`（= `8ef3c7b^`） | `8ef3c7b7966befa3caa3baeda39a785df807b147` |
| `scripts/lib/doc-consistency/consent-cluster.js` | FINDING-0035 | 同上 `9d74222…` | 同上 |
| `tests/suites/judgment-language.test.js` | FINDING-0035 | `99989093daf5e968559e0f72587695851b50c6ed` | `8ef3c7b7966befa3caa3baeda39a785df807b147` |

示例：

```bash
git show aa41f76dcc49c3c37a1123a7e4a682d352199ccc:repo-tools/check-terminology.js > /tmp/check-terminology.js
```

Option A（只引用 Finding 关闭记录、不做归档复现）不需要本表。无合同 sibling 假绿（Issue #5 / FINDING-0003）只进讨论节，不是现行 `check-sibling-closure.js` 的红样。

## 证据

- 钉点裁定：下一发布 = `v2.2.0`（2026-09-17）；commit SHA 在 tag 后回填。
- 导出载体：`repo-tools/export-installed-scripts.js`；表征测试：`tests/suites/export-installed.test.js`（`cited_product_version` = `2.2.0`；`--ref` 在 pin tag 缺失时回退到已有 ref 验通路）。

## 影响

- 本仓侧钉点 / 导出 / 假绿 SHA / 冻结约定以本文为准；论文仓仍负责可跑夹具、三臂与 §5–§6 填数。
- Roadmap Now 索引本文；不另开 Active Plan。
- **发布后必做：** 回填本节 commit 行；确认 `git rev-parse v2.2.0^{commit}` 与 `EXPORT-MANIFEST.json` 的 `ref_commit` 一致。
