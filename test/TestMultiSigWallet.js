var assert = require('assert');

/* global artifacts, assert, contract, describe, it */
/* eslint-disable no-console, max-len */

const Token = artifacts.require('Token.sol')
const MultiSigWallet = artifacts.require('MultiSigWallet.sol')
const web3 = MultiSigWallet.web3

const scale = 1e18

//const utils = require('./utils.js')

const deployMultisig = (owners, confirmations, tokenAddress) => {
    return MultiSigWallet.new(owners, confirmations, tokenAddress)
}
const deployToken = () => {
	return Token.new()
}

contract('MultiSigWallet', (accounts) => {

  let tokenInstance
  let multisigInstance

  const requiredConfirmations = 2

  beforeEach(async () => {
      tokenInstance = await deployToken()
      assert.ok(tokenInstance)
      multisigInstance = await deployMultisig([accounts[0], accounts[1]], requiredConfirmations, tokenInstance.address)
      assert.ok(multisigInstance)

      const nTokens = 5000000
      const balance = await tokenInstance.balanceOf.call(multisigInstance.address)
      assert.equal(balance.valueOf()/scale, nTokens)
      console.log(`MultiSigWallet contract has ${balance/scale} tokens now.`)
  })

  it('transfer funds to receiver with executeTransaction', async () => {
        // first owner submit and confirm the tx
        const transferEncoded = tokenInstance.contract.transfer.getData(accounts[1], 1000000*scale)
        let transferReceipt = await multisigInstance.submitTransaction(tokenInstance.address, 0, transferEncoded, {from: accounts[0]})
        console.log(`owner [0] submit and confirm transaction: transfer 1000000 tokens to owner [1]`)
        // get tx Id
        let transactionId = transferReceipt.logs[0].args.transactionId.toNumber()

        // should fail to transfer due to inadequate confirmations
        await multisigInstance.executeTransaction(transactionId, {from: accounts[0]})
        assert.equal(false, await multisigInstance.isExecuted(transactionId, {from: accounts[0]}))
        console.log(`transfer fails due to inadequate confirmations`)

        // second owner confirm the tx
        await multisigInstance.confirmTransaction(transactionId, {from: accounts[1]})
        console.log(`owner [1] confirms the transaction`)
        // confirm the tx is confimed
        assert.equal(true, await multisigInstance.isConfirmed(transactionId, {from: accounts[1]}))
        console.log(`transfer has been confirmed by two owners.`)
        // any user can trigger the transaction
        await multisigInstance.executeTransaction(transactionId, {from: accounts[1]})
        assert.equal(true, await multisigInstance.isExecuted(transactionId, {from: accounts[1]}))
        console.log(`transfer done`)

        // Check that the transfer has actually occured
        let balance =  await tokenInstance.balanceOf.call(accounts[1])
        assert.equal(1000000, balance.valueOf()/scale)
  })

})
