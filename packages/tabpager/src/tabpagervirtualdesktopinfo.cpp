// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagervirtualdesktopinfo.h"

#include <virtualdesktopinfo.h>

namespace {
class TaskManagerVirtualDesktopInfo final : public TabPagerVirtualDesktopInfo {
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

TabPagerVirtualDesktopInfo::TabPagerVirtualDesktopInfo(QObject *parent)
    : QObject(parent) {}

TabPagerVirtualDesktopInfo::~TabPagerVirtualDesktopInfo() = default;

TaskManagerVirtualDesktopInfo::TaskManagerVirtualDesktopInfo(QObject *parent)
    : TabPagerVirtualDesktopInfo(parent) {
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopIdsChanged, this,
          &TabPagerVirtualDesktopInfo::desktopIdsChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopNamesChanged, this,
          &TabPagerVirtualDesktopInfo::desktopNamesChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::numberOfDesktopsChanged,
          this, &TabPagerVirtualDesktopInfo::numberOfDesktopsChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::currentDesktopChanged,
          this, &TabPagerVirtualDesktopInfo::currentDesktopChanged);
  connect(&m_info,
          &TaskManager::VirtualDesktopInfo::navigationWrappingAroundChanged,
          this, &TabPagerVirtualDesktopInfo::navigationWrappingAroundChanged);
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

std::unique_ptr<TabPagerVirtualDesktopInfo>
createTaskManagerVirtualDesktopInfo() {
  return std::make_unique<TaskManagerVirtualDesktopInfo>();
}

#include "tabpagervirtualdesktopinfo.moc"
