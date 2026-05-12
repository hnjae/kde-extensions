// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QString>
#include <QVariant>
#include <Qt>

#include <span>

enum class TabPagerDesktopRowRole : int {
  DesktopId = Qt::UserRole + 1,
  Name,
  Label,
  Number,
  Active,
};

struct TabPagerDesktopRowData {
  QVariant desktopId;
  QString name;
  QString label;
  int number = 0;
  bool active = false;
};

using TabPagerDesktopRowRoleDataReader =
    QVariant (*)(const TabPagerDesktopRowData &rowData);

struct TabPagerDesktopRowRoleDefinition {
  int role = 0;
  const char *name = nullptr;
  TabPagerDesktopRowRoleDataReader readData = nullptr;
};

[[nodiscard]] std::span<const TabPagerDesktopRowRoleDefinition>
tabPagerDesktopRowRoleDefinitions();
[[nodiscard]] QVariant
tabPagerDesktopRowDataForRole(const TabPagerDesktopRowData &rowData, int role);
