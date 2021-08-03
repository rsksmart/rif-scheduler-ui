import { EExecutionState } from "@rsksmart/rif-scheduler-sdk";

export enum ENetwork {
  NotSupported = -1,
  RSKMainnet = 30,
  RSKTestnet = 31,
}

export const SupportedNetworks = [ENetwork.RSKMainnet, ENetwork.RSKTestnet];

export const NetworkName = {
  [ENetwork.NotSupported]: "Unsupported network",
  [ENetwork.RSKMainnet]: "RSK Mainnet",
  [ENetwork.RSKTestnet]: "RSK Testnet",
};

export const NetworkExplorer = {
  [ENetwork.NotSupported]: null,
  [ENetwork.RSKMainnet]: "https://explorer.rsk.co/",
  [ENetwork.RSKTestnet]: "https://explorer.testnet.rsk.co/",
};

export const getExplorerTxLink = (hash: string, network: ENetwork) => {
  const explorerUrl = NetworkExplorer[network];
  if (!explorerUrl) return null;

  return new URL(`/tx/${hash}`, explorerUrl).toString();
};

export const ExecutionStateDescriptions = {
  [EExecutionState.NotScheduled]: "Not scheduled",
  [EExecutionState.Scheduled]: "Scheduled",
  [EExecutionState.ExecutionSuccessful]: "Successful",
  [EExecutionState.ExecutionFailed]: "Failed",
  [EExecutionState.Overdue]: "Overdue",
  [EExecutionState.Refunded]: "Refunded",
  [EExecutionState.Cancelled]: "Cancelled",
};
