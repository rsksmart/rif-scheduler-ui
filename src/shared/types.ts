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

export enum ExecutionState {
  NotScheduled = 0,
  Scheduled = 1,
  ExecutionSuccessful = 2,
  ExecutionFailed = 3,
  Overdue = 4,
  Refunded = 5,
  Cancelled = 6,
}

export const ExecutionStateDescriptions = {
  [ExecutionState.NotScheduled]: "Not scheduled",
  [ExecutionState.Scheduled]: "Scheduled",
  [ExecutionState.ExecutionSuccessful]: "Successful",
  [ExecutionState.ExecutionFailed]: "Failed",
  [ExecutionState.Overdue]: "Overdue",
  [ExecutionState.Refunded]: "Refunded",
  [ExecutionState.Cancelled]: "Cancelled",
};
