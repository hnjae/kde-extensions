// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopmodelstate.h"

#include <QAbstractListModel>
#include <QFont>
#include <QVariant>

#include <optional>

class TabPagerDesktopModel : public QAbstractListModel {
  Q_OBJECT
  Q_PROPERTY(int count READ count NOTIFY countChanged)
  Q_PROPERTY(int currentIndex READ currentIndex NOTIFY currentIndexChanged)
  Q_PROPERTY(QFont labelFont READ labelFont CONSTANT)

public:
  explicit TabPagerDesktopModel(QObject *parent = nullptr);
  ~TabPagerDesktopModel() override;

  [[nodiscard]] int
  rowCount(const QModelIndex &parent = QModelIndex()) const override;
  [[nodiscard]] QVariant data(const QModelIndex &index,
                              int role = Qt::DisplayRole) const override;
  [[nodiscard]] QHash<int, QByteArray> roleNames() const override;

  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] QFont labelFont() const;

  void setDesktopSnapshot(TabPagerDesktopSnapshot snapshot);

Q_SIGNALS:
  void countChanged();
  void currentIndexChanged();

protected:
  [[nodiscard]] std::optional<TabPagerDesktopId>
  desktopIdForIndex(int index) const;

private:
  void resetDesktopState(TabPagerDesktopModelState nextState);
  void updateDesktopStateRows(TabPagerDesktopModelState nextState,
                              const QList<TabPagerDesktopRowsChange> &rows);

  TabPagerDesktopModelState m_state;
};
