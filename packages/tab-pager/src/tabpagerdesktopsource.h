// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QList>
#include <QObject>
#include <QString>
#include <QVariant>

struct TabPagerDesktop {
  QVariant id;
  QString name;
};

[[nodiscard]] bool operator==(const TabPagerDesktop &left,
                              const TabPagerDesktop &right);

struct TabPagerDesktopSnapshot {
  QList<TabPagerDesktop> desktops;
  QVariant currentDesktop;
};

class TabPagerDesktopSource : public QObject {
  Q_OBJECT

public:
  explicit TabPagerDesktopSource(QObject *parent = nullptr);
  ~TabPagerDesktopSource() override;

  [[nodiscard]] virtual TabPagerDesktopSnapshot desktopSnapshot() const = 0;
  [[nodiscard]] virtual bool navigationWrappingAround() const = 0;
  virtual void activateDesktop(const QVariant &desktopId) = 0;

Q_SIGNALS:
  void desktopSnapshotChanged();
  void navigationWrappingAroundChanged();
};
