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
  isLoading: boolean;
  scheduleItems: {
    [id: string]: IScheduleItem;
  };
  scheduleAndSave: (scheduleItem: IScheduleItem) => Promise<void>;
}

const useSchedule = create<IUseSchedule>(
  persist(
    (set, get) => ({
      isLoading: false,
      scheduleItems: {},
      scheduleAndSave: async (scheduleItem: IScheduleItem) => {
        set(() => ({
          isLoading: true,
        }));

        setTimeout(() => {
          set((state) => ({
            scheduleItems: {
              ...state.scheduleItems,
              [scheduleItem.id]: scheduleItem,
            },
            isLoading: false,
          }));
        }, 1000);
      },
    }),
    localbasePersist("schedule", ["isLoading"])
  )
);

export default useSchedule;
