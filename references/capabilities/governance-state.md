# 治理状态工件

## Trigger

INIT/AUDIT/RELEASE 需要读写治理状态时。

## Authority

governance init contract 声明的 `.governance/{manifest,state,validation,preflight}.json`（名称以契约为准）。

## Invoke

只通过生成器/声明路径创建或更新；Agent 不得发明平行状态文件。

## Verify

四态（或其 Gen2 等价）存在且与 manifest 声明一致。

## Non-goals

不是 Discovery Ledger；不存长期规则正文。
