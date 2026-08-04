#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_ARGS=(
    --project-name yusi-frontend
    --file "$SCRIPT_DIR/docker-compose.yml"
)
SERVICE_NAME="yusi-front"
IMAGE_NAME="yusi-front:latest"
RUN_GIT_PULL=1
NO_CACHE="${DOCKER_BUILD_NO_CACHE:-0}"
ENV_FILE="${FRONTEND_ENV_FILE:-}"

usage() {
    cat <<'EOF'
用法:
  ./rebuild.sh [选项]

选项:
  --docker-only, --skip-pull  跳过 git pull，直接使用当前前端代码构建 Docker 镜像
  --no-cache                 禁用 Docker 构建缓存
  --env-file PATH            指定 Docker Compose 环境文件；默认使用 frontend/.env（如果存在）
  -h, --help                显示帮助

示例:
  ./rebuild.sh
  ./rebuild.sh --docker-only
  ./rebuild.sh --no-cache --env-file .env.production
EOF
}

while (($# > 0)); do
    case "$1" in
        --docker-only|--skip-pull)
            RUN_GIT_PULL=0
            ;;
        --no-cache)
            NO_CACHE=1
            ;;
        --env-file)
            if (($# < 2)); then
                echo "--env-file 需要一个路径" >&2
                usage >&2
                exit 2
            fi
            ENV_FILE="$2"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "未知选项: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
    shift
done

if ! command -v docker >/dev/null 2>&1; then
    echo "未找到 docker，请先安装 Docker Engine 和 Compose 插件。" >&2
    exit 1
fi

if [[ -z "$ENV_FILE" && -f "$SCRIPT_DIR/.env" ]]; then
    ENV_FILE="$SCRIPT_DIR/.env"
fi

if [[ -n "$ENV_FILE" ]]; then
    if [[ "$ENV_FILE" != /* ]]; then
        ENV_FILE="$SCRIPT_DIR/$ENV_FILE"
    fi
    if [[ ! -f "$ENV_FILE" ]]; then
        echo "Compose 环境文件不存在: $ENV_FILE" >&2
        exit 1
    fi
    COMPOSE_ARGS+=(--env-file "$ENV_FILE")
fi

if (( RUN_GIT_PULL )); then
    echo "拉取前端最新代码..."
    git pull --ff-only
else
    echo "Docker-only 模式：跳过 git pull，使用当前前端代码。"
fi

echo "构建前端 Docker 镜像..."

# 只记录当前项目的旧镜像，不清理其他项目的 Docker 资源。
OLD_IMAGE_ID="$(docker image inspect "$IMAGE_NAME" --format '{{.Id}}' 2>/dev/null || true)"

BUILD_ARGS=()
if [[ "$NO_CACHE" == "1" ]]; then
    BUILD_ARGS+=(--no-cache)
fi

if ! DOCKER_BUILDKIT=1 docker compose "${COMPOSE_ARGS[@]}" build "${BUILD_ARGS[@]}" "$SERVICE_NAME"; then
    echo "前端 Docker 构建失败。" >&2
    exit 1
fi

echo "前端 Docker 构建成功，重启服务..."
docker compose "${COMPOSE_ARGS[@]}" up -d --force-recreate --remove-orphans "$SERVICE_NAME"

NEW_IMAGE_ID="$(docker image inspect "$IMAGE_NAME" --format '{{.Id}}')"
if [[ -n "$OLD_IMAGE_ID" && "$OLD_IMAGE_ID" != "$NEW_IMAGE_ID" ]]; then
    echo "移除上一版 yusi-front 镜像: $OLD_IMAGE_ID"
    if ! docker image rm "$OLD_IMAGE_ID"; then
        echo "上一版镜像仍被其他容器引用，保留不删除。"
    fi
fi

echo "前端部署完成。"
