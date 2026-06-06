// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopcontroller.h"

#include "tabpagerlogging.h"

#include <cassert>
#include <optional>
#include <utility>

namespace {
void logUnexpectedActivationNoOp(TabPagerActivationResult result, int index) {
  switch (result) {
  case TabPagerActivationResult::InvalidIndex:
    qCWarning(tabPagerLog).nospace()
        << "Ignoring desktop activation for invalid index " << index;
    break;
  case TabPagerActivationResult::InvalidDesktopId:
    qCWarning(tabPagerLog).nospace()
        << "Ignoring desktop activation for invalid desktop id at index "
        << index;
    break;
  case TabPagerActivationResult::Activated:
  case TabPagerActivationResult::NoCurrentDesktop:
  case TabPagerActivationResult::StoppedAtEdge:
  case TabPagerActivationResult::NoWheelStep:
    break;
  }
}
} // namespace

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
  const TabPagerActivationResult result = activateWithResult(index);
  logUnexpectedActivationNoOp(result, index);
}

TabPagerActivationResult
TabPagerDesktopController::activateWithResult(int index) {
  const std::optional<TabPagerDesktopId> desktopId =
      m_model.desktopIdForIndex(index);
  if (!desktopId.has_value()) {
    return TabPagerActivationResult::InvalidIndex;
  }

  if (!desktopId->isValid()) {
    return TabPagerActivationResult::InvalidDesktopId;
  }

  m_source->activateDesktop(*desktopId);
  return TabPagerActivationResult::Activated;
}

void TabPagerDesktopController::activateNext() {
  (void)activateNextWithResult();
}

TabPagerActivationResult TabPagerDesktopController::activateNextWithResult() {
  return activateOffsetWithResult(1);
}

void TabPagerDesktopController::activatePrevious() {
  (void)activatePreviousWithResult();
}

TabPagerActivationResult
TabPagerDesktopController::activatePreviousWithResult() {
  return activateOffsetWithResult(-1);
}

void TabPagerDesktopController::activateByWheelDelta(int delta) {
  (void)activateByWheelDeltaWithResult(delta);
}

TabPagerActivationResult
TabPagerDesktopController::activateByWheelDeltaWithResult(int delta) {
  return activateNavigationTarget(
      m_navigator.consumeWheelDelta(navigationContext(), delta));
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

TabPagerActivationResult TabPagerDesktopController::activateNavigationTarget(
    const TabPagerDesktopNavigationResult &target) {
  switch (target.type) {
  case TabPagerDesktopNavigationResultType::Target:
    return activateWithResult(target.targetIndex);
  case TabPagerDesktopNavigationResultType::NoCurrentDesktop:
    return TabPagerActivationResult::NoCurrentDesktop;
  case TabPagerDesktopNavigationResultType::StoppedAtEdge:
    return TabPagerActivationResult::StoppedAtEdge;
  case TabPagerDesktopNavigationResultType::NoWheelStep:
    return TabPagerActivationResult::NoWheelStep;
  }

  return TabPagerActivationResult::NoCurrentDesktop;
}

TabPagerActivationResult
TabPagerDesktopController::activateOffsetWithResult(int offset) {
  return activateNavigationTarget(
      m_navigator.targetForOffset(navigationContext(), offset));
}

void TabPagerDesktopController::activateOffset(int offset) {
  (void)activateOffsetWithResult(offset);
}
