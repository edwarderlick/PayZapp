# UI/UX Next-Level Upgrade

## Plan (approved)

1. Centralize styling tokens for consistency.
2. Upgrade premium surfaces (Card + shared CSS utilities).
3. Apply surface/polish improvements across layout (TopBar/Sidebar/Shell) and major feature panels.
4. Polish overlays/forms/loading/toasts so they match the premium theme in both dark/light.

## Implementation Steps

- [x] Step 1: Enhance shared global CSS utilities in `src/index.css` (surface/halo/gradient border helpers).

- [x] Step 2: Update UI primitives to use the shared premium tokens/classes (Card surface upgraded).
  - [ ] `src/components/ui/Card.tsx`
  - [ ] `src/components/ui/Button.tsx`
  - [ ] `src/components/ui/Input.tsx`
  - [ ] `src/components/ui/Badge.tsx`
  - [ ] `src/components/ui/Modal.tsx`

- [ ] Step 3: Polish layout components (TopBar/Sidebar/Shell) to remove hardcoded colors and align with tokens.
- [ ] Step 4: Apply premium surface styles to all main feature panels.
- [ ] Step 5: Polish overlays and UX primitives:
  - [ ] `Spinner.tsx`
  - [ ] `TxToast.tsx`
  - [ ] `CommandPalette.tsx`
- [ ] Step 6: Run `npm run dev` and do a visual sweep across routes + light/dark.
- [ ] Step 7: Run `npm run build` to ensure no Tailwind/TS issues.
