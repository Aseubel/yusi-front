# --- 第一阶段：构建阶段 ---
FROM node:22-alpine as build-stage

WORKDIR /app

# 优先复制依赖描述文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 增加 --ignore-scripts 参数避免 husky 报错
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm install --frozen-lockfile --ignore-scripts

# 复制源代码
COPY . .

# 执行构建
RUN pnpm run build

# --- 第二阶段：生产阶段 ---
FROM nginx:stable-alpine as production-stage

# 安装 envsubst (用于 nginx 配置模板替换)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && apk add --no-cache gettext

# 复制构建产物
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制 nginx 配置模板
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY nginx.conf /etc/nginx/nginx.conf

# 复制 entrypoint 脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
