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

bool diagnosticEquals(const TaskManagerDesktopSourceDiagnostic &left,
                      const TaskManagerDesktopSourceDiagnostic &right) {
  return left.type == right.type && left.row == right.row &&
         left.relatedRow == right.relatedRow &&
         left.desktopIdCount == right.desktopIdCount &&
         left.desktopNameCount == right.desktopNameCount &&
         left.desktopId == right.desktopId;
}

bool diagnosticsEqual(const QList<TaskManagerDesktopSourceDiagnostic> &left,
                      const QList<TaskManagerDesktopSourceDiagnostic> &right) {
  if (left.size() != right.size()) {
    return false;
  }

  for (qsizetype index = 0; index < left.size(); ++index) {
    if (!diagnosticEquals(left.at(index), right.at(index))) {
      return false;
    }
  }

  return true;
}

TaskManagerDesktopSourceMappingResult
mapDesktopSourceState(const TabPagerVirtualDesktopInfo &info) {
  return taskManagerDesktopSourceMappingFromRawState(TaskManagerDesktopRawState{
      .desktopIds = info.desktopIds(),
      .desktopNames = info.desktopNames(),
      .currentDesktop = info.currentDesktop(),
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
          &TaskManagerDesktopSource::handleDesktopInfoChanged);
  connect(m_info.get(), &TabPagerVirtualDesktopInfo::desktopNamesChanged, this,
          &TaskManagerDesktopSource::handleDesktopInfoChanged);
  connect(m_info.get(), &TabPagerVirtualDesktopInfo::numberOfDesktopsChanged,
          this, &TaskManagerDesktopSource::handleDesktopInfoChanged);
  connect(m_info.get(), &TabPagerVirtualDesktopInfo::currentDesktopChanged,
          this, &TaskManagerDesktopSource::handleDesktopInfoChanged);
  static_cast<void>(refreshDiagnostics());
}

TaskManagerDesktopSource::~TaskManagerDesktopSource() = default;

TabPagerDesktopSourceState TaskManagerDesktopSource::sourceState() const {
  return mapDesktopSourceState(*m_info).state;
}

QList<TaskManagerDesktopSourceDiagnostic>
TaskManagerDesktopSource::sourceDiagnostics() const {
  return mapDesktopSourceState(*m_info).diagnostics;
}

bool TaskManagerDesktopSource::sourceHasDiagnostics() const {
  return !sourceDiagnostics().isEmpty();
}

void TaskManagerDesktopSource::handleDesktopInfoChanged() {
  if (refreshDiagnostics()) {
    Q_EMIT sourceDiagnosticsChanged();
  }
  Q_EMIT sourceStateChanged();
}

bool TaskManagerDesktopSource::refreshDiagnostics() {
  return logDiagnosticsIfChanged(mapDesktopSourceState(*m_info).diagnostics);
}

bool TaskManagerDesktopSource::logDiagnosticsIfChanged(
    const QList<TaskManagerDesktopSourceDiagnostic> &diagnostics) const {
  if (m_hasLoggedDiagnostics &&
      diagnosticsEqual(m_loggedDiagnostics, diagnostics)) {
    return false;
  }

  m_hasLoggedDiagnostics = true;
  m_loggedDiagnostics = diagnostics;
  logDesktopSourceDiagnostics(diagnostics);
  return true;
}

void TaskManagerDesktopSource::activateDesktop(
    const TabPagerDesktopId &desktopId) {
  if (desktopId.isValid()) {
    m_info->requestActivate(desktopId.toVariant());
  }
}

TaskManagerNavigationSettingsSource::TaskManagerNavigationSettingsSource(
    QObject *parent)
    : TaskManagerNavigationSettingsSource(createTaskManagerVirtualDesktopInfo(),
                                          parent) {}

TaskManagerNavigationSettingsSource::TaskManagerNavigationSettingsSource(
    std::unique_ptr<TabPagerVirtualDesktopInfo> info, QObject *parent)
    : TabPagerNavigationSettingsSource(parent), m_info(std::move(info)) {
  if (m_info == nullptr) {
    qFatal("TaskManagerNavigationSettingsSource requires a non-null "
           "TabPagerVirtualDesktopInfo");
  }

  connectDesktopInfo();
}

TaskManagerNavigationSettingsSource::~TaskManagerNavigationSettingsSource() =
    default;

void TaskManagerNavigationSettingsSource::connectDesktopInfo() {
  connect(m_info.get(),
          &TabPagerVirtualDesktopInfo::navigationWrappingAroundChanged, this,
          &TabPagerNavigationSettingsSource::navigationWrappingAroundChanged);
}

bool TaskManagerNavigationSettingsSource::navigationWrappingAround() const {
  return m_info->navigationWrappingAround();
}
