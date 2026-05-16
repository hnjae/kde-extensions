// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktop.h"
#include "tabpagerdesktopmodelstate.h"

#include <QModelIndex>
#include <QSignalSpy>
#include <QString>
#include <QVariant>

#include <utility>

namespace TabPagerTest {
[[nodiscard]] inline TabPagerDesktopId desktopId(const char *id) {
  return TabPagerDesktopId::fromVariant(QString::fromLatin1(id));
}

[[nodiscard]] inline TabPagerDesktopId invalidDesktopId() { return {}; }

[[nodiscard]] inline TabPagerDesktop namedDesktop(const char *id,
                                                  const QString &name) {
  return TabPagerDesktop{
      .id = desktopId(id),
      .name = name,
  };
}

[[nodiscard]] inline TabPagerDesktop namedDesktop(const char *id,
                                                  const char *name) {
  return namedDesktop(id, QString::fromLatin1(name));
}

[[nodiscard]] inline TabPagerDesktop defaultDesktop(const char *id,
                                                    int number) {
  return namedDesktop(id, QStringLiteral("Desktop %1").arg(number));
}

[[nodiscard]] inline TabPagerDesktop unnamedDesktop(const char *id) {
  return namedDesktop(id, QString());
}

[[nodiscard]] inline TabPagerDesktop invalidDesktop(const QString &name) {
  return TabPagerDesktop{
      .id = invalidDesktopId(),
      .name = name,
  };
}

[[nodiscard]] inline TabPagerDesktopSnapshot
desktopSnapshot(QList<TabPagerDesktop> desktops,
                TabPagerDesktopId currentDesktop = {}) {
  return TabPagerDesktopSnapshot{
      .desktops = std::move(desktops),
      .currentDesktop = std::move(currentDesktop),
  };
}

[[nodiscard]] inline QList<TabPagerDesktopRowData>
desktopRows(QList<TabPagerDesktop> desktops,
            TabPagerDesktopId currentDesktop = {}) {
  return tabPagerDesktopRowsForSnapshot(
      desktopSnapshot(std::move(desktops), std::move(currentDesktop)));
}

[[nodiscard]] inline TabPagerDesktopModelState
desktopModelState(QList<TabPagerDesktop> desktops,
                  TabPagerDesktopId currentDesktop = {}) {
  return TabPagerDesktopModelState::fromRows(
      desktopRows(std::move(desktops), std::move(currentDesktop)));
}

[[nodiscard]] inline int role(TabPagerDesktopRowRole role) {
  return static_cast<int>(role);
}

struct DataChangedEmission {
  int firstRow = -1;
  int lastRow = -1;
  QList<int> roles;
};

[[nodiscard]] inline DataChangedEmission
takeDataChangedEmission(QSignalSpy &spy) {
  const QList<QVariant> arguments = spy.takeFirst();
  return DataChangedEmission{
      .firstRow = qvariant_cast<QModelIndex>(arguments.at(0)).row(),
      .lastRow = qvariant_cast<QModelIndex>(arguments.at(1)).row(),
      .roles = qvariant_cast<QList<int>>(arguments.at(2)),
  };
}
} // namespace TabPagerTest
