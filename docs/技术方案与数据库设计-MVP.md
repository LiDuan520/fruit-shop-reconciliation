# 蔬果店订单配送对账系统：技术方案与数据库设计（MVP）

基于：

- `PRD-蔬果店订单配送对账系统-MVP.md`
- `开发任务拆分-MVP.md`

本文件用于进入开发前定稿技术栈、项目结构、数据库表、枚举和关键约束。

---

## 1. 推荐技术栈

### 后端

推荐：`Python + FastAPI + SQLAlchemy 2.x + Alembic`

原因：

- FastAPI 开发效率高，适合快速实现业务系统 API
- Python 处理 Excel、PDF、图片上传、定时任务都方便
- SQLAlchemy + Alembic 适合长期维护 PostgreSQL 表结构
- 后续如需对接微信、企业微信、短信、对象存储，生态成熟

备选：

- Django + Django REST Framework：后台管理能力强，但项目结构略重
- Flask：更轻，但大型业务约束需要自行组织更多规范

本项目建议选 FastAPI。

### 数据库

推荐：`PostgreSQL`

原因：

- 金额、订单、对账、状态流转适合关系型数据库
- 支持事务、约束、索引、JSONB 快照字段
- 后续统计报表也方便

### 前端

推荐：`Vue 3 + TypeScript + Vite + Pinia + Vue Router`

UI 组件建议：

- 管理端：`Naive UI` 或 `Ant Design Vue`
- 移动 H5：同项目内做响应式页面，必要时单独拆移动布局

建议优先选 `Naive UI`：

- 视觉更轻，默认样式比较干净
- 表单、表格、弹窗、上传组件完整
- 比较适合做一个不臃肿的小型业务后台

### 文件存储

V0：

- 签收照片保存到后端本地目录
- 数据库保存文件 URL / 相对路径

V1：

- 可迁移到对象存储，例如阿里云 OSS、腾讯云 COS、七牛云

### 导出能力

Excel：

- 后端使用 `openpyxl` 或 `xlsxwriter`

PDF / 打印：

- V0 先提供浏览器打印友好页面
- 后续再做固定 PDF 模板

### 部署建议

V0：

- 一台云服务器或店内小主机
- Docker Compose 部署：backend、frontend、postgres、nginx

V1：

- 增加对象存储
- 增加定时任务服务
- 增加消息通知服务

---

## 2. 推荐项目结构

### 后端目录

```text
backend/
  app/
    api/
      routes/
        auth.py
        customers.py
        products.py
        daily_prices.py
        restaurant_orders.py
        admin_orders.py
        fulfillment.py
        delivery.py
        statements.py
    core/
      config.py
      security.py
      permissions.py
    db/
      session.py
      base.py
    models/
      customer.py
      user.py
      product.py
      daily_price.py
      order.py
      fulfillment.py
      statement.py
    schemas/
      customer.py
      product.py
      order.py
      statement.py
    services/
      order_service.py
      price_service.py
      fulfillment_service.py
      statement_service.py
      export_service.py
    uploads/
    main.py
  alembic/
  tests/
  pyproject.toml
```

### 前端目录

```text
frontend/
  src/
    api/
    assets/
    components/
    layouts/
      AdminLayout.vue
      RestaurantLayout.vue
      DeliveryLayout.vue
    pages/
      admin/
        Dashboard.vue
        Customers.vue
        Products.vue
        DailyPrices.vue
        Orders.vue
        Picking.vue
        Statements.vue
      restaurant/
        OrderCreate.vue
        OrderDetail.vue
        Orders.vue
        Statements.vue
      delivery/
        DeliveryOrders.vue
        Receipt.vue
    router/
    stores/
    styles/
    types/
    main.ts
```

---

## 3. 数据库设计原则

### 金额

- 金额字段使用 `numeric(12, 2)`
- 不使用浮点类型

### 数量

- 数量字段使用 `numeric(12, 3)`
- 蔬果可能存在斤、小数斤、箱、袋、把等单位

### 价格快照

订单提交后必须保存：

- 商品名称快照
- 单位
- 单价快照

这样后续商品改名、改价，不影响历史对账。

### 变更留痕

涉及争议的动作必须写日志：

- 创建订单
- 截止前改单
- 截止后改单申请
- 改单审批
- 缺货/部分发货
- 替代
- 签收
- 对账单生成
- 收款

### 对账依据

对账金额只使用 `fulfillment_items`，不直接使用 `order_items`。

规则：

- `order_items` 记录客户原始需求
- `fulfillment_items` 记录最终发货结果
- `statements` 汇总已签收订单的最终发货金额

---

## 4. 枚举设计

### user_role

