// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskmanagerdesktopsource.h"

#include <QStringList>

TaskManagerDesktopSource::TaskManagerDesktopSource(QObject *parent)
    : TabPagerDesktopSource(parent) {
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopIdsChanged, this,
          &TabPagerDesktopSource::desktopSnapshotChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopNamesChanged, this,
          &TabPagerDesktopSource::desktopSnapshotChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::numberOfDesktopsChanged,
          this, &TabPagerDesktopSource::desktopSnapshotChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::currentDesktopChanged,
          this, &TabPagerDesktopSource::desktopSnapshotChanged);
  connect(&m_info,
          &TaskManager::VirtualDesktopInfo::navigationWrappingAroundChanged,
          this, &TabPagerDesktopSource::navigationWrappingAroundChanged);
}

TaskManagerDesktopSource::~TaskManagerDesktopSource() = default;

TabPagerDesktopSnapshot TaskManagerDesktopSource::desktopSnapshot() const {
  const QVariantList ids = m_info.desktopIds();
  const QStringList names = m_info.desktopNames();

  QList<TabPagerDesktop> desktops;
  desktops.reserve(ids.size());

  for (qsizetype index = 0; index < ids.size(); ++index) {
    desktops.append(TabPagerDesktop{
        .id = ids.at(index),
        .name = names.value(index),
    });
  }

  return TabPagerDesktopSnapshot{
      .desktops = desktops,
      .currentDesktop = m_info.currentDesktop(),
  };
}

bool TaskManagerDesktopSource::navigationWrappingAround() const {
  return m_info.navigationWrappingAround();
}

void TaskManagerDesktopSource::activateDesktop(const QVariant &desktopId) {
  if (desktopId.isValid()) {
    m_info.requestActivate(desktopId);
  }
}
