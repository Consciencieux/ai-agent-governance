# 内容受众与可移植性边界（TASK 计划）

[English](../../en/plans/content-audience-portability.md) · [简体中文](content-audience-portability.md) · [繁體中文](../../zh-TW/plans/content-audience-portability.md)

> **Status: design plan, not implemented.**（状态：设计计划，未实现。）响应 2026-09-05 一次只读审计（针对发布载荷）：结构边界健全（打包正确、角色分类完备且经门禁验证），**但 INSTALLED 规则正文的内容仍然混用受众**。九处已确认泄漏——「`npm run check`」传到没有 package.json 的目标项目、技能仓库的 `docs/archive/` 出现在同一文件自己写着 `docs/plans/archive/` 的被治理项目规则里、硬编码的三语义务、悬空指针、以及两个生成的子技能叫目标项目运行它们没有的脚本。

**Target: both** —— `payload` 改写泄漏的规则文本（`references/policies/lifecycle.policy.md`、`references/templates/sub-skills.md`、`SKILL.md`、`references/workflows/release.md`、`scripts/check-layout-sync.js`）并新增 tarball→INIT 边界测试；`repo-infra` 在文档与术语表中记录双轴模型并添加可移植性检查。两个域分别列在「受影响文件」中。

### 任务目的

封住「文件分发到哪里」与「文件内容在谈什么」之间的泄漏。分发角色（INSTALLED / SKILL-INTERNAL / REPO-ONLY）回答的是*文件去哪*；它不回答*谁读它*、*它的路径在目标环境中是否存在*、*它的规则在哪种项目形态下成立*。本计划修正内容，使下列表述到处成立：

> INSTALLED 必须 project-portable；REPO-ONLY 可以使用本仓库路径与命令；SKILL-INTERNAL 不得被生成内容引用为目标项目依赖。

并把两个正式区分记录为文档化概念（受众、可移植性）——不发明第四种分发角色，不做禁词扫描器。

### 当前问题（2026-09-05 审计）

审计实际生成 tarball、安装它，再产出两个真实的被治理项目夹具（`--phase A` 与 `--phase C --stack node`），然后检查的是**安装后输出**而非源码。发现：

**A. 在被治理项目中不能成立的 INSTALLED 规则文本（四处泄漏全部位于 `references/policies/lifecycle.policy.md`）：**

1. **lifecycle.policy.md:113** → 装为 `docs/rules/lifecycle.md`：「被治理项目运行其 `verify-governance.js`，本仓库使用 `npm run check`。」被治理项目根本没有 `package.json`；`check` 脚本是 REPO-ONLY。这是技能仓库的维护指令进了目标项目的 Phase 5c。
2. **lifecycle.policy.md:61** → 历史层一行命名 `docs/archive/`——本仓库的归档路径。**同一文件 121 行**正确写着 `docs/plans/archive/`。装进去的规则自相矛盾。
3. **lifecycle.policy.md:66,68** → 变更卫生验证义务硬编码「三语文档」。那是本仓库的 en/zh-CN/zh-TW 布局；技能自己的语言政策写明多语言树只在项目明确采用时才生成。
4. **lifecycle.policy.md:11** → 「审查（review-manager，见 `plans/review-manager.md`）」——该路径在任何领域都不存在（仓库、载荷、夹具都没有）。

**B. 引用目标项目没有的脚本的生成子技能：**

5. **sub-skills.md:389** → 生成的 `review-manager/SKILL.md` 步骤 5：「run `npm run check` (tests + parity)」。与 v0.13.0 CHANGELOG 已修复的 RELEASE 流程那条（check-plan-delivery/package-skill）同类——这条在 review 流程里幸存。
6. **sub-skills.md:182** → 生成的 `drift-check/SKILL.md`：「**trilingual tree parity** — delegates to `scripts/check-doc-parity.js`」。`check-doc-parity.js` 是 SKILL-INTERNAL，实测被治理项目里没有；且**兄弟行 265** 已正确加条件（「only when the project HAS such trees and a parity checker; skip otherwise」）——182 行被同一修复漏掉。

**C. SKILL.md 指向只在本仓库存在的文件：**

7. **SKILL.md:49** → 「完整自动化 INSTALL → UPDATE → ROLLBACK 由 ai-skill-manager 提供，见 `docs/zh-CN/plans/skill-lifecycle-management.md`」。该文件在本仓库三语树里、在仓库中存在，**在载荷中不存在**。只装 tarball 的用户拿到死链。

