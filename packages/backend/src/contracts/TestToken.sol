// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TestToken
 * @dev A simple ERC20-like token for testing
 * @notice Implements basic ERC20 functionality without external dependencies
 */
contract TestToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Constructor that gives msg.sender all of initial supply
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _initialSupply Initial supply (in whole tokens, will be multiplied by 10^18)
     */
    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply * 10 ** decimals;
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    /**
     * @dev Returns the balance of an account
     * @param account The address to query
     * @return The balance
     */
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    /**
     * @dev Returns the allowance of a spender for an owner
     * @param owner The owner address
     * @param spender The spender address
     * @return The allowance
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return allowances[owner][spender];
    }

    /**
     * @dev Transfers tokens to a specified address
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @return success
     */
    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "TestToken: transfer to zero address");
        require(balances[msg.sender] >= amount, "TestToken: insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @dev Approve a spender to spend tokens
     * @param spender The address to approve
     * @param amount The amount to approve
     * @return success
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "TestToken: approve to zero address");

        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another (requires allowance)
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @return success
     */
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(from != address(0), "TestToken: transfer from zero address");
        require(to != address(0), "TestToken: transfer to zero address");
        require(balances[from] >= amount, "TestToken: insufficient balance");
        require(allowances[from][msg.sender] >= amount, "TestToken: insufficient allowance");

        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Mint new tokens (only for testing)
     * @param to The address to mint to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) public {
        require(to != address(0), "TestToken: mint to zero address");

        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /**
     * @dev Burn tokens (only for testing)
     * @param amount The amount to burn
     */
    function burn(uint256 amount) public {
        require(balances[msg.sender] >= amount, "TestToken: burn amount exceeds balance");

        balances[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}
