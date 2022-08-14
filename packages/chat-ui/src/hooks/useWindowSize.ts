import { useLayoutEffect, useState, useEffect } from "react";

const canUseDOM = typeof window !== "undefined";
const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;

export function useWindowSize() {
  const [size, setSize] = useState(["100vw", "100vh"]);
  useIsomorphicLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth.toString(), window.innerHeight.toString()]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}
