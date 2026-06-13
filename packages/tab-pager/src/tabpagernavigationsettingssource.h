// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QObject>

class TabPagerNavigationSettingsSource : public QObject {
  Q_OBJECT

public:
  explicit TabPagerNavigationSettingsSource(QObject *parent = nullptr);
  ~TabPagerNavigationSettingsSource() override;

  [[nodiscard]] virtual bool navigationWrappingAround() const = 0;

Q_SIGNALS:
  void navigationWrappingAroundChanged();
};
