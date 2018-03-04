import React, { Component } from 'react';
import './App.css';
import './toastr.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import CardList from './components/CardList'
import AuctionList from './components/AuctionList'
import TradeList from './components/TradeList'
var web3
const Web3 = require('web3');
const toastr = require('toastr');
toastr.options.closeButton = true;


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      address: ''
    };
  }

  componentWillMount() {
    if (typeof window.web3 !== 'undefined') {
        web3 = new Web3(window.web3.currentProvider);
        this.setState({address: web3.eth.coinbase})
    } else {
        console.log('No web3? You should consider trying MetaMask!')
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
  }




  render() {
    if (!this.state.address) {
      toastr.error("<a href='http://metamask.io'>MetaMask</a> is required to use this application.")
    }
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Crypto Magic the Gathering</h1>
        </header>
        <Tabs>
          <TabList>
            <Tab>My Cards</Tab>
            <Tab>Cards on Auction</Tab>
            <Tab>Trades</Tab>
          </TabList>

          <TabPanel>
            <CardList address={this.state.address}/>
          </TabPanel>
          <TabPanel>
            <AuctionList address={this.state.address}/>
          </TabPanel>
          <TabPanel>
            <TradeList address={this.state.address}/>
          </TabPanel>
      </Tabs>
      </div>
    );
  }
}

export default App;