**D. release 流程以目标项目没有的脚本做硬门禁：**

8. **release.md:41** → `plan.delivery_verified`：「`scripts/check-plan-delivery.js` 退出码 0（…）」标 ❌ 停止发布。`check-plan-delivery.js` 是 SKILL-INTERNAL。兄弟项 `docs.parity_passed`（39 行）已正确加条件（「仅适用于维护三语文档树的仓库」）；41 行没有。

**E. 违反 no-op 规则的 SKILL-INTERNAL 脚本：**

9. **check-layout-sync.js** —— 在被治理项目形态下退出 1：「no files found under references — layout scan would cover only part of the tree」。违反仓库自己的明文规则：「SKILL-INTERNAL 脚本必须在本仓库形态之外 no-op」（AGENTS.md 分发角色，以及 check-coding-hygiene.js 等脚本已遵循的模式）。
10. **governance-files.policy.md:3** → 装为 `docs/rules/governance-files.md`：「SKILL.md 的「治理文件保护」节 … 均以本文件为准」。被治理项目没有 SKILL.md（no init-spec artifact emits it），这句话指向目标项目不存在的文件。其自知的括号（「目标项目不引用本仓库文件」）不豁免前一句——它把 SKILL.md 节列为目标项目不可能拥有的权威。

### 提议方案

#### 1. 改写泄漏的 INSTALLED 文本（先让内容正确——在任何检测器之前）

##### 1.1 lifecycle.policy.md —— 让每句话在被治理项目中成立

- **113 行**：把「本仓库/npm run check」的对比换成对任何目标成立的规则：如「被治理项目运行其 `verify-governance.js`；它没有的检查由 [已安装门禁] 覆盖，不依赖技能仓库的命令」。「npm run check」这个事实属于本仓库的 AGENTS.md（仓库侧 phase 5 表述），不属于装进项目的规则。
- **61 行**：`docs/archive/` → `docs/plans/archive/`（被治理项目的历史层在那里存放版本化归档）。
- **66、68 行**：「三语文档」→「多语言文档（若项目采用了多语言文档树）」；义务变条件而非假设。
- **11 行**：删除悬空的 `plans/review-manager.md` 指针；引用实际存在的生成子技能路径（`.governance/generated/skills/review-manager`），或直接删掉指针、把审查步骤说清楚。

##### 1.2 sub-skills.md —— 对齐两处幸存引用

- **389 行**（review-manager 门禁验证）：把 `npm run check` 换成目标自己的验证命令——如「run the project's tests and the installed scoped gates (verify-governance.js, check-secrets.js); record real output」。
- **182 行**（drift-check 三语 parity）：按 265 行的方式加条件——「only when the project HAS such trees and a parity checker; skip otherwise」。

##### 1.3 governance-files.policy.md —— 「SKILL.md 节」指针

- **第 3 行**：「SKILL.md 的「治理文件保护」节、生成的 AGENTS.md（references/templates/agents-md.template.md）、docs/rules/git-policy.md 中的清单均以本文件为准」。被治理项目没有 SKILL.md（实测：init-spec 无该工件），"SKILL.md 的「治理文件保护」节"指向目标项目不存在的文件。自知的括号（「目标项目不引用本仓库文件」）不豁免前一句。修正：只点目标项目实际拥有的工件——生成的 AGENTS.md（其保护节同源）与 `docs/rules/*.md`（安装的规则）——并将出处事实（本清单是技能仓库与生成目标双方的单一来源）只作为说明陈述，无 SKILL.md 指针。

##### 1.4 SKILL.md —— 移除死计划指针

- **49 行**：ai-skill-manager 指针不得引用只在本仓库的 docs 路径。要么链到 GitHub 项目（URL 形式），要么只说明完整自动化由 ai-skill-manager 提供，不写只在本仓库存在的路径。

##### 1.5 release.md —— 硬门禁需要目标可满足的硬件

- **41 行**：`plan.delivery_verified` 不能以 SKILL-INTERNAL 脚本 ❌ 失败。实现时二选一（都保留门禁意图）：(a) 像 parity 一样加条件——「当项目计划使用 Affected Files 声明且存在交付检查器时」；(b) 注明该检查是技能执行器自己的步骤（`check-plan-delivery.js` 在技能仓库运行），从不是目标项目要求。

##### 1.6 check-layout-sync.js —— 遵守 no-op 规则

