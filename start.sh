#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  尘起时刻 — 一键启动脚本
#  用法: ./start.sh
#  停止: ./stop.sh
# ═══════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"
LOG_DIR="$SCRIPT_DIR/logs"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PID_DIR" "$LOG_DIR"

# ── 检查端口 ──
check_port() {
    local port=$1
    if lsof -i:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ 端口 $port 已被占用，尝试释放...${NC}"
        lsof -i:$port -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# ── 安装依赖 ──
echo -e "${YELLOW}📦 检查依赖...${NC}"

cd "$SCRIPT_DIR/server"
if [ ! -d "node_modules" ]; then
    echo "  安装服务端依赖..."
    npm install
fi

cd "$SCRIPT_DIR/client"
if [ ! -d "node_modules" ]; then
    echo "  安装客户端依赖..."
    npm install
fi

echo -e "${GREEN}✓ 依赖就绪${NC}"

# ── 启动服务端 ──
SERVER_PORT=3001
check_port $SERVER_PORT

echo -e "${YELLOW}🚀 启动服务端 (端口 $SERVER_PORT)...${NC}"
cd "$SCRIPT_DIR/server"
# 确保 tsx 可用（从 node_modules 解析）
if [ ! -f "node_modules/.bin/tsx" ]; then
    echo "  安装 tsx..."
    npm install
fi
nohup node_modules/.bin/tsx src/index.ts > "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_DIR/server.pid"
echo -e "${GREEN}✓ 服务端 PID: $SERVER_PID${NC}"

# ── 启动客户端 ──
CLIENT_PORT=5173
check_port $CLIENT_PORT

echo -e "${YELLOW}🎨 启动前端 (端口 $CLIENT_PORT)...${NC}"
cd "$SCRIPT_DIR/client"
# 确保 vite 可用（从 node_modules 解析）
if [ ! -f "node_modules/.bin/vite" ]; then
    echo "  安装 vite..."
    npm install
fi
nohup node_modules/.bin/vite --host 0.0.0.0 > "$LOG_DIR/client.log" 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > "$PID_DIR/client.pid"
echo -e "${GREEN}✓ 前端 PID: $CLIENT_PID${NC}"

# ── 等待服务就绪 ──
echo ""
echo -e "${YELLOW}⏳ 等待服务就绪...${NC}"

# 快速失败检测函数
check_process() {
    local pid=$1
    local name=$2
    local log_file=$3
    sleep 1
    if ! kill -0 "$pid" 2>/dev/null; then
        echo -e "${RED}✗ $name 进程已退出，以下是最新日志:${NC}"
        echo "──────────────────────────────────────"
        cat "$log_file" 2>/dev/null || echo "(日志为空)"
        echo "──────────────────────────────────────"
        return 1
    fi
    return 0
}

# 检查服务端
check_process $SERVER_PID "服务端" "$LOG_DIR/server.log" || exit 1

# 检查前端
check_process $CLIENT_PID "前端" "$LOG_DIR/client.log" || exit 1

# 等待服务端 HTTP 就绪（最多 10 秒）
SERVER_OK=false
for i in {1..10}; do
    if curl -s http://localhost:$SERVER_PORT/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 服务端就绪: http://localhost:$SERVER_PORT${NC}"
        SERVER_OK=true
        break
    fi
    sleep 1
done
if [ "$SERVER_OK" = false ]; then
    echo -e "${RED}✗ 服务端 HTTP 未就绪，以下是最新日志:${NC}"
    echo "──────────────────────────────────────"
    tail -20 "$LOG_DIR/server.log" 2>/dev/null || echo "(日志为空)"
    echo "──────────────────────────────────────"
    exit 1
fi

# 等待前端 HTTP 就绪（最多 10 秒）
CLIENT_OK=false
for i in {1..10}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$CLIENT_PORT 2>/dev/null | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ 前端就绪: http://localhost:$CLIENT_PORT${NC}"
        CLIENT_OK=true
        break
    fi
    sleep 1
done
if [ "$CLIENT_OK" = false ]; then
    echo -e "${RED}✗ 前端 HTTP 未就绪，以下是最新日志:${NC}"
    echo "──────────────────────────────────────"
    tail -20 "$LOG_DIR/client.log" 2>/dev/null || echo "(日志为空)"
    echo "──────────────────────────────────────"
    exit 1
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  尘起时刻 已启动！${NC}"
echo -e "${GREEN}  前端: http://localhost:$CLIENT_PORT${NC}"
echo -e "${GREEN}  后端: http://localhost:$SERVER_PORT${NC}"
echo -e "${GREEN}  日志: $LOG_DIR/${NC}"
echo -e "${GREEN}  停止: ./stop.sh${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"