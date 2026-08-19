import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { AppDataProvider } from "@/lib/app-data-context";
import { ProfileProvider } from "@/lib/profile-context";
import { useTheme } from "@/hooks/use-theme";

export default function AppLayout() {
  const theme = useTheme();

  return (
    <ProfileProvider>
      <AppDataProvider>
        <Tabs
          initialRouteName="dashboard"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.textSecondary,
            tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Endeks",
              tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="gunluk-giris"
            options={{
              title: "Günlük",
              tabBarIcon: ({ color, size }) => <Feather name="edit-3" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="kategoriler"
            options={{
              title: "Kategoriler",
              tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="karakter-karti"
            options={{
              title: "Karakter",
              tabBarIcon: ({ color, size }) => <Feather name="award" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="rapor"
            options={{
              title: "Rapor",
              tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="ayarlar"
            options={{
              title: "Ayarlar",
              tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
            }}
          />
        </Tabs>
      </AppDataProvider>
    </ProfileProvider>
  );
}
