import { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FloatingOptionsMenu = ({
  isVisible,
  task,
  onOptionSelect,
  onClose,
  position,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [posX] = useState(new Animated.Value(0));
  const [posY] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true, // fine for opacity
        }),
        Animated.spring(posX, {
          toValue: position.x - 170,
          useNativeDriver: true, // NOW true (because it's a transform)
          bounciness: 10,
        }),
        Animated.spring(posY, {
          toValue: position.y - 100,
          useNativeDriver: true, // NOW true
          bounciness: 10,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, position , fadeAnim, posX, posY]);

  const options = task
    ? [
        { id: 1, label: "Edit Task" },
        {
          id: 2,
          label: task.important ? "UnMark as Important" : "Mark as Important",
        },
        { id: 3, label: "Delete Task" },
      ]
    : [];

  return (
    <Animated.View
      style={[
        styles.menuContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateX: posX }, { translateY: posY }],
        },
      ]}
    >
      {isVisible && (
        <View style={styles.menu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.option}
              onPress={() => {
                onOptionSelect(option, task);
                onClose();
              }}
            >
              <Text>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: "absolute",
    zIndex: 1000,
  },
  menu: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    elevation: 5,
   boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});

export default FloatingOptionsMenu;
