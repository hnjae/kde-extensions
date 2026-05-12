// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopid.h"

#include <QList>
#include <QObject>
#include <QString>

struct TabPagerDesktop {
  TabPagerDesktopId id;
  QString name;
};

struct TabPagerDesktopSnapshot {
  QList<TabPagerDesktop> desktops;
  TabPagerDesktopId currentDesktop;
};

class TabPagerDesktopSource : public QObject {
  Q_OBJECT

public:
  explicit TabPagerDesktopSource(QObject *parent = nullptr);
  ~TabPagerDesktopSource() override;

  [[nodiscard]] virtual TabPagerDesktopSnapshot desktopSnapshot() const = 0;
  [[nodiscard]] virtual bool navigationWrappingAround() const = 0;
  virtual void activateDesktop(const TabPagerDesktopId &desktopId) = 0;

Q_SIGNALS:
  void desktopSnapshotChanged();
  void navigationWrappingAroundChanged();
};
