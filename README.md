# 应急物资调配管理平台

## 项目简介

区应急管理局应急物资调配管理平台，用于管理全区多个仓库的应急物资储备和调拨情况。

## 技术栈

- **后端**: Python FastAPI + SQLite
- **前端**: React + TypeScript + Vite + Ant Design
- **部署**: Docker Compose

## 功能模块

### 后端（端口 8459）

1. **仓库管理** - 管理全区5个应急物资仓库
2. **物资台账** - 录入物资信息，支持批量导入CSV
3. **出入库管理** - 入库/出库操作，自动更新库存
4. **调拨管理** - 跨仓库调拨，带审批流程
5. **预警管理** - 库存不足、临期、过期预警
6. **统计接口** - 各类统计数据

### 前端（端口 5173）

1. **物资总览仪表盘** - 库存占用率、类别分布、总值统计
2. **物资台账** - 物资列表、新增/编辑、批量导入
3. **出入库管理** - 出入库单列表、步骤表单新建
4. **调拨管理** - 调拨单列表、发起调拨、审批操作
5. **预警中心** - 预警列表、一键处理

## 快速启动

### 方式一：Docker Compose（推荐）

```bash
# 克隆项目后，在项目根目录执行
docker-compose up -d --build

# 访问前端: http://localhost:5173
# 访问后端API文档: http://localhost:8459/docs
```

### 方式二：本地开发

#### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 初始化数据
python init_data.py

# 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8459 --reload
```

#### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## API 文档

启动后端服务后访问: `http://localhost:8459/docs`

## 项目结构

```
.
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── core/           # 核心配置（数据库）
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic 模式
│   │   ├── routers/        # API 路由
│   │   └── main.py         # 主应用
│   ├── init_data.py        # 初始化数据脚本
│   ├── requirements.txt    # Python 依赖
│   └── Dockerfile          # 后端 Dockerfile
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型
│   │   ├── App.tsx         # 主应用组件
│   │   └── main.tsx        # 入口文件
│   ├── nginx.conf          # Nginx 配置
│   ├── package.json        # Node 依赖
│   └── Dockerfile          # 前端 Dockerfile
└── docker-compose.yml      # Docker Compose 配置
```

## 物资类别

- 防汛类 (FX)
- 抗震类 (KZ)
- 消防类 (XF)
- 医疗类 (YL)
- 生活保障类 (SH)
- 通信类 (TX)

## 调拨状态流程

1. 待审批 (pending) - 新创建的调拨单
2. 已审批 (approved) - 审批通过
3. 已出库 (out_confirmed) - 调出仓库确认出库
4. 已完成 (completed) - 调入仓库确认入库

## 预警类型

- 🔴 严重 (danger) - 物资已过期
- 🟠 警告 (warning) - 库存低于安全量
- 🟡 注意 (caution) - 物资90天内过期
