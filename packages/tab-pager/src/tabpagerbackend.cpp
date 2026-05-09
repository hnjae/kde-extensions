// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

TabPagerBackend::TabPagerBackend(QObject *parent) : QObject(parent) {}

QString TabPagerBackend::greeting() const {
  return greetingFor(QStringLiteral("C++/QML"));
}

QString TabPagerBackend::pluginId() const {
  return QStringLiteral("io.github.hnjae.plasma.tabpager");
}

QString TabPagerBackend::greetingFor(const QString &target) const {
  const QString normalized = target.trimmed();

  if (normalized.isEmpty()) {
    return QStringLiteral("Hello from C++/QML");
  }

  return QStringLiteral("Hello from %1").arg(normalized);
}
