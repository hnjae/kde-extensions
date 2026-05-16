// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "node:fs/promises";
import vm from "node:vm";

export type TestDesktop = {
  id?: string;
  name?: string;
};

export type TestWindow = {
  activities?: string[];
  deleted?: boolean;
  desktopFileName?: string;
  desktops?: TestDesktop[];
  dialog?: boolean;
  hidden?: boolean;
  inputMethod?: boolean;
  managed?: boolean;
  minimized?: boolean;
  normalWindow?: boolean;
  onAllDesktops?: boolean;
  wantsInput?: boolean;
};

export type Binding = {
  actionName: string;
  desktopEntryId: string;
  displayName: string;
  normalizedDesktopEntryId: string;
  shortcut: string;
  slotName: string;
};

export type BindingConfigField = {
  defaultValue: boolean | string;
  label: string;
  name: string;
  valueType: string;
  widgetClass: string;
};

export type BindingSchema = {
  fields: BindingConfigField[];
  slots: string[];
};

export type WindowScope = {
  currentActivity: string | undefined;
  currentDesktop: TestDesktop | undefined;
};

export type CycleState = {
  candidates: TestWindow[];
  index: number;
};

export type BindingActionInput = {
  activeWindow: TestWindow | null;
  candidates: TestWindow[];
  cycleState: CycleState | undefined;
  mruWindows: TestWindow[];
  stackingOrder: TestWindow[] | undefined;
};

export type BindingActionPlan =
  | {
      cycleState: CycleState | undefined;
      kind: "activate";
      window: TestWindow;
    }
  | {
      cycleState: CycleState | undefined;
      kind: "launch" | "none";
    };

export type ConfigReader = (
  key: string,
  defaultValue: boolean | string,
) => boolean | string | number | null | undefined;

export type RegisteredShortcut = {
  actionName: string;
  callback: () => void;
  keySequence: string;
  text: string;
};

export type Runtime = {
  activeWindow(): TestWindow | null;
  currentActivity(): string | undefined;
  currentDesktop(): TestDesktop | undefined;
  launchDesktopEntry(desktopEntryId: string): void;
  log(message: string): void;
  raiseWindow(window: TestWindow): void;
  setActiveWindow(window: TestWindow): void;
  stackingOrder(): TestWindow[] | undefined;
  windows(): TestWindow[];
};

export type Controller = {
  forgetWindow(window: TestWindow): void;
  handleBinding?(binding: Binding): void;
  rememberWindow(window: TestWindow | null): void;
};

export type TestWorkspace = {
  activeWindow: TestWindow | null;
  currentActivity?: string;
  currentDesktop?: TestDesktop;
  raiseWindow(window: TestWindow): void;
  stackingOrder?: TestWindow[];
  windowActivated?: {
    connect(callback: (window: TestWindow | null) => void): void;
  };
  windowList?: () => TestWindow[];
  windowRemoved?: {
    connect(callback: (window: TestWindow) => void): void;
  };
  windows?: TestWindow[];
};

export type KWinEnvironment = {
  callDBus(...args: unknown[]): void;
  print(message: string): void;
  workspace: TestWorkspace;
};

export type RunOrRaiseCoreApi = {
  candidateWindowsForBinding(
    windows: TestWindow[],
    scope: WindowScope,
    binding: Binding,
  ): TestWindow[];
  normalizeDesktopEntryId(desktopEntryId: string): string;
  planBindingAction(input: BindingActionInput): BindingActionPlan;
};

export type RunOrRaiseBindingsApi = {
  readBindings(readConfig: ConfigReader): Binding[];
  registerBindings(
    runtime: { log(message: string): void },
    controller: { handleBinding(binding: Binding): void },
    bindings: Binding[],
    registerShortcut: (
      actionName: string,
      text: string,
      keySequence: string,
      callback: () => void,
    ) => void,
  ): void;
};

export type RunOrRaiseRuntimeApi = {
  connectWorkspaceSignals(
    workspace: TestWorkspace,
    controller: Controller,
  ): void;
  createKWinRuntime(environment: KWinEnvironment): Runtime;
};

export type RunOrRaiseSchemaApi = {
  bindingConfigFields: BindingConfigField[];
  bindingSlotNames(): string[];
};

export type RunOrRaiseApi = RunOrRaiseCoreApi &
  RunOrRaiseBindingsApi &
  RunOrRaiseRuntimeApi;

export type ScriptOptions = {
  activeWindow?: TestWindow | null;
  config?: Record<string, unknown>;
  currentActivity?: string;
  currentDesktop?: TestDesktop;
  dbusError?: unknown;
  stackingOrder?: TestWindow[];
  windowSource?: "stackingOrder" | "windowList" | "windows";
  windows?: TestWindow[];
};

export type ScriptHarness = {
  dbusCalls: unknown[][];
  notifyActivated: (window: TestWindow | null) => void;
  notifyRemoved: (window: TestWindow) => void;
  prints: string[];
  registeredShortcuts: RegisteredShortcut[];
  raisedWindows: TestWindow[];
  workspace: {
    activeWindow: TestWindow | null;
    currentActivity: string;
    currentDesktop: TestDesktop;
    raiseWindow(window: TestWindow): void;
    stackingOrder: TestWindow[];
    windowActivated: {
      connect(callback: (window: TestWindow | null) => void): void;
    };
    windowList?: () => TestWindow[];
    windowRemoved: {
      connect(callback: (window: TestWindow) => void): void;
    };
    windows?: TestWindow[];
  };
};

