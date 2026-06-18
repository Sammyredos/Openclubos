# AGENTS.md

## FairwayOS Engineering Agent Guide

### Project Overview

FairwayOS is a modern golf event and tournament operating system designed to help organizers manage registrations, scoring, leaderboards, sponsors, pairings, and player engagement from a single platform. The platform supports live scoring, mobile-first experiences, offline capabilities, and club management workflows.

---

## Core Principles

1. Golf-first UX

   * Every feature must prioritize simplicity for golfers and event organizers.
   * Mobile experience is as important as desktop.

2. Reliability over complexity

   * Tournament-day features must remain stable under load.
   * Avoid unnecessary dependencies.

3. Offline-first mindset

   * Scoring functionality should continue working during poor network conditions.
   * Synchronize data automatically when connectivity returns.

4. Real-time everywhere

   * Leaderboards, pairings, and announcements should update instantly.

5. Security by default

   * All sensitive operations require authentication and authorization.
   * Never expose secrets, API keys, or internal credentials.

---

## Agent Responsibilities

### Product Agent

Responsible for:

* Feature planning
* User stories
* Roadmap creation
* Requirements gathering

Deliverables:

* PRDs
* User journeys
* Acceptance criteria

---

### Frontend Agent

Responsible for:

* Next.js application
* React components
* TailwindCSS styling
* Accessibility compliance

Guidelines:

* Prefer server components when appropriate.
* Use TypeScript strictly.
* Reusable components live under `/components`.
* Avoid duplicated UI logic.

---

### Backend Agent

Responsible for:

* API design
* Authentication
* Business logic
* Database operations

Guidelines:

* Follow REST conventions.
* Validate all incoming requests.
* Never trust client-side data.
* Keep controllers thin and services reusable.

---

### Database Agent

Responsible for:

* Schema design
* Index optimization
* Migrations
* Data integrity

Guidelines:

* Prefer normalized structures.
* Use foreign keys where appropriate.
* Create indexes for leaderboard and scoring queries.

---

### DevOps Agent

Responsible for:

* CI/CD
* Infrastructure
* Monitoring
* Deployment

Guidelines:

* Automate deployments.
* Maintain rollback procedures.
* Monitor uptime and performance metrics.

---

### QA Agent

Responsible for:

* Testing strategy
* Regression testing
* Release validation

Minimum coverage:

* Authentication flows
* Tournament creation
* Player registration
* Live scoring
* Leaderboards
* Payment workflows

---

## Coding Standards

### TypeScript

* Strict mode enabled.
* Avoid `any`.
* Prefer interfaces for domain models.

### React

* Functional components only.
* Use hooks responsibly.
* Separate UI from business logic.

### API

* Consistent error responses.
* Proper HTTP status codes.
* Comprehensive validation.

---


## Golf Domain Rules

### Tournament

Must contain:

* Name
* Date
* Course
* Format
* Organizer

### Player

Must contain:

* Name
* Handicap
* Contact details

### Score

Must contain:

* Hole number
* Gross score
* Net score (when applicable)

### Leaderboard

Should update automatically after score submission.

---

## Performance Targets

* Page load < 2 seconds
* API response < 300ms
* Leaderboard updates < 2 seconds
* 99.9% uptime target

---

## Security Rules

Never:

* Commit secrets
* Store plaintext passwords
* Expose internal APIs publicly

Always:

* Hash passwords
* Validate inputs
* Sanitize outputs
* Log critical actions

---

## Definition of Done

A task is complete when:

* Code is reviewed
* Tests pass
* Documentation updated
* No critical bugs remain
* Feature meets acceptance criteria

---

## Mission

Build the most trusted operating system for golf events, tournaments, leagues, and club communities.
