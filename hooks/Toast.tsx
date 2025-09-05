import React, {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Image, LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

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
  const transY = useSharedValue(-toastHeight);
  const transX = useSharedValue(0);
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
    transY.value = -effectiveToastHeight;
    transX.value = effectiveTextLength + 24; // Start collapsed/closed

    // Start animation sequence with calculated delay
    setTimeout(() => {
      // Step 1: Drop down closed (collapsed)
      transY.value = withTiming(80, { duration: duration });

      // Step 2: Open after dropping down
      transX.value = withDelay(duration, withTiming(0, { duration: duration }));

      // Auto-hide timer
      setTimeout(() => {
        // Step 3: Close first, then go up
        transX.value = withTiming(effectiveTextLength + 12, { duration });
        transY.value = withDelay(
          duration,
          withTiming(
            -effectiveToastHeight,
            {
              duration: duration,
              easing: Easing.bezierFn(0.36, 0, 0.66, -0.56),
            },
            () => {
              runOnJS(onComplete)(toast.id);
            }
          )
        );
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

  const rView = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: transY.value }],
      opacity: interpolate(
        transY.value,
        [-effectiveToastHeight, 80],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  }, [effectiveToastHeight]);

  const rOuterView = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -Math.max(transX.value, 1) / 2 }],
    };
  }, []);

  const rInnerView = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: transX.value }],
    };
  }, []);

  const rText = useAnimatedStyle(() => {
    return {
      opacity: interpolate(transX.value, [0, effectiveTextLength], [1, 0]),
    };
  }, [effectiveTextLength]);

  function generateImage(type: "info" | "success" | "error") {
    if (type === "success") {
      return require("../assets/images/check.png");
    } else if (type === "error") {
      return require("../assets/images/error-icon.png");
    } else {
      return require("../assets/images/info_Icon.png");
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

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const width = Math.floor(event.nativeEvent.layout.width);
    if (localTextLength !== width) {
      setLocalTextLength(width);
    }
  };

  const handleViewLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (localToastHeight !== height) {
      setLocalToastHeight(height);
    }
  };

  return (
    <Animated.View
      style={[styles.container, { top: index * 60 }, rView]}
      onLayout={handleViewLayout}
    >
      <Animated.View style={[styles.outerContainer, rOuterView]}>
        <Animated.View
          style={[
            styles.innerContainer,
            rInnerView,
            { backgroundColor: generateBackgroundColor(toast.type) },
          ]}
        >
          <Image source={generateImage(toast.type)} style={styles.image} />
          <Animated.Text
            style={[styles.text, rText]}
            numberOfLines={0}
            onLayout={handleTextLayout}
          >
            {toast.text}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
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
    const transY = useSharedValue(0);
    const transX = useSharedValue(0);

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

        transX.value = withTiming(textLength + 12, { duration });
        transY.value = withDelay(
          duration,
          withTiming(
            -toastHeight,
            {
              duration: duration,
              easing: Easing.bezierFn(0.36, 0, 0.66, -0.56),
            },
            () => {
              runOnJS(handleToastComplete)(toastId);
            }
          )
        );
      },
      [duration, textLength, toastHeight, transX, transY, handleToastComplete]
    );

    // Show animation
    const showAnimation = useCallback(
      (toast: ToastItem) => {
        transY.value = withTiming(80, { duration: duration });
        transX.value = withDelay(
          duration,
          withTiming(0, { duration: duration })
        );

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
        transX.value = withTiming(textLength + 24, { duration: 200 });

        setTimeout(() => {
          showAnimation(currentToast);
        }, 50);
      }
    }, [mode, currentToast, textLength, toastHeight, transX, showAnimation]);

    // Effect to initialize position
    useEffect(() => {
      if (toastHeight > 0) {
        transY.value = -toastHeight;
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
        <Animated.View
          key={toastKey}
          onLayout={handleViewLayout}
          style={[
            styles.container,
            mode === "stack" && { top: index * 60 }, // Stack with spacing
            rView,
          ]}
        >
          <Animated.View style={[styles.outerContainer, rOuterView]}>
            <Animated.View
              style={[
                styles.innerContainer,
                rInnerView,
                { backgroundColor: generateBackgroundColor(toast.type) },
              ]}
            >
              <Image source={generateImage(toast.type)} style={styles.image} />
              <Animated.Text
                onLayout={handleTextLayout}
                style={[styles.text, rText]}
                numberOfLines={0} // Allow multiline
              >
                {toast.text}
              </Animated.Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      );
    };

    const rView = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: transY.value }],
        opacity: interpolate(
          transY.value,
          [-toastHeight, 80],
          [0, 1],
          Extrapolation.CLAMP
        ),
      };
    }, [toastHeight]);

    const rOuterView = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: -Math.max(transX.value, 1) / 2 }],
      };
    }, []);

    const rInnerView = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: transX.value }],
      };
    }, []);

    const rText = useAnimatedStyle(() => {
      return {
        opacity: interpolate(transX.value, [0, textLength], [1, 0]),
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
        return require("../assets/images/check.png");
      } else if (type === "error") {
        return require("../assets/images/error-icon.png");
      } else {
        return require("../assets/images/info_Icon.png");
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

    function handleTextLayout(event: LayoutChangeEvent) {
      if (textLength !== event.nativeEvent.layout.width) {
        setTextLength(Math.floor(event.nativeEvent.layout.width));
      }
    }

    function handleViewLayout(event: LayoutChangeEvent) {
      if (toastHeight !== event.nativeEvent.layout.height) {
        setToastHeight(event.nativeEvent.layout.height);
      }
    }
  }
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    zIndex: 100,
    marginHorizontal: 24,
    alignSelf: "center",
    width: "90%",
  },
  outerContainer: {
    overflow: "hidden",
    borderRadius: 40,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
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
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 12,
    textAlign: "left",
    flex: 1,
    flexWrap: "wrap",
  },
});

export default Toast;
