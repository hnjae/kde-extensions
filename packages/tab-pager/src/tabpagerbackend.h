// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopmodelstate.h"
#include "tabpagerdesktopnavigator.h"
#include "tabpagerdesktopsource.h"

#include <QAbstractListModel>
#include <QFont>
#include <QVariant>

#include <memory>

class TabPagerBackend : public QAbstractListModel {
  Q_OBJECT
  Q_PROPERTY(int count READ count NOTIFY countChanged)
  Q_PROPERTY(int currentIndex READ currentIndex NOTIFY currentIndexChanged)
  Q_PROPERTY(bool navigationWrappingAround READ navigationWrappingAround NOTIFY
                 navigationWrappingAroundChanged)
  Q_PROPERTY(QFont labelFont READ labelFont CONSTANT)

public:
  explicit TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                           QObject *parent = nullptr);
  ~TabPagerBackend() override;

  [[nodiscard]] int
  rowCount(const QModelIndex &parent = QModelIndex()) const override;
  [[nodiscard]] QVariant data(const QModelIndex &index,
                              int role = Qt::DisplayRole) const override;
  [[nodiscard]] QHash<int, QByteArray> roleNames() const override;

  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] bool navigationWrappingAround() const;
  [[nodiscard]] QFont labelFont() const;

  Q_INVOKABLE void activate(int index);
  Q_INVOKABLE void activateNext();
  Q_INVOKABLE void activatePrevious();
  Q_INVOKABLE void activateByWheelDelta(int delta);

Q_SIGNALS:
  void countChanged();
  void currentIndexChanged();
  void navigationWrappingAroundChanged();

private:
  void initializeSource();
  void connectSource();
  void reloadDesktopSnapshot();
  void reloadNavigationWrappingAround();
  void applyDesktopSnapshot(const TabPagerDesktopSnapshot &snapshot);
  void resetDesktopState(TabPagerDesktopModelState nextState);
  void updateDesktopStateRows(TabPagerDesktopModelState nextState,
                              const QList<TabPagerDesktopRowUpdate> &rows);
  [[nodiscard]] TabPagerDesktopNavigationContext navigationContext() const;
  void activateNavigationTarget(int targetIndex);
  void activateOffset(int offset);

  std::unique_ptr<TabPagerDesktopSource> m_source;
  TabPagerDesktopModelState m_state;
  TabPagerDesktopNavigator m_navigator;
};
