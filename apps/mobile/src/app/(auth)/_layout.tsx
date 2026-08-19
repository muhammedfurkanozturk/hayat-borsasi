import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack initialRouteName="giris" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="giris" />
      <Stack.Screen name="kayit" />
    </Stack>
  );
}
