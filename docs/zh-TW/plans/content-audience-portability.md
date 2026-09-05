# 內容受眾與可移植性邊界（TASK 計劃）

[English](../../en/plans/content-audience-portability.md) · [简体中文](../../zh-CN/plans/content-audience-portability.md) · [繁體中文](content-audience-portability.md)

> **Status: design plan, not implemented.**（狀態：設計計劃，未實作。）回應 2026-09-05 一次唯讀稽核（針對發佈載荷）：結構邊界健全（打包正確、角色分類完備且經閘門驗證），**但 INSTALLED 規則正文的內容仍然混用受眾**。九處已確認洩漏——「`npm run check`」傳到沒有 package.json 的目標專案、技能倉庫的 `docs/archive/` 出現在同一檔案自己寫著 `docs/plans/archive/` 的被治理專案規則裡、硬編碼的三語義務、懸空指標、以及兩個生成的子技能叫目標專案運行它們沒有的腳本。

**Target: both** —— `payload` 改寫洩漏的規則文字（`references/policies/lifecycle.policy.md`、`references/templates/sub-skills.md`、`SKILL.md`、`references/workflows/release.md`、`scripts/check-layout-sync.js`）並新增 tarball→INIT 邊界測試；`repo-infra` 在文件與術語表中記錄雙軸模型並添加可移植性檢查。兩個域分別列在「受影響檔案」中。

### 任務目的

封住「檔案分發到哪裡」與「檔案內容在談什麼」之間的洩漏。分發角色（INSTALLED / SKILL-INTERNAL / REPO-ONLY）回答的是*檔案去哪*；它不回答*誰讀它*、*它的路徑在目標環境中是否存在*、*它的規則在哪種專案形態下成立*。本計劃修正內容，使下列表述到處成立：

> INSTALLED 必須 project-portable；REPO-ONLY 可以使用本倉庫路徑與命令；SKILL-INTERNAL 不得被生成內容引用為目標專案依賴。

並把兩個正式區分記錄為文件化概念（受眾、可移植性）——不發明第四種分發角色，不做禁詞掃描器。

### 當前問題（2026-09-05 稽核）

稽核實際生成 tarball、安裝它，再產出兩個真實的被治理專案夾具（`--phase A` 與 `--phase C --stack node`），然後檢查的是**安裝後輸出**而非原始碼。發現：

**A. 在被治理專案中不能成立的 INSTALLED 規則文字（四處洩漏全部位於 `references/policies/lifecycle.policy.md`）：**

1. **lifecycle.policy.md:113** → 裝為 `docs/rules/lifecycle.md`：「被治理專案運行其 `verify-governance.js`，本倉庫使用 `npm run check`。」被治理專案根本沒有 `package.json`；`check` 腳本是 REPO-ONLY。這是技能倉庫的維護指令進了目標專案的 Phase 5c。
2. **lifecycle.policy.md:61** → 歷史層一行命名 `docs/archive/`——本倉庫的歸檔路徑。**同一檔案 121 行**正確寫著 `docs/plans/archive/`。裝進去的規則自相矛盾。
3. **lifecycle.policy.md:66,68** → 變更衛生驗證義務硬編碼「三語文件」。那是本倉庫的 en/zh-CN/zh-TW 佈局；技能自己的語言政策寫明多語言樹只在專案明確採用時才生成。
4. **lifecycle.policy.md:11** → 「審查（review-manager，見 `plans/review-manager.md`）」——該路徑在任何領域都不存在（倉庫、載荷、夾具都沒有）。

**B. 引用目標專案沒有的腳本的生成子技能：**

5. **sub-skills.md:389** → 生成的 `review-manager/SKILL.md` 步驟 5：「run `npm run check` (tests + parity)」。與 v0.13.0 CHANGELOG 已修復的 RELEASE 流程那條（check-plan-delivery/package-skill）同類——這條在 review 流程裡倖存。
6. **sub-skills.md:182** → 生成的 `drift-check/SKILL.md`：「**trilingual tree parity** — delegates to `scripts/check-doc-parity.js`」。`check-doc-parity.js` 是 SKILL-INTERNAL，實測被治理專案裡沒有；且**兄弟行 265** 已正確加條件（「only when the project HAS such trees and a parity checker; skip otherwise」）——182 行被同一修復漏掉。

**C. SKILL.md 指向只在本倉庫存在的檔案：**

7. **SKILL.md:49** → 「完整自動化 INSTALL → UPDATE → ROLLBACK 由 ai-skill-manager 提供，見 `docs/zh-CN/plans/skill-lifecycle-management.md`」。該檔案在本倉庫三語樹裡、在倉庫中存在，**在載荷中不存在**。只裝 tarball 的使用者拿到死鏈。

**D. release 流程以目標專案沒有的腳本做硬閘門：**

8. **release.md:41** → `plan.delivery_verified`：「`scripts/check-plan-delivery.js` 退出碼 0（…）」標 ❌ 停止發佈。`check-plan-delivery.js` 是 SKILL-INTERNAL。兄弟項 `docs.parity_passed`（39 行）已正確加條件（「僅適用於維護三語文件樹的倉庫」）；41 行沒有。

**E. 違反 no-op 規則的 SKILL-INTERNAL 腳本：**

9. **check-layout-sync.js** —— 在被治理專案形態下退出 1：「no files found under references — layout scan would cover only part of the tree」。違反倉庫自己的明文規則：「SKILL-INTERNAL 腳本必須在本倉庫形態之外 no-op」（AGENTS.md 分發角色，以及 check-coding-hygiene.js 等腳本已遵循的模式）。
10. **governance-files.policy.md:3** → 裝為 `docs/rules/governance-files.md`：「SKILL.md 的「治理文件保護」節 … 均以本文件為準」。被治理專案沒有 SKILL.md（no init-spec artifact emits it），這句話指向目標專案不存在的檔案。其自知的括號（「目標專案不引用本倉庫檔案」）不豁免前一句——它把 SKILL.md 節列為目標專案不可能擁有的權威。

### 提議方案

#### 1. 改寫洩漏的 INSTALLED 文字（先讓內容正確——在任何偵測器之前）

##### 1.1 lifecycle.policy.md —— 讓每句話在被治理專案中成立

- **113 行**：把「本倉庫/npm run check」的對比換成對任何目標成立的規則：如「被治理專案運行其 `verify-governance.js`；它沒有的檢查由 [已安裝閘門] 覆蓋，不依賴技能倉庫的命令」。「npm run check」這個事實屬於本倉庫的 AGENTS.md（倉庫側 phase 5 表述），不屬於裝進專案的規則。
- **61 行**：`docs/archive/` → `docs/plans/archive/`（被治理專案的歷史層在那裡存放版本化歸檔）。
- **66、68 行**：「三語文件」→「多語言文件（若專案採用了多語言文件樹）」；義務變條件而非假設。
- **11 行**：刪除懸空的 `plans/review-manager.md` 指標；引用實際存在的生成子技能路徑（`.governance/generated/skills/review-manager`），或直接刪掉指標、把審查步驟說清楚。

##### 1.2 sub-skills.md —— 對齊兩處倖存引用

- **389 行**（review-manager 閘門驗證）：把 `npm run check` 換成目標自己的驗證命令——如「run the project's tests and the installed scoped gates (verify-governance.js, check-secrets.js); record real output」。
- **182 行**（drift-check 三語 parity）：按 265 行的方式加條件——「only when the project HAS such trees and a parity checker; skip otherwise」。

##### 1.3 governance-files.policy.md —— 「SKILL.md 節」指標

