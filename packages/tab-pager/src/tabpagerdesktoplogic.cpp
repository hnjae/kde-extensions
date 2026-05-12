// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoplogic.h"

namespace TabPagerDesktopLogic {
QString labelForDesktop(int number, const QString &name) {
  if (name.isEmpty()) {
    return QString::number(number);
  }

  if (name == QStringLiteral("Desktop %1").arg(number)) {
    return QString::number(number);
  }

  return name;
}

int targetIndexForOffset(int currentIndex, int desktopCount, int offset,
                         bool wrappingAround) {
  if (desktopCount <= 0 || currentIndex < 0 || currentIndex >= desktopCount) {
    return -1;
  }

  const int targetIndex = currentIndex + offset;
  if (targetIndex >= 0 && targetIndex < desktopCount) {
    return targetIndex;
  }

  if (!wrappingAround) {
    return -1;
  }

  if (targetIndex < 0) {
    return desktopCount - 1;
  }

  return 0;
}
} // namespace TabPagerDesktopLogic
