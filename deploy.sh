#!/bin/bash

echo "🚀 简易部署和更新前端合约配置..."

echo "🔧 正在编译合约..."
npx hardhat compile

echo "🔌 尝试停止可能已存在的本地 Hardhat 节点..."
PID=$(lsof -ti:8545)
if [ -n "$PID" ]; then
    echo "Found process $PID listening on port 8545. Attempting to kill..."
    kill "$PID"
    sleep 2 # 给进程一点时间停止
fi

echo "🔌 启动本地 Hardhat 节点 (后台运行)..."
npx hardhat node --hostname 127.0.0.1 --port 8545 &
NODE_PID=$!
echo "Hardhat Node PID: $NODE_PID"
sleep 1

echo "🚀 正在部署合约并更新前端配置..."
npx hardhat run scripts/deploy.js --network localhost

# echo "🛑 停止本地 Hardhat 节点..."
# if [ -n "$NODE_PID" ] && kill -0 "$NODE_PID"; then
#     kill "$NODE_PID"
#     echo "Hardhat Node stopped."
# else
#     echo "Warning: Could not find or stop Hardhat Node (PID: $NODE_PID)."
# fi

echo "✅ 简易流程已完成"