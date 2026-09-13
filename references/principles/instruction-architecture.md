# 指令架构原则

## Hard Rules（L1）

1. **薄入口** — always-on 入口（技能入口 / AGENTS 类文件）只保留：身份、作用域、少量 invariants、优先级、任务路由。禁止把完整政策、历史、workflow 正文塞进入口。
2. **按需加载** — 执行上下文只加载当前任务适用的指令；禁止要求每次任务通读全部规则树。
3. **显式路由** — 拆分文件必须伴随「什么任务读什么」；无路由的拆分只是把「记规则」变成「找规则」。
4. **知识 ≠ 默认执行指令** — Research / Finding / ADR / 历史 Plan 默认不进入 always-on；仅在任务或 Active Plan 明确引用时加载。
5. **关键保证优先机械** — 越重要的约束越不应只依赖「Agent 是否读到某段 Markdown」。

## Recommended Patterns（L2）

- Progressive disclosure：L1 入口 → L2 执行叶 → L3 参考/边界案例
- Context Economy：最小化完成目标所需的预期总上下文与重复推理；多读一份权威若能避免错误重构则更经济
- Capability 叶单一职责；横切能力用适用关系挂到多个导航点，不塞进单一 lifecycle 章节当默认归宿

## Project Customization（L3）

- 入口文件名（`AGENTS.md` / `CLAUDE.md` / 其他）由项目定
- 子技能目录布局、生成路径由项目定
- 是否采用本仓式 Task→Capability 图或等价路由表由项目定；**须**满足 L1「显式路由」，**不**须复制某仓的图文件或 CTRL 编号
