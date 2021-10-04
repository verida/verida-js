import { Interfaces } from "@verida/storage-link"

export interface NodeAccountConfig {
    chain: string,
    privateKey: string,
    ceramicUrl?: string
    options?: any
}