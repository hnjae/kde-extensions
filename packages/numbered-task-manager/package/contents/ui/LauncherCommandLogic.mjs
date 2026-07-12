// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { actionResult } from "./ActionResultLogic.mjs";
import { assignErrorContext } from "./ErrorContextLogic.mjs";
import { normalizedContextMenuLauncherCommand } from "./TaskContextMenuCommandLogic.mjs";

export function normalizedStringList(value) {
  if (!value) {
    return [];
  }

  return Array.from(value).filter((entry) => entry && entry.length > 0);
}

export function contextMenuLauncherCommandDispatchResult(command) {
  const launcherCommand = normalizedContextMenuLauncherCommand(command);
  const context = {};
  if (launcherCommand.launcherUrl) {
    context.launcherUrl = launcherCommand.launcherUrl;
  }
  if (launcherCommand.launchers.length > 0) {
    context.launchers = launcherCommand.launchers;
  }

  if (
    launcherCommand.action !== "pinLauncher" &&
    launcherCommand.action !== "unpinLauncher" &&
    launcherCommand.action !== "replaceLauncherList"
  ) {
    context.commandKind = launcherCommand.kind;
    return Object.assign(
      actionResult(
        launcherCommand.action || "launcherCommand",
        "unknown-launcher-command",
        false,
        true,
        context,
      ),
      launcherCommand,
    );
  }

  return Object.assign(
    actionResult(launcherCommand.action, "ready", true, false, context),
    launcherCommand,
  );
}

export function launcherMutationContext(launcherUrl) {
  const url = String(launcherUrl || "");
  return url ? { launcherUrl: url } : {};
}

export function launcherMutationRequest(action, launcherUrl) {
  const requestAction = action || "launcherMutation";
  const context = launcherMutationContext(launcherUrl);

  if (!context.launcherUrl) {
    return actionResult(
      requestAction,
      "missing-launcher-url",
      false,
      false,
      context,
    );
  }

  return Object.assign(
    actionResult(requestAction, "ready", true, false, context),
    {
      launcherUrl: context.launcherUrl,
    },
  );
}

export function launcherMutationResult(requestResult, accepted, error) {
  const request = requestResult || {};
  if (!request.ok) {
    return request;
  }

  const context = launcherMutationContext(
    request.launcherUrl || request.context?.launcherUrl,
  );
  if (error !== undefined && error !== null) {
    assignErrorContext(context, error);
    return Object.assign(
      actionResult(
        request.action || "launcherMutation",
        "request-threw",
        false,
        true,
        context,
      ),
      {
        launcherUrl: context.launcherUrl || "",
      },
    );
  }

  const code = accepted ? "accepted" : "request-rejected";
  return Object.assign(
    actionResult(
      request.action || "launcherMutation",
      code,
      accepted,
      !accepted,
      context,
    ),
    {
      launcherUrl: context.launcherUrl || "",
    },
  );
}

export function launcherMutationPersistenceResult(
  requestResult,
  persistResult,
) {
  const request = requestResult || {};
  if (!request.ok) {
    return request;
  }

  const persistence = persistResult || {};
  const context = Object.assign({}, request.context || {});
  if (request.launcherUrl) {
    context.launcherUrl = request.launcherUrl;
  }
  if (persistence.code) {
    context.syncCode = String(persistence.code);
  }
  const failedTargets = normalizedStringList(persistence.failedTargets);
  if (failedTargets.length > 0) {
    context.failedTargets = failedTargets;
  }
  const launchers = normalizedStringList(
    persistence.targetLaunchers || persistence.launchers,
  );
  if (launchers.length > 0) {
    context.launchers = launchers;
  }
  const configLaunchers = normalizedStringList(persistence.configLaunchers);
  if (configLaunchers.length > 0) {
    context.configLaunchers = configLaunchers;
  }
  const modelLaunchers = normalizedStringList(persistence.modelLaunchers);
  if (modelLaunchers.length > 0) {
    context.modelLaunchers = modelLaunchers;
  }
  if (persistence.error !== undefined && persistence.error !== null) {
    assignErrorContext(context, persistence.error);
  }

  if (persistence.ok) {
    return Object.assign(
      actionResult(
        request.action || "launcherMutation",
        persistence.code || "launcher-persisted",
        true,
        false,
        context,
      ),
      {
        launcherUrl: context.launcherUrl || "",
      },
    );
  }

  const pending = persistence.code === "reconciliation-pending";
  return Object.assign(
    actionResult(
      request.action || "launcherMutation",
      persistence.code || "launcher-persistence-failed",
      false,
      !pending,
      context,
    ),
    {
      launcherUrl: context.launcherUrl || "",
    },
  );
}
