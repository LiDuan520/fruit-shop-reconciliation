# 蔬果店订单配送对账系统：开发任务拆分（MVP）

基于 `PRD-蔬果店订单配送对账系统-MVP.md` 拆分。

目标是先做出一个能在真实店内跑起来的闭环：

`下单 / 改单 -> 店内汇总备货 -> 最终发货 -> 配送签收 -> 周结对账 / 欠款`

---

## 1. 版本策略

### V0：最快可用闭环

建议周期：1-2 周。

目标：先让店内不用再完全依赖纸本汇总和手工对账。

范围：

- 店内 Web 管理端
- 饭店端 H5 下单页，后续可迁移/封装为小程序
- Excel 导出拣货单
- 手动确认缺货、部分发货、替代结果
- 签收留证
- 周结对账和欠款记录

暂缓：

- 小程序订阅消息
- 自动消息触达
- 完整替代确认中心
- 库存、采购、线上收款

### V1：标准 MVP

建议周期：2-6 周。

目标：补齐饭店端确认、消息提醒和关键强卡控。

范围：

- 饭店端替代确认中心
- 截止后改单审批结果提醒
- 替代待确认不可签收
- 小程序或企业微信消息提醒
- 对账单在线查看

### V2：增强版本

后续迭代。

范围：

- 库存/采购联动
- 客户专属价
- 供应商采购清单
- 多批次配送
- 路线优化
- 经营统计报表

---

## 2. 角色与权限

### 老板

- 管理客户
- 管理商品和价格
- 查看全部订单
- 审批截止后改单
- 调整最终发货明细
- 生成对账单
- 记录收款和欠款

### 店员 / 分拣员

- 查看今日订单
- 导出拣货单
- 录入缺货、部分发货、替代
- 查看变更记录

### 配送员

- 查看今日配送单
- 填写签收人
- 上传签收照片
- 完成签收

### 饭店下单人

- 创建订单
- 复制昨日订单
- 截止前改单
- 截止后提交改单请求
- 查看订单状态
- V1 确认/拒绝替代建议
- 查看对账单和欠款

---

## 3. 核心业务对象

### 客户 Customer

用于管理饭店、单位客户。

关键字段：

- `id`
- `name`
- `contact_name`
- `phone`
- `address`
- `default_cutoff_time`
- `settlement_cycle`
- `status`
- `created_at`
- `updated_at`

### 用户 User

用于登录和权限控制。

关键字段：

- `id`
- `customer_id`
- `name`
- `phone`
- `role`
- `status`
- `created_at`
- `updated_at`

说明：

- 店内员工没有 `customer_id`
- 饭店下单人绑定对应 `customer_id`

### 商品 Product

用于维护可售商品。

关键字段：

- `id`
- `name`
- `category`
- `default_unit`
- `available_units`
- `status`
- `sort_order`
- `created_at`
- `updated_at`

### 今日价 DailyPrice

用于按日期维护价格。

关键字段：

- `id`
- `product_id`
- `date`
- `unit`
- `price`
- `created_by`
- `created_at`
- `updated_at`

规则：

- 下单时读取对应日期、商品、单位的价格
- 订单提交后写入订单明细价格快照
- 后续修改今日价不影响历史订单金额

### 订单 Order

用于记录某客户某送达日期的订单。

关键字段：

- `id`
- `order_no`
- `customer_id`
- `delivery_date`
- `status`
- `cutoff_time_snapshot`
- `submitted_at`
- `created_by`
- `created_at`
- `updated_at`

建议状态：

- `draft` 草稿
- `submitted` 已提交
- `change_pending` 改单待审批
- `preparing` 备货中
- `ready_to_deliver` 待配送
- `delivered` 已签收
- `cancelled` 已取消

### 订单明细 OrderItem

用于记录客户提交的原始需求。

关键字段：

- `id`
- `order_id`
- `product_id`
- `product_name_snapshot`
- `unit`
- `quantity`
- `unit_price_snapshot`
- `remark`
- `created_at`
- `updated_at`

### 实际发货明细 FulfillmentItem

用于记录最终计入对账的发货结果。

关键字段：

- `id`
- `order_id`
- `source_order_item_id`
- `product_id`
- `product_name_snapshot`
- `unit`
- `planned_quantity`
- `fulfilled_quantity`
- `unit_price_snapshot`
- `fulfillment_status`
- `shortage_reason`
- `remark`
- `created_at`
- `updated_at`

建议状态：

- `full` 足量发货
- `partial` 部分发货
- `shortage` 缺货未发
- `substituted` 已替代

规则：

- 对账金额按 `fulfilled_quantity * unit_price_snapshot` 计算
- 原订单明细用于追溯，实际发货明细用于结算

### 改单请求 ChangeRequest

用于处理截止后的改单。

关键字段：

