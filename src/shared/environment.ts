const environment = {
  SCHEDULER_PROVIDERS: (process.env.REACT_APP_SCHEDULER_PROVIDERS as string).split(';'),
  CONFIRMATIONS: parseInt(
    process.env.REACT_APP_CONFIRMATIONS as string
  ),
  ER677_TOKENS: (process.env.REACT_APP_ER677_TOKENS as string).split(';')
};

export default environment;
