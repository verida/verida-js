import { EnvironmentType } from '@verida/types'
import { COUNTRIES } from './countries'
import axios from 'axios'

export interface StorageNode {
  id: string
  name: string
  description: string
  datacenter: string
  serviceEndpoint: string
  establishmentDate: string
  countryLocation: string
  region: string
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) // The maximum is exclusive and the minimum is inclusive
}

/*const dataCentres: object[] = [
  {
    id: 'aws-us-east-2',
    name: 'Amazon Web Services: US East 2 (Ohio)',
    countryLocation: 'US',
    latitude: 40.10149,
    longitude: -83.4797668,
  },
  {
    id: 'aws-ap-southeast-2',
    name: 'Amazon Web Services: Asia Pacific South East 2 (Sydney)',
    countryLocation: 'AU',
    latitude: -33.8727631,
    longitude: 151.2054683,
  },
]*/

export interface NodeSelectorConfig {
  network: EnvironmentType
  notificationEndpoints: []
  defaultTimeout: number //5000
}

// @ts-ignore
const STORAGE_NODE_URLS: Record<EnvironmentType, string> = {}
STORAGE_NODE_URLS[EnvironmentType.DEVNET] = 'https://assets.verida.io/registry/storageNodes/devnet.json'
STORAGE_NODE_URLS[EnvironmentType.TESTNET] = 'https://assets.verida.io/registry/storageNodes/testnet.json'
STORAGE_NODE_URLS[EnvironmentType.MAINNET] = 'https://assets.verida.io/registry/storageNodes/mainnet.json'

export class NodeSelector {

    config: NodeSelectorConfig
    nodeList?: StorageNode[]

    constructor(config: NodeSelectorConfig) {
      this.config = config
    }

  /**
   * Select random nodes for a given country code
   * @param countryCode 2-character country code
   * @param numNodes Number of nodes to randomly select
   * @returns Array of found storage nodes up to `numNodes` maximum
   */
  public async selectNodesByCountry(
    countryCode?: string,
    numNodes: number = 3
  ): Promise<StorageNode[]> {
    const countryNodes = await this.nodesByCountry()

    // No country specified, so choose globally random nodes
    if (!countryCode) {
      const possibleNodes = await this.loadStorageNodes()
      return this.selectNodesFromList(possibleNodes, numNodes)
    }

    // No nodes found for country, choose random region nodes
    if (!countryNodes[countryCode]) {
      const countryMeta = COUNTRIES[countryCode]
      return this.selectNodesByRegion(countryMeta.region, numNodes)
    }

    const possibleNodes: StorageNode[] = countryNodes[countryCode]
    const selectedNodes = await this.selectNodesFromList(possibleNodes, numNodes)

    if (selectedNodes.length < numNodes) {
      // Not enough country nodes, try to find region nodes
      const countryMeta = COUNTRIES[countryCode]
      const regionNodes = await this.selectNodesByRegion(countryMeta.region, numNodes - selectedNodes.length)
      return selectedNodes.concat(regionNodes)
    }

    return selectedNodes
  }

  public async selectNodesByRegion(
    region: string,
    numNodes: number = 3,
  ): Promise<StorageNode[]> {
    const regionNodes = await this.nodesByRegion()
    let possibleNodes: StorageNode[]

    if (!regionNodes[region]) {
      // no region nodes, find global nodes
      possibleNodes = await this.loadStorageNodes()
    } else {
      possibleNodes = regionNodes[region]
    }

    const selectedNodes = await this.selectNodesFromList(possibleNodes, numNodes)

    if (selectedNodes.length < numNodes) {
      // Not enough region nodes, try to find global nodes
      const globalNodes = await this.loadStorageNodes()
      const globalFoundNodes = await this.selectNodesFromList(globalNodes, numNodes - selectedNodes.length)
      return selectedNodes.concat(globalFoundNodes)
    }

    return selectedNodes
  }

  private async selectNodesFromList(possibleNodes: StorageNode[], numNodes: number = 3) {
    const selectedNodes: StorageNode[] = []

    while (selectedNodes.length < numNodes && possibleNodes.length > 0) {
      const nodeIndex = getRandomInt(0, possibleNodes.length)
      const possibleNode = possibleNodes[nodeIndex]
      const nodeAvailable = await this.verifyNodeAvailable(possibleNode)

      if (nodeAvailable) {
        selectedNodes.push(possibleNode)
      }

      possibleNodes.splice(nodeIndex, 1)
    }

    return selectedNodes
  }

  public async selectEndpointUris(
    countryCode?: string,
    numNodes: number = 3
  ): Promise<string[]> {
    const nodes = await this.selectNodesByCountry(
      countryCode,
      numNodes
    )
    return nodes.reduce((result: any, item: StorageNode) => {
      result.push(item.serviceEndpoint)
      return result
    }, [])
  }

  public async nodesByCountry() {
    const storageNodes = await this.loadStorageNodes()

    return storageNodes.reduce((result: any, item: StorageNode) => {
      if (!result[item.countryLocation]) {
        result[item.countryLocation] = []
      }

      result[item.countryLocation].push(item)
      return result
    }, {})
  }

  public async nodesByRegion() {
    const storageNodes = await this.loadStorageNodes()

    return storageNodes.reduce((result: any, item: StorageNode) => {
      if (!result[item.region]) {
        result[item.region] = []
      }

      result[item.region].push(item)
      return result
    }, {})
  }

  public notificationEndpoints() {
    return this.config.notificationEndpoints
  }

  public async verifyNodeAvailable(storageNode: StorageNode) {
    try {
      const statusResponse = await axios.get(
        `${storageNode.serviceEndpoint}status`,
        {
          timeout: this.config.defaultTimeout,
        }
      )

      const results = statusResponse.data.results

      if (parseInt(results.currentUsers) < parseInt(results.maxUsers)) {
        return true
      }

      return false
    } catch (err: any) {
      return false
    }
  }

  private async loadStorageNodes(nodes?: StorageNode[]): Promise<StorageNode[]> {
    if (nodes) {
      this.nodeList = nodes
    }

    if (this.nodeList) {
      return this.nodeList
    }

    const nodeList = await this.fetchConfigJson(STORAGE_NODE_URLS[this.config.network])
    nodes = []
    for (const n in nodeList) {
      nodes.push(<StorageNode>nodeList[n])
    }

    return nodes
  }

  private async fetchConfigJson(url: string): Promise<StorageNode[]> {
    const result = await axios.get(url + `?t=${Date.now()}`)
    return result.data
  }
}