# 文件与目录结构 (File & Directory Structure) - 智慧环监在线学习平台

## 1. 文档目的

本文档旨在定义“智慧环监在线学习平台”项目的标准化源代码和文档的目录结构。一个清晰、一致的结构是确保代码可维护性、团队协作效率和项目长期健康发展的基石。

## 2. 顶层目录结构

项目根目录采用“Monorepo”布局，将不同的关注点分离到独立的顶层目录中。
ecomonitor-pro-platform/
├── .github/                # CI/CD 与 GitHub 相关配置
│   └── workflows/
│       └── deploy.yml      # 自动化部署流水线配置
├── docs/                   # 所有产品与架构相关的文档
│   ├── PRD.md
│   ├── Roadmap.md
│   ├── User_Story_Map.md
│   ├── Metrics_Framework.md
│   ├── Architecture.md
│   └── File_Structure.md   # 本文档
├── client/                 # 前端应用 (React/Vue SPA)
│   └── ...                 # (详见 3. 前端应用目录结构)
├── server/                 # 后端API服务 (Node.js/NestJS)
│   └── ...                 # (详见 4. 后端服务目录结构)
├── .gitignore              # Git 忽略文件配置
├── docker-compose.yml      # 用于本地开发环境一键启动 (启动前后端服务及数据库)
├── Dockerfile.client       # 用于构建前端Docker镜像
├── Dockerfile.server       # 用于构建后端Docker镜像
└── README.md               # 项目总述、安装与启动指南
---

## 3. 前端应用 (`client/`) 目录结构

前端采用“功能切片 (Feature-Sliced)”的设计模式，将相关功能（组件、逻辑、状态）组织在一起，便于开发和维护。
client/
├── public/                 # 静态资源，会被直接复制到构建输出目录
│   ├── index.html          # 应用HTML入口文件
│   └── favicon.ico         # 网站图标
├── src/                    # 前端源代码
│   ├── assets/             # 静态资源，如图片、字体、全局CSS
│   │   ├── images/
│   │   └── styles/
│   │       └── global.css
│   ├── components/         # 全局共享的UI组件
│   │   ├── common/         # 基础原子组件 (Button, Input, Modal, Spinner...)
│   │   └── layout/         # 页面布局组件 (Header, Sidebar, PageWrapper...)
│   ├── features/           # 核心功能模块目录
│   │   ├── auth/           # 认证功能 (登录、注册页面及逻辑)
│   │   ├── courses/        # 课程功能 (课程列表、详情、学习界面)
│   │   ├── assignments/    # 作业功能 (作业提交、查看)
│   │   └── teacher-dashboard/ # 教师仪表盘 (学情分析、课程管理)
│   ├── hooks/              # 自定义的可复用React Hooks
│   ├── lib/                # 第三方库配置或封装 (如 axios 实例)
│   ├── pages/              # 页面级组件，组合features和components
│   ├── store/              # 全局状态管理 (Redux/Pinia)
│   ├── types/              # 全局TypeScript类型定义
│   ├── App.tsx             # 应用根组件，负责路由
│   └── main.tsx            # 应用入口文件
├── .eslintrc.js            # ESLint 配置文件
├── package.json            # 项目依赖与脚本配置
├── tsconfig.json           # TypeScript 配置文件
└── vite.config.ts          # Vite (构建工具) 配置文件
---

## 4. 后端服务 (`server/`) 目录结构

后端采用基于 **NestJS** 框架的模块化结构，每个业务领域都是一个独立的模块。
server/
├── src/                    # 后端源代码
│   ├── app.module.ts       # 应用根模块
│   ├── main.ts             # 应用入口文件，启动HTTP服务
│   ├── modules/            # 核心业务模块目录
│   │   ├── auth/           # 认证与授权模块 (Controller, Service, JWT Strategy...)
│   │   ├── users/          # 用户与班级管理模块
│   │   ├── courses/        # 课程、章节、活页资源管理模块
│   │   ├── submissions/    # 作业提交与批阅模块
│   │   └── analytics/      # 学情数据分析与报告模块
│   ├── config/             # 应用配置模块 (环境变量、数据库配置等)
│   ├── database/           # 数据库相关 (ORM配置、迁移脚本、种子数据)
│   └── shared/             # 跨模块共享的工具、DTOs、装饰器等
├── test/                   # 自动化测试 (单元测试、端到端测试)
│   ├── app.e2e-spec.ts
│   └── **/*.spec.ts
├── .eslintrc.js            # ESLint 配置文件
├── nest-cli.json           # NestJS CLI 配置文件
├── package.json            # 项目依赖与脚本配置
└── tsconfig.json           # TypeScript 配置文件
---

## 5. 结构设计原则

1.  **关注点分离 (Separation of Concerns):** `client`, `server`, `docs` 各司其职，互不干扰。
2.  **模块化 (Modularity):** 在前端和后端内部，都按功能领域（Feature/Module）划分代码，降低耦合度。
3.  **约定优于配置 (Convention over Configuration):** 遵循所选框架（React/NestJS）的最佳实践和社区约定，降低新成员的上手难度。
4.  **易于开发与部署 (Dev & Deploy Friendly):** 通过 `docker-compose.yml` 简化本地开发环境的搭建；通过 `Dockerfile` 和 `.github/workflows` 实现部署流程的标准化和自动化。