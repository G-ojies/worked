# Devpost submission: Worked

Category: **Next Gen Award**

## Tagline

Past exam questions with every step of the solution written out. Works with no signal.

## Description

### The problem

Past questions are how Nigerian undergraduates revise. They circulate as
photographed exam papers in WhatsApp groups: the questions, never the answers.
When I could not solve one, there was nowhere to look. The students who need
the most help are also the ones with the least data and the weakest connection.

I am a penultimate year computer science student. I built the first version of
this for my own exams, as worked solutions to my department's papers. Worked
is that, as an app any student can carry into the hall.

### What it does

- 243 worked questions across six computer science courses, including real
  past papers. Every solution shows the working: matrices written out, network
  flows augmented step by step, parse tables filled in, diagrams drawn.
- Attempt first, then reveal. The solution stays hidden until you ask for it.
- One tap after each question: shaky or got it. Progress, a shaky-only filter
  and a day streak are built from those marks.
- Flashcards, with the questions you find shaky dealt first.
- Timed mock papers drawn from the real papers, then marked strictly against
  the worked solutions.
- Entirely offline. All content ships in the app and no revision data leaves
  the phone. There are no accounts, no ads and no tracking.

### How it makes money, and how RevenueCat is used

The free tier is one whole course with every tool, plus the first two sections
of each other course. Worked Plus unlocks everything.

Plans are named for how students actually revise: Monthly for the exam month,
Semester as the default, and Lifetime.

- One entitlement, `Plus`. The app only asks whether it is active, so plans can
  be added or repriced from the RevenueCat dashboard with no app release.
- The paywall is built from the current offering, so prices and currency come
  from RevenueCat and localise on their own.
- A customer info listener keeps access correct through renewal and expiry.
- Offline first: cached customer info means Plus keeps working with no signal,
  and a failed offerings fetch never takes paid access away.
- Locked content is gated at the route, so a deep link cannot skip the paywall.
- Restore purchases on the paywall and in settings.

### How I built it

Expo SDK 57 and React Native, with Expo Router. Solutions are HTML rendered in
a locked-down WebView, because they carry tables, matrices and SVG diagrams
that native text cannot. A build script converts my study pages into the
offline bundle. Claude Code was used as a coding assistant.

### What is next

More courses and more departments, written by students who have just sat the
papers, with a share of Plus revenue going to each contributor.

## Checklist

- [x] Demo video: https://youtu.be/DTX8kb861vw
- [x] Public repository: https://github.com/G-ojies/worked
- [ ] 1024 x 1024 icon: `assets/icon.png`
- [ ] Screenshot at 1179 x 2556, no device frame
- [ ] Registered with the school email address
