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

QList<TabPagerDesktopField> TabPagerDesktopModelState::changedFieldsForRow(
    qsizetype row, const TabPagerDesktopSnapshot &previousSnapshot,
    const TabPagerDesktopSnapshot &nextSnapshot) {
  const TabPagerDesktopRowData previousRow = rowData(
      row, previousSnapshot.desktops.at(row), previousSnapshot.currentDesktop);
  const TabPagerDesktopRowData nextRow =
      rowData(row, nextSnapshot.desktops.at(row), nextSnapshot.currentDesktop);
  QList<TabPagerDesktopField> fields;

  if (previousRow.desktopId != nextRow.desktopId) {
    fields.append(TabPagerDesktopField::DesktopId);
  }

  if (previousRow.name != nextRow.name) {
    fields.append(TabPagerDesktopField::Name);
  }

  if (previousRow.label != nextRow.label) {
    fields.append(TabPagerDesktopField::Label);
  }

  if (previousRow.number != nextRow.number) {
    fields.append(TabPagerDesktopField::Number);
  }

  if (previousRow.active != nextRow.active) {
    fields.append(TabPagerDesktopField::Active);
  }

  return fields;
}
