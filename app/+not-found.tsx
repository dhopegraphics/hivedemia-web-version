
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/Colors";
import { useColorScheme } from "nativewind";

export default function NotFoundScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Oops!",
          headerStyle: {
            backgroundColor: isDark ? colors.dark : colors.white,
          },
          headerTintColor: isDark ? colors.white : colors.dark,
        }}
      />
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark : colors.white },
        ]}
      >
        <Text className="dark:text-offwhite">
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text className="dark:text-green-500">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});