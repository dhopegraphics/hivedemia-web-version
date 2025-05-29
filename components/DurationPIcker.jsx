import { useState } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { colors } from "@/constants/Colors";

export default function DurationPicker({ duration, onChange, isDark }) {
  const [visible, setVisible] = useState(false);
  const [hours, setHours] = useState(duration?.getHours() || 0);
  const [minutes, setMinutes] = useState(duration?.getMinutes() || 0);

  const confirm = () => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    onChange(d);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} className="py-2">
        <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
          Duration: {hours}h {minutes}m
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            style={{ backgroundColor: isDark ? colors.dark : colors.white }}
            className=" p-4 rounded-t-xl"
          >
            <Text
              style={{ color: isDark ? colors.offwhite : colors.dark }}
              className="text-center font-bold mb-2"
            >
              Select Duration
            </Text>
            <View className="flex-row justify-around">
              {/* Hours Picker */}
              <Picker
                selectedValue={hours}
                style={{ flex: 1 }}
                onValueChange={setHours}
              >
                {[...Array(24).keys()].map((h) => (
                  <Picker.Item key={h} label={`${h} h`} value={h} />
                ))}
              </Picker>

              {/* Minutes Picker */}
              <Picker
                selectedValue={minutes}
                style={{
                  flex: 1,
                  color: isDark ? colors.offwhite : colors.dark, // 👈 set text color here
                  backgroundColor: isDark ? colors.dark : "#F9FAFB", // optional
                }}
                onValueChange={setMinutes}
              >
                {[...Array(60).keys()].map((m) => (
                  <Picker.Item key={m} label={`${m} m`} value={m} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              onPress={confirm}
              className="mt-4 bg-blue-500 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
