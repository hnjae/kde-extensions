# Design Review: Correct End State

## Executive Summary

This review found no P0 production-risk issue, but it found several P1 architecture risks that should be corrected before the codebase grows: the canonical spec disagrees with the implementation on focused-window cycling order, `Binding` can represent mismatched slot/action/match/launch identities, source modules depend on an ambient global namespace and hand-maintained concatenation order, key stateful behavior is hidden inside `createController`, and launch/error handling loses structured outcomes and context.

The current implementation is small and well covered for its size, so the correct end state should stay boring: explicit source modules, small domain value factories, a typed workspace snapshot, named state owners for MRU and cycle state, a binding registration plan, a thin KWin adapter, structured diagnostics, and tests that import pure code directly while keeping only a few VM/package smoke tests.

## Top Design Risks

1. `docs/spec/SPEC.md` says focused cycling follows KDE Task Switcher order, while `README.md` and `src/action-planning.ts` use internal MRU order; this is an external behavior source-of-truth conflict.
2. `Binding` stores raw desktop entry ID, normalized desktop entry ID, action name, and slot name as independent strings, so a binding can match one application, launch another, and store cycle state under an unrelated action.
3. The ambient `RunOrRaise` namespace plus `scripts/build-package.mjs` concatenation order makes ownership and dependencies implicit, and forces tests to load built artifacts through `vm`.
4. `createController` owns MRU history, cycle state lifecycle, workspace sampling, matching/planning orchestration, activation effects, and launch effects in one closure.
5. Runtime failures and diagnostics are string/print oriented: launch failure is swallowed inside the KWin adapter, non-launch host exceptions have no binding-context boundary, and invalid configuration/runtime fallback paths are silent.

## Single Source of Truth Violations

### Finding: Focused-window cycling order has competing definitions

Evidence: `docs/spec/SPEC.md:82-85` says cycling follows KDE Task Switcher order; `README.md:74-75` says cycling uses the script's MRU order because KWin does not expose task-switcher ordering; `src/action-planning.ts:44-70` implements `orderedByMru`; `src/action-planning.ts:126-130` uses that order for focused-window cycling; `src/controller.ts:25-35` maintains MRU and `src/controller.ts:70-72` passes it into planning.

Current state: Implementation and README agree on internal MRU order, but the canonical user-facing spec says Task Switcher order.

Design concern: A future change could "fix" the implementation to the spec and break current intended behavior, or keep current behavior while the spec remains misleading.

Correct end state: `docs/spec/SPEC.md` is the authoritative external behavior source, and README, tests, and implementation all name the same cycling order. If MRU is intended, the spec should say internal observed MRU plus deterministic fallback. If KDE Task Switcher order is intended, the runtime boundary should expose that order before planner logic changes.

Suggested migration: Decide the intended behavior first; update `docs/spec/SPEC.md` before code if MRU is intended; otherwise add a runtime-facing order source and characterize current behavior before replacing it.

Acceptance criteria: No documentation claims Task Switcher order unless runtime supplies it; tests name and verify the chosen cycling order; `planBindingAction` receives only ordering data consistent with the spec.

Priority: P1.

### Finding: Binding configuration schema is split across schema, parser, and generated UI

Evidence: `src/core.ts:8-12` defines `BindingConfigFieldName`; `src/core.ts:22-51` defines names, defaults, labels, value types, and widgets; `src/bindings.ts:38-65` hard-codes `"Enabled"`, `"DesktopEntryId"`, `"Name"`, and `"Shortcut"` while parsing; `scripts/build-package.mjs:57-98` loads and validates the schema from built `core.js`; `scripts/build-package.mjs:101-116` and `scripts/build-package.mjs:162-200` generate XML/UI from that schema.

Current state: Generated config files are schema-driven, but runtime config reading separately enumerates the same fields.

Design concern: Adding, renaming, or removing a config field can update generated KConfig/UI while leaving runtime parsing stale, or vice versa.

Correct end state: One typed binding configuration schema owns field identity, defaults, UI metadata, and parser accessors. Generated XML/UI and runtime parsing consume the same schema-owned keys and field definitions.

Suggested migration: Introduce a dedicated binding schema module, update `readBindingSlot` to use schema accessors, and test that every schema field is either parsed or explicitly UI-only.

Acceptance criteria: Adding or removing a field requires one schema change; the reader cannot reference a field absent from the schema; generated config entries and parser behavior are verified from that schema.

Priority: P2.

### Finding: Package identity and runtime module membership have multiple authorities

Evidence: `package.json:2-6` defines package name, version, and license; `scripts/build-package.mjs:26-45` hard-codes KPackage metadata; `nix/module/package.nix:7-10` hard-codes `pluginId` and `version`; `scripts/check-kpackage.mjs:10` hard-codes `pluginId`; `README.md:20` and `README.md:26` hard-code `kwin-run-or-raise-0.1.0.kwinscript`; `tests/package.test.ts:25-36` hard-codes metadata expectations; `scripts/build-package.mjs:14-22` hard-codes runtime module order; `tests/core.test.ts:14-20`, `tests/bindings.test.ts:16-18`, and `tests/runtime.test.ts:15-17` each define module subsets.

Current state: Version, plugin ID, package layout, archive naming, and runtime module membership are repeated across JSON, JavaScript, Nix, README, and tests.

Design concern: Release or module-composition changes require synchronized edits across several files, so partial updates can produce mismatched metadata, install paths, docs, tests, or bundles.

Correct end state: One package manifest owns package ID, version, license, KPackage type, main script path, dist/archive naming, and possibly runtime module membership until source imports replace manual order. Build scripts, checks, tests, and Nix derive from that manifest where practical.

Suggested migration: Move KPackage metadata into a JSON or JS manifest consumed by `build-package.mjs`; have checks/tests read the manifest or generated metadata; if modules remain namespace-based temporarily, create one runtime module manifest consumed by build and test helpers.

Acceptance criteria: Bumping version or plugin ID requires one source edit; generated metadata, Nix install path, archive name, and package tests agree automatically; adding a runtime source module requires one module-manifest/import update.

Priority: P2.

### Finding: Production types are mirrored in the test harness

Evidence: Production KWin types live in `src/kwin.d.ts:8-39`; production domain and API types live in `src/core.ts:53-78`, `src/action-planning.ts:6-28`, `src/bindings.ts:6-16`, and `src/runtime.ts:6-10`; `tests/support/run-or-raise.ts:7-205` defines parallel test types; `tests/support/run-or-raise.ts:102-106` makes `Controller.handleBinding?` optional while production `src/core.ts:74-78` requires it.

Current state: Tests cast VM-loaded globals to hand-written test interfaces because production code is not importable as modules.

Design concern: The test harness is a shadow API and can drift from production, reducing the value of typechecking during refactors.

Correct end state: Tests import production-owned declarations for `Binding`, `Runtime`, `Controller`, planner types, schema types, and KWin-facing shapes. Test fixture helpers may remain, but they should be typed against production exports.

Suggested migration: Expose or emit production type declarations in a test-consumable form, then replace duplicated harness types with imports or `satisfies` checks.

Acceptance criteria: A production API signature change breaks test typechecking until the harness is updated; schema unions for field names/value types/widget classes are preserved in tests; the harness no longer manually mirrors core domain types.

Priority: P2.

## Invariant and Correctness Risks

### Finding: `Binding` can represent mismatched slot, action, match, and launch identity

Evidence: `src/core.ts:53-60` defines `Binding` as independent strings; `src/bindings.ts:42-67` constructs `desktopEntryId` and `normalizedDesktopEntryId` separately; `src/window-matching.ts:87-88` matches on `binding.normalizedDesktopEntryId`; `src/controller.ts:70` keys cycle state by `binding.actionName`; `src/controller.ts:86` launches `binding.desktopEntryId`; `tests/support/run-or-raise.ts:238-247` constructs test bindings by independently assigning all fields.

Current state: Production usually creates bindings through `readBindingSlot`, but the exported shape accepts arbitrary object literals that can match one app, launch another, or have an action name unrelated to its slot.

Design concern: The central domain invariant is that one configured binding represents exactly one slot and one application identity. Today that invariant is maintained by convention at one construction site, then trusted everywhere else.

Correct end state: `Binding` should be a validated domain value, created through a `ConfiguredBinding` or `createBinding` factory. Canonical fields should be slot identity, display name, shortcut, and desktop entry launch identity; derived values such as action name and match key should be computed or privately constructed from canonical fields. If launch identity and match identity are intentionally distinct, model that distinction explicitly with validation and documentation.

Suggested migration: Add a binding factory around the existing `readBindingSlot` construction; route test helpers through it; update matching, registration, and controller APIs to accept the validated type; then remove or hide direct construction of denormalized binding fields.

Acceptance criteria: No exported API accepts arbitrary independently writable `desktopEntryId`, `normalizedDesktopEntryId`, `actionName`, and `slotName`; a binding cannot match one desktop entry ID and launch a different one; `actionName` is always derived from or validated against the slot; tests cover path-style desktop entry IDs through the factory.

Priority: P1.

### Finding: Shortcut uniqueness is enforced as a registration side effect

Evidence: `src/bindings.ts:77-89` returns all non-null bindings; `src/bindings.ts:91-122` detects duplicate shortcuts inside `registerBindings`; `src/bindings.ts:97-110` canonicalizes with `binding.shortcut.toLocaleLowerCase()`; `src/main.ts:14-18` passes `readBindings(readConfig)` directly into `registerBindings`; `tests/bindings.test.ts:51-104` and `tests/main.test.ts:38-56` verify duplicate skipping during registration.

Current state: A `Binding[]` from `readBindings` can contain multiple enabled bindings with the same effective shortcut. The invalid collection is resolved only while registering shortcuts.

Design concern: The domain rule "each shortcut may be assigned to only one application" is not owned by the binding set. Any caller between parsing and registration can observe an invalid binding collection.

Correct end state: Binding loading should produce a validated binding set or registration plan with accepted bindings and skipped records. Shortcut canonicalization should live in one binding-policy function, and registration should consume only accepted bindings plus explicit diagnostics.

Suggested migration: Extract a pure `planBindingRegistrations` or `resolveBindingSet` function that keeps earlier-slot-wins behavior; have `registerBindings` apply that plan and preserve existing logs.

Acceptance criteria: Duplicate shortcut handling is testable without `Runtime`, `Controller`, or `registerShortcut`; `registerBindings` receives only unique accepted bindings; duplicate skip reasons are represented as data before logging.

Priority: P2.

### Finding: Cycling and MRU state invariants are weakly modeled

Evidence: `src/action-planning.ts:6-9` exports `CycleState` as `{ candidates: KWinWindow[]; index: number }`; `src/action-planning.ts:34-42` compares candidate sets by length and membership only; `src/action-planning.ts:126-145` reuses `cycleState.candidates` and `cycleState.index`; `src/controller.ts:7-8` stores cycle state with no additional validation; `src/controller.ts:25-36` records MRU in a raw array with a hard-coded cap of 100; `src/runtime.ts:88-92` connects `windowActivated` only if the optional signal exists; `tests/main.test.ts:194-199` manually sends activation notifications before expecting minimized MRU behavior.

Current state: Production cycle states are generated by the planner, but the exported type can represent duplicate candidates, invalid indexes, or stale order. MRU history contains only activations observed after script startup or caused by the script, yet minimized-window selection treats it as recency when available and silently falls back to candidate order otherwise.

Design concern: Focused cycling and minimized selection depend on uniqueness, valid cursor position, and known versus unknown recency. Those invariants are implicit in controller/planner cooperation.

Correct end state: Cycle state should be an internal validated cursor, with candidate lists deduplicated before cursor creation and reuse guarded by a uniqueness-aware same-set check. MRU behavior should be owned by a `WindowHistory` component with explicit `recordActivation`, `forgetWindow`, `orderCandidates`, cap policy, and deterministic fallback behavior.

Suggested migration: Add characterization tests for duplicate candidates, invalid previous cycle state, duplicate activation notifications, no activation signals, and minimized selection before any activation events; extract `WindowHistory` and `CycleStateStore`; keep existing behavior while making fallback order explicit.

Acceptance criteria: Cycle state cannot be constructed with duplicate windows or invalid index; duplicate windows from runtime sources do not cause repeated activation of the same window when multiple unique candidates exist; MRU fallback behavior is documented in tests; `createController` no longer mutates raw MRU arrays or cycle records.

Priority: P2.

### Finding: Workspace action planning can receive incoherent snapshots

Evidence: `src/core.ts:62-72` exposes independent `Runtime` methods for active window, current activity, current desktop, windows, and stacking order; `src/controller.ts:60-73` calls those separately; `src/window-matching.ts:92-100` receives windows and scope separately; `src/action-planning.ts:11-17` accepts independently supplied `activeWindow`, `candidates`, `cycleState`, `mruWindows`, and `stackingOrder`.

Current state: On each shortcut press, controller assembles planner input from several runtime reads that are assumed to describe the same moment.

Design concern: Invalid planning inputs are representable: active window, window list, current scope, and stacking order can come from different runtime moments or universes. This may be acceptable in practice today, but the design does not make the intended snapshot boundary visible.

Correct end state: Runtime should expose one `WorkspaceSnapshot` for shortcut evaluation, containing active window, windows, current desktop/activity, and stacking order. Candidate selection and planning should consume the snapshot, while the KWin compatibility fallback remains inside snapshot construction.

Suggested migration: Add `WorkspaceSnapshot` and `runtime.workspaceSnapshot()` while keeping existing methods temporarily; update `handleBinding` to call one snapshot method; keep `planBindingAction` pure by passing snapshot-derived plain data.

Acceptance criteria: `handleBinding` reads workspace state through one runtime call; tests cover `windowList` / `windows` / `stackingOrder` fallback through snapshot construction; the code makes clear whether stacking order is authoritative, unavailable, or a fallback source.

Priority: P2.

### Finding: Fixed binding slot bounds are bypassable through exported APIs

Evidence: `src/core.ts:6` declares `bindingCount = 16`; `src/core.ts:80-82` formats any number as a slot name; `src/core.ts:84-88` creates the valid slot list; `src/bindings.ts:70-74` exports `readBinding(readConfig, slot: number)` without range/integer validation; `README.md:31` documents 16 fixed slots.

Current state: Generated UI and `readBindings` use the intended 16 slots, but `slotName` and `readBinding` can construct unsupported config keys such as `Binding00`, `Binding17`, negative, or fractional slots.

Design concern: The fixed slot range is a domain invariant but only the bulk reader follows it.

Correct end state: Slot identity should be a validated `BindingSlot` value or an element from `bindingSlotNames()`. Public APIs should accept validated slot identities, not arbitrary numbers.

Suggested migration: Add `bindingSlot(slot: number): BindingSlot | null` or make `readBinding` accept a validated slot name; keep `readBindings` as the production path; add rejection tests for invalid slot numbers.

Acceptance criteria: No exported function can construct unsupported binding config keys without explicit failure; valid slots are only `Binding01` through `Binding16`; generated config and runtime reads use the same validated slot source.

Priority: P3.

## Cohesion, Coupling, and Ownership Problems

### Finding: Concatenated global namespace makes ownership and dependencies implicit

Evidence: `tsconfig.json:4` sets `"module": "none"`; `src/core.ts:5`, `src/controller.ts:5`, `src/runtime.ts:5`, `src/action-planning.ts:5`, `src/window-matching.ts:5`, and `src/bindings.ts:5` all merge into `namespace RunOrRaise`; `scripts/build-package.mjs:14-22` hard-codes runtime concatenation order; `src/main.ts:5-18` consumes collaborators through global `RunOrRaise`; `tests/support/run-or-raise.ts:216-224` loads selected built files and returns global `RunOrRaise`.

Current state: Source files do not declare imports or exports. Build and test code preserve dependency order by convention.

Design concern: File-level ownership is not enforced by TypeScript. Any exported namespace member can become a hidden cross-module dependency, and adding/removing/reordering files requires build and test harness changes.

Correct end state: Internal source code should use explicit TypeScript modules with imports and exports. The KWin package can still emit one compatible script file, but bundling order should be derived from imports. `src/main.ts` should be the composition root.

Suggested migration: Convert pure modules first, such as `window-matching.ts` and `action-planning.ts`; add a bundling step that emits KWin-compatible non-module output; remove hand-maintained `buildCodeFiles`; keep one package smoke test proving generated `main.js` has no unsupported module syntax.

Acceptance criteria: Source files no longer depend on ambient `RunOrRaise`; build order is not manually listed; `main.ts` explicitly imports collaborators; package tests still verify KWin script compatibility.

Priority: P1.

### Finding: `core.ts` is a catch-all dependency anchor

Evidence: `src/core.ts:6-51` defines binding count and config schema including labels/value types/widget classes; `src/core.ts:53-60` defines `Binding`; `src/core.ts:62-78` defines `Runtime` and `Controller`; `src/core.ts:80-99` defines slot/action/config key naming; `src/core.ts:101-107` defines desktop entry normalization; `scripts/build-package.mjs:57-65` evaluates built `core.js` to read schema; `src/bindings.ts:38-65` depends on naming and normalization; `src/window-matching.ts:87-88` depends on normalization.

Current state: One file owns UI/config schema, domain model, application ports, naming policy, and normalization.

Design concern: Unrelated changes converge on one module. Removing generated config UI, changing domain identity, or changing runtime ports all touch the same anchor.

Correct end state: Split by concept: a binding schema module owns slot count, config fields, KConfig key construction, labels, defaults, and widget metadata; a domain module owns `Binding` and desktop entry normalization/factory; a ports module owns `Runtime`, `Controller`, diagnostics, and future boundary interfaces; the package builder reads only schema.

Suggested migration: Extract schema/naming helpers first, then binding/domain identity, then ports. Update build/test loading to target narrower APIs.

Acceptance criteria: No single source file defines both config widget metadata and runtime/controller ports; package generation does not evaluate unrelated domain or port definitions; matching depends only on domain normalization; binding parsing depends on schema/domain APIs.

Priority: P1.

### Finding: `bindings.ts` interweaves parsing, validation, policy, registration, logging, and callback wiring

Evidence: `src/bindings.ts:18-32` parses config primitives; `src/bindings.ts:34-68` validates and constructs one binding; `src/bindings.ts:77-89` reads all slots; `src/bindings.ts:91-122` checks duplicate shortcuts, formats a log string, calls `registerShortcut`, and closes over `controller.handleBinding(binding)`; `tests/bindings.test.ts:20-105` tests parsing, duplicate policy, registration, logging, and callback dispatch through the same module.

Current state: One module spans config interpretation, domain validation, duplicate-shortcut policy, KWin registration effects, diagnostic text, and controller wiring.

Design concern: The duplicate-shortcut feature and registration effects are difficult to change independently. A future caller could use `readBindings()` and miss that further conflict filtering is still required.

Correct end state: Split the lifecycle into a config parser, a binding policy/registration planner, a registration adapter, and composition-level callback wiring. Diagnostic formatting should happen outside pure policy.

Suggested migration: Extract duplicate filtering to a pure plan function returning accepted bindings plus skipped conflict records; keep `registerBindings` temporarily as an adapter that consumes the plan and preserves current behavior; split config parsing once tests cover both paths.

Acceptance criteria: Duplicate policy is testable without runtime/controller/register mocks; config parsing is testable without registration; registration handles only accepted bindings and explicit skipped records; existing later-duplicate-skip behavior remains unchanged.

Priority: P2.

### Finding: `createController` owns state management, orchestration, and window effects

Evidence: `src/controller.ts:7-8` stores `mruWindows` and `cycleStates`; `src/controller.ts:10-15` reads scope; `src/controller.ts:17-36` manages MRU and cap; `src/controller.ts:38-48` invalidates cycle state; `src/controller.ts:50-58` restores/minimizes/raises/focuses and records MRU; `src/controller.ts:60-87` samples runtime state, matches candidates, plans, stores cycle state, activates, or launches.

Current state: `createController()` is both state store and application service.

Design concern: MRU behavior, cycle lifecycle, candidate matching, activation behavior, and launch behavior have different reasons to change but live in one closure. Correctness-sensitive state is hard to test directly.

Correct end state: Keep `createController(runtime)` as a thin adapter. Introduce `WindowHistory` for MRU ordering/removal/cap/snapshots, `CycleStateStore` for per-binding cycle lookup/update/invalidation, and an application service that gathers a workspace snapshot, asks matching/planning for a command, updates state stores, and delegates effects.

Suggested migration: Add characterization tests for current MRU/cycling/activation behavior; extract `WindowHistory`; extract `CycleStateStore`; leave public controller behavior unchanged while moving raw collection mutation out.

Acceptance criteria: `createController()` no longer directly mutates raw MRU arrays or cycle records; MRU cap/removal policy and cycle invalidation are tested through named owners; activation/launch behavior remains externally unchanged.

Priority: P1.

### Finding: Runtime adapter also owns event-to-controller wiring

Evidence: `src/runtime.ts:20-81` adapts KWin globals into `Runtime`; `src/runtime.ts:84-99` connects raw workspace signals directly to `Controller` methods; `src/main.ts:5-12` passes `workspace` into both `createKWinRuntime()` and `connectWorkspaceSignals()`; `src/runtime.ts:84-87` depends on the full `Controller` interface.

Current state: Most workspace state/effects are hidden behind `Runtime`, but signals bypass that object and wire raw `workspace` directly to controller hooks.

Design concern: The infrastructure boundary is split, and the runtime module knows application state method names.

Correct end state: KWin-specific signal subscription stays at the adapter edge, but event mapping is explicit in composition. Either expose adapter callbacks like `onWindowActivated()` / `onWindowRemoved()`, or move signal-to-controller wiring into a dedicated wiring module.

Suggested migration: Change signal wiring to accept callbacks rather than a full `Controller`; move event-to-controller mapping into `src/main.ts` or a named composition module; preserve optional-signal behavior.

Acceptance criteria: `runtime.ts` no longer depends on full `Controller`; raw `workspace` is not threaded through unrelated composition paths; optional signal behavior remains tested; event mapping is visible in composition code.

Priority: P2.

## Logic Placement and Flow Predictability

### Finding: Shortcut evaluation lacks an explicit workspace snapshot flow

Evidence: `src/controller.ts:60-73` reads active window, windows, scope, and stacking order separately; `src/controller.ts:10-15` builds scope from two runtime calls; `src/runtime.ts:61-79` exposes `stackingOrder()` separately from `windows()` and silently falls back from `windowList` to `windows` to `stackingOrder`; `tests/runtime.test.ts:51-89` documents fallback order.

Current state: A reader must jump across controller, runtime, matching, and planning to know what one shortcut press evaluated.

Design concern: The flow does not show whether state is intended to be coherent, latest-sampled, or best-effort fallback.

Correct end state: `Runtime.workspaceSnapshot()` should return the evaluation state in one value. The controller should derive `WindowScope`, candidates, and action plan from that value.

Suggested migration: Add the snapshot type/method and migrate `handleBinding`; keep pure planner inputs and preserve fallback behavior through snapshot tests.

Acceptance criteria: Shortcut evaluation begins with one snapshot read; fallback semantics are documented at snapshot construction; planner remains pure and receives snapshot-derived data.

Priority: P2.

### Finding: Configuration UI schema is embedded in runtime core and extracted by executing built code

Evidence: `src/core.ts:14-20` includes label/valueType/widget metadata; `src/core.ts:22-51` stores UI fields in runtime namespace; `scripts/build-package.mjs:57-65` executes compiled `build/src/core.js` in a VM to read schema; `scripts/build-package.mjs:101-238` generates config XML/UI from that data.

Current state: Build-time schema discovery runs compiled runtime core code.

Design concern: Build control flow is surprising: changes to runtime core can affect package generation even when unrelated to config schema, and UI-generation details leak into runtime core.

Correct end state: A dedicated schema module or data artifact should define binding slot/field schema. Runtime parsing consumes field identity/defaults, and package generation consumes UI metadata without executing runtime bundle code.

Suggested migration: Extract schema, update runtime parser and package builder to consume it explicitly, and remove VM schema loading after a stable build-time import path exists.

Acceptance criteria: Package generation no longer executes `build/src/core.js` to discover fields; runtime core no longer owns Qt widget classes outside a deliberate schema module; generated config and runtime parsing still use one shared schema.

Priority: P2.

### Finding: Activation recording path is implicit

Evidence: `src/runtime.ts:84-99` wires `windowActivated` to `controller.rememberWindow`; `src/controller.ts:50-58` also calls `rememberWindow(window)` after script-initiated activation; `src/controller.ts:25-35` makes this idempotent by removing before unshifting.

Current state: Activations can be recorded from both KWin signals and direct controller action. This is currently safe because MRU insertion is idempotent for the same window.

Design concern: The authoritative activation-recording path is not named. Future changes to MRU behavior could accidentally double-count or rely on signal ordering.

Correct end state: `WindowHistory` should explicitly support idempotent activation recording, and controller/signal composition should document whether direct recording is the primary path, fallback path, or duplicate-safe companion to KWin signals.

Suggested migration: Add tests for duplicate activation notifications and script-initiated activation followed by `windowActivated`; move record/deduplicate behavior into `WindowHistory`.

Acceptance criteria: Activation recording policy is visible in code structure and covered by tests; behavior remains unchanged.

Priority: P2.

## Testability Problems

### Finding: Pure tests depend on compiled artifacts, package generation, filesystem reads, and VM loading

Evidence: `tests/support/run-or-raise.ts:207-224` reads `../../build/src/*.js` and evaluates concatenated source with `vm.runInNewContext`; `tests/support/run-or-raise.ts:302-343` reads `../../dist/kwin-run-or-raise/contents/code/main.js`; `justfile:63-66` makes `test` depend on `build-source`, test compilation, and `node --test`; `tsconfig.json:3-10` compiles production with `"module": "none"`.

Current state: Tests for pure planning, matching, binding parsing, and runtime behavior cannot import source modules directly. They depend on build layout and VM execution.

Design concern: Pure logic tests are slower and more brittle than necessary, and source-level API drift can be hidden by harness casts and duplicated types.

Correct end state: Domain code is importable by tests as ordinary TypeScript/JavaScript modules. VM/dist tests are reserved for package startup and compatibility smoke coverage.

Suggested migration: Introduce source-level module boundaries, convert core/binding/controller tests to source imports, keep `runScript` for end-to-end package smoke tests only.

Acceptance criteria: Pure tests run without reading `build/src/*.js` or `dist/.../main.js`; production types are not manually duplicated; clean pure test runs do not require package generation; source type changes break tests at compile time.

Priority: P1.

### Finding: Controller state transitions are difficult to test without full script harness

Evidence: `src/controller.ts:7-58` hides MRU/cycle/activation state inside closure-local helpers; `src/controller.ts:60-87` mixes snapshot gathering, planning, state persistence, and effects; `tests/main.test.ts:182-229` verifies MRU/cycling through `runScript`, signal simulation, registered shortcut callbacks, and fake KWin globals.

Current state: The pure planner is testable, but the state lifecycle that makes the planner meaningful is mostly verified through integration-style setup.

Design concern: Small changes to MRU ordering, cycle invalidation, or activation recording are expensive to characterize and easy to observe only through indirect side effects.

Correct end state: A `RunOrRaiseSession`, `WindowHistory`, or `ControllerState` component owns state transitions and returns commands or state snapshots. The KWin controller gathers runtime snapshots, calls the state/domain component, then applies effects.

Suggested migration: Add characterization tests around current controller behavior, then extract state owners and command-returning decision points.

Acceptance criteria: MRU ordering, MRU cap, cycle reuse, and cycle invalidation are testable without workspace/registerShortcut/DBus/VM; `createController` contains mostly wiring and effect application; remaining full-script tests are smoke tests.

Priority: P1.

### Finding: Package generation mixes deterministic generation logic with filesystem side effects

Evidence: `scripts/build-package.mjs:4-7` imports filesystem and VM APIs; `scripts/build-package.mjs:57-99` loads schema by VM; `scripts/build-package.mjs:101-238` defines deterministic XML/UI generation helpers; `scripts/build-package.mjs:241-263` performs top-level `rm`, `mkdir`, `readFile`, and `writeFile`; `tests/package.test.ts:20-105` verifies output by reading `dist`.

Current state: The build script is both generator library and CLI, and tests inspect generated files after a build.

Design concern: Config XML/UI/schema validation behavior is harder to test precisely because it is coupled to filesystem state and prior build steps.

Correct end state: A pure package generator module accepts a validated binding schema and returns artifact contents. The CLI wrapper owns compiled-script reads, cleanup, and writes.

Suggested migration: Extract `generateMainConfig`, `generateConfigUi`, metadata construction, and schema validation into an importable module; add direct tests with in-memory schema; retain one filesystem/package smoke test.

Acceptance criteria: XML/UI generation and schema validation can be tested without `dist`; filesystem cleanup/write logic is isolated; smoke tests still prove required package files are emitted.

Priority: P2.

## Error Handling and Observability Problems

### Finding: Launch failure is logged and forgotten as a void runtime operation

Evidence: `src/core.ts:62-72` defines `Runtime.launchDesktopEntry(desktopEntryId: string): void`; `src/controller.ts:86` calls it without receiving a result; `src/runtime.ts:33-50` catches any `callDBus` exception and prints `Run or Raise: failed to launch ...`; `tests/main.test.ts:277-292` and `tests/runtime.test.ts:92-139` assert print-only failure behavior.

Current state: The KWin runtime adapter owns the DBus call, catches failure, formats a user-facing string, prints it, and returns `void`.

Design concern: The controller cannot distinguish "launch requested successfully" from "launch failed immediately", so future retry, user notification, telemetry, or different failure policy would require changing a void-effect boundary.

Correct end state: `Runtime.launchDesktopEntry` or a narrower launcher port returns a structured result such as success/failure with desktop entry ID, failure kind, and cause. The DBus adapter translates host exceptions; the controller or action execution layer decides how to report, ignore, or later retry failures.

Suggested migration: Introduce `LaunchDesktopEntryResult`; return structured failure data from the adapter; preserve current printed message through a diagnostic reporter; update tests to assert both result and external print behavior.

Acceptance criteria: Launch failure is visible to controller/action orchestration; DBus details remain isolated in `runtime.ts`; existing no-throw plus log behavior remains covered.

Priority: P1.

### Finding: Non-launch host API failures lack a contextual boundary

Evidence: `src/main.ts:4-19` performs startup composition without a try/catch boundary; `src/bindings.ts:113-120` registered shortcuts directly call `controller.handleBinding(binding)`; `src/controller.ts:50-57` mutates minimized state and calls runtime effects without local failure handling; `src/runtime.ts:55-59` directly calls/mutates KWin workspace; `src/runtime.ts:84-99` signal callbacks directly call controller hooks.

Current state: Launch DBus failures are caught, but startup, registration, signal connection, shortcut callback, raise, focus, and signal callback failures would propagate without Run or Raise binding context.

Design concern: If KWin reports uncaught script exceptions, the report may lack `slotName`, `actionName`, `desktopEntryId`, action kind, or phase. The exact KWin behavior is uncertain and should be verified with injected failures in a real KWin environment.

Correct end state: Add one startup execution boundary and one per-binding action boundary that classify failures as startup/action/signal, attach binding context when available, and send structured diagnostics to a reporter. Expected external failures return typed results; unexpected failures are logged with context and either contained or rethrown by explicit policy.

Suggested migration: Add a `DiagnosticReporter`; wrap per-binding shortcut callbacks in a helper; wrap startup stages such as signal connection, config read, and registration; test throwing fake `registerShortcut`, `raiseWindow`, and signal callbacks.

Acceptance criteria: Shortcut execution failures include binding context in diagnostics; one binding failure does not obscure which binding failed; tests cover at least one non-launch host API exception; fatal versus recoverable policy is documented in code.

Priority: P1.

### Finding: Diagnostics are raw strings and invalid/degraded states are silent

Evidence: `src/core.ts:66-68` defines `Runtime.log(message: string)`; `src/runtime.ts:12-18` reduces errors to message/String only; `src/runtime.ts:47-54` formats and prints strings in the runtime adapter; `src/bindings.ts:103-105` formats duplicate-shortcut strings at the policy/effect call site; `src/bindings.ts:42-50` silently skips enabled bindings with empty normalized desktop entry IDs; `src/runtime.ts:66-79` silently falls back to empty windows when no supported window source exists.

Current state: Diagnostics are human strings, and some invalid or degraded states are represented as absence without warning.

Design concern: String-only diagnostics lose event type, severity, binding identity, error name, stack/cause, and machine-readable reason. Silent invalid config and runtime fallback make "shortcut does nothing" or "always launches" difficult to debug.

Correct end state: Internal code emits structured diagnostic events such as `DuplicateShortcutSkipped`, `InvalidBindingConfig`, `LaunchFailed`, and `WindowSourceUnavailable`, with severity and contextual fields. The KWin adapter is the only place formatting events to `print`. Disabled slots can remain silent; enabled-but-invalid slots and missing runtime capabilities should produce diagnostics.

Suggested migration: Define a small diagnostic union; add `reportDiagnostic(event)` while keeping `log` temporarily if needed; move string formatting into runtime/diagnostic formatter; return `{ bindings, diagnostics }` from binding loading or add equivalent diagnostics; add a startup capability check.

Acceptance criteria: Domain modules no longer build full `Run or Raise: ...` strings; errors preserve at least name and message, with stack/cause when available; enabled slots with blank desktop entry IDs produce diagnostics; no supported window source produces one startup diagnostic; tests assert structured events outside formatter tests.

Priority: P2.

## Deletion, Modularity, and Abstraction Problems

### Finding: Global namespace and manual concatenation make modules hard to remove or reorder

Evidence: Same as the cohesion finding: `tsconfig.json:4`, namespace declarations in `src/*.ts`, `scripts/build-package.mjs:14-22`, and VM loading in `tests/support/run-or-raise.ts:216-224`.

Current state: Removing, splitting, or reordering a source module requires build script and test harness coordination.

Design concern: The removal cost is higher than the code size suggests, and dependency direction is not visible.

Correct end state: Explicit modules plus a KWin-compatible bundle output make module membership and dependencies mechanically enforced.

Suggested migration: Convert pure modules first, introduce bundling, then delete manual module lists.

Acceptance criteria: A module can be removed by deleting its imports/exports and tests, without editing a hand-maintained concatenation order.

Priority: P1.

### Finding: Broad modules make individual features harder to remove

Evidence: `src/core.ts` combines schema/domain/ports/naming/normalization; `src/bindings.ts` combines parsing/validation/policy/registration/logging/callback wiring; `src/controller.ts` combines MRU/cycle/orchestration/effects; `src/runtime.ts` combines adapter and signal wiring.

Current state: Several features are implemented inside modules that also own unrelated concepts.

Design concern: Removing or changing duplicate shortcut policy, generated config UI, MRU cycling, launch reporting, or signal handling requires touching modules that own other behavior.

Correct end state: Each feature has a narrow owner: schema, domain binding factory, binding policy, registration adapter, window history, cycle state store, controller application service, KWin runtime adapter, diagnostic reporter, and package generator.

Suggested migration: Extract narrow owners behind existing public functions one at a time, beginning with tests around current behavior.

Acceptance criteria: Each feature can be removed or changed by editing its owner plus composition/tests, without combing through catch-all modules.

Priority: P2.

### Finding: Build/package generation is not a reusable abstraction

Evidence: `scripts/build-package.mjs` keeps deterministic generation functions private to a top-level filesystem script and package tests inspect `dist`.

Current state: The generator cannot be tested or reused without running the build script.

Design concern: This is not a premature abstraction problem so much as a missing boundary around deterministic logic.

Correct end state: A pure generator module plus thin CLI wrapper.

Suggested migration: Extract generator functions and keep package layout unchanged.

Acceptance criteria: Generator tests run in memory, and one smoke test proves file output.

Priority: P2.

## Recommended Correct End-State Architecture

Use explicit TypeScript modules internally and a bundler/build step to emit one KWin-compatible script. `src/main.ts` remains the composition root and imports the runtime adapter, controller/application service, binding loading, registration adapter, diagnostics, and signal subscription wiring.

Own domain rules in small modules. A `binding-schema` module owns valid slots, config field names, defaults, KConfig key construction, and UI metadata. A `binding-domain` module owns `ConfiguredBinding`, desktop entry parsing/normalization, action-name derivation, and binding factories. A `binding-policy` module owns duplicate shortcut canonicalization and registration planning.

Represent state with named owners. `WindowHistory` owns MRU recording, de-duplication, cap policy, removals, and fallback ordering. `CycleStateStore` owns per-binding cycle cursors, cursor validation, update, and invalidation when windows disappear. `WorkspaceSnapshot` owns the state read boundary for a shortcut press.

