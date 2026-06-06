// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskmanagerdesktopmapper.h"

#include <utility>

namespace {
void appendNameCountDiagnostics(
    const TaskManagerDesktopRawState &rawState,
    QList<TaskManagerDesktopSourceDiagnostic> &diagnostics) {
  if (rawState.desktopNames.size() < rawState.desktopIds.size()) {
    diagnostics.append(TaskManagerDesktopSourceDiagnostic{
        .type = TaskManagerDesktopSourceDiagnostic::Type::MissingDesktopNames,
        .row = rawState.desktopNames.size(),
        .desktopIdCount = rawState.desktopIds.size(),
        .desktopNameCount = rawState.desktopNames.size(),
        .desktopId = {},
    });
    return;
  }

  if (rawState.desktopNames.size() > rawState.desktopIds.size()) {
    diagnostics.append(TaskManagerDesktopSourceDiagnostic{
        .type = TaskManagerDesktopSourceDiagnostic::Type::ExtraDesktopNames,
        .row = rawState.desktopIds.size(),
        .desktopIdCount = rawState.desktopIds.size(),
        .desktopNameCount = rawState.desktopNames.size(),
        .desktopId = {},
    });
  }
}

[[nodiscard]] qsizetype
firstMatchingDesktopIdIndex(const QList<QVariant> &desktopIds,
                            const QVariant &desktopId) {
  for (qsizetype row = 0; row < desktopIds.size(); ++row) {
    if (desktopIds.at(row) == desktopId) {
      return row;
    }
  }

  return -1;
}
} // namespace

TaskManagerDesktopSourceMappingResult
taskManagerDesktopSourceMappingFromRawState(
    const TaskManagerDesktopRawState &rawState) {
  QList<TabPagerDesktop> desktops;
  desktops.reserve(rawState.desktopIds.size());
  QList<TaskManagerDesktopSourceDiagnostic> diagnostics;
  appendNameCountDiagnostics(rawState, diagnostics);

  QList<QVariant> validDesktopIds;
  QList<qsizetype> validDesktopIdRows;
  bool currentDesktopMatched = false;
  const TabPagerDesktopId currentDesktop =
      TabPagerDesktopId::fromVariant(rawState.currentDesktop);

  for (qsizetype index = 0; index < rawState.desktopIds.size(); ++index) {
    const QVariant &rawDesktopId = rawState.desktopIds.at(index);
    const TabPagerDesktopId desktopId =
        TabPagerDesktopId::fromVariant(rawDesktopId);
    if (!desktopId.isValid()) {
      diagnostics.append(TaskManagerDesktopSourceDiagnostic{
          .type = TaskManagerDesktopSourceDiagnostic::Type::InvalidDesktopId,
          .row = index,
          .desktopId = {},
      });
    } else {
      const qsizetype matchingIndex =
          firstMatchingDesktopIdIndex(validDesktopIds, rawDesktopId);
      if (matchingIndex >= 0) {
        diagnostics.append(TaskManagerDesktopSourceDiagnostic{
            .type =
                TaskManagerDesktopSourceDiagnostic::Type::DuplicateDesktopId,
            .row = index,
            .relatedRow = validDesktopIdRows.at(matchingIndex),
            .desktopId = rawDesktopId,
        });
      }

      validDesktopIds.append(rawDesktopId);
      validDesktopIdRows.append(index);
      currentDesktopMatched =
          currentDesktopMatched || desktopId.matches(currentDesktop);
    }

    desktops.append(TabPagerDesktop{
        .id = desktopId,
        .name = rawState.desktopNames.value(index),
    });
  }

  if (!validDesktopIds.isEmpty() && !currentDesktopMatched) {
    diagnostics.append(TaskManagerDesktopSourceDiagnostic{
        .type =
            TaskManagerDesktopSourceDiagnostic::Type::UnmatchedCurrentDesktop,
        .desktopId = rawState.currentDesktop,
    });
  }

  return TaskManagerDesktopSourceMappingResult{
      .state =
          TabPagerDesktopSourceState{
              .desktopSnapshot =
                  TabPagerDesktopSnapshot{
                      .desktops = std::move(desktops),
                      .currentDesktop = currentDesktop,
                  },
              .navigationWrappingAround = rawState.navigationWrappingAround,
          },
      .diagnostics = std::move(diagnostics),
  };
}

TabPagerDesktopSourceState taskManagerDesktopSourceStateFromRawState(
    const TaskManagerDesktopRawState &rawState) {
  return taskManagerDesktopSourceMappingFromRawState(rawState).state;
}
