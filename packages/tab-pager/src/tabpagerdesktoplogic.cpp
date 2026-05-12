// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoplogic.h"

namespace {
constexpr int wheelDeltaPerStep = 120;

[[nodiscard]] int wrappedIndexForOffset(int currentIndex, int desktopCount,
                                        int offset) {
  const int wrappedOffset = offset % desktopCount;
  int wrappedIndex = static_cast<int>(
      (static_cast<long long>(currentIndex) + wrappedOffset) % desktopCount);
  if (wrappedIndex < 0) {
    wrappedIndex += desktopCount;
  }

  return wrappedIndex;
}
} // namespace

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

  const long long targetIndex =
      static_cast<long long>(request.currentIndex) + request.offset;
  if (targetIndex >= 0 && targetIndex < request.desktopCount) {
    return static_cast<int>(targetIndex);
  }

  if (!request.wrappingAround) {
    return -1;
  }

  return wrappedIndexForOffset(request.currentIndex, request.desktopCount,
                               request.offset);
}

WheelDeltaResult consumeWheelDelta(int pendingDelta, int delta) {
  const long long accumulatedDelta =
      static_cast<long long>(pendingDelta) + delta;

  return WheelDeltaResult{
      .remainingDelta = static_cast<int>(accumulatedDelta % wheelDeltaPerStep),
      .steps = static_cast<int>(accumulatedDelta / wheelDeltaPerStep),
  };
}
} // namespace TabPagerDesktopLogic
