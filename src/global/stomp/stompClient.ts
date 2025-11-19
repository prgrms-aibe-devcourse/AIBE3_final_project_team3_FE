import { Client } from "@stomp/stompjs";

import { API_BASE_URL } from "@/global/consts";
// useLoginStore will be used in the component that calls connect, not here directly for token retrieval

let stompClient: Client | null = null;

// This function will now only create the client instance without authentication headers
const createClientInstance = (): Client => {
  const client = new Client({
    brokerURL: "ws://localhost:8080/ws-stomp",
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
    console.log('Already connected');
    onConnectCallback();
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
  if (stompClient && stompClient.connected) { // Use client.connected instead of client.active
    stompClient.deactivate();
    stompClient = null;
    console.log("STOMP client deactivated and instance reset.");
  }
};
