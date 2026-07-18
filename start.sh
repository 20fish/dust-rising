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
        echo -e "${YELLOW}⚠ 端口 $port 已被占用${NC}"
        return 1
    fi
    return 0
}

# ── 安装依赖 ──
echo -e "${YELLOW}📦 检查依赖...${NC}"

if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
    echo "  安装服务端依赖..."
    cd "$SCRIPT_DIR/server" && npm install
fi

if [ ! -d "$SCRIPT_DIR/client/node_modules" ]; then
    echo "  安装客户端依赖..."
    cd "$SCRIPT_DIR/client" && npm install
fi

echo -e "${GREEN}✓ 依赖就绪${NC}"

# ── 启动服务端 ──
SERVER_PORT=3001
if check_port $SERVER_PORT; then
    echo -e "${YELLOW}🚀 启动服务端 (端口 $SERVER_PORT)...${NC}"
    cd "$SCRIPT_DIR/server"
    nohup npx tsx src/index.ts > "$LOG_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > "$PID_DIR/server.pid"
    echo -e "${GREEN}✓ 服务端 PID: $SERVER_PID${NC}"
else
    echo -e "${YELLOW}  服务端已在运行，跳过${NC}"
fi

# ── 启动客户端 ──
CLIENT_PORT=5173
if check_port $CLIENT_PORT; then
    echo -e "${YELLOW}🎨 启动前端 (端口 $CLIENT_PORT)...${NC}"
    cd "$SCRIPT_DIR/client"
    nohup npx vite --host 0.0.0.0 > "$LOG_DIR/client.log" 2>&1 &
    CLIENT_PID=$!
    echo $CLIENT_PID > "$PID_DIR/client.pid"
    echo -e "${GREEN}✓ 前端 PID: $CLIENT_PID${NC}"
else
    echo -e "${YELLOW}  前端已在运行，跳过${NC}"
fi

# ── 等待启动 ──
echo ""
echo -e "${YELLOW}⏳ 等待服务就绪...${NC}"
sleep 2

# 检查服务端
if curl -s http://localhost:$SERVER_PORT/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 服务端就绪: http://localhost:$SERVER_PORT${NC}"
else
    echo -e "${RED}✗ 服务端未就绪，查看日志: $LOG_DIR/server.log${NC}"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  尘起时刻 已启动！${NC}"
echo -e "${GREEN}  前端: http://localhost:$CLIENT_PORT${NC}"
echo -e "${GREEN}  后端: http://localhost:$SERVER_PORT${NC}"
echo -e "${GREEN}  日志: $LOG_DIR/${NC}"
echo -e "${GREEN}  停止: ./stop.sh${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"