# 已确认材料

项目约定：空输入返回空列表，其他输入按序返回平方。实现如下，相关用例均使用此公开契约。

```python
def squares(values: list[int]) -> list[int]:
    return [value * value for value in values]
```

目前没有其他消费者、I/O 或业务分支。
