# Magic Club Web

Magic Club - 魔术社团管理系统前端

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite
- Pinia
- Element Plus
- Vue Router
- Axios
- Day.js

## 项目结构

```
src/
├── api/           # API 接口封装
├── assets/        # 静态资源
├── components/    # 公共组件
├── layouts/       # 布局组件
├── router/        # 路由配置
├── stores/        # Pinia 状态管理
├── utils/         # 工具函数
├── views/         # 页面组件
├── App.vue
└── main.ts
```

## 安装依赖

```bash
npm install
```

## 开发启动

```bash
npm run dev
```

## 生产构建

```bash
npm run build
```

## 接口配置

在 `.env` 文件中配置后端接口地址：

```
VITE_API_BASE_URL=http://localhost:8080
```

## 功能模块

- 用户模块：登录、注册、个人信息管理、毕业成员列表
- 论坛模块：帖子发布、回复、点赞、置顶精华
- 资源模块：文件上传、下载、分类管理
- 纪念墙模块：按毕业年份展示校友信息
