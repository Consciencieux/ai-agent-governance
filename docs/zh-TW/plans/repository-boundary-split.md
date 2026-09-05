# 倉庫邊界拆分 —— 載荷目錄 vs 倉庫工具(TASK 計劃)

[English](../../en/plans/repository-boundary-split.md) · [简体中文](../../zh-CN/plans/repository-boundary-split.md) · [繁體中文](repository-boundary-split.md)

> **Status: implemented.**(狀態:已實作。)2026-09-05 受眾稽核的後續。`content-audience-portability` 計劃修復了 CONTENT 洩漏;本計劃修復的是允許洩漏的 STRUCTURE:聲明的分發角色沒有任何東西強制執行。`package-skill.sh` 整目錄複製,所以只要檔案住在 `references/` 或 `scripts/` 下,無論 `init-spec.json` 為它聲明了什麼角色,它都會被打給每個 tarball 使用者。目前樹實測:按體積計 tarball 的 45%(7 個檔案,約 51 KB)是本倉庫自己的維護內容,任何技能使用者都無法對其行使操作。

**Target: both** —— `payload` 改變 tarball 攜帶的內容(7 個 repo-only 檔案移出分發目錄)並強化 `init-spec.json` 與角色閘門;`repo-infra` 重接所有指向被移動路徑的引用(package.json 腳本、CI、測試、AGENTS.md、SKILL.md、三語 architecture)並記錄新規則。兩類分別列於 Affected Files。

### Objective(目標)

讓 tarball 邊界成為**物理事實,而非聲明**。目前不變式是「聲明的角色與目錄式複製一致」——這正是 `check-role-completeness` 證明的東西,它不夠:刪掉 `references/init-spec.json` 的 `distribution` 段,打包內容不會有任何改變。新不變式:

> tarball 內容邊界由目錄結構直接保證;tarball 不包含任何 REPO-ONLY 檔案。

一旦成立,repo-only 檔案無論聲明寫什麼都不可能洩漏進載荷;「該角色要不要 tarball 開關」這第四個維度也就永遠不會出現。

### Current problem(現狀,稽核後實測)

1. **發佈流程的拆分從未真正完成。** `skill-release.md` 仍在四個位置依賴 `release.md`(L3、L53、L57、L77——SemVer 判定、風險分級、事務性……),且引用鏈單向:`release.md` 從不回頭。兩份文件在文檔維度分開,在依賴維度仍然耦合。
2. **角色是聲明式;打包是目錄式;沒有人對帳。** `package-skill.sh` = `cp SKILL.md + cp -R references + cp -R scripts + cp LICENSE`。它不讀 `init-spec.json`、沒有角色過濾,沒有任何東西驗證 `check-role-completeness` 聲明的內容與真正落進 tarball 的內容一致。
3. **tarball 攜帶本倉庫內部工具。** 打包了但技能使用者用不上:`references/workflows/skill-release.md`(7 項 repo-only 事實——本倉庫自己的 `npm run check:skill-release`、本倉庫的 `package.json`、`docs/{en,zh-CN,zh-TW}/roadmap.md`、`docs/archive/`、`package-skill.sh`、`init-spec.json`、`ai-agent-governance` 之名)、`scripts/package-skill.sh`(硬編碼本技能 tarball 名)、以及五個 repo-only 閘門 `check-doc-parity.js` / `check-plan-delivery.js` / `check-layout-sync.js` / `check-role-completeness.js` / `check-coding-hygiene.js`——任何執行器引用都沒有(SKILL.md、sub-skills.md、release.md 從未提到它們;上一輪加的 no-op 守衛只是在打磨一個目標本不該收到的檔案)。
4. **受眾混用不止這一個案例。** `sub-skills.md`(INSTALLED)仍帶著 6 處「本倉庫/技能倉庫」與 3 處 `package.json` 表述;這些會直接帶入被治理專案,在那裡讀起來完全錯位。
5. **邊界驗證測試只證明閉包,不證明打包。** 閉包測試(3a/3c)解析生成專案內部的引用;沒有任何東西檢查 tarball 本身。

### Proposed solution(方案)

#### 1. 新目錄形態 —— 目錄即角色邊界

