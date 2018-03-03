import React, { Component } from 'react';
import StackGrid from "react-stack-grid";
import Trade from './Trade'
import TradeDialog from './TradeDialog'
import {ModalManager} from 'react-dynamic-modal';

export default class TradeList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      trades: [],
      playerCards: []
    };
  }

  componentDidMount() {
    const tradeList = this
    this.fetchTrades()
    fetch('http://localhost:8000/cards/' + this.props.address +'/', {
      method: 'GET',
      headers: {
          "Content-Type": "application/json"
      }
    }).then(function(response) {

      if (response.status == 200) {
        response.json().then(function(data) {
          tradeList.setState({playerCards: data.cards})
        })
        }
      })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });

  }

  openModal(){
      ModalManager.open(<TradeDialog updateParent={this.fetchTrades.bind(this)} address={this.props.address} cards={this.state.playerCards}/>);
  }

  fetchTrades() {
    const tradeList = this

        fetch('http://localhost:8000/trades/' + this.props.address + '/', {
          method: 'GET',
          headers: {
              "Content-Type": "application/json"
          }
        }).then(function(response) {

          if (response.status == 200) {
            response.json().then(function(data) {
              tradeList.setState({trades: data.trades})
            })
            }
          })
        .catch(function(error) {
          console.log('There has been a problem with your fetch operation: ' + error.message);
        });
  }

  render(){

    return (
      <div>
      <button className='button' onClick={this.openModal.bind(this)}>Start Trade</button>
      <StackGrid columnWidth={450}>
        {this.state.trades.map((trade) => <Trade address={this.props.address} updateParent={() => this.fetchTrades()} tradeAddress={trade.address} address1={trade.first_party} address2={trade.second_party} cards1={trade.first_party_items} cards2={trade.second_party_items}/>)}
      </StackGrid>

      </div>
    );
  }
}
