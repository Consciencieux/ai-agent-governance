# CI Workflow 模板（按检测到的平台/栈选择）

管线统一包含：**安装依赖 → 格式检查 → 静态检查 → 类型检查 → 测试 → 构建 → 产物/报告上传**。平台未知 → ⚠️ Blocked 并询问用户。

按项目实际能力裁剪：项目脚本缺失时对应步骤只保留 `echo "No <tool> configured yet"`（黄字警告），**不得强行编写无法执行的命令**（见 SKILL.md「CI 降级策略」）。

**CI 门禁完整性**（证据等级：人工背书。本节是判断标准，没有脚本自动检测——写在这里不等于已被机械强制）：
- 若项目维护 CI，CI 必须运行与 AGENTS.md 声明的门禁集合等价的命令，**不能只运行子集**（例如只 `npm test` 但声称「fails CI」）。
- 判定链：无 CI 维护 → 不适用；有 CI 但某门禁不可用（脚本缺失、平台限制）→ 必须明确标记为 `not applicable` 或 `deferred`，不得伪装成通过；`echo "No <tool> configured yet"` 是警告占位，不是已执行。
- 本条目与 SKILL.md「CI 降级策略」一致：可以降级（项目缺工具时保警告占位），但必须**声明降级**，不能静默缩小门禁范围。

## GitHub Actions — Node.js / TypeScript + pnpm（Prettier + ESLint）

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist
```

> Node/TS：Prettier 默认值即可运行（2 空格、单引号、80 列）；如需定制，项目根放 `.prettierrc`（可选，非强制生成）。

## GitHub Actions — Python（ruff check + ruff format + mypy）

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install -e ".[dev]"
      - run: ruff format --check .
      - run: ruff check .
      - run: mypy .
      - run: pytest -q
      - run: python -m build
      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.python-version }}
          path: dist
```

> Python：ruff 默认（black 风格、line-length 88）即可运行；如需定制，在 `pyproject.toml` 的 `[tool.ruff]` 配置（可选，非强制生成）。

## GitHub Actions — Rust（cargo fmt + clippy）

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --check
      - run: cargo clippy -- -D warnings
      - run: cargo test
      - run: cargo build --release
```

## GitHub Actions — Go（gofmt + go vet）

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "stable"
          cache: true
      - run: gofmt -l .
      - run: go vet ./...
      - run: go test ./...
      - run: go build ./...
```

