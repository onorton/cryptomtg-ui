import React, { Component } from 'react';
import {ModalManager} from 'react-dynamic-modal';
import AddItemDialog from './AddItemDialog'
import RemoveItemDialog from './RemoveItemDialog'

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const toastr = require('toastr');

const tradeInfo = require('../truffle/build/contracts/Trade.json')
const cardInfo = require('../truffle/build/contracts/Card.json')
const TradeContract = web3.eth.contract(tradeInfo.abi);
const CardContract = web3.eth.contract(cardInfo.abi);

export default class Trade extends Component {
  componentWillMount() {
    const trade = this
    const opposite = (trade.props.address1 ==  trade.props.address) ? trade.props.address2 : trade.props.address1
    const tradeInstance = TradeContract.at(this.props.tradeAddress)
    tradeInstance.TradeRejected(function(error, event) {
      if(!error) {
        if (event.args.rejecter != trade.props.address) {
          toastr.warning(event.args.rejecter + " rejected the trade.")
        }
        trade.props.updateParent()
      }
    })

    tradeInstance.TradeSuccessful(function(error, event) {
      if(!error) {
        toastr.success("Congratulations! You and " + opposite + " have agreed on a trade.")

        trade.props.cards1.map((card) => {
          fetch('http://localhost:8000/cards/transfer/'+card.id, {
            method: 'PUT',
            body: JSON.stringify({address: trade.props.address2}),
            headers: {
                "Content-Type": "application/json"
            }
          }).then(function(response) {

            }
          ).catch(function(error) {
            console.log('There has been a problem with your fetch operation: ' + error.message);
          });
        })

        trade.props.cards2.map((card) => {
            fetch('http://localhost:8000/cards/transfer/'+card.id, {
              method: 'PUT',
              body: JSON.stringify({address:  trade.props.address1}),
              headers: {
                  "Content-Type": "application/json"
              }
            }).then(function(response) {

              }
            ).catch(function(error) {
              console.log('There has been a problem with your fetch operation: ' + error.message);
            });
        })

        fetch('http://localhost:8000/trades/'+trade.props.address + '/', {
          method: 'DELETE',
          body: JSON.stringify({address:  trade.props.tradeAddress}),
          headers: {
              "Content-Type": "application/json"
          }
        }).then(function(response) {
          }
        ).catch(function(error) {
          console.log('There has been a problem with your fetch operation: ' + error.message);
        });
        trade.props.updateParent()

      }
    })

    tradeInstance.ItemAdded(function(error, event) {
      if(!error) {
        if (event.args.owner != trade.props.address) {
          toastr.warning(opposite + " added a copy of " + CardContract.at(event.args.card).name() + " to a trade.")
        }
        trade.props.updateParent()
      }
    })

    tradeInstance.ItemRemoved(function(error, event) {
      if(!error) {
        if (event.args.owner != trade.props.address) {
          toastr.warning(opposite + " removed a copy of " + CardContract.at(event.args.card).name() + " from a trade.")
        }
        trade.props.updateParent()
      }
    })
  }

  shortenAddress(address) {
    var shortenedAddress = address.slice(0, -24) + '...'
    if (address == this.props.address) {
      shortenedAddress += ' (You)'
    }
    return shortenedAddress


  }

  accept() {
    const tradeInstance = TradeContract.at(this.props.tradeAddress)
    console.log(tradeInstance.firstAccepted())
    console.log(tradeInstance.secondAccepted())
    tradeInstance.accept({from: this.props.address, gas:100000})

  }

