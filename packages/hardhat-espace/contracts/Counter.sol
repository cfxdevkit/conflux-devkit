// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Counter {
    uint256 public count;

    event CounterIncremented(uint256 newCount);
    event CounterDecremented(uint256 newCount);
    event CounterReset();

    constructor(uint256 _initialCount) {
        count = _initialCount;
    }

    function increment() public {
        count += 1;
        emit CounterIncremented(count);
    }

    function decrement() public {
        require(count > 0, "Counter: cannot decrement below zero");
        count -= 1;
        emit CounterDecremented(count);
    }

    function reset() public {
        count = 0;
        emit CounterReset();
    }

    function getCount() public view returns (uint256) {
        return count;
    }
}