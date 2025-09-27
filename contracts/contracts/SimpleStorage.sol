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

contract SimpleStorage {
    uint256 private _value;
    string private _name;
    
    event ValueChanged(uint256 newValue, address indexed setter);
    event NameChanged(string newName, address indexed setter);
    
    constructor(string memory name, uint256 initialValue) {
        _name = name;
        _value = initialValue;
    }
    
    function getValue() public view returns (uint256) {
        return _value;
    }
    
    function setValue(uint256 newValue) public {
        _value = newValue;
        emit ValueChanged(newValue, msg.sender);
    }
    
    function getName() public view returns (string memory) {
        return _name;
    }
    
    function setName(string memory newName) public {
        _name = newName;
        emit NameChanged(newName, msg.sender);
    }
    
    function increment() public {
        _value += 1;
        emit ValueChanged(_value, msg.sender);
    }
    
    function decrement() public {
        require(_value > 0, "Value cannot be negative");
        _value -= 1;
        emit ValueChanged(_value, msg.sender);
    }
}
