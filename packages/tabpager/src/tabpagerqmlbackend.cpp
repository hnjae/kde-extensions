// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerqmlbackend.h"

#include "taskmanagerdesktopsource.h"

#include <memory>

TabPagerQmlBackend::TabPagerQmlBackend(QObject *parent)
    : TabPagerBackend(std::make_unique<TaskManagerDesktopSource>(), parent) {}

TabPagerQmlBackend::~TabPagerQmlBackend() = default;