- **第 3 行**：「SKILL.md 的「治理文件保護」節、生成的 AGENTS.md（references/templates/agents-md.template.md）、docs/rules/git-policy.md 中的清單均以本文件為準」。被治理專案沒有 SKILL.md（實測：init-spec 無該工件），「SKILL.md 的「治理文件保護」節」指向目標專案不存在的檔案。自知的括號（「目標專案不引用本倉庫檔案」）不豁免前一句。修正：只點目標專案實際擁有的工件——生成的 AGENTS.md（其保護節同源）與 `docs/rules/*.md`（安裝的規則）——並將出處事實（本清單是技能倉庫與生成目標雙方的單一來源）只作為說明陳述，無 SKILL.md 指標。

##### 1.4 SKILL.md —— 移除死計劃指標

- **49 行**：ai-skill-manager 指標不得引用只在本倉庫的 docs 路徑。要嘛鏈到 GitHub 專案（URL 形式），要嘛只說明完整自動化由 ai-skill-manager 提供，不寫只在本倉庫存在的路徑。

##### 1.5 release.md —— 硬閘門需要目標可滿足的硬體

- **41 行**：`plan.delivery_verified` 不能以 SKILL-INTERNAL 腳本 ❌ 失敗。實作時二選一（都保留閘門意圖）：(a) 像 parity 一樣加條件——「當專案計劃使用 Affected Files 聲明且存在交付檢查器時」；(b) 註明該檢查是技能執行器自己的步驟（`check-plan-delivery.js` 在技能倉庫運行），從不是目標專案要求。

##### 1.6 check-layout-sync.js —— 遵守 no-op 規則

- 加 check-coding-hygiene.js 與 check-role-completeness.js 已用的形態守衛：當本倉庫形態缺失時（`references/` 與 `scripts/` 都缺——被治理專案正是如此），報告 `applicable: false` 並退出 0，而不是為部分語料失敗。

#### 2. 記錄雙軸模型（文件，不是機制）

- **docs/{en,zh-CN,zh-TW}/architecture.md**：加入 *分發角色*（檔案去哪）與 *可移植性/受眾*（誰讀它；內容脫離技能倉庫是否成立）的區別。展示四受眾表（技能執行 Agent、被治理專案 Agent、本倉庫貢獻者、生成器）與逐檔案可移植性欄：`SKILL.md` = skill-portable，`lifecycle.policy.md` = project-portable，`release.md` = repo/skill-specific，`check-doc-parity.js` + repo-only 閘門 = repo-specific，`AGENTS.md` = repo-specific。
- **docs/glossary.md**：註冊 `audience`（受眾/受眾）與 `portability`（可移植性/可移植性）——本變更集已隨計劃完成（此前未註冊）。
- **AGENTS.md**：寫明規則——INSTALLED 內容必須 project-portable；倉庫特定命令/路徑事實屬於倉庫側檔案。後續貢獻者據此寫出可移植的 INSTALLED 文字。

#### 3. 可移植性驗證（窄、證據驅動——不是禁詞掃描器）

明確**不建**禁詞閘門：「INSTALLED 不得包含 `npm run check`」這類黑名單會誤報，也抓不住任意新洩漏。改為：

- **3a. 生成引用可解析檢查**：在現有 payload 夾具框架的 INIT 之後，驗證生成子技能（`docs/rules/*.md`、`AGENTS.md`、`.governance/generated/skills/**`）中每條 `node scripts/...` / `bash scripts/...` 指令都能解析為生成專案裡實際存在的檔案。把現有 payload 測試 `INIT installs the release tag executor the sub-skill invokes`（已對 release-manager 做此檢查）擴展為覆蓋**全部**生成子技能與 review/drift 流程，以及 AGENTS.md 與 docs/rules 檔案。
- **3b. check-layout-sync.js 被治理專案形態的獨立行為測試**：斷言退出 0 + `applicable: false`（鏡像 check-coding-hygiene 的 no-op 測試）。
- **3c. 載荷圍欄內的死鏈掃查**：check-doc-consistency.js 的 broken-links 簇已能解析相對 markdown 連結；把它的 INSTALLED 檔案檢查（`references/` 現已入掃描集）擴展為同時標記「載荷檔案連結到被治理專案中不可能存在的路徑」。若無法保證無歧義就以 advisory 提示級呈現；不把散文掃描變成閘門。

