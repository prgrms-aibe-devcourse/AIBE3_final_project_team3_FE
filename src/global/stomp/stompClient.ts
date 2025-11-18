import { Client } from "@stomp/stompjs";
// import SockJS from "sockjs-client";
import { API_BASE_URL } from "@/global/consts";

let stompClient: Client | null = null;

// HTTP URL을 WebSocket URL로 변환하는 헬퍼 함수
const getWebSocketURL = (): string => {
  const protocol = API_BASE_URL.startsWith("https://") ? "wss://" : "ws://";
  const domain = API_BASE_URL.replace(/^https?:\/\//, "");
  return `${protocol}${domain}/ws-stomp`;
};


const createClientInstance = (): Client => {
  const client = new Client({
    // webSocketFactory 대신 brokerURL을 사용하여 표준 웹소켓 주소를 지정합니다.
    brokerURL: getWebSocketURL(),

    // connectHeaders는 connect 함수에서 설정됩니다.
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

// connect 함수는 accessToken을 인자로 받습니다.
export const connect = (accessToken: string, onConnectCallback: () => void) => {
  const client = getStompClient();

  if (client.connected) {
    console.log('Already connected');
    onConnectCallback();
    return;
  }

  // 제공된 accessToken으로 연결 헤더를 활성화 직전에 설정합니다.
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
  if (stompClient && stompClient.connected) { // client.active 대신 client.connected 사용
    stompClient.deactivate();
    stompClient = null;
    console.log("STOMP client deactivated and instance reset.");
  }
};