# Yusi Frontend - 灵魂叙事

A modern React frontend application for Yusi - an AI-powered social platform that creates "情景室" (Situation Rooms) for personality analysis and encrypted diary features.

## 🚀 Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with Rolldown (next-generation bundler)
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **UI Components**: Custom components with Radix UI primitives
- **HTTP Client**: Axios with interceptors
- **Notifications**: Sonner (toast notifications)
- **Icons**: Lucide React

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm 11+

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE=http://localhost:20611
```

> **Note**: 高德地图 API Key 无需在前端配置，通过后端代理调用。生产部署时通过 Docker 环境变量 `AMAP_JS_KEY` 注入（用于前端地图展示）。

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Textarea, etc.)
│   ├── room/           # Room-specific components
│   └── Diary.tsx       # Diary component
├── pages/               # Page components
│   ├── Home.tsx        # Landing page
│   ├── Room.tsx        # Dynamic room page
│   └── Diary.tsx       # Diary page
├── lib/                 # Utility libraries and API functions
│   ├── api.ts          # Axios instance with interceptors
│   ├── room.ts         # Room API functions and types
│   └── index.ts        # Barrel exports
├── utils/               # Utility functions
│   └── index.ts        # Character counting and other utilities
├── hooks/               # Custom React hooks
├── stores/               # Zustand state management
└── main.tsx             # Application entry point
```

## 🎯 Features

### 1. 情景室 (Situation Room)
- **Room Creation**: Create a room with custom member limit (2-8 people)
- **Room Joining**: Join existing rooms using invitation codes
- **Narrative Submission**: Submit personal narratives with 1000-character limit
- **AI Analysis**: Real-time personality analysis and compatibility reports
- **Room Status**: Visual indicators for room states (Waiting, In Progress, Completed)

### 2. AI Diary
- **Encrypted Storage**:
  - DEFAULT：服务端使用 AES-256-GCM 加密落库，客户端无需解锁密钥
  - CUSTOM：客户端 WebCrypto(AES-256-GCM) 端到端加密，服务端仅存储密文
- **Rich Text Editor**: Full-featured text area for diary writing
- **Privacy Protection**: Local user ID management for data isolation

### 3. Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: Toast notifications for user feedback
- **Character Counting**: Real-time character limit feedback

### 4. Epic 5: 时空足迹 (Spatial Narrative)
- **LocationPicker**: 日记写作时添加地理位置（自动定位 + POI 搜索）
- **LocationManager**: 设置页面管理常用/重要地点
- **FootprintMap**: `/footprints` 路由，地图/列表视图展示日记足迹，支持时间过滤

## 🔧 API Integration

The frontend communicates with the backend through a RESTful API:

- **Base URL**: Configurable via environment variables
- **Error Handling**: Global axios interceptors for consistent error messaging
- **Endpoints**:
  - `POST /api/rooms` - Create new room
  - `POST /api/rooms/{code}/join` - Join existing room
  - `POST /api/rooms/{code}/submit` - Submit narrative
  - `GET /api/rooms/{code}/report` - Get AI analysis report

## 🚀 Build Configuration

### Vite Configuration
- **Proxy Setup**: `/api` routes proxied to backend (port 20611)
- **Development Server**: Port 5174 with hot module replacement
- **Production Build**: Optimized bundle with code splitting

### TypeScript Configuration
- **Strict Mode**: Enabled for type safety
- **Path Aliases**: `@` points to `src` directory
- **Modern Target**: ES2020+ features

### PostCSS Configuration
- **Tailwind CSS**: Using new `@tailwindcss/postcss` plugin
- **Autoprefixer**: Automatic vendor prefixing

## 🎨 Styling Guidelines

- **Tailwind CSS**: Utility-first approach
- **Color Palette**: Modern, clean design with consistent spacing
- **Responsive Breakpoints**: Mobile-first design strategy
- **Component Architecture**: Small, focused components (< 200 lines)

## 🔒 Security Features

- **Local Storage**: User ID stored locally for session management
- **Key Modes**:
  - DEFAULT：不向前端下发服务端密钥；密钥由后端环境变量管理
  - CUSTOM（无备份）：密钥仅在客户端，忘记密码无法恢复
  - CUSTOM（有备份）：客户端使用后端提供的 RSA 公钥加密“数据密钥”上传，网络不传明文密钥
- **API Communication**: Secure HTTP-only cookies for authentication
- **Input Validation**: Client-side validation with server-side verification

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **ES2020+ Features**: Async/await, optional chaining, nullish coalescing
- **CSS Grid/Flexbox**: Modern layout techniques

## 🧪 Development Commands

```bash
# Development with hot reload
pnpm run dev

# Type checking
pnpm run check

# Production build
pnpm run build

# Preview production build
pnpm run preview

# Linting (if configured)
pnpm run lint
```

---

## 🐳 Docker 部署

### 构建镜像
```bash
docker-compose build
```

### 运行容器
```bash
# 设置高德地图配置
export AMAP_JS_KEY=your_amap_js_key           # JS API Key
export AMAP_SECURITY_CODE=your_security_code  # 安全密钥

# 启动
docker-compose up -d
```

或通过 `.env` 文件：
```bash
cat > .env << EOF
AMAP_JS_KEY=your_js_key
AMAP_SECURITY_CODE=your_security_code
EOF
docker-compose up -d
```

### 高德地图安全配置说明

本项目采用**高德官方推荐的安全代理方式**：

1. **AMAP_JS_KEY**: JS API Key，用于加载地图 SDK
2. **AMAP_SECURITY_CODE**: 安全密钥，通过 Nginx 代理附加到请求中，不暴露在前端

Nginx 会在 `/_AMapService/` 路径下自动将安全密钥附加到请求参数中，前端代码只需配置 `serviceHost` 即可。

参考文档: https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode

### 文件说明
| 文件 | 说明 |
|------|------|
| `Dockerfile` | 多阶段构建，生产环境用 Nginx |
| `docker-compose.yml` | 容器编排，支持环境变量注入 |
| `nginx.conf` | Nginx 配置，包含高德安全代理 |
| `entrypoint.sh` | 运行时注入环境变量到 JS 和 Nginx |


## 🤝 Contributing

1. Follow the existing code style and conventions
2. Keep components small and focused
3. Use TypeScript for type safety
4. Test your changes thoroughly
5. Update documentation as needed

## 📄 License

This project is part of the Yusi platform and follows the same licensing terms.
