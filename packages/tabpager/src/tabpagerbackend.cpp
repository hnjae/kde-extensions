// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QFontDatabase>

#include <cassert>
#include <optional>
#include <utility>

TabPagerBackend::TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                                 QObject *parent)
    : QAbstractListModel(parent), m_source(std::move(source)) {
  initializeSource();
}

TabPagerBackend::~TabPagerBackend() = default;

int TabPagerBackend::rowCount(const QModelIndex &parent) const {
  if (parent.isValid()) {
    return 0;
  }

  return count();
}

QVariant TabPagerBackend::data(const QModelIndex &index, int role) const {
  if (!index.isValid() || index.row() < 0 || index.row() >= m_state.count()) {
    return {};
  }

  const TabPagerDesktopRowData rowData = m_state.rowData(index.row());
  return tabPagerDesktopRowDataForRole(rowData, role);
}

QHash<int, QByteArray> TabPagerBackend::roleNames() const {
  return tabPagerDesktopRowRoleNames();
}

int TabPagerBackend::count() const { return m_state.count(); }

int TabPagerBackend::currentIndex() const { return m_state.currentIndex(); }

bool TabPagerBackend::navigationWrappingAround() const {
  return m_navigator.navigationWrappingAround();
}

QFont TabPagerBackend::labelFont() const {
  return QFontDatabase::systemFont(QFontDatabase::FixedFont);
}

void TabPagerBackend::activate(int index) {
  const std::optional<TabPagerDesktopId> desktopId =
      m_state.desktopIdForIndex(index);
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
  reloadDesktopSnapshot();
  reloadNavigationWrappingAround();
}

void TabPagerBackend::connectSource() {
  connect(m_source.get(), &TabPagerDesktopSource::desktopSnapshotChanged, this,
          &TabPagerBackend::reloadDesktopSnapshot);
  connect(m_source.get(),
          &TabPagerDesktopSource::navigationWrappingAroundChanged, this,
          &TabPagerBackend::reloadNavigationWrappingAround);
}

void TabPagerBackend::reloadDesktopSnapshot() {
  applyDesktopSnapshot(m_source->desktopSnapshot());
}

void TabPagerBackend::reloadNavigationWrappingAround() {
  const bool nextNavigationWrappingAround =
      m_source->navigationWrappingAround();

  if (m_navigator.navigationWrappingAround() == nextNavigationWrappingAround) {
    return;
  }

  m_navigator.setNavigationWrappingAround(nextNavigationWrappingAround);
  Q_EMIT navigationWrappingAroundChanged();
}

void TabPagerBackend::applyDesktopSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelState::Update update =
      m_state.updateForSnapshot(snapshot);
  const TabPagerDesktopModelChange &change = update.change;

  switch (change.type) {
  case TabPagerDesktopModelChange::Type::Unchanged:
    return;
  case TabPagerDesktopModelChange::Type::Reset:
    resetDesktopState(std::move(update.nextState));
    break;
  case TabPagerDesktopModelChange::Type::RowsChanged:
    updateDesktopStateRows(std::move(update.nextState), change.rows);
    break;
  }

  if (change.countChanged) {
    Q_EMIT countChanged();
  }

  if (change.currentIndexChanged) {
    Q_EMIT currentIndexChanged();
  }
}

void TabPagerBackend::resetDesktopState(TabPagerDesktopModelState nextState) {
  beginResetModel();
  m_state = std::move(nextState);
  endResetModel();
}

void TabPagerBackend::updateDesktopStateRows(
    TabPagerDesktopModelState nextState,
    const QList<TabPagerDesktopRowUpdate> &rows) {
  m_state = std::move(nextState);

  for (const TabPagerDesktopRowUpdate &rowUpdate : rows) {
    const QModelIndex firstChangedIndex =
        index(static_cast<int>(rowUpdate.firstRow));
    const QModelIndex lastChangedIndex =
        index(static_cast<int>(rowUpdate.lastRow));
    Q_EMIT dataChanged(firstChangedIndex, lastChangedIndex, rowUpdate.roles);
  }
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
