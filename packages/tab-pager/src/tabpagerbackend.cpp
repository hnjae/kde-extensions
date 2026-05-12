// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include "tabpagerdesktoplogic.h"

#include <QFontDatabase>

#include <array>
#include <cassert>
#include <utility>

namespace {
struct RoleDefinition {
  TabPagerBackend::Role role;
  const char *name;
  QVariant (*value)(const TabPagerDesktopRowData &rowData);
};

constexpr std::array<RoleDefinition, 5> roleDefinitions{{
    {TabPagerBackend::DesktopIdRole, "desktopId",
     +[](const TabPagerDesktopRowData &rowData) -> QVariant {
       return rowData.desktopId;
     }},
    {TabPagerBackend::NameRole, "name",
     +[](const TabPagerDesktopRowData &rowData) -> QVariant {
       return rowData.name;
     }},
    {TabPagerBackend::LabelRole, "label",
     +[](const TabPagerDesktopRowData &rowData) -> QVariant {
       return rowData.label;
     }},
    {TabPagerBackend::NumberRole, "number",
     +[](const TabPagerDesktopRowData &rowData) -> QVariant {
       return rowData.number;
     }},
    {TabPagerBackend::ActiveRole, "active",
     +[](const TabPagerDesktopRowData &rowData) -> QVariant {
       return rowData.active;
     }},
}};

[[nodiscard]] const RoleDefinition *roleDefinitionFor(int role) {
  for (const RoleDefinition &definition : roleDefinitions) {
    if (definition.role == role) {
      return &definition;
    }
  }

  return nullptr;
}
} // namespace

QList<int> TabPagerBackend::changedRolesForRow(
    qsizetype row, const TabPagerDesktopSnapshot &previousSnapshot,
    const TabPagerDesktopSnapshot &nextSnapshot) {
  const TabPagerDesktopRowData previousRow = TabPagerDesktopModelState::rowData(
      row, previousSnapshot.desktops.at(row), previousSnapshot.currentDesktop);
  const TabPagerDesktopRowData nextRow = TabPagerDesktopModelState::rowData(
      row, nextSnapshot.desktops.at(row), nextSnapshot.currentDesktop);
  QList<int> roles;

  for (const RoleDefinition &definition : roleDefinitions) {
    if (definition.value(previousRow) != definition.value(nextRow)) {
      roles.append(static_cast<int>(definition.role));
    }
  }

  return roles;
}

TabPagerBackend::TabPagerBackend(TabPagerDesktopSource *source, QObject *parent)
    : QAbstractListModel(parent), m_source(source) {
  initializeSource();
}

TabPagerBackend::TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                                 QObject *parent)
    : QAbstractListModel(parent), m_ownedSource(std::move(source)),
      m_source(m_ownedSource.get()) {
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
  const RoleDefinition *definition = roleDefinitionFor(role);
  if (definition == nullptr) {
    return {};
  }

  return definition->value(rowData);
}

QHash<int, QByteArray> TabPagerBackend::roleNames() const {
  QHash<int, QByteArray> names;
  names.reserve(static_cast<qsizetype>(roleDefinitions.size()));

  for (const RoleDefinition &definition : roleDefinitions) {
    names.insert(static_cast<int>(definition.role), definition.name);
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
  reloadDesktops();
  reloadNavigationWrappingAround();
}

void TabPagerBackend::connectSource() {
  connect(m_source, &TabPagerDesktopSource::desktopsChanged, this,
          &TabPagerBackend::reloadDesktops);
  connect(m_source, &TabPagerDesktopSource::currentDesktopChanged, this,
          &TabPagerBackend::reloadCurrentDesktop);
  connect(m_source, &TabPagerDesktopSource::navigationWrappingAroundChanged,
          this, &TabPagerBackend::reloadNavigationWrappingAround);
}

void TabPagerBackend::reloadDesktops() {
  applyDesktopSnapshot(sourceDesktopSnapshot());
}

void TabPagerBackend::reloadCurrentDesktop() {
  TabPagerDesktopSnapshot snapshot = m_state.snapshot();
  snapshot.currentDesktop = m_source->currentDesktop();
  applyDesktopSnapshot(snapshot);
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

TabPagerDesktopSnapshot TabPagerBackend::sourceDesktopSnapshot() const {
  return TabPagerDesktopSnapshot{
      .desktops = m_source->desktops(),
      .currentDesktop = m_source->currentDesktop(),
  };
}

void TabPagerBackend::applyDesktopSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  const TabPagerDesktopSnapshot previousSnapshot = m_state.snapshot();
  if (TabPagerDesktopModelState::sameSnapshot(previousSnapshot, snapshot)) {
    return;
  }

  const int previousCount = count();
  const int previousCurrentIndex = currentIndex();

  if (previousCount != snapshot.desktops.size()) {
    resetDesktopSnapshot(snapshot);
  } else {
    updateDesktopSnapshotRows(previousSnapshot, snapshot);
  }

  if (previousCount != count()) {
    Q_EMIT countChanged();
  }

  if (previousCurrentIndex != currentIndex()) {
    Q_EMIT currentIndexChanged();
  }
}

void TabPagerBackend::resetDesktopSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  beginResetModel();
  m_state.setSnapshot(snapshot);
  endResetModel();
}

void TabPagerBackend::updateDesktopSnapshotRows(
    const TabPagerDesktopSnapshot &previousSnapshot,
    const TabPagerDesktopSnapshot &nextSnapshot) {
  m_state.setSnapshot(nextSnapshot);

  for (qsizetype row = 0; row < m_state.count(); ++row) {
    const QList<int> roles =
        changedRolesForRow(row, previousSnapshot, nextSnapshot);
    if (!roles.isEmpty()) {
      const QModelIndex changedIndex = index(static_cast<int>(row));
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
