# --- 第一阶段：构建阶段 ---
FROM node:22-alpine as build-stage

WORKDIR /app

# 优先复制依赖描述文件
COPY package*.json ./

# 增加 --ignore-scripts 参数避免 husky 报错
RUN npm install --ignore-scripts

# 复制源代码
COPY . .

# 执行构建
RUN npm run build

# --- 第二阶段：生产阶段 ---
FROM nginx:stable-alpine as production-stage

# 复制构建产物
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# 复制 entrypoint 脚本用于运行时注入环境变量
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

# 使用 entrypoint 而非直接启动 nginx
ENTRYPOINT ["/entrypoint.sh"]