// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadPackageLayout } from "./package-layout.mjs";
import {
  checkKPackageInstall,
  KPackageInstallError,
} from "./package-operations.mjs";

const layout = await loadPackageLayout();

try {
  await checkKPackageInstall(layout);
} catch (error) {
  if (error instanceof KPackageInstallError) {
    process.exit(error.exitCode);
  }

  throw error;
}
