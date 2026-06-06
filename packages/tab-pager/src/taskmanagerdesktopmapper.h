// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopsource.h"

#include <QList>
#include <QStringList>
#include <QVariant>
#include <QVariantList>

#include <cstdint>

struct TaskManagerDesktopRawState {
  QVariantList desktopIds;
  QStringList desktopNames;
  QVariant currentDesktop;
  bool navigationWrappingAround = false;
};

struct TaskManagerDesktopSourceDiagnostic {
  enum class Type : std::uint8_t {
    MissingDesktopNames,
    ExtraDesktopNames,
    InvalidDesktopId,
    DuplicateDesktopId,
    UnmatchedCurrentDesktop,
  };

  Type type = Type::MissingDesktopNames;
  qsizetype row = -1;
  qsizetype relatedRow = -1;
  qsizetype desktopIdCount = 0;
  qsizetype desktopNameCount = 0;
  QVariant desktopId;
};

struct TaskManagerDesktopSourceMappingResult {
  TabPagerDesktopSourceState state;
  QList<TaskManagerDesktopSourceDiagnostic> diagnostics;
};

[[nodiscard]] TaskManagerDesktopSourceMappingResult
taskManagerDesktopSourceMappingFromRawState(
    const TaskManagerDesktopRawState &rawState);

[[nodiscard]] TabPagerDesktopSourceState
taskManagerDesktopSourceStateFromRawState(
    const TaskManagerDesktopRawState &rawState);
