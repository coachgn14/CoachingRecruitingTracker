# ScoutFit

A marketplace where high school and junior college baseball players submit their information, metrics and video, and get a **standardized, anonymous evaluation from three college coaches**. Each player learns which college level they fit today, which level they could reach, and what they need to improve to get there.

> "ScoutFit" is a placeholder name. Change it in `src/config/site.ts`.

## How it works

**Players**
1. Sign up (parent/guardian consent checkbox for minors).
2. Fill in a profile: height, weight, graduation year, position, throwing hand and batting side.
3. Enter the metrics required for their position, with the source (TrackMan, Rapsodo, radar, PG/PBR event, self-reported…) and the date measured.
4. Add video links following the video rules. Every position needs a **proof clip** with the radar / TrackMan / Rapsodo / timer readout visible.
5. Review the submission and pay. The submission is frozen at this point, so later profile edits don't change it.
6. Read each coach's evaluation as it arrives, then the consensus once all three are in.

**Coaches**
1. Apply with school, title, division and an upload of **proof of employment**.
2. Wait for an admin to approve the application by hand. Nothing else is available to them until then.
3. Claim a player from the queue. They see only players who still need a coach from their division.
4. Fill in the standardized form:
   - a level for **each metric** (e.g. "D1 – Power Conference" for the fastball)
   - the **current fit** and the **target level**
   - **what to improve**, from a preset list and/or notes they write
   - **overall written feedback**, at least 100 characters

   Drafts save as they go. A claim expires after 72 hours (`CLAIM_HOURS`) and goes back to the queue.

**Admin**
- Approve or reject coach applications. The proof file can be viewed by admins only.
- See every paid submission with the status of each of its 3 slots, and release stuck claims.
- See completed-evaluation counts per coach, for payouts.

### Evaluator rules
Every submission gets exactly 3 coaches:
- **Slot 1 is always a Division 1 coach.**
- **Slots 2 and 3 go to coaches from two different non-D1 divisions** (D2, D3, NAIA, JUCO).

So the three evaluators always come from three different divisions. The rules live in `src/lib/assignment.ts`, and the database enforces them too with unique constraints, so two coaches claiming at the same moment can't break them.

### Anonymity
Players see each coach's **division only** ("Division 1 coach"), never their name or school. The player report page never queries the coach records at all. The coach form also reminds coaches not to put identifying details in their feedback.

### Consensus
For each metric, for the current fit and for the target, the consensus is the **middle (median) opinion** of the three coaches, ranked by the level order in `src/lib/domain.ts`. If two coaches agree, theirs is the consensus, and one outlier can't drag the result. Improvement areas are listed with how many coaches flagged each one ("3 of 3").

## Levels, positions and metrics
All defined in `src/lib/domain.ts`.

| Position | Required metrics |
|---|---|
| RHP / LHP | Fastball velo, breaking ball velo, changeup velo |
| Catcher | Pop time to 2B, throwing velo (from stance), 60-yd, 30-yd, exit velo |
| MIF / 1B / 3B / OF | 60-yd, 30-yd, exit velo, throwing velo |

The levels coaches choose from are: D1 Power, D1 Mid-Major, D1 Low-Major, D2, D3, NAIA, JUCO D1/D2/D3, and Not yet a college fit.

## Content you should customize
- **Video script and rules:** `src/config/videoRequirements.ts`. This is placeholder text; replace it with your official script.
- **"What to improve" options:** `src/config/improvements.ts`.
- **Price, claim window and product name:** `.env` and `src/config/site.ts`.

## Payments (Stripe Payment Link)
Players pay through the Stripe Payment Link in `STRIPE_PAYMENT_LINK_URL`. The app adds the submission ID (`client_reference_id`) and the player's email to the link. When Stripe's webhook reports a paid checkout, `/api/stripe/webhook` marks that submission paid and it goes into the coach queue. The redirect back to the site is never trusted on its own.

One-time setup in the Stripe dashboard:
1. **Payment Link → After payment → "Don't show confirmation page", redirect to your website:**
   `https://<your-site>/player/payment-complete?session_id={CHECKOUT_SESSION_ID}`
2. **Developers → Webhooks → Add endpoint:** `https://<your-site>/api/stripe/webhook`, with the events
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   Copy its signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
3. Keep `EVALUATION_PRICE_CENTS` equal to the link's price. The link's price is what gets charged; this value is only what the site displays.

For local testing, run the [Stripe CLI](https://docs.stripe.com/stripe-cli):
`stripe listen --forward-to localhost:3000/api/stripe/webhook`, and use the `whsec_...` it prints.
With `STRIPE_PAYMENT_LINK_URL` empty, the site falls back to a test checkout that charges nothing.

## Running locally
Requires Node 22+.

```bash
cp .env.example .env     # then edit ADMIN_EMAIL / ADMIN_PASSWORD
npm install
npm run db:push          # create the SQLite database
npm run db:demo          # admin + demo coaches and a demo player (or `npm run db:seed` for admin only)
npm run dev              # http://localhost:3000
```

Demo accounts (password `password123`): `player@example.com`, `d1coach@example.com`, `d2coach@example.com`, `jucocoach@example.com`, and `d3coach@example.com` (pending approval). The admin login comes from `.env`.

Checks: `npm test` (unit tests), `npm run typecheck`, `npm run lint`, `npm run build`.

## Stack
Next.js 16 (App Router, server actions), TypeScript, Tailwind CSS, and Prisma. The database is SQLite locally; for production, switch `provider` in `prisma/schema.prisma` to `postgresql`. Auth uses database sessions with bcrypt-hashed passwords.

```
prisma/schema.prisma        data model (users, profiles, submissions, evaluations)
src/lib/domain.ts           levels, divisions, positions, metrics
src/lib/assignment.ts       3-coach slot rules
src/lib/consensus.ts        consensus calculation
src/lib/profile.ts          profile validation + submission snapshot
src/lib/evaluation.ts       evaluation form validation
src/config/                 editable content (video rules, improvements, price)
src/app/player|coach|admin  the three role areas
src/app/actions/            server actions (all auth-checked)
```

## Not built yet (before launch)
- **Refunds** are handled by hand in the Stripe dashboard.
- **File storage for production.** Coach proof uploads go to local disk (`STORAGE_DIR`). For hosting, swap `src/lib/storage.ts` to S3/R2/GCS.
- **Email notifications.** For example: evaluation complete, coach approved, and new players in the queue.
- **Password reset** and email verification.
- **Coach payouts.** Completed counts are tracked; payouts are not.
- **Video uploads.** Players currently paste links (YouTube, Hudl, etc.); there is no direct upload.
