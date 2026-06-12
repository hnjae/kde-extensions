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

void appendDesktopSnapshotDiagnostics(
    const QList<TabPagerDesktopSnapshotNormalizationIssue> &issues,
    QList<TaskManagerDesktopSourceDiagnostic> &diagnostics) {
  for (const TabPagerDesktopSnapshotNormalizationIssue &issue : issues) {
    switch (issue.type) {
    case TabPagerDesktopSnapshotNormalizationIssue::Type::InvalidDesktopId:
      diagnostics.append(TaskManagerDesktopSourceDiagnostic{
          .type = TaskManagerDesktopSourceDiagnostic::Type::InvalidDesktopId,
          .row = issue.row,
          .desktopId = issue.desktopId.toVariant(),
      });
      break;
    case TabPagerDesktopSnapshotNormalizationIssue::Type::DuplicateDesktopId:
      diagnostics.append(TaskManagerDesktopSourceDiagnostic{
          .type = TaskManagerDesktopSourceDiagnostic::Type::DuplicateDesktopId,
          .row = issue.row,
          .relatedRow = issue.relatedRow,
          .desktopId = issue.desktopId.toVariant(),
      });
      break;
    case TabPagerDesktopSnapshotNormalizationIssue::Type::
        UnmatchedCurrentDesktop:
      diagnostics.append(TaskManagerDesktopSourceDiagnostic{
          .type =
              TaskManagerDesktopSourceDiagnostic::Type::UnmatchedCurrentDesktop,
          .desktopId = issue.desktopId.toVariant(),
      });
      break;
    }
  }
}
} // namespace

TaskManagerDesktopSourceMappingResult
taskManagerDesktopSourceMappingFromRawState(
    const TaskManagerDesktopRawState &rawState) {
  QList<TabPagerDesktop> desktops;
  desktops.reserve(rawState.desktopIds.size());
  QList<TaskManagerDesktopSourceDiagnostic> diagnostics;
  appendNameCountDiagnostics(rawState, diagnostics);

  const TabPagerDesktopId currentDesktop =
      TabPagerDesktopId::fromVariant(rawState.currentDesktop);

  for (qsizetype index = 0; index < rawState.desktopIds.size(); ++index) {
    desktops.append(TabPagerDesktop{
        .id = TabPagerDesktopId::fromVariant(rawState.desktopIds.at(index)),
        .name = rawState.desktopNames.value(index),
    });
  }

  TabPagerDesktopSnapshotNormalizationResult snapshot =
      normalizeTabPagerDesktopSnapshot(std::move(desktops), currentDesktop);
  appendDesktopSnapshotDiagnostics(snapshot.issues, diagnostics);

  return TaskManagerDesktopSourceMappingResult{
      .state =
          TabPagerDesktopSourceState{
              .desktopSnapshot = std::move(snapshot.snapshot),
              .navigationWrappingAround = rawState.navigationWrappingAround,
          },
      .diagnostics = std::move(diagnostics),
  };
}

TabPagerDesktopSourceState taskManagerDesktopSourceStateFromRawState(
    const TaskManagerDesktopRawState &rawState) {
  return taskManagerDesktopSourceMappingFromRawState(rawState).state;
}
