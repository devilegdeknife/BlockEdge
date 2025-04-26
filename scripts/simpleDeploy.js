const { ethers } = require("hardhat");

async function main() {
  const ContractFactory = await ethers.getContractFactory("ResourceAllocation");
  const contract = await ContractFactory.deploy();
  console.log("Deployment Transaction Hash:", contract.deployTransaction.hash);

  const receipt = await ethers.provider.getTransactionReceipt(contract.deployTransaction.hash);
  console.log("Deployment Receipt:", receipt);
  const deployedAddress = receipt.contractAddress;
  console.log("Deployed Address from Receipt:", deployedAddress);

  // 使用合约接口和部署地址重新获取合约实例
  const deployedContract = new ethers.Contract(deployedAddress, ContractFactory.interface, ethers.provider);
  console.log("Deployed to (via new Contract):", deployedContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });