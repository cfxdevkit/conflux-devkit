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