- 加 check-coding-hygiene.js 与 check-role-completeness.js 已用的形态守卫：当本仓库形态缺失时（`references/` 与 `scripts/` 都缺——被治理项目正是如此），报告 `applicable: false` 并退出 0，而不是为部分语料失败。

#### 2. 记录双轴模型（文档，不是机制）

- **docs/{en,zh-CN,zh-TW}/architecture.md**：加入 *分发角色*（文件去哪）与 *可移植性/受众*（谁读它；内容脱离技能仓库是否成立）的区别。展示四受众表（技能执行 Agent、被治理项目 Agent、本仓库贡献者、生成器）与逐文件可移植性列：`SKILL.md` = skill-portable，`lifecycle.policy.md` = project-portable，`release.md` = repo/skill-specific，`check-doc-parity.js` + repo-only 门禁 = repo-specific，`AGENTS.md` = repo-specific。
- **docs/glossary.md**：注册 `audience`（受众/受眾）与 `portability`（可移植性/可移植性）——本变更集已随计划完成（此前未注册）。
- **AGENTS.md**：写明规则——INSTALLED 内容必须 project-portable；仓库特定命令/路径事实属于仓库侧文件。后续贡献者据此写出可移植的 INSTALLED 文本。

#### 3. 可移植性验证（窄、证据驱动——不是禁词扫描器）

明确**不建**禁词门禁：「INSTALLED 不得包含 `npm run check`」这类黑名单会误报，也抓不住任意新泄漏。改为：

- **3a. 生成引用可解析检查**：在现有 payload 夹具框架的 INIT 之后，验证生成子技能（`docs/rules/*.md`、`AGENTS.md`、`.governance/generated/skills/**`）中每条 `node scripts/...` / `bash scripts/...` 指令都能解析为生成项目里实际存在的文件。把现有 payload 测试 `INIT installs the release tag executor the sub-skill invokes`（已对 release-manager 做此检查）扩展为覆盖**全部**生成子技能与 review/drift 流程，以及 AGENTS.md 与 docs/rules 文件。
- **3b. check-layout-sync.js 被治理项目形态的独立行为测试**：断言退出 0 + `applicable: false`（镜像 check-coding-hygiene 的 no-op 测试）。
- **3c. 载荷围栏内的死链扫查**：check-doc-consistency.js 的 broken-links 簇已能解析相对 markdown 链接；把它的 INSTALLED 文件检查（`references/` 现已入扫描集）扩展为同时标记「载荷文件链接到被治理项目中不可能存在的路径」。若无法保证无歧义就以 advisory 提示级呈现；不把散文扫描变成门禁。

#### 4. 发布流程受众拆分（被治理项目政策保留，技能仓库停止借用）

2026-09-05 的 RELEASE 模式评估（对照 AGENTS.md:113 与 `references/workflows/release.md` 审计）发现：发布流程与文件内容存在**同源的受众混用**——一份流程文件携带三种意图（发布本 skill、发布被治理项目、完成本仓库维护）。AGENTS.md:113 是症状：五条「Caveats unique to this repo」+「Path mapping for THIS repo」把一份被治理项目政策补丁成本仓库的发布。

**采纳并做一处修正。** 评估的核心提案是对的（停止借用被治理项目政策；新增一部简短的技能仓库发布文档；把仓库维护与发布有效性分离）。但其中两步需要修正：

- **`release.md` 保留其被治理项目内容** —— 它是写给被治理项目的 payload 工件（SKILL-INTERNAL，按 AGENTS.md「release.md is payload written for governed projects」）。目标项目的测试/变更日志/manifest/同步组/tag/GitHub Release **属于它、不移除**。但它对 `check-plan-delivery.js` / `check-doc-parity.js` / `check-layout-sync.js` / 本仓库归档规则的无条件引用**要修**——那些是本仓库专用能力，必须条件化（能力检测）或对无法满足的结构去掉硬性 ❌。
- **`check:release` 不是「被治理项目侧」门禁。** 它定义在本仓库 `package.json`，运行本仓库的 test、三语文档、计划交付、归档状态、译文新鲜度、CHANGELOG 覆盖——全部 REPO-ONLY 内容。被治理项目没有 `package.json`、没有三语文档树、没有 `check-plan-delivery.js`。它是**本仓库维护**投入检查，绝不是目标项目能运行的命令。重新标注：`check:release`（保留，但文档明确它是本仓库专用），或拆成 `check:skill-release` / `check:repo` / `check:repo-release`。仅当命名混淆实际发生才拆；先做语义文档修订。

