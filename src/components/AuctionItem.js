import React, { Component } from 'react';
import './AuctionItem.css'
const toastr = require('toastr');

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const auctionInfo = require('../truffle/build/contracts/CardAuction.json')
const cardInfo = require('../truffle/build/contracts/Card.json')
const AuctionContract = web3.eth.contract(auctionInfo.abi);
const CardContract = web3.eth.contract(cardInfo.abi);

export default class AuctionItem extends Component {
  constructor(props) {
      super(props);
      this.state = {date: new Date(), ended: false, bid: 0, highestBid: this.props.highestBid};
    }

    componentWillMount() {
      const auctionItem = this
      const auction = AuctionContract.at(this.props.auctionAddress)
      auction.AuctionEnded(function(error, event) {
      if(!error) {
      if (auction.beneficiary() == auctionItem.props.address) {
        toastr.success("Congratulations!. You've just sold a \"" + auctionItem.props.name + "\" for " + auction.highestBid() + "." )
      }

      if (event.args.winner == auctionItem.props.address) {
        toastr.success("Congratulations!. You've just bought a \"" + auctionItem.props.name + "\".")
      }

      fetch('http://localhost:8000/cards/transfer/'+event.args.id, {
        method: 'PUT',
        body: JSON.stringify({address: event.args.winner}),
        headers: {
            "Content-Type": "application/json"
        }
      }).then(function(response) {


        }
      ).catch(function(error) {
        console.log('There has been a problem with your fetch operation: ' + error.message);
      });
    }
  })
}

    componentDidMount() {
      // try withdrawing from auction
      const auction =  AuctionContract.at(this.props.auctionAddress)
      auction.withdraw({from: this.props.address, gas: 100000})

      this.timerID = setInterval(
        () => this.tick(),
        1000
      );
    }

    componentWillUnmount() {
      clearInterval(this.timerID);
    }

    tick() {
      this.setState({
        date: new Date()
      });
      if(this.props.endTime-this.state.date <= 0 && !this.state.ended) {
        // send auction end to blockchain
        console.log("end auction")
        this.state.ended = true
        const auction =  AuctionContract.at(this.props.auctionAddress)
        auction.endAuction({from:this.props.address, gas:100000})

      }
    }
  getTimeLeft(duration){
    if (duration < 0)
      return '00:00:00:00'
    // get total seconds between the times
    var delta = Math.round(Math.abs(duration) / 1000);

    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;
    if (days < 10) {
      days = '0' + days
    }
    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    if (hours < 10) {
      hours = '0' + hours
    }
    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    if (minutes < 10) {
      minutes = '0' + minutes
    }
    // what's left is seconds
    var seconds = delta % 60;  // in theory the modulus is not required

    if (seconds < 10) {
      seconds = '0' + seconds
    }
   return days + ':' + hours + ':' + minutes + ':' + seconds

  }

  bid(auctionItem) {
      AuctionContract.at(auctionItem.props.auctionAddress).bid({from:auctionItem.props.address, value: web3.toWei(auctionItem.state.bid, 'ether'), gas:100000},
      function(error, auction) {
        if (error) {
          toastr.error("Bid was not high enough.")
          return
        }
        fetch('http://localhost:8000/auctions/bid/' + auctionItem.props.auctionAddress, {
          method: 'PUT',
          body: JSON.stringify({bid: auctionItem.state.bid}),
          headers: {
              "Content-Type": "application/json"
          }
        }).then(function(response) {
            auctionItem.setState({highestBid: auctionItem.state.bid})
          }
        ).catch(function(error) {
          console.log('There has been a problem with your fetch operation: ' + error.message);
        });

      })
  }

  render(){
    const duration = this.props.endTime-this.state.date
    const durationFormatted = this.getTimeLeft(duration)
    return (
      <div>
        <h4>{this.props.name}</h4>
        <a target="_blank" href={'http://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=' + this.props.id}>
                            <img alt={this.props.name} style={{width:180}}  src={'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + this.props.id + '&type=card'}/></a>
        <p>Current Bid: {this.state.highestBid}<img style={{marginBottom: -5, width:18,height:22}}src={require('../assets/ethereum.png')} /></p>
        {
          (duration <= 60000) ? <p style={{color:'red'}}>Time Left: {durationFormatted}</p>: <p>Time Left: {durationFormatted}</p>
        }

        {(duration <= 0) ? <p> Auction Ended </p> : <div><input type="text" onChange={(event) => this.setState({bid: parseFloat(event.target.value)})}/> <button className='button' onClick={() => this.bid(this)}>Bid</button></div>}
      </div>
    );
  }
}
