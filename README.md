## ERC20 token with Freeze, Airdrop and Bounty Functions

### 1. Specifications:

1. the account that deployes the contract is the `token contract owner`;
2. `contract owner` has all the tokens at the begining;
3. transfer funds between accounts;
4. owner can freeze any account to prevent tranferring funds out from these accounts;
5. owner can unfreeze accounts to enable transfer;
6. owner can return a list of all accounts that received tokens;

### 2. Install depencies

Currently support node.js v8.11.1

```
$ npm intall 
```

### 3. JS testing

* The token contract can be tested with `test/TestToken.js` file:

```
$ truffle test test/TestToken.js 
```

The result is similar to following:

<img src='img/testImage.jpg' width="600"/>


### 4. Deploy to Ropsten TestNet

deploy the contracts to ropsten network as:

```bash
$ truffle migrate --reset --network ropsten
```

### 5. Freeze Account with Webpage

Launch the web server in the root working directory:

```bash
$ npm run dev
```
Simply switch the proper network (e.g., rinkeby or mainnet) and login the owner account in MetaMask, and type in account address to be unfreezed and click button.

<img src='img/web.jpg' width="600"/>


