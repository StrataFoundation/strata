import React from "react";
import { useColorMode, Switch, Icon } from "@chakra-ui/react";
import { IoMoon, IoSunny } from "react-icons/io5";

export const DarkModeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";
  return (
    <Switch
      position="fixed"
      top="1rem"
      right="1rem"
      isChecked={isDark}
      onChange={toggleColorMode}
    >
      <Icon as={isDark ? IoMoon : IoSunny} color={isDark ? "white" : "black"} />
    </Switch>
  );
};
