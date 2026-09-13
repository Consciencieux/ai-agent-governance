# RELEASE 编排 + 人类批准

> Capability leaf (`release-orchestration`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/release-orchestration.md`.

## Trigger

用户说 release/publish；版本推进。

## Authority

release workflow（项目内发布流程权威） + `scripts/release-manager.js`（tag executor）+ ADR-0004 HITL。

## Invoke

按 release 工作流：Proposal → 人批 → 版本同步 → tag/push；`execute` 前必须重新 `plan` 重建 provenance。

## Verify

无批准不写 tag；provenance 与 HEAD 一致；校验器通过。

## Non-goals

不负责本仓 skill-release（repo-workflows）；不手改 proposal JSON。
