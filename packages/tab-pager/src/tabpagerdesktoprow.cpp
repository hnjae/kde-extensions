// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprow.h"

#include <array>

namespace {
[[nodiscard]] QVariant desktopIdForRow(const TabPagerDesktopRowData &rowData) {
  return rowData.desktopId;
}

[[nodiscard]] QVariant nameForRow(const TabPagerDesktopRowData &rowData) {
  return rowData.name;
}

[[nodiscard]] QVariant labelForRow(const TabPagerDesktopRowData &rowData) {
  return rowData.label;
}

[[nodiscard]] QVariant numberForRow(const TabPagerDesktopRowData &rowData) {
  return rowData.number;
}

[[nodiscard]] QVariant activeForRow(const TabPagerDesktopRowData &rowData) {
  return rowData.active;
}

constexpr std::array<TabPagerDesktopRowRoleDefinition, 5> rowRoleDefinitions{{
    {
        .role = static_cast<int>(TabPagerDesktopRowRole::DesktopId),
        .name = "desktopId",
        .readData = desktopIdForRow,
    },
    {
        .role = static_cast<int>(TabPagerDesktopRowRole::Name),
        .name = "name",
        .readData = nameForRow,
    },
    {
        .role = static_cast<int>(TabPagerDesktopRowRole::Label),
        .name = "label",
        .readData = labelForRow,
    },
    {
        .role = static_cast<int>(TabPagerDesktopRowRole::Number),
        .name = "number",
        .readData = numberForRow,
    },
    {
        .role = static_cast<int>(TabPagerDesktopRowRole::Active),
        .name = "active",
        .readData = activeForRow,
    },
}};
} // namespace

std::span<const TabPagerDesktopRowRoleDefinition>
tabPagerDesktopRowRoleDefinitions() {
  return rowRoleDefinitions;
}

QVariant tabPagerDesktopRowDataForRole(const TabPagerDesktopRowData &rowData,
                                       int role) {
  for (const TabPagerDesktopRowRoleDefinition &definition :
       tabPagerDesktopRowRoleDefinitions()) {
    if (definition.role == role) {
      return definition.readData(rowData);
    }
  }

  return {};
}

QList<int>
tabPagerDesktopRowChangedRoles(const TabPagerDesktopRowData &previousRow,
                               const TabPagerDesktopRowData &nextRow) {
  QList<int> roles;

  for (const TabPagerDesktopRowRoleDefinition &definition :
       tabPagerDesktopRowRoleDefinitions()) {
    if (definition.readData(previousRow) != definition.readData(nextRow)) {
      roles.append(definition.role);
    }
  }

  return roles;
}
