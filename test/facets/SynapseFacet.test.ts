import { ERC20__factory, SynapseFacet } from '../../typechain'
// import { expect } from '../chai-setup'
import { deployments, network } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers'
import { constants, Contract, utils } from 'ethers'
import { node_url } from '../../utils/network'
import { expect } from '../chai-setup'
//commented for being unused
//import { send } from 'process'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const UNISWAP_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const SYNAPSE_ADDRESS = '0x6571d6be3d8460cf5f7d6711cd9961860029d85f'
const nUSD = '0x1B84765dE8B7566e4cEAF4D0fD3c5aF52D3DdE4F'

describe('SynapseFacet', function () {
  let alice: SignerWithAddress
  let lifi: SynapseFacet
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let owner: any
  let lifiData: any
  let SynapseData: any
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const setupTest = deployments.createFixture(
    async ({ deployments, ethers }) => {
      await deployments.fixture()

      console.log(network.name)

      owner = await ethers.getSigners()
      owner = owner[0]
      const diamond = await ethers.getContract('LiFiDiamond')
      lifi = <SynapseFacet>(
        await ethers.getContractAt('SynapseFacet', diamond.address)
      )
      console.log('diamond Address', lifi.address)

      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: ['0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503'],
      })

      alice = await ethers.getSigner(
        '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503'
      )

      lifiData = {
        transactionId: utils.randomBytes(32),
        integrator: 'ACME Devs',
        referrer: constants.AddressZero,
        sendingAssetId: USDC_ADDRESS,
        receivingAssetId: USDC_ADDRESS,
        receiver: alice.address,
        destinationChainId: 137,
        amount: '2000000',
      }

      const deadline = Math.floor(Date.now() / 1000) + 10 // 10s from the current Unix time

      console.log('deadline', deadline, utils.parseUnits('200000', 6))
      SynapseData = {
        to: alice.address,
        chainId: 137,
        token: USDC_ADDRESS,
        nUSD: nUSD,
        amount: '2000000',
        minToMint: '1900000',
        liqDeadline: deadline,
        tokenIndexFrom: 0,
        tokenIndexTo: 0,
        minDy: '900000',
        swapDeadline: deadline + 90000,
      }
      lifi.connect(owner).initSynapse(SYNAPSE_ADDRESS, 1, {
        gasLimit: 500000,
      })
    }
  )

  before(async function () {
    this.timeout(0)
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: node_url('mainnet'),
            blockNumber: 13798171,
          },
        },
      ],
    })
  })

  beforeEach(async function () {
    this.timeout(0)
    await setupTest()
  })

  // it('starts a bridge transaction on the sending chain', async function () {
  //   // Approve ERC20 for swapping
  //   const token = await ERC20__factory.connect(USDC_ADDRESS, alice)
  //   await token.approve(lifi.address, utils.parseUnits('200000', 6))

  //   await expect(
  //     lifi.connect(alice).startBridgeTokensViaSynapse(lifiData, SynapseData, {
  //       gasLimit: 500000,
  //     })
  //   ).to.emit(lifi, 'LiFiTransferStarted')
  // })

  it('performs a swap then starts bridge transaction on the sending chain', async function () {
    const amountIn = '2500000'
    const amountOut = '2000000' // 1 TestToken

    const to = lifi.address // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time

    const uniswap = new Contract(
      UNISWAP_ADDRESS,
      [
        'function exactOutputSingle(tuple(address,address,uint24,address,uint256,uint256,uint256,uint160)) external payable returns (uint256)',
      ],
      alice
    )

    // Generate swap calldata
    const swapData = await uniswap.populateTransaction.exactOutputSingle([
      USDT_ADDRESS,
      USDC_ADDRESS,
      3000,
      to,
      deadline,
      amountOut,
      amountIn,
      0,
    ])

    // SynapseData = {
    //   to: alice.address,
    //   chainId: 137,
    //   token: USDT_ADDRESS,
    //   amount: utils.parseUnits('1000', 6),
    // }

    SynapseData = {
      to: alice.address,
      chainId: 137,
      token: USDC_ADDRESS,
      nUSD: nUSD,
      amount: '2000000',
      minToMint: '1900000',
      liqDeadline: deadline,
      tokenIndexFrom: 0,
      tokenIndexTo: 2,
      minDy: '900000',
      swapDeadline: deadline + 90000,
    }

    // Approve ERC20 for swapping
    const token = ERC20__factory.connect(USDT_ADDRESS, alice)
    await token.approve(lifi.address, amountIn)

    const token1 = ERC20__factory.connect(USDC_ADDRESS, alice)
    await token1.approve(lifi.address, amountIn)

    await expect(
      lifi.connect(alice).swapAndStartBridgeTokensViaSynapse(
        lifiData,
        [
          {
            callTo: <string>swapData.to,
            approveTo: <string>swapData.to,
            sendingAssetId: USDT_ADDRESS,
            receivingAssetId: USDC_ADDRESS,
            callData: <string>swapData?.data,
            fromAmount: amountIn,
          },
        ],
        SynapseData,
        { gasLimit: 500000 }
      )
    )
      .to.emit(lifi, 'AssetSwapped')
      .and.to.emit(lifi, 'LiFiTransferStarted')
  })
})
