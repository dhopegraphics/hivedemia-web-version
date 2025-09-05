import React, { createContext, useContext, useRef } from "react";

import Toast, { IToast } from "@/hooks/Toast";

const ToastContext = createContext<{
  showToast: (
    text: string,
    type: "info" | "success" | "error",
    duration: number
  ) => void;
}>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{
  children: React.ReactNode;
  mode?: "queue" | "stack";
}> = ({ children, mode = "queue" }) => {
  const toastRef = useRef<IToast>(null);
  const toastCountRef = useRef(0);

  const showToast = (
    text: string,
    type: "info" | "success" | "error",
    duration: number
  ) => {
    // Calculate start delay for stack mode (200ms between each toast)
    const startDelay = mode === "stack" ? toastCountRef.current * 1100 : 0;
    toastCountRef.current += 1;

    // Reset counter after a reasonable time to prevent infinite growth
    setTimeout(() => {
      toastCountRef.current = Math.max(0, toastCountRef.current - 1);
    }, 5000);

    toastRef.current?.show(text, type, duration, startDelay);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast ref={toastRef} mode={mode} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
