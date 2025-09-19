// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Counter {
    uint256 private _count;
    address private _owner;
    
    event CountIncremented(uint256 newCount, address indexed incrementer);
    event CountReset(address indexed resetter);
    
    constructor(uint256 initialCount) {
        _count = initialCount;
        _owner = msg.sender;
    }
    
    function getCount() public view returns (uint256) {
        return _count;
    }
    
    function increment() public {
        _count += 1;
        emit CountIncremented(_count, msg.sender);
    }
    
    function decrement() public {
        require(_count > 0, "Count cannot be negative");
        _count -= 1;
        emit CountIncremented(_count, msg.sender);
    }
    
    function reset() public {
        require(msg.sender == _owner, "Only owner can reset");
        _count = 0;
        emit CountReset(msg.sender);
    }
    
    function add(uint256 amount) public {
        _count += amount;
        emit CountIncremented(_count, msg.sender);
    }
    
    function subtract(uint256 amount) public {
        require(_count >= amount, "Count cannot be negative");
        _count -= amount;
        emit CountIncremented(_count, msg.sender);
    }
}
