#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_PROJECT_NAME="yusi-frontend"
COMPOSE_ARGS=(
    --project-name "$COMPOSE_PROJECT_NAME"
    --file "$SCRIPT_DIR/docker-compose.yml"
)
SERVICE_NAME="yusi-front"
CONTAINER_NAME="yusi-front"
IMAGE_NAME="yusi-front:latest"
RUN_GIT_PULL=1
NO_CACHE="${DOCKER_BUILD_NO_CACHE:-0}"
PRUNE_DOCKER_CACHE="${DOCKER_PRUNE_BUILD_CACHE:-1}"
MIN_FREE_GIB="${DOCKER_MIN_FREE_GIB:-2}"
ENV_FILE="${FRONTEND_ENV_FILE:-}"

usage() {
    cat <<'EOF'
用法:
  ./rebuild.sh [选项]

选项:
  --docker-only, --skip-pull  跳过 git pull，直接使用当前前端代码构建 Docker 镜像
  --no-cache                 禁用 Docker 构建缓存
  --no-prune                 保留未使用的 Docker 构建缓存和悬空镜像
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
        --no-prune)
            PRUNE_DOCKER_CACHE=0
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

prune_docker_build_cache() {
    if [[ "$PRUNE_DOCKER_CACHE" != "1" ]]; then
        return 0
    fi

    # 只回收未使用的 BuildKit 缓存和悬空镜像，不影响运行中的容器、卷或已被容器引用的镜像。
    echo "回收未使用的 Docker 构建缓存..."
    docker builder prune --all --force || true
    docker image prune --force || true
}

check_docker_disk_space() {
    local docker_root free_kib required_kib

    docker_root="$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || printf '/var/lib/docker')"
    free_kib="$(df -Pk "$docker_root" | awk 'NR == 2 { print $4 }')"
    required_kib=$((MIN_FREE_GIB * 1024 * 1024))

    if [[ -z "$free_kib" || ! "$free_kib" =~ ^[0-9]+$ ]]; then
        echo "无法读取 Docker 所在磁盘的剩余空间: $docker_root" >&2
        exit 1
    fi

    if (( free_kib < required_kib )); then
        echo "Docker 所在磁盘剩余空间不足: $((free_kib / 1024)) MiB，可用至少 ${MIN_FREE_GIB} GiB。" >&2
        echo "请先检查 docker system df -v 和 df -h，再清理无用镜像/日志或扩容磁盘。" >&2
        exit 1
    fi
}

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

remove_conflicting_named_container() {
    local existing_id existing_project existing_service

    existing_id="$(docker container inspect --format '{{.Id}}' "$CONTAINER_NAME" 2>/dev/null || true)"
    if [[ -z "$existing_id" ]]; then
        return 0
    fi

    existing_project="$(docker container inspect \
        --format '{{ index .Config.Labels "com.docker.compose.project" }}' \
        "$CONTAINER_NAME" 2>/dev/null || true)"
    existing_service="$(docker container inspect \
        --format '{{ index .Config.Labels "com.docker.compose.service" }}' \
        "$CONTAINER_NAME" 2>/dev/null || true)"

    if [[ "$existing_project" == "$COMPOSE_PROJECT_NAME" && "$existing_service" == "$SERVICE_NAME" ]]; then
        return 0
    fi

    echo "发现未由当前 Compose 项目管理的容器 $CONTAINER_NAME（project=$existing_project, service=$existing_service），移除后重新创建。"
    if ! docker container rm --force "$CONTAINER_NAME"; then
        echo "无法移除冲突容器 $CONTAINER_NAME，请手动处理后重试。" >&2
        exit 1
    fi
}

if (( RUN_GIT_PULL )); then
    echo "拉取前端最新代码..."
    git pull --ff-only
else
    echo "Docker-only 模式：跳过 git pull，使用当前前端代码。"
fi

echo "构建前端 Docker 镜像..."

# 小磁盘部署机上，失败构建留下的中间层会持续增长；清理只针对未使用资源。
prune_docker_build_cache
check_docker_disk_space

# 只记录当前项目的旧镜像，不清理其他项目的 Docker 资源。
OLD_IMAGE_ID="$(docker image inspect "$IMAGE_NAME" --format '{{.Id}}' 2>/dev/null || true)"

BUILD_ARGS=()
if [[ "$NO_CACHE" == "1" ]]; then
    BUILD_ARGS+=(--no-cache)
fi

if ! DOCKER_BUILDKIT=1 docker compose "${COMPOSE_ARGS[@]}" build "${BUILD_ARGS[@]}" "$SERVICE_NAME"; then
    prune_docker_build_cache
    echo "前端 Docker 构建失败。" >&2
    exit 1
fi

echo "前端 Docker 构建成功，重启服务..."
remove_conflicting_named_container
docker compose "${COMPOSE_ARGS[@]}" up -d --force-recreate --remove-orphans "$SERVICE_NAME"

NEW_IMAGE_ID="$(docker image inspect "$IMAGE_NAME" --format '{{.Id}}')"
if [[ -n "$OLD_IMAGE_ID" && "$OLD_IMAGE_ID" != "$NEW_IMAGE_ID" ]]; then
    echo "移除上一版 yusi-front 镜像: $OLD_IMAGE_ID"
    if ! docker image rm "$OLD_IMAGE_ID"; then
        echo "上一版镜像仍被其他容器引用，保留不删除。"
    fi
fi

prune_docker_build_cache

echo "前端部署完成。"
