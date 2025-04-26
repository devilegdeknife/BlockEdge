const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ResourceAllocation Contract", function () {
  let ResourceAllocation, resourceAllocation;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ResourceAllocation = await ethers.getContractFactory("ResourceAllocation");
    resourceAllocation = await ResourceAllocation.deploy();
    await resourceAllocation.waitForDeployment();
    await new Promise(resolve => setTimeout(resolve, 2000)); // 增加2秒等待时间
  });

  describe("资源发布", function () {
    it("✅ 应允许发布资源", async function () {
      const tx = await resourceAllocation.announceResource("Water", "Pure", 100, 2);
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "ResourceAnnounced");
      expect(event, "ResourceAnnounced event should be emitted").to.not.be.undefined;

      expect(event.args.provider).to.equal(owner.address);
      expect(event.args.name).to.equal("Water");
      expect(event.args.total).to.equal(100);
    });

    it("❌ 资源数量为0应失败", async function () {
      await expect(
        resourceAllocation.announceResource("Zero", "Invalid", 0, 1)
      ).to.be.revertedWith("Resource total must be greater than 0");
    });

    it("❌ 时长为0应失败", async function () {
      await expect(
        resourceAllocation.announceResource("Short", "Invalid", 100, 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("❌ 名称为空应失败", async function () {
      await expect(
        resourceAllocation.announceResource("", "No Name", 100, 1)
      ).to.be.revertedWith("Resource name cannot be empty");
    });
  });

  describe("资源请求", function () {
    let resourceId;

    beforeEach(async function () {
      const tx = await resourceAllocation.announceResource("CPU", "High Perf", 1000, 10);
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "ResourceAnnounced");
      expect(event, "ResourceAnnounced event should be emitted").to.not.be.undefined;
      resourceId = event.args.resourceId;
    });

    it("✅ 应允许创建请求", async function () {
      const tx = await resourceAllocation.connect(user1).createRequest(resourceId, 500);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "RequestCreated");

      expect(event.args.requester).to.equal(user1.address);
      expect(event.args.amount).to.equal(500);
    });

    it("❌ 请求资源为0应失败", async function () {
      await expect(
        resourceAllocation.connect(user1).createRequest(resourceId, 0)
      ).to.be.revertedWith("Request amount must be greater than 0");
    });

    it("❌ 请求超过资源上限应失败", async function () {
      await expect(
        resourceAllocation.connect(user1).createRequest(resourceId, 2000)
      ).to.be.revertedWith("Insufficient resources");
    });

    it("❌ 请求不存在资源应失败", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("nope"));
      await expect(
        resourceAllocation.connect(user1).createRequest(fakeId, 100)
      ).to.be.revertedWith("Resource does not exist");
    });

    it("❌ 请求已过期资源应失败", async function () {
      // 模拟资源过期
      await network.provider.send("evm_increaseTime", [36000]); // 10小时后
      await network.provider.send("evm_mine");
      await expect(
        resourceAllocation.connect(user1).createRequest(resourceId, 100)
      ).to.be.revertedWith("Resource expired");
    });
  });

  describe("请求 Fulfill", function () {
    let resourceId, requestId;

    beforeEach(async function () {
      const tx = await resourceAllocation.announceResource("GPU", "RTX", 100, 5);
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "ResourceAnnounced");
      expect(event, "ResourceAnnounced event should be emitted").to.not.be.undefined;
      resourceId = event.args.resourceId;

      const reqTx = await resourceAllocation.connect(user1).createRequest(resourceId, 50);
      const reqReceipt = await reqTx.wait();
      const requestEvent = reqReceipt.events?.find(e => e.event === "RequestCreated");
      expect(requestEvent).to.not.be.undefined;
      requestId = requestEvent.args.requestId;
    });

    it("✅ 请求者应能 fulfill 自己的请求", async function () {
      const tx = await resourceAllocation.connect(user1).fulfillRequest(requestId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "RequestFulfilled");

      expect(event.args.requestId).to.equal(requestId);

      const details = await resourceAllocation.getRequestDetails(requestId);
      expect(details.fulfilled).to.be.true;
    });

    it("❌ 非请求者不能 fulfill 请求", async function () {
      await expect(
        resourceAllocation.connect(user2).fulfillRequest(requestId)
      ).to.be.revertedWith("Only requester can fulfill the request");
    });

    it("❌ 已 fulfill 不能重复 fulfill", async function () {
      await resourceAllocation.connect(user1).fulfillRequest(requestId);
      await expect(
        resourceAllocation.connect(user1).fulfillRequest(requestId)
      ).to.be.revertedWith("Request already fulfilled");
    });

    it("❌ 请求不存在应失败", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));
      await expect(
        resourceAllocation.connect(user1).fulfillRequest(fakeId)
      ).to.be.revertedWith("Request does not exist");
    });
  });
});
