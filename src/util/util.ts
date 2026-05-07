import { getPublicKey } from "@turnkey/crypto";
import { uint8ArrayFromHexString, uint8ArrayToHexString } from "@turnkey/encoding";
import { decode, JwtPayload } from "jsonwebtoken";

export const DEMO_WALLET_NAME = "Turnkey Demo Wallet"

export function getPublicKeyFromPrivateKeyHex(privateKey: string) {
  return uint8ArrayToHexString(
    getPublicKey(uint8ArrayFromHexString(privateKey), true)
  );
};

export function decodeJwt(credential: string): JwtPayload | null {
  const decoded = decode(credential)

  if (decoded && typeof decoded === "object" && "email" in decoded) {
    return decoded as JwtPayload
  }

  return null
}