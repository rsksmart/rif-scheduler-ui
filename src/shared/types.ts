import { ExecutionState } from "@rsksmart/rif-scheduler-sdk"

export enum ENetwork {
  NotSupported = -1,
  RSKMainnet = 30,
  RSKTestnet = 31,
}

export const SupportedNetworks = [ENetwork.RSKMainnet, ENetwork.RSKTestnet]

export const NetworkName = {
  [ENetwork.NotSupported]: "Unsupported network",
  [ENetwork.RSKMainnet]: "RSK Mainnet",
  [ENetwork.RSKTestnet]: "RSK Testnet"
}

export const NetworkExplorer = {
  [ENetwork.NotSupported]: null,
  [ENetwork.RSKMainnet]: "https://explorer.rsk.co/",
  [ENetwork.RSKTestnet]: "https://explorer.testnet.rsk.co/"
}

export const getExplorerTxLink = (hash: string, network: ENetwork) => {
  const explorerUrl = NetworkExplorer[network]
  if (!explorerUrl)
    return null

  return new URL(`/tx/${hash}`, explorerUrl).toString()
}

export const ExecutionStateDescriptions = {
  [ExecutionState.Nonexistent]: "Not scheduled",
  [ExecutionState.Scheduled]: "Scheduled",
  [ExecutionState.ExecutionSuccessful]: "Successful",
  [ExecutionState.ExecutionFailed]: "Failed",
  [ExecutionState.Overdue]: "Overdue",
  [ExecutionState.Refunded]: "Refunded",
  [ExecutionState.Cancelled]: "Cancelled",
};