#### 4. 發佈流程受眾拆分（被治理專案政策保留，技能倉庫停止借用）

2026-09-05 的 RELEASE 模式評估（對照 AGENTS.md:113 與 `references/workflows/release.md` 稽核）發現：發佈流程與檔案內容存在**同源的受眾混用**——一份流程檔案攜帶三種意圖（發佈本 skill、發佈被治理專案、完成本倉庫維護）。AGENTS.md:113 是症狀：五條「Caveats unique to this repo」+「Path mapping for THIS repo」把一份被治理專案政策補丁成本倉庫的發佈。

**採納並做一處修正。** 評估的核心提案是對的（停止借用被治理專案政策；新增一部簡短的技能倉庫發佈文件；把倉庫維護與發佈有效性分離）。但其中兩步需要修正：

- **`release.md` 保留其被治理專案內容** —— 它是寫給被治理專案的 payload 工件（SKILL-INTERNAL，按 AGENTS.md「release.md is payload written for governed projects」）。目標專案的測試/變更日誌/manifest/同步組/tag/GitHub Release **屬於它、不移除**。但它對 `check-plan-delivery.js` / `check-doc-parity.js` / `check-layout-sync.js` / 本倉庫歸檔規則的無條件引用**要修**——那些是本倉庫專用能力，必須條件化（能力偵測）或對無法滿足的結構去掉硬性 ❌。
- **`check:release` 不是「被治理專案側」閘門。** 它定義在本倉庫 `package.json`，運行本倉庫的 test、三語文件、計劃交付、歸檔狀態、譯文新鮮度、CHANGELOG 覆蓋——全部 REPO-ONLY 內容。被治理專案沒有 `package.json`、沒有三語文件樹、沒有 `check-plan-delivery.js`。它是**本倉庫維護**投入檢查，絕不是目標專案能運行的命令。重新標註：`check:release`（保留，但文件明確它是本倉庫專用），或拆成 `check:skill-release` / `check:repo` / `check:repo-release`。僅當命名混淆實際發生才拆；先做語義文件修訂。

**目標形態（本輪只記錄，不實施）：**

- `release.md` = **Governed Project Release**（保留；目標專案內容保留）。
- `skill-release.md`（新增，SKILL-INTERNAL）= **Skill Repository Release** —— skill 版本源（SKILL.md frontmatter、package.json、CHANGELOG、init-spec default、generator fallback、tag）、skill 測試、tarball 構建、tarball 白名單、校驗和、GitHub Release、使用者批准。
- `plan/archive/roadmap` = **Repo Maintenance** —— 照常運行，但永不再描述為「skill 工件有效性證明」。

**刻意不抽象共享工作流。** 評估較早前的步驟（兩個流程共同引用一份「發佈政策」散文）按其自身理由被否決：那樣會重新製造「一個共享流程 + 兩套例外 + 兩種路徑映射」。共享**行為**（SemVer 判定、headSha 綁定、工作區檢查、tag 建立、使用確認語義）保留在腳本（`release-manager.js`）中，兩份文件各自描述自己的流程。散文中的少量重複是可接受的。

**C6 繼續延後。** Skill Release 只要求使用者批准；`reviewStatus` 繼續明確標為 self-attested；`headSha` 保持真實綁定。不提前實作評審證據，也不被被治理專案的 review-manager 交叉污染。

#### 5. 依賴方向規則（第 1–4 節檢查的定義層）

後續評估（2026-09-05）正確指出：檔案角色軸只回答*檔案去哪*，不回答內容/引用/執行者是否跨受眾。其依賴圖提案採納為定義層——五條規則，只陳述一次，§3 的可移植性驗證與 §4 的發佈拆分都是其實例：

