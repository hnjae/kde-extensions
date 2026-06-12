// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktop.h"

#include <utility>

namespace {
[[nodiscard]] qsizetype
firstMatchingDesktopIdIndex(const QList<TabPagerDesktopId> &desktopIds,
                            const TabPagerDesktopId &desktopId) {
  for (qsizetype row = 0; row < desktopIds.size(); ++row) {
    if (desktopIds.at(row) == desktopId) {
      return row;
    }
  }

  return -1;
}
} // namespace

TabPagerDesktopSnapshot::TabPagerDesktopSnapshot(
    QList<TabPagerDesktop> desktops, TabPagerDesktopId currentDesktop)
    : m_desktops(std::move(desktops)),
      m_currentDesktop(std::move(currentDesktop)) {}

TabPagerDesktopSnapshot
TabPagerDesktopSnapshot::fromDesktops(QList<TabPagerDesktop> desktops,
                                      TabPagerDesktopId currentDesktop) {
  return normalizeTabPagerDesktopSnapshot(std::move(desktops),
                                          std::move(currentDesktop))
      .snapshot;
}

const QList<TabPagerDesktop> &TabPagerDesktopSnapshot::desktops() const {
  return m_desktops;
}

const TabPagerDesktopId &TabPagerDesktopSnapshot::currentDesktop() const {
  return m_currentDesktop;
}

TabPagerDesktopSnapshotNormalizationResult
normalizeTabPagerDesktopSnapshot(QList<TabPagerDesktop> desktops,
                                 TabPagerDesktopId currentDesktop) {
  QList<TabPagerDesktop> normalizedDesktops;
  normalizedDesktops.reserve(desktops.size());
  QList<TabPagerDesktopSnapshotNormalizationIssue> issues;
  QList<TabPagerDesktopId> acceptedDesktopIds;
  QList<qsizetype> acceptedDesktopRows;
  bool currentDesktopMatched = false;

  for (qsizetype row = 0; row < desktops.size(); ++row) {
    TabPagerDesktop desktop = std::move(desktops[row]);
    if (!desktop.id.isValid()) {
      issues.append(TabPagerDesktopSnapshotNormalizationIssue{
          .type =
              TabPagerDesktopSnapshotNormalizationIssue::Type::InvalidDesktopId,
          .row = row,
          .desktopId = desktop.id,
      });
      continue;
    }

    const qsizetype matchingIndex =
        firstMatchingDesktopIdIndex(acceptedDesktopIds, desktop.id);
    if (matchingIndex >= 0) {
      issues.append(TabPagerDesktopSnapshotNormalizationIssue{
          .type = TabPagerDesktopSnapshotNormalizationIssue::Type::
              DuplicateDesktopId,
          .row = row,
          .relatedRow = acceptedDesktopRows.at(matchingIndex),
          .desktopId = desktop.id,
      });
      continue;
    }

    currentDesktopMatched =
        currentDesktopMatched || desktop.id.matches(currentDesktop);
    acceptedDesktopIds.append(desktop.id);
    acceptedDesktopRows.append(row);
    normalizedDesktops.append(std::move(desktop));
  }

  if (!normalizedDesktops.isEmpty() && currentDesktop.isValid() &&
      !currentDesktopMatched) {
    issues.append(TabPagerDesktopSnapshotNormalizationIssue{
        .type = TabPagerDesktopSnapshotNormalizationIssue::Type::
            UnmatchedCurrentDesktop,
        .desktopId = currentDesktop,
    });
  }

  return TabPagerDesktopSnapshotNormalizationResult{
      .snapshot = TabPagerDesktopSnapshot(std::move(normalizedDesktops),
                                          currentDesktopMatched
                                              ? std::move(currentDesktop)
                                              : TabPagerDesktopId{}),
      .issues = std::move(issues),
  };
}
