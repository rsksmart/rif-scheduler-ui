const environment = {
  SCHEDULER_PROVIDERS_TESTNET: (
    process.env.REACT_APP_SCHEDULER_PROVIDERS_TESTNET as string
  ).split(";"),
  SCHEDULER_PROVIDERS_MAINNET: (
    process.env.REACT_APP_SCHEDULER_PROVIDERS_MAINNET as string
  ).split(";"),
  CONFIRMATIONS: parseInt(process.env.REACT_APP_CONFIRMATIONS as string),
  ER677_TOKENS_TESTNET: (
    process.env.REACT_APP_ER677_TOKENS_TESTNET as string
  ).split(";"),
  ER677_TOKENS_MAINNET: (
    process.env.REACT_APP_ER677_TOKENS_MAINNET as string
  ).split(";"),
  MINIMUM_TIME_BEFORE_EXECUTION: parseInt(
    process.env.REACT_APP_MINIMUM_TIME_BEFORE_EXECUTION as string
  ),
};

export default environment;