```text
REPO-ONLY      可以描述倉庫內部、也可以描述 payload                （允許）
SKILL-INTERNAL 可以讀技能包內部；絕不可成為目標專案執行時依賴     （受限）
INSTALLED      只能依賴被治理專案擁有的檔案/命令                 （允許）
生成的目標專案  絕不可反向依賴倉庫 docs/tests/package.json         （禁止）
installed ──> repo-only : 禁止
generated ──> skill-internal : 禁止
```

稽核（見上發佈流程發現與 10 處洩漏）已逐條演示每條禁止邊。本節補充的是通用規則與引用圖，使後續修復按這個推理重複，而不是每次重新推導。

**在執行環境驗證，絕不在編寫環境驗證。** 這是整份計劃所依賴的方法論規則，也是這個問題前兩次被問到時只得到印象式回答的原因。INSTALLED 檔案裡的一句話，寫作時所在的倉庫有 `references/workflows/release.md`；被讀取時所在的專案沒有這個路徑。因此正確性無法靠讀原始碼樹判斷——編寫環境能解析目標解析不了的引用。具體：

- 判斷 INSTALLED 內容，意味著生成一個真實專案（`generate-governance.js --target <tmp> --phase C`，以及 `--phase A`），並在**那裡**解析每一條引用。
- 判斷只裝 tarball 的使用者看到什麼，意味著解壓 tarball 並在那裡解析——`docs/` 是 REPO-ONLY，所以任何指向它的載荷指針對該使用者都是死鏈，儘管它在倉庫裡能解析。
- 「看起來像本倉庫特有」是錯的過濾器。它能抓 `本倉庫` / `三語` / `docs/archive/`，卻漏掉每一條讀起來完全正常、只是沒被安裝的引用（下面那 8 條 `references/…`）。**缺陷按可解析性分佈，不按可疑措辭分佈**——所以要列舉並解析，絕不按可疑性抽樣。
- `scripts/check-doc-consistency.js` 是這一立場的參考實現：它對 parity 腳本做 `existsSync` 守衛、glossary 缺失時 no-op、consent 組只在至少一條路徑存在時才檢查。它假設自己可能運行在與編寫處不同的環境。K9/N3 違反的正是這個典範。

**`references/…` 指標類 —— 系統性，不是偶發。** 已完成的稽核（2026-09-05）確認洩漏 K10 只是一條通用規則違反的一個實例：**任何 INSTALLED 檔案只要用 `references/` 路徑引用載荷同儕，在目標專案裡就是斷的**，因為 INIT 要嘛重新命名它（`references/policies/lifecycle.policy.md` → `docs/rules/lifecycle.md`），要嘛根本不裝。八個確認實例：`git.policy.md:23,64,95,99`（4 處——一個此前完全不在計劃裡的檔案）、`sub-skills.md:177,202,286`（3 處）、`lifecycle.policy.md:108,109`（2 處）、`governance-files.policy.md:58`（1 處）。修法是一條規則、處處適用：**INSTALLED 檔案用目標擁有的路徑引用同儕**（`docs/rules/*.md`），或者陳述事實而不給路徑。

**交叉受眾稽核 —— 已完成（2026-09-05），發現如下。** 全量交叉引用稽核已覆蓋 `references/policies/*.md`、`references/templates/*.md`、`SKILL.md`、`references/workflows/*.md`、`init-spec.json`、全部 INSTALLED 與 SKILL-INTERNAL 腳本、`package-skill.sh`、生成的子技能，以及兩個真實夾具（`--phase A`、`--phase C`）加解壓後的 tarball。結果：**已知 10 處全部在即時夾具上確認；8 處新增真實缺陷；11 處確認為合法雙重使用**（稽核能夠**證明正確**與能夠發現缺陷同樣重要）。分類合計：12 目標專案洩漏 · 8 skill 內部依賴洩漏 · 4 錯誤路徑 · 5 重複權威源 · 3 僅文件無執行者 · 11 合法雙重使用。

需併入 §1 的新缺陷（此前未列）：

