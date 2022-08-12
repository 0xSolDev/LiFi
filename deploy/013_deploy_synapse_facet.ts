import { utils } from 'ethers'
import { ethers, network } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { addOrReplaceFacets } from '../utils/diamond'
import config from '../config/synapse'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  let bridgeAddr = '0x6571d6be3d8460cf5f7d6711cd9961860029d85f'
  let chainId = 1

  const { deployer } = await getNamedAccounts()

  await deploy('SynapseFacet', {
    from: deployer,
    log: true,
    deterministicDeployment: true,
  })

  const synapseFacet = await ethers.getContract('SynapseFacet')
  const diamond = await ethers.getContract('LiFiDiamond')

  const ABI = ['function initSynapse(address, uint256)']
  const iface = new utils.Interface(ABI)

  if (config[network.name].synapse != '') {
    bridgeAddr = config[network.name].synapse
    chainId = config[network.name].chainId
  }

  const initData = iface.encodeFunctionData('initSynapse', [
    bridgeAddr,
    chainId,
  ])

  await addOrReplaceFacets(
    [synapseFacet],
    diamond.address,
    synapseFacet.address,
    initData
  )
}
export default func
func.id = 'deploy_synapse_facet'
func.tags = ['DeploySynapseFacet']
func.dependencies = ['InitialFacets', 'LiFiDiamond', 'InitFacets']