  reject(trade) {
    const opposite = (trade.props.address1 ==  trade.props.address) ? trade.props.address2 : trade.props.address1
    const tradeInstance = TradeContract.at(trade.props.tradeAddress)
    tradeInstance.reject({from: trade.props.address, gas:100000},
    function(error, transaction) {
      if (!error) {
        // transfer cards back
        trade.props.cards1.map((card) => {
          fetch('http://localhost:8000/cards/transfer/'+card.id, {
            method: 'PUT',
            body: JSON.stringify({address: trade.props.address1}),
            headers: {
                "Content-Type": "application/json"
            }
          }).then(function(response) {


            }
          ).catch(function(error) {
            console.log('There has been a problem with your fetch operation: ' + error.message);
          });
        })

        trade.props.cards2.map((card) => {
            fetch('http://localhost:8000/cards/transfer/'+card.id, {
              method: 'PUT',
              body: JSON.stringify({address:  trade.props.address2}),
              headers: {
                  "Content-Type": "application/json"
              }
            }).then(function(response) {


              }
            ).catch(function(error) {
              console.log('There has been a problem with your fetch operation: ' + error.message);
            });
        })

        fetch('http://localhost:8000/trades/'+trade.props.address + '/', {
          method: 'DELETE',
          body: JSON.stringify({address:  trade.props.tradeAddress}),
          headers: {
              "Content-Type": "application/json"
          }
        }).then(function(response) {
            toastr.warning("You ended a trade with " + opposite + ".")
          }
        ).catch(function(error) {
          console.log('There has been a problem with your fetch operation: ' + error.message);
        });

      }
    })

  }

  openRemoveItem(){
    const trade = this
    if (trade.props.address1 == trade.props.address) {
      ModalManager.open(<RemoveItemDialog address={trade.props.address} tradeAddress={trade.props.tradeAddress} cards={trade.props.cards1}/>);
    } else {
      ModalManager.open(<RemoveItemDialog address={trade.props.address} tradeAddress={trade.props.tradeAddress} cards={trade.props.cards2}/>);
    }
  }

  openAddItem(){
    const trade = this
    fetch('http://localhost:8000/cards/' + trade.props.address +'/', {
      method: 'GET',
      headers: {
          "Content-Type": "application/json"
      }
    }).then(function(response) {
      if (response.status == 200) {
        response.json().then(function(data) {
          ModalManager.open(<AddItemDialog address={trade.props.address} tradeAddress={trade.props.tradeAddress} cards={data.cards}/>);
        })
        }
      })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });
  }
  render(){
    return (
      <div style={{borderStyle:'solid', borderRadius: '25px', padding: 5, borderWidth: 2}}>
      <div style={{overflow:'auto',height: 'auto', marginBottom:20, paddingLeft:20, paddingRight:20}}>
        <div style={{float:'left'}}>
          <h4>{this.shortenAddress(this.props.address1)}</h4>
          <ul style={{listStyleType: 'none', padding: 0, margin: 0}}>
           {
            this.props.cards1.map(
           (card) => <li style={{padding: '5px 0px 5px 0px'}}>  <a target="_blank" href={'http://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=' + card.cardId}>
                                 <img alt={card.name} style={{width:175}} src={'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + card.cardId + '&type=card'}/></a></li>
                   )}
           </ul>
        </div>
        <div style={{float:'right'}}>
          <h4>{this.shortenAddress(this.props.address2)}</h4>
          <ul style={{listStyleType: 'none', padding: 0, margin: 0}}>
           {
            this.props.cards2.map(
           (card) => <li style={{padding: '5px 0px 5px 0px'}}>  <a target="_blank" href={'http://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=' + card.cardId}>
                                 <img alt={card.name} style={{width:175}} src={'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + card.cardId + '&type=card'}/></a></li>
                   )}
           </ul>
        </div>
        </div>
        <div style={{bottom:10}}>
          <button className='accept' onClick={() => this.accept()}>Accept</button>
          <button className='button' onClick={() => this.openAddItem()}>Add Card</button>
          <button className='button'onClick={() => this.openRemoveItem()}>Remove Card</button>
          <button className='reject' onClick={() => this.reject(this)}>Reject</button>
        </div>
      </div>
    );
  }
}
