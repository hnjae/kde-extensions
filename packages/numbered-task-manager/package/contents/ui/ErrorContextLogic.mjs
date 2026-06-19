// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export function errorMessage(error) {
  if (error?.message) {
    return String(error.message);
  }

  return String(error);
}

export function errorContext(error) {
  const context = {
    error: errorMessage(error),
    errorMessage: errorMessage(error),
  };

  if (error && typeof error === "object") {
    if (error.name) {
      context.errorName = String(error.name);
    }
    if (error.code !== undefined && error.code !== null) {
      context.errorCode = String(error.code);
    }
    if (error.fileName) {
      context.fileName = String(error.fileName);
    }
    if (error.lineNumber !== undefined && error.lineNumber !== null) {
      const lineNumber = Number(error.lineNumber);
      if (Number.isFinite(lineNumber)) {
        context.lineNumber = lineNumber;
      }
    }
  } else {
    context.errorName = typeof error;
  }

  return context;
}

export function assignErrorContext(context, error) {
  return Object.assign(context || {}, errorContext(error));
}