**目标形态（本轮只记录，不实施）：**

- `release.md` = **Governed Project Release**（保留；目标项目内容保留）。
- `skill-release.md`（新增，SKILL-INTERNAL）= **Skill Repository Release** —— skill 版本源（SKILL.md frontmatter、package.json、CHANGELOG、init-spec default、generator fallback、tag）、skill 测试、tarball 构建、tarball 内容白名单、校验和、GitHub Release、用户批准。
- `plan/archive/roadmap` = **Repo Maintenance** —— 照常运行，但永不再描述为「skill 工件有效性证明」。

**刻意不抽象共享工作流。** 评估较早前的步骤（两个流程共同引用一份「发布政策」散文）按其自身理由被否决：那样会重新制造「一个共享流程 + 两套例外 + 两种路径映射」。共享**行为**（SemVer 判定、headSha 绑定、工作区检查、tag 创建、用户确认语义）保留在脚本（`release-manager.js`）中，两份文档各自描述自己的流程。散文中的少量重复是可接受的。

**C6 继续延后。** Skill Release 只要求用户批准；`reviewStatus` 继续明确标为 self-attested；`headSha` 保持真实绑定。不提前实现评审证据，也不被治理项目的 review-manager 交叉污染。

#### 5. 依赖方向规则（第 1–4 节检查的定义层）

后续评估（2026-09-05）正确指出：文件角色轴只回答*文件去哪*，不回答内容/引用/执行者是否跨受众。其依赖图提案采纳为定义层——五条规则，只陈述一次，§3 的可移植性验证与 §4 的发布拆分都是其实例：

```text
REPO-ONLY      可以描述仓库内部、也可以描述 payload                （允许）
SKILL-INTERNAL 可以读技能包内部；绝不可成为目标项目运行时依赖     （受限）
INSTALLED      只能依赖被治理项目拥有的文件/命令                 （允许）
生成的目标项目  绝不可反向依赖仓库 docs/tests/package.json         （禁止）
installed ──> repo-only : 禁止
generated ──> skill-internal : 禁止
```

审计（见上发布流程发现与 10 处泄漏）已逐条演示每条禁止边。本节补充的是通用规则与引用图，使后续修复按这个推理重复，而不是每次重新推导。

**在执行环境验证，绝不在编写环境验证。** 这是整份计划所依赖的方法论规则，也是这个问题前两次被问到时只得到印象式回答的原因。INSTALLED 文件里的一句话，写作时所在的仓库有 `references/workflows/release.md`；被读取时所在的项目没有这个路径。因此正确性无法靠读源码树判断——编写环境能解析目标解析不了的引用。具体：

- 判断 INSTALLED 内容，意味着生成一个真实项目（`generate-governance.js --target <tmp> --phase C`，以及 `--phase A`），并在**那里**解析每一条引用。
- 判断只装 tarball 的用户看到什么，意味着解压 tarball 并在那里解析——`docs/` 是 REPO-ONLY，所以任何指向它的载荷指针对该用户都是死链，尽管它在仓库里能解析。
- 「看起来像本仓库特有」是错的过滤器。它能抓 `本仓库` / `三语` / `docs/archive/`，却漏掉每一条读起来完全正常、只是没被安装的引用（下面那 8 条 `references/…`）。**缺陷按可解析性分布，不按可疑措辞分布**——所以要枚举并解析，绝不按可疑性抽样。
- `scripts/check-doc-consistency.js` 是这一立场的参考实现：它对 parity 脚本做 `existsSync` 守卫、glossary 缺失时 no-op、consent 组只在至少一条路径存在时才检查。它假设自己可能运行在与编写处不同的环境。K9/N3 违反的正是这个范式。

**`references/…` 指针类 —— 系统性，不是偶发。** 已完成的审计（2026-09-05）确认泄漏 K10 只是一条通用规则违反的一个实例：**任何 INSTALLED 文件只要用 `references/` 路径引用载荷同侪，在目标项目里就是断的**，因为 INIT 要么重命名它（`references/policies/lifecycle.policy.md` → `docs/rules/lifecycle.md`），要么根本不装。八个确认实例：`git.policy.md:23,64,95,99`（4 处——一个此前完全不在计划里的文件）、`sub-skills.md:177,202,286`（3 处）、`lifecycle.policy.md:108,109`（2 处）、`governance-files.policy.md:58`（1 处）。修法是一条规则、处处适用：**INSTALLED 文件用目标拥有的路径引用同侪**（`docs/rules/*.md`），或者陈述事实而不给路径。