- `id`
- `order_id`
- `customer_id`
- `requested_by`
- `status`
- `reason`
- `before_snapshot`
- `after_snapshot`
- `reviewed_by`
- `reviewed_at`
- `review_comment`
- `created_at`
- `updated_at`

建议状态：

- `pending` 待审批
- `approved` 已同意
- `rejected` 已拒绝
- `cancelled` 已取消

### 变更日志 OrderChangeLog

用于追踪订单变化。

关键字段：

- `id`
- `order_id`
- `operator_id`
- `operator_role`
- `change_type`
- `before_snapshot`
- `after_snapshot`
- `created_at`

建议记录场景：

- 创建订单
- 截止前改单
- 截止后改单申请
- 改单审批通过/拒绝
- 录入缺货/部分发货
- 发起替代
- 确认/拒绝替代
- 完成签收

### 替代请求 SubstitutionRequest

V0 可手动记录确认结果，V1 做饭店端确认中心。

关键字段：

- `id`
- `order_id`
- `source_order_item_id`
- `original_product_id`
- `original_product_name_snapshot`
- `substitute_product_id`
- `substitute_product_name_snapshot`
- `unit`
- `quantity`
- `unit_price_snapshot`
- `status`
- `reason`
- `customer_decision_by`
- `customer_decision_at`
- `created_by`
- `created_at`
- `updated_at`

建议状态：

- `pending` 待确认
- `accepted` 已确认
- `rejected` 已拒绝
- `cancelled` 已取消

### 签收记录 DeliveryReceipt

用于签收留证。

关键字段：

- `id`
- `order_id`
- `delivery_user_id`
- `receiver_name`
- `photo_urls`
- `signed_at`
- `created_at`

规则：

- `receiver_name` 必填
- `photo_urls` 至少 1 张
- V1 中如存在待处理改单或待确认替代，不允许签收

### 对账单 Statement

用于周结或周期结算。

关键字段：

- `id`
- `statement_no`
- `customer_id`
- `period_start`
- `period_end`
- `status`
- `total_amount`
- `paid_amount`
- `balance_amount`
- `generated_at`
- `confirmed_at`
- `created_at`
- `updated_at`

建议状态：

- `draft` 草稿
- `issued` 已出账
- `partially_paid` 部分收款
- `paid` 已结清
- `voided` 已作废

### 对账单明细 StatementItem

用于记录对账单包含的订单。

关键字段：

- `id`
- `statement_id`
- `order_id`
- `delivery_date`
- `amount`
- `created_at`

### 收款记录 Payment

用于记录已收、部分收和欠款。

关键字段：

- `id`
- `statement_id`
- `customer_id`
- `amount`
- `payment_method`
- `paid_at`
- `remark`
- `created_by`
- `created_at`

---

## 4. 状态流转

### 订单状态流转

```text
draft
  -> submitted
  -> change_pending
  -> submitted
  -> preparing
  -> ready_to_deliver
  -> delivered
```

异常流转：

```text
draft/submitted -> cancelled
```

说明：

- 截止前改单不一定改变订单状态，但必须写变更日志
- 截止后提交改单请求时，订单进入 `change_pending`
- 审批同意后回到 `submitted`
- 审批拒绝后保持原订单明细并回到 `submitted`
- 存在 `change_pending` 时不允许签收

### 替代请求状态流转

```text
pending -> accepted
pending -> rejected
pending -> cancelled
```

说明：

- V0 可由店内手动标记客户已电话/微信确认
- V1 由饭店端确认或拒绝
- 存在 `pending` 替代请求时不允许签收

### 对账单状态流转

```text
draft -> issued -> partially_paid -> paid
```

异常流转：

```text
draft/issued -> voided
```

说明：

- 对账单金额来自已签收订单的最终发货明细
- 订单未签收时不建议进入正式对账单

---

## 5. 页面与功能拆分

### 5.1 店内 Web 管理端

#### 登录

任务：

- 手机号/账号登录
- 根据角色进入对应首页
- 登录态保持

验收：

- 老板、店员、配送员能看到不同功能入口

#### 首页 / 今日看板

任务：

- 展示今日订单数
- 展示待处理改单数
- 展示待确认替代数
- 展示待配送/已签收数量
- 展示今日应发客户列表

验收：

- 老板打开系统能立即知道今天还有哪些事情没处理

#### 客户管理

任务：

- 新增/编辑/停用客户
- 配置联系人、电话、地址
- 配置截止时间
- 配置结算周期

验收：

- 可为不同客户设置不同下单截止时间
- 停用客户不能再下单

#### 商品管理

任务：

- 新增/编辑/上下架商品
- 配置分类
- 配置默认单位
- 配置可选单位
- 排序

验收：

- 下架商品不出现在饭店端下单列表

#### 今日价管理

任务：

- 按日期维护商品价格
- 支持批量编辑
- 支持复制上一日价格
- 标记未维护价格的商品

验收：

- 饭店端下单展示正确价格
- 订单提交后锁价，后续改价不影响历史订单

#### 订单中心

任务：

- 按日期、客户、状态筛选订单
- 查看订单详情
- 查看订单变更日志
- 处理截止后改单请求
- 手动调整订单进入备货状态

验收：

- 截止后改单必须审批
- 审批结果可追溯

#### 汇总与拣货单

任务：

- 按日期汇总订单
- 按客户查看明细
- 按商品/品类汇总数量
- 导出 Excel
- 可选 PDF/打印视图

验收：

- 1-3 分钟内导出当天拣货清单
- 同一商品不同单位不混算

#### 最终发货

任务：

- 基于订单明细生成实际发货明细
- 录入实际发货数量
- 标记缺货/部分发货
- 填写缺货原因
- V0 手动记录替代确认
- V1 发起替代请求

验收：

- 对账金额按实际发货数量计算
- 缺货、部分发货、替代都有记录

#### 配送签收

任务：

- 今日配送列表
- 签收页
- 填写签收人
- 上传至少 1 张照片
- 完成签收

验收：

- 没有签收人不能签收
- 没有照片不能签收
- V1 存在待处理改单/待确认替代不能签收

#### 周结对账

任务：

- 按客户和周期生成对账单
- 自动汇总已签收订单
- 查看订单明细和金额
- 记录收款
- 计算欠款余额
- 导出/打印对账单

验收：

- 对账金额等于最终发货明细金额合计
- 支持部分收款
- 欠款余额计算正确

---

### 5.2 饭店端 H5 / Web

#### 登录 / 客户绑定

任务：

- 手机号登录或店内创建账号
- 绑定饭店客户

验收：

- 饭店用户只能查看自己的订单和对账单

#### 下单

任务：

- 选择送达日期
- 添加商品
- 选择单位
- 填写数量和备注
- 展示今日价
- 提交订单

验收：

- 提交后订单进入 `submitted`
- 明细写入价格快照

#### 复制昨日

任务：

- 拉取上一送达日订单
- 生成当前日期草稿
- 允许编辑后提交

验收：

- 复制出的订单不会直接提交
- 使用当前送达日期价格锁价

#### 改单

任务：

- 截止前直接编辑订单
- 截止后提交改单请求
- 查看审批结果

验收：

- 截止前修改立即生效并留痕
- 截止后不能直接修改正式订单

#### 替代确认中心（V1）

任务：

- 查看待确认替代
- 确认替代
- 拒绝替代
- 查看处理结果

验收：

- 确认后替代商品计入最终发货
- 拒绝后店内需改为缺货或部分发货

#### 订单查询

任务：

- 查看今日订单
- 查看历史订单
- 查看订单状态
- 查看最终发货明细和签收状态

验收：

- 饭店能清楚看到自己最终被结算的内容

#### 对账单查询

任务：

- 查看周结对账单
- 查看订单明细
- 查看已收、未收、欠款

验收：

- 对账单金额与店内一致

---

## 6. 接口拆分建议

### 客户

- `GET /customers`
- `POST /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`
- `PATCH /customers/:id/status`

### 商品

- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `PATCH /products/:id/status`

### 今日价

- `GET /daily-prices?date=YYYY-MM-DD`
- `POST /daily-prices/batch`
- `POST /daily-prices/copy-from-date`

### 饭店端订单

- `GET /restaurant/orders`
- `POST /restaurant/orders`
- `GET /restaurant/orders/:id`
- `PATCH /restaurant/orders/:id`
- `POST /restaurant/orders/copy-yesterday`
- `POST /restaurant/orders/:id/change-requests`

### 店内订单

- `GET /admin/orders`
- `GET /admin/orders/:id`
- `GET /admin/orders/:id/change-logs`
- `POST /admin/change-requests/:id/approve`
- `POST /admin/change-requests/:id/reject`

### 汇总与导出

- `GET /admin/picking/summary?date=YYYY-MM-DD&group_by=product`
- `GET /admin/picking/summary?date=YYYY-MM-DD&group_by=customer`
- `GET /admin/picking/export?date=YYYY-MM-DD&type=excel`

### 最终发货

- `GET /admin/orders/:id/fulfillment`
- `PATCH /admin/orders/:id/fulfillment`
- `POST /admin/orders/:id/substitution-requests`

### 替代确认

- `GET /restaurant/substitution-requests`
- `POST /restaurant/substitution-requests/:id/accept`
- `POST /restaurant/substitution-requests/:id/reject`

### 签收

- `GET /delivery/orders?date=YYYY-MM-DD`
- `POST /delivery/orders/:id/receipt`
- `GET /admin/orders/:id/receipt`

