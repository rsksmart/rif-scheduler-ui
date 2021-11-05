import { createRLogin, rskTestnetRpcUrl } from "@rsksmart/rlogin-essentials";

export const rLogin = createRLogin(rskTestnetRpcUrl)

export const isRLoginConnected = () => {
  const result = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER")
    ? true
    : false;

  return result;
};
