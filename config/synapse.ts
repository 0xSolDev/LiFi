interface synapseConfig {
  [key: string]: {
    synapse: string
    chainId: number
  }
}
//0x552008c0f6870c2f77e5cc1d2eb9bdff03e30ea0
const config: synapseConfig = {
  // leave synapseConfig as '' if you want to deploy a router with deployments
  hardhat: {
    synapse: '0xa2569370A9D4841c9a62Fc51269110F2eB7E0171',
    chainId: 1,
  },
  mainnet: {
    synapse: '0xa2569370A9D4841c9a62Fc51269110F2eB7E0171',
    chainId: 1,
  },
  optimism: {
    synapse: '0x9CD619c50562a38edBdC3451ade7B58CaA71Ab32',
    chainId: 10,
  },
  bsc: {
    synapse: '0x749F37Df06A99D6A8E065dd065f8cF947ca23697',
    chainId: 56,
  },
  polygon: {
    synapse: '0x1c6aE197fF4BF7BA96c66C5FD64Cb22450aF9cC8',
    chainId: 137,
  },
  fantom: {
    synapse: '0x7BC05Ff03397950E8DeE098B354c37f449907c20',
    chainId: 250,
  },
  boba_network: {
    synapse: '0x64B4097bCCD27D49BC2A081984C39C3EeC427a2d',
    chainId: 288,
  },
  arbitrum: {
    synapse: '0x375E9252625bDB10B457909157548E1d047089f9',
    chainId: 42161,
  },
  avax: {
    synapse: '0x997108791D5e7c0ce2a9A4AAC89427C68E345173',
    chainId: 43114,
  },
  moon_river: {
    synapse: '0x06Fea8513FF03a0d3f61324da709D4cf06F42A5c',
    chainId: 1285,
  },
  aurora: {
    synapse: '0xd80d8688b02B3FD3afb81cDb124F188BB5aD0445',
    chainId: 1313161554,
  },
  harmony: {
    synapse: '0xf68cd56cf9a9e1cda181fb2c44c5f0e98b5cc541',
    chainId: 1666600000,
  },
}

export default config
