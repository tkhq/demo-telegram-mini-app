import { TurnkeyApiTypes } from "@turnkey/http";

export type Email = `${string}@${string}.${string}`;
export type OauthProviderParams = TurnkeyApiTypes["v1OauthProviderParams"];
export type APIKeyParams = TurnkeyApiTypes["v1ApiKeyParamsV2"];