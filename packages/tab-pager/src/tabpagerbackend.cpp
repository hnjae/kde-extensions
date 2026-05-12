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
    {
        .role = TabPagerBackend::DesktopIdRole,
        .name = "desktopId",
        .value = +[](const TabPagerDesktopRowData &rowData) -> QVariant {
          return rowData.desktopId;
        },
    },
    {
        .role = TabPagerBackend::NameRole,
        .name = "name",
        .value = +[](const TabPagerDesktopRowData &rowData) -> QVariant {
          return rowData.name;
        },
    },
    {
        .role = TabPagerBackend::LabelRole,
        .name = "label",
        .value = +[](const TabPagerDesktopRowData &rowData) -> QVariant {
          return rowData.label;
        },
    },
    {
        .role = TabPagerBackend::NumberRole,
        .name = "number",
        .value = +[](const TabPagerDesktopRowData &rowData) -> QVariant {
          return rowData.number;
        },
    },
    {
        .role = TabPagerBackend::ActiveRole,
        .name = "active",
        .value = +[](const TabPagerDesktopRowData &rowData) -> QVariant {
          return rowData.active;
        },
    },
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

QList<int>
TabPagerBackend::changedRolesForRow(const TabPagerDesktopRowChange &rowChange) {
  QList<int> roles;

  for (const RoleDefinition &definition : roleDefinitions) {
    if (definition.value(rowChange.previousRow) !=
        definition.value(rowChange.nextRow)) {
      roles.append(static_cast<int>(definition.role));
    }
  }

  return roles;
}

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
  connect(m_source.get(), &TabPagerDesktopSource::desktopsChanged, this,
          &TabPagerBackend::reloadDesktops);
  connect(m_source.get(), &TabPagerDesktopSource::currentDesktopChanged, this,
          &TabPagerBackend::reloadCurrentDesktop);
  connect(m_source.get(),
          &TabPagerDesktopSource::navigationWrappingAroundChanged, this,
          &TabPagerBackend::reloadNavigationWrappingAround);
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
  TabPagerDesktopModelState nextState =
      TabPagerDesktopModelState::fromSnapshot(snapshot);
  const TabPagerDesktopSnapshotChange change =
      m_state.changeForState(nextState);
  if (change.operation == TabPagerDesktopSnapshotChange::Operation::None) {
    return;
  }

  if (change.operation == TabPagerDesktopSnapshotChange::Operation::Reset) {
    resetDesktopState(std::move(nextState));
  } else {
    updateDesktopStateRows(std::move(nextState), change.rowChanges);
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
    const QList<TabPagerDesktopRowChange> &rows) {
  m_state = std::move(nextState);

  for (const TabPagerDesktopRowChange &rowChange : rows) {
    const QList<int> roles = changedRolesForRow(rowChange);
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
