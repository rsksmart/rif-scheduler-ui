function shortText(address?: string): string {
  if (!address) return "";

  return address
    ? `${address.substr(0, 6)}...${address.substr(
        address.length - 4,
        address.length
      )}`
    : address;
}

export default shortText;
