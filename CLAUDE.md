# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo contains two separate applications:

- **Node/Express backend** (repo root): `server.js`, `models/`, `services/`, `templates/`. Generates and serves quiz questions from MongoDB.
- **Flutter app** (`quizzard_app/`): the Quizzard quiz game client. It talks to **both** the Node backend (over HTTP) and Firebase/Firestore directly — see "Two data sources" below.

## Commands

Backend (run from repo root):
- `npm start` — runs the server (`node server.js`). There is no build step or watcher; restart manually after changes.
- No test/lint scripts are configured (`npm test` is a placeholder that exits 1).
- Requires a `.env` with `MONGO_URI` (and optional `PORT`, default 5050).

Flutter app (run from `quizzard_app/`):
- `flutter run` — launch the app.
- `flutter test` — run widget/unit tests in `test/`.
- `flutter analyze` — lint (config in `analysis_options.yaml`).

## Backend architecture — the question-generation pipeline

The backend's core job is turning structured data into multiple-choice quiz questions. The flow, all orchestrated from `server.js` endpoints:

1. **Entities** (`models/Entity.js`) are the source data — a `name`, a `category`, and a free-form `attributes` map (e.g. a country with `capital`, `currency`, `gdp`). Loaded via CSV upload (`POST /admin/entities/upload`) or the built-in `Countries` seed (`POST /admin/entities/seed`, data in `templates/seedEntities.js`). Uniqueness is enforced on `{category, name}`.

2. **Question templates** (`models/QuestionTemplate.js`) define how to phrase a question. `templateString` uses `{{name}}` and `{{attribute}}` placeholders; `attributeToTarget` lists which entity attribute(s) to quiz on; `targetCategory` lets a template emit questions into a *different* category than the source entities (e.g. `Countries` entities → `Capitals` questions). Managed via `/admin/templates*` endpoints and seeded from `templates/seedSets.js`.

3. **`services/generator.js`** (`generateQuestionsFromEntities`) is the heart of the system. For each entity × template × target attribute it builds a question, then samples 3 distractor options from *other entities' values for the same attribute* (or other entity names, for `audio`/`video` media). Key behaviors to know:
   - If no templates exist for a category, it auto-creates defaults via `templates/defaultTemplates.js`.
   - `replaceExisting` (default true) **deletes all existing questions in the target categories** before inserting — generation is destructive/regenerative, not additive.
   - Questions are skipped if a target attribute is missing, fewer than 4 distinct options can be formed, or the question signature is a duplicate.
   - `LEVEL_CONFIG` maps `level` (easy/medium/hard) to `xpReward` and `timeLimit`.

4. **Generated Questions** (`models/Question.js`) are served to the app via `GET /api/questions?category=&limit=` and `GET /api/categories`.

CSV upload and entity seeding both regenerate questions automatically for every touched category. Templates and entities are the editable inputs; the `Question` collection is derived output that gets blown away and rebuilt.

## Flutter app — two data sources

The app does **not** get everything from the Node backend. It uses two independent backends, and code paths differ by feature:

- **Firebase/Firestore** (`lib/services/database_service.dart`, `lib/models/firestore_models.dart`): user accounts, profiles, admin gating (`admins` collection), and Firestore-stored categories/questions. Auth via `firebase_auth`.
- **Node backend over HTTP**: question generation/admin tooling. Base URL is hardcoded as `http://localhost:5050` in multiple files (`lib/main.dart`, `lib/admin/admin_templates_screen.dart`, `lib/admin/admin_questions_screen.dart`). Changing the backend host means updating each of these constants.

The admin screens (`lib/admin/`) drive the backend's `/admin/*` endpoints (template CRUD, seeding, CSV entity upload). The player-facing quiz fetches from `/api/questions`.
