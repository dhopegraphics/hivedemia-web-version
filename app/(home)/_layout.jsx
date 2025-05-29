import { Drawer } from "expo-router/drawer";
import CustomDrawerContent from "@/components/CustomDrawerContent";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";

export default function DrawerLayout() {
  const { colorScheme } = useColorScheme();

  return (
      <Drawer
        drawerContent={CustomDrawerContent}
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor:
            colorScheme === "dark" ? colors.primary : "#7c3aed",
          drawerInactiveTintColor:
            colorScheme === "dark" ? "#94a3b8" : "#64748b",
          drawerStyle: {
            backgroundColor: colorScheme === "dark" ? colors.dark : "#f8fafc",
            width: 280,
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)" // This will render the bottom tabs
          options={{
            title: "Home",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            title: "Profile",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: "Settings",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer>

  );
}
