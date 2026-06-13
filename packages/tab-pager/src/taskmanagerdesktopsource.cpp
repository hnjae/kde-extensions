// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskmanagerdesktopsource.h"

#include "tabpagerlogging.h"
#include "taskmanagerdesktopmapper.h"

#include <QDebug>
#include <QtGlobal>

#include <utility>

namespace {
void logDesktopSourceDiagnostic(
    const TaskManagerDesktopSourceDiagnostic &diagnostic) {
  using DiagnosticType = TaskManagerDesktopSourceDiagnostic::Type;

  switch (diagnostic.type) {
  case DiagnosticType::MissingDesktopNames:
    qCWarning(tabPagerLog).nospace()
        << "TaskManager desktop source has fewer names than IDs: ids="
        << diagnostic.desktopIdCount
        << ", names=" << diagnostic.desktopNameCount
        << ", firstMissingNameRow=" << diagnostic.row;
    break;
  case DiagnosticType::ExtraDesktopNames:
    qCWarning(tabPagerLog).nospace()
        << "TaskManager desktop source has extra names: ids="
        << diagnostic.desktopIdCount
        << ", names=" << diagnostic.desktopNameCount
        << ", firstExtraNameRow=" << diagnostic.row;
    break;
  case DiagnosticType::InvalidDesktopId:
    qCWarning(tabPagerLog).nospace()
        << "TaskManager desktop source has invalid desktop ID at row "
        << diagnostic.row;
    break;
  case DiagnosticType::DuplicateDesktopId:
    qCWarning(tabPagerLog).nospace()
        << "TaskManager desktop source has duplicate desktop ID "
        << diagnostic.desktopId << " at row " << diagnostic.row
        << ", first seen at row " << diagnostic.relatedRow;
    break;
  case DiagnosticType::UnmatchedCurrentDesktop:
    qCWarning(tabPagerLog).nospace()
        << "TaskManager desktop source current desktop does not match any "
           "valid desktop ID: "
        << diagnostic.desktopId;
    break;
  }
}

void logDesktopSourceDiagnostics(
    const QList<TaskManagerDesktopSourceDiagnostic> &diagnostics) {
  for (const TaskManagerDesktopSourceDiagnostic &diagnostic : diagnostics) {
    logDesktopSourceDiagnostic(diagnostic);
  }
}

TaskManagerDesktopSourceMappingResult
mapDesktopSourceState(const TabPagerVirtualDesktopInfo &info) {
  return taskManagerDesktopSourceMappingFromRawState(TaskManagerDesktopRawState{
      .desktopIds = info.desktopIds(),
      .desktopNames = info.desktopNames(),
      .currentDesktop = info.currentDesktop(),
      .navigationWrappingAround = info.navigationWrappingAround(),
  });
}
} // namespace

TaskManagerDesktopSource::TaskManagerDesktopSource(QObject *parent)
    : TaskManagerDesktopSource(createTaskManagerVirtualDesktopInfo(), parent) {}

TaskManagerDesktopSource::TaskManagerDesktopSource(
    std::unique_ptr<TabPagerVirtualDesktopInfo> info, QObject *parent)
    : TabPagerDesktopSource(parent), m_info(std::move(info)) {
  if (m_info == nullptr) {
    qFatal("TaskManagerDesktopSource requires a non-null "
           "TabPagerVirtualDesktopInfo");
  }

  connectDesktopInfo();
}

void TaskManagerDesktopSource::connectDesktopInfo() {
  connect(m_info.get(), &TabPagerVirtualDesktopInfo::desktopIdsChanged, this,
          &TabPagerDesktopSource::sourceStateChanged);
  connect(m_info.get(), &TabPagerVirtualDesktopInfo::desktopNamesChanged, this,
          &TabPagerDesktopSource::sourceStateChanged);
  connect(m_info.get(), &TabPagerVirtualDesktopInfo::numberOfDesktopsChanged,
          this, &TabPagerDesktopSource::sourceStateChanged);
  connect(m_info.get(), &TabPagerVirtualDesktopInfo::currentDesktopChanged,
          this, &TabPagerDesktopSource::sourceStateChanged);
  connect(m_info.get(),
          &TabPagerVirtualDesktopInfo::navigationWrappingAroundChanged, this,
          &TabPagerDesktopSource::sourceStateChanged);
}

TaskManagerDesktopSource::~TaskManagerDesktopSource() = default;

TabPagerDesktopSourceState TaskManagerDesktopSource::sourceState() const {
  const TaskManagerDesktopSourceMappingResult result =
      mapDesktopSourceState(*m_info);
  logDesktopSourceDiagnostics(result.diagnostics);
  return result.state;
}

QList<TaskManagerDesktopSourceDiagnostic>
TaskManagerDesktopSource::sourceDiagnostics() const {
  return mapDesktopSourceState(*m_info).diagnostics;
}

void TaskManagerDesktopSource::activateDesktop(
    const TabPagerDesktopId &desktopId) {
  if (desktopId.isValid()) {
    m_info->requestActivate(desktopId.toVariant());
  }
}
