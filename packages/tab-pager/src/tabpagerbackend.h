// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QObject>
#include <QString>

class TabPagerBackend : public QObject {
  Q_OBJECT
  Q_PROPERTY(QString greeting READ greeting CONSTANT)
  Q_PROPERTY(QString pluginId READ pluginId CONSTANT)

public:
  explicit TabPagerBackend(QObject *parent = nullptr);

  [[nodiscard]] QString greeting() const;
  [[nodiscard]] QString pluginId() const;

  Q_INVOKABLE [[nodiscard]] QString greetingFor(const QString &target) const;
};
