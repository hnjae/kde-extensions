// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerplugin.h"

#include "tabpagerqmlbackend.h"

#include <QQmlEngine>
#include <QtGlobal>

void TabPagerPlugin::registerTypes(const char *uri) {
  const QByteArrayView actualUri(uri != nullptr ? uri : "");
  if (actualUri != QByteArrayView(TABPAGER_QML_URI)) {
    qFatal("TabPagerPlugin registered with unexpected QML URI: expected '%s', "
           "actual '%s'",
           TABPAGER_QML_URI, uri != nullptr ? uri : "<null>");
  }

  qmlRegisterType<TabPagerQmlBackend>(uri, 1, 0, "TabPagerBackend");
}
