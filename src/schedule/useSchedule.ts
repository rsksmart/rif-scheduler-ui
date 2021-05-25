import create from "zustand";
import { persist } from "zustand/middleware";
import localbasePersist from "../shared/localbasePersist";
import { ENetwork, ExecutionState } from "../shared/types";

export interface IScheduleItem {
  id: string;
  title: string;
  network: ENetwork;
  executeAt: string;
  providerId: string;
  contractId: string;
  contractMethod: string;
  contractFields: string[];
  state?: ExecutionState;
  color?: string;
}

export interface IUseSchedule {
  scheduleItems: {
    [id: string]: IScheduleItem;
  };
  scheduleAndSave: (scheduleItem: IScheduleItem) => Promise<void>;
}

const useSchedule = create<IUseSchedule>(
  persist(
    (set, get) => ({
      scheduleItems: {},
      scheduleAndSave: async (scheduleItem: IScheduleItem) => {
        setTimeout(
          () =>
            set((state) => ({
              scheduleItems: {
                ...state.scheduleItems,
                [scheduleItem.id]: scheduleItem,
              },
            })),
          1000
        );
      },
    }),
    localbasePersist("schedule")
  )
);

export default useSchedule;
