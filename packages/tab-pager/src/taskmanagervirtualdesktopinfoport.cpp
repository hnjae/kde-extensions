// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskmanagervirtualdesktopinfoport.h"

#include <virtualdesktopinfo.h>

namespace {
class TaskManagerVirtualDesktopInfo final
    : public TaskManagerVirtualDesktopInfoPort {
  Q_OBJECT

public:
  explicit TaskManagerVirtualDesktopInfo(QObject *parent = nullptr);
  ~TaskManagerVirtualDesktopInfo() override;

  [[nodiscard]] QVariantList desktopIds() const override;
  [[nodiscard]] QStringList desktopNames() const override;
  [[nodiscard]] QVariant currentDesktop() const override;
  [[nodiscard]] bool navigationWrappingAround() const override;
  void requestActivate(const QVariant &desktopId) override;

private:
  TaskManager::VirtualDesktopInfo m_info;
};
} // namespace

TaskManagerVirtualDesktopInfoPort::TaskManagerVirtualDesktopInfoPort(
    QObject *parent)
    : QObject(parent) {}

TaskManagerVirtualDesktopInfoPort::~TaskManagerVirtualDesktopInfoPort() =
    default;

TaskManagerVirtualDesktopInfo::TaskManagerVirtualDesktopInfo(QObject *parent)
    : TaskManagerVirtualDesktopInfoPort(parent) {
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopIdsChanged, this,
          &TaskManagerVirtualDesktopInfoPort::desktopIdsChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopNamesChanged, this,
          &TaskManagerVirtualDesktopInfoPort::desktopNamesChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::numberOfDesktopsChanged,
          this, &TaskManagerVirtualDesktopInfoPort::numberOfDesktopsChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::currentDesktopChanged,
          this, &TaskManagerVirtualDesktopInfoPort::currentDesktopChanged);
  connect(&m_info,
          &TaskManager::VirtualDesktopInfo::navigationWrappingAroundChanged,
          this,
          &TaskManagerVirtualDesktopInfoPort::navigationWrappingAroundChanged);
}

TaskManagerVirtualDesktopInfo::~TaskManagerVirtualDesktopInfo() = default;

QVariantList TaskManagerVirtualDesktopInfo::desktopIds() const {
  return m_info.desktopIds();
}

QStringList TaskManagerVirtualDesktopInfo::desktopNames() const {
  return m_info.desktopNames();
}

QVariant TaskManagerVirtualDesktopInfo::currentDesktop() const {
  return m_info.currentDesktop();
}

bool TaskManagerVirtualDesktopInfo::navigationWrappingAround() const {
  return m_info.navigationWrappingAround();
}

void TaskManagerVirtualDesktopInfo::requestActivate(const QVariant &desktopId) {
  m_info.requestActivate(desktopId);
}

std::unique_ptr<TaskManagerVirtualDesktopInfoPort>
createTaskManagerVirtualDesktopInfoPort() {
  return std::make_unique<TaskManagerVirtualDesktopInfo>();
}

#include "taskmanagervirtualdesktopinfoport.moc"
