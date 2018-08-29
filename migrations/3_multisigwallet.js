const MultiSigWallet = artifacts.require('MultiSigWallet.sol')
const Token = artifacts.require('Token.sol')


const deployMultiSigWallet = async (deployer, network) => {
    const tokenAddress = Token.address
    const args = process.argv.slice()

    await deployer.deploy(
      MultiSigWallet,
      args[3].split(","),
      args[4],
      tokenAddress
    )
}

module.exports = deployMultiSigWallet
