#!/bin/bash

# 一键部署和测试脚本
# 使用方法：bash run.sh

set -e

echo "🚀 启动 Ganache..."

# 启动 ganache，指定特定的 mnemonic 和端口 8545
npx ganache --mnemonic "glue region flip fire useless grocery giraffe sand change between flash impact" --port 8545 --chain.chainId 1337 --wallet.totalAccounts 10 --wallet.defaultBalance 1000 --server.host 127.0.0.1 > ganache.log 2>&1 &

# 获取后台运行的进程ID
GANACHE_PID=$!

# 延迟等待 ganache 启动完成，等待 5 秒
sleep 2

echo "🛠️ 编译合约..."
npx hardhat compile

echo "📦 部署合约到本地链..."
npx hardhat run scripts/deploy.js --network localhost

echo "🧪 执行测试..."
npx hardhat test --network localhost

# 停掉 ganache 进程
echo "🧹 停止 Ganache..."
kill $GANACHE_PID

# 打印执行完成消息
echo "✅ 所有流程执行完毕！"
