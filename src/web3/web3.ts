import { Connection, PublicKey, SystemProgram, Transaction, TransactionConfirmationStrategy, sendAndConfirmRawTransaction } from "@solana/web3.js";
import bs58 from "bs58"

const SOL_DEVNET_API_ADDRESS = "https://api.devnet.solana.com"

export function connect() {
  return new Connection(SOL_DEVNET_API_ADDRESS, "confirmed");
}

export async function balance(connection: Connection, address: string) {
  const publicKey = new PublicKey(address);
  return await connection.getBalance(publicKey);
}

export async function recentBlockhash(connection: Connection) {
  const blockhash = await connection.getLatestBlockhash();
  return blockhash.blockhash;
}

export async function transfer(connection: Connection, amount: number, sender: string, recipient: string) {
  const fromPubkey = new PublicKey(sender);
  const toPubkey = new PublicKey(recipient);

  const blockhash = await recentBlockhash(connection);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount
    })
  )

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}

export async function broadcast(connection: Connection, signedTransaction: Transaction) {
  const confirmationStrategy = await getConfirmationStrategy(bs58.encode(signedTransaction.signature!));
  const transactionHash = await sendAndConfirmRawTransaction(connection, Buffer.from(signedTransaction.serialize()), confirmationStrategy, { commitment: "confirmed" });

  return transactionHash;
}

async function getConfirmationStrategy(
  signature: string
): Promise<TransactionConfirmationStrategy> {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  const latestBlockHash = await connection.getLatestBlockhash();

  return {
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature,
  };
}