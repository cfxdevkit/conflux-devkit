// SPDX-License-Identifier: Apache-2.0
/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
