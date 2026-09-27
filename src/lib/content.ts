import index from "../content/index.json";
import styles from "../content/styles.json";

export type Question = {
  id: string;
  num: string;
  marks: string;
  title: string;
  ask: string;
  label: string;
};

export type Section = {
  id: string;
  letter: string;
  title: string;
  tally: string;
  kind: "topic" | "reference" | "paper";
  note: string;
  questions: Question[];
};

export type Course = {
  id: string;
  code: string;
  name: string;
  blurb: string;
  free: boolean;
  count: number;
  sections: Section[];
};

export type Body = { prompt: string; solution: string };

export const courses = index as Course[];
export const contentCss: string = styles.css;

export const getCourse = (id: string) => courses.find((c) => c.id === id);

// Bodies are the heavy part (about 800 KB of HTML in all), so each course's
// file is only pulled in when that course is opened. Metro needs the literal
// paths, hence the explicit table.
const loaders: Record<string, () => Record<string, Body>> = {
  csc328: () => require("../content/csc328.json"),
  ict305: () => require("../content/ict305.json"),
  dts304: () => require("../content/dts304.json"),
  csc325: () => require("../content/csc325.json"),
  csc311: () => require("../content/csc311.json"),
  csc322: () => require("../content/csc322.json"),
};

export const getBodies = (courseId: string): Record<string, Body> => loaders[courseId]?.() ?? {};

export const flatten = (course: Course) =>
  course.sections.flatMap((section) => section.questions.map((question) => ({ section, question })));

// Free tier: one whole course, plus the first two sections of every other
// course. Enough to revise from properly, and enough to judge the rest by.
export const FREE_SECTIONS = 2;

export function sectionUnlocked(course: Course, section: Section, plus: boolean) {
  if (plus || course.free) return true;
  return course.sections.indexOf(section) < FREE_SECTIONS;
}

export const toolsUnlocked = (course: Course, plus: boolean) => plus || course.free;

export const totalQuestions = courses.reduce((n, c) => n + c.count, 0);
