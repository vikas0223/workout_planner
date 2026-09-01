# Workout Planner — Full Fitness Platform
## Product Requirements Document (PRD) v1.0 (Archived)
> **Notice:** This document is archived for historical reference. The authoritative current master PRD is [`docs/Workout Planner — Full Fitness Platform PRD v2.0.md`](./Workout%20Planner%20—%20Full%20Fitness%20Platform%20PRD%20v2.0.md).

**Project:** Workout Planner  
**Current repository:** `github.com/vikas0223/workout_planner`  
**Product type:** Responsive Fitness Web App / Progressive Web App  
**Primary users:** General fitness users — beginners through advanced  
**Primary architecture:** Next.js + React + TypeScript + Supabase + IndexedDB  
**V1 AI strategy:** Deterministic workout engine + LLM explanations/coaching  
**Primary distribution:** Web + installable PWA  
**Play Store:** Optional future distribution, not required for V1

---

# 1. Product Vision

Transform the current Personalized Workout Planner into a full fitness platform that helps users:

**Discover → Plan → Perform → Track → Analyze → Improve**

The application should not simply generate a workout once.

It should gradually build a useful understanding of each user's:

- fitness goal
- training experience
- equipment
- training frequency
- workout duration
- exercise preferences
- workout history
- set-level performance
- feedback
- consistency

and use this information to make future workouts and recommendations more relevant.

---

# 2. Product Positioning

MuscleWiki is a major functional reference for:

- exercise discovery
- muscle-based navigation
- body maps
- exercise information
- workout construction

The product should **not clone MuscleWiki's design, anatomy artwork, copy, or media**.

The product's differentiation is:

> A fitness platform that combines exercise discovery, personalized workout generation, manual workout building, set-by-set logging, progress analytics, offline workout execution, and progressively personalized recommendations.

---

# 3. Product North Star

The platform should answer:

> **What should I train today, how should I train it, and what should I do next?**

without requiring the user to understand programming theory, exercise science, or workout planning.

---

# 4. Target Users

The product supports:

- beginners
- intermediate users
- advanced users
- gym users
- home users
- bodyweight users
- limited-equipment users

The UX must adapt to experience level without unnecessarily separating the product into entirely different interfaces.

---

# 5. Core Product Loop

```text
Discover
   ↓
Generate / Build
   ↓
Review
   ↓
Start Workout
   ↓
Log Sets
   ↓
Complete Workout
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

This loop is the foundation of the product.

---

# 6. Platform Strategy

## Web

The application will first be available as a normal website.

Example:

`https://workout-planner.vercel.app`

## PWA

The application must eventually be installable from a supported browser as a Progressive Web App.

A Play Store listing is **not required** for the product to function as an installable mobile experience.

## Future Play Store

A Play Store package can be added later if there is a business or distribution reason to do so.

It is explicitly outside V1.

---

# 7. Application Shell

The application must evolve from a multi-step wizard into a persistent application.

## Desktop navigation

Primary destinations:

- Home
- Explore
- Start
- Workouts
- Progress
- Profile

## Mobile navigation

Recommended:

```text
Home | Explore | + Start | Progress | Profile
```

The center `+ Start` action should expose:

- Generate Workout
- Build Workout
- Resume Workout
- Start Saved Workout

The navigation structure may be changed later, but the platform must have persistent navigation rather than relying solely on `Next`/`Back`.

---

# 8. Information Architecture

```text
Home
├── Today's Workout
├── Progress Summary
├── Recommendations
└── Quick Actions

Explore
├── Exercises
├── Muscle Map
├── Joint Map
├── Workout Plans
└── Search

Start
├── Generate Workout
├── Build Manually
├── Saved Workout
└── Resume Workout

Workouts
├── Active
├── Saved
├── History
└── Templates

Progress
├── Overview
├── Strength
├── Volume
├── Muscle Distribution
├── Consistency
└── Personal Records

Profile
├── Goals
├── Preferences
├── Account
├── Storage & Offline
└── Settings
```

---

# 9. Guest Mode

Guest mode is required.

Users must be able to use the primary product without creating an account.

Guest users can:

- browse exercises
- use muscle/joint maps
- generate workouts
- manually build workouts
- save workouts locally
- execute workouts
- log individual sets
- view local progress
- submit feedback

Users can optionally create an account later.

---

# 10. Guest → Account Migration

When a guest creates an account:

```text
Local Guest Data
       ↓
Authentication
       ↓
Data Migration
       ↓
Supabase
       ↓
Continue Existing Fitness Journey
```

The migration must preserve:

- workouts
- workout templates
- sessions
- individual sets
- preferences
- favorites
- feedback
- progress

The process must be idempotent and must not duplicate existing records.

---

# 11. Personalization Philosophy

The onboarding must follow:

> **Minimum necessary input, maximum useful personalization.**

Users should not be presented with a large questionnaire.

Each important input appears one at a time.

---

# 12. V1 Personalization Inputs

## Required / high-value inputs

- primary goal
- training experience
- gym/home/both
- available equipment
- days per week
- preferred workout duration
- selected muscle focus

## Optional profile enrichment

- age
- height
- weight
- preferred exercises
- avoided exercises

The application should not require all optional fields before generating the first workout.

---

# 13. Sequential Onboarding

The onboarding flow should present one question per screen.

Example:

```text
Step 4 of 9

What equipment do you have?

[ Dumbbells ]
[ Barbell ]
[ Machine ]
...

████████████░░░░░
3 steps remaining
```

Users must be able to:

- continue
- go back
- skip optional inputs
- resume interrupted onboarding

---

# 14. Progress Indicator

Every multi-step onboarding/generator flow must show:

- current step
- total steps
- visual progress
- remaining steps

Examples:

> Step 4 of 9  
> 3 steps remaining

Do not display fabricated precise time estimates.

---

# 15. Workout Goals

## V1

Each workout has exactly **one primary goal**.

Examples:

- muscle gain
- strength
- fat loss
- endurance
- general fitness
- mobility

The database may be designed to support multiple goals later, but the V1 UI and deterministic engine must constrain a workout to one goal.

## V2+

Multi-goal reasoning may be introduced through adaptive planning and LLM-assisted interpretation.

---

# 16. Deterministic Workout Engine

V1 workout generation must be deterministic and rule-driven.

The LLM must **not** independently invent the workout prescription.

The engine receives structured inputs and produces a validated workout.

```text
Goal
+
Experience
+
Equipment
+
Duration
+
Frequency
+
Muscle Focus
        ↓
Exercise Candidate Pool
        ↓
Scoring
        ↓
Workout Composition
        ↓
Constraint Validation
        ↓
Final Workout
```

---

# 17. Workout Engine Requirements

The engine must consider:

- goal
- experience
- available equipment
- target muscles
- duration
- exercise difficulty
- exercise compatibility
- movement balance
- volume
- duplicate prevention
- exercise alternatives

The engine must validate the final workout before presenting it.

---

# 18. Workout Validation

Generated workouts must be checked for:

- invalid exercise/equipment combinations
- duplicate exercises
- excessive volume
- unsuitable duration
- missing target muscles
- inappropriate goal configuration
- invalid set/rep configuration
- impossible workout length

Invalid plans must be regenerated or corrected internally.

---

# 19. Manual Workout Builder

Users must be able to create a workout manually.

Flow:

```text
Create Workout
↓
Add Exercise
↓
Configure Sets/Reps/Rest
↓
Reorder
↓
Save
```

The builder must support:

- add exercise
- remove exercise
- reorder exercise
- edit sets
- edit reps
- edit rest
- save template
- duplicate workout

---

# 20. Generated Workout Editing

Generated workouts must be editable.

For every exercise:

- Replace
- Remove
- Edit
- Reorder
- Add alternative

The user must never be forced to regenerate the entire workout because one exercise is unsuitable.

---

# 21. Exercise Library

Exercise discovery is a first-class feature.

Users can search/filter by:

- exercise name
- muscle
- equipment
- difficulty
- movement
- goal

Each exercise detail page should include:

- name
- demonstration
- target muscles
- secondary muscles
- equipment
- instructions
- form cues
- common mistakes
- alternatives
- favorite
- add to workout

---

# 22. Exercise Data Strategy

Exercise information should not be scattered through React components.

Exercise data must be normalized into structured records.

Core model:

```text
Exercise
Muscle
Equipment
Joint
Media
Alternative
Goal
Movement Pattern
```

The initial exercise dataset may use reputable open/licensed sources where commercial and redistribution terms permit it.

Every external asset must carry:

- source
- license
- attribution
- commercial-use status

Unknown-license media must not be imported into production.

---

# 23. Exercise Media

Preferred order:

1. properly licensed video
2. open/licensed animation
3. original animated illustration
4. static illustration

Randomly copied public GIFs/videos are not acceptable merely because they are downloadable.

Large media should not automatically be stored in Supabase Storage.

Static/CDN hosting should be preferred where appropriate.

---

# 24. Anatomy / Muscle Map

The application will provide an interactive anatomy system.

Modes:

```text
Muscles
Joints
```

Views:

```text
Front
Back
```

Both male and female anatomy views are required.

---

# 25. Anatomy Interaction

The supplied design direction should be implemented as an interactive SVG system.

Desktop:

```text
Hover
 ↓
Highlight
 ↓
Tooltip
 ↓
Click
 ↓
Selection
```

Mobile:

```text
Tap
 ↓
Highlight
 ↓
Tap/select
```

Hover cannot be the only interaction because touch devices do not provide persistent hover semantics.

---

# 26. Muscle Highlight States

Each body region must support:

- default
- hover
- selected
- related
- disabled/faded

Visual feedback should not rely on color alone.

Selected state should include visual emphasis plus accessible labels/state.

---

# 27. Joint Map

Joint mode must support selectable regions such as:

- neck
- shoulder
- elbow
- wrist
- spine
- hip
- knee
- ankle

The exact supported joint list will be finalized during implementation.

Joint markers should support the glow/highlight interaction shown in the supplied reference.

---

# 28. Joint UX Language

The application should describe:

> exercises involving this joint

rather than claiming:

> exercises that fix/treat the joint.

The feature must not imply medical diagnosis or rehabilitation guarantees.

---

# 29. Anatomy Implementation

Use custom semantic SVGs rather than raster overlays.

The anatomy system should expose stable IDs such as:

```text
chest
front_deltoid
biceps
triceps
quads
hamstrings
glutes
knee_left
knee_right
elbow_left
elbow_right
```

This enables:

- hover
- selection
- filtering
- exercise lookup
- accessibility
- analytics

---

# 30. Set-by-Set Workout Logger

The workout execution system must log individual sets.

Hierarchy:

```text
Workout Session
 └── Session Exercise
      └── Set
```

Each set includes:

- set number
- weight
- weight unit
- reps
- optional rest
- optional RPE
- optional notes
- completion timestamp

Example:

```text
Bench Press

Set 1 — 40 kg × 12
Set 2 — 45 kg × 10
Set 3 — 45 kg × 8
```

---

# 31. Previous Performance

During a workout, users should be able to see relevant previous performance.

Example:

```text
Last session
45 kg × 9

Today's target
45 kg × 10
```

This enables progressive-overload-oriented interaction without requiring users to remember prior numbers.

---

# 32. Rest Timer

The logger must include an optional rest timer.

Controls:

- start automatically after completing a set
- add 15 seconds
- subtract 15 seconds
- skip
- pause/resume

The timer must function without an internet connection.

---

# 33. Workout Session Offline Requirement

The workout session must remain usable if the network disappears.

Users must be able to:

- open the active workout
- record sets
- edit sets
- start/stop rest
- complete exercises
- complete the workout
- close/reopen the application
- resume the session

without internet.

---

# 34. Workout Completion

After completion:

```text
Workout Complete

Duration
Sets Completed
Volume
Personal Records
Calories estimate, where applicable

[View Progress]
[Rate Workout]
[Save]
[Done]
```

The completion screen is an important transition point into analytics and feedback.

---

# 35. Feedback

Workout feedback must include:

## Rating

1–5 stars.

## Difficulty

- too easy
- just right
- too hard

## Structured reasons

Examples:

- exercise selection was good
- too repetitive
- too difficult
- too easy
- too long
- too short
- equipment mismatch

## Optional comment

Feedback should feed the recommendation/personalization pipeline.

---

# 36. Recommendation System

V1 recommendations should be deterministic/content/behavior based.

Signals include:

- goal
- experience
- equipment
- muscle history
- workout frequency
- completed workouts
- skipped exercises
- replaced exercises
- ratings
- saved workouts
- exercise preferences

The recommendation system should produce a score and reason.

---

# 37. Recommendation Explanations

Examples:

> Recommended because you usually complete 45–60 minute upper-body workouts.

> Recommended because you rated similar workouts highly.

> Recommended because you have not trained your lower body recently.

The explanation should be generated from structured recommendation data rather than invented by the LLM.

---

# 38. Progress Dashboard

The dashboard is a core product feature.

Required areas include:

- weekly workout count
- workout duration
- training volume
- muscle distribution
- consistency
- exercise progression
- personal records

---

# 39. Real-Time Dashboard

The dashboard must update when relevant underlying training data changes.

The architecture should be:

```text
Workout Event
↓
Data Layer
↓
Metrics Aggregation
↓
Realtime Update
↓
Dashboard
```

The frontend should not independently recalculate the same analytics in multiple components.

---

# 40. Charts

V1 should include:

- weekly workout frequency
- training volume over time
- workout duration
- muscle-group distribution
- exercise progression
- personal-record history
- consistency/calendar visualization

Charts must have textual summaries for accessibility.

---

# 41. Local-First Architecture

The application must use:

**IndexedDB as the primary local operational data store.**

A lightweight library such as Dexie may be used to simplify IndexedDB access.

Do not use localStorage as the primary workout database.

localStorage may be used for:

- small preferences
- installation state
- UI flags
- lightweight identifiers

---

# 42. Local Data

Local storage should contain enough information for offline operation:

```text
profile cache
preferences
exercise cache
active workout
workout sessions
sets
saved workouts
feedback queue
events
sync queue
app state
```

---

# 43. Cloud Data

Supabase is the cloud source of truth for authenticated users.

Potential core tables:

```text
profiles
user_preferences
exercises
exercise_muscles
exercise_equipment
exercise_joints
exercise_media
workout_templates
workout_template_exercises
generated_workouts
generated_workout_exercises
workout_sessions
session_exercises
sets
feedback
favorites
recommendations
events
user_stats
personal_records
```

---

# 44. Offline Sync

Every cloud-bound mutation must be represented by a sync queue.

State:

```text
pending
syncing
synced
failed
```

Each queue item must contain:

- entity type
- entity ID
- operation
- payload
- retry count
- timestamps
- last error
- idempotency key

---

# 45. Sync Requirements

The sync system must support:

- automatic retry
- exponential backoff
- idempotent writes
- recovery after browser restart
- queue persistence
- duplicate prevention
- failure reporting
- manual retry

Historical workout records should not be silently overwritten.

---

# 46. Sync UX

If a user is offline:

> Workout saved on this device. It will sync when you're online.

If syncing is pending:

> Sync pending.

If a sync permanently fails:

> Some workout data could not be synced. Your local copy is safe.

Provide:

- Retry
- View Details, where appropriate

---

# 47. Connectivity

The application should react to:

- online
- offline
- reconnecting
- syncing
- synced
- failed

Network status should never block local workout interaction.

---

# 48. Storage Management

The app must eventually provide:

**Settings → Storage & Offline Data**

Display:

- approximate local storage usage
- cached media
- exercise cache
- app cache
- local workout data

Provide cleanup actions such as:

- Clear cached media
- Clear app cache
- Export data

Workout records must not be accidentally deleted when clearing cache.

---

# 49. Storage Warnings

If local storage becomes large, display a non-blocking warning.

Example:

> Your device is storing a large amount of offline data. You can clear cached media without deleting your workout history.

Where browser APIs allow it, estimate local storage usage.

---

# 50. PWA Requirements

The application must support:

- web app manifest
- icons
- service worker
- offline shell
- cache strategy
- standalone display
- install handling
- update handling
- offline workout session

The PWA should be designed as an enhancement to the web application rather than a separate application codebase.

---

# 51. Install Prompt UX

Do not immediately display an install prompt.

Prompt only after meaningful engagement such as:

- first completed workout
- multiple visits
- meaningful repeated use

The exact trigger can be refined with analytics.

---

# 52. Custom Install CTA

When `beforeinstallprompt` is available, expose an application-controlled CTA:

> Install Workout Planner

The product should not aggressively repeatedly trigger the native prompt.

If the browser/platform does not support programmatic install prompting, provide appropriate instructions instead.

---

# 53. PWA Onboarding Messaging

Where useful, explain:

> Your workouts are saved on this device and will sync when you're online.

The message must accurately describe the product's offline behavior.

---

# 54. Offline Validation

Offline operation is a release requirement.

The implementation must be tested:

- manually
- with Chrome DevTools Network → Offline
- with automated browser tests

---

# 55. Offline Test Matrix

The implementation must validate at minimum:

1. Start a workout online.
2. Go offline.
3. Record multiple sets.
4. Finish an exercise.
5. Finish the entire workout.
6. Close the browser.
7. Reopen the application offline.
8. Confirm data remains.
9. Reconnect.
10. Confirm synchronization.
11. Confirm no duplicate records.
12. Confirm dashboard eventually updates.

---

# 56. Sync Failure Testing

Simulate:

- server rejection
- timeout
- expired authentication
- malformed mutation
- temporary network loss

Expected result:

- local data remains intact
- queue remains persistent
- failure is recorded
- retry occurs
- user receives graceful feedback

---

# 57. Automated E2E Testing

Use Playwright for critical flows.

Required suites:

```text
offline-workout.spec
offline-sync.spec
guest-migration.spec
workout-logger.spec
pwa-install.spec
storage-warning.spec
responsive-navigation.spec
```

---

# 58. Responsive Design

The application must support:

## Mobile

320px+
375px
390px
412px
430px

## Tablet

768px
834px
1024px

## Desktop

1280px
1440px
1920px+

Responsive design must change layout behavior where appropriate rather than simply shrinking desktop components.

---

# 59. Mobile Workout Experience

The mobile workout screen must prioritize:

1. current exercise
2. demonstration
3. set logger
4. rest timer
5. completion

Secondary information should be collapsible.

The interface must be usable with one hand where practical.

Touch targets should be appropriately sized.

---

# 60. Desktop Workout Experience

Desktop may expose:

- wider exercise information
- progress sidebar
- previous performance
- larger charts
- expanded workout overview

but must retain the same underlying data and workflow.

---

# 61. Accessibility

Required:

- keyboard navigation
- visible focus state
- semantic headings
- accessible form labels
- accessible modals
- accessible dropdowns
- sufficient contrast
- screen-reader labels
- reduced-motion support
- accessible charts
- anatomy controls that do not rely solely on color

---

# 62. AI Architecture

V1 uses a deterministic workout engine.

The LLM is an **explanation/coaching layer**.

```text
User Input
↓
Deterministic Engine
↓
Validated Workout
↓
LLM
↓
Explanation / Coaching
```

The LLM does not directly decide which exercises, sets, reps, or volume are valid.

---

# 63. V1 AI Capabilities

Allowed:

- explain workout rationale
- explain exercise purpose
- explain form cues
- summarize progress
- provide motivational/coaching text
- answer questions based on structured fitness data

Not allowed to independently override workout-engine safety/constraint rules.

---

# 64. AI Provider Abstraction

The product must not tightly couple the UI to a single AI vendor.

Create an internal provider interface supporting future providers such as:

- Gemini
- OpenAI
- local models

Example capabilities:

```text
explainWorkout()
explainExercise()
coachUser()
summarizeProgress()
```

The provider should be replaceable without rewriting the application.

---

# 65. V2 AI

Potential future capabilities:

- natural-language workout requests
- behavior-aware planning
- adaptive difficulty
- multi-goal reasoning
- richer personalization

Architecture:

```text
Natural Language
↓
Structured Intent
↓
Deterministic Workout Engine
↓
Validation
↓
Final Workout
```

The LLM should not bypass the validation layer.

---

# 66. V3 AI

Possible future functionality:

- fully adaptive planning
- multi-goal session reasoning
- richer conversational coaching
- predictive recommendations
- local/private AI

These are explicitly outside V1.

---

# 67. Supabase Strategy

Use a dedicated Supabase project for Workout Planner.

Do not mix Workout Planner tables with FinWise tables.

The existing FinWise Supabase project should remain separate.

Supabase Free is considered a development/beta tier.

The architecture must support migrating to Supabase Pro without rewriting the application.

---

# 68. Supabase Production Considerations

The architecture must assume that Free-tier resources are finite.

Do not use Supabase Storage as the default home for large exercise videos.

Do not make every UI interaction dependent on a realtime subscription.

Use realtime only where it materially improves the product.

---

# 69. Media Architecture

Preferred:

```text
Metadata → Supabase
Large static media → CDN/static host
Small core assets → application bundle/cache
```

Exercise media must carry provenance and licensing metadata.

---

# 70. Performance

The application should:

- lazy-load heavy components
- lazy-load exercise media
- avoid loading all exercises into the initial bundle
- cache common exercise metadata
- virtualize large lists where needed
- debounce search
- avoid redundant Supabase queries
- avoid unnecessary React rerenders
- optimize chart rendering
- minimize initial JavaScript

---

# 71. Lighthouse Validation

Every major release must run Lighthouse audits for:

- Performance
- Accessibility
- Best Practices

Run audits on key application routes.

Suggested targets:

```text
Performance    ≥ 90
Accessibility  ≥ 95
Best Practices ≥ 95
```

The target is a quality threshold, not an absolute requirement for a perfect score.

---

# 72. PWA Validation

Because the legacy Lighthouse PWA category is no longer the primary PWA validation mechanism, use an explicit PWA checklist:

- HTTPS
- valid manifest
- correct icons
- valid start URL
- standalone display
- service worker
- offline shell
- install experience
- update handling
- offline workout logging

---

# 73. First-Time User UX

The intended path is:

```text
Landing
↓
Continue as Guest
↓
Minimal onboarding
↓
Generate first workout
↓
Complete first workout
↓
Show progress
↓
Explain offline capability
↓
Optional install CTA
↓
Optional account creation
```

The product must avoid overwhelming first-time users with configuration.

---

# 74. Data Export

The application should eventually support:

**Settings → Privacy & Data → Export Data**

Possible formats:

- JSON
- CSV

Exportable categories:

- profile
- workouts
- sessions
- sets
- feedback
- preferences

---

# 75. Privacy

Collect only information needed to provide the product.

Avoid unnecessarily collecting sensitive personal information.

The app should clearly communicate:

- what is stored locally
- what is stored in the cloud
- when synchronization occurs
- what happens when the user deletes data

---

# 76. Security

Required:

- Supabase Row Level Security
- no service-role keys in browser code
- protected user-specific data
- validated inputs
- controlled sharing permissions
- secure authentication
- authorization checks
- safe handling of user-generated text

---

# 77. Sharing

Initial sharing capability may be:

```text
Share Workout
↓
Public workout link
```

Later versions may introduce:

- public profiles
- followers
- likes
- comments
- copied workouts
- challenges

Social networking is not a V1 requirement.

---

# 78. Nutrition

Nutrition is future scope.

Potential future features:

- calorie estimation
- protein targets
- macros
- hydration
- meal logging

It must not delay the core workout platform.

---

# 79. Current Codebase Migration Strategy

The existing application must not be discarded blindly.

The migration process is:

```text
Current Prototype
↓
Repository Audit
↓
Architecture Map
↓
Stabilize Existing Features
↓
Create New App Shell
↓
Extract Domains
↓
Migrate Existing Functionality
↓
Replace Weak Implementations
↓
Add New Features
↓
Remove Legacy Code
```

---

# 80. Target Architecture

```text
app/
├── (marketing)/
├── (app)/
│   ├── home/
│   ├── explore/
│   ├── start/
│   ├── workouts/
│   ├── progress/
│   └── profile/
├── workout/
└── api/

components/
├── ui/
├── navigation/
├── charts/
├── anatomy/
└── media/

features/
├── onboarding/
├── workout-generator/
├── workout-builder/
├── workout-session/
├── exercise-library/
├── anatomy/
├── recommendations/
├── progress/
├── feedback/
├── authentication/
├── offline/
└── sharing/

lib/
├── supabase/
├── local-db/
├── sync/
├── workout-engine/
├── recommendation/
├── ai/
└── validation/

types/
data/
tests/
scripts/
docs/
```

The actual repository migration must be based on an audit rather than forcing every current file into this structure.

---

# 81. Required Separation of Concerns

UI components must not directly own:

- workout-generation algorithms
- recommendation scoring
- Supabase schema logic
- sync queue behavior
- AI provider implementation

Business logic must be separated into feature/domain modules.

---

# 82. Testing Strategy

Testing must operate at multiple levels.

## Unit

- workout rules
- scoring
- progression
- statistics
- validation
- sync functions

## Integration

- Supabase data access
- guest migration
- local database
- sync queue

## E2E

- onboarding
- generation
- manual builder
- workout logging
- offline workflow
- sync
- account migration
- PWA-related UX

---

# 83. Release Gates

A feature is not considered complete merely because the UI renders.

Every important feature must satisfy:

- desktop
- tablet
- mobile
- keyboard/touch behavior where relevant
- loading state
- empty state
- error state
- offline behavior where relevant
- persistence
- guest mode
- authenticated mode

---

# 84. Development Phases

## P0 — Foundation

- repository audit
- architecture
- Git snapshot
- quality baseline
- app shell
- design system

## P1 — Core Platform

- guest mode
- IndexedDB
- sync queue
- PWA foundation
- anatomy map
- exercise library

## P2 — Workout System

- generator
- manual builder
- editing
- session execution
- set logger
- rest timer
- completion

## P3 — Intelligence

- feedback
- recommendations
- adaptive rules
- AI explanations/coaching

## P4 — Analytics

- dashboard
- real-time metrics
- charts
- PRs
- consistency

## P5 — Account / Platform

- Supabase Auth
- guest migration
- sharing
- storage controls
- export

## P6 — Hardening

- offline tests
- Lighthouse
- accessibility
- security
- performance
- release validation

---

# 85. Antigravity Implementation Role

Antigravity should primarily handle:

- UI construction
- responsive layouts
- component implementation
- routine refactors
- feature implementation
- browser testing
- visual validation
- PWA UX
- repetitive development work

It should work in bounded phases rather than being given an instruction to rebuild everything at once.

---

# 86. Codex Implementation Role

Codex should primarily handle:

- architecture audits
- large refactors
- difficult bugs
- data-model reviews
- offline sync reviews
- security reviews
- RLS validation
- performance investigations
- final engineering review
- release hardening

Codex should be used selectively for high-value engineering tasks.

---

# 87. Agent Working Rule

No agent may perform a large destructive rewrite without first:

1. reading the relevant code
2. identifying dependencies
3. documenting the proposed change
4. running existing tests/build checks
5. preserving a recoverable Git state

---

# 88. Final V1 Definition

V1 is complete when a user can:

```text
Open app
↓
Continue as Guest
↓
Answer a small number of questions
↓
Generate a one-goal workout
↓
Edit it
↓
Start it
↓
Log every set
↓
Use rest timer
↓
Lose internet
↓
Continue workout
↓
Complete workout
↓
Data remains locally stored
↓
Reconnect
↓
Data syncs successfully
↓
View progress
↓
Rate workout
↓
Receive recommendations
↓
Ask the LLM why the workout/exercises were chosen
```

and the application passes:

- responsive validation
- accessibility validation
- Lighthouse quality checks
- offline testing
- sync failure/retry testing
- persistence testing
- security validation

---

# 89. V1 Explicit Non-Goals

Not required for V1:

- multi-goal workout generation
- fully LLM-generated workout plans
- full social network
- nutrition tracking
- wearable integration
- smartwatch application
- medical/rehabilitation system
- advanced predictive AI
- multilingual support
- Play Store release

---

# 90. Product Success Criteria

The platform should ultimately optimize for:

### Activation

User reaches first usable workout quickly.

### Completion

Generated workouts are actually performed.

### Retention

Users return for subsequent sessions.

### Logging quality

Users reliably record individual sets.

### Recommendation quality

Users accept and complete recommended workouts.

### Personalization quality

User modifications and preferences increasingly reduce unnecessary workout edits.

### Reliability

Workout logging never loses user data due to poor connectivity.

### Performance

The app remains responsive on mobile devices.

---

# 91. Core Product Principle

The application should feel like:

> **a fitness tool that remembers what you do, works when the internet doesn't, and becomes more useful the more you train.**

It should not feel like:

> a form that generates a static workout.

---

# 92. Implementation Priority

The highest priority architecture is:

```text
1. Data model
2. Offline persistence
3. Sync
4. Workout engine
5. Set logger
6. Exercise system
7. Responsive application shell
8. Progress analytics
9. Recommendations
10. AI coaching
```

This ordering protects the most important product foundations.

---

# 93. Final Architecture Principle

The most important architectural rule is:

> **AI should enhance structured fitness intelligence, not replace it.**

The V1 system is therefore:

```text
Structured Exercise Data
+
Deterministic Workout Engine
+
Set-Level User Data
+
Offline-First Storage
+
Cloud Synchronization
+
Analytics
+
Recommendation Engine
+
LLM Coaching
```

This architecture gives the product a reliable V1 and a clear path toward increasingly intelligent V2/V3 personalization without requiring a complete rewrite.

---

# 94. Product Pillars (Phase 2H.5)

The platform's capabilities map to seven product pillars:

| Pillar | Description | Status |
|--------|-------------|--------|
| **DISCOVER** | Exercise library, muscle/joint maps, search & filters, exercise details | ✅ Implemented (Phase 2F–2G) |
| **PLAN** | Workout generation, manual building, programs, scheduling | ✅ Partially implemented (Phase 2H) |
| **TRAIN** | Session execution, set logging, real-time tracking, guided mode | ✅ Implemented (Phase 2H) |
| **TRACK** | Dashboard metrics, body metrics, workout history | ✅ Partially implemented (Phase 2H) |
| **ADAPT** | Personal records, goals, recommendation engine, adaptive training | 🔲 Domain types defined (Phase 2H.5) |
| **COACH** | AI coaching, form guidance, training insights | 🔲 Domain types defined (Phase 2H.5) |
| **CONNECT** | Sharing, challenges, streaks, wearable integrations | 🔲 Domain types defined (Phase 2H.5) |

---

# 95. Long-Term Information Architecture

The product's navigation structure will evolve to support:

```text
Home (Dashboard)
├── Quick Workout
├── Active Program
├── Streaks / Challenges
└── Recovery Status

Explore (Discovery)
├── Exercise Library
├── Muscle Map
├── Joint Map
├── Saved Favorites
└── Custom Exercises

Workout (Plan + Train)
├── Generate Workout
├── Build Workout
├── Saved Workouts
├── Start Session
└── Active Session

Progress (Track + Adapt)
├── Dashboard Metrics
├── Personal Records
├── Goal Targets
├── Body Metrics
└── Workout History

You (User Profile)
├── Profile Settings
├── Training Preferences
├── Integrations
├── Reminders
└── Sharing
```

> **Note:** This IA represents the target product shape. Only Explore, Workout, Progress (partial), and You (partial) are currently implemented.

---

# 96. Domain Model Overview (Phase 2H.5)

The canonical domain model is organized into layers:

```text
USER
├── UserProfile              (cloud-synced)
├── TrainingPreferences      (domain-only)
├── TrainingConstraints      (domain-only, embedded)
└── BodyMetricEntry          (domain-only)

DISCOVERY
├── Exercise                 (cloud-persisted, read-only catalog)
├── ExerciseVariation        (domain-only, embedded in Exercise)
├── ExerciseAlternative      (cloud-persisted, embedded in Exercise)
├── ComplementaryExercise    (domain-only, embedded in Exercise)
├── Muscle                   (cloud-persisted, read-only)
├── Joint                    (cloud-persisted, read-only)
└── Equipment                (cloud-persisted, read-only)

WORKOUT
├── WorkoutDraft             (in-memory)
├── WorkoutTemplate          (cloud-synced)
├── GeneratedWorkout         (cloud-synced)
├── GeneratedWorkoutExercise (cloud-synced, embedded)
├── ExerciseGroupType        (domain-only, optional metadata)
├── WorkoutPresentationMode  (domain-only, optional field)
└── QuickWorkoutProfile      (domain-only, optional field)

SESSION
├── WorkoutSession           (cloud-synced)
├── SessionExercise          (cloud-synced, embedded)
├── WorkoutSet               (cloud-synced, embedded)
│   ├── SetType              (extended: normal, warmup, working, drop, failure, negative, amrap, cooldown)
│   └── SetSide              (domain-only: bilateral, left, right)
├── WorkoutFeedback          (cloud-synced)
└── RecoverySnapshot         (domain-only)

PROGRAMMING
├── Program                  (domain-only)
├── ProgramWeek              (domain-only, embedded)
└── ProgramDay               (domain-only, embedded)

PROGRESS
├── DashboardMetrics         (computed)
├── PersonalRecord           (domain-only)
├── FitnessGoalTarget        (domain-only)
├── Streak                   (domain-only)
└── ChallengeProgress        (domain-only)

ENGAGEMENT
├── Reminder                 (domain-only)
├── Challenge                (domain-only)
├── ShareableWorkout         (domain-only)
└── WorkoutShare             (domain-only)

INTEGRATION
├── IntegrationProvider      (domain-only)
├── IntegrationConnection    (domain-only)
└── IntegrationCapability    (domain-only, embedded)

AI
├── Recommendation           (computed)
├── RecommendationEvent      (domain-only)
└── AICoachMessage           (domain-only)
```

**"Domain-only"** means the TypeScript type is defined and tested, but no IndexedDB store, Supabase table, or sync queue entity exists yet. These will be created in the corresponding future implementation phases.

See `docs/foundation-persistence-readiness.md` for the full persistence readiness matrix.

---

# 97. Future Feature Roadmap

The following phases extend the platform toward the full product vision. **None of these are currently implemented.** Domain type foundations were established in Phase 2H.5.

| Phase | Focus | Key Capabilities |
|-------|-------|-------------------|
| **2I** | Progress & Dashboard | Body metrics persistence, recovery tracking, enhanced dashboard analytics |
| **2J** | Programs & Goals | Multi-week programs, goal targets, personal records, challenges, streaks |
| **2K** | Recommendation Engine | Content-based + collaborative filtering, recommendation events |
| **2L** | Adaptive Training | Progressive overload, auto-adjustment, deload detection |
| **2M** | AI Coach | Conversational coaching, form insights, training suggestions |
| **2N** | Sharing & Community | Workout sharing, share codes, privacy-respecting social features |
| **2O** | Health & Wearable Integrations | Apple Health, Google Health Connect, Fitbit, Strava, Garmin, Wear OS |

> **Constraint:** Each future phase must implement persistence (IndexedDB + Supabase + Sync) for its domain entities before building UI. No UI should reference unpersisted domain-only types.