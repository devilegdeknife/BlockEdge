require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      saveDeployments: true, // 新增配置
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [],
      saveDeployments: true, // 新增配置
    },
  },
  // 新增账户配置
  namedAccounts: {
    deployer: {
      default: 0, // 本地网络使用第一个账户
      goerli: 0, // goerli网络也使用第一个账户
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    scripts: "./scripts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

task("send-eth")
  .addParam("recipient", "The address to send ETH to")
  .addParam("amount", "The amount of ETH to send")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { recipient, amount } = taskArgs;

    // 获取 Hardhat 提供的第一个默认签名者（通常拥有大量测试 ETH）
    const [sender] = await ethers.getSigners();

    const amountToSend = ethers.parseEther(amount); // 将字符串金额转换为 Wei

    try {
      const tx = await sender.sendTransaction({
        to: recipient,
        value: amountToSend,
      });

      console.log(`发送 ${amount} ETH 到 ${recipient} 的交易哈希: ${tx.hash}`);
      await tx.wait(); // 等待交易被确认
      console.log("交易已确认。");
    } catch (error) {
      console.error("发送 ETH 失败:", error);
    }
  });