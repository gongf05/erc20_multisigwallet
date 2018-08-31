pragma solidity ^0.4.24;

import './zeppelin/StandardToken.sol';

contract Token is StandardToken {
    address public owner;

    string public constant name = 'OceanBountyToken';
    string public constant symbol = 'OPBT';

    // SUPPLY
    uint8 public constant decimals = 18;
    uint256 public constant initialSupply = 5000000 * 10**18;
    bool  private tokenClaimed = false;

    // all balance
    uint256 public totalSupply;

    // mapping
    mapping(address => bool) public frozenAccount;
    mapping(address => bool) public whiteList;

    // full list of receiver accounts
    address[] public addressLUT;

    // events
    event FundsFrozen(address indexed _address, bool _frozen);
    event AccountFrozen(address indexed _address);
    event WhiteListUpdated(address indexed _address, bool _isWhitelisted);

    // modifier
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // constructor function
    constructor() public {
        // set _owner
        owner = msg.sender;
        // total supply
        totalSupply = initialSupply;
        // add contract itself into whiteList
        whiteList[address(this)] = true;
    }

    // claim initial supply of tokens
    function claimInitTokens() public returns (bool) {
        require(tokenClaimed == false);
        // MultiSigWallet contract has all tokens
        balances[msg.sender] = initialSupply;
        // update tokenClaimed to avoid future change
        tokenClaimed = true;
        return true;
    }


    // returns full list of receiver addresses
    function getAccountList() public view onlyOwner() returns (address[]) {
        address[] memory v = new address[](addressLUT.length);
        for (uint256 i = 0; i < addressLUT.length; i++) {
            v[i] = addressLUT[i];
        }
        return v;
    }

    // add acount to whiteList - true means no-freeze
    function setWhiteList(address target, bool isWhitelisted) public onlyOwner() {
        whiteList[target] = isWhitelisted;
        emit WhiteListUpdated(target, isWhitelisted);
    }

    // freeze accounts
    function freezeAccount(address target, bool freeze) public onlyOwner() {
        frozenAccount[target] = freeze;
        emit FundsFrozen(target, freeze);
    }

    /**
    * @dev Transfer token for a specified address when not paused
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        // source account shall not be frozen
        if (frozenAccount[msg.sender]) {
            emit AccountFrozen(msg.sender);
            return false;
        }

        // transfer fund first if sender is not frozen
        require(super.transfer(_to, _value));
        // record the receiver address into list
        addressLUT.push(_to);
        // automatically freeze receiver that is not whitelisted
        if (frozenAccount[_to] == false && whiteList[_to] == false) {
            frozenAccount[_to] = true;
            emit FundsFrozen(_to, true);
        }
        return true;
    }

    /**
    * @dev Transfer tokens from one address to another when not paused
    * @param _from address The address which you want to send tokens from
    * @param _to address The address which you want to transfer to
    * @param _value uint256 the amount of tokens to be transferred
    */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        // source account shall not be freezed
        if (frozenAccount[_from]) {
            emit AccountFrozen(_from);
            return false;
        }

        // transfer fund
        require(super.transferFrom(_from, _to, _value));
        // add receiver to lookup table
        addressLUT.push(_to);
        // automatically freeze account
        if (frozenAccount[_to] == false && whiteList[_to] == false) {
            frozenAccount[_to] = true;
            emit FundsFrozen(_to, true);
        }
        return true;
    }

    /**
    * @dev Aprove the passed address to spend the specified amount of tokens on behalf of msg.sender when not paused.
    * @param _spender The address which will spend the funds.
    * @param _value The amount of tokens to be spent.
    */
    function approve(address _spender, uint256 _value) public returns (bool) {
        return super.approve(_spender, _value);
    }

    function allowance(address _owner, address _spender) public constant returns (uint256) {// solium-disable-line no-constant
        return super.allowance(_owner, _spender);
    }

}
