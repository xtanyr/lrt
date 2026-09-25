# UX contract

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | Native HTML select | `DESIGN.md` and `frontend/src/styles/global.css` | native only | keyboard and browser popup check |
| Date | Native month/date input | `DESIGN.md` | native only | keyboard and locale check |
| Toast | `ToastProvider` | `frontend/src/components/ToastProvider.tsx` | success, error, info | unit tests and manual feedback check |
| CRUD | Page action + API service | page component and API contract | save, import, edit | page tests and manual success/failure check |

## Interaction rules

Primary actions use `.btn-primary`; secondary navigation uses `.btn-ghost`; low-risk local reversals use `.btn-subtle`; logout uses `.btn-danger-ghost`. Fields use `.input` and retain their values after an API error. Import is two-stage: preview first, then explicit selection and confirmation.
