# 开发行为评估

cases.json 保存任务、输入、应读资源和评审要点。fixtures 是可复制的评估项目与材料；每个任务使用独立副本。将 task 和相关 followups 交给 Agent，expected、avoid 与 oracles 留给评审。

## 运行方式

在同一模型和客户端中，用相同任务、初始项目、权限和工具条件重复运行关键任务。安装后的三个角色应出现在宿主技能列表中。

保存目标目录初始状态、实际输出和差异、工具记录、请求轮数、耗时及人工修订。只读任务比对工作区内容；多轮任务按顺序发送 followups，恢复步骤仅交接实际工作记录及当前文件。

repo 内的 oracles 使用 Python 标准库，按明确功能契约检查目标副本：

```bash
python evals/oracles/check_expiry.py /path/to/result
python evals/oracles/check_csv.py /path/to/result
python evals/oracles/check_removal.py /path/to/result
```

原始 sample-project 故意保留尚未被其原测试覆盖的过期边界错误，并且没有 CSV 功能；相应 oracle 应失败。cleanup-project 含待删除功能，删除 oracle 也应失败。仓库单元测试同时检查这些原始失败与正确实现样例。

## 评审

先检查功能、范围和已有工作是否正确保留，再检查影响面、有效测试、依赖选择、额外结构及文档更新。记录具体漏项和用户纠正，不按新增文件数或否定词数量打分。

从工具记录核对 required_resources：是否实际读取、是否完整、何时补读、是否重复加载未变文件。入口名称或“已遵守”声明不能代替这项记录。

优先运行 D01、D02、D03、R01、P01 和 C01。它们分别覆盖同类修复、复用库、完整删除、只读边界、真实接入和连续任务。结果保存在 evals/runs/。
