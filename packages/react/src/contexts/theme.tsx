import React, { FC } from "react";
import {
  ThemeProvider as ChakraThemeProvider,
  CSSReset,
  extendTheme,
} from "@chakra-ui/react";

export const theme = extendTheme({
  shadows: {
    outline: "none",
  },
  components: { Button: { baseStyle: { _focus: { boxShadow: "none" } } } },
  colors: {
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
    green: {
      50: "#ECFDF5",
      100: "#D1FAE5",
      200: "#A7F3D0",
      300: "#6EE7B7",
      400: "#34D399",
      500: "#10B981",
      600: "#059669",
      700: "#047857",
      800: "#065F46",
      900: "#064E3B",
    },
    indigo: {
      50: "#E0E7FF",
      100: "#C7D2FE",
      200: "#A5B4FC",
      300: "#818CF8",
      400: "#6366F1",
      500: "#4F46E5",
      600: "#4338CA",
      700: "#3730A3",
      800: "#312E81",
      900: "#23215e",
    },
  },
});

export const ThemeProvider: FC = ({ children }) => (
  // @ts-ignore
  <ChakraThemeProvider theme={theme}>
    {children}
  </ChakraThemeProvider>
);
