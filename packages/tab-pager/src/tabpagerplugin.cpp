// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerplugin.h"

#include "tabpagerbackend.h"

#include <QQmlEngine>
#include <QtGlobal>

void TabPagerPlugin::registerTypes(const char *uri) {
  Q_ASSERT(uri == QByteArrayView(TABPAGER_QML_URI));

  qmlRegisterType<TabPagerBackend>(uri, 1, 0, "TabPagerBackend");
}
