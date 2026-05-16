// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadPackageLayout } from "./package-layout.mjs";
import { buildPackage } from "./package-operations.mjs";

const layout = await loadPackageLayout();

await buildPackage(layout);
