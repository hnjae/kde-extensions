// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopmodelstate.h"
#include "tabpagerdesktopstatestore.h"

#include <QAbstractListModel>
#include <QVariant>

#include <optional>

class TabPagerDesktopModel : public QAbstractListModel,
                             public TabPagerDesktopStateStore {
  Q_OBJECT
  Q_PROPERTY(int count READ count NOTIFY countChanged)
  Q_PROPERTY(int currentIndex READ currentIndex NOTIFY currentIndexChanged)

public:
  explicit TabPagerDesktopModel(QObject *parent = nullptr);
  ~TabPagerDesktopModel() override;

  [[nodiscard]] int
  rowCount(const QModelIndex &parent = QModelIndex()) const override;
  [[nodiscard]] QVariant data(const QModelIndex &index,
                              int role = Qt::DisplayRole) const override;
  [[nodiscard]] QHash<int, QByteArray> roleNames() const override;

  [[nodiscard]] int count() const override;
  [[nodiscard]] int currentIndex() const override;
  [[nodiscard]] std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const override;

  void setDesktopSnapshot(const TabPagerDesktopSnapshot &snapshot) override;

Q_SIGNALS:
  void countChanged();
  void currentIndexChanged();

private:
  void resetDesktopState(TabPagerDesktopModelState nextState);
  void updateDesktopStateRows(TabPagerDesktopModelState nextState,
                              const QList<TabPagerDesktopRowsChange> &rows);

  TabPagerDesktopModelState m_state;
};
