// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
  const runtime = RunOrRaise.createKWinRuntime({
    callDBus,
    print,
    workspace,
  });
  const controller = RunOrRaise.createController(runtime);

  RunOrRaise.connectWorkspaceSignals(workspace, controller);

  RunOrRaise.registerBindings(
    runtime,
    controller,
    RunOrRaise.readBindings(readConfig),
    registerShortcut,
  );
})();
