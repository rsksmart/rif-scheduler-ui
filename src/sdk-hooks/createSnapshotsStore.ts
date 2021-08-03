import create, { GetState, SetState } from "zustand";
import { persist } from "zustand/middleware";
import localbasePersist from "../shared/localbasePersist";

export interface IUseSnapshotsStore<T> {
  snapshots: {
    [key: string]: T;
  };
  set: (key: string, snapshot: T) => void;
}

const snapshotsStore = <T>(
  set: SetState<IUseSnapshotsStore<T>>,
  get: GetState<IUseSnapshotsStore<T>>
) => ({
  snapshots: {},
  set: (key: string, snapshot: T) =>
    set((state) => ({
      snapshots: {
        ...state.snapshots,
        [key]: snapshot,
      },
    })),
});

export const createSnapshotsStore = <T>(
  storeName: string,
  withPersist: boolean = true
) => {
  if (withPersist) {
    return create<IUseSnapshotsStore<T>>(
      persist(snapshotsStore, localbasePersist(storeName))
    );
  }

  return create<IUseSnapshotsStore<T>>(snapshotsStore);
};
