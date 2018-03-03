pragma solidity ^0.4.18;
import 'contracts/Card.sol';

contract CardGenerator {
    string[] possibleCards = ["Cleric of the Forward Order","Hour of Reckoning","Victimize"];
    uint idCounter = 1;
    uint public amountRequired = 100000000000000;

    event CardCreated(address owner, address card);

    function generateCard() public payable {
      require(msg.value == amountRequired);
      // Generate random card name
      string cardName = possibleCards[uint(block.blockhash(block.number-1))%possibleCards.length];
      Card card = new Card(cardName, idCounter);
      card.transferOwnership(msg.sender);
      idCounter++;
      CardCreated(msg.sender, address(card));

    }
}
