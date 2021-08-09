import { useState, useLayoutEffect } from "react";

export const useDelayMount = (delay = 0) => {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const delayedMount = setTimeout(() => {
      setMounted(true);
    }, delay);
    return () => clearTimeout(delayedMount);
  }, [delay]);

  return mounted;
};
