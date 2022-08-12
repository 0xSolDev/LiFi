import { ethers, network } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { addOrReplaceFacets } from '../utils/diamond'
import { utils } from 'ethers'
import config from '../config/biconomy'

const VALID_NETWORKS = ['polygon', 'mumbai', 'goerli', 'mainnet', 'hardhat']

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!VALID_NETWORKS.includes(network.name)) {
    return
  }

  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  //const alice = await ethers.getSigners()
  //const deployer = alice[0].address
  const { deployer } = await getNamedAccounts()

  let biconomyRouter
  if (config[network.name].biconomyRouter == '') {
    await deploy('LiquidityPoolManager', {
      from: deployer,
      args: [deployer, deployer, deployer, deployer, 1],
      log: true,
      deterministicDeployment: true,
    })
    biconomyRouter = await ethers.getContract('LiquidityPoolManager')
    biconomyRouter = biconomyRouter.address
  } else {
    biconomyRouter = config[network.name].biconomyRouter
  }

  if (network.name == 'hardhat' || network.name == 'rinkeby') {
    await deploy('USDT', {
      from: deployer,
      args: [deployer, 'Tether USD', 'USDT'],
      log: true,
      deterministicDeployment: true,
    })
  }

  await deploy('BiconomyFacet', {
    from: deployer,
    log: true,
    deterministicDeployment: true,
  })

  const biconomyFacet = await ethers.getContract('BiconomyFacet')

  const diamond = await ethers.getContract('LiFiDiamond')

  const ABI = ['function initBiconomy(address)']
  const iface = new utils.Interface(ABI)

  const initData = iface.encodeFunctionData('initBiconomy', [biconomyRouter])

  await addOrReplaceFacets(
    [biconomyFacet],
    diamond.address,
    biconomyFacet.address,
    initData
  )
}

export default func
func.id = 'deploy_biconomy_facet'
func.tags = ['DeployBiconomyFacet']
func.dependencies = ['InitialFacets', 'LiFiDiamond', 'InitFacets']
