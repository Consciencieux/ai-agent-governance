# Queue Sample

队列通过 app.core.enqueue 追加项目。QuickReplay（快速回放）用于回放旧记录，通过 quick-replay 命令调用。REPLAY_STAGE 启用回放阶段。

测试：`python -m unittest discover -s tests -v`。
帮助文字通过 `python tools/generate_help.py` 生成。
