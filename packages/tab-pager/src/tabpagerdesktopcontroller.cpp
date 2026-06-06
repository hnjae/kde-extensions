// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopcontroller.h"

#include <cassert>
#include <optional>
#include <utility>

TabPagerDesktopController::TabPagerDesktopController(
    std::unique_ptr<TabPagerDesktopSource> source, TabPagerDesktopModel &model,
    QObject *parent)
    : QObject(parent), m_model(model), m_source(std::move(source)) {
  initializeSource();
}

TabPagerDesktopController::~TabPagerDesktopController() = default;

bool TabPagerDesktopController::navigationWrappingAround() const {
  return m_navigator.navigationWrappingAround();
}

void TabPagerDesktopController::activate(int index) {
  const std::optional<TabPagerDesktopId> desktopId =
      m_model.desktopIdForIndex(index);
  if (!desktopId.has_value()) {
    return;
  }

  m_source->activateDesktop(*desktopId);
}

void TabPagerDesktopController::activateNext() { activateOffset(1); }

void TabPagerDesktopController::activatePrevious() { activateOffset(-1); }

void TabPagerDesktopController::activateByWheelDelta(int delta) {
  activateNavigationTarget(
      m_navigator.targetIndexForWheelDelta(navigationContext(), delta));
}

void TabPagerDesktopController::initializeSource() {
  assert(m_source != nullptr);
  connectSource();
  reloadSourceState();
}

void TabPagerDesktopController::connectSource() {
  connect(m_source.get(), &TabPagerDesktopSource::sourceStateChanged, this,
          &TabPagerDesktopController::reloadSourceState);
}

void TabPagerDesktopController::reloadSourceState() {
  applySourceState(m_source->sourceState());
}

void TabPagerDesktopController::applySourceState(
    const TabPagerDesktopSourceState &state) {
  m_model.setDesktopSnapshot(state.desktopSnapshot);
  applyNavigationWrappingAround(state.navigationWrappingAround);
}

void TabPagerDesktopController::applyNavigationWrappingAround(
    bool navigationWrappingAround) {
  if (m_navigator.navigationWrappingAround() == navigationWrappingAround) {
    return;
  }

  m_navigator.setNavigationWrappingAround(navigationWrappingAround);
  Q_EMIT navigationWrappingAroundChanged();
}

TabPagerDesktopNavigationContext
TabPagerDesktopController::navigationContext() const {
  return TabPagerDesktopNavigationContext{
      .currentIndex = m_model.currentIndex(),
      .desktopCount = m_model.count(),
  };
}

void TabPagerDesktopController::activateNavigationTarget(
    std::optional<int> targetIndex) {
  if (targetIndex.has_value()) {
    activate(*targetIndex);
  }
}

void TabPagerDesktopController::activateOffset(int offset) {
  activateNavigationTarget(
      m_navigator.targetIndexForOffset(navigationContext(), offset));
}
