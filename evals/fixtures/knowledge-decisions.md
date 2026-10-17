# 文档任务材料

仓库已有 docs/architecture.md、docs/decisions/cache.md 和 CHANGELOG.md。cache.md 同时记录缓存失效的事故背景、选择 TTL 的决定与后果，这些内容共同解释同一个选择。

CHANGELOG 的 0.1.0 条目记录当时只支持 JSON；今天新增 CSV。项目用 changeset 文件在 PR 中积累用户可感知的变化，发布时生成日志。

一个尚未实施的流式导出方案已写进 docs/plans/export.md，标题注明“方案，待实施”。当前 README 只说明已可使用的 JSON 功能。

用户希望明确重试设计的当前结论。草稿：“本次改进不是降低质量，而是建立可靠闭环。这并不意味着所有请求都会成功。机制侧能力得到全面提升。”实际信息是：最多三次请求，取消时立即终止，最终失败返回错误。
