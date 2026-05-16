// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

// biome-ignore lint/correctness/noUnusedVariables: The package builder concatenates this namespace before src/main.ts.
namespace RunOrRaise {
  export type KWinEnvironment = {
    callDBus: typeof callDBus;
    print: typeof print;
    workspace: KWinWorkspace;
  };

  function describeError(error: unknown): string {
    if (typeof error === "object" && error !== null && "message" in error) {
      return String((error as { message: unknown }).message);
    }

    return String(error);
  }

  export function createKWinRuntime(environment: KWinEnvironment): Runtime {
    const { callDBus, print, workspace } = environment;

    return {
      activeWindow(): KWinWindow | null {
        return workspace.activeWindow;
      },
      currentActivity(): string | undefined {
        return workspace.currentActivity;
      },
      currentDesktop(): KWinDesktop | undefined {
        return workspace.currentDesktop;
      },
      launchDesktopEntry(desktopEntryId: string): void {
        try {
          callDBus(
            "org.kde.klauncher",
            "/KLauncher",
            "org.kde.KLauncher",
            "start_service_by_desktop_name",
            desktopEntryId,
            [],
            [],
            "",
            false,
          );
        } catch (error) {
          print(
            `Run or Raise: failed to launch ${desktopEntryId}: ${describeError(error)}`,
          );
        }
      },
      log(message: string): void {
        print(message);
      },
      raiseWindow(window: KWinWindow): void {
        workspace.raiseWindow(window);
      },
      setActiveWindow(window: KWinWindow): void {
        workspace.activeWindow = window;
      },
      stackingOrder(): KWinWindow[] | undefined {
        return Array.isArray(workspace.stackingOrder)
          ? workspace.stackingOrder
          : undefined;
      },
      windows(): KWinWindow[] {
        if (typeof workspace.windowList === "function") {
          return workspace.windowList();
        }

        if (Array.isArray(workspace.windows)) {
          return workspace.windows;
        }

        if (Array.isArray(workspace.stackingOrder)) {
          return workspace.stackingOrder;
        }

        return [];
      },
    };
  }

  export function connectWorkspaceSignals(
    workspace: KWinWorkspace,
    controller: Controller,
  ): void {
    if (workspace.windowActivated !== undefined) {
      workspace.windowActivated.connect((window) => {
        controller.rememberWindow(window);
      });
    }

    if (workspace.windowRemoved !== undefined) {
      workspace.windowRemoved.connect((window) => {
        controller.forgetWindow(window);
      });
    }
  }
}