**交叉受众审计 —— 已完成（2026-09-05），发现如下。** 全量交叉引用审计已覆盖 `references/policies/*.md`、`references/templates/*.md`、`SKILL.md`、`references/workflows/*.md`、`init-spec.json`、全部 INSTALLED 与 SKILL-INTERNAL 脚本、`package-skill.sh`、生成的子技能，以及两个真实夹具（`--phase A`、`--phase C`）加解压后的 tarball。结果：**已知 10 处全部在实时夹具上确认；8 处新增真实缺陷；11 处确认为合法双重使用**（审计能够**证明正确**与能够发现缺陷同样重要）。分类合计：12 目标项目泄漏 · 8 skill 内部依赖泄漏 · 4 错误路径 · 5 重复权威源 · 3 仅文档无执行者 · 11 合法双重使用。

需并入 §1 的新缺陷（此前未列）：

- **N4/N5** —— `git.policy.md:23,64,95,99`，四条 `references/…` 指针以 `docs/rules/git-policy.md` 形式抵达目标。单文件命中最多；此前不在受影响文件中。
- **N6/N7/N9/N10** —— 同类的其余四个实例（`sub-skills.md`、`lifecycle.policy.md`、`governance-files.policy.md`）。
- **N1** —— `SKILL.md:278` 引用 `docs/<lang>/bootstrap-output.md`；与 K7 同病、仅隔一行。§1.4 必须同时修两处。
- **N2** —— `coding.policy.md:8` 让被治理项目参考「本仓库的 `.gitattributes`」作为模板。
- **N3** —— `check-role-completeness.js` 在被治理形态下与 K9 一样失败，且它**已经算出 `applicable:false` 却仍 exit 1**。§1.6 覆盖两个脚本。
- **N29** —— 安装后的 `verify-governance.js` 带着写有 `verify_governance.js`（下划线）的用法行；逐字复制的产物，目标自己的文件引用了它没有的文件名。
- **N16** —— `release_requirements`（11 项）在 `release.md` 与 `sub-skills.md` 各枚举一份，后者声称遵从前者却又整份复述；两者**已经漂移**（L39/L41 与 L218/L220 的 hedge 不同）。归入 §4 的发布拆分。
- **K10 比记录的更大** —— 同一行还点了 `references/templates/agents-md.template.md`；只修 SKILL.md 那半句，泄漏仍在。

**N20/N19 —— Phase A 契约：已裁定（方案 a —— 按阶段裁剪生成内容）。**

实测：`AGENTS.md` 是 **Phase A** 工件，而它命令的每个脚本都在 Phase B（`verify-governance.js`、`check-lock.js`、`check-git-policy.js`、`check-secrets.js`、`check-sync.js`）或 Phase C（`check-doc-freshness.js`、`check-doc-consistency.js`、`release-manager.js`）。产物早于其依赖两个阶段。实测：`fixA has scripts/? false`，而 fixA 的 `AGENTS.md:102` 仍写着「Before any `git commit`: run `node scripts/check-secrets.js` — exit 0 required」。

**裁定：按阶段裁剪生成内容，**同时**声明检查点状态——不是二选一。** 只声明「Phase A 非独立可用」而保留那些命令，修不了任何东西：一个已经被加载的 Phase A Agent 会立即开始工作，然后撞上指向不存在文件的指令。缺陷在于**产物自身包含不可执行指令**，不在于说明书没警告。只改文档，等于把「运行失败」变成「预告过、然后运行失败」。

阶段契约：

```text
Phase A = 静态引导检查点      （不是可用的治理状态）
Phase B = 可执行治理基线
Phase C = 自适应补全
```

Phase A 产物必须：生成静态骨架；明确写出初始化尚未完成；**不命令任何尚未安装的脚本**；不把未安装脚本列为当前强制执行的受保护项；不声称已具备完整治理能力；并可从 `state.json` 恢复继续 B/C。脚本执行要求、受保护脚本清单、validator 要求、Git policy 检查与同步检查，只在 Phase B 安装了对应脚本之后才出现。

实现是最小的——不需要新状态机。`--phase A/B/C` 已经提供了条件，只需让模板产出按阶段裁剪。三个回归测试：

