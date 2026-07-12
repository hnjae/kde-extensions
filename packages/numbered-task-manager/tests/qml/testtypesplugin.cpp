// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "testtypesplugin.h"

#include "testtaskmodel.h"

#include <qqml.h>

void TestTypesPlugin::registerTypes(const char *uri) {
  qmlRegisterType<TestTaskModel>(uri, 1, 0, "TestTaskModel");
}
