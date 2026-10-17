# 开发行为评估

cases.json 保存任务、输入、应读资源与评审要点。每个任务使用独立副本；只将 task、fixtures 和 followups 交给 Agent，expected、avoid 与 oracle 留给评审。

## 运行

使用相同客户端、模型、初始仓库、权限和工具条件比较基准与改进版。先确认三个 Skill 可被宿主发现。保存初始状态、结果差异、工具读取、耗时和用户纠正。

required_resources 表示此任务应取得的材料，`#规则` 表示完整目标段。已完整读取且未变的材料可以复用；观察任务新增动作和上下文恢复时是否补读。对 D05 等轻任务同时查看不必要的读集扩展。

多轮按 followups 执行；恢复只交接实际记录及磁盘内容。Git 用例在本地临时仓库与 bare remote 中准备已知差异和评估身份。发布恢复使用模拟远端状态，避免影响真实项目。

## 功能判定器

```bash
python evals/oracles/check_expiry.py /path/to/result
python evals/oracles/check_csv.py /path/to/result
python evals/oracles/check_removal.py /path/to/result
python evals/oracles/check_ci.py /path/to/result
```

前三项使用标准库，CI 用项目构建依赖 PyYAML。到期、CSV、删除与 CI 判定分别检查其固定任务的结果。原样 fixture 应在对应缺陷或缺失能力处失败；单元测试同时运行正确样例和保留一处错误的样例。

P02 明确要求 test.yml 对全部 push/PR 直接执行现有 unittest 命令，只读权限且仅做测试。CI oracle 按这一限定任务检查配置；其他项目的 CI 依其自己的契约评审。

## 评审与记录

先核对目标行为、授权范围和用户已有工作，再看职责、同类实例、测试、生成物和说明。判断新增机制、验证量及询问是否有实际用途，记录具体浪费与漏项。

真实问题用输入、输出、差异或可复查条件支持；必要的防御代码、测试替身和兼容行为按用途保留。模型生成的同意标记、问题数量和否定词频不作为质量得分。

优先运行 D01/D03（完整修复与删除）、D05（纯文案）、D12/D13（真实迁移与重评）、R06（测试判断）、P02（CI）、G01/G04（授权与恢复）、C03（已知问题）。记录结果、首次人工纠正、实际读取、额外文件/命令、重复询问及总耗时，保存在 evals/runs/。
