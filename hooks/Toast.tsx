import React, {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Image from "next/image";

// Web-compatible shared value
class WebSharedValue {
  public value: number;
  private listeners: Set<() => void> = new Set();

  constructor(initialValue: number) {
    this.value = initialValue;
  }

  addListener(listener: () => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: () => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  setValue(newValue: number) {
    this.value = newValue;
    this.notifyListeners();
  }
}

// Web-compatible animation functions
const webAnimation = {
  useSharedValue: (initial: number) => new WebSharedValue(initial),

  withTiming: (
    toValue: number,
    config?: { duration?: number; easing?: any }
  ) => {
    return {
      toValue,
      duration: config?.duration || 300,
      easing: config?.easing,
    };
  },

  withDelay: (delay: number, animation: any) => {
    return {
      ...animation,
      delay,
    };
  },

  useAnimatedStyle: (styleFunction: () => any, dependencies: any[] = []) => {
    const [style, setStyle] = useState(styleFunction());

    useEffect(() => {
      setStyle(styleFunction());
    }, dependencies);

    return style;
  },

  interpolate: (
    value: number,
    inputRange: number[],
    outputRange: number[],
    extrapolation?: any
  ) => {
    if (value <= inputRange[0]) return outputRange[0];
    if (value >= inputRange[inputRange.length - 1])
      return outputRange[outputRange.length - 1];

    for (let i = 0; i < inputRange.length - 1; i++) {
      if (value >= inputRange[i] && value <= inputRange[i + 1]) {
        const ratio =
          (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
        return outputRange[i] + ratio * (outputRange[i + 1] - outputRange[i]);
      }
    }
    return outputRange[0];
  },

  runOnJS:
    (fn: Function) =>
    (...args: any[]) => {
      setTimeout(() => fn(...args), 0);
    },

  Easing: {
    bezierFn: (x1: number, y1: number, x2: number, y2: number) =>
      "cubic-bezier(" + [x1, y1, x2, y2].join(",") + ")",
  },

  Extrapolation: {
    CLAMP: "clamp",
  },
};

export interface IToast {
  show: (
    text: string,
    type: "info" | "success" | "error",
    duration: number,
    startDelay?: number
  ) => void;
  hide: (callback?: () => void) => void;
}

type ToastItem = {
  id: string;
  text: string;
  type: "info" | "success" | "error";
  duration: number;
  startDelay?: number;
};

interface Props {
  ref: Ref<IToast>;
  duration?: number;
  onHide?: () => void;
  mode?: "queue" | "stack";
}

// Individual Toast Component for Stack Mode
const IndividualToast: React.FC<{
  toast: ToastItem;
  index: number;
  duration: number;
  onComplete: (id: string) => void;
  textLength: number;
  toastHeight: number;
}> = ({ toast, index, duration, onComplete, textLength, toastHeight }) => {
  const transY = webAnimation.useSharedValue(-toastHeight);
  const transX = webAnimation.useSharedValue(0);
  const [localTextLength, setLocalTextLength] = useState(textLength);
  const [localToastHeight, setLocalToastHeight] = useState(toastHeight);

  // Use local values if they're available, otherwise fall back to props
  const effectiveTextLength = localTextLength || textLength;
  const effectiveToastHeight = localToastHeight || toastHeight;
  const effectiveStartDelay = toast.startDelay || 0;

  useEffect(() => {
    // Don't start animation until we have proper layout values
    if (effectiveTextLength === 0 || effectiveToastHeight === 0) return;

    // Initialize position - start hidden above and collapsed
    transY.setValue(-effectiveToastHeight);
    transX.setValue(effectiveTextLength + 24); // Start collapsed/closed

    // Start animation sequence with calculated delay
    setTimeout(() => {
      // Step 1: Drop down closed (collapsed)
      transY.setValue(80);

      // Step 2: Open after dropping down
      setTimeout(() => {
        transX.setValue(0);
      }, duration);

      // Auto-hide timer
      setTimeout(() => {
        // Step 3: Close first, then go up
        transX.setValue(effectiveTextLength + 12);
        setTimeout(() => {
          transY.setValue(-effectiveToastHeight);
          onComplete(toast.id);
        }, duration);
      }, 4000);
    }, effectiveStartDelay + 10);
  }, [
    duration,
    effectiveTextLength,
    effectiveToastHeight,
    effectiveStartDelay,
    transY,
    transX,
    onComplete,
    toast.id,
  ]);

  const rView = webAnimation.useAnimatedStyle(() => {
    return {
      transform: `translateY(${transY.value}px)`,
      opacity: webAnimation.interpolate(
        transY.value,
        [-effectiveToastHeight, 80],
        [0, 1]
      ),
    };
  }, [effectiveToastHeight]);

  const rOuterView = webAnimation.useAnimatedStyle(() => {
    return {
      transform: `translateX(${-Math.max(transX.value, 1) / 2}px)`,
    };
  }, []);

  const rInnerView = webAnimation.useAnimatedStyle(() => {
    return {
      transform: `translateX(${transX.value}px)`,
    };
  }, []);

  const rText = webAnimation.useAnimatedStyle(() => {
    return {
      opacity: webAnimation.interpolate(
        transX.value,
        [0, effectiveTextLength],
        [1, 0]
      ),
    };
  }, [effectiveTextLength]);

  function generateImage(type: "info" | "success" | "error") {
    if (type === "success") {
      return "/images/check.png"; // Move images to public/images
    } else if (type === "error") {
      return "/images/error-icon.png";
    } else {
      return "/images/info_Icon.png";
    }
  }

  function generateBackgroundColor(type: "info" | "success" | "error") {
    if (type === "success") {
      return "#1f8503";
    } else if (type === "error") {
      return "#f00a1d";
    } else {
      return "#0077ed";
    }
  }

  const handleTextLayout = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const width = Math.floor(target.offsetWidth);
    if (localTextLength !== width) {
      setLocalTextLength(width);
    }
  };

  const handleViewLayout = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const height = target.offsetHeight;
    if (localToastHeight !== height) {
      setLocalToastHeight(height);
    }
  };

  return (
    <div
      style={{
        ...styles.container,
        top: index * 60,
        ...rView,
      }}
      onLoad={handleViewLayout}
    >
      <div style={{ ...styles.outerContainer, ...rOuterView }}>
        <div
          style={{
            ...styles.innerContainer,
            ...rInnerView,
            backgroundColor: generateBackgroundColor(toast.type),
          }}
        >
          <Image
            src={generateImage(toast.type)}
            width={20}
            height={20}
            alt={`${toast.type} icon`}
            style={styles.image}
          />
          <div style={{ ...styles.text, ...rText }} onLoad={handleTextLayout}>
            {toast.text}
          </div>
        </div>
      </div>
    </div>
  );
};

const Toast = forwardRef<IToast, Props>(
  ({ duration = 400, onHide, mode = "queue" }, ref) => {
    Toast.displayName = "Toast";

    // Queue/Stack management
    const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
    const [activeToasts, setActiveToasts] = useState<ToastItem[]>([]);
    const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
    const isProcessing = useRef(false);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
      new Map()
    );

    // Layout states
    const [textLength, setTextLength] = useState(0);
    const [toastHeight, setToastHeight] = useState(0);

    // Animation values for queue mode (single toast)
    const transY = webAnimation.useSharedValue(0);
    const transX = webAnimation.useSharedValue(0);

    useImperativeHandle(ref, () => ({
      show,
      hide,
    }));

    // Generate unique ID for each toast
    const generateId = () =>
      `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Clear all timers for cleanup
    const clearAllTimers = useCallback(() => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    }, []);

    // Process queue for queue mode
    const processQueue = useCallback(() => {
      if (mode !== "queue" || isProcessing.current || toastQueue.length === 0) {
        return;
      }

      const nextToast = toastQueue[0];
      setToastQueue((prev) => prev.slice(1));
      setCurrentToast(nextToast);
      isProcessing.current = true;
    }, [mode, toastQueue]);

    // Handle toast completion
    const handleToastComplete = useCallback(
      (toastId: string) => {
        if (mode === "queue") {
          setCurrentToast(null);
          isProcessing.current = false;

          // Process next toast in queue
          setTimeout(() => {
            processQueue();
          }, 100);
        } else {
          // Stack mode - remove from active toasts
          setActiveToasts((prev) =>
            prev.filter((toast) => toast.id !== toastId)
          );
        }

        if (onHide) {
          onHide();
        }
      },
      [mode, processQueue, onHide]
    );

    // Hide animation
    const hideAnimation = useCallback(
      (toastId: string) => {
        // Clear the timer for this toast
        const timer = timers.current.get(toastId);
        if (timer) {
          clearTimeout(timer);
          timers.current.delete(toastId);
        }

        transX.setValue(textLength + 12);
        setTimeout(() => {
          transY.setValue(-toastHeight);
          setTimeout(() => {
            handleToastComplete(toastId);
          }, duration);
        }, duration);
      },
      [duration, textLength, toastHeight, transX, transY, handleToastComplete]
    );

    // Show animation
    const showAnimation = useCallback(
      (toast: ToastItem) => {
        transY.setValue(80);
        setTimeout(() => {
          transX.setValue(0);
        }, duration);

        // Set auto-hide timer
        const hideTimer = setTimeout(() => {
          hideAnimation(toast.id);
        }, 4000);

        timers.current.set(toast.id, hideTimer);
      },
      [duration, transY, transX, hideAnimation]
    );

    // Effect to handle layout changes and start animations (queue mode only)
    useEffect(() => {
      if (
        mode === "queue" &&
        textLength > 0 &&
        toastHeight > 0 &&
        currentToast
      ) {
        transX.setValue(textLength + 24);

        setTimeout(() => {
          showAnimation(currentToast);
        }, 50);
      }
    }, [mode, currentToast, textLength, toastHeight, transX, showAnimation]);

    // Effect to initialize position
    useEffect(() => {
      if (toastHeight > 0) {
        transY.setValue(-toastHeight);
      }
    }, [toastHeight, transY]);

    // Effect to process queue when new items are added
    useEffect(() => {
      if (mode === "queue") {
        processQueue();
      }
    }, [toastQueue, processQueue, mode]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        clearAllTimers();
      };
    }, [clearAllTimers]);

    // Render individual toast component
    const renderToast = (toast: ToastItem, index: number) => {
      const toastKey = `toast_${toast.id}`;

      return (
        <div
          key={toastKey}
          onLoad={handleViewLayout}
          style={{
            ...styles.container,
            ...(mode === "stack" && { top: index * 60 }), // Stack with spacing
            ...rView,
          }}
        >
          <div style={{ ...styles.outerContainer, ...rOuterView }}>
            <div
              style={{
                ...styles.innerContainer,
                ...rInnerView,
                backgroundColor: generateBackgroundColor(toast.type),
              }}
            >
              <Image
                src={generateImage(toast.type)}
                width={20}
                height={20}
                alt={`${toast.type} icon`}
                style={styles.image}
              />
              <div
                onLoad={handleTextLayout}
                style={{ ...styles.text, ...rText }}
              >
                {toast.text}
              </div>
            </div>
          </div>
        </div>
      );
    };

    const rView = webAnimation.useAnimatedStyle(() => {
      return {
        transform: `translateY(${transY.value}px)`,
        opacity: webAnimation.interpolate(
          transY.value,
          [-toastHeight, 80],
          [0, 1]
        ),
      };
    }, [toastHeight]);

    const rOuterView = webAnimation.useAnimatedStyle(() => {
      return {
        transform: `translateX(${-Math.max(transX.value, 1) / 2}px)`,
      };
    }, []);

    const rInnerView = webAnimation.useAnimatedStyle(() => {
      return {
        transform: `translateX(${transX.value}px)`,
      };
    }, []);

    const rText = webAnimation.useAnimatedStyle(() => {
      return {
        opacity: webAnimation.interpolate(
          transX.value,
          [0, textLength],
          [1, 0]
        ),
      };
    }, [textLength]);

    // Render based on mode
    if (mode === "queue") {
      // Queue mode: show only current toast
      if (!currentToast) {
        return null;
      }
      return renderToast(currentToast, 0);
    } else {
      // Stack mode: show all active toasts using IndividualToast
      if (activeToasts.length === 0) {
        return null;
      }
      return (
        <>
          {activeToasts.map((toast, index) => (
            <IndividualToast
              key={toast.id}
              toast={toast}
              index={index}
              duration={duration}
              onComplete={handleToastComplete}
              textLength={textLength}
              toastHeight={toastHeight}
            />
          ))}
        </>
      );
    }

    function show(
      text: string,
      type: "info" | "success" | "error",
      duration: number,
      startDelay?: number
    ) {
      const newToast: ToastItem = {
        id: generateId(),
        text,
        type,
        duration,
        startDelay: startDelay || 0,
      };

      if (mode === "queue") {
        setToastQueue((prev) => [...prev, newToast]);
      } else {
        // Stack mode - just add to active toasts
        // IndividualToast component will handle its own animations
        setActiveToasts((prev) => [...prev, newToast]);
      }
    }

    function hide(callback?: () => void) {
      if (mode === "queue" && currentToast) {
        hideAnimation(currentToast.id);
      } else if (mode === "stack" && activeToasts.length > 0) {
        // In stack mode, hide the most recent toast
        const latestToast = activeToasts[activeToasts.length - 1];
        hideAnimation(latestToast.id);
      }

      if (callback) {
        setTimeout(callback, 100);
      }
    }

    function generateImage(type: "info" | "success" | "error") {
      if (type === "success") {
        return "/images/check.png"; // Move images to public/images
      } else if (type === "error") {
        return "/images/error-icon.png";
      } else {
        return "/images/info_Icon.png";
      }
    }

    function generateBackgroundColor(type: "info" | "success" | "error") {
      if (type === "success") {
        return "#1f8503";
      } else if (type === "error") {
        return "#f00a1d";
      } else {
        return "#0077ed";
      }
    }

    function handleTextLayout(event: React.SyntheticEvent<HTMLDivElement>) {
      const target = event.currentTarget;
      if (textLength !== target.offsetWidth) {
        setTextLength(Math.floor(target.offsetWidth));
      }
    }

    function handleViewLayout(event: React.SyntheticEvent<HTMLDivElement>) {
      const target = event.currentTarget;
      if (toastHeight !== target.offsetHeight) {
        setToastHeight(target.offsetHeight);
      }
    }
  }
);

const styles = {
  container: {
    position: "fixed" as const,
    top: 0,
    zIndex: 100,
    marginLeft: 24,
    marginRight: 24,
    alignSelf: "center" as const,
    width: "90%",
  },
  outerContainer: {
    overflow: "hidden" as const,
    borderRadius: 40,
  },
  innerContainer: {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "flex-start" as const,
    padding: 12,
    borderRadius: 40,
    minHeight: 44,
    maxWidth: "100%",
  },
  image: {
    width: 20,
    height: 20,
    flexShrink: 0,
  },
  text: {
    color: "white",
    fontWeight: "600" as const,
    fontSize: 16,
    marginLeft: 12,
    textAlign: "left" as const,
    flex: 1,
    flexWrap: "wrap" as const,
  },
};

export default Toast;
