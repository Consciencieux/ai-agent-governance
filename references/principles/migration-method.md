# 提取与迁移方法

## Hard Rules（L1）

1. **禁止一次跳转** — 不得 `原项目 → 通用 Skill`。必须经 Facts → Rationale → Reusable Pattern，再写入 L1/L2/L3。
2. **缺 Rationale 不得升格 L1** — 每条 Hard Rule 须能回溯到可核对的事实与「为何存在 / 删了会怎样」。
3. **否决复制型与空泛型** — 复制型=把路径/编号/剧本当 invariant；空泛型=只有口号无可执行约束。二者均不得进入 L1。
4. **过程产物不落盘为假类型** — 提取中间表不是 Research、不是 Plan 文件夹、不是 `working/`、不是工具目录里的施工 md。
5. **验证在干净目标** — 宣称可复用前，须在新项目/干净目标验证能抑制：metadata 膨胀、入口变百科、类型混用、规则多处复制、启动即全量读治理树。无证据不得称完成。

## Recommended Patterns（L2）

- 先冻结过滤边界（portable semantics vs 项目投影），再写 Skill 文件
- Skill 文件 internally 分 Hard Rules / Recommended Patterns / Project Customization
- 发现台账：Open 项在宣称 Implemented 前归零或显式 defer+revisit

## Project Customization（L3）

- 迁移阶段命名（Phase / Horizon / 其他）由项目定
- 是否保留参考实现仓库与 portable 包双产品由项目定
- 具体打包格式、INIT 是否安装原则目录由分发角色声明；本方法要求「角色声明 + 干净目标验证」，不要求某一种目录名
