# 蔬果店订单配送对账系统

MVP 技术栈：

- 后端：Python + FastAPI + SQLAlchemy + Alembic
- 数据库：PostgreSQL
- 前端：Vue 3 + TypeScript + Vite + Naive UI
- 部署：Docker Compose

## 目录

```text
backend/   FastAPI API 服务
frontend/  Vue 管理端 / 饭店端 H5
docs/      需求与设计文档后续可归档到这里
```

## 本地开发

后端：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

前端：

```powershell
cd frontend
npm install
npm run dev
```

Docker：

```powershell
docker compose up --build
```

