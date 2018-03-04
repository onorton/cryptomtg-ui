import React, { Component } from 'react';
import StackGrid from "react-stack-grid";
const Web3 = require('web3')
const web3 = new Web3(window.web3.currentProvider)
const toastr = require('toastr');

const cardGenerator = require('../truffle/build/contracts/CardGenerator.json')
const card = require('../truffle/build/contracts/Card.json')


const generatorAddress = '0x45d687791ef6a0379053a88f61cfd342efc8cf2b'
const GeneratorContract = web3.eth.contract(cardGenerator.abi);
const CardContract = web3.eth.contract(card.abi);

export default class CardList extends Component {


  constructor(props) {
    super(props);
    this.state = {
      generator: GeneratorContract.at(generatorAddress),
      cards: []
    };
  }

  componentWillMount() {
    const cardList = this
    this.state.generator.CardCreated({owner: this.props.address}, function(error, event){
      if (!error) {
        const cardInstance = CardContract.at(event.args.card)
        cardList.saveCard(cardInstance)
      } else {
        console.log("error")
      }
    });


}

  componentDidMount() {

    const cardList = this
    if (this.props.address) {
    fetch('http://localhost:8000/cards/' + cardList.props.address + '/', {
      method: 'GET',
      headers: {
          "Content-Type": "application/json"
      }
    }).then(function(response) {

      if (response.status == 200) {
        response.json().then(function(data) {
          cardList.setState({cards: data.cards})
        })
        }
      })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });
    }

  }

  saveCard(cardInstance) {
    // Card created so save to database
    const cardList = this
    var cards = cardList.state.cards
    cardInstance.name(function(error, name) {
      console.log(name)
      cardInstance.id(function(error, id) {
        fetch('http://localhost:8000/cards/' + cardList.props.address +"/", {
          method: 'POST',
          body: JSON.stringify({name: name, id: id, address: cardInstance.address}),
          headers: {
              "Content-Type": "application/json"
          }
        }).then(function(response) {

          if (response.status == 200) {
            response.json().then(function(data) {
              cards.push({name: name, cardId: data.cardId, address:data.address});
              cardList.setState({cards: cards})
              toastr.success("Congratulations! You have a new copy of \"" + name + "\".")
            })
          }

        }).catch(function(error) {
          console.log('There has been a problem with your fetch operation: ' + error.message);
        });


      })
    })



  }
  render(){
    web3.eth.defaultAccount = this.props.address

    return (
      <div>
      <button className='button' onClick={() => this.state.generator.generateCard({value: web3.toWei(0.0001, 'ether'), gas: 500000}, (error, transaction) => {if (error) {console.log(error)}})}>Get Random Card: 0.0001 <img style={{marginLeft: -5, marginBottom: -5, width:18,height:22}}src={require('../assets/ethereum.png')} /> </button>
      <StackGrid columnWidth={200}>
        {this.state.cards.map((card) => <a target="_blank" href={'http://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=' + card.cardId}>
                            <img alt={card.name} style={{width:200}}  src={'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + card.cardId + '&type=card'}/></a>)}
      </StackGrid>
      </div>
    );
  }
}
