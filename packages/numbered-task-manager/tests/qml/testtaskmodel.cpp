// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "testtaskmodel.h"

#include <QMetaType>

TestTaskModel::TestTaskModel(QObject *parent) : QAbstractListModel(parent) {
  const QList<QByteArray> roles = {"Activities",
                                   "AppName",
                                   "CanLaunchNewInstance",
                                   "CanSetNoBorder",
                                   "HasNoBorder",
                                   "IsActive",
                                   "IsClosable",
                                   "IsDemandingAttention",
                                   "IsExcludedFromCapture",
                                   "IsFullScreen",
                                   "IsFullScreenable",
                                   "IsKeepAbove",
                                   "IsKeepBelow",
                                   "IsLauncher",
                                   "IsMaximizable",
                                   "IsMaximized",
                                   "IsMinimizable",
                                   "IsMinimized",
                                   "IsMovable",
                                   "IsOnAllVirtualDesktops",
                                   "IsResizable",
                                   "IsShadeable",
                                   "IsShaded",
                                   "IsStartup",
                                   "IsVirtualDesktopsChangeable",
                                   "IsWindow",
                                   "LauncherUrl",
                                   "LauncherUrlWithoutIcon",
                                   "VirtualDesktops",
                                   "WinIdList",
                                   "decoration",
                                   "display"};
  for (int index = 0; index < static_cast<int>(roles.size()); ++index) {
    m_roles.insert(Qt::UserRole + index + 1, roles.at(index));
  }
}

int TestTaskModel::rowCount(const QModelIndex &parent) const {
  return parent.isValid() ? 0 : static_cast<int>(m_rows.size());
}

QVariant TestTaskModel::data(const QModelIndex &index, int role) const {
  if (!index.isValid() || index.row() < 0 ||
      index.row() >= static_cast<int>(m_rows.size())) {
    return {};
  }
  return m_rows.at(index.row()).value(QString::fromUtf8(m_roles.value(role)));
}

QHash<int, QByteArray> TestTaskModel::roleNames() const { return m_roles; }
QVariantList TestTaskModel::launcherList() const { return m_launcherList; }
QVariant TestTaskModel::lastActivatedIndex() const {
  return m_lastActivatedIndex;
}

void TestTaskModel::setLauncherList(const QVariantList &launchers) {
  if (m_launcherList == launchers) {
    return;
  }
  m_launcherList = launchers;
  Q_EMIT launcherListChanged();
}

void TestTaskModel::appendRow(const QVariantMap &row) {
  const int insertionRow = static_cast<int>(m_rows.size());
  beginInsertRows({}, insertionRow, insertionRow);
  m_rows.append(row);
  endInsertRows();
}

void TestTaskModel::changeRow(int row, const QVariantMap &values) {
  if (row < 0 || row >= static_cast<int>(m_rows.size())) {
    return;
  }
  for (auto it = values.cbegin(); it != values.cend(); ++it) {
    m_rows[row].insert(it.key(), it.value());
  }
  Q_EMIT dataChanged(index(row), index(row), m_roles.keys());
}

QVariant TestTaskModel::makePersistentModelIndex(int row) const {
  return QVariant::fromValue(QPersistentModelIndex(index(row)));
}

void TestTaskModel::removeRow(int row) {
  if (row < 0 || row >= static_cast<int>(m_rows.size())) {
    return;
  }
  beginRemoveRows({}, row, row);
  m_rows.removeAt(row);
  endRemoveRows();
}

void TestTaskModel::requestActivate(const QVariant &index) {
  m_lastActivatedIndex = index;
  Q_EMIT lastActivatedIndexChanged();
}
