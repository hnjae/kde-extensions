// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QFontDatabase>

#include <cassert>
#include <optional>
#include <utility>

TabPagerBackend::TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                                 QObject *parent)
    : QObject(parent), m_source(std::move(source)) {
  connect(&m_model, &TabPagerDesktopModel::countChanged, this,
          &TabPagerBackend::countChanged);
  connect(&m_model, &TabPagerDesktopModel::currentIndexChanged, this,
          &TabPagerBackend::currentIndexChanged);
  initializeSource();
}

TabPagerBackend::~TabPagerBackend() = default;

QAbstractItemModel *TabPagerBackend::model() { return &m_model; }

int TabPagerBackend::count() const { return m_model.count(); }

int TabPagerBackend::currentIndex() const { return m_model.currentIndex(); }

QFont TabPagerBackend::labelFont() const {
  return QFontDatabase::systemFont(QFontDatabase::FixedFont);
}

bool TabPagerBackend::navigationWrappingAround() const {
  return m_navigator.navigationWrappingAround();
}

void TabPagerBackend::activate(int index) {
  const std::optional<TabPagerDesktopId> desktopId =
      m_model.desktopIdForIndex(index);
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
  m_model.setDesktopSnapshot(state.desktopSnapshot);
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
