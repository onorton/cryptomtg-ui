import React, { Component } from 'react';
import {Modal,Effect,ModalManager} from 'react-dynamic-modal';
import Dropdown from 'react-dropdown'
import './dropdown.css'
import './react-datetime.css'
import DateTime from 'react-datetime'
const toastr = require('toastr');
const Web3 = require('web3')
const web3 = new Web3(window.web3.currentProvider)

const tradeInfo = require('../truffle/build/contracts/Trade.json')
const cardInfo = require('../truffle/build/contracts/Card.json')
const TradeContract = web3.eth.contract(tradeInfo.abi);
const CardContract = web3.eth.contract(cardInfo.abi);

export default class TradeDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      secondParty: null,
      card: null
    };
  }

  createTrade() {
    const tradeDialog = this
    if (!this.state.card || !this.state.secondParty) {
      toastr.error("Missing data for trade")
      return
    }

    const cardAddress = this.props.cards.filter((card) => card.name==this.state.card)[0].address
    const card = CardContract.at(cardAddress)

    web3.eth.estimateGas({data:tradeInfo.bytecode}, function(error, gasEstimate) {
    TradeContract.new(tradeDialog.state.secondParty,{from: tradeDialog.props.address, data:tradeInfo.bytecode, gas: gasEstimate+100000},
      function(error, trade) {
        if(trade.address !== undefined) {
        // transfer ownership
        card.transferOwnership(trade.address,  {from: tradeDialog.props.address, gas: 100000},
          function(error, transaction) {
        trade.addTradeItem(cardAddress, {from: tradeDialog.props.address, gas: 100000},
          function(error,transaction) {
              card.id(function (error, id) {

        fetch('http://localhost:8000/trades/' + tradeDialog.props.address + '/', {
          method: 'POST',
          body: JSON.stringify({card:id, address: trade.address, firstParty:tradeDialog.state.address, secondParty:tradeDialog.state.secondParty}),
          headers: {
              "Content-Type": "application/json"
          }
        }).then(function(response) {
          if (response.status == 200) {
            response.json().then(function(data) {
              toastr.success("Congratulations! You have have started a trade with " + tradeDialog.state.secondParty + ".")
              tradeDialog.props.updateParent()
            })

            fetch('http://localhost:8000/cards/transfer/'+id, {
              method: 'PUT',
              body: JSON.stringify({address: trade.address}),
              headers: {
                  "Content-Type": "application/json"
              }
            }).then(function(response) {
            }).catch(function(error) {
              console.log('There has been a problem with your fetch operation: ' + error.message);
            });
          }
        }).catch(function(error) {
          console.log('There has been a problem with your fetch operation: ' + error.message);
        });
      })
    })
  })
}
})
})


    ModalManager.close()
  }



  render(){
    return (
       <Modal style={{content: {textAlign: 'center', width: '40%', height: 600}}}
          onRequestClose={() => true}
          effect={Effect.ScaleUp}>
          <h1>Trade Cards</h1>
          <h4>Second Party:</h4>
          <input type="text" style={{width:400}} onChange={(event) => this.setState({secondParty: event.target.value.toLowerCase()})}/>
          <h4>Select Card:</h4>
          <Dropdown style={{width:100}} value={this.state.card} onChange={(option) => this.setState({card: option.label})} options={Array.from(new Set(this.props.cards.map((card) => card.name)))} placeholder="Select an option" />

          <button className='reject' onClick={ModalManager.close}>Cancel</button>
          <button className='accept' onClick={() => this.createTrade()}>Start Trade</button>
       </Modal>

    );
  }
}
