// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopmodel.h"
#include "tabpagerdesktopnavigator.h"
#include "tabpagerdesktopsource.h"

#include <memory>
#include <optional>

class TabPagerBackend : public TabPagerDesktopModel {
  Q_OBJECT
  Q_PROPERTY(QAbstractItemModel *model READ model CONSTANT)
  Q_PROPERTY(bool navigationWrappingAround READ navigationWrappingAround NOTIFY
                 navigationWrappingAroundChanged)

public:
  explicit TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                           QObject *parent = nullptr);
  ~TabPagerBackend() override;

  [[nodiscard]] QAbstractItemModel *model();
  [[nodiscard]] bool navigationWrappingAround() const;

  Q_INVOKABLE void activate(int index);
  Q_INVOKABLE void activateNext();
  Q_INVOKABLE void activatePrevious();
  Q_INVOKABLE void activateByWheelDelta(int delta);

Q_SIGNALS:
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

  std::unique_ptr<TabPagerDesktopSource> m_source;
  TabPagerDesktopNavigator m_navigator;
};
