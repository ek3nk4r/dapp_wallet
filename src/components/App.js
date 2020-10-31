import WalletConnectProvider from '@walletconnect/web3-provider';
import wcLogo from '../logos/WalletConnect.png';
import wmLogo from '../logos/Web3Modal.png';
import mmLogo from '../logos/MetaMask.png';
import wallet from '../logos/wallet.png';
import Identicon from 'react-identicons';
import React, { Component } from 'react';
import { getChain } from 'evm-chains';
import eth from '../logos/eth.png';
import Web3Modal from 'web3modal';
import Web3 from 'web3';
import './App.css';

class App extends Component {

  async componentWillMount() {
    await this.init()
  }

  init() {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "451d695dfee84d79815ebdfcb961da08",
        }
      }
    };

    var web3Modal = new Web3Modal({
      cacheProvider: true, // optional
      providerOptions, // required
      disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    });

    this.setState({web3Modal: web3Modal})
    window.ethereum.autoRefreshOnNetworkChange = false;
  }

  async on(event) {
    event.preventDefault()
    await this.state.web3Modal.clearCachedProvider();

    try {
      let provider, account, network, balance, web3
      provider = await this.state.web3Modal.connect();
      console.log('provider: ', provider)

      if(provider.isMetaMask){
        account = provider.selectedAddress
        network = await getChain(parseInt(provider.chainId, 16))
        web3 = new Web3(provider)
        balance = await web3.eth.getBalance(provider.selectedAddress)
      } else if (provider.wc){
        account = provider.accounts[0]
        network = await getChain(provider.chainId)
        web3 = new Web3(new Web3.providers.HttpProvider(`https://${network.network}.infura.io/v3/db6231b5ef424bd9a61a76670e56086b`));
        balance = await web3.eth.getBalance(account)
      } else {
        window.alert('Error, provider not recognized')
      }

      this.setState({
        web3: web3,
        account: account,
        balance: balance,
        provider: provider,
        network: network.network,
      })

    } catch(e) {
      console.log("Could not get a wallet connection", e);
      return;
    }

    // Update account&balance
    this.state.provider.on("accountsChanged", async (accounts) => {
      let account, balance, network, web3

      if(this.state.provider.isMetaMask && this.state.provider.selectedAddress!==null){
        web3 = new Web3(this.state.provider)
        balance = await web3.eth.getBalance(this.state.provider.selectedAddress)
      } else if (this.state.provider.wc){
        account = this.state.provider.accounts[0]
        //network = returnNetworkName(this.state.provider.chainId)
        network = await getChain(this.state.provider.chainId)
        web3 = new Web3(new Web3.providers.HttpProvider(`https://${network.network}.infura.io/v3/db6231b5ef424bd9a61a76670e56086b`));
        balance = await web3.eth.getBalance(account)
      }
      this.setState({
        account: accounts[0],
        balance: balance
      })
    });

    // Update network
    this.state.provider.on("chainChanged", async (chainId) => {
      let account, balance, network, web3

      if(this.state.provider.isMetaMask){
        web3 = new Web3(this.state.provider)
        balance = await web3.eth.getBalance(this.state.provider.selectedAddress)
        network = await getChain(parseInt(this.state.provider.chainId, 16))
      } else if (this.state.provider.wc){
        account = this.state.provider.accounts[0]
        network = await getChain(chainId)
        web3 = new Web3(new Web3.providers.HttpProvider(`https://${network.network}.infura.io/v3/db6231b5ef424bd9a61a76670e56086b`));
        balance = await web3.eth.getBalance(account)
      }

      this.setState({
        balance: balance,
        network: network.network
      })
    });
  }

  async off(event) {
    event.preventDefault()
    console.log("Killing the wallet connection", this.state.provider);

    if(this.state.provider.isMetaMask) {
      await this.state.provider.close  //MetaMask
    } else if (this.state.provider.wc) {
      await this.state.provider.stop() //WalletConnnect
      await this.state.provider.disconnect() //Off QRcode
    } else {
      window.location.alert('Error')
    }

    this.setState({web3: null});
    this.setState({account: null});
    this.setState({balance: null});
    this.setState({network: null});
    this.setState({provider: null});

    await this.state.web3Modal.clearCachedProvider();
  }

  async send(event){
    event.preventDefault()

    if(this.state.provider.isMetaMask){
      this.state.web3.eth.sendTransaction({from: this.state.account, to: this.state.account, value: '1'})
    } else if (this.state.provider.wc){
      window.alert('Accept on phone')

      //Declare data for JSON RPC request
      const from = this.state.account
      const to = this.state.account
      const value = 1 //1 wei

      //request
      const tx = {
        "method": "eth_sendTransaction",
        "params": [{ from, to, value }]
      }

      try {
        await this.state.provider.request(tx)
      } catch (error) {
        console.log('error: ', error)
        return;
      }
    } else {
      window.alert('Error, problem with the provider.')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
    }
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow text-monospace text-white">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          > 
          <img src={wallet} className="App-logo" alt="logo" height="32"/>
            <b> DApp Wallet </b>
          </a>
            <ul className="navbar-nav px-3 text-white">
              { ! this.state.account
                ? <div className="row text-center text-monospace">
                    <button
                      type="submit"
                      onClick={(e) => this.on(e)}
                      className="btn btn-outline-success btn-sm"
                      style={{ width: '125px', fontSize: '17px'}}
                      ><b>Connect</b>
                    </button>&nbsp;
                  </div>
                : <div className="row text-center">
                    <button
                      type="submit"
                      onClick={(e) => this.off(e)}
                      className="btn btn-outline-danger btn-sm"
                      style={{ width: '125px', fontSize: '17px'}}
                      >Disconnect
                    </button>&nbsp;
                  </div>
              }
            </ul>
        </nav>&nbsp;
        <div className="container-fluid mt-5 text-center">
          <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ width: '750px' }}>
            <a
                href="http://www.dappuniversity.com/bootcamp"
                target="_blank"
                rel="noopener noreferrer"
              >
              { typeof this.state.provider==='undefined' || this.state.provider===null 
                ?  <figure>
                     <img src={wmLogo} className="App-logo" alt="logo" width='256px'/>
                     <figcaption
                        style={{ width: '512px', fontSize: '14px'}}
                        className="text-right text-monospace text-dark">
                        Connection: none
                      </figcaption>
                   </figure>
                :  this.state.provider.isMetaMask
                     ? <figure>
                         <img src={mmLogo} className="App-logo" alt="logo" width='256px'/>
                          <figcaption
                            style={{ width: '512px', fontSize: '14px'}}
                            className="text-right text-monospace text-dark">
                            Connection: MetaMask
                          </figcaption>
                       </figure>
                     : <figure>
                         <img src={wcLogo} className="App-logo" alt="logo" width='256px'/>
                          <figcaption
                            style={{ width: '512px', fontSize: '14px'}}
                            className="text-right text-monospace text-dark">
                            Connection: WalletConnect
                          </figcaption>
                        </figure>
              }
            </a>
            <p></p>&nbsp;
            <table className="table-sm table-bordered border-dark text-monospace table-responsive">
              <thead>
                <tr className="bg-dark text-white">
                  <th>Account</th>
                  <th>Balance</th>
                  <th>Network</th>
                </tr>
                <tr>
                  {  !  this.state.account
                     ?  <td style={{ width: '500px' }}>
                          ---
                        </td>
                     :  <td style={{ width: '500px'}}>
                          <Identicon string={this.state.account} size="25" className='align-text-bottom' bg='#343A40'/>&nbsp;
                          { this.state.network==='mainnet'
                            ? <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={"https://etherscan.io/address/" + this.state.account}>
                                <b>{this.state.account}</b>
                              </a>
                            : <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://${this.state.network+'.'}etherscan.io/address/`+this.state.account}>
                                <b>{this.state.account}</b>
                              </a>
                          }
                        </td>
                  }{ !  this.state.balance 
                     ?  <td style={{ width: '125px'}}>
                          ---
                        </td>
                     :  <td style={{ width: '125px'}}>
                          <b>{(this.state.balance/10**18).toFixed(5)}</b>
                          <img src={eth} className="align-text-bottom" height="20" alt="id" />
                        </td>
                  }{ !  this.state.network 
                     ?  <td style={{ width: '125px'}}>
                          ---
                        </td>
                     :  <td style={{ width: '125px'}}>
                          <b>{this.state.network}</b>
                        </td>
                  }
                </tr>
              </thead>
            </table>
              &nbsp;
              { this.state.account 
                ? <div className="row text-center text-monospace">
                    <button
                      type="submit"
                      onClick={(e) => this.send(e)}
                      className="btn btn-primary btn-sm mx-auto"
                      style={{ width: '375px', fontSize: '17px' }}
                      ><b>Send 1 wei to yourself</b>
                    </button>
                  </div>
                : <div className="row text">&nbsp;&nbsp;</div>
              }&nbsp;
              <div className="text-left text-secondary text-monospace" style={{ width: '500px' }}>
                &nbsp;
                <p>Example of DApp-wallet connection.</p>
                <p>No more refreshing the page to see changes.</p>
                <p>#JS #React #Web3Modal #MetaMask #WalletConnect</p>
                <br></br>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={"https://github.com/xternet/dapp_wallet"}>
                  <b>source_code</b>
                </a>
              </div>
          </main>
        </div>
      </div>
    );
  }
}

export default App;