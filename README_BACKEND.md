# 宝龙口腔系统 - 后端API文档

## 快速开始

### 1. Supabase设置

访问 [https://supabase.com](https://supabase.com) 创建新项目：

1. 注册/登录Supabase
2. 创建新项目（New Project）
3. 等待项目初始化完成
4. 进入项目设置（Settings > API）
5. 复制以下信息：
   - `Project URL`
   - `anon public` key

### 2. 创建数据库表

1. 打开Supabase项目的SQL Editor
2. 运行 `server/database/schema.sql` 文件中的SQL语句
3. 确认所有表创建成功

### 3. 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，填入你的Supabase凭证：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
NODE_ENV=development
```

### 4. 安装依赖并启动

```bash
npm install
npm start
```

服务器将运行在 `http://localhost:3000`

## API端点

### 患者管理 (`/api/patients`)

#### 获取所有患者
```
GET /api/patients
Response: { success: true, data: [...] }
```

#### 获取单个患者及诊疗记录
```
GET /api/patients/:id
Response: { success: true, data: { ...patient, records: [...] } }
```

#### 创建患者
```
POST /api/patients
Body: {
  name: string,
  phone: string,
  card_number?: string,
  age?: string,
  gender?: '男' | '女',
  avatar?: string
}
```

#### 更新患者
```
PUT /api/patients/:id
Body: { ...更新字段 }
```

#### 删除患者
```
DELETE /api/patients/:id
```

---

### 诊疗记录 (`/api/treatments`)

#### 获取患者的诊疗记录
```
GET /api/treatments/patient/:patientId
```

#### 获取日期范围内的记录
```
GET /api/treatments/date-range?startDate=2026-01-01&endDate=2026-01-31
```

#### 创建诊疗记录
```
POST /api/treatments
Body: {
  patient_id: uuid,
  visit_date: date,
  visit_time: time,
  treatment_type: '初诊' | '复诊',
  tooth_position?: string,
  description: string,
  status: '待检查' | '已完成' | '进行中' | '预约',
  image_url?: string
}
```

#### 更新/删除诊疗记录
```
PUT /api/treatments/:id
DELETE /api/treatments/:id
```

---

### 预约管理 (`/api/appointments`)

#### 获取预约列表
```
GET /api/appointments
GET /api/appointments?date=2026-02-08  # 指定日期
```

#### 创建/更新/删除预约
```
POST /api/appointments
PUT /api/appointments/:id
DELETE /api/appointments/:id
```

---

### 医疗物资 (`/api/medicines`)

#### 获取物资列表
```
GET /api/medicines
GET /api/medicines?status=expired  # 筛选过期
GET /api/medicines?status=warning  # 筛选临期
```

#### 创建物资（自动计算状态）
```
POST /api/medicines
Body: {
  name: string,
  brand: string,
  category: '麻醉' | '填充' | '消毒' | '耗材' | '其他',
  expiry_date: date,
  stock: number,
  unit: string,
  min_stock: number
}
```

---

### 采购清单 (`/api/shopping`)

#### 获取/创建/更新采购项
```
GET /api/shopping
POST /api/shopping
PUT /api/shopping/:id
DELETE /api/shopping/:id
```

#### 批量标记已购买
```
POST /api/shopping/batch-bought
Body: { ids: [uuid, uuid, ...] }
```

## 数据模型

### 患者 (patients)
- `id`: UUID
- `name`: 姓名
- `phone`: 电话
- `card_number`: 排队卡号
- `age`: 年龄
- `gender`: 性别
- `avatar`: 头像URL

### 诊疗记录 (treatment_records)
- `id`: UUID
- `patient_id`: 患者ID
- `visit_date`: 就诊日期
- `visit_time`: 就诊时间
- `treatment_type`: 初诊/复诊
- `tooth_position`: 牙位
- `description`: 诊疗描述
- `status`: 状态
- `image_url`: 图片

### 其他表结构见 `schema.sql`

## 开发提示

- 所有API响应格式：`{ success: boolean, data?: any, error?: string }`
- 使用UUID作为主键
- 自动时间戳（created_at, updated_at）
- 药品状态自动计算（根据过期日期）
