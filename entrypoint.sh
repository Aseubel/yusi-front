#!/bin/sh
set -e

# 替换 JS 文件中的占位符为实际环境变量值
# AMAP_JS_KEY: 高德地图 JS API Key

if [ -n "$AMAP_JS_KEY" ]; then
    echo "Injecting AMAP_JS_KEY into frontend assets..."
    find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s/__AMAP_JS_KEY__/${AMAP_JS_KEY}/g" {} \;
    echo "Done."
else
    echo "Warning: AMAP_JS_KEY not set, map features may not work."
fi

# 启动 nginx
exec nginx -g 'daemon off;'
