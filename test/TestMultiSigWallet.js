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

  it('transfer funds to receiver', async () => {
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

  it('test execution after requirements changed', async () => {
        // Add owner wa_4
        const addOwnerData = multisigInstance.contract.addOwner.getData(accounts[3])
        let transferReceipt = await multisigInstance.submitTransaction(multisigInstance.address, 0, addOwnerData, {from: accounts[0]})
        const transactionId = transferReceipt.logs[0].args.transactionId.toNumber()
        // the other owner confirms
        await multisigInstance.confirmTransaction(transactionId, {from: accounts[1]})
        // execute the transaction
        await multisigInstance.executeTransaction(transactionId, {from: accounts[0]})
        assert.equal(true, await multisigInstance.isExecuted(transactionId, {from: accounts[0]}))
        console.log(`add new owner with adequate confirmations`)

        // at this time, there are 3 owners but only 2 confirmations are required
        const transferEncoded = tokenInstance.contract.transfer.getData(accounts[1], 1000000*scale)
        let transferReceipt2 = await multisigInstance.submitTransaction(tokenInstance.address, 0, transferEncoded, {from: accounts[0]})
        let transactionId2 = transferReceipt2.logs[0].args.transactionId.toNumber()
        await multisigInstance.confirmTransaction(transactionId2, {from: accounts[1]})
        await multisigInstance.executeTransaction(transactionId2, {from: accounts[0]})
        assert.equal(true, await multisigInstance.isExecuted(transactionId2, {from: accounts[0]}))
        console.log(`transfer succeeds with 2 confirmations out of 3 owners`)


        // Update requiredConfirmations to 3
        const newRequired = 3
        const updateRequirementData = multisigInstance.contract.changeRequirement.getData(newRequired)
        let transferReceipt3 = await multisigInstance.submitTransaction(multisigInstance.address, 0, updateRequirementData, {from: accounts[0]})
        const transactionId3 = transferReceipt3.logs[0].args.transactionId.toNumber()
        // Confirm change requirement transaction
        await multisigInstance.confirmTransaction(transactionId3, {from: accounts[1]})
        await multisigInstance.executeTransaction(transactionId3, {from: accounts[0]})
        assert.equal(true, await multisigInstance.isExecuted(transactionId3, {from: accounts[0]}))
        console.log(`update requirements to 3 confirmations`)

        // transfer fund with 2 confirmations will fail
        const transferEncoded2 = tokenInstance.contract.transfer.getData(accounts[3], 1000000*scale)
        let transferReceipt4 = await multisigInstance.submitTransaction(tokenInstance.address, 0, transferEncoded2, {from: accounts[0]})
        let transactionId4 = transferReceipt4.logs[0].args.transactionId.toNumber()
        await multisigInstance.confirmTransaction(transactionId4, {from: accounts[1]})
        // only two confirmation, tx will fail
        await multisigInstance.executeTransaction(transactionId4, {from: accounts[0]})
        assert.equal(false, await multisigInstance.isExecuted(transactionId4, {from: accounts[0]}))
        console.log(`transfer fails with 2 confirmations out of 3 owners`)


        await multisigInstance.confirmTransaction(transactionId4, {from: accounts[3]})
        await multisigInstance.executeTransaction(transactionId4, {from: accounts[0]})
        assert.equal(true, await multisigInstance.isExecuted(transactionId4, {from: accounts[0]}))
        console.log(`transfer succeeds with 3 confirmations from 3 owners`)


    })

})
