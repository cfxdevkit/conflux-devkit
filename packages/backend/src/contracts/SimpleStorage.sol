// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleStorage
 * @dev A simple contract for storing and retrieving a value
 * @notice Used for testing basic contract deployment and interaction
 */
contract SimpleStorage {
    uint256 private storedValue;
    address public owner;

    event ValueChanged(uint256 indexed oldValue, uint256 indexed newValue, address indexed changedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "SimpleStorage: caller is not the owner");
        _;
    }

    constructor(uint256 initialValue) {
        storedValue = initialValue;
        owner = msg.sender;
        emit ValueChanged(0, initialValue, msg.sender);
    }

    /**
     * @dev Store a new value
     * @param newValue The value to store
     */
    function set(uint256 newValue) public {
        uint256 oldValue = storedValue;
        storedValue = newValue;
        emit ValueChanged(oldValue, newValue, msg.sender);
    }

    /**
     * @dev Retrieve the stored value
     * @return The stored value
     */
    function get() public view returns (uint256) {
        return storedValue;
    }

    /**
     * @dev Increment the stored value by 1
     */
    function increment() public {
        uint256 oldValue = storedValue;
        storedValue += 1;
        emit ValueChanged(oldValue, storedValue, msg.sender);
    }

    /**
     * @dev Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "SimpleStorage: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
