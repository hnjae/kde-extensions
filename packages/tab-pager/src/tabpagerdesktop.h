// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopid.h"

#include <QList>
#include <QString>

#include <cstdint>

struct TabPagerDesktop {
  TabPagerDesktopId id;
  QString name;
};

struct TabPagerDesktopSnapshotNormalizationIssue {
  enum class Type : std::uint8_t {
    InvalidDesktopId,
    DuplicateDesktopId,
    UnmatchedCurrentDesktop,
  };

  Type type = Type::InvalidDesktopId;
  qsizetype row = -1;
  qsizetype relatedRow = -1;
  TabPagerDesktopId desktopId;
};

class TabPagerDesktopSnapshot;

struct TabPagerDesktopSnapshotNormalizationResult;

[[nodiscard]] TabPagerDesktopSnapshotNormalizationResult
normalizeTabPagerDesktopSnapshot(QList<TabPagerDesktop> desktops,
                                 TabPagerDesktopId currentDesktop = {});

class TabPagerDesktopSnapshot final {
public:
  TabPagerDesktopSnapshot() = default;

  [[nodiscard]] static TabPagerDesktopSnapshot
  fromDesktops(QList<TabPagerDesktop> desktops,
               TabPagerDesktopId currentDesktop = {});

  [[nodiscard]] const QList<TabPagerDesktop> &desktops() const;
  [[nodiscard]] const TabPagerDesktopId &currentDesktop() const;

private:
  TabPagerDesktopSnapshot(QList<TabPagerDesktop> desktops,
                          TabPagerDesktopId currentDesktop);

  friend TabPagerDesktopSnapshotNormalizationResult
  normalizeTabPagerDesktopSnapshot(QList<TabPagerDesktop> desktops,
                                   TabPagerDesktopId currentDesktop);

  QList<TabPagerDesktop> m_desktops;
  TabPagerDesktopId m_currentDesktop;
};

struct TabPagerDesktopSnapshotNormalizationResult {
  TabPagerDesktopSnapshot snapshot;
  QList<TabPagerDesktopSnapshotNormalizationIssue> issues;
};
