import { APP_URL, FILE_SERVER_URL, SOCKET_SERVER_URL } from "../config";
import { ConfigProviderClient } from "./config-provider-client";

export default function ConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = {
    socketServerUrl: SOCKET_SERVER_URL,
    appUrl: APP_URL,
    fileServerUrl: FILE_SERVER_URL,
  };

  return (
    <ConfigProviderClient config={config}>{children}</ConfigProviderClient>
  );
}
