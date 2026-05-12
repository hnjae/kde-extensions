// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QHash>
#include <QList>
#include <QString>
#include <QVariant>
#include <Qt>

// Model roles are int-valued throughout QAbstractItemModel APIs.
enum class TabPagerDesktopRowRole : int { // NOLINT(performance-enum-size)
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

[[nodiscard]] QHash<int, QByteArray> tabPagerDesktopRowRoleNames();
[[nodiscard]] QVariant
tabPagerDesktopRowDataForRole(const TabPagerDesktopRowData &rowData, int role);
[[nodiscard]] QList<int>
tabPagerDesktopRowChangedRoles(const TabPagerDesktopRowData &previousRow,
                               const TabPagerDesktopRowData &nextRow);
