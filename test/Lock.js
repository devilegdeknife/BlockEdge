const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ResourceAllocation Contract", function () {
  let ResourceAllocation;
  let resourceAllocation;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let resourceId;
  let requestId;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    ResourceAllocation = await ethers.getContractFactory("ResourceAllocation");
    resourceAllocation = await ResourceAllocation.deploy();
    const deployment = await resourceAllocation.waitForDeployment();
    const contractAddress = await deployment.getAddress();
    console.log(`✅ ResourceAllocation 合约已部署到地址: ${contractAddress}`);
  });

  describe("announceResource", function () {
    it("应允许资源提供者公告资源", async function () {
      const total = 1000;
      const durationHours = 10;

      const tx = await resourceAllocation.announceResource(total, durationHours);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.topics[0] === ethers.id("ResourceAnnounced(bytes32,address)"));
      resourceId = event.topics[1];

      const resource = await resourceAllocation.resources(resourceId);
      expect(resource.provider).to.equal(owner.address);
      expect(resource.total).to.equal(total);
      expect(resource.remaining).to.equal(total);
    });
  });

  describe("createRequest", function () {
    beforeEach(async function () {
      const total = 1000;
      const durationHours = 10;
      const tx = await resourceAllocation.announceResource(total, durationHours);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.topics[0] === ethers.id("ResourceAnnounced(bytes32,address)"));
      resourceId = event.topics[1];
    });

    it("应允许用户创建请求并减少资源剩余量", async function () {
      const amount = 500;

      const tx = await resourceAllocation.connect(addr1).createRequest(resourceId, amount);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.topics[0] === ethers.id("RequestCreated(bytes32,address)"));
      requestId = event.topics[1];

      const resource = await resourceAllocation.resources(resourceId);
      expect(resource.remaining).to.equal(500);
    });
  });

  describe("fulfillRequest", function () {
    beforeEach(async function () {
      const total = 1000;
      const durationHours = 10;
      const announceTx = await resourceAllocation.announceResource(total, durationHours);
      const announceReceipt = await announceTx.wait();
      const announceEvent = announceReceipt.logs.find(log => log.topics[0] === ethers.id("ResourceAnnounced(bytes32,address)"));
      resourceId = announceEvent.topics[1];

      const amount = 500;
      const createTx = await resourceAllocation.connect(addr1).createRequest(resourceId, amount);
      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.logs.find(log => log.topics[0] === ethers.id("RequestCreated(bytes32,address)"));
      requestId = createEvent.topics[1];
    });

    it("应允许请求者标记请求为已完成", async function () {
      const requestBefore = await resourceAllocation.requests(requestId);
      expect(requestBefore.fulfilled).to.equal(false);

      await resourceAllocation.connect(addr1).fulfillRequest(requestId);

      const requestAfter = await resourceAllocation.requests(requestId);
      expect(requestAfter.fulfilled).to.equal(true);
    });

    // it("应拒绝非请求者标记请求为已完成", async function () {
    //   await expect(
    //     resourceAllocation.connect(addr2).fulfillRequest(requestId)
    //   ).to.be.revertedWith("Only requester can fulfill the request");
    // });
  });
});