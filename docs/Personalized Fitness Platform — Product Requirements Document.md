# Personalized Fitness Platform
## Product Requirements Document — v0.1

**Project:** Workout Planner → Full Fitness Platform  
**Repository:** `vikas0223/workout_planner`  
**Reference Product:** MuscleWiki  
**Primary Platform:** Responsive Web / PWA  
**Frontend:** Next.js + React + TypeScript  
**Backend:** Supabase  
**Status:** Product definition / pre-refactor

---

# 1. Product Vision

Transform the existing Personalized Workout Planner from a linear workout-generation prototype into a full fitness platform that helps users:

**discover → plan → perform → track → understand → improve**

The central differentiator is personalization.

The system should not merely generate a workout once. It should progressively understand the user's:

- goals
- training experience
- exercise preferences
- equipment
- schedule
- workout history
- performance
- feedback
- consistency

and use those signals to generate better recommendations over time.

---

# 2. Product Positioning

The product should not attempt to become a direct clone of MuscleWiki.

MuscleWiki should primarily inspire:

- exercise discovery
- muscle-centric navigation
- body mapping
- exercise information
- workout construction

The product's differentiation should be:

> **A personalized fitness system that learns from the user's actual training behavior and progressively improves the workouts it recommends.**

---

# 3. Target Users

## Primary

General fitness users across:

- beginner
- intermediate
- advanced

## Supported environments

- commercial gym
- home gym
- bodyweight training
- limited-equipment training

## Primary user goals

The system should support configurable goals such as:

- muscle building
- strength
- fat loss
- general fitness
- endurance
- mobility
- conditioning

The exact goal taxonomy will be finalized during implementation.

---

# 4. Product Principles

## Principle 1 — Minimum necessary input

Do not ask users for unnecessary information.

The app should progressively collect only information that materially improves personalization.

## Principle 2 — One decision at a time

The onboarding/generator experience should present one meaningful question per screen.

## Principle 3 — Always show progress

The onboarding must contain a persistent progress indicator:

```text
Step 4 of 10
████████████░░░░░░ 65%
```

The user should know:

- where they are
- how much remains
- what the current step accomplishes

## Principle 4 — Never trap the user

Users can:

- go back
- edit previous answers
- skip optional inputs
- exit and resume later

## Principle 5 — Generated workouts are editable

AI/rules should generate a starting point, not an immutable prescription.

## Principle 6 — Data should create value

Every workout interaction should have the potential to improve:

- progress tracking
- personalization
- recommendations
- future workout generation

---

# 5. Product Architecture

The platform will contain the following major domains:

```text
Home
│
├── Generate Workout
├── Manual Workout Builder
├── Exercise Library
├── Muscle Map
├── Joint Map
├── Workout Session
├── Workout History
├── Saved Plans
├── Progress
├── Recommendations
├── Profile
└── Settings
```

---

# 6. Mobile Navigation

Recommended persistent bottom navigation:

```text
Home
Explore
Start +
Progress
Profile
```

## Home

Personalized overview.

## Explore

Contains:

- exercise library
- workout plans
- muscle map
- joint map
- search
- filters

## Start +

Primary action.

Opens:

```text
Generate Workout
Build Workout
Start Saved Workout
Resume Workout
```

## Progress

Contains performance and training analytics.

## Profile

Contains:

- account
- preferences
- goals
- saved preferences
- settings

---

# 7. Desktop Navigation

Desktop should use a persistent application shell.

Recommended:

```text
┌───────────────────────────────────────────────┐
│ Logo             Search        Profile        │
├─────────────┬─────────────────────────────────┤
│             │                                 │
│ Home        │                                 │
│ Explore     │            Content              │
│ Start       │                                 │
│ Workouts    │                                 │
│ Progress    │                                 │
│ Profile     │                                 │
│             │                                 │
└─────────────┴─────────────────────────────────┘
```

The desktop sidebar should collapse into a compact rail when appropriate.

---

# 8. Guest Mode

Guest mode is mandatory.

A user should be able to:

- generate workouts
- browse exercises
- build workouts
- perform workouts
- record progress locally
- save workouts locally
- provide feedback

without creating an account.

## Optional account

The user can later create an account.

The migration flow should be:

```text
Guest Data
    ↓
Create Account
    ↓
Authenticate
    ↓
Migrate Local Data
    ↓
Continue Fitness Journey
```

No existing workout data should be lost.

---

# 9. Personalized Onboarding / Workout Generator

The onboarding should be sequential rather than a single large form.

## Example flow

### Step 1 — Goal

> What are you training for?

### Step 2 — Experience

> How long have you been training?

### Step 3 — Training location

> Where do you train?

- Gym
- Home
- Both

### Step 4 — Equipment

> What equipment do you have?

### Step 5 — Training frequency

> How many days per week can you train?

### Step 6 — Preferred workout duration

> How much time do you normally have?

### Step 7 — Preferred muscles / training style

### Step 8 — Exercise preferences

Preferred exercises can be chosen after the initial profile is established.

### Step 9 — Basic body information

Collect only required information such as:

- age
- height
- weight

This should be optional where the calculation does not require it.

### Step 10 — Generate

Show:

```text
Your profile is ready.

Generating your personalized workout...
```

---

# 10. Progress Indicator

The generator must include:

```text
Personalization

Step 5 / 9

█████████████░░░░░
        65%

~2 minutes remaining
```

Do not make fake precise time claims.

Prefer:

- "Almost there"
- "3 steps remaining"
- "About 1 minute"
- "Final step"

The indicator should animate smoothly between steps.

---

# 11. Muscle Map

The platform will include an interactive anatomy interface.

## Requirements

Support:

- male representation
- female representation
- front view
- back view

Users can select specific muscles.

Example:

```text
Chest
Back
Lats
Shoulders
Biceps
Triceps
Forearms
Abs
Obliques
Quads
Hamstrings
Glutes
Calves
```

Selecting a muscle should reveal:

```text
Selected Muscle
      ↓
Recommended Exercises
      ↓
Exercise details
      ↓
Add to Workout
```

---

# 12. Joint Map

The user specifically requested joint-based discovery.

The app should therefore support:

```text
Shoulder
Elbow
Wrist
Hip
Knee
Ankle
Neck
Spine
```

Selecting a joint should show appropriate movement/exercise categories.

This feature must include clear safety language and should not imply medical diagnosis or rehabilitation advice.

For example:

> "Exercises associated with this joint"

rather than:

> "Exercises that fix your knee."

---

# 13. Exercise Library

The exercise library should be a first-class product area.

## Search

Search by:

- exercise name
- muscle
- equipment
- movement
- difficulty

## Filters

```text
Muscle
Equipment
Difficulty
Movement type
Training goal
```

## Exercise detail

Each exercise should provide:

- exercise name
- demonstration
- target muscles
- secondary muscles
- equipment
- instructions
- sets/reps examples
- common mistakes
- alternatives
- favorites
- add to workout

---

# 14. Exercise Demonstrations

Priority:

### First choice
Copyright-cleared/licensed video.

### Fallback

Custom animated exercise illustrations.

Do not use scraped copyrighted exercise videos merely because they are publicly accessible.

Exercise media licensing must be handled independently from the application logic.

---

# 15. Workout Builder

Users must have two workflows:

## A. Generate

```text
Preferences
↓
Generate
↓
Review
↓
Edit
↓
Save
```

## B. Build manually

```text
Create Workout
↓
Add Exercise
↓
Configure
↓
Reorder
↓
Save
```

---

# 16. Generated Workout Editing

Every generated workout should support:

- remove exercise
- replace exercise
- add exercise
- reorder exercise
- modify sets
- modify reps
- modify rest
- modify duration
- save as template

The user should be able to say:

> "Replace this exercise."

without restarting the generator.

---

# 17. Workout Session

The actual workout screen is a separate experience from workout planning.

Its primary task is execution.

## Priority hierarchy

```text
Current exercise
      ↓
Demonstration
      ↓
Sets / reps / weight
      ↓
Complete set
      ↓
Rest timer
      ↓
Next exercise
```

The UI should minimize distractions during active training.

---

# 18. Workout Logging

Users should be able to record:

- weight
- reps
- sets
- duration
- completed exercises
- notes
- perceived difficulty / RPE
- rest time where relevant

The system should show previous performance.

Example:

```text
Bench Press

Previous:
55 kg × 8

Today's target:
57.5 kg × 8
```

This is important for progressive overload.

Hevy's current product similarly emphasizes set logging, previous performance, progress charts, routine planning and detailed workout history.

---

# 19. Workout Completion

After a workout:

```text
Workout Complete 🎉

12 exercises
58 minutes
420 kcal
+8% volume

[View Progress]
[Rate Workout]
[Save Workout]
[Done]
```

Then collect feedback.

---

# 20. Feedback System

Feedback should contain:

### Overall rating

1–5 stars.

### Difficulty

- Too easy
- Just right
- Too hard

### Structured feedback

Possible options:

- Loved the exercise selection
- Too repetitive
- Too many exercises
- Too difficult
- Too easy
- Workout was too long
- Workout was too short
- Equipment mismatch

### Free text

Optional.

This creates much better training data than free-form comments alone.

---

# 21. Recommendation Engine

The recommendation system should evolve in stages.

## V1

Rule/content-based:

```text
Goal
+
Experience
+
Equipment
+
Muscles
+
Duration
+
History
```

## V2

Behavior-aware:

```text
Completion
Ratings
Skipped exercises
Replacements
Frequency
Workout duration
Preferred muscles
Preferred equipment
```

## V3

Adaptive recommendation:

```text
Historical behavior
+
Performance
+
Consistency
+
Preference
+
Recent training
+
Workout fatigue signals
```

The system should explain recommendations.

Example:

> "Recommended because you regularly complete 45–60 minute upper-body workouts and rated similar sessions 4.7/5."

Avoid opaque:

> "Recommended for you."

---

# 22. Progressive Difficulty

Difficulty should not simply be:

```text
beginner
intermediate
advanced
```

It should eventually incorporate:

- completed reps
- target achievement
- RPE
- workout consistency
- progression
- skipped exercises
- user feedback

The current difficulty adjustment code already attempts history-based adaptation, but it is rule-heavy and should become a dedicated domain service.

---

# 23. Home Dashboard

The dashboard should be the user's command center.

## Top

```text
Good morning

Ready for today's session?
```

## Today's workout

```text
Upper Body
52 min
6 exercises

[Start]
```

## Weekly summary

```text
Workouts       4
Minutes       212
Volume       18.4k kg
Calories      1,840
```

## Visualizations

Include:

- workout frequency
- training volume
- muscle distribution
- calories
- consistency
- PRs
- exercise progression

---

# 24. Realtime Dashboard

The current application already has Supabase realtime subscriptions and Recharts infrastructure, so this should be retained conceptually.

The redesigned architecture should make dashboard data flow through a normalized stats layer.

For example:

```text
Workout Event
     ↓
Stats Aggregator
     ↓
User Metrics
     ↓
Realtime Update
     ↓
Dashboard
```

Charts should update when the underlying workout data changes.

---

# 25. Progress

The Progress section should contain multiple analytical levels.

## Overview

- weekly workouts
- consistency
- total volume
- total time

## Strength

- best lifts
- estimated 1RM where appropriate
- exercise progression

## Muscle distribution

```text
Chest       ████████
Back        ██████
Legs        █████████
Shoulders   ████
Arms        █████
```

## History

Calendar/timeline of training.

---

# 26. Saved Workouts

Users must be able to:

- save generated workouts
- save manually built workouts
- favorite workouts
- rename workouts
- duplicate workouts
- edit workouts
- delete workouts
- reuse workouts

---

# 27. Sharing

Social features are later-phase, but workout sharing should be designed into the data model.

Initial sharing:

```text
Share Workout
↓
Public workout link
```

Later:

- social profiles
- followers
- workout feed
- likes
- comments
- copied workouts
- challenges

---

# 28. Nutrition

Nutrition is explicitly **not an initial focus**.

Future scope:

- calorie estimation
- calorie targets
- protein target
- macro tracking
- meal logging
- hydration

The architecture should leave room for these features without contaminating the core workout domain.

---

# 29. PWA

The application should eventually be installable as a Progressive Web App.

Requirements:

- Web App Manifest
- service worker
- installable experience
- cached shell
- offline workout logging
- local persistence
- sync queue
- background synchronization where supported

Priority:

**V2**

The application should still function normally as a website.

---

# 30. Offline Architecture

The workout experience should be designed around:

```text
Local first
    ↓
Workout session
    ↓
IndexedDB / local persistence
    ↓
Sync queue
    ↓
Supabase
```

This is preferable to relying exclusively on `localStorage` as the long-term data store.

---

# 31. Data Model

Initial conceptual schema:

```text
users
profiles
fitness_goals

exercises
exercise_muscles
exercise_equipment
exercise_media
exercise_alternatives
exercise_joints

workout_templates
workout_template_exercises

generated_workouts
generated_workout_exercises

workout_sessions
workout_session_exercises
sets

exercise_favorites
workout_favorites

feedback
ratings

user_preferences
recommendation_events
recommendations

user_stats
personal_records
```

This should be finalized before database migration work begins.

---

# 32. Core Event Model

The application should capture meaningful events such as:

```text
WORKOUT_GENERATED
WORKOUT_EDITED
WORKOUT_STARTED
EXERCISE_STARTED
SET_COMPLETED
EXERCISE_COMPLETED
WORKOUT_COMPLETED
EXERCISE_SKIPPED
EXERCISE_REPLACED
WORKOUT_RATED
WORKOUT_SAVED
EXERCISE_FAVORITED
WORKOUT_SHARED
```

These events become the foundation for personalization.

---

# 33. Responsive Design

The interface must be designed for:

### Mobile

320px+
375px
390px
412px
430px

### Tablet

768px
834px
1024px

### Desktop

1280px
1440px
1920px+

The layout must not simply scale down.

Mobile may change:

- navigation
- card layout
- ordering
- controls
- exercise interaction
- chart orientation
- modal behavior

---

# 34. Responsive Rules

Never rely primarily on fixed desktop cards.

Prefer:

```text
CSS Grid
Flexbox
clamp()
min()
max()
responsive spacing
container widths
```

Avoid:

```text
fixed 800px cards
fixed-height content
desktop-only modal assumptions
large nested glassmorphism panels
```

---

# 35. Visual Direction

The existing visual language uses:

- lavender/indigo gradient
- glassmorphism
- rounded cards
- purple accent
- soft shadows

The redesign should preserve the overall identity but reduce visual heaviness.

The future interface should move toward:

```text
clean fitness product
+
soft depth
+
strong typography
+
clear data hierarchy
+
minimal visual noise
```

The glass effect should become an accent rather than the structural basis of every screen.

---

# 36. Accessibility

Requirements:

- keyboard navigation
- visible focus states
- semantic headings
- accessible form labels
- sufficient contrast
- touch targets
- screen-reader-friendly dialogs
- reduced-motion support
- accessible charts with textual summaries

---

# 37. Performance

Goals:

- fast initial load
- lazy-load exercise media
- minimize unnecessary client components
- cache exercise metadata
- virtualize long exercise lists where necessary
- avoid rendering entire exercise libraries at once
- avoid repeated Supabase queries
- debounce search
- optimize chart rendering

---

# 38. Security

Requirements:

- Supabase Row Level Security
- no service-role key in client bundle
- validated inputs
- server-side authorization for protected operations
- rate limiting for expensive generation endpoints
- safe user-generated content handling
- controlled sharing permissions

---

# 39. Current Codebase Refactor

The current prototype should NOT be deleted and recreated blindly.

Refactor strategy:

```text
CURRENT APP
     ↓
Audit
     ↓
Stabilize
     ↓
Extract domains
     ↓
Create new shell
     ↓
Move existing functionality
     ↓
Replace weak implementations
     ↓
Add new product capabilities
```

---

# 40. Recommended Future Repository Structure

```text
src/
├── app/
│   ├── (marketing)/
│   ├── (app)/
│   │   ├── home/
│   │   ├── explore/
│   │   ├── start/
│   │   ├── progress/
│   │   └── profile/
│   ├── workout/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── charts/
│   ├── anatomy/
│   └── media/
│
├── features/
│   ├── authentication/
│   ├── onboarding/
│   ├── workout-generator/
│   ├── workout-builder/
│   ├── workout-session/
│   ├── exercise-library/
│   ├── recommendations/
│   ├── progress/
│   ├── feedback/
│   └── sharing/
│
├── lib/
│   ├── supabase/
│   ├── analytics/
│   ├── recommendation/
│   └── validation/
│
├── data/
│
├── hooks/
│
├── types/
│
└── styles/
```

