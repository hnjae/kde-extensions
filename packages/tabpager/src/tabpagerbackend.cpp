// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <cassert>
#include <optional>
#include <utility>

TabPagerBackend::TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                                 QObject *parent)
    : TabPagerDesktopModel(parent), m_source(std::move(source)) {
  initializeSource();
}

TabPagerBackend::~TabPagerBackend() = default;

bool TabPagerBackend::navigationWrappingAround() const {
  return m_navigator.navigationWrappingAround();
}

void TabPagerBackend::activate(int index) {
  const std::optional<TabPagerDesktopId> desktopId = desktopIdForIndex(index);
  if (!desktopId.has_value()) {
    return;
  }

  m_source->activateDesktop(*desktopId);
}

void TabPagerBackend::activateNext() { activateOffset(1); }

void TabPagerBackend::activatePrevious() { activateOffset(-1); }

void TabPagerBackend::activateByWheelDelta(int delta) {
  activateNavigationTarget(
      m_navigator.targetIndexForWheelDelta(navigationContext(), delta));
}

void TabPagerBackend::initializeSource() {
  assert(m_source != nullptr);
  connectSource();
  reloadSourceState();
}

void TabPagerBackend::connectSource() {
  connect(m_source.get(), &TabPagerDesktopSource::sourceStateChanged, this,
          &TabPagerBackend::reloadSourceState);
}

void TabPagerBackend::reloadSourceState() {
  applySourceState(m_source->sourceState());
}

void TabPagerBackend::applySourceState(
    const TabPagerDesktopSourceState &state) {
  setDesktopSnapshot(state.desktopSnapshot);
  applyNavigationWrappingAround(state.navigationWrappingAround);
}

void TabPagerBackend::applyNavigationWrappingAround(
    bool navigationWrappingAround) {
  if (m_navigator.navigationWrappingAround() == navigationWrappingAround) {
    return;
  }

  m_navigator.setNavigationWrappingAround(navigationWrappingAround);
  Q_EMIT navigationWrappingAroundChanged();
}

TabPagerDesktopNavigationContext TabPagerBackend::navigationContext() const {
  return TabPagerDesktopNavigationContext{
      .currentIndex = currentIndex(),
      .desktopCount = count(),
  };
}

void TabPagerBackend::activateNavigationTarget(std::optional<int> targetIndex) {
  if (targetIndex.has_value()) {
    activate(*targetIndex);
  }
}

void TabPagerBackend::activateOffset(int offset) {
  activateNavigationTarget(
      m_navigator.targetIndexForOffset(navigationContext(), offset));
}
