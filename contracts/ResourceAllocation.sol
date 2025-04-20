// contracts/ResourceAllocation.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ResourceAllocation {
    struct Resource {
        address provider;
        uint256 total;
        uint256 remaining;
        uint256 startTime;
        uint256 endTime;
    }
    
    struct Request {
        address requester;
        bytes32 resourceId;
        uint256 amount;
        bool fulfilled;
    }

    mapping(bytes32 => Resource) public resources;
    mapping(bytes32 => Request) public requests;
    address public admin;

    event ResourceAnnounced(bytes32 indexed resourceId, address provider);
    event RequestCreated(bytes32 indexed requestId, address requester);

    constructor() {
        admin = msg.sender;
    }

    function announceResource(
        uint256 total,
        uint256 durationHours
    ) external {
        bytes32 resourceId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp
        ));
        
        resources[resourceId] = Resource({
            provider: msg.sender,
            total: total,
            remaining: total,
            startTime: block.timestamp,
            endTime: block.timestamp + durationHours * 1 hours
        });
        
        emit ResourceAnnounced(resourceId, msg.sender);
    }

    function createRequest(
        bytes32 resourceId,
        uint256 amount
    ) external {
        Resource storage res = resources[resourceId];
        require(res.remaining >= amount, "Insufficient resources");
        require(block.timestamp <= res.endTime, "Resource expired");

        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp
        ));
        
        requests[requestId] = Request({
            requester: msg.sender,
            resourceId: resourceId,
            amount: amount,
            fulfilled: false
        });
        
        res.remaining -= amount;
        emit RequestCreated(requestId, msg.sender);
    }

    function fulfillRequest(bytes32 requestId) external {
    Request storage req = requests[requestId];
    require(msg.sender == req.requester, "Only requester can fulfill the request");
    req.fulfilled = true;
}

}
