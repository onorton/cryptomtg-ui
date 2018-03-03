pragma solidity ^0.4.18;
import 'contracts/Card.sol';

// Allows the trading of cards between two parties
contract Trade {
  address private firstParty;
  address private secondParty;

  Card[] public firstTradeItems;
  Card[] public secondTradeItems;

  bool public firstAccepted;
  bool public secondAccepted;

  event ItemAdded(address owner, Card card);
  event ItemRemoved(address owner, Card card);
  event TradeSuccessful(Card[] firstCards, Card[] secondCards);
  event TradeRejected(Card[] firstCards, Card[] secondCards, address rejecter);

  bool public tradeEnded = false;

  function Trade(address _secondParty) public {
        firstParty = msg.sender;
        secondParty = _secondParty;
    }
  // trade functions should only be called by parties involved in the trade
  modifier onlyInvolvedParties() {
        assert(msg.sender == firstParty || msg.sender == secondParty);
        _;
  }

  function addTradeItem(Card card) external onlyInvolvedParties {
    require(!tradeEnded);
    // Card must have been transferred to this contract before adding
    assert(card.owner() == address(this));

    if (msg.sender == firstParty) {
      firstTradeItems.push(card);
    } else {
      secondTradeItems.push(card);
    }

    ItemAdded(msg.sender, card);
    // Reset acceptance for each party
    firstAccepted = false;
    secondAccepted = false;
  }

  // Remove trade item by id
  function removeTradeItem(uint id) external onlyInvolvedParties {
    require(!tradeEnded);
    Card c;
    if (msg.sender == firstParty) {
      for (uint i = 0; i < firstTradeItems.length; i++) {
        if (firstTradeItems[i].id() == id) {
          c = firstTradeItems[i];
          firstTradeItems[i].transferOwnership(firstParty);
          delete firstTradeItems[i];
          break;
        }
      }
    } else {
      for (i = 0; i < secondTradeItems.length; i++) {
        if (secondTradeItems[i].id() == id) {
          c = secondTradeItems[i];
          secondTradeItems[i].transferOwnership(secondParty);
          delete secondTradeItems[i];
          break;
        }
      }
    }

    ItemRemoved(msg.sender, c);
    // Reset acceptance for each party
    firstAccepted = false;
    secondAccepted = false;
  }

  function accept() external onlyInvolvedParties {
    require(!tradeEnded);
    // Sender is marked as having accepted the trade
    if (msg.sender == firstParty) {
      firstAccepted = true;
    } else {
      secondAccepted = true;
    }


    // If both parties accept, transfer cards and selfdestruct
    if (firstAccepted && secondAccepted) {
      for (uint i = 0; i < firstTradeItems.length; i++) {
          firstTradeItems[i].transferOwnership(secondParty);
      }
      for (i = 0; i < secondTradeItems.length; i++) {
          secondTradeItems[i].transferOwnership(firstParty);
      }
      tradeEnded = true;
      TradeSuccessful(firstTradeItems,secondTradeItems);

    }
  }
  // If either party rejects trade offer, ownership transferred back
  function reject() external onlyInvolvedParties {
    require(!tradeEnded);
    for (uint i = 0; i < firstTradeItems.length; i++) {
        firstTradeItems[i].transferOwnership(firstParty);
    }
    for (i = 0; i < secondTradeItems.length; i++) {
        secondTradeItems[i].transferOwnership(secondParty);
    }
    tradeEnded = true;
    TradeRejected(firstTradeItems,secondTradeItems, msg.sender);
  }

}
