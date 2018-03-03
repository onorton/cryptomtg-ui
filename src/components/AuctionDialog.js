import React, { Component } from 'react';
import {Modal,Effect,ModalManager} from 'react-dynamic-modal';
import Dropdown from 'react-dropdown'
import './dropdown.css'
import './react-datetime.css'
import DateTime from 'react-datetime'
const toastr = require('toastr');
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const auctionInfo = require('../truffle/build/contracts/CardAuction.json')
const cardInfo = require('../truffle/build/contracts/Card.json')
const AuctionContract = web3.eth.contract(auctionInfo.abi);
const CardContract = web3.eth.contract(cardInfo.abi);

export default class AuctionDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      card: null,
      minimumBid: null,
      date: null
    };
  }

  createAuction() {
    const auctionDialog = this
    if (!this.state.card || !this.state.minimumBid || !this.state.date) {
      toastr.error("Missing data for auction")
      return
    }

    const gasEstimate = AuctionContract.eth.estimateGas({from: this.props.address})
    const cardAddress = this.props.cards.filter((card) => card.name==this.state.card)[0].address
    const card = CardContract.at(cardAddress)
    if(this.state.date-new Date() <= 0) {
      toastr.error("Cannot set an auction date in the past.")
      return
    }


    AuctionContract.new((this.state.date-new Date())/1000,web3.toWei(auctionDialog.state.minimumBid, 'ether')-1,{from: this.props.address, data:auctionInfo.bytecode, gas: 5000000},
      function(error, auction) {
        if(auction.address !== undefined) {
        // transfer ownership
        card.transferOwnership(auction.address,  {from: auctionDialog.props.address, gas: 100000})

        auction.addCard(cardAddress, {from: auctionDialog.props.address, gas: 100000})
        auction.bid({from: auctionDialog.props.address, value:web3.toWei(auctionDialog.state.minimumBid, 'ether'), gas: 500000})

        fetch('http://localhost:8000/auctions/', {
          method: 'POST',
          body: JSON.stringify({id: card.id(), address: auction.address, minimumBid:auctionDialog.state.minimumBid, auctionEnd:auctionDialog.state.date}),
          headers: {
              "Content-Type": "application/json"
          }
        }).then(function(response) {

          if (response.status == 200) {
            response.json().then(function(data) {
              toastr.success("Congratulations! You have just put up a copy of \"" + card.name() + "\" up for auction.")
              console.log(auctionDialog)
              auctionDialog.props.updateParent()

            })

            fetch('http://localhost:8000/cards/transfer/'+card.id(), {
              method: 'PUT',
              body: JSON.stringify({address: auction.address}),
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
        }
      })

    ModalManager.close()
  }



  render(){
    return (
       <Modal style={{content: {textAlign: 'center', width: '40%', height: 800}}}
          onRequestClose={() => true}
          effect={Effect.ScaleUp}>
          <h1>Auction off Card</h1>
          <h4>Select Card:</h4>
          <Dropdown style={{width:100}} value={this.state.card} onChange={(option) => this.setState({card: option.label})} options={Array.from(new Set(this.props.cards.map((card) => card.name)))} placeholder="Select an option" />
          <h4>Select Minimal Bid:</h4>
          <input type="text" onChange={(event) => this.setState({minimumBid: parseFloat(event.target.value)})}/>
          <h4>Select Auction Ending Time:</h4>
          <DateTime onChange={(date) => this.setState({date: date})}/>
          <button className='reject' onClick={ModalManager.close}>Cancel</button>
          <button className='accept' onClick={() => this.createAuction()}>Auction</button>

       </Modal>

    );
  }
}
