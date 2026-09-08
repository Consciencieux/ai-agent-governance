# ADR-0016: 文档结构从「语言树」转向「用途分层」——语言不是第一层分类维度

- 状态：Accepted
- 代际：gen2
- 日期：2026-09-08

## 背景

当前 `docs/` 采用「整个文档树按语言复制」的结构：`docs/{en,zh-CN,zh-TW}/` 下各自拥有 product 文档（architecture / governance-model / commands / validator / lifecycle / anti-regression / skill-discovery / bootstrap-output）+ roadmap + plans。

三语树适合产品文档（用户需要多种语言），但随着 knowledge 体系扩展（findings、research、ADR、archive、plans 带 ID），每新增一个文档类型都要维护 3 份目录、3 套链接、3 套同步规则、3 套索引——而大量内部知识根本没有三语需求。

关键观察：**findings / research / design-decisions / archive 已经在 `docs/` 根下单语**（ADR-0013、0014、0015 确立），只有遗留的三语树（product 文档 + roadmap）仍是旧模型。当前结构是「部分按用途分层、部分按语言分层」的过渡态。

## 决策

**1. 语言不是第一层分类维度，文档用途才是。**

```text
docs/

├── product/                # 用户 facing——多语言
│   ├── en/
│   ├── zh-CN/
│   └── zh-TW/
│
├── plans/                  # 执行计划——单语（zh-CN canonical）
│   ├── roadmap/            # roadmap 是边界对象——三语
│   │   ├── en.md
│   │   ├── zh-CN.md
│   │   └── zh-TW.md
│   └── PLAN-xxxx.md
│
├── findings/               # 单语（已在 docs/ 根下，维持）
│   └── FINDING-xxxx.md
│
├── research/               # 单语（已在 docs/ 根下，维持）
│   └── RESEARCH-xxxx.md
│
├── design-decisions/       # 单语（已在 docs/ 根下，维持）
│   └── ADR-xxxx.md
│
└── archive/                # 历史保存——单语 zh-CN canonical
    ├── plans/
    ├── findings/
    ├── research/
    └── adr/
```

**2. 语言策略由受众决定：**

| 知识类型 | 受众 | 语言 |
| --- | --- | --- |
| user-facing（README / 使用指南 / skill 指南 / 安装说明） | 用户、贡献者、外部开发者 | en + zh-CN + zh-TW |
| roadmap（边界对象） | 对外：项目方向；对内：架构迁移计划 | 三语 |
| execution plans | 项目维护者 | 单语（zh-CN canonical） |
| research / findings / ADR | 维护者、研究者、架构设计者 | 单语 |
| archive | 历史保存 | 单语（zh-CN canonical） |

**3. roadmap 保留三语**（它是边界对象，对外表达方向、对内承载迁移计划），但位置从 `docs/{en,zh-CN,zh-TW}/roadmap.md` 移到 `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`。

**4. 迁移规则：所有迁移记录到 change-hygiene，不破坏既有引用。**

## 后果

- 正面：每类知识只维护一份（除非用户 facing）；findings/research/ADR/archive 的三语负担消除；结构语义与「用途」对齐。
- 代价：**gate 脚本对三语树路径有深度硬编码**，需要同步适配：
  - `repo-tools/check-doc-parity.js`：解析 `docs/en/ docs/zh-CN/ docs/zh-TW/` 平行结构
  - `scripts/check-doc-freshness.js`：翻译对推导（zh-CN 源 → en/zh-TW 译）
  - `repo-tools/check-roadmap-sync.js`：硬编码 `docs/en/roadmap.md` + `docs/en/plans`
  - `scripts/check-doc-consistency.js`：principles index / plan-status 扫描 `docs/{en,zh-CN,zh-TW}/plans`
  - 大量测试 fixture 引用 `docs/en/**` / `docs/zh-CN/**` / `docs/zh-TW/**`
- 遗留风险：这是一次大爆炸式路径迁移，若一次性完成会破坏大量引用。**必须在 ADR-0014 Migration Mode 下分阶段实施**，每阶段用 checkpoint 验证，不追求一次性到位。

## 实施阶段（Migration Mode 内）

1. **Phase 1**：把 product 文档（9 个：architecture / governance-model / commands / validator / lifecycle / anti-regression / skill-discovery / bootstrap-output）从 `docs/{en,zh-CN,zh-TW}/` 移到 `docs/product/{en,zh-CN,zh-TW}/`，更新 gate 脚本路径。
2. **Phase 2**：roadmap 移到 `docs/plans/roadmap/`（保留三语），适配 `check-roadmap-sync.js`。
3. **Phase 3**：plans 从三语树合并为单语 `docs/plans/`。
4. **Phase 4**：archive 按类型分子目录（plans / findings / research / adr）。
5. **Phase 5**：清理旧路径引用、gate 脚本、测试 fixture。

每个 Phase 是一个独立 checkpoint（ADR-0014），gate 在 Migration Mode 下为观测性。

## 参考

- Migration Mode（重构期间 gate 观测化、checkpoint 验证）：ADR-0014
- 知识对象五分类（findings/research/ADR/plan/archive 边界）：ADR-0013
- Roadmap 重新定位（架构演进视图）：ADR-0015
- 三语拆分原决策（将被本 ADR 的 product 子集延续）：ADR-0005
