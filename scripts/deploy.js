const { ethers } = require("hardhat");

async function main() {
  // 获取合约工厂
  const ResourceAllocation = await ethers.getContractFactory("ResourceAllocation");

  // 部署合约
  const contract = await ResourceAllocation.deploy();

  // 等待部署完成（ethers v6）
  await contract.waitForDeployment();

  // 获取部署地址
  const address = await contract.getAddress();
  console.log(`✅ ResourceAllocation 合约已部署到地址: ${address}`);
}

main().catch((error) => {
  console.error("❌ 部署失败:", error);
  process.exitCode = 1;
});