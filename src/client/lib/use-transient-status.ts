import { useCallback, useEffect, useRef, useState } from "react";

export function useTransientStatus<S extends string>(initial: S) {
  const [status, setStatus] = useState<S>(initial);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const set = useCallback((s: S) => {
    clearTimeout(timerRef.current);
    setStatus(s);
  }, []);

  const setTransient = useCallback((s: S, after: S, ms = 2000) => {
    clearTimeout(timerRef.current);
    setStatus(s);
    timerRef.current = setTimeout(() => setStatus(after), ms);
  }, []);

  return { status, set, setTransient };
}
