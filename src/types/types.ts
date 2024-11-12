import { TurnkeyApiTypes } from "@turnkey/http";

export type Email = `${string}@${string}.${string}`;
export type OauthProviderParams = TurnkeyApiTypes["v1OauthProviderParams"]