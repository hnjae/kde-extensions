// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskmanagerdesktopsource.h"

#include <QStringList>

#include <utility>

TaskManagerDesktopSource::TaskManagerDesktopSource(QObject *parent)
    : TabPagerDesktopSource(parent) {
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopIdsChanged, this,
          &TabPagerDesktopSource::sourceStateChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::desktopNamesChanged, this,
          &TabPagerDesktopSource::sourceStateChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::numberOfDesktopsChanged,
          this, &TabPagerDesktopSource::sourceStateChanged);
  connect(&m_info, &TaskManager::VirtualDesktopInfo::currentDesktopChanged,
          this, &TabPagerDesktopSource::sourceStateChanged);
  connect(&m_info,
          &TaskManager::VirtualDesktopInfo::navigationWrappingAroundChanged,
          this, &TabPagerDesktopSource::sourceStateChanged);
}

TaskManagerDesktopSource::~TaskManagerDesktopSource() = default;

TabPagerDesktopSourceState TaskManagerDesktopSource::sourceState() const {
  const QVariantList ids = m_info.desktopIds();
  const QStringList names = m_info.desktopNames();

  QList<TabPagerDesktop> desktops;
  desktops.reserve(ids.size());

  for (qsizetype index = 0; index < ids.size(); ++index) {
    desktops.append(TabPagerDesktop{
        .id = TabPagerDesktopId::fromVariant(ids.at(index)),
        .name = names.value(index),
    });
  }

  return TabPagerDesktopSourceState{
      .desktopSnapshot =
          TabPagerDesktopSnapshot{
              .desktops = std::move(desktops),
              .currentDesktop =
                  TabPagerDesktopId::fromVariant(m_info.currentDesktop()),
          },
      .navigationWrappingAround = m_info.navigationWrappingAround(),
  };
}

void TaskManagerDesktopSource::activateDesktop(
    const TabPagerDesktopId &desktopId) {
  if (desktopId.isValid()) {
    m_info.requestActivate(desktopId.toVariant());
  }
}
