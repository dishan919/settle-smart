# Verification and Android acceptance

## Automated evidence

The development environment has Node 24 and npm installed. Automated Jest tests exercise real SQLite through Node's built-in driver using an adapter for Expo SQLite's async interface. This verifies SQL syntax, foreign keys, transactions, migrations, and the application service workflow; it does not replace an Expo SQLite native-device test.

- `npm test`: 50 tests passed, including an independent backtracking oracle for optimal payment count and persisted expense/payment data after a real database-file reopen.
- Android Metro/Hermes export succeeded, producing an Android `.hbc` bundle. This is bundle validation, **not an APK**.
- Expo package compatibility check passed in offline mode; Expo Doctor passed all 21 checks after deduplicating native dependencies.
- `eas whoami`: not logged in. No EAS cloud build was submitted and no APK was produced.
- No Android SDK/emulator or connected physical phone is available in this environment. Native visual, accessibility, restart/airplane-mode, and installation tests remain unverified.

## Required physical-device flow

After generating and installing the preview APK using README commands:

1. Open SettleSmart. Check splash/welcome branding, then complete all three onboarding slides.
2. Create profile Abi, optional valid email, LKR. Close and reopen; onboarding must not repeat.
3. Create Kandy Trip; edit its description. Verify creation date, currency, and group count.
4. Add Abi, Nimal, Kamal, Ravi. Mark Abi **This is me**. Reject empty/duplicate names. Test member edit and removal of an unused member.
5. Add Hotel Rs. 12,000 paid by Abi, all four participants. Verify shares Rs. 3,000 each.
6. Add Food Rs. 4,500 paid by Nimal. Add Fuel/Tickets, including a selected-participant expense and an amount ending in .01.
7. Verify group balances sum to zero; positive says Should receive, negative says Owes, zero says Settled. Compare dashboard profile balances.
8. Search/filter global expenses by group, category, payer, and dates. Open/edit/delete an expense. Test session undo from Settings. Try invalid amounts, empty participants, bad dates, and no payer.
9. Choose Fast Settlement and calculate. Check each transaction, total, progress, and real runtime.
10. Mark a transaction paid. Reopen the app; its Paid state and remaining balances must persist. Finish all payments; verify All settled.
11. Correct a payment back to pending. Current plan must disappear and balances must return accordingly. Recalculate. Edit an expense after a payment; old paid history must remain and pending recommendations must be invalidated.
12. Compare both algorithms for the same group. Try a group with more than ten non-zero balances: Optimal must explain its size restriction while Fast works.
13. Try deleting a member referenced by expense/payment history: explain the restriction and keep the member.
14. Check Activity, light/dark/system themes, large font settings, screen reader labels, keyboard scrolling, and small-screen layouts.
15. Close Metro, turn the laptop off/disconnect it, enable airplane mode on the phone, and repeat group/member/expense CRUD, calculation, payment progress, app restart, and theme changes.
16. Load demo data once from Settings; a second load must be rejected. Exercise both reset confirmations on a disposable test installation.

## Screenshot checklist

Capture actual native screens after device acceptance: Home, Group Expenses, Balances, Add Expense, Settlement Plan, Algorithm Comparison, and Dark Settings. Store approved screenshots under `docs/screenshots/` and link them in README. Do not fabricate screenshots or claim device acceptance from the Metro export alone.

## Dependency review

`npm audit` reported 16 transitive/upstream advisories (12 moderate, 4 high) during installation, involving node-forge, uuid/xcode, and query-string/decode-uri-component plus their dependent Expo tooling packages. Automatic force remediation proposed incompatible Expo/Router downgrades, so it was not applied. Recheck SDK patch releases and advisories before publication; do not infer that this build is security-audited from its unit tests.
