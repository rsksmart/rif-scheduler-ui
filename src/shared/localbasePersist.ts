import Localbase from "localbase";

type StateStorage = {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
};

const localbaseStorage: StateStorage = {
  async getItem(name: string) {
    let db = new Localbase("db");
    db.config.debug = false;

    const data = await db.collection("zustand").doc(name).get();

    return JSON.stringify(data);
  },

  async setItem(name: string, value: string) {
    let db = new Localbase("db");
    db.config.debug = false;

    const data = JSON.parse(value);

    await db.collection("zustand").doc(name).set(data);
  },
};

const localbasePersist = (storeName: string, blacklist?: any[]) => {
  return {
    name: storeName, // unique name
    blacklist: blacklist,
    getStorage: () => localbaseStorage,
  };
};

export default localbasePersist;
