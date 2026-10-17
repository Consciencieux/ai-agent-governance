# Sample Project

令牌在 `now < expires_at` 时有效；到期瞬间及以后均无效。单条查询和批量过滤采用相同规则。

记录导出目前提供 JSON。运行测试：

```bash
python -m unittest discover -s tests -v
```
