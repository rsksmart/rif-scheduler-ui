function shortAddress(address: string): string {
    return address
    ? `${address.substr(0, 6)}...${address.substr(
        address.length - 4,
        address.length
        )}`
    : address
}

export default shortAddress