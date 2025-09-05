import { useEffect, useState } from "react";

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: typeof navigator !== "undefined" ? navigator.onLine : true,
    isInternetReachable:
      typeof navigator !== "undefined" ? navigator.onLine : true,
    type: "wifi", // Default for web
  });

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const updateNetworkState = () => {
      setNetworkState({
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
        type: "wifi",
      });
    };

    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);

    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, []);

  return {
    ...networkState,
    // Simplified helper - considers user online if connected and internet is reachable
    isOnline:
      networkState.isConnected && networkState.isInternetReachable !== false,
  };
};