- **N4/N5** —— `git.policy.md:23,64,95,99`，四條 `references/…` 指標以 `docs/rules/git-policy.md` 形式抵達目標。單檔案命中最多；此前不在受影響檔案中。
- **N6/N7/N9/N10** —— 同類的其餘四個實例（`sub-skills.md`、`lifecycle.policy.md`、`governance-files.policy.md`）。
- **N1** —— `SKILL.md:278` 引用 `docs/<lang>/bootstrap-output.md`；與 K7 同病、僅隔一行。§1.4 必須同時修兩處。
- **N2** —— `coding.policy.md:8` 讓被治理專案參考「本倉庫的 `.gitattributes`」作為範本。
- **N3** —— `check-role-completeness.js` 在被治理形態下與 K9 一樣失敗，且它**已經算出 `applicable:false` 卻仍 exit 1**。§1.6 覆蓋兩個腳本。
- **N29** —— 安裝後的 `verify-governance.js` 帶著寫有 `verify_governance.js`（底線）的用法行；逐字複製的產物，目標自己的檔案引用了它沒有的檔案名稱。
- **N16** —— `release_requirements`（11 項）在 `release.md` 與 `sub-skills.md` 各列舉一份，後者聲稱遵從前者卻又整份複述；兩者**已經漂移**（L39/L41 與 L218/L220 的 hedge 不同）。歸入 §4 的發佈拆分。
- **K10 比記錄的更大** —— 同一行還點了 `references/templates/agents-md.template.md`；只修 SKILL.md 那半句，洩漏仍在。

**N20/N19 —— Phase A 契約：已裁定（方案 a —— 按階段裁剪生成內容）。**

實測：`AGENTS.md` 是 **Phase A** 工件，而它命令的每個腳本都在 Phase B（`verify-governance.js`、`check-lock.js`、`check-git-policy.js`、`check-secrets.js`、`check-sync.js`）或 Phase C（`check-doc-freshness.js`、`check-doc-consistency.js`、`release-manager.js`）。產物早於其依賴兩個階段。實測：`fixA has scripts/? false`，而 fixA 的 `AGENTS.md:102` 仍寫著「Before any `git commit`: run `node scripts/check-secrets.js` — exit 0 required」。

**裁定：按階段裁剪生成內容，**同時**聲明檢查點狀態——不是二選一。** 只聲明「Phase A 非獨立可用」而保留那些命令，修不了任何東西：一個已經被載入的 Phase A Agent 會立即開始工作，然後撞上指向不存在檔案的指令。缺陷在於**產物自身包含不可執行指令**，不在於說明書沒警告。只改文件，等於把「運行失敗」變成「預告過、然後運行失敗」。

階段契約：

```text
Phase A = 靜態引導檢查點      （不是可用的治理狀態）
Phase B = 可執行治理基線
Phase C = 自適應補全
```

Phase A 產物必須：生成靜態骨架；明確寫出初始化尚未完成；**不命令任何尚未安裝的腳本**；不把未安裝腳本列為當前強制執行的受保護項；不聲稱已具備完整治理能力；並可從 `state.json` 恢復繼續 B/C。腳本執行要求、受保護腳本清單、validator 要求、Git policy 檢查與同步檢查，只在 Phase B 安裝了對應腳本之後才出現。

實作是最小的——不需要新狀態機。`--phase A/B/C` 已經提供了條件，只需讓範本產出按階段裁剪。三個迴歸測試：

1. Phase A 產物不引用 Phase A 未安裝的任何腳本。
2. Phase A 產物明確標記初始化未完成。
3. Phase B/C 產物包含該階段實際安裝的腳本所對應的要求。

**根因升格為規則（停止逐路徑修）。** 本次稽核證明，計劃不能再以「發現一個路徑修一個路徑」的方式維護。規則：

> 任何 INSTALLED 內容的引用，必須在**目標專案的執行環境**中解析；該路徑在 skill 原始碼倉庫中存在，不構成它可用的證據。

