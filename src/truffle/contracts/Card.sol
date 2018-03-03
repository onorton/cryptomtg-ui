pragma solidity ^0.4.18;

contract Card {
    address public owner;
    address public creator;
    string public name;
    uint public id;

    function Card(string _name, uint _id) public {
        owner = msg.sender;
        creator = msg.sender;
        name = _name;
        id = _id;
    }

    modifier onlyOwner() {
        assert(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner != address(0)) {
            owner = newOwner;
        }
    }
}
