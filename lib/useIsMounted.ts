"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * true solo tras el primer render en el cliente. Para componentes que
 * usan createPortal (necesitan document.body, inexistente en el servidor)
 * sin el efecto extra de useEffect(() => setState(true), []), que el
 * linter de hooks de este proyecto ya no acepta (react-hooks/set-state-in-effect).
 */
export function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
