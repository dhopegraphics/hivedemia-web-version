import { colors } from "@/constants/Colors";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { FlatList, Text, TouchableOpacity } from "react-native";

const SessionsBottomSheet = ({
  bottomSheetRef,
  snapPoints,
  isDark,
  chatSessions,
  handleSwitchSession,
  handleDeleteAllChats,
}) => {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: isDark ? colors.dark : colors.light,
      }}
    >
      <BottomSheetView style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: isDark ? "white" : "black",
            marginBottom: 16,
          }}
        >
          Select a Session
        </Text>

        <TouchableOpacity onPress={handleDeleteAllChats}>
          <Text style={{ color: isDark ? "white" : "black", marginBottom: 12 }}>
            Delete All Sessions
          </Text>
        </TouchableOpacity>

        <FlatList
          data={chatSessions}
          keyExtractor={(item) => item.session_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSwitchSession(item.session_id)}
              style={{
                padding: 12,
                borderBottomWidth: 1,
                borderColor: colors.gray,
              }}
            >
              <Text style={{ color: isDark ? "white" : "black" }}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

export default SessionsBottomSheet;