const mainScriptUrl = new URL(
  "../../dist/kwin-run-or-raise/contents/code/main.js",
  import.meta.url,
);

function buildSourceUrl(moduleName: string): URL {
  return new URL(`../../build/src/${moduleName}.js`, import.meta.url);
}

export async function loadRunOrRaise<T>(moduleNames: string[]): Promise<T> {
  const source = await Promise.all(
    moduleNames.map((moduleName) =>
      readFile(buildSourceUrl(moduleName), "utf8"),
    ),
  );

  return vm.runInNewContext(`${source.join("\n")}\nRunOrRaise;`, {}) as T;
}

export function appWindow(overrides: Partial<TestWindow> = {}): TestWindow {
  return {
    activities: [],
    desktopFileName: "firefox",
    desktops: [],
    managed: true,
    normalWindow: true,
    wantsInput: true,
    ...overrides,
  };
}

export function binding(overrides: Partial<Binding> = {}): Binding {
  return {
    actionName: "RunOrRaiseBinding01",
    desktopEntryId: "firefox.desktop",
    displayName: "Firefox",
    normalizedDesktopEntryId: "firefox",
    shortcut: "Meta+W",
    slotName: "Binding01",
    ...overrides,
  };
}

export async function loadBindingSchema(): Promise<BindingSchema> {
  const runOrRaise = await loadRunOrRaise<RunOrRaiseSchemaApi>(["core"]);
  const bindingSchema = {
    fields: runOrRaise.bindingConfigFields,
    slots: runOrRaise.bindingSlotNames(),
  };

  if (
    bindingSchema.slots.length === 0 ||
    bindingSchema.fields.length === 0 ||
    bindingSchema.slots.some((slot) => typeof slot !== "string") ||
    bindingSchema.fields.some(
      (field) =>
        typeof field !== "object" ||
        field === null ||
        typeof field.name !== "string" ||
        typeof field.label !== "string" ||
        typeof field.valueType !== "string" ||
        typeof field.widgetClass !== "string",
    )
  ) {
    throw new Error("Failed to load binding schema from build/src/core.js");
  }

  return bindingSchema;
}

export function configReader(config: Record<string, unknown>): ConfigReader {
  const keys = new Set(Object.keys(config));

  return (key, defaultValue) =>
    keys.has(key)
      ? (config[key] as boolean | string | number | null | undefined)
      : defaultValue;
}

export function plainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function workspace(
  overrides: Partial<TestWorkspace> = {},
): TestWorkspace {
  return {
    activeWindow: null,
    currentActivity: "activity-1",
    currentDesktop: { id: "desktop-1" },
    raiseWindow(): void {},
    ...overrides,
  };
}

export async function runScript(
  options: ScriptOptions = {},
): Promise<ScriptHarness> {
  const script = await readFile(mainScriptUrl, "utf8");
  const config = options.config ?? {};
  const configKeys = new Set(Object.keys(config));
  const windows = options.windows ?? [];
  const currentDesktop = options.currentDesktop ?? { id: "desktop-1" };
  const activationCallbacks: Array<(window: TestWindow | null) => void> = [];
  const removalCallbacks: Array<(window: TestWindow) => void> = [];
  const dbusCalls: unknown[][] = [];
  const registeredShortcuts: RegisteredShortcut[] = [];
  const prints: string[] = [];
  const raisedWindows: TestWindow[] = [];
  const testWorkspace: ScriptHarness["workspace"] = {
    activeWindow: options.activeWindow ?? null,
    currentActivity: options.currentActivity ?? "activity-1",
    currentDesktop,
    stackingOrder: options.stackingOrder ?? windows,
    raiseWindow(window: TestWindow): void {
      raisedWindows.push(window);
    },
    windowActivated: {
      connect(callback: (window: TestWindow | null) => void): void {
        activationCallbacks.push(callback);
      },
    },
    windowRemoved: {
      connect(callback: (window: TestWindow) => void): void {
        removalCallbacks.push(callback);
      },
    },
  };
  const windowSource = options.windowSource ?? "windowList";

  if (windowSource === "windowList") {
    testWorkspace.windowList = (): TestWindow[] => windows;
  } else if (windowSource === "windows") {
    testWorkspace.windows = windows;
  }

  vm.runInNewContext(script, {
    callDBus(...args: unknown[]): void {
      if (options.dbusError !== undefined) {
        throw options.dbusError;
      }

      dbusCalls.push(
        args.map((argument) =>
          Array.isArray(argument) ? [...argument] : argument,
        ),
      );
    },
    print(message: string): void {
      prints.push(message);
    },
    readConfig(key: string, defaultValue: unknown): unknown {
      return configKeys.has(key) ? config[key] : defaultValue;
    },
    registerShortcut(
      actionName: string,
      text: string,
      keySequence: string,
      callback: () => void,
    ): void {
      registeredShortcuts.push({ actionName, callback, keySequence, text });
    },
    workspace: testWorkspace,
  });

  return {
    dbusCalls,
    notifyActivated(window: TestWindow | null): void {
      for (const callback of activationCallbacks) {
        callback(window);
      }
    },
    notifyRemoved(window: TestWindow): void {
      for (const callback of removalCallbacks) {
        callback(window);
      }
    },
    prints,
    registeredShortcuts,
    raisedWindows,
    workspace: testWorkspace,
  };
}
