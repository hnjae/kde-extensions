// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopmodel.h"
#include "tabpagerdesktopnavigator.h"
#include "tabpagerdesktopsource.h"

#include <QObject>

#include <memory>
#include <optional>

class TabPagerDesktopController final : public QObject {
  Q_OBJECT

public:
  explicit TabPagerDesktopController(
      std::unique_ptr<TabPagerDesktopSource> source,
      TabPagerDesktopModel &model, QObject *parent = nullptr);
  ~TabPagerDesktopController() override;

  [[nodiscard]] bool navigationWrappingAround() const;

  void activate(int index);
  void activateNext();
  void activatePrevious();
  void activateByWheelDelta(int delta);

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

  TabPagerDesktopModel &m_model;
  std::unique_ptr<TabPagerDesktopSource> m_source;
  TabPagerDesktopNavigator m_navigator;
};
