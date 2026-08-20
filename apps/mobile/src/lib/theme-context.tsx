import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { Colors, type ThemeColor, type ThemeColors } from "@/constants/theme";

export type Theme = "dark" | "light";

const STORAGE_KEY = "hayat-borsasi-theme";

// Context/Provider yerine harici (React ağacının dışında) bir store —
// kökte iki iç içe özel Provider bileşeni (AuthProvider + bir tema
// Provider'ı) olduğunda React Native/Expo Router'da tekrarlanabilir bir
// "Cannot read properties of null (reading 'useState')" çöküşü oluşuyordu
// (nedeni netleşmedi, isim çakışması değildi). Bu desen tamamen bertaraf
// ediyor — hiçbir yerde ek bir Provider'a sarmaya gerek yok, useThemeMode()
// doğrudan bu store'a abone oluyor.
let currentTheme: Theme = "dark";
const listeners = new Set<() => void>();

// Web'in statik ön-render adımı (Node, window yok) bu modülü component
// render'ından önce yükleyebiliyor — AsyncStorage'ın web shim'i orada
// window.localStorage arayıp çöküyordu. Gerçek tarayıcıda/native'de
// çalışırken bu koşul hep false.
const isWebServer = Platform.OS === "web" && typeof window === "undefined";

if (!isWebServer) {
  AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
    if (stored === "dark" || stored === "light") {
      currentTheme = stored;
      listeners.forEach((listener) => listener());
    }
  });
}

function setTheme(next: Theme) {
  currentTheme = next;
  AsyncStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentTheme;
}

export function useThemeMode() {
  const theme = useSyncExternalStore(subscribe, getSnapshot);
  return { theme, setTheme, colors: Colors[theme] as ThemeColors };
}

export type { ThemeColor };
