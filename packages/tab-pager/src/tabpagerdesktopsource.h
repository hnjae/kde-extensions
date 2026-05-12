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

class TabPagerDesktopSource : public QObject {
  Q_OBJECT

public:
  explicit TabPagerDesktopSource(QObject *parent = nullptr);
  ~TabPagerDesktopSource() override;

  [[nodiscard]] virtual QList<TabPagerDesktop> desktops() const = 0;
  [[nodiscard]] virtual QVariant currentDesktop() const = 0;
  [[nodiscard]] virtual bool navigationWrappingAround() const = 0;
  virtual void activateDesktop(const QVariant &desktopId) = 0;

Q_SIGNALS:
  void desktopsChanged();
  void currentDesktopChanged();
  void navigationWrappingAroundChanged();
};
