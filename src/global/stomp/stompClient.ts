import { Client } from "@stomp/stompjs";

import { API_BASE_URL } from "@/global/consts";

let stompClient: Client | null = null;
let lastAuthToken: string | null = null;

const buildBrokerUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_WS_BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return `${explicit.replace(/\/$/, "")}/ws-stomp`;
  }

  try {
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/ws-stomp`;
    return url.toString();
  } catch (error) {
    console.warn("Failed to derive STOMP broker URL from API_BASE_URL, falling back to localhost.", error);
    return "ws://localhost:8080/ws-stomp";
  }
};

const BROKER_URL = buildBrokerUrl();

// This function will now only create the client instance without authentication headers
const createClientInstance = (): Client => {
  const client = new Client({
    brokerURL: BROKER_URL,
    // connectHeaders will be set in the connect function
    debug: (str) => {
      console.log(`STOMP Debug: ${str}`);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.onStompError = (frame) => {
    console.error("Broker reported error: " + frame.headers["message"]);
    console.error("Additional details: " + frame.body);
  };

  return client;
};

export const getStompClient = (): Client => {
  if (!stompClient) {
    stompClient = createClientInstance();
  }
  return stompClient;
};

const normaliseToken = (token?: string | null) => (typeof token === "string" ? token : "");

const activateWithToken = (
  client: Client,
  accessToken: string,
  onConnectCallback: () => void,
) => {
  const trimmed = accessToken.trim();
  console.log(
    "STOMP client connecting with accessToken (first 10 chars):",
    trimmed ? `${trimmed.substring(0, 10)}...` : "null",
  );

  client.connectHeaders = {
    Authorization: `Bearer ${trimmed}`,
  };

  client.onConnect = () => {
    console.log("STOMP client connected successfully.");
    lastAuthToken = trimmed;
    onConnectCallback();
  };

  client.activate();
  console.log("STOMP client activation initiated.");
};

const ensureDisconnected = async (client: Client) => {
  if (!client.active && !client.connected) {
    return;
  }

  try {
    await client.deactivate();
  } catch (error) {
    console.warn("Failed to deactivate STOMP client cleanly", error);
  }
};

// The connect function now takes the accessToken as an argument
export const connect = (accessToken: string, onConnectCallback: () => void) => {
  const client = getStompClient();
  const normalisedToken = normaliseToken(accessToken);

  const needsTokenRefresh =
    (client.connected || client.active) && lastAuthToken !== null && lastAuthToken !== normalisedToken;

  if (client.connected && !needsTokenRefresh) {
    console.log("STOMP client already connected with the latest access token.");
    onConnectCallback();
    return;
  }

  if (client.active && !needsTokenRefresh) {
    console.log("STOMP client is already attempting to connect with the latest access token.");
    return;
  }

  if (needsTokenRefresh) {
    console.log("Access token changed. Restarting STOMP connection with the refreshed token.");
    void ensureDisconnected(client).then(() => {
      activateWithToken(client, normalisedToken, onConnectCallback);
    });
    return;
  }

  activateWithToken(client, normalisedToken, onConnectCallback);
};

export const disconnect = async () => {
  if (!stompClient) {
    return;
  }

  await ensureDisconnected(stompClient);
  stompClient = null;
  lastAuthToken = null;
  console.log("STOMP client deactivated and instance reset.");
};
