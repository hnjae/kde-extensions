// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopcontroller.h"

#include <QFont>
#include <QObject>

#include <memory>

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
  TabPagerDesktopModel m_model;
  TabPagerDesktopController m_controller;
};