同類稽核對象，全部以這一條規則判定：檔案引用 · 命令引用 · **階段依賴** · 產物依賴 · SKILL-INTERNAL / INSTALLED 邊界 · 目標專案與 skill 倉庫的路徑差異。

#### 6. 不做

- 不重造分發角色；INSTALLED/SKILL-INTERNAL/REPO-ONLY 仍是檔案放置的唯一軸。
- 不以禁詞掃描器為主要證據。
- 不建立第四種受眾/可移植性狀態機；兩軸是文件化概念，不是工件。
- 不改 release.md 的自豁免行（38/183）——那些是正當的：release.md 是 SKILL-INTERNAL，技能執行器真的會在發佈本倉庫時讀取它們。

### 驗證（證據等級）

- 每條改寫的 INSTALLED 規則文字都用現有端到端複檢：tarball → INIT → 生成專案 → 每條被引用的路徑都能解析（機械）。
- check-layout-sync.js 被治理專案 no-op 測試（機械）。
- 現有套件保持綠色；新測試經突變驗證（洩漏重新引入時會失敗）。
- 文件/術語表改動經 check-doc-parity + 術語閘門驗證（機械）。
- 不新增禁词语法；可移植性規則在 architecture.md 中作為文件化邊界陳述，而非掃描器。

### 受影響檔案

**payload（INSTALLED / SKILL-INTERNAL 內容與行為）：**

- `references/policies/lifecycle.policy.md` —— §1.1（4 處洩漏）+ N9（2 條 `references/…` 指標）
- `references/templates/sub-skills.md` —— §1.2（2 處倖存引用）+ N6/N7（3 條 `references/…` 指標）+ N8（無條件 glossary）
- `references/policies/governance-files.policy.md` —— §1.3（SKILL.md 節指標，以及同一行的 agents-md.template.md 子句）+ N10 + N12/N13（追蹤表中混用兩種根）
- `references/policies/git.policy.md` —— **N4/N5：四條 `references/…` 指標**（L23、L64、L95、L99）。單檔案命中最多；原計劃中缺失。
- `references/policies/coding.policy.md` —— N2（「本倉庫的 `.gitattributes`」作為範本指標）
- `SKILL.md` —— §1.4（死計劃指標 L49 **與** L278 的 `docs/<lang>/bootstrap-output.md`）
- `references/workflows/release.md` —— §1.5（硬閘門 L41）+ N16（release_requirements 與 sub-skills.md 重複，且已漂移）
- `references/templates/agents-md.template.md` —— **N20：Phase A 契約，已裁定（a）** —— 按階段裁剪腳本子句；Phase A 只產出靜態骨架 + 初始化未完成標記
- `scripts/generate-governance.js` —— N20 按階段渲染 AGENTS.md 範本（`--phase` 開關已存在，範本產出須遵從它）
- `references/workflows/ci.md` —— N19（生成的 ci.yml 呼叫 verify-governance.js；乾淨 `--phase A` 下不可達，但屬同一契約）
- `scripts/check-layout-sync.js` —— §1.6（no-op 守衛）
- `scripts/check-role-completeness.js` —— **N3：與 K9 同樣的 no-op 違反**（已算出 `applicable:false` 仍 exit 1）
- `scripts/verify_governance.js` —— N29（用法行寫著目標沒有的底線檔案名稱）

**repo-infra（文件、術語表、測試、接線）：**

- `docs/glossary.md` —— audience / portability 術語（本變更集已隨計劃加）
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— §2 雙軸模型
- `AGENTS.md` —— §2 可移植性規則（INSTALLED 內容須 project-portable）
- `tests/suites/payload.test.js` —— §3a 生成引用可解析（全部子技能 + 規則）+ N20 的三個階段契約迴歸（Phase A 不引用未安裝腳本 · Phase A 標記初始化未完成 · Phase B/C 攜帶該階段所裝腳本的要求）
- `tests/suites/docs.test.js` —— §3b check-layout-sync no-op；§3c 若實施則死鏈提示
- `CHANGELOG.md` —— 發佈條目