Keep planning pure. Window matching consumes a snapshot plus a validated binding. Action planning consumes candidates, validated cycle cursor data, MRU ordering data, and stacking data, then returns a command: `none`, `activate(window)`, or `launch(desktopEntryId)`.

Isolate external effects. The KWin runtime adapter owns DBus calls, workspace reads, window raising/focusing, minimized mutation if kept as an effect, signal subscription, and print formatting. It should not own application policy such as duplicate-shortcut resolution or launch-failure reporting.

Represent errors and diagnostics as data. Define a diagnostic event union with severity, event type, binding context, and normalized error details. The adapter formats those events for KWin `print`. Launch attempts return structured results; unexpected host exceptions are caught at startup/action/signal boundaries with context.

Structure tests by layer. Domain tests import source modules directly and do not require build output. State tests exercise `WindowHistory`, `CycleStateStore`, binding factories, binding policy, matching, and planning without KWin globals. Adapter tests cover KWin runtime behavior with fakes. Package smoke tests verify generated `main.js`, metadata, config XML, UI XML, and KWin-compatible script startup through VM or install checks.

## Suggested Refactoring Sequence

1. Add characterization tests around current behavior: cycling order, binding identity normalization, duplicate shortcut policy, MRU fallback, cycle invalidation, workspace-source fallback, launch failure, and non-launch host exceptions.
2. Align documented intent before behavior changes: decide whether focused cycling is internal MRU or KDE Task Switcher order, then update `docs/spec/SPEC.md` and tests accordingly.
3. Centralize duplicated rules/state: introduce binding schema, package manifest, runtime module manifest if modules are still namespace-based, shortcut canonicalization, and desktop-entry parsing/factory.
4. Isolate core domain logic from external effects: expose importable modules, add `WorkspaceSnapshot`, extract binding policy, extract `WindowHistory` and `CycleStateStore`, and make controller return/apply commands through a thin effect boundary.
5. Clarify ownership boundaries: split `core.ts`, separate `bindings.ts` lifecycle pieces, move signal-to-controller mapping into composition, and replace manual concatenation with import-derived bundling.
6. Improve error semantics and observability: add structured diagnostics, launch result types, startup/action/signal boundaries, invalid config diagnostics, and runtime capability diagnostics.
7. Remove or simplify premature/manual abstractions: delete shadow test types after source imports exist, reduce VM tests to package smoke coverage, and extract package generation into a pure module plus CLI wrapper.

## Things Not To Change Yet

- Do not change focused-window cycling behavior until the spec decision is made and committed as intent; the current conflict is documentation versus implementation, not enough evidence by itself to choose Task Switcher order.
- Do not introduce a large framework, service container, or event bus; the correct end state is small typed modules and explicit composition.
- Do not rewrite every module at once; convert pure modules first and keep the KWin package output stable.
- Do not remove the VM/package smoke tests entirely; KWin compatibility still needs coverage after source modules become importable.
- Do not add backward-compatibility migrations for existing user config unless explicitly requested; this package is pre-release per repository policy.
- Do not add retries, user notifications, or telemetry beyond structured diagnostics until launch failure outcomes are represented and current behavior is characterized.

## Appendix: Subagent Reports

Single Source of Truth / Duplication Agent: Accepted the cycling-order conflict as P1, the desktop entry identity duplication as P1, and binding schema/package metadata/test type/module list duplication as P2. The binding identity finding was merged with the invariant agent's stronger formulation. Package metadata and runtime module list were consolidated into one single-source finding.

Invariant / Correctness Agent: Accepted the binding identity invariant as P1, shortcut uniqueness as a P2 binding-set invariant, workspace snapshot incoherence as P2, cycle cursor validity as P2, MRU partial-recency modeling as P2, and slot bounds as P3. Workspace snapshot was also merged into logic-flow findings.

Cohesion / Coupling / Ownership Agent: Accepted ambient namespace/manual concatenation as P1, `core.ts` catch-all ownership as P1, broad `createController` ownership as P1 after main-agent prioritization, runtime signal wiring as P2, and `bindings.ts` mixed lifecycle as P2.

Logic Placement / Flow Readability Agent: Accepted binding registration mixing policy/effects as P2, workspace state reads as P2, hidden controller state changes as part of the controller/state findings, launch failure policy as part of error handling, and config schema VM extraction as P2.

Testability Agent: Accepted compiled-artifact/VM test dependency as P1, hidden controller state as P1, package generation filesystem coupling as P2, and launch failure print-only testing as part of the launch error finding.

Error Handling / Observability Agent: Accepted launch failure as a P1 error-boundary issue, non-launch host API boundaries as P1 with uncertainty about exact KWin uncaught-exception reporting, raw diagnostics as P2, and silent invalid config/runtime fallback as P2.

Deletion / Modularity / Abstraction Agent: Accepted namespace removability as P1, `core.ts` catch-all as P1, binding lifecycle interweaving as P2, controller state/effects coupling as P2/P1 merged upward, runtime signal wiring as P2, package generation modularity as P2, and shadow test API as P2.

Rejected or deferred findings: No subagent finding was rejected as unsupported. Several duplicate formulations were merged. Behavior changes such as switching cycling to KDE Task Switcher order, adding retries, or changing launch/user notification behavior are explicitly deferred until intent and characterization tests exist.
