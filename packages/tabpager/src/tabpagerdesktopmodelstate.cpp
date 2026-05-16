// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodelstate.h"

#include "tabpagerdesktoplogic.h"

#include <utility>

namespace {
[[nodiscard]] TabPagerDesktopRowData
rowDataForDesktop(qsizetype row, const TabPagerDesktop &desktop,
                  const TabPagerDesktopId &currentDesktop) {
  const int number = static_cast<int>(row + 1);
  return TabPagerDesktopRowData{
      .desktopId = desktop.id,
      .name = desktop.name,
      .label = TabPagerDesktopLogic::labelForDesktop(number, desktop.name),
      .number = number,
      .active = desktop.id.matches(currentDesktop),
  };
}
} // namespace

TabPagerDesktopModelState TabPagerDesktopModelState::fromSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelState state;
  state.m_rows.reserve(snapshot.desktops.size());

  for (qsizetype sourceRow = 0; sourceRow < snapshot.desktops.size();
       ++sourceRow) {
    const TabPagerDesktop &desktop = snapshot.desktops.at(sourceRow);
    if (!desktop.id.isValid()) {
      continue;
    }

    const TabPagerDesktopRowData rowData =
        rowDataForDesktop(sourceRow, desktop, snapshot.currentDesktop);
    if (rowData.active && state.m_currentIndex < 0) {
      state.m_currentIndex = static_cast<int>(state.m_rows.size());
    }

    state.m_rows.append(rowData);
  }

  return state;
}

TabPagerDesktopModelState::Update TabPagerDesktopModelState::updateForSnapshot(
    const TabPagerDesktopSnapshot &snapshot) const {
  TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(snapshot);
  const TabPagerDesktopModelChange change = changeForState(nextState);

  return TabPagerDesktopModelState::Update{
      .nextState = std::move(nextState),
      .change = change,
  };
}

int TabPagerDesktopModelState::count() const {
  return static_cast<int>(m_rows.size());
}

int TabPagerDesktopModelState::currentIndex() const { return m_currentIndex; }

std::optional<TabPagerDesktopId>
TabPagerDesktopModelState::desktopIdForIndex(int index) const {
  if (index < 0 || index >= m_rows.size()) {
    return std::nullopt;
  }

  const TabPagerDesktopId &desktopId = m_rows.at(index).desktopId;
  return desktopId;
}

TabPagerDesktopRowData TabPagerDesktopModelState::rowData(qsizetype row) const {
  return m_rows.at(row);
}

TabPagerDesktopModelChange TabPagerDesktopModelState::changeForState(
    const TabPagerDesktopModelState &nextState) const {
  return tabPagerDesktopModelChangeForRows(
      m_rows, m_currentIndex, nextState.m_rows, nextState.m_currentIndex);
}
