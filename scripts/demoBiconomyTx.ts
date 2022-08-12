import { providers, Wallet, utils, constants } from 'ethers'
import { BiconomyFacet__factory, ERC20__factory } from '../typechain'
import { node_url } from '../utils/network'
import * as deployment from '../export/deployments-staging.json'

const LIFI_ADDRESS = deployment[100].xdai.contracts.LiFiDiamond.address
const usdtAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const amountToSwap = '20'
const destinationChainId = 100

async function main() {
  let wallet = Wallet.fromMnemonic(<string>process.env.MNEMONIC)
  const provider1 = new providers.JsonRpcProvider(node_url('polygon'))
  const provider = new providers.FallbackProvider([provider1])
  wallet = wallet.connect(provider)

  const lifi = BiconomyFacet__factory.connect(LIFI_ADDRESS, wallet)

  const token = ERC20__factory.connect(usdtAddress, wallet)
  const amount = utils.parseUnits(amountToSwap, 6)
  await token.approve(lifi.address, amount)

  const lifiData = {
    transactionId: utils.randomBytes(32),
    integrator: 'ACME Devs',
    referrer: constants.AddressZero,
    sendingAssetId: token.address,
    receivingAssetId: token.address,
    receiver: await wallet.getAddress(),
    destinationChainId: destinationChainId,
    amount: amount.toString(),
  }

  const BiconomyData = {
    token: token.address,
    amount: amount,
    recipient: await wallet.getAddress(),
    toChainId: destinationChainId,
  }

  await lifi.startBridgeTokensViaBiconomy(lifiData, BiconomyData, {
    gasLimit: 500000,
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
