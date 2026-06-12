// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "numberedtaskmanagerplugin.h"

#include "taskcontextmenubackend.h"

#include <qqml.h>

void NumberedTaskManagerPlugin::registerTypes(const char *uri) {
  qmlRegisterType<TaskContextMenuBackend>(uri, 1, 0, "TaskContextMenuBackend");
}
