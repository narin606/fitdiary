# FitDiary MVP user stories

## Accounts and onboarding

- As a user, I can register with a unique username and password and optionally provide an email for recovery.
- As a user, I can configure my height, weight, activity level, units, goal and editable calorie/macro targets.
- Every read and write is scoped to the authenticated user on the server.

## Daily dashboard and diary

- As a user, I can see goal, food, exercise, remaining calories, macros, water and recent weight for a selected date.
- As a user, I can add foods under breakfast, lunch, dinner or snacks and edit or delete my entries.
- As a user, I can copy an earlier meal and quick-add calories.

## Meal photos and optional AI

- As a user, I can attach a photo and save it without analysis.
- Uploading alone must never invoke an AI provider.
- As a user, I can later press Analyze and receive an editable item breakdown, calorie range and confidence level.
- AI results are suggestions and are saved into totals only after confirmation.

## Combined food catalogue

- Search ranks recent/frequent entries, personal foods, verified external results, community results and AI fallback.
- Results visibly identify their source: Verified, My Food, Community or AI Estimate.
- User corrections are private by default and do not overwrite the shared catalogue.

## Saved meals and recipes

- As a user, I can save a group of foods and add all or selected items again.
- As a user, I can define a recipe, ingredients and serving count; nutrition is calculated per serving.

## Progress

- As a user, I can record weight, water and manual exercise.
- Weight trends use weekly averages in addition to raw entries.
- A setting controls whether exercise calories increase the remaining food allowance.

## Deferred

- Wearables, step sync, sleep, heart rate, barcode scanning, social challenges, coaching and community verification are future work.

