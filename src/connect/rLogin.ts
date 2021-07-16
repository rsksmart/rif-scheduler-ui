import RLogin from "@rsksmart/rlogin";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { SupportedNetworks } from "../shared/types";

export const rLogin = new RLogin({
  cacheProvider: true, // change to true to cache user's wallet choice
  providerOptions: {
    // read more about providers setup in https://github.com/web3Modal/web3modal/
    walletconnect: {
      package: WalletConnectProvider, // setup wallet connect for mobile wallet support
      options: {
        rpc: {
          31: "https://public-node.testnet.rsk.co", // use RSK public nodes to connect to the testnet
        },
      },
    },
  },
  supportedChains: SupportedNetworks,
});

export const isRLoginConnected = () => {
  const result = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER") ?
                    true :
                    false

  console.log("isRLoginConnected", result)

  return result
}
