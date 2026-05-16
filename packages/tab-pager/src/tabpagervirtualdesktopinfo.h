// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QObject>
#include <QStringList>
#include <QVariant>
#include <QVariantList>

#include <memory>

class TabPagerVirtualDesktopInfo : public QObject {
  Q_OBJECT

public:
  explicit TabPagerVirtualDesktopInfo(QObject *parent = nullptr);
  ~TabPagerVirtualDesktopInfo() override;

  [[nodiscard]] virtual QVariantList desktopIds() const = 0;
  [[nodiscard]] virtual QStringList desktopNames() const = 0;
  [[nodiscard]] virtual QVariant currentDesktop() const = 0;
  [[nodiscard]] virtual bool navigationWrappingAround() const = 0;
  virtual void requestActivate(const QVariant &desktopId) = 0;

Q_SIGNALS:
  void desktopIdsChanged();
  void desktopNamesChanged();
  void numberOfDesktopsChanged();
  void currentDesktopChanged();
  void navigationWrappingAroundChanged();
};

[[nodiscard]] std::unique_ptr<TabPagerVirtualDesktopInfo>
createTaskManagerVirtualDesktopInfo();
