import React, { FC } from "react";
import {
  extendTheme,
  ChakraProvider,
  theme as chakraTheme,
} from "@chakra-ui/react";
import { runIfFn, mergeWith } from "@chakra-ui/utils";

const primary = {
  50: "rgba(238, 111, 46, 0.1)",
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

function primaryAlwaysLightMode(componentConfig: any): any {
  return {
    ...componentConfig,
    variants: Object.entries(componentConfig.variants || {}).reduce(
      (acc, entry) => {
        acc[entry[0]] = ({ colorMode, colorScheme, ...rest }: any) =>
          runIfFn(entry[1], {
            ...rest,
            colorScheme,
            colorMode: colorScheme === "primary" ? "light" : colorMode,
          });

        return acc;
      },
      {} as Record<string, any>
    ),
    baseStyle: ({ colorMode, colorScheme, ...rest }: any) =>
      runIfFn(componentConfig.baseStyle, {
        ...rest,
        colorScheme,
        colorMode: colorScheme === "primary" ? "light" : colorMode,
      }),
  };
}

export const theme: any = extendTheme({
  shadows: {
    outline: "none",
  },
  styles: {
    // CSS reset gets rid of some things we do want
    global: {
      li: {
        display: "list-item",
        textAlign: "-webkit-match-parent",
      },
      ul: {
        paddingInlineStart: "20px",
      },
      ol: {
        display: "block",
        listStyleType: "decimal",
        marginBlockStart: "1em",
        marginBlockEnd: "1em",
        marginInlineStart: "0px",
        marginInlineEnd: "0px",
        paddingInlineStart: "40px",
      },
      blockquote: {
        display: "block",
        marginBlockStart: "1em",
        marginBlockEnd: "1em",
        marginInlineStart: "40px",
        marginInlineEnd: "40px",

        borderLeft: "5px solid #ccc",
        margin: "1.5em 10px",
        padding: "0.5em 10px 0.5em 10px",
      },
      code: { fontFamily: "monospace" },
    },
  },
  initialColorMode: "light",
  useSystemColorMode: false,
  fonts: {
    ...chakraTheme.fonts,
    body: `Avenir,Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"`,
    heading: `Avenir,Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"`,
  },
  components: {
    Button: primaryAlwaysLightMode(
      mergeWith(
        {
          baseStyle: { _focus: { boxShadow: "none" } },
        },
        chakraTheme.components.Button
      )
    ),
    Progress: primaryAlwaysLightMode(chakraTheme.components.Progress),
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

export const ThemeProvider: FC<React.PropsWithChildren<{ resetCSS?: boolean }>> = ({
  children,
  resetCSS = false,
}) => (
  <ChakraProvider resetCSS={resetCSS} theme={theme}>
    {/* @ts-ignore */}
    {children}
  </ChakraProvider>
);