## GitHub Actions — Java（Maven + Spotless）

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
          cache: maven
      - run: mvn -B spotless:check
      - run: mvn -B test
      - run: mvn -B package -DskipTests
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: target/*.jar
```

> Java（Maven）：`spotless:check` **必须在 `pom.xml` 中声明插件与风格，否则 CI 无法运行**。INIT 时写入（google-java-format）：

```xml
<!-- pom.xml：加入 <build><plugins> -->
<plugin>
  <groupId>com.diffplug.spotless</groupId>
  <artifactId>spotless-maven-plugin</artifactId>
  <version>2.43.0</version>
  <configuration>
    <java>
      <googleJavaFormat/>
    </java>
  </configuration>
</plugin>
```

> Gradle 项目改用 `com.diffplug.spotless` 插件 + `googleJavaFormat()` 配置，CI 步骤替换为 `./gradlew spotlessCheck`。

## GitHub Actions — C++（clang-format + CMake + CTest）

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: sudo apt-get update && sudo apt-get install -y clang clang-tools cmake ninja-build
      - run: clang-format --dry-run --Werror --recursive src/ include/ tests/
      - run: cmake -S . -B build -G Ninja -DCMAKE_CXX_COMPILER=clang++
      - run: cmake --build build
      - run: ctest --test-dir build --output-on-failure
```

> 按检测到的构建系统选择：CMake 用上例；Makefile 项目把 build 步骤替换为 `make` / `make test`。`clang-tidy` 需 `compile_commands.json`（CMake 加 `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`），可选。

INIT 同时生成项目 `.clang-format`（风格基线，CI 的 `clang-format --dry-run` 默认读取它）：

```yaml
BasedOnStyle: LLVM
IndentWidth: 4
UseTab: Never
BreakBeforeBraces: Attach
ColumnLimit: 120
PointerAlignment: Left
AllowShortFunctionsOnASingleLine: Empty
AllowShortIfStatementsOnASingleLine: Never
NamespaceIndentation: None
DerivePointerAlignment: false
SortIncludes: true
SpacesInAngles: Never
Standard: Latest
```

## GitLab CI (node)

```yaml
stages: [format, lint, test, build]

format:
  stage: format
  image: node:20
  script:
    - npx prettier --check .
  # Python: ruff format --check . | Rust: cargo fmt --check | Go: gofmt -l . | Java: mvn -B spotless:check | C++: clang-format --dry-run --Werror

lint:
  stage: lint
  image: node:20
  script:
    - npm run lint
  # Rust: cargo clippy -- -D warnings | Python: ruff check . | Go: go vet ./...

test:
  stage: test
  image: node:20
  script:
    - npm test

build:
  stage: build
  image: node:20
  script:
    - npm run build

governance:
  stage: test
  image: node:20
  script:
    - node scripts/verify-governance.js
```

> 按检测到的包管理器/栈替换 image 与 script（包管理器以锁文件为准）；项目脚本缺失的步骤只保留 `echo "No <tool> configured yet"` 警告（见 SKILL.md「CI 降级策略」）。治理门禁 job 与 GitHub Actions 版一致。

## GitLab CI (python)

```yaml
stages: [format, lint, test, build]

format:
  stage: format
  image: python:3.11
  script:
    - npx prettier --check .
  # Python: ruff format --check . | Rust: cargo fmt --check | Go: gofmt -l . | Java: mvn -B spotless:check | C++: clang-format --dry-run --Werror

lint:
  stage: lint
  image: python:3.11
  script:
    - npm run lint
  # Rust: cargo clippy -- -D warnings | Python: ruff check . | Go: go vet ./...

test:
  stage: test
  image: python:3.11
  script:
    - npm test

build:
  stage: build
  image: python:3.11
  script:
    - npm run build

governance:
  stage: test
  image: python:3.11
  script:
    - node scripts/verify-governance.js
```

> 按检测到的包管理器/栈替换 image 与 script（包管理器以锁文件为准）；项目脚本缺失的步骤只保留 `echo "No <tool> configured yet"` 警告（见 SKILL.md「CI 降级策略」）。治理门禁 job 与 GitHub Actions 版一致。

## GitLab CI (go)

```yaml
stages: [format, lint, test, build]

format:
  stage: format
  image: golang:1.21
  script:
    - npx prettier --check .
  # Python: ruff format --check . | Rust: cargo fmt --check | Go: gofmt -l . | Java: mvn -B spotless:check | C++: clang-format --dry-run --Werror

lint:
  stage: lint
  image: golang:1.21
  script:
    - npm run lint
  # Rust: cargo clippy -- -D warnings | Python: ruff check . | Go: go vet ./...

test:
  stage: test
  image: golang:1.21
  script:
    - npm test

build:
  stage: build
  image: golang:1.21
  script:
    - npm run build

governance:
  stage: test
  image: golang:1.21
  script:
    - node scripts/verify-governance.js
```

> 按检测到的包管理器/栈替换 image 与 script（包管理器以锁文件为准）；项目脚本缺失的步骤只保留 `echo "No <tool> configured yet"` 警告（见 SKILL.md「CI 降级策略」）。治理门禁 job 与 GitHub Actions 版一致。

## GitLab CI (java)

```yaml
stages: [format, lint, test, build]

format:
  stage: format
  image: maven:3.9-eclipse-temurin-17
  script:
    - npx prettier --check .
  # Python: ruff format --check . | Rust: cargo fmt --check | Go: gofmt -l . | Java: mvn -B spotless:check | C++: clang-format --dry-run --Werror

lint:
  stage: lint
  image: maven:3.9-eclipse-temurin-17
  script:
    - npm run lint
  # Rust: cargo clippy -- -D warnings | Python: ruff check . | Go: go vet ./...

test:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  script:
    - npm test

build:
  stage: build
  image: maven:3.9-eclipse-temurin-17
  script:
    - npm run build

governance:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  script:
    - node scripts/verify-governance.js
```

> 按检测到的包管理器/栈替换 image 与 script（包管理器以锁文件为准）；项目脚本缺失的步骤只保留 `echo "No <tool> configured yet"` 警告（见 SKILL.md「CI 降级策略」）。治理门禁 job 与 GitHub Actions 版一致。

## GitLab CI (cpp)

```yaml
stages: [format, lint, test, build]

format:
  stage: format
  image: ubuntu:22.04
  script:
    - npx prettier --check .
  # Python: ruff format --check . | Rust: cargo fmt --check | Go: gofmt -l . | Java: mvn -B spotless:check | C++: clang-format --dry-run --Werror

lint:
  stage: lint
  image: ubuntu:22.04
  script:
    - npm run lint
  # Rust: cargo clippy -- -D warnings | Python: ruff check . | Go: go vet ./...

test:
  stage: test
  image: ubuntu:22.04
  script:
    - npm test

build:
  stage: build
  image: ubuntu:22.04
  script:
    - npm run build

governance:
  stage: test
  image: ubuntu:22.04
  script:
    - node scripts/verify-governance.js
```

> 按检测到的包管理器/栈替换 image 与 script（包管理器以锁文件为准）；项目脚本缺失的步骤只保留 `echo "No <tool> configured yet"` 警告（见 SKILL.md「CI 降级策略」）。治理门禁 job 与 GitHub Actions 版一致。

## GitLab CI (docs-only)

```yaml
stages: [format, lint, test, build]

format:
  stage: format
  image: ubuntu:22.04
  script:
    - npx prettier --check .
  # Python: ruff format --check . | Rust: cargo fmt --check | Go: gofmt -l . | Java: mvn -B spotless:check | C++: clang-format --dry-run --Werror

lint:
  stage: lint
  image: ubuntu:22.04
  script:
    - npm run lint
  # Rust: cargo clippy -- -D warnings | Python: ruff check . | Go: go vet ./...

test:
  stage: test
  image: ubuntu:22.04
  script:
    - npm test

build:
  stage: build
  image: ubuntu:22.04
  script:
    - npm run build

governance:
  stage: test
  image: ubuntu:22.04
  script:
    - node scripts/verify-governance.js
```

> 按检测到的包管理器/栈替换 image 与 script（包管理器以锁文件为准）；项目脚本缺失的步骤只保留 `echo "No <tool> configured yet"` 警告（见 SKILL.md「CI 降级策略」）。治理门禁 job 与 GitHub Actions 版一致。

## 纯文档项目（无构建）

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx markdownlint-cli2 "**/*.md"
      - run: npx markdown-link-check README.md docs/**/*.md
      - run: node scripts/verify-governance.js
