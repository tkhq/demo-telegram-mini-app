import { getPublicKey } from "@turnkey/crypto";
import { uint8ArrayFromHexString, uint8ArrayToHexString } from "@turnkey/encoding";
import { decode, JwtPayload } from "jsonwebtoken";

export const TURNKEY_EMBEDDED_KEY = "TURNKEY_EMBDEDDED_KEY";
export const MILLIS_15_MINUTES = 900000;
export const TURNTCOIN_WALLET_NAME = "TurntCoin Wallet"

export function setLocalStorageItemWithExipry(key: string, value: string, ttl: number) {
    const now = new Date();
    const item = {
        value: value,
        ttl: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item))
}

export function getLocalStorageItemWithExipry(key: string) {
    const itemStr = localStorage.getItem(key);

    if(!itemStr) {
        return null;
    }

    const item = JSON.parse(itemStr);

    if(!item.hasOwnProperty("ttl") || !item.hasOwnProperty("value")) {
        return null;
    }

    const now = new Date();
    if(now.getTime() > item.expiry) {
        return null;
    }

    return item.value;
}

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