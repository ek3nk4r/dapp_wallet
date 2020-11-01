import WalletConnectProvider from '@walletconnect/web3-provider';
import React, { Component } from 'react';
import { getChain } from 'evm-chains';
import Web3Modal from 'web3modal';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';

/* T0d0
[ ] auto mm
[x] loading
[ ] readMe gif
[x] navbar main
*/

class App extends Component {

  async componentWillMount() {
    await this.init()
  }

  async init() {
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

    //Setting for MetaMask
    if(typeof window.ethereum!=='undefined'){
      let network, balance, web3

      window.ethereum.autoRefreshOnNetworkChange = false;
      web3 = new Web3(window.ethereum)
      this.setState({web3: web3})


      window.ethereum.on('accountsChanged', async (accounts) => {
        if(typeof accounts[0] === 'undefined') {
          this.setState({
            account: null,
            balance: null
          })
        } else {
          this.setState({account: null, balance: null, loading: true})
          balance = await web3.eth.getBalance(accounts[0])

          this.setState({
            account: accounts[0],
            balance: balance,
            loading: false
          })
        }
      });

      window.ethereum.on('chainChanged', async (chainId) => {
        this.setState({network: null, balance: null, loading: true})
        network = await getChain(parseInt(chainId, 16))

        if(this.state.account!==null){
          balance = await web3.eth.getBalance(this.state.account)
        }

        this.setState({
          network: network.network,
          balance: balance,
          loading: false
        })
      });
    }
  }

  async on(event) {
    event.preventDefault()
    await this.state.web3Modal.clearCachedProvider();

    try {
      let provider, account, network, balance, web3
      provider = await this.state.web3Modal.connect();
      console.log('provider: ', provider)

      this.setState({
        loading: true,
        provider: null
      }) 

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
        loading: false,
        account: account,
        balance: balance,
        provider: provider,
        network: network.network
      })

    } catch(e) {
      console.log("Could not get a wallet connection", e);
      return;
    }

    // Update account&balance
    this.state.provider.on("accountsChanged", async (accounts) => {
      let account, balance, network, web3

      this.setState({
        account: null,
        balance: null,
        loading: true
      })      

      if(this.state.provider.isMetaMask && this.state.provider.selectedAddress!==null){
        web3 = new Web3(this.state.provider)
        balance = await web3.eth.getBalance(this.state.provider.selectedAddress)
      } else if (this.state.provider.wc){
        account = this.state.provider.accounts[0]
        network = await getChain(this.state.provider.chainId)
        web3 = new Web3(new Web3.providers.HttpProvider(`https://${network.network}.infura.io/v3/db6231b5ef424bd9a61a76670e56086b`));
        balance = await web3.eth.getBalance(account)
      }
      this.setState({
        account: accounts[0],
        balance: balance,
        loading: false
      })
    });

    // Update network
    this.state.provider.on("chainChanged", async (chainId) => {
      let account, balance, network, web3
      
      this.setState({
        loading: true,
        network: null,
        balance: null
      })

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
        network: network.network,
        loading: false
      })
    });
  }

  async off(event) {
    event.preventDefault()

    if(this.state.provider===null){
      window.alert('Logout on MetaMask')
    } else {
      if(this.state.provider!==null && this.state.provider.wc) {
        await this.state.provider.stop() //WalletConnnect
        // await this.state.provider.disconnect() //Off QRcode
      } else if (this.state.provider!==null && this.state.provider.isMetaMask) {
        await this.state.provider.close
      } 
      this.setState({web3: null});
      this.setState({account: null});
      this.setState({balance: null});
      this.setState({network: null});
      this.setState({provider: null});

      await this.state.web3Modal.clearCachedProvider();
    }
  }

  async send(event){
    event.preventDefault()

    if(this.state.provider===null && !this.state.account) {
      window.alert('Error')
    } else if (this.state.provider===null && this.state.account) {
      this.state.web3.eth.sendTransaction({from: this.state.account, to: this.state.account, value: '1'})
    } else if(this.state.provider.isMetaMask || this.state.provider===null){
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
      }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: null,
      balance: null,
      loading: false,
      network: null,
      provider: null
    }

   this.on = this.on.bind(this)
   this.off = this.off.bind(this)
   this.send = this.send.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar
          on={this.on}
          off={this.off}
          account={this.state.account}
          loading={this.state.loading}
        />&nbsp;
        <Main
          send={this.send}
          account={this.state.account}
          balance={this.state.balance}
          loading={this.state.loading}
          network={this.state.network}
          provider={this.state.provider}
        />
      </div>
    );
  }
}

export default App;