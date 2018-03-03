import React, { Component } from 'react';
import './App.css';
import './toastr.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import CardList from './components/CardList'
import AuctionList from './components/AuctionList'
import TradeList from './components/TradeList'
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
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
    const app = this
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        toastr.error("No accounts found.")
      }
      console.log(accounts[1])
      app.setState({address:accounts[0]})
    })
  }



  render() {
    if (!this.state.address) {
      return (<div/>)
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
