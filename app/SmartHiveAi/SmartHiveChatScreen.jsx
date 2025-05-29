import { useSmartHiveStore } from "@/backend/store/useSmartHiveStore";
import { useUserStore } from "@/backend/store/useUserStore";
import ChatHeader from "@/components/SmartHive/ChatHeader";
import ChatMessages from "@/components/SmartHive/ChatMessages";
import OptionsMenu from "@/components/SmartHive/OptionsMenu";
import SessionsBottomSheet from "@/components/SmartHive/SessionsBottomSheet";
import { colors } from "@/constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, View } from "react-native";

const SmartHiveChat = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [chatSessions, setChatSessions] = useState([]);
  const { profile: user } = useUserStore.getState();
  const optionsButtonRef = useRef(null);
  const userId = user?.user_id ?? "unknown-user";
  const fetchUser = useUserStore((state) => state.hydrateProfile);
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  const {
    messages,
    isTyping,
    initialize,
    addMessage,

    createChatSession,
    getChatSessions,
    switchSession,
    clearMessages,
    deleteChatSession,
    currentSessionId,
    deleteAllChatSessions,
  } = useSmartHiveStore();

  useEffect(() => {
    fetchUser(); // Fetch user once when component mounts
  }, [fetchUser]);

  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false); // Reset menu visibility
      setChatSessions([]); // Clear chat sessions if needed
    }, [])
  );

  // Initialize chat on mount
   useEffect(() => {
    initialize().then(() => {
      getChatSessions().then(setChatSessions);
    });
  }, [initialize, getChatSessions]);

  const handleCreateSession = async () => {
    await createChatSession();
    bottomSheetRef.current?.expand(); // Open directly
  };

  const handleOpenSession = async () => {
    setMenuVisible(false);
    const sessions = await getChatSessions();
    setChatSessions(sessions);
    bottomSheetRef.current?.expand(); // Open directly
  };

  const handleSwitchSession = async (sessionId) => {
    await switchSession(sessionId);
    bottomSheetRef.current?.close();
  };

  const handleClearChat = async () => {
    setMenuVisible(false);
    await clearMessages();
  };

  const handleDeleteChat = async () => {
    setMenuVisible(false);
    if (currentSessionId) {
      await deleteChatSession(currentSessionId);
    }
  };

  const handleDeleteAllChats = async () => {
    setMenuVisible(false);
    await deleteAllChatSessions();
    router.back();
  };

  const onSend = (newMessages = []) => {
    addMessage(newMessages[0]);
  };

  const handleQuickReply = (reply) => {
    onSend([
      {
        _id: Date.now().toString(),
        text: reply.value,
        createdAt: new Date(),
        user: { _id: userId, name: "You" },
      },
    ]);
  };

  const handleMoreOptions = () => {
    if (optionsButtonRef.current) {
      optionsButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({ top: pageY + height, left: pageX + width - 160 });
        setMenuVisible(true);
      });
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? colors.dark : colors.light,
        paddingTop: 60,
      }}
    >
      <StatusBar style="auto" />

      <ChatHeader
        isDark={isDark}
        optionsButtonRef={optionsButtonRef}
        handleMoreOptions={handleMoreOptions}
      />

      <ChatMessages
        messages={messages}
        onSend={onSend}
        onQuickReply={handleQuickReply}
        isTyping={isTyping}
        typingAnimation={typingAnimation}
        isDark={isDark}
        userId={userId}
      />

      <OptionsMenu
        menuVisible={menuVisible}
        setMenuVisible={setMenuVisible}
        menuPosition={menuPosition}
        isDark={isDark}
        handleCreateSession={handleCreateSession}
        handleOpenSession={handleOpenSession}
        handleClearChat={handleClearChat}
        handleDeleteChat={handleDeleteChat}
      />

      <SessionsBottomSheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={snapPoints}
        isDark={isDark}
        chatSessions={chatSessions}
        handleSwitchSession={handleSwitchSession}
        handleDeleteAllChats={handleDeleteAllChats}
      />
    </View>
  );
};

export default SmartHiveChat;
