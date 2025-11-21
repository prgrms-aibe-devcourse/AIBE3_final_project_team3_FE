import { Client } from "@stomp/stompjs";

import { API_BASE_URL } from "@/global/consts";

let stompClient: Client | null = null;

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

// The connect function now takes the accessToken as an argument
export const connect = (accessToken: string, onConnectCallback: () => void) => {
  const client = getStompClient();

  if (client.connected) {
    console.log("Already connected");
    onConnectCallback();
    return;
  }

  if (client.active) {
    console.log("STOMP client is already attempting to connect.");
    return;
  }

  // Set connectHeaders right before activation with the provided accessToken
  console.log("STOMP client connecting with accessToken (first 10 chars):", accessToken ? accessToken.substring(0, 10) + "..." : "null"); // 로그 추가
  client.connectHeaders = {
    Authorization: `Bearer ${accessToken}`,
  };

  client.onConnect = () => {
    console.log("STOMP client connected successfully.");
    onConnectCallback();
  };

  client.activate();
  console.log("STOMP client activation initiated.");
};

export const disconnect = () => {
  if (!stompClient) {
    return;
  }

  if (stompClient.active || stompClient.connected) {
    void stompClient.deactivate();
  }

  stompClient = null;
  console.log("STOMP client deactivated and instance reset.");
};
