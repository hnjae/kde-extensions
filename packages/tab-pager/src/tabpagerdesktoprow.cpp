// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprow.h"

#include <array>

namespace {
template <auto Field>
[[nodiscard]] QVariant readRowField(const TabPagerDesktopRowData &rowData) {
  return rowData.*Field;
}

template <auto Field>
[[nodiscard]] bool rowFieldChanged(const TabPagerDesktopRowData &previousRow,
                                   const TabPagerDesktopRowData &nextRow) {
  return previousRow.*Field != nextRow.*Field;
}

template <auto Field>
[[nodiscard]] constexpr TabPagerDesktopRowRoleDefinition
rowRoleDefinition(TabPagerDesktopRowRole role, const char *name) {
  return TabPagerDesktopRowRoleDefinition{
      .role = static_cast<int>(role),
      .name = name,
      .readData = readRowField<Field>,
      .hasChanged = rowFieldChanged<Field>,
  };
}

constexpr auto rowRoleDefinitions = std::to_array({
    rowRoleDefinition<&TabPagerDesktopRowData::desktopId>(
        TabPagerDesktopRowRole::DesktopId, "desktopId"),
    rowRoleDefinition<&TabPagerDesktopRowData::name>(
        TabPagerDesktopRowRole::Name, "name"),
    rowRoleDefinition<&TabPagerDesktopRowData::label>(
        TabPagerDesktopRowRole::Label, "label"),
    rowRoleDefinition<&TabPagerDesktopRowData::number>(
        TabPagerDesktopRowRole::Number, "number"),
    rowRoleDefinition<&TabPagerDesktopRowData::active>(
        TabPagerDesktopRowRole::Active, "active"),
});
} // namespace

std::span<const TabPagerDesktopRowRoleDefinition>
tabPagerDesktopRowRoleDefinitions() {
  return rowRoleDefinitions;
}

QHash<int, QByteArray> tabPagerDesktopRowRoleNames() {
  QHash<int, QByteArray> names;
  const std::span<const TabPagerDesktopRowRoleDefinition> definitions =
      tabPagerDesktopRowRoleDefinitions();
  names.reserve(static_cast<qsizetype>(definitions.size()));

  for (const TabPagerDesktopRowRoleDefinition &definition : definitions) {
    names.insert(definition.role, definition.name);
  }

  return names;
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
    if (definition.hasChanged(previousRow, nextRow)) {
      roles.append(definition.role);
    }
  }

  return roles;
}
