import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { DiamondLoupeFacet } from '../typechain'
import { removeFacet } from '../utils/diamond'

const func: DeployFunction = async function () {
  const diamond = await ethers.getContract('LiFiDiamond')

  const loupe: DiamondLoupeFacet = <DiamondLoupeFacet>(
    await ethers.getContractAt('DiamondLoupeFacet', diamond.address)
  )

  const facets: string[] = await loupe.facetAddresses()

  console.log('Removing old NXTPFacet...')
  let needsRemoval = false

  if (facets.includes('0xCD2411BEF722cff7c603dD850c4e80f87f31a892')) {
    needsRemoval = true
    await removeFacet(
      ['0xcd561f83', '0x3b103f66', '0x5a555b4e', '0x8b74a0dc'],
      diamond.address
    )
  }

  if (facets.includes('0x7f8773cc0B250c2c58CcDAdF023a0a1Ed666691f')) {
    needsRemoval = true
    await removeFacet(['0xcacdc79d', '0x250bf548'], diamond.address)
  }

  if (facets.includes('0x6FCcb684ea8326Be5C972830Cfd457b714f4aE9B')) {
    needsRemoval = true
    await removeFacet(['0x8ac4d8b1', '0xcc1c6b2f'], diamond.address)
  }

  if (facets.includes('0x8E33a5774856DE3c684694542d5BebcB9f9119C8')) {
    needsRemoval = true
    await removeFacet(['0xd41fc708', '0xaaefbde3'], diamond.address)
  }

  if (!needsRemoval) {
    console.log('Nothing to remove.')
  }
}
export default func
func.id = 'remove_old_nxtp_facet'
func.tags = ['RemoveOldNXTPFacet']