- `owner` 老板
- `staff` 店员
- `delivery` 配送员
- `restaurant` 饭店下单人

### common_status

- `active` 启用
- `inactive` 停用

### order_status

- `draft` 草稿
- `submitted` 已提交
- `change_pending` 改单待审批
- `preparing` 备货中
- `ready_to_deliver` 待配送
- `delivered` 已签收
- `cancelled` 已取消

### change_request_status

- `pending` 待审批
- `approved` 已同意
- `rejected` 已拒绝
- `cancelled` 已取消

### fulfillment_status

- `full` 足量发货
- `partial` 部分发货
- `shortage` 缺货未发
- `substituted` 已替代

### substitution_status

- `pending` 待确认
- `accepted` 已确认
- `rejected` 已拒绝
- `cancelled` 已取消

### statement_status

- `draft` 草稿
- `issued` 已出账
- `partially_paid` 部分收款
- `paid` 已结清
- `voided` 已作废

### payment_method

- `cash` 现金
- `wechat` 微信
- `alipay` 支付宝
- `bank_transfer` 银行转账
- `other` 其他

---

## 5. 表结构设计

### 5.1 customers

客户表，用于饭店、单位客户。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| name | varchar(100) | 客户名称 |
| contact_name | varchar(50) | 联系人 |
| phone | varchar(30) | 联系电话 |
| address | varchar(255) | 配送地址 |
| default_cutoff_time | time | 默认下单截止时间 |
| settlement_cycle | varchar(20) | 结算周期（V0纯文本备注字段，不参与自动逻辑；对账单生成时手动传入起止日期），如 weekly |
| status | common_status | 启用状态 |
| remark | text | 备注 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `idx_customers_status`
- `idx_customers_name`

### 5.2 users

用户表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| customer_id | uuid fk nullable | 饭店用户所属客户 |
| name | varchar(50) | 姓名 |
| phone | varchar(30) unique | 手机号 |
| password_hash | varchar(255) | 密码哈希 |
| role | user_role | 用户角色 |
| status | common_status | 启用状态 |
| last_login_at | timestamptz | 最近登录时间 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

约束：

- `role = restaurant` 时建议必须有 `customer_id`
- 店内角色 `owner/staff/delivery` 的 `customer_id` 为空

索引：

- `idx_users_customer_id`
- `idx_users_role`

### 5.3 products

商品表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| name | varchar(100) | 商品名称 |
| category | varchar(50) | 分类 |
| default_unit | varchar(20) | 默认单位 |
| available_units | jsonb | 可选单位数组 |
| status | common_status | 上下架状态 |
| sort_order | int | 排序 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `idx_products_status`
- `idx_products_category`
- `idx_products_sort_order`

### 5.4 daily_prices

每日价格表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| product_id | uuid fk | 商品 |
| price_date | date | 价格日期 |
| unit | varchar(20) | 单位 |
| price | numeric(12,2) | 单价 |
| created_by | uuid fk | 创建人 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

唯一约束：

- `uniq_daily_prices_product_date_unit(product_id, price_date, unit)`

索引：

- `idx_daily_prices_date`
- `idx_daily_prices_product_id`

### 5.5 orders

订单主表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| order_no | varchar(40) unique | 订单号 |
| customer_id | uuid fk | 客户 |
| delivery_date | date | 送达日期 |
| status | order_status | 订单状态 |
| cutoff_time_snapshot | time | 截止时间快照 |
| submitted_at | timestamptz | 提交时间 |
| created_by | uuid fk | 创建人 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

唯一约束建议：

- V0 可限制 `customer_id + delivery_date` 只有一张有效订单
- 若后续支持上午/下午批次，再加入 `delivery_batch`

索引：

- `idx_orders_customer_id`
- `idx_orders_delivery_date`
- `idx_orders_status`
- `idx_orders_customer_delivery_date`

### 5.6 order_items

订单明细表，记录客户原始需求。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| order_id | uuid fk | 订单 |
| product_id | uuid fk | 商品 |
| product_name_snapshot | varchar(100) | 商品名称快照 |
| unit | varchar(20) | 单位 |
| quantity | numeric(12,3) | 下单数量 |
| unit_price_snapshot | numeric(12,2) | 单价快照 |
| remark | text | 备注 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `idx_order_items_order_id`
- `idx_order_items_product_id`

### 5.7 fulfillment_items

