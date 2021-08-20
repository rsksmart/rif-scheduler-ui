import { Base } from "@rsksmart/rif-scheduler-sdk/dist/Base";
import { BigNumberish } from "ethers";
import { useCallback, useEffect, useState } from "react";
import useConnector from "../connect/useConnector";
import { IProviderSnapshot } from "../sdk-hooks/useProviders";

const useAdmin = (provider: IProviderSnapshot) => {
  const account = useConnector((state) => state.account);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const action = async () => {
      const contract = new Base(provider.config).schedulerContract;

      const providerAddress = await contract.serviceProvider();

      setIsAdmin(account === providerAddress);
    };

    action();
  }, [account, provider.config]);

  const addPlan = useCallback(
    async (
      price: BigNumberish,
      window: BigNumberish,
      gasLimit: BigNumberish,
      tokenAddress: string
    ) => {
      const contract = new Base(provider.config).schedulerContract;

      const tx = await contract.addPlan(price, window, gasLimit, tokenAddress);

      return tx;
    },
    [provider.config]
  );

  const cancelPlan = useCallback(
    async (planIndex: BigNumberish) => {
      const contract = new Base(provider.config).schedulerContract;

      const tx = await contract.removePlan(planIndex);

      return tx;
    },
    [provider.config]
  );

  return { isAdmin, addPlan, cancelPlan };
};

export default useAdmin;
