// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include <utility>

TabPagerDesktopModelState TabPagerDesktopModelState::fromSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelState state;
  state.m_rows = TabPagerDesktopRows::fromSnapshot(snapshot);
  return state;
}

TabPagerDesktopModelTransition TabPagerDesktopModelState::transitionToSnapshot(
    const TabPagerDesktopSnapshot &snapshot) const {
  return transitionTo(fromSnapshot(snapshot));
}

int TabPagerDesktopModelState::count() const { return m_rows.count(); }

int TabPagerDesktopModelState::currentIndex() const {
  return m_rows.currentIndex();
}

std::optional<TabPagerDesktopId>
TabPagerDesktopModelState::desktopIdForIndex(int index) const {
  return m_rows.desktopIdForIndex(index);
}

TabPagerDesktopRowData TabPagerDesktopModelState::rowData(qsizetype row) const {
  return m_rows.rowData(row);
}

TabPagerDesktopModelTransition TabPagerDesktopModelState::transitionTo(
    TabPagerDesktopModelState nextState) const {
  const bool countChanged = m_rows.count() != nextState.m_rows.count();
  const bool currentIndexChanged =
      m_rows.currentIndex() != nextState.m_rows.currentIndex();

  if (!m_rows.hasSameIdentityAs(nextState.m_rows)) {
    return TabPagerDesktopModelTransition{
        .nextState = std::move(nextState),
        .type = TabPagerDesktopModelTransition::Type::Reset,
        .countChanged = countChanged,
        .currentIndexChanged = currentIndexChanged,
        .rowChanges = {},
    };
  }

  QList<TabPagerDesktopRowsChange> rowChanges =
      m_rows.changesTo(nextState.m_rows);
  if (!currentIndexChanged && rowChanges.isEmpty()) {
    return TabPagerDesktopModelTransition{
        .nextState = std::move(nextState),
        .type = TabPagerDesktopModelTransition::Type::Unchanged,
        .countChanged = false,
        .currentIndexChanged = false,
        .rowChanges = {},
    };
  }

  return TabPagerDesktopModelTransition{
      .nextState = std::move(nextState),
      .type = TabPagerDesktopModelTransition::Type::RowsChanged,
      .countChanged = false,
      .currentIndexChanged = currentIndexChanged,
      .rowChanges = std::move(rowChanges),
  };
}
