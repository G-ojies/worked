import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { Course } from "../lib/content";

export type Mark = "shaky" | "solid";

type State = {
  marks: Record<string, Record<string, Mark>>;
  last: { course: string; question: string } | null;
  // Days with any revision on them, as YYYY-MM-DD in local time.
  days: string[];
};

const EMPTY: State = { marks: {}, last: null, days: [] };
const KEY = "worked:progress:v1";

const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Progress = State & {
  ready: boolean;
  mark: (course: string, question: string, value: Mark | null) => void;
  visit: (course: string, question: string) => void;
  tally: (course: Course) => { solid: number; shaky: number; left: number };
  streak: number;
  reset: () => void;
};

const Ctx = createContext<Progress | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    // Never write before the first read lands, or a slow read would be
    // overwritten by the empty starting state.
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const touch = (s: State): State => (s.days.includes(today()) ? s : { ...s, days: [...s.days, today()].slice(-120) });

  const mark = useCallback((course: string, question: string, value: Mark | null) => {
    setState((s) => {
      const forCourse = { ...(s.marks[course] ?? {}) };
      if (value) forCourse[question] = value;
      else delete forCourse[question];
      return touch({ ...s, marks: { ...s.marks, [course]: forCourse } });
    });
  }, []);

  const visit = useCallback((course: string, question: string) => {
    setState((s) =>
      s.last?.course === course && s.last.question === question ? s : { ...s, last: { course, question } },
    );
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo<Progress>(() => {
    let streak = 0;
    const cursor = new Date();
    // A streak survives until the end of today: yesterday still counts.
    if (!state.days.includes(today(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (state.days.includes(today(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      ...state,
      ready,
      mark,
      visit,
      reset,
      streak,
      tally: (course) => {
        const marks = Object.values(state.marks[course.id] ?? {});
        const solid = marks.filter((m) => m === "solid").length;
        const shaky = marks.filter((m) => m === "shaky").length;
        return { solid, shaky, left: Math.max(0, course.count - solid - shaky) };
      },
    };
  }, [state, ready, mark, visit, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
