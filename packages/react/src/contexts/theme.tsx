import React, { FC } from "react";
import {
  ThemeProvider as ChakraThemeProvider,
  extendTheme,
  
} from "@chakra-ui/react";

const primary = {
  50: "#fdefe7",
  100: "#fbd6c2",
  200: "#f8bb99",
  300: "#f5a070",
  400: "#f28b52",
  500: "#f07733",
  600: "#ee6f2e",
  700: "#ec6427",
  800: "#e95a20",
  900: "#e54714",
};

export const theme: any = extendTheme({
  shadows: {
    outline: "none",
  },
  components: {
    Button: {
      baseStyle: { _focus: { boxShadow: "none" } },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: "#E5E7EB",
          },
        },
      },
    },
  },
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
    black: {
      300: "#23273B",
      500: "#0F1324",
      700: "#363135",
    },
    orange: primary,
    primary,
  },
});

export const ThemeProvider: FC = ({ children }) => (
  // @ts-ignore
  <ChakraThemeProvider theme={theme}>{children}</ChakraThemeProvider>
);
