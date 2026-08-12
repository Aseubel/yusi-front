#!/bin/sh
set -e

# ========== 高德地图配置 ==========
# AMAP_JS_KEY: JS API Key (用于加载地图SDK)
# AMAP_SECURITY_CODE: 安全密钥 (用于代理转发)

# 1. 注入 JS API Key 到前端代码
if [ -n "$AMAP_JS_KEY" ]; then
    echo "Injecting AMAP_JS_KEY into frontend assets..."
    find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s/__AMAP_JS_KEY__/${AMAP_JS_KEY}/g" {} \;
    echo "Done."
else
    echo "Warning: AMAP_JS_KEY not set, map features may not work."
fi

# 2. 注入安全密钥到前端代码 (用于 serviceHost 配置)
if [ -n "$AMAP_SECURITY_CODE" ]; then
    echo "Injecting AMAP_SECURITY_CODE into frontend assets..."
    find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s/__AMAP_SECURITY_CODE__/${AMAP_SECURITY_CODE}/g" {} \;
    echo "Done."
fi

# 3. 每次启动都从挂载模板生成实际配置。
# 只替换应用环境变量，保留 $host、$args 等 Nginx 运行时变量。
echo "Configuring Nginx from template..."
envsubst '${AMAP_SECURITY_CODE}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
echo "Done."

# 启动 nginx
exec nginx -g 'daemon off;'