实际发货明细表，对账以此为准。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| order_id | uuid fk | 订单 |
| source_order_item_id | uuid fk nullable | 来源订单明细 |
| product_id | uuid fk | 商品 |
| product_name_snapshot | varchar(100) | 商品名称快照 |
| unit | varchar(20) | 单位 |
| planned_quantity | numeric(12,3) | 原计划数量 |
| fulfilled_quantity | numeric(12,3) | 实际发货数量 |
| unit_price_snapshot | numeric(12,2) | 单价快照 |
| fulfillment_status | fulfillment_status | 发货状态 |
| shortage_reason | text | 缺货原因 |
| remark | text | 备注 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `idx_fulfillment_items_order_id`
- `idx_fulfillment_items_product_id`

约束：

- `fulfilled_quantity >= 0`
- 对账金额 = `fulfilled_quantity * unit_price_snapshot`

### 5.8 change_requests

截止后改单请求表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| order_id | uuid fk | 订单 |
| customer_id | uuid fk | 客户 |
| requested_by | uuid fk | 申请人 |
| status | change_request_status | 状态 |
| reason | text | 原因 |
| before_snapshot | jsonb | 修改前快照 |
| after_snapshot | jsonb | 修改后快照 |
| reviewed_by | uuid fk nullable | 审批人 |
| reviewed_at | timestamptz | 审批时间 |
| review_comment | text | 审批备注 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `idx_change_requests_order_id`
- `idx_change_requests_customer_id`
- `idx_change_requests_status`

约束：

- 同一订单同一时间建议只允许一个 `pending` 改单请求

### 5.9 order_change_logs

订单变更日志表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| order_id | uuid fk | 订单 |
| operator_id | uuid fk nullable | 操作人 |
| operator_role | user_role | 操作角色 |
| change_type | varchar(50) | 变更类型 |
| before_snapshot | jsonb | 变更前 |
| after_snapshot | jsonb | 变更后 |
| created_at | timestamptz | 创建时间 |

索引：

- `idx_order_change_logs_order_id`
- `idx_order_change_logs_created_at`

### 5.10 substitution_requests

替代请求表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| order_id | uuid fk | 订单 |
| source_order_item_id | uuid fk nullable | 来源订单明细 |
| original_product_id | uuid fk | 原商品 |
| original_product_name_snapshot | varchar(100) | 原商品名称快照 |
| substitute_product_id | uuid fk | 替代商品 |
| substitute_product_name_snapshot | varchar(100) | 替代商品名称快照 |
| unit | varchar(20) | 单位 |
| quantity | numeric(12,3) | 数量 |
| unit_price_snapshot | numeric(12,2) | 替代商品单价 |
| status | substitution_status | 状态 |
| reason | text | 替代理由 |
| customer_decision_by | uuid fk nullable | 饭店确认人 |
| customer_decision_at | timestamptz | 饭店确认时间 |
| created_by | uuid fk | 创建人 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `idx_substitution_requests_order_id`
- `idx_substitution_requests_status`

### 5.11 delivery_receipts

签收记录表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| order_id | uuid fk unique | 订单 |
| delivery_user_id | uuid fk | 配送员 |
| receiver_name | varchar(50) | 签收人 |
| photo_urls | jsonb | 照片 URL 数组 |
| signed_at | timestamptz | 签收时间 |
| created_at | timestamptz | 创建时间 |

约束：

- `receiver_name` 不为空
- `photo_urls` 至少包含 1 张图片
- 每张订单最多 1 条签收记录

索引：

- `idx_delivery_receipts_signed_at`

### 5.12 statements

对账单主表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| statement_no | varchar(40) unique | 对账单号 |
| customer_id | uuid fk | 客户 |
| period_start | date | 周期开始 |
| period_end | date | 周期结束 |
| status | statement_status | 状态 |
| total_amount | numeric(12,2) | 应收金额 |
| paid_amount | numeric(12,2) | 已收金额 |
| balance_amount | numeric(12,2) | 欠款金额 |
| generated_at | timestamptz | 生成时间 |
| issued_at | timestamptz | 出账时间 |
| confirmed_at | timestamptz | 确认时间 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `idx_statements_customer_id`
- `idx_statements_period`
- `idx_statements_status`

约束：

- `balance_amount = total_amount - paid_amount`
- 同一客户同一周期建议只保留一张有效对账单

### 5.13 statement_items

对账单明细表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| statement_id | uuid fk | 对账单 |
| order_id | uuid fk | 订单 |
| delivery_date | date | 送达日期 |
| amount | numeric(12,2) | 订单金额 |
| created_at | timestamptz | 创建时间 |

唯一约束：

- `uniq_statement_items_statement_order(statement_id, order_id)`

索引：

- `idx_statement_items_statement_id`
- `idx_statement_items_order_id`

### 5.14 payments

