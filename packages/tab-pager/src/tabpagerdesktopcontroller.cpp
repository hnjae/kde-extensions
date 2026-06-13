// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopcontroller.h"

#include "tabpagerlogging.h"

#include <QtGlobal>

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
  case TabPagerActivationResult::ActivationRequested:
  case TabPagerActivationResult::NoCurrentDesktop:
  case TabPagerActivationResult::StoppedAtEdge:
  case TabPagerActivationResult::NoWheelStep:
    break;
  }
}
} // namespace

TabPagerDesktopController::TabPagerDesktopController(
    std::unique_ptr<TabPagerDesktopSource> source,
    std::unique_ptr<TabPagerNavigationSettingsSource> navigationSettings,
    TabPagerDesktopStateStore &stateStore, QObject *parent)
    : QObject(parent), m_stateStore(stateStore), m_source(std::move(source)),
      m_navigationSettings(std::move(navigationSettings)) {
  initializeSource();
}

TabPagerDesktopController::~TabPagerDesktopController() = default;

bool TabPagerDesktopController::navigationWrappingAround() const {
  return m_navigator.navigationWrappingAround();
}

bool TabPagerDesktopController::sourceHasDiagnostics() const {
  return m_source->sourceHasDiagnostics();
}

void TabPagerDesktopController::activate(int index) {
  const TabPagerActivationResult result = activateWithResult(index);
  logUnexpectedActivationNoOp(result, index);
  Q_EMIT activationFinished(result);
}

TabPagerActivationResult
TabPagerDesktopController::activateWithResult(int index) {
  const TabPagerActivationPlan plan =
      tabPagerActivationPlanForIndex(m_stateStore.desktopIdForIndex(index));
  if (plan.desktopId.has_value()) {
    m_source->activateDesktop(*plan.desktopId);
  }

  return plan.result;
}

void TabPagerDesktopController::activateNext() {
  Q_EMIT activationFinished(activateNextWithResult());
}

TabPagerActivationResult TabPagerDesktopController::activateNextWithResult() {
  return activateOffsetWithResult(1);
}

void TabPagerDesktopController::activatePrevious() {
  Q_EMIT activationFinished(activatePreviousWithResult());
}

TabPagerActivationResult
TabPagerDesktopController::activatePreviousWithResult() {
  return activateOffsetWithResult(-1);
}

void TabPagerDesktopController::activateByWheelDelta(int delta) {
  Q_EMIT activationFinished(activateByWheelDeltaWithResult(delta));
}

TabPagerActivationResult
TabPagerDesktopController::activateByWheelDeltaWithResult(int delta) {
  const TabPagerWheelNavigationResult wheelResult =
      m_wheelNavigation.consumeDelta(delta);
  if (wheelResult.type == TabPagerWheelNavigationResultType::NoWheelStep) {
    return TabPagerActivationResult::NoWheelStep;
  }

  return activateOffsetWithResult(wheelResult.offset);
}

void TabPagerDesktopController::initializeSource() {
  if (m_source == nullptr) {
    qFatal("TabPagerDesktopController requires a non-null "
           "TabPagerDesktopSource");
  }
  if (m_navigationSettings == nullptr) {
    qFatal("TabPagerDesktopController requires a non-null "
           "TabPagerNavigationSettingsSource");
  }

  connectSource();
  reloadSourceState();
}

void TabPagerDesktopController::connectSource() {
  connect(m_source.get(), &TabPagerDesktopSource::sourceStateChanged, this,
          &TabPagerDesktopController::reloadSourceState);
  connect(m_source.get(), &TabPagerDesktopSource::sourceDiagnosticsChanged,
          this, &TabPagerDesktopController::sourceDiagnosticsChanged);
  connect(m_navigationSettings.get(),
          &TabPagerNavigationSettingsSource::navigationWrappingAroundChanged,
          this, [this]() {
            applyNavigationWrappingAround(
                m_navigationSettings->navigationWrappingAround());
          });
}

void TabPagerDesktopController::reloadSourceState() {
  applySourceState(m_source->sourceState());
}

void TabPagerDesktopController::applySourceState(
    const TabPagerDesktopSourceState &state) {
  m_stateStore.setDesktopSnapshot(state.desktopSnapshot);
  applyNavigationWrappingAround(
      m_navigationSettings->navigationWrappingAround());
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
      .currentIndex = m_stateStore.currentIndex(),
      .desktopCount = m_stateStore.count(),
  };
}

TabPagerActivationResult TabPagerDesktopController::activateNavigationTarget(
    const TabPagerDesktopNavigationResult &target) {
  const TabPagerActivationPlan plan = tabPagerActivationPlanForNavigationTarget(
      target, target.targetIndex >= 0
                  ? m_stateStore.desktopIdForIndex(target.targetIndex)
                  : std::optional<TabPagerDesktopId>{});
  if (plan.desktopId.has_value()) {
    m_source->activateDesktop(*plan.desktopId);
  }

  return plan.result;
}

TabPagerActivationResult
TabPagerDesktopController::activateOffsetWithResult(int offset) {
  return activateNavigationTarget(
      m_navigator.targetForOffset(navigationContext(), offset));
}
