import {
    Connection,
    PublicKey,
} from "@solana/web3.js";

const SOL_DEVNET_API_ADDRESS = "https://api.devnet.solana.com"

export function connect() {
    return new Connection(SOL_DEVNET_API_ADDRESS, "confirmed");
}

export async function balance(connection: Connection, address: string) {
    const publicKey = new PublicKey(address);
    return await connection.getBalance(publicKey);
}