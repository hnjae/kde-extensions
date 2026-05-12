// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

namespace {
[[nodiscard]] int indexOfDesktop(const QList<TabPagerDesktop> &desktops,
                                 const QVariant &desktopId) {
  for (qsizetype index = 0; index < desktops.size(); ++index) {
    if (desktops.at(index).id == desktopId) {
      return static_cast<int>(index);
    }
  }

  return -1;
}

[[nodiscard]] bool sameRowData(const TabPagerDesktopRowData &left,
                               const TabPagerDesktopRowData &right) {
  return left.desktopId == right.desktopId && left.name == right.name &&
         left.label == right.label && left.number == right.number &&
         left.active == right.active;
}

[[nodiscard]] QList<TabPagerDesktopRowChange>
changedRowsForSnapshots(const TabPagerDesktopSnapshot &previousSnapshot,
                        const TabPagerDesktopSnapshot &nextSnapshot) {
  QList<TabPagerDesktopRowChange> rowChanges;

  for (qsizetype row = 0; row < nextSnapshot.desktops.size(); ++row) {
    const TabPagerDesktopRowData previousRow =
        TabPagerDesktopModelState::rowData(row,
                                           previousSnapshot.desktops.at(row),
                                           previousSnapshot.currentDesktop);
    const TabPagerDesktopRowData nextRow = TabPagerDesktopModelState::rowData(
        row, nextSnapshot.desktops.at(row), nextSnapshot.currentDesktop);

    if (!sameRowData(previousRow, nextRow)) {
      rowChanges.append(TabPagerDesktopRowChange{
          .row = row,
          .previousRow = previousRow,
          .nextRow = nextRow,
      });
    }
  }

  return rowChanges;
}
} // namespace

int TabPagerDesktopModelState::count() const {
  return static_cast<int>(m_desktops.size());
}

int TabPagerDesktopModelState::currentIndex() const {
  return indexOfDesktop(m_desktops, m_currentDesktop);
}

bool TabPagerDesktopModelState::hasDesktopAt(int index) const {
  return index >= 0 && index < m_desktops.size();
}

QVariant TabPagerDesktopModelState::desktopIdAt(int index) const {
  return m_desktops.at(index).id;
}

TabPagerDesktopRowData TabPagerDesktopModelState::rowData(qsizetype row) const {
  return rowData(row, m_desktops.at(row), m_currentDesktop);
}

TabPagerDesktopSnapshot TabPagerDesktopModelState::snapshot() const {
  return TabPagerDesktopSnapshot{
      .desktops = m_desktops,
      .currentDesktop = m_currentDesktop,
  };
}

TabPagerDesktopSnapshotChange TabPagerDesktopModelState::changeForSnapshot(
    const TabPagerDesktopSnapshot &nextSnapshot) const {
  const TabPagerDesktopSnapshot previousSnapshot = snapshot();
  if (sameSnapshot(previousSnapshot, nextSnapshot)) {
    return {};
  }

  const int previousCount = count();
  const int nextCount = static_cast<int>(nextSnapshot.desktops.size());
  const bool countChanged = previousCount != nextCount;
  const bool currentIndexChanged =
      currentIndex() !=
      indexOfDesktop(nextSnapshot.desktops, nextSnapshot.currentDesktop);

  if (countChanged) {
    return TabPagerDesktopSnapshotChange{
        .operation = TabPagerDesktopSnapshotChange::Operation::Reset,
        .countChanged = true,
        .currentIndexChanged = currentIndexChanged,
        .rowChanges = {},
    };
  }

  return TabPagerDesktopSnapshotChange{
      .operation = TabPagerDesktopSnapshotChange::Operation::UpdateRows,
      .countChanged = false,
      .currentIndexChanged = currentIndexChanged,
      .rowChanges = changedRowsForSnapshots(previousSnapshot, nextSnapshot),
  };
}

void TabPagerDesktopModelState::setSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  m_desktops = snapshot.desktops;
  m_currentDesktop = snapshot.currentDesktop;
}

bool TabPagerDesktopModelState::sameSnapshot(
    const TabPagerDesktopSnapshot &left, const TabPagerDesktopSnapshot &right) {
  return left.desktops == right.desktops &&
         left.currentDesktop == right.currentDesktop;
}

TabPagerDesktopRowData
TabPagerDesktopModelState::rowData(qsizetype row,
                                   const TabPagerDesktop &desktop,
                                   const QVariant &currentDesktop) {
  const int number = static_cast<int>(row + 1);
  return TabPagerDesktopRowData{
      .desktopId = desktop.id,
      .name = desktop.name,
      .label = TabPagerDesktopLogic::labelForDesktop(number, desktop.name),
      .number = number,
      .active = desktop.id == currentDesktop,
  };
}