收款记录表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid pk | 主键 |
| statement_id | uuid fk | 对账单 |
| customer_id | uuid fk | 客户 |
| amount | numeric(12,2) | 收款金额 |
| payment_method | payment_method | 收款方式 |
| paid_at | timestamptz | 收款时间 |
| remark | text | 备注 |
| created_by | uuid fk | 创建人 |
| created_at | timestamptz | 创建时间 |

索引：

- `idx_payments_statement_id`
- `idx_payments_customer_id`
- `idx_payments_paid_at`

---

## 6. 关键业务规则

### 下单与价格

- 饭店端只能选择启用客户、启用商品
- 下单时价格查询优先级：①当日价格（`price_date=当日`）→②沿用最近一次历史价格（`ORDER BY price_date DESC LIMIT 1`，前端标注沿用日期）→③无任何历史定价则该商品不可下单
- 订单明细必须写入价格快照
- 后续修改 `daily_prices` 不影响历史订单

### 截止时间

- 截止时间优先使用客户配置
- 提交订单时写入 `cutoff_time_snapshot`
- 当前时间早于截止时间：允许直接改单
- 当前时间晚于截止时间：只能提交 `change_requests`

### 改单审批

- 有 `pending` 改单请求时，订单状态可设为 `change_pending`
- 审批通过后更新订单明细，并写入变更日志
- 审批拒绝后订单明细不变，并写入变更日志
- 有待审批改单时不允许签收

### 最终发货

- 第一次进入备货/最终发货时，可从 `order_items` 复制生成 `fulfillment_items`
- 缺货、部分发货只修改 `fulfillment_items`
- 原始 `order_items` 尽量不覆盖，保留客户原始需求

### 替代

- V0 可由店内手动记录“已电话/微信确认”
- V1 使用 `substitution_requests` 让饭店端确认或拒绝
- 有 `pending` 替代请求时不允许签收

### 签收

- 签收必须填写签收人
- 签收必须上传至少 1 张照片
- 签收成功后订单状态变为 `delivered`
- 已签收订单原则上不允许再修改最终发货明细，如需调整，走对账调整或管理员特殊操作并留痕

### 对账

- 只统计 `delivered` 订单
- 金额来自 `fulfillment_items`
- 对账单生成接口接收手动传入的 `period_start` / `period_end`，不自动按 `settlement_cycle` 计算周期
- 对账单生成后，保存订单快照到 `statement_items`
- 收款后更新 `paid_amount` 和 `balance_amount`
- 欠款不直接改订单，使用对账单和收款记录体现

---

## 7. API 模块优先级

### 第一批

- 登录
- 客户管理
- 商品管理
- 今日价管理
- 饭店端下单
- 店内订单列表

### 第二批

- 截止前改单
- 截止后改单请求
- 改单审批
- 订单变更日志
- 汇总拣货
- Excel 导出

### 第三批

- 最终发货
- 缺货/部分发货
- 签收照片上传
- 配送签收

### 第四批

- 对账单生成
- 收款记录
- 欠款余额
- 对账单导出/打印

### 第五批

- 替代确认中心
- 消息提醒
- 饭店端对账查看增强

---

## 8. 前端页面优先级

### 店内管理端

第一批：

- 登录页
- 今日看板
- 客户管理
- 商品管理
- 今日价管理
- 订单列表/详情

第二批：

- 汇总拣货
- 最终发货录入
- 配送签收
- 对账单

### 饭店端 H5

第一批：

- 登录/绑定
- 创建订单
- 复制昨日
- 订单详情

第二批：

- 改单请求
- 历史订单
- 对账单查看
- 替代确认

---

## 9. 开发前待确认

### 前端框架

默认建议：

- Vue 3 + TypeScript + Vite + Naive UI

可替代：

- React + TypeScript + Vite + Ant Design

当前建议选择 Vue 3，因为本项目表单、表格、管理页较多，Vue 的开发体验会比较顺。

### 部署方式

需要确认：

- 本地电脑长期运行
- 店内小主机/NAS
- 云服务器

建议：

- 先用云服务器或店内小主机 + Docker Compose

### 登录方式

V0 建议：

- 手机号 + 密码

V1 可增加：

- 微信小程序登录
- 短信验证码登录

### 订单唯一性

需要确认：

- 一个客户一天是否只允许一张订单
- 是否会有上午/下午多批次

V0 建议：

- 一个客户一个送达日期只允许一张有效订单
- 追加需求通过改单或补单请求处理

---

## 10. 下一步开发动作

建议下一步直接初始化代码项目：

1. 创建 `backend/` FastAPI 项目
2. 创建 `frontend/` Vue 3 项目
3. 创建 `docker-compose.yml`
4. 配置 PostgreSQL
5. 建立 Alembic 迁移
6. 先实现枚举和基础表：customers、users、products、daily_prices
7. 实现登录和基础管理页面
