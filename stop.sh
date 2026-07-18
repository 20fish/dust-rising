#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  尘起时刻 — 停止脚本
#  用法: ./stop.sh
# ═══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 停止尘起时刻...${NC}"

# ── 按 PID 文件停止 ──
stop_by_pid() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            # 等待进程退出
            for i in {1..10}; do
                kill -0 "$pid" 2>/dev/null || break
                sleep 0.3
            done
            # 强制终止
            kill -9 "$pid" 2>/dev/null || true
            echo -e "${GREEN}✓ $name 已停止 (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}  $name PID 已失效${NC}"
        fi
        rm -f "$pid_file"
    fi
}

# ── 按端口强制清理 ──
kill_port() {
    local port=$1
    local pids=$(lsof -i:$port -sTCP:LISTEN -t 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ 端口 $port 已释放${NC}"
    fi
}

stop_by_pid "server"
stop_by_pid "client"

# 兜底：按端口清理
kill_port 3001
kill_port 5173
kill_port 5174

echo -e "${GREEN}✓ 已全部停止${NC}"