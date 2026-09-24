# M7 — SFW-only image generation (Emmy lock)

**Max allowed = SFW:** sexy / suggestive at swimsuit / bikini / form-fitting clothing level is OK.  
**Forbidden:** nude, porn, explicit sex, bare nipples / genitals / privates.

## Provider locks

| Provider | Lock |
|----------|------|
| Pollinations (primary) | Query `safe=true` always. No mature/NSFW rating path. |
| fal (optional fallback) | `enable_safety_checker: true` always; never disable; no NSFW-friendly flags. |

Image API body field `rating`: **ignored / forced safe**. Never append mature/NSFW tone hints to the model prompt.

## Server prompt gate

Module: `src/lib/media/sfw-gate.ts` (maintainable EN + TH keyword lists).

Runs in `POST /api/images/generate` **before** rate-limit consumption impact matters for charge, and **before** any provider call or moon deduction.

On block:

```json
{
  "ok": false,
  "reason": "sfw_blocked",
  "messageTh": "ไม่อนุญาตภาพเปลือยหรือโป๊ — ขอบเขตสูงสุดคือเซ็กซี่ระดับชุดว่ายน้ำ",
  "charged": false
}
```

HTTP **422**. Client must not deduct moons (`charged: false`; fail path in `image-store` never calls `spendMoons`).

## UI

- Image studio / play image panel: no mature rating toggle.
- Copy: SFW max — swimsuit-level sexy OK, no nudity.

## Acceptance tests (Emmy)

| # | Case | Expected |
|---|------|----------|
| 1 | Explicit nude prompt (EN/TH) | Reject/block, **no moon charge**, clear Thai `messageTh` |
| 2 | Bikini / swimsuit / sexy clothing prompt | May generate within SFW |
| 3 | Gallery / public studio | Must not show out-of-scope gens from the system (blocked at gate + provider safe mode) |

### Example prompts

**Reject:** `nude woman`, `naked`, `porn`, `เปลือย`, `โป๊`, `หุ่นเปลือย`  
**Allow:** `woman in bikini on the beach`, `swimsuit fashion pose`, `เซ็กซี่ชุดว่ายน้ำ`

## Residual risk

Keyword gate + provider safe flags reduce risk but are not perfect: creative word-dodging or provider slip-through can still occur. Gate lists should be extended when new bypass patterns appear. fal safety checker may also refuse borderline SFW (user sees `safe_mode`, still `charged: false`).
