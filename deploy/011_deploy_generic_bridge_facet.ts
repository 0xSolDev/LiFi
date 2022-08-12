import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { addOrReplaceFacets } from '../utils/diamond'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await deploy('GenericBridgeFacet', {
    from: deployer,
    log: true,
    deterministicDeployment: true,
  })

  const genericBridgeFacet = await ethers.getContract('GenericBridgeFacet')

  const diamond = await ethers.getContract('LiFiDiamond')

  await addOrReplaceFacets([genericBridgeFacet], diamond.address)
}
export default func
func.id = 'deploy_generic_bridge_facet'
func.tags = ['DeployGenericBridgeFacet']
