// SPDX-License-Identifier: MIT
// 指定 SPDX 许可证标识符为 MIT
pragma solidity ^0.8.20;

// 定义资源分配合约
contract ResourceAllocation {
    // 定义资源结构体，用于存储资源的相关信息
    struct Resource {
        // 资源提供者的地址
        address provider;
        // 资源的总量
        uint256 total;
        // 资源的剩余量
        uint256 remaining;
        // 资源的开始时间
        uint256 startTime;
        // 资源的结束时间
        uint256 endTime;
        // 资源的名称
        string name;
        // 资源的描述
        string description;
    }
    
    // 定义资源请求结构体，用于存储资源请求的相关信息
    struct Request {
        // 请求者的地址
        address requester;
        // 资源的 ID
        bytes32 resourceId;
        // 请求的资源数量
        uint256 amount;
        // 请求是否已完成
        bool fulfilled;
        // 请求创建的时间
        uint256 createdAt;
    }

    // 映射：将资源 ID 映射到对应的资源结构体
    mapping(bytes32 => Resource) public resources;
    // 映射：将请求 ID 映射到对应的请求结构体
    mapping(bytes32 => Request) public requests;
    // 管理员地址
    address public admin;
    // 存储所有资源 ID 的数组
    bytes32[] public resourceIds;
    // 存储所有请求 ID 的数组
    bytes32[] public requestIds;

    // 资源发布事件，当有新资源发布时触发
    event ResourceAnnounced(
        // 资源 ID，添加索引以便于查询
        bytes32 indexed resourceId,
        // 资源提供者的地址
        address provider,
        // 资源的名称
        string name,
        // 资源的总量
        uint256 total
    );
    // 请求创建事件，当有新请求创建时触发
    event RequestCreated(
        // 请求 ID，添加索引以便于查询
        bytes32 indexed requestId,
        // 请求者的地址
        address requester,
        // 资源的 ID
        bytes32 resourceId,
        // 请求的资源数量
        uint256 amount
    );
    // 请求完成事件，当请求被完成时触发
    event RequestFulfilled(bytes32 indexed requestId);

    // 仅管理员可调用的修饰器，用于限制某些函数的访问权限
    modifier onlyAdmin() {
        // 检查调用者是否为管理员
        require(msg.sender == admin, "Not authorized");
        _;
    }

    // 合约构造函数，在合约部署时执行
    constructor() {
        // 将合约部署者设置为管理员
        admin = msg.sender;
    }

    // 发布资源的函数
    function announceResource(
        // 资源的名称
        string memory name,
        // 资源的描述
        string memory description,
        // 资源的总量
        uint256 total,
        // 资源的持续时间（小时）
        uint256 durationHours
    ) external returns (bytes32) {
        // 检查资源总量是否大于 0
        require(total > 0, "Resource total must be greater than 0");
        // 检查资源持续时间是否大于 0
        require(durationHours > 0, "Duration must be greater than 0");
        // 检查资源名称是否为空
        require(bytes(name).length > 0, "Resource name cannot be empty");

        // 生成资源 ID，使用调用者地址、当前时间戳和资源名称进行哈希计算
        bytes32 resourceId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            name
        ));
        
        // 将新资源信息存储到资源映射中
        resources[resourceId] = Resource({
            provider: msg.sender,
            total: total,
            remaining: total,
            startTime: block.timestamp,
            endTime: block.timestamp + durationHours * 3600,
            name: name,
            description: description
        });

        // 将新资源 ID 添加到资源 ID 数组中
        resourceIds.push(resourceId);
        // 触发资源发布事件
        emit ResourceAnnounced(resourceId, msg.sender, name, total);
        // 返回新资源的 ID
        return resourceId;
    }

    // 获取所有资源 ID 的函数
    function getAllResourceIds() external view returns (bytes32[] memory) {
        // 返回存储所有资源 ID 的数组
        return resourceIds;
    }

    // 根据资源 ID 获取资源详细信息的函数
    function getResourceDetails(bytes32 resourceId) external view returns (Resource memory) {
        // 返回指定资源 ID 对应的资源结构体
        return resources[resourceId];
    }

    // 获取所有请求 ID 的函数
    function getAllRequestIds() external view returns (bytes32[] memory) {
        // 返回存储所有请求 ID 的数组
        return requestIds;
    }

    // 根据请求 ID 获取请求详细信息的函数
    function getRequestDetails(bytes32 requestId) external view returns (Request memory) {
        // 返回指定请求 ID 对应的请求结构体
        return requests[requestId];
    }

    // 创建资源请求的函数
    function createRequest(
        // 资源的 ID
        bytes32 resourceId,
        // 请求的资源数量
        uint256 amount
    ) external returns (bytes32) {
        // 检查请求的资源数量是否大于 0
        require(amount > 0, "Request amount must be greater than 0");

        // 获取指定资源 ID 对应的资源结构体
        Resource storage res = resources[resourceId];
        // 检查资源是否存在
        require(res.provider != address(0), "Resource does not exist");
        // 检查资源剩余量是否足够
        require(res.remaining >= amount, "Insufficient resources");
        // 检查资源是否过期
        require(block.timestamp <= res.endTime, "Resource expired");

        // 生成请求 ID，使用请求者地址、当前时间戳和资源 ID 进行哈希计算
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            resourceId
        ));

        // 将新请求信息存储到请求映射中
        requests[requestId] = Request({
            requester: msg.sender,
            resourceId: resourceId,
            amount: amount,
            fulfilled: false,
            createdAt: block.timestamp
        });

        // 减少资源的剩余量
        res.remaining -= amount;
        // 将新请求 ID 添加到请求 ID 数组中
        requestIds.push(requestId);
        // 触发请求创建事件
        emit RequestCreated(requestId, msg.sender, resourceId, amount);
        // 返回新请求的 ID
        return requestId;
    }

    // 完成资源请求的函数
    function fulfillRequest(bytes32 requestId) external {
        // 获取指定请求 ID 对应的请求结构体
        Request storage req = requests[requestId];
        // 检查请求是否存在
        require(req.requester != address(0), "Request does not exist");
        // 检查请求是否已经完成
        require(!req.fulfilled, "Request already fulfilled");
        // 检查调用者是否为请求者
        require(msg.sender == req.requester, "Only requester can fulfill the request");

        // 将请求标记为已完成
        req.fulfilled = true;
        // 触发请求完成事件
        emit RequestFulfilled(requestId);
    }
}
