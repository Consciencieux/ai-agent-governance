# 仓库边界拆分 —— 载荷目录 vs 仓库工具(TASK 计划)

[English](../../en/plans/repository-boundary-split.md) · [简体中文](repository-boundary-split.md) · [繁體中文](../../zh-TW/plans/repository-boundary-split.md)

> **Status: implemented.**(状态:已实现。)2026-09-05 受众审计的后续。`content-audience-portability` 计划修复了 CONTENT 泄漏;本计划修复的是允许泄漏的 STRUCTURE:声明的分发角色没有任何东西强制执行。`package-skill.sh` 整目录复制,所以只要文件住在 `references/` 或 `scripts/` 下,无论 `init-spec.json` 为它声明了什么角色,它都会被打给每个 tarball 用户。当前树实测:按体积计 tarball 的 45%(7 个文件,约 51 KB)是本仓库自己的维护内容,任何技能用户都无法对其行使操作。

**Target: both** —— `payload` 改变 tarball 携带的内容(7 个 repo-only 文件移出分发目录)并强化 `init-spec.json` 与角色门禁;`repo-infra` 重接所有指向被移动路径的引用(package.json 脚本、CI、测试、AGENTS.md、SKILL.md、三语 architecture)并记录新规则。两类分别列于 Affected Files。

### Objective(目标)

让 tarball 边界成为**物理事实,而非声明**。当前不变式是"声明的角色与目录式复制一致"——这正是 `check-role-completeness` 证明的东西,它不够:删掉 `references/init-spec.json` 的 `distribution` 段,打包内容不会有任何改变。新不变式:

> tarball 内容边界由目录结构直接保证;tarball 不包含任何 REPO-ONLY 文件。

一旦成立,repo-only 文件无论声明写什么都不可能泄漏进载荷;"该角色要不要 tarball 开关"这第四个维度也就永远不会出现。

### Current problem(现状,审计后实测)

1. **发布流程的拆分从未真正完成。** `skill-release.md` 仍在四个位置依赖 `release.md`(L3、L53、L57、L77——SemVer 判定、风险分级、事务性……),且引用链单向:`release.md` 从不回头。两份文档在文档维度分开,在依赖维度仍然耦合。
2. **角色是声明式;打包是目录式;没有人对账。** `package-skill.sh` = `cp SKILL.md + cp -R references + cp -R scripts + cp LICENSE`。它不读 `init-spec.json`、没有角色过滤,没有任何东西验证 `check-role-completeness` 声明的内容与真正落进 tarball 的内容一致。
3. **tarball 携带本仓库内部工具。** 打包了但技能用户用不上:`references/workflows/skill-release.md`(7 项 repo-only 事实——本仓库自己的 `npm run check:skill-release`、本仓库的 `package.json`、`docs/{en,zh-CN,zh-TW}/roadmap.md`、`docs/archive/`、`package-skill.sh`、`init-spec.json`、`ai-agent-governance` 之名)、`scripts/package-skill.sh`(硬编码本技能 tarball 名)、以及五个 repo-only 门禁 `check-doc-parity.js` / `check-plan-delivery.js` / `check-layout-sync.js` / `check-role-completeness.js` / `check-coding-hygiene.js`——任何执行器引用都没有(SKILL.md、sub-skills.md、release.md 从未提到它们;上一轮加的 no-op 守卫只是在打磨一个目标本不该收到的文件)。
4. **受众混用不止这一个案例。** `sub-skills.md`(INSTALLED)仍带着 6 处「本仓库/技能仓库」与 3 处 `package.json` 表述;这些会直接带入被治理项目,在那里读起来完全错位。
5. **边界验证测试只证明闭包,不证明打包。** 闭包测试(3a/3c)解析生成项目内部的引用;没有任何东西检查 tarball 本身。

### Proposed solution(方案)

#### 1. 新目录形态 —— 目录即角色边界

```text
SKILL.md            skill 入口(用户安装即运行)
references/         仅:skill 执行内容 + INIT 产物源(policies + templates + workflows/release.md + workflows/ci.md + init-spec.json)
scripts/            仅:安装到目标项目的 8 个脚本 + generate-governance.js(SKILL-INTERNAL)
repo-tools/         本仓库专用脚本(绝不打包):package-skill.sh、check-doc-parity.js、check-plan-delivery.js、
                    check-layout-sync.js、check-role-completeness.js、check-coding-hygiene.js
repo-workflows/     本仓库专用文档(绝不打包):skill-release.md(单语,agent-facing)
docs/ tests/ package.json .github/ CHANGELOG.md AGENTS.md LICENSE(根,不变)
```

打包的**机制**保持简单——不引入任何逐文件角色过滤——但本计划确实改变了复制携带的内容:下列 7 个文件离开分发目录,`SKILL.md + references/ + scripts/ + LICENSE` 由此成为更小的、更干净的集合。边界成立,因为 repo-only 内容**物理上在**那些目录之外。

#### 2. 拆分后的角色语义

- `INSTALLED` —— 不变:`source` 在 `init-spec.json` artifacts 中,INIT 写入被治理项目。
- `SKILL-INTERNAL` —— 收缩为恰好三个:`references/init-spec.json`、`references/workflows/release.md`、`scripts/generate-governance.js`。只留执行器需要但 INIT 不得安装的文件。
- `REPO-ONLY` —— 现在由**目录**定义:`repo-tools/`、`repo-workflows/` 下的一切,加上现有根级基础设施(`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md)。architecture.md(三语)措辞改一句话:REPO-ONLY = 打包步骤够不到的东西,而非一张例外清单。
- `init-spec.json` 的 `distribution.skillInternal` 缩减为上述三个文件;`distribution.undecided` 保持为空。
- **角色门禁——两条独立断言,任一失败即门禁失败**(声明层):①**反向**:`repo-tools/` 或 `repo-workflows/` 下任何文件出现在 `artifacts` 或 `distribution.skillInternal` 即失败——把 repo-only 文件声明为分发项正是本计划在取消的错误;②**闭合**:`references/` 与 `scripts/` 下**每个**文件都必须被声明(或为 `artifacts` 中的 `source`,或在 `distribution.skillInternal` 中)——躺在分发目录里的未声明文件即失败。断言②已存在(即 unclassified 检查);计划显式写出它,是因为评审正确指出:只有反向断言不足以保证分发目录是干净的。**实物层**——tarball 真正携带的内容对声明允许集——在 T5.1,只有二者叠加才能证明「角色 == 打包」。

#### 3. 文件移动(git mv,保留历史)

| 从 | 到 |
| --- | --- |
| references/workflows/skill-release.md | repo-workflows/skill-release.md |
| scripts/package-skill.sh | repo-tools/package-skill.sh |
| scripts/check-doc-parity.js | repo-tools/check-doc-parity.js |
| scripts/check-plan-delivery.js | repo-tools/check-plan-delivery.js |
| scripts/check-layout-sync.js | repo-tools/check-layout-sync.js |
| scripts/check-role-completeness.js | repo-tools/check-role-completeness.js |
| scripts/check-coding-hygiene.js | repo-tools/check-coding-hygiene.js |

留在 scripts/ 的:`verify_governance.js`、`check-lock.js`、`check-git-policy.js`、`check-secrets.js`、`check-sync.js`、`check-doc-freshness.js`、`check-doc-consistency.js`、`release-manager.js`(8 个 INSTALLED)+ `generate-governance.js`(SKILL-INTERNAL)。

#### 4. 交叉引用修复

- **`skill-release.md` 自足化。** 不再引用 `release.md`:SemVer 判定规则(Major/Minor/Patch 边界、禁止的启发式、0.x)、风险分级表、事务性条款以正文形式迁入。接受受控复制(已裁定:两份文档写同一系统的两条发布流程;共享行为在 `release-manager.js` 中,所以只有规则文字重复)。其依赖集变为:`package.json`、`CHANGELOG.md`、`SKILL.md`、`references/init-spec.json`、`scripts/generate-governance.js`、`repo-tools/package-skill.sh`、repo-tools 门禁。
- **移动后的使用边界(本计划宣告的语义契约,也是评审指出的关键缺口):** 从**源码仓库**工作时,用 `repo-workflows/skill-release.md` 发布本技能;在**从 tarball 安装的被治理项目内部**工作时,用 `references/workflows/release.md` 发布该项目;安装后的 skill **不承诺能够发布它自身**。如果被治理项目内的 agent 寻找 skill-release.md 而未找到,这个缺失是正确信号——说明它在另一种形态中,而不是文件被放错了地方。
- **`check-doc-consistency.js` parity 守卫** —— 它以 `existsSync` 检查 parity 脚本。移动后 parity 脚本在本仓库位于 `repo-tools/check-doc-parity.js`,在被治理项目(consistency 检查被安装处)不存在。守卫按序尝试候选路径——先 `repo-tools/check-doc-parity.js`,再 `scripts/check-doc-parity.js`——两者都不存在时 no-op,在不把 repo-only 路径硬编码进已安装文本的前提下两种形态都对。
- **`sub-skills.md` INSTALLED 内容** —— 剩余的本仓库/package.json 表述改写为受众中立(与 content-audience 计划 §1 同类;不引入新路径)。
- **禁止边继续由闭包测试保证**(它们继续对生成项目 + tarball 运行;移动后这些边物理不可达——测试留下是为了钉住不变式)。
- 路径引用更新:`SKILL.md:44` 与其 RELEASE 节、`AGENTS.md`(角色示例、受保护文件摘要、门禁表、分发角色约定行)、`package.json` 脚本(`docs:parity`、`docs:layout`、`plans:delivery`、`check`/`check:payload`/`check:all`/`check:skill-release`/`check:repo-release`)、`.github/workflows/ci.yml`、`tests/support/helpers.js`(`LAYOUT_CHECK`、`PLAN_DELIVERY`、新增 `PARITY_CHECK`、`HYGIENE_CHECK`、`ROLE_CHECK` 路径)、每个硬编码被移动脚本路径的 suite、`docs/{en,zh-CN,zh-TW}/architecture.md`(Repository Layout 树 + 三角色表 + 门禁表)。
- **`check-layout-sync.js` 扫描范围** —— 移动后它是 repo-tool;继续扫描 `references/` + `scripts/`,并开始扫描 `repo-tools/` + `repo-workflows/`,使三语 architecture 页(及其支撑的索引)记录新树。自身位置不再与其扫描对象冲突(守卫保持原样;它们不再在当初激励它们的形态中触发,但零成本,并保护未来被误放进 scripts/ 的文件)。

#### 5. 新验证(计划强化后的验收标准)

- **T5.1 完整清单 tarball 测试**(payload.test.js):在仓库根运行 `bash repo-tools/package-skill.sh <临时版本>`(旧的 `bash scripts/package-skill.sh` 调用本身就会跑一个被移动的路径,必须由移动后的路径扫描抓住),然后用 `tar -tzf` 读取**完整**成员列表——不只是顶层条目。**归一化规则(固定,使不同实现计算同一集合):**(i) 每个 tar 成员归一——去掉前导 `./`、分隔符强制为 `/`、剔除目录条目(尾部 `/`)与 `./` 条目;(ii) `artifacts[*].source` 是**文件**路径,绝不是目录或 glob——目录 source 是由角色门禁覆盖的数据缺陷(stale-declaration),不得出现;(iii) `SKILL.md` 与 `LICENSE` **始终**在允许集中,叠加在声明文件集之上;(iv) 重复来源(同一文件声明两次)是缺陷,不是集合成员;(v) 指向 `repo-tools/` 或 `repo-workflows/` 下的 artifact `source` 在 T5.1 运行前就因角色门禁反向检查而失败。两条断言,都必需:(a) **相等性**——成员集合等于声明允许集 `{SKILL.md, LICENSE} ∪ artifacts[*].source ∪ distribution.skillInternal`(展开为文件),因此被塞进 `references/` 或 `scripts/` 的 repo-tool 文件会使集合不等而失败;(b) **禁止**——不得有任何成员位于 `repo-tools/`、`repo-workflows/`、`docs/`、`tests/`、`.github/` 之下,也不得有 `package.json` / `AGENTS.md` 节点。仅检查顶层被证明不足:`references/workflows/skill-release.md` 与每个 repo 门禁都埋在四个根**下面**,顶层看起来干净。对分发目录内路径做否定断言,才能抓住未来的重新引入。
- **T5.2 角色门禁反向测试**:在 `repo-tools/` 下放一个 dummy 文件,通过临时 fixture 把它声明进 `skillInternal`,运行门禁,期望失败;未声明的 dummy 在 `repo-tools/` 下必须仍然通过(repo-tools 在被分类集之外)。
- **T5.3 布局门禁覆盖新目录**:在 `repo-tools/` 下新增文件而未在 architecture.md 登记 → 布局门禁失败。
- **T5.4 清洁目标链路(已存在,重跑)**:tarball → 解压 → INIT `--phase A/B/C` → 闭包测试(3a/3c)。发布执行器**只在隔离的临时 git 仓库中**被行使:`plan` 对临时 fixture 只读运行;`execute` 在**第二个**隔离的临时 git 仓库中运行(init + commit + 最小 `.governance/` fixture),测试断言它被预期执行的**写入**(创建 annotated tag)——`execute` 按设计具备写能力,**绝不允许**对本仓库的工作树运行。
- **T5.5 变异检查**:在 skill-release.md 重新引入 L53/L57 式依赖 → 新增的引用测试失败(skill-release.md 只引用其核定依赖集内的内容)。
- **T5.6 声明对清单一致性**:角色门禁(声明层)与 T5.1(实物层)针对**同一**允许集断言——声明的 `skillInternal` ∪ `artifacts[*].source`——因此一方变化导致另一方失同步时,要么门禁失败,要么清单测试失败。这对机械组合取代了「角色被声明」,成为「角色与打包是同一事实」。
- 门禁证据:`npm test`、`npm run check`、`npm run check:skill-release`(pending-archive 建议性除外),加清洁目标脚本,都记录真实输出。

#### 5b. 边界纪律(一项长期风险,特意写出来)

目录位置是**默认**分发边界,不是受众正确性的证明。`references/` 或 `scripts/` 下的新文件会自动打包,因此还必须额外通过:角色声明本身不足以保证——(i) 已声明(INSTALLED source 或 SKILL-INTERNAL;未声明文件在角色门禁失败),(ii) 可移植(其引用在被治理项目中可解析;闭包测试断言这一点),(iii) 目标链路验证(T5.4 运行生成产物)。"它住在 scripts/ 里"不是任何证据;声明与闭包才是。

#### 5a. 依赖与定位(本计划不重做什么)

**硬前置条件。** `content-audience-portability` 必须**已提交**(其文件无未提交的工作区改动)并通过其门禁组——包括 3a/3c 闭包测试——本计划的 Step 0 才开始。若实施时发现它未提交,第一步是完成那一批的提交;本计划不得建立在一个未提交、闭包未证明的前任之上。本计划的 T5.4 会在末尾重跑闭包测试,因此万一内容层泄漏在切换后幸存,也会在**这里**被抓住。

内容层闭合——INSTALLED 规则文本泄漏、Phase A 契约(N20)、3a/3c 闭包测试——已由 `content-audience-portability`(已实现)交付,本计划在那一批**之上**构建:修复内容批无法修的结构层(repo-only 文件可以带着完全可移植的散文躺在 references/ 里)。它刻意不再审计规则正文;那批的闭包测试持续运行。若移动过程中本计划发现新的内容层泄漏(如被移动文件自身的散文),该缺陷归内容批的闭包测试处置,不在此处被静默修补。`sub-skills.md` 残余的 repo 表述是本计划拥有的唯一内容项(§4,已评审接受)。

#### 6. 不做

- 任何地方都不引入角色/tarball 开关——那第四个维度。`package-skill.sh` 中没有任何逐文件打包过滤;目录边界取代逐文件决策。
- 不按子角色重新分类。三词词汇表保持;REPO-ONLY 只是从"一张清单"变为"目录属性"。
- 不动 INSTALLED 脚本集、政策文件规则正文(已随 content-audience 计划移动过)、以及三个分发角色词本身。
- 不把重复的 SemVer 文字合并成第三份共享文件。两份文档,一个行为来源(`release-manager.js`);再多就重新引入文档权威分裂。

### Verification(证据层级)

- **变更集的第 0 步:全仓库路径扫描** — 仅 git mv 不足以准备一次移动。对七个旧路径的每一个引用(一次全量扫描已找到约 60 处——涵盖 AGENTS.md、CHANGELOG、三语 architecture/roadmap/CONTRIBUTING、package.json、init-spec.json、tests、以及被移动文件自身)都必须被处置:更新为新路径,或显式保留(docs/archive、design-decisions、历史计划正文、被移动文件自身的标头)。扫描在末尾再跑一次,必须返回零生产命中。
- 每次移动由 git mv + 全路径重扫验证:任何生产/配置/测试文件不得再引用旧路径(机械 grep)。
- T5.1-T5.6 每个测试经变异验证(不变式被重新引入时各自失败)。
- tarball → INIT → 目标链路重跑,真实输出(机械)。
- 三语 architecture 编辑通过 parity + layout + terminology 门禁(机械)。
- `check-role-completeness`(已移动)证明:references/+scripts/ 全部分类、skillInternal 等于三文件集合、repo-tools/repo-workflows 不产生任何分发声明。

### Affected Files

**payload(分发内容与行为):**

- `references/init-spec.json` —— §2:`distribution.skillInternal` 缩减为三条;无 artifact 路径变动
- `scripts/generate-governance.js` —— 预期无行为变化;验证,而非假设
- `scripts/check-doc-consistency.js` —— §4 parity 守卫候选路径(repo-tools 优先,再 scripts)
- `references/templates/sub-skills.md` —— §4 剩余受众中立改写
- `references/workflows/release.md` —— 不移动、除确认无 skill-release 引用外不改动(已确认单向,没有)

**repo-infra(移动、接线、文档、测试):**

- `repo-workflows/skill-release.md` —— 自 references/workflows/ 移入 + §4 自足化(SemVer、风险分级、事务性以正文迁入;4 处 release.md 引用移除)
- `repo-tools/package-skill.sh` —— 自 scripts/ 移入
- `repo-tools/check-doc-parity.js` —— 自 scripts/ 移入
- `repo-tools/check-plan-delivery.js` —— 自 scripts/ 移入
- `repo-tools/check-layout-sync.js` —— 自 scripts/ 移入 + §4 扫描四目录
- `repo-tools/check-role-completeness.js` —— 自 scripts/ 移入 + §2 反向检查
- `repo-tools/check-coding-hygiene.js` —— 自 scripts/ 移入
- `package.json` —— §4 脚本路径
- `.github/workflows/ci.yml` —— §4 门禁路径
- `tests/support/helpers.js` —— §4 路径常量
- `tests/suites/` —— 命名被移动脚本处的路径替换;T5.1/T5.2/T5.3/T5.5 新测试(按归属进入 payload.test.js / docs.test.js / hygiene.test.js)
- `AGENTS.md` —— §4:角色示例、受保护文件摘要(新增 repo-tools/、repo-workflows/)、门禁表、分发约定
- `SKILL.md` —— §4 引用路径(:44、RELEASE 节)——此处显式声明:计划**确实**修改它(评审指出其缺列)
- `CONTRIBUTING.md` —— 三语,`check-doc-parity.js` 引用路径(由移动后路径扫描发现)
- `docs/{en,zh-CN,zh-TW}/roadmap.md` —— 三语,两门禁的机制引用(同一扫描发现)
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— §1 树、§2 角色措辞、门禁表
- `docs/archive/` 与历史计划/ADR 文件 —— **不修改**:它们记录历史状态,旧路径是记录的一部分
- `docs/{en,zh-CN,zh-TW}/plans/repository-boundary-split.md` —— 本计划
- `CHANGELOG.md` —— Changed 条目