1. Phase A 产物不引用 Phase A 未安装的任何脚本。
2. Phase A 产物明确标记初始化未完成。
3. Phase B/C 产物包含该阶段实际安装的脚本所对应的要求。

**根因升格为规则（停止逐路径修）。** 本次审计证明，计划不能再以「发现一个路径修一个路径」的方式维护。规则：

> 任何 INSTALLED 内容的引用，必须在**目标项目的执行环境**中解析；该路径在 skill 源码仓库中存在，不构成它可用的证据。

同类审计对象，全部以这一条规则判定：文件引用 · 命令引用 · **阶段依赖** · 生成物依赖 · SKILL-INTERNAL / INSTALLED 边界 · 目标项目与 skill 仓库的路径差异。

#### 6. 不做

- 不重造分发角色；INSTALLED/SKILL-INTERNAL/REPO-ONLY 仍是文件放置的唯一轴。
- 不以禁词扫描器为主要证据。
- 不创建第四种受众/可移植性状态机；两轴是文档化概念，不是工件。
- 不改 release.md 的自豁免行（38/183）——那些是正当的：release.md 是 SKILL-INTERNAL，技能执行器真的会在发布本仓库时读取它们。

### 验证（证据等级）

- 每条改写的 INSTALLED 规则文本都用现有端到端复检：tarball → INIT → 生成项目 → 每条被引用的路径都能解析（机械）。
- check-layout-sync.js 被治理项目 no-op 测试（机械）。
- 现有套件保持绿色；新测试经突变验证（泄漏重新引入时会失败）。
- 文档/术语表改动经 check-doc-parity + 术语门禁验证（机械）。
- 不新增禁词语法；可移植性规则在 architecture.md 中作为文档化边界陈述，而非扫描器。

### 受影响文件

**payload（INSTALLED / SKILL-INTERNAL 内容与行为）：**

- `references/policies/lifecycle.policy.md` —— §1.1（4 处泄漏）+ N9（2 条 `references/…` 指针）
- `references/templates/sub-skills.md` —— §1.2（2 处幸存引用）+ N6/N7（3 条 `references/…` 指针）+ N8（无条件 glossary）
- `references/policies/governance-files.policy.md` —— §1.3（SKILL.md 节指针，以及同一行的 agents-md.template.md 子句）+ N10 + N12/N13（跟踪表中混用两种根）
- `references/policies/git.policy.md` —— **N4/N5：四条 `references/…` 指针**（L23、L64、L95、L99）。单文件命中最多；原计划中缺失。
- `references/policies/coding.policy.md` —— N2（「本仓库的 `.gitattributes`」作为模板指针）
- `SKILL.md` —— §1.4（死计划指针 L49 **与** L278 的 `docs/<lang>/bootstrap-output.md`）
- `references/workflows/release.md` —— §1.5（硬门禁 L41）+ N16（release_requirements 与 sub-skills.md 重复，且已漂移）
- `references/templates/agents-md.template.md` —— **N20：Phase A 契约，已裁定（a）** —— 按阶段裁剪脚本子句；Phase A 只产出静态骨架 + 初始化未完成标记
- `scripts/generate-governance.js` —— N20 按阶段渲染 AGENTS.md 模板（`--phase` 开关已存在，模板产出须遵从它）
- `references/workflows/ci.md` —— N19（生成的 ci.yml 调用 verify-governance.js；干净 `--phase A` 下不可达，但属同一契约）
- `scripts/check-layout-sync.js` —— §1.6（no-op 守卫）
- `scripts/check-role-completeness.js` —— **N3：与 K9 同样的 no-op 违反**（已算出 `applicable:false` 仍 exit 1）
- `scripts/verify_governance.js` —— N29（用法行写着目标没有的下划线文件名）

**repo-infra（文档、术语表、测试、接线）：**

- `docs/glossary.md` —— audience / portability 术语（本变更集已随计划加）
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— §2 双轴模型
- `AGENTS.md` —— §2 可移植性规则（INSTALLED 内容须 project-portable）
- `tests/suites/payload.test.js` —— §3a 生成引用可解析（全部子技能 + 规则）+ N20 的三个阶段契约回归（Phase A 不引用未安装脚本 · Phase A 标记初始化未完成 · Phase B/C 携带该阶段所装脚本的要求）
- `tests/suites/docs.test.js` —— §3b check-layout-sync no-op；§3c 若实施则死链提示
- `CHANGELOG.md` —— 发布条目