```text
SKILL.md            skill 入口(使用者安裝即執行)
references/         僅:skill 執行內容 + INIT 產物源(policies + templates + workflows/release.md + workflows/ci.md + init-spec.json)
scripts/            僅:安裝到目標專案的 8 個腳本 + generate-governance.js(SKILL-INTERNAL)
repo-tools/         本倉庫專用腳本(絕不打包):package-skill.sh、check-doc-parity.js、check-plan-delivery.js、
                    check-layout-sync.js、check-role-completeness.js、check-coding-hygiene.js
repo-workflows/     本倉庫專用文檔(絕不打包):skill-release.md(單語,agent-facing)
docs/ tests/ package.json .github/ CHANGELOG.md AGENTS.md LICENSE(根,不變)
```

打包的**機制**保持簡單——不引入任何逐檔案角色過濾——但本計劃確實改變了複製攜帶的內容:下列 7 個檔案離開分發目錄,`SKILL.md + references/ + scripts/ + LICENSE` 由此成為更小的、更乾淨的集合。邊界成立,因為 repo-only 內容**物理上在**那些目錄之外。

#### 2. 拆分後的角色語義

- `INSTALLED` —— 不變:`source` 在 `init-spec.json` artifacts 中,INIT 寫入被治理專案。
- `SKILL-INTERNAL` —— 收縮為恰好三個:`references/init-spec.json`、`references/workflows/release.md`、`scripts/generate-governance.js`。只留執行器需要但 INIT 不得安裝的檔案。
- `REPO-ONLY` —— 現在由**目錄**定義:`repo-tools/`、`repo-workflows/` 下的一切,加上現有根級基礎設施(`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md)。architecture.md(三語)措辭改一句話:REPO-ONLY = 打包步驟構不到的東西,而非一張例外清單。
- `init-spec.json` 的 `distribution.skillInternal` 縮減為上述三個檔案;`distribution.undecided` 保持為空。
- **角色閘門——兩條獨立斷言,任一失敗即閘門失敗**(聲明層):①**反向**:`repo-tools/` 或 `repo-workflows/` 下任何檔案出現在 `artifacts` 或 `distribution.skillInternal` 即失敗——把 repo-only 檔案聲明為分發項正是本計劃在取消的錯誤;②**閉合**:`references/` 與 `scripts/` 下**每個**檔案都必須被聲明(或為 `artifacts` 中的 `source`,或在 `distribution.skillInternal` 中)——躺在分發目錄裡的未聲明檔案即失敗。斷言②已存在(即 unclassified 檢查);計劃顯式寫出它,是因為評審正確指出:只有反向斷言不足保證分發目錄是乾淨的。**實物層**——tarball 真正攜帶的內容對聲明允許集——在 T5.1,只有二者疊加才能證明「角色 == 打包」。

#### 3. 檔案移動(git mv,保留歷史)

| 從 | 到 |
| --- | --- |
| references/workflows/skill-release.md | repo-workflows/skill-release.md |
| scripts/package-skill.sh | repo-tools/package-skill.sh |
| scripts/check-doc-parity.js | repo-tools/check-doc-parity.js |
| scripts/check-plan-delivery.js | repo-tools/check-plan-delivery.js |
| scripts/check-layout-sync.js | repo-tools/check-layout-sync.js |
| scripts/check-role-completeness.js | repo-tools/check-role-completeness.js |
| scripts/check-coding-hygiene.js | repo-tools/check-coding-hygiene.js |

留在 scripts/ 的:`verify_governance.js`、`check-lock.js`、`check-git-policy.js`、`check-secrets.js`、`check-sync.js`、`check-doc-freshness.js`、`check-doc-consistency.js`、`release-manager.js`(8 個 INSTALLED)+ `generate-governance.js`(SKILL-INTERNAL)。

#### 4. 交叉引用修復

- **`skill-release.md` 自足化。** 不再引用 `release.md`:SemVer 判定規則(Major/Minor/Patch 邊界、禁止的啟發式、0.x)、風險分級表、事務性條款以正文形式遷入。接受受控複製(已裁定:兩份文件寫同一系統的兩條發佈流程;共享行為在 `release-manager.js` 中,所以只有規則文字重複)。其依賴集變為:`package.json`、`CHANGELOG.md`、`SKILL.md`、`references/init-spec.json`、`scripts/generate-governance.js`、`repo-tools/package-skill.sh`、repo-tools 閘門。
- **移動後的使用邊界(本計劃宣告的語義契約,也是評審指出的關鍵缺口):** 從**原始碼倉庫**工作時,用 `repo-workflows/skill-release.md` 發佈本技能;在**從 tarball 安裝的被治理專案內部**工作時,用 `references/workflows/release.md` 發佈該專案;安裝後的 skill **不承諾能夠發佈它自身**。如果被治理專案內的 agent 尋找 skill-release.md 而未找到,這個缺失是正確訊號——說明它在另一種形態中,而不是檔案被放錯了地方。
- **`check-doc-consistency.js` parity 守衛** —— 它以 `existsSync` 檢查 parity 腳本。移動後 parity 腳本在本倉庫位於 `repo-tools/check-doc-parity.js`,在被治理專案(consistency 檢查被安裝處)不存在。守衛按序嘗試候選路徑——先 `repo-tools/check-doc-parity.js`,再 `scripts/check-doc-parity.js`——兩者都不存在時 no-op,在不把 repo-only 路徑硬編碼進已安裝文本的前提下兩種形態都對。
- **`sub-skills.md` INSTALLED 內容** —— 剩餘的本倉庫/package.json 表述改寫為受眾中立(與 content-audience 計劃 §1 同類;不引入新路徑)。
- **禁止邊繼續由閉包測試保證**(它們繼續對生成專案 + tarball 執行;移動後這些邊物理不可達——測試留下是為了釘住不變式)。
- 路徑引用更新:`SKILL.md:44` 與其 RELEASE 節、`AGENTS.md`(角色範例、受保護檔案摘要、閘門表、分發角色約定行)、`package.json` 腳本(`docs:parity`、`docs:layout`、`plans:delivery`、`check`/`check:payload`/`check:all`/`check:skill-release`/`check:repo-release`)、`.github/workflows/ci.yml`、`tests/support/helpers.js`(`LAYOUT_CHECK`、`PLAN_DELIVERY`、新增 `PARITY_CHECK`、`HYGIENE_CHECK`、`ROLE_CHECK` 路徑)、每個硬編碼被移動腳本路徑的 suite、`docs/{en,zh-CN,zh-TW}/architecture.md`(Repository Layout 樹 + 三角色表 + 閘門表)。
- **`check-layout-sync.js` 掃描範圍** —— 移動後它是 repo-tool;繼續掃描 `references/` + `scripts/`,並開始掃描 `repo-tools/` + `repo-workflows/`,使三語 architecture 頁(及其支撐的索引)記錄新樹。自身位置不再與其掃描對象衝突(守衛保持原樣;它們不再在當初激勵它們的形態中觸發,但零成本,並保護未來被誤放進 scripts/ 的檔案)。

#### 5. 新驗證(計劃強化後的驗收標準)

- **T5.1 完整清單 tarball 測試**(payload.test.js):在倉庫根執行 `bash repo-tools/package-skill.sh <臨時版本>`(舊的 `bash scripts/package-skill.sh` 呼叫本身就會跑一個被移動的路徑,必須由移動後的路徑掃描抓住),然後用 `tar -tzf` 讀取**完整**成員列表——不只是頂層條目。**正規化規則(固定,使不同實作計算同一集合):**(i) 每個 tar 成員正規化——去掉前導 `./`、分隔符強制為 `/`、剔除目錄條目(尾部 `/`)與 `./` 條目;(ii) `artifacts[*].source` 是**檔案**路徑,絕不是目錄或 glob——目錄 source 是由角色閘門覆蓋的資料缺陷(stale-declaration),不得出現;(iii) `SKILL.md` 與 `LICENSE` **始終**在允許集中,疊加在聲明檔案集之上;(iv) 重複來源(同一檔案聲明兩次)是缺陷,不是集合成員;(v) 指向 `repo-tools/` 或 `repo-workflows/` 下的 artifact `source` 在 T5.1 執行前就因角色閘門反向檢查而失敗。兩條斷言,都必需:(a) **相等性**——成員集合等於聲明允許集 `{SKILL.md, LICENSE} ∪ artifacts[*].source ∪ distribution.skillInternal`(展開為檔案),因此被塞進 `references/` 或 `scripts/` 的 repo-tool 檔案會使集合不等而失敗;(b) **禁止**——不得有任何成員位於 `repo-tools/`、`repo-workflows/`、`docs/`、`tests/`、`.github/` 之下,也不得有 `package.json` / `AGENTS.md` 節點。僅檢查頂層被證明不足:`references/workflows/skill-release.md` 與每個 repo 閘門都埋在四個根**下面**,頂層看起來乾淨。對分發目錄內路徑做否定斷言,才能抓住未來的重新引入。
- **T5.2 角色閘門反向測試**:在 `repo-tools/` 下放一個 dummy 檔案,透過臨時 fixture 把它聲明進 `skillInternal`,執行閘門,期望失敗;未聲明的 dummy 在 `repo-tools/` 下必須仍然通過(repo-tools 在被分類集之外)。
- **T5.3 佈局閘門覆蓋新目錄**:在 `repo-tools/` 下新增檔案而未在 architecture.md 登記 → 佈局閘門失敗。
- **T5.4 清潔目標鏈路(已存在,重跑)**:tarball → 解壓 → INIT `--phase A/B/C` → 閉包測試(3a/3c)。發佈執行器**只在隔離的臨時 git 倉庫中**被行使:`plan` 對臨時 fixture 唯讀執行;`execute` 在**第二個**隔離的臨時 git 倉庫中執行(init + commit + 最小 `.governance/` fixture),測試斷言它被預期執行的**寫入**(建立 annotated tag)——`execute` 按設計具備寫能力,**絕不允許**對本倉庫的工作樹執行。
- **T5.5 變異檢查**:在 skill-release.md 重新引入 L53/L57 式依賴 → 新增的引用測試失敗(skill-release.md 只引用其核定依賴集內的內容)。
- **T5.6 聲明對清單一致性**:角色閘門(聲明層)與 T5.1(實物層)針對**同一**允許集斷言——聲明的 `skillInternal` ∪ `artifacts[*].source`——因此一方變化導致另一方失同步時,要麼閘門失敗,要麼清單測試失敗。這對機械組合取代了「角色被聲明」,成為「角色與打包是同一事實」。
- 閘門證據:`npm test`、`npm run check`、`npm run check:skill-release`(pending-archive 建議性除外),加清潔目標腳本,都記錄真實輸出。

#### 5b. 邊界紀律(一項長期風險,特意寫出來)

目錄位置是**預設**分發邊界,不是受眾正確性的證明。`references/` 或 `scripts/` 下的新檔案會自動打包,因此還必須額外通過:角色聲明本身不足保證——(i) 已聲明(INSTALLED source 或 SKILL-INTERNAL;未聲明檔案在角色閘門失敗),(ii) 可移植(其引用在被治理專案中可解析;閉包測試斷言這一點),(iii) 目標鏈路驗證(T5.4 執行生成產物)。"它住在 scripts/ 裡"不是任何證據;聲明與閉包才是。

#### 5a. 依賴與定位(本計劃不重做什麼)

**硬前置條件。** `content-audience-portability` 必須**已提交**(其檔案無未提交的工作區改動)並通過其閘門組——包括 3a/3c 閉包測試——本計劃的 Step 0 才開始。若實施時發現它未提交,第一步是完成那一批的提交;本計劃不得建立在一個未提交、閉包未證明的上任之上。本計劃的 T5.4 會在末尾重跑閉包測試,因此萬一內容層洩漏在切換後倖存,也會在**這裡**被抓住。

內容層閉合——INSTALLED 規則文本洩漏、Phase A 契約(N20)、3a/3c 閉包測試——已由 `content-audience-portability`(已實現)交付,本計劃在那一批**之上**構建:修復內容批無法修的結構層(repo-only 檔案可以帶著完全可移植的散文躺在 references/ 裡)。它刻意不再審計規則正文;那批的閉包測試持續執行。若移動過程中本計劃發現新的內容層洩漏(如被移動檔案自身的散文),該缺陷歸內容批的閉包測試處置,不在此處被靜默修補。`sub-skills.md` 殘餘的 repo 表述是本計劃擁有的唯一內容項(§4,已評審接受)。

#### 6. 不做

- 任何地方都不引入角色/tarball 開關——那第四個維度。`package-skill.sh` 中沒有任何逐檔案打包過濾;目錄邊界取代逐檔案決策。
- 不按子角色重新分類。三詞詞彙表保持;REPO-ONLY 只是從「一張清單」變為「目錄屬性」。
- 不動 INSTALLED 腳本集、政策檔案規則正文(已隨 content-audience 計劃移動過)、以及三個分發角色詞本身。
- 不把重複的 SemVer 文字合併成第三份共享檔案。兩份文件,一個行為來源(`release-manager.js`);再多就重新引入文件權威分裂。

### Verification(證據層級)

- **變更集的第 0 步:全倉庫路徑掃描** — 僅 git mv 不足以準備一次移動。對七個舊路徑的每一個引用(一次全量掃描已找到約 60 處——涵蓋 AGENTS.md、CHANGELOG、三語 architecture/roadmap/CONTRIBUTING、package.json、init-spec.json、tests、以及被移動文件自身)都必須被處置:更新為新路徑,或顯式保留(docs/archive、design-decisions、歷史計劃正文、被移動文件自身的標頭)。掃描在末尾再跑一次,必須返回零生產命中。
- 每次移動由 git mv + 全路徑重掃驗證:任何生產/配置/測試檔案不得再引用舊路徑(機械 grep)。
- T5.1-T5.6 每個測試經變異驗證(不變式被重新引入時各自失敗)。
- tarball → INIT → 目標鏈路重跑,真實輸出(機械)。
- 三語 architecture 編輯通過 parity + layout + terminology 閘門(機械)。
- `check-role-completeness`(已移動)證明:references/+scripts/ 全部分類、skillInternal 等於三檔案集合、repo-tools/repo-workflows 不產生任何分發聲明。

### Affected Files

**payload(分發內容與行為):**

- `references/init-spec.json` —— §2:`distribution.skillInternal` 縮減為三條;無 artifact 路徑變動
- `scripts/generate-governance.js` —— 預期無行為變化;驗證,而非假設
- `scripts/check-doc-consistency.js` —— §4 parity 守衛候選路徑(repo-tools 優先,再 scripts)
- `references/templates/sub-skills.md` —— §4 剩餘受眾中立改寫
- `references/workflows/release.md` —— 不移動、除確認無 skill-release 引用外不改動(已確認單向,沒有)

**repo-infra(移動、接線、文檔、測試):**

- `repo-workflows/skill-release.md` —— 自 references/workflows/ 移入 + §4 自足化(SemVer、風險分級、事務性以正文遷入;4 處 release.md 引用移除)
- `repo-tools/package-skill.sh` —— 自 scripts/ 移入
- `repo-tools/check-doc-parity.js` —— 自 scripts/ 移入
- `repo-tools/check-plan-delivery.js` —— 自 scripts/ 移入
- `repo-tools/check-layout-sync.js` —— 自 scripts/ 移入 + §4 掃描四目錄
- `repo-tools/check-role-completeness.js` —— 自 scripts/ 移入 + §2 反向檢查
- `repo-tools/check-coding-hygiene.js` —— 自 scripts/ 移入
- `package.json` —— §4 腳本路徑
- `.github/workflows/ci.yml` —— §4 閘門路徑
- `tests/support/helpers.js` —— §4 路徑常量
- `tests/suites/` —— 命名被移動腳本處的路徑替換;T5.1/T5.2/T5.3/T5.5 新測試(按歸屬進入 payload.test.js / docs.test.js / hygiene.test.js)
- `AGENTS.md` —— §4:角色範例、受保護檔案摘要(新增 repo-tools/、repo-workflows/)、閘門表、分發約定
- `SKILL.md` —— §4 引用路徑(:44、RELEASE 節)——此處顯式聲明:計劃**確實**修改它(評審指出其缺列)
- `CONTRIBUTING.md` —— 三語,`check-doc-parity.js` 引用路徑(由移動後路徑掃描發現)
- `docs/{en,zh-CN,zh-TW}/roadmap.md` —— 三語,兩閘門的機制引用(同一掃描發現)
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— §1 樹、§2 角色措辭、閘門表
- `docs/archive/` 與歷史計劃/ADR 檔案 —— **不修改**:它們記錄歷史狀態,舊路徑是記錄的一部分
- `docs/{en,zh-CN,zh-TW}/plans/repository-boundary-split.md` —— 本計劃
- `CHANGELOG.md` —— Changed 條目
