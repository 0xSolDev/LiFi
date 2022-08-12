import { ethers, network } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { addOrReplaceFacets } from '../utils/diamond'
import { utils } from 'ethers'
import config from '../config/wormhole'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  //const alice = await ethers.getSigners()
  //const deployer = alice[0].address
  const { deployer } = await getNamedAccounts()

  let wormholeRouter
  if (config[network.name].wormholeRouter == '') {
    await deploy('Bridge', {
      from: deployer,
      log: true,
      deterministicDeployment: true,
    })
    wormholeRouter = await ethers.getContract('Bridge')
    wormholeRouter = wormholeRouter.address
  } else {
    wormholeRouter = config[network.name].wormholeRouter
  }

  if (network.name == 'hardhat' || network.name == 'rinkeby') {
    await deploy('USDT', {
      from: deployer,
      args: [deployer, 'Tether USD', 'USDT'],
      log: true,
      deterministicDeployment: true,
    })
  }

  await deploy('WormholeFacet', {
    from: deployer,
    log: true,
    deterministicDeployment: true,
  })

  const wormholeFacet = await ethers.getContract('WormholeFacet')

  const diamond = await ethers.getContract('LiFiDiamond')

  const ABI = ['function initWormhole(address)']
  const iface = new utils.Interface(ABI)

  const initData = iface.encodeFunctionData('initWormhole', [wormholeRouter])

  await addOrReplaceFacets(
    [wormholeFacet],
    diamond.address,
    wormholeFacet.address,
    initData
  )
}

export default func
func.id = 'deploy_wormhole_facet'
func.tags = ['DeployWormholeFacet']
func.dependencies = ['InitialFacets', 'LiFiDiamond', 'InitFacets']
