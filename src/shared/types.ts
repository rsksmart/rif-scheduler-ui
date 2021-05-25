export enum ENetwork {
  Mainnet = "Mainnet",
  Testnet = "Testnet",
}

export enum ExecutionState {
  Scheduled = 0,
  ExecutionSuccessful = 1,
  ExecutionFailed = 2,
  Overdue = 3,
  Refunded = 4,
  Cancelled = 5,
}

export const ExecutionStateDescriptions = {
  [ExecutionState.Scheduled]: "Scheduled",
  [ExecutionState.ExecutionSuccessful]: "Successful",
  [ExecutionState.ExecutionFailed]: "Failed",
  [ExecutionState.Overdue]: "Overdue",
  [ExecutionState.Refunded]: "Refunded",
  [ExecutionState.Cancelled]: "Cancelled",
};
