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

int targetIndexForOffset(const NavigationTargetRequest &request) {
  if (request.desktopCount <= 0 || request.currentIndex < 0 ||
      request.currentIndex >= request.desktopCount) {
    return -1;
  }

  const int targetIndex = request.currentIndex + request.offset;
  if (targetIndex >= 0 && targetIndex < request.desktopCount) {
    return targetIndex;
  }

  if (!request.wrappingAround) {
    return -1;
  }

  if (targetIndex < 0) {
    return request.desktopCount - 1;
  }

  return 0;
}
} // namespace TabPagerDesktopLogic
