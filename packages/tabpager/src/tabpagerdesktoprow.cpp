// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktoprow.h"

#include "tabpagerdesktoplogic.h"

#include <array>
#include <span>
#include <type_traits>

namespace {
using TabPagerDesktopRowRoleDataReader =
    QVariant (*)(const TabPagerDesktopRowData &rowData);
using TabPagerDesktopRowRoleChangeDetector =
    bool (*)(const TabPagerDesktopRowData &previousRow,
             const TabPagerDesktopRowData &nextRow);

struct TabPagerDesktopRowRoleDefinition {
  int role = 0;
  const char *name = nullptr;
  TabPagerDesktopRowRoleDataReader readData;
  TabPagerDesktopRowRoleChangeDetector hasChanged;
};

template <auto Field>
[[nodiscard]] QVariant readRowField(const TabPagerDesktopRowData &rowData) {
  const auto &field = rowData.*Field;
  if constexpr (std::is_same_v<std::remove_cvref_t<decltype(field)>,
                               TabPagerDesktopId>) {
    return field.toVariant();
  } else {
    return field;
  }
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

[[nodiscard]] std::span<const TabPagerDesktopRowRoleDefinition>
tabPagerDesktopRowRoleDefinitions() {
  return rowRoleDefinitions;
}

[[nodiscard]] TabPagerDesktopRowData
rowDataForDesktop(qsizetype row, const TabPagerDesktop &desktop,
                  const TabPagerDesktopId &currentDesktop) {
  const int number = static_cast<int>(row + 1);
  return TabPagerDesktopRowData{
      .desktopId = desktop.id,
      .name = desktop.name,
      .label = TabPagerDesktopLogic::labelForDesktop(number, desktop.name),
      .number = number,
      .active = desktop.id.matches(currentDesktop),
  };
}

} // namespace

QList<TabPagerDesktopRowData>
tabPagerDesktopRowsForSnapshot(const TabPagerDesktopSnapshot &snapshot) {
  QList<TabPagerDesktopRowData> rows;
  rows.reserve(snapshot.desktops.size());

  for (qsizetype sourceRow = 0; sourceRow < snapshot.desktops.size();
       ++sourceRow) {
    const TabPagerDesktop &desktop = snapshot.desktops.at(sourceRow);
    if (!desktop.id.isValid()) {
      continue;
    }

    rows.append(rowDataForDesktop(sourceRow, desktop, snapshot.currentDesktop));
  }

  return rows;
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
