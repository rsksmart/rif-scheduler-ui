import create from "zustand";
import { persist } from "zustand/middleware";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork } from "../shared/types";

export interface IContract {
  id: string;
  name: string;
  network: ENetwork;
  address: string;
  ABI: string;
}

export interface IUseContracts {
  contracts: {
    [id: string]: IContract;
  };
  save: (contract: IContract) => void;
}

const useContracts = create<IUseContracts>(
  persist(
    (set, get) => ({
      contracts: {},
      save: (contract: IContract) =>
        set((state) => ({
          contracts: { ...state.contracts, [contract.id]: contract },
        })),
    }),
    localbasePersist("contracts")
  )
);

export default useContracts;
