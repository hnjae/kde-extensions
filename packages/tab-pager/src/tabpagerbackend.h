// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopmodel.h"
#include "tabpagerdesktopnavigator.h"
#include "tabpagerdesktopsource.h"

#include <QFont>
#include <QObject>

#include <memory>
#include <optional>

class TabPagerBackend : public QObject {
  Q_OBJECT
  Q_PROPERTY(QAbstractItemModel *model READ model CONSTANT)
  Q_PROPERTY(int count READ count NOTIFY countChanged)
  Q_PROPERTY(int currentIndex READ currentIndex NOTIFY currentIndexChanged)
  Q_PROPERTY(QFont labelFont READ labelFont CONSTANT)
  Q_PROPERTY(bool navigationWrappingAround READ navigationWrappingAround NOTIFY
                 navigationWrappingAroundChanged)

public:
  explicit TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                           QObject *parent = nullptr);
  ~TabPagerBackend() override;

  [[nodiscard]] QAbstractItemModel *model();
  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] QFont labelFont() const;
  [[nodiscard]] bool navigationWrappingAround() const;

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
  void reloadSourceState();
  void applySourceState(const TabPagerDesktopSourceState &state);
  void applyNavigationWrappingAround(bool navigationWrappingAround);
  [[nodiscard]] TabPagerDesktopNavigationContext navigationContext() const;
  void activateNavigationTarget(std::optional<int> targetIndex);
  void activateOffset(int offset);

  TabPagerDesktopModel m_model;
  std::unique_ptr<TabPagerDesktopSource> m_source;
  TabPagerDesktopNavigator m_navigator;
};
