const environment = {
  RIF_ONE_SHOOT_SCHEDULER_PROVIDER: process.env
    .REACT_APP_RIF_ONE_SHOOT_SCHEDULER_PROVIDER as string,
  REACT_APP_CONFIRMATIONS: parseInt(
    process.env.REACT_APP_CONFIRMATIONS as string
  ),
};

export default environment;
