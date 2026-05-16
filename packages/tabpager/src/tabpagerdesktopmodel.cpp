// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopmodel.h"

#include <QFontDatabase>

#include <utility>

TabPagerDesktopModel::TabPagerDesktopModel(QObject *parent)
    : QAbstractListModel(parent) {}

TabPagerDesktopModel::~TabPagerDesktopModel() = default;

int TabPagerDesktopModel::rowCount(const QModelIndex &parent) const {
  if (parent.isValid()) {
    return 0;
  }

  return count();
}

QVariant TabPagerDesktopModel::data(const QModelIndex &index, int role) const {
  if (!index.isValid() || index.row() < 0 || index.row() >= m_state.count()) {
    return {};
  }

  const TabPagerDesktopRowData rowData = m_state.rowData(index.row());
  return tabPagerDesktopRowDataForRole(rowData, role);
}

QHash<int, QByteArray> TabPagerDesktopModel::roleNames() const {
  return tabPagerDesktopRowRoleNames();
}

int TabPagerDesktopModel::count() const { return m_state.count(); }

int TabPagerDesktopModel::currentIndex() const {
  return m_state.currentIndex();
}

QFont TabPagerDesktopModel::labelFont() const {
  return QFontDatabase::systemFont(QFontDatabase::FixedFont);
}

void TabPagerDesktopModel::setDesktopSnapshot(
    const TabPagerDesktopSnapshot &snapshot) {
  TabPagerDesktopModelTransition transition =
      m_state.transitionToSnapshot(snapshot);
  const bool shouldEmitCountChanged = transition.countChanged;
  const bool shouldEmitCurrentIndexChanged = transition.currentIndexChanged;

  switch (transition.type) {
  case TabPagerDesktopModelTransition::Type::Unchanged:
    return;
  case TabPagerDesktopModelTransition::Type::Reset:
    resetDesktopState(std::move(transition.nextState));
    break;
  case TabPagerDesktopModelTransition::Type::RowsChanged:
    updateDesktopStateRows(std::move(transition.nextState), transition.rows);
    break;
  }

  if (shouldEmitCountChanged) {
    Q_EMIT countChanged();
  }

  if (shouldEmitCurrentIndexChanged) {
    Q_EMIT currentIndexChanged();
  }
}

std::optional<TabPagerDesktopId>
TabPagerDesktopModel::desktopIdForIndex(int index) const {
  return m_state.desktopIdForIndex(index);
}

void TabPagerDesktopModel::resetDesktopState(
    TabPagerDesktopModelState nextState) {
  beginResetModel();
  m_state = std::move(nextState);
  endResetModel();
}

void TabPagerDesktopModel::updateDesktopStateRows(
    TabPagerDesktopModelState nextState,
    const QList<TabPagerDesktopModelRowUpdate> &rows) {
  m_state = std::move(nextState);

  for (const TabPagerDesktopModelRowUpdate &rowUpdate : rows) {
    const QModelIndex firstChangedIndex =
        index(static_cast<int>(rowUpdate.firstRow));
    const QModelIndex lastChangedIndex =
        index(static_cast<int>(rowUpdate.lastRow));
    Q_EMIT dataChanged(firstChangedIndex, lastChangedIndex, rowUpdate.roles);
  }
}
