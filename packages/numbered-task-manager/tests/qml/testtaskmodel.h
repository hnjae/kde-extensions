// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QAbstractListModel>
#include <QPersistentModelIndex>
#include <QVariantMap>

class TestTaskModel : public QAbstractListModel {
  Q_OBJECT
  Q_PROPERTY(QVariantList launcherList READ launcherList WRITE setLauncherList
                 NOTIFY launcherListChanged)
  Q_PROPERTY(QVariant lastActivatedIndex READ lastActivatedIndex NOTIFY
                 lastActivatedIndexChanged)

public:
  explicit TestTaskModel(QObject *parent = nullptr);

  Q_INVOKABLE int rowCount(const QModelIndex &parent = {}) const override;
  QVariant data(const QModelIndex &index, int role) const override;
  QHash<int, QByteArray> roleNames() const override;

  QVariantList launcherList() const;
  void setLauncherList(const QVariantList &launchers);
  QVariant lastActivatedIndex() const;

  Q_INVOKABLE void appendRow(const QVariantMap &row);
  Q_INVOKABLE void changeRow(int row, const QVariantMap &values);
  Q_INVOKABLE QVariant makePersistentModelIndex(int row) const;
  Q_INVOKABLE void removeRow(int row);
  Q_INVOKABLE void requestActivate(const QVariant &index);

Q_SIGNALS:
  void launcherListChanged();
  void lastActivatedIndexChanged();

private:
  QList<QVariantMap> m_rows;
  QVariantList m_launcherList;
  QVariant m_lastActivatedIndex;
  QHash<int, QByteArray> m_roles;
};
