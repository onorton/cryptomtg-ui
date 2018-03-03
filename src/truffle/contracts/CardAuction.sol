pragma solidity ^0.4.18;
import 'contracts/Card.sol';

contract CardAuction {

  address public beneficiary;
  Card public auctionItem;
  uint public auctionEnd;

  address public highestBidder;
  uint public highestBid;

  // List of bids that need to be returned
  mapping(address => uint) pendingReturns;

  bool public auctionEnded;
  bool public itemSet;

  event HighestBidIncreased(address bidder, uint amount);
  event AuctionEnded(address winner, uint id);

  function CardAuction (
    uint _auctionTime,
    uint minimalBid
  ) public {

    beneficiary = msg.sender;
    auctionEnd = now + _auctionTime;
    highestBid = minimalBid;
  }

  function addCard(Card _auctionItem) external onlyOwner {
    // Ownership of card has to be transferred to this contract
    require(_auctionItem.owner() == address(this));
    require(itemSet == false);
    auctionItem = _auctionItem;
    itemSet = true;
  }

  function bid() public payable {

    // Only bid before auction ends
    require(now <= auctionEnd);

    // If account does not outbid highest bidder, exit early
    require(msg.value > highestBid);

    if (highestBidder != 0) {
      pendingReturns[highestBidder] += highestBid;
    }
    highestBidder = msg.sender;
    highestBid = msg.value;
    HighestBidIncreased(highestBidder, highestBid);
  }

  function withdraw() public returns (bool){
    uint amount = pendingReturns[msg.sender];
    if (amount > 0) {
      // Has to be set first to prevent rentry attacks
      pendingReturns[msg.sender] = 0;

      if (!msg.sender.send(amount)) {
        pendingReturns[msg.sender] = amount;
        return false;
      }
    }
    return true;
  }

  function endAuction() public {
    require(now >= auctionEnd); // auction did not yet end
    require(!auctionEnded); // this function has already been called

    auctionEnded = true;
    AuctionEnded(highestBidder, auctionItem.id());

    // pay card owner
    beneficiary.transfer(highestBid);
    // transfer card to winner
    auctionItem.transferOwnership(highestBidder);
  }

  modifier onlyOwner() {
      assert(msg.sender == beneficiary);
      _;
  }
}
