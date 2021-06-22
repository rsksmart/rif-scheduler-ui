export enum ENetwork {
  Mainnet = "Mainnet",
  Testnet = "Testnet",
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