This is a target architecture, not a demand to blindly reproduce this directory tree.

---

# 41. MVP

The first major release should include:

### Navigation

- Home
- Explore
- Start
- Progress
- Profile

### Authentication

- guest
- optional account

### Generator

- one-question-at-a-time onboarding
- progress indicator
- goal
- experience
- location
- equipment
- frequency
- duration
- basic physical information
- muscle selection

### Exercise discovery

- search
- filters
- muscle map
- joint map

### Workout

- generated workouts
- manual builder
- editing
- saving
- execution
- set tracking

### Progress

- workout history
- basic charts
- volume
- consistency
- muscle distribution

### Feedback

- rating
- difficulty
- structured feedback

---

# 42. V1.5

Add:

- smarter recommendations
- adaptive difficulty
- richer analytics
- exercise alternatives
- workout duplication
- PWA installability
- offline session logging
- sync queue

---

# 43. V2

Add:

- nutrition
- calorie estimation
- social workout sharing
- public workout links
- profiles
- community
- challenges
- richer AI coaching

---

# 44. Explicitly Out of Initial Scope

Do not allow these features to delay the first working product:

- full social network
- nutrition database
- meal planner
- wearable integrations
- smartwatch apps
- advanced medical/rehab recommendations
- complex generative AI coaching
- multilingual support

---

# 45. Key Success Metrics

The application should measure:

### Activation

Percentage of users reaching first generated workout.

### Workout completion

Percentage of generated workouts actually started/completed.

### Retention

7-day / 30-day returning users.

### Personalization quality

User rating of recommended workouts.

### Editing behavior

How often users:

- replace exercises
- remove exercises
- add exercises

### Recommendation quality

Recommendation click → workout start → completion.

### Progress engagement

Frequency of users viewing progress analytics.

---

# 46. Critical Product Loop

The final product should revolve around:

```text
Discover
   ↓
Generate / Build
   ↓
Start
   ↓
Track
   ↓
Complete
   ↓
Give Feedback
   ↓
Analyze Progress
   ↓
Learn Preferences
   ↓
Recommend
   ↓
Generate Better Workout
```

This is the core product loop.

---

# 47. Engineering Priorities

Priority order:

## P0 — Foundation

- architecture
- routing
- application shell
- state model
- database schema
- auth
- design tokens
- responsive system

## P1 — Core fitness

- exercise library
- generator
- manual builder
- workout session
- logging
- saved workouts

## P2 — Intelligence

- recommendations
- adaptive difficulty
- personalization
- feedback learning

## P3 — Analytics

- dashboard
- charts
- progression
- muscle distribution
- PRs

## P4 — Platform

- PWA
- offline sync
- sharing
- social
- nutrition

---

# 48. Definition of Done

A feature is not complete merely because the desktop screen works.

Each feature must pass:

```text
Desktop
Tablet
Mobile
Keyboard
Touch
Loading
Empty state
Error state
Offline behavior where applicable
Persist/reload
Guest mode
Authenticated mode
```

---

# 49. First Engineering Task

Before implementing new features, the coding agent must perform:

### Repository audit

- inspect all routes
- inspect all components
- inspect all contexts
- inspect all hooks
- inspect all data modules
- inspect Supabase usage
- identify duplicated implementations
- identify unused dependencies
- identify dead code
- identify browser-only assumptions
- identify localStorage data contracts
- identify inconsistent types
- identify state ownership problems
- identify accessibility issues
- identify responsive issues

The agent must produce an audit before making the large refactor.

---

# 50. First Refactor Rule

**Do not rewrite the entire application in one pass.**

Use incremental migration:

```text
Audit
↓
Shell
↓
Navigation
↓
Generator extraction
↓
Exercise library
↓
Workout session
↓
Progress
↓
Recommendations
↓
Cleanup
```

Existing working features must remain functional during migration.

---

# 51. Product North Star

The application should eventually answer:

> **"What should I train today, how should I train it, and what should I do next?"**

without forcing the user to become a fitness-programming expert.

That is the product.