import React, { Component } from 'react';
import StackGrid from "react-stack-grid";
import AuctionItem from './AuctionItem'
import AuctionDialog from './AuctionDialog'
import {ModalManager} from 'react-dynamic-modal';


export default class AuctionList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      auctions: [],
      playerCards: []
    };
  }

  componentDidMount() {
    const auctionList = this
    this.fetchAuctions()
    fetch('http://localhost:8000/cards/' + this.props.address +'/', {
      method: 'GET',
      headers: {
          "Content-Type": "application/json"
      }
    }).then(function(response) {

      if (response.status == 200) {
        response.json().then(function(data) {
          auctionList.setState({playerCards: data.cards})
        })
        }
      })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });
  }


  openModal(){
      ModalManager.open(<AuctionDialog updateParent={this.fetchAuctions.bind(this)} address={this.props.address} cards={this.state.playerCards}/>);
  }

  fetchAuctions() {
    const auctionList = this
    fetch('http://localhost:8000/auctions/', {
      method: 'GET',
      headers: {
          "Content-Type": "application/json"
      }
    }).then(function(response) {

      if (response.status == 200) {
        response.json().then(function(data) {
          auctionList.setState({auctions: data.auctions})
        })
        }
      })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });

  }
  render(){
    const auctionList = this
    return (
      <div>
        <button className='button' onClick={this.openModal.bind(this)}>Put up a card for auction</button>
        <StackGrid columnWidth={250}>
          {this.state.auctions.map((auction) => <AuctionItem address={this.props.address} auctionAddress={auction.address} name={auction.name} id={auction.cardId} highestBid={auction.highestBid} endTime={new Date(auction.auctionEnd)}/>)}
        </StackGrid>
      </div>
    );
  }
}