### 对账

- `GET /admin/statements`
- `POST /admin/statements/generate`
- `GET /admin/statements/:id`
- `POST /admin/statements/:id/issue`
- `POST /admin/statements/:id/payments`
- `GET /restaurant/statements`

---

## 7. 开发任务清单

### 阶段 0：项目初始化

- 选择技术栈
- 初始化前后端项目
- 配置数据库
- 配置登录鉴权
- 配置文件上传目录或对象存储
- 建立基础枚举：角色、订单状态、改单状态、替代状态、对账单状态

完成标准：

- 本地可启动
- 可以登录
- 数据库迁移可执行

### 阶段 1：基础资料

- 客户管理
- 用户管理
- 商品管理
- 今日价管理

完成标准：

- 可以维护饭店、商品、价格
- 价格可按日期查询

### 阶段 2：下单与改单

- 饭店端下单
- 复制昨日
- 截止时间判断
- 截止前改单
- 截止后改单请求
- 店内审批改单
- 订单变更日志

完成标准：

- 能完整覆盖下单/改单流程
- 所有变更可追溯

### 阶段 3：汇总备货

- 按客户汇总
- 按商品/品类汇总
- Excel 导出
- 打印友好视图

完成标准：

- 店内能用导出清单进行分拣

### 阶段 4：最终发货

- 生成实际发货明细
- 录入实际数量
- 标记缺货/部分发货
- V0 手动记录替代确认
- V1 替代请求和饭店确认

完成标准：

- 最终发货明细可用于对账

### 阶段 5：配送签收

- 配送列表
- 签收页
- 上传照片
- 填写签收人
- 签收强校验

完成标准：

- 无签收人或无照片不能签收
- 已签收订单有留证

### 阶段 6：周结对账

- 按客户周期生成对账单
- 统计订单金额
- 查看对账单明细
- 记录收款
- 计算欠款
- 导出/打印

完成标准：

- 对账金额准确
- 支持部分收款和欠款余额

### 阶段 7：提醒与小程序增强（V1）

- 替代待确认提醒
- 改单审批结果提醒
- 临近截止提醒
- 饭店端替代确认中心

完成标准：

- 饭店能收到关键事件提醒
- 待确认替代不允许签收

---

## 8. 关键验收用例

### 用例 1：截止前改单

前置：

- 客户 A 截止时间为 20:00
- 当前时间为 19:30

步骤：

1. 客户 A 提交明日订单
2. 客户 A 修改商品数量

预期：

- 修改直接生效
- 写入变更日志
- 价格仍按提交/修改时规则正确快照

### 用例 2：截止后改单

前置：

- 客户 A 截止时间为 20:00
- 当前时间为 20:30

步骤：

1. 客户 A 提交改单请求
2. 店内审批同意

预期：

- 客户不能直接修改正式订单
- 审批同意后订单明细更新
- 变更日志记录请求和审批

### 用例 3：缺货部分发货

步骤：

1. 客户订购土豆 20 斤
2. 店内实际发货 15 斤
3. 填写缺货原因

预期：

- 最终发货数量为 15 斤
- 对账按 15 斤计算
- 原始订单仍保留 20 斤记录

### 用例 4：签收强校验

步骤：

1. 配送员打开签收页
2. 不填写签收人或不上传照片
3. 点击签收

预期：

- 系统阻止签收
- 提示补全签收人和照片

### 用例 5：对账单金额

步骤：

1. 客户一周内有多张已签收订单
2. 其中存在部分发货
3. 生成周结对账单

预期：

- 只统计已签收订单
- 按最终发货明细计算金额
- 欠款余额等于应收减已收

---

## 9. 第一版建议实现顺序

建议按这个顺序开工：

### V0（步骤 1–8）

1. 数据库表和枚举
2. 客户、商品、今日价
3. 饭店端下单和复制昨日
4. 截止前/截止后改单
5. 店内订单汇总和 Excel 导出
6. 最终发货明细
7. 签收留证
8. 周结对账

### V1（步骤 9）

9. 替代确认和消息提醒

理由：

- 先打通主链路，再补消息和强交互
- 对账必须依赖最终发货和签收
- 替代确认涉及饭店端触达，适合放在主流程跑通之后

---

## 10. 待决策事项

### 技术栈

已定：Vue 3 + TypeScript + Vite + FastAPI + PostgreSQL

### 文件存储

V0 本地目录，已定。后续可迁移对象存储。

### 打印格式

需要确认：

- A4 打印
- 热敏小票
- 只导出 Excel

建议：

- V0 先 Excel
- 使用稳定后再做固定打印模板

### 价格单位

需要确认：

- 同一商品不同单位是否允许不同价格
- 箱/袋/把是否需要换算到斤

建议：

- V0 不强制换算
- 不同单位按不同价格独立维护和汇总
