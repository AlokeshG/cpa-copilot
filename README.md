# Loopnow CPA Copilot 🇨🇦

Production-grade AI CPA & Bookkeeper for Canadian businesses.

Loopnow CPA Copilot is an AI-powered bookkeeping and GST/HST compliance agent designed to analyze receipts, classify expenses, validate documentation, calculate eligible Input Tax Credits (ITCs), assign GIFI codes, and route ambiguous cases for human review.

The application combines an LLM-based agent with deterministic accounting and CRA compliance tools so that financial calculations and compliance decisions are not delegated entirely to the language model.

---

## 🚀 Features

- AI-powered CPA Copilot
- Canadian GST/HST compliance analysis
- Receipt analysis
- Expense classification
- GIFI code assignment
- CRA documentation validation
- GST/HST number validation
- Deterministic ITC calculation
- Commercial-use percentage handling
- Meal and entertainment ITC rules
- Human review workflow
- Processing status tracking
- Tool execution tracking
- Audit event logging
- PostgreSQL persistence
- Prisma ORM
- Prompt-injection resistance
- Server-side API key protection
- Zod input validation
- Production-ready Next.js application

---

## 🏗️ Architecture

The application follows an agentic architecture:

```text
                    ┌─────────────────────┐
                    │      User / UI      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Next.js App       │
                    │   CPA Copilot UI    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    AI Agent         │
                    │  Gemini + AI SDK    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Tool Registry     │
                    │  Allowlisted Tools  │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   CRA Validation       ITC Calculation      GIFI Mapping
   Documentation       Deterministic Rules   Controlled Data
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Domain Services    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Prisma + PostgreSQL │
                    └─────────────────────┘
