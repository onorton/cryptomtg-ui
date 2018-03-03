import React, { Component } from 'react';
import {Modal,Effect,ModalManager} from 'react-dynamic-modal';
import Dropdown from 'react-dropdown'
import './dropdown.css'
import './react-datetime.css'
const toastr = require('toastr');
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const tradeInfo = require('../truffle/build/contracts/Trade.json')
const cardInfo = require('../truffle/build/contracts/Card.json')
const TradeContract = web3.eth.contract(tradeInfo.abi);
const CardContract = web3.eth.contract(cardInfo.abi);

export default class RemoveItemDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      card: null
    };
  }

  removeItem() {
    const removeItemDialog = this
    if (!this.state.card) {
      toastr.error("No card to add")
      return
    }

    const trade = TradeContract.at(this.props.tradeAddress)
    const cardAddress = this.props.cards.filter((card) => card.name==this.state.card)[0].address
    const card = CardContract.at(cardAddress)

    // transfer ownership
    trade.removeTradeItem(card.id(),{from: this.props.address, gas: 500000})
      fetch('http://localhost:8000/trades/remove/' + removeItemDialog.props.tradeAddress, {
        method: 'PUT',
        body: JSON.stringify({card:card.id(), party:removeItemDialog.props.address}),
        headers: {
            "Content-Type": "application/json"
        }
      }).then(function(response) {

        if (response.status == 200) {
          response.json().then(function(data) {
            toastr.success("You have have added a " + removeItemDialog.state.card + " to the trade.")
          })

          fetch('http://localhost:8000/cards/transfer/'+card.id(), {
            method: 'PUT',
            body: JSON.stringify({address: removeItemDialog.props.address}),
            headers: {
                "Content-Type": "application/json"
            }
          }).then(function(response) {
            }
          ).catch(function(error) {
            console.log('There has been a problem with your fetch operation: ' + error.message);
          });

        }

      }).catch(function(error) {
        console.log('There has been a problem with your fetch operation: ' + error.message);
      });
    ModalManager.close()
  }



  render(){
    return (
       <Modal style={{content: {textAlign: 'center', width: '40%', height: 200}}}
          onRequestClose={() => true}
          effect={Effect.ScaleUp}>
          <h4>Select Card:</h4>
          <Dropdown style={{width:100}} value={this.state.card} onChange={(option) => this.setState({card: option.label})} options={Array.from(new Set(this.props.cards.map((card) => card.name)))} placeholder="Select an option" />

          <button className='reject' onClick={ModalManager.close}>Cancel</button>
          <button className='accept' onClick={() => this.removeItem()}>Remove Item</button>
       </Modal>

    );
  }
}
