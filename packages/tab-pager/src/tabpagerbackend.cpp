// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include "tabpagerdesktoplogic.h"

#include <QFontDatabase>

#include <cassert>
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
  QHash<int, QByteArray> names;
  const std::span<const TabPagerDesktopRowRoleDefinition> definitions =
      tabPagerDesktopRowRoleDefinitions();
  names.reserve(static_cast<qsizetype>(definitions.size()));

  for (const TabPagerDesktopRowRoleDefinition &definition : definitions) {
    names.insert(definition.role, definition.name);
  }

  return names;
}

int TabPagerBackend::count() const { return m_state.count(); }

int TabPagerBackend::currentIndex() const { return m_state.currentIndex(); }

bool TabPagerBackend::navigationWrappingAround() const {
  return m_navigationWrappingAround;
}

QFont TabPagerBackend::labelFont() const {
  return QFontDatabase::systemFont(QFontDatabase::FixedFont);
}

void TabPagerBackend::activate(int index) {
  if (!m_state.hasDesktopAt(index)) {
    return;
  }

  m_source->activateDesktop(m_state.desktopIdAt(index));
}

void TabPagerBackend::activateNext() { activateOffset(1); }

void TabPagerBackend::activatePrevious() { activateOffset(-1); }

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

  if (m_navigationWrappingAround == nextNavigationWrappingAround) {
    return;
  }

  m_navigationWrappingAround = nextNavigationWrappingAround;
  Q_EMIT navigationWrappingAroundChanged();
}

void TabPagerBackend::applyDesktopSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(snapshot);
  const TabPagerDesktopSnapshotChange change =
      m_state.changeForState(nextState);
  if (change.isEmpty()) {
    return;
  }

  if (change.requiresModelReset()) {
    resetDesktopState(std::move(nextState));
  } else if (change.updatesRows()) {
    updateDesktopStateRows(std::move(nextState), change.rowChanges());
  }

  if (change.countChanged()) {
    Q_EMIT countChanged();
  }

  if (change.currentIndexChanged()) {
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
    const QList<TabPagerDesktopRowChange> &rows) {
  m_state = std::move(nextState);

  for (const TabPagerDesktopRowChange &rowChange : rows) {
    const QList<int> roles = tabPagerDesktopChangedRoles(rowChange);
    if (!roles.isEmpty()) {
      const QModelIndex changedIndex = index(static_cast<int>(rowChange.row));
      Q_EMIT dataChanged(changedIndex, changedIndex, roles);
    }
  }
}

void TabPagerBackend::activateOffset(int offset) {
  const TabPagerDesktopLogic::NavigationTargetRequest request{
      .currentIndex = currentIndex(),
      .desktopCount = count(),
      .offset = offset,
      .wrappingAround = m_navigationWrappingAround,
  };
  const int targetIndex = TabPagerDesktopLogic::targetIndexForOffset(request);
  if (targetIndex >= 0) {
    activate(targetIndex);
  }
}