```

## 配套

- 若启用 GitHub：开启 **secret scanning** 与 **Dependabot**，并把治理校验作为门禁：

`.github/dependabot.yml`：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

```yaml
# 可选：治理门禁 job
governance:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: node scripts/verify-governance.js
    - name: Governance badge endpoint
      run: |
        node scripts/verify-governance.js --json > governance-report.json || true
        node -e "
          const r = require('./governance-report.json');
          const pct = r.total ? Math.round(r.passed / r.total * 100) : 0;
          const color = pct === 100 ? 'green' : pct >= 80 ? 'yellow' : 'red';
          require('fs').writeFileSync('governance-badge.json', JSON.stringify({
            schemaVersion: 1, label: 'governance', message: r.passed + '/' + r.total, color
          }));
        "
    - uses: actions/upload-artifact@v4
      with:
        name: governance-badge
        path: governance-badge.json
```

> 徽章端点为 shields.io `endpoint` 格式（`label=governance`、`message=N/M`、绿/黄/红按通过率）。托管方式自选（Gist / GH Pages / 静态托管），本模板只交付工件生成。`--json` 的 `score` 字段（passed/total，等权 v1）供看板/徽章消费。

> dependabot 的 package-ecosystem 按检测到的包管理器替换（npm / pip / cargo / gomod / maven）；未用到的 ecosystem 区块删除。
