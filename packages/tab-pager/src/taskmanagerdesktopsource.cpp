// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskmanagerdesktopsource.h"

#include <QStringList>

#include <virtualdesktopinfo.h>

class TaskManagerDesktopSource::Private {
public:
  TaskManager::VirtualDesktopInfo info;
};

TaskManagerDesktopSource::TaskManagerDesktopSource(QObject *parent)
    : TabPagerDesktopSource(parent), d(std::make_unique<Private>()) {
  connect(&d->info, &TaskManager::VirtualDesktopInfo::desktopIdsChanged, this,
          &TabPagerDesktopSource::desktopsChanged);
  connect(&d->info, &TaskManager::VirtualDesktopInfo::desktopNamesChanged, this,
          &TabPagerDesktopSource::desktopsChanged);
  connect(&d->info, &TaskManager::VirtualDesktopInfo::numberOfDesktopsChanged,
          this, &TabPagerDesktopSource::desktopsChanged);
  connect(&d->info, &TaskManager::VirtualDesktopInfo::currentDesktopChanged,
          this, &TabPagerDesktopSource::currentDesktopChanged);
  connect(&d->info,
          &TaskManager::VirtualDesktopInfo::navigationWrappingAroundChanged,
          this, &TabPagerDesktopSource::navigationWrappingAroundChanged);
}

TaskManagerDesktopSource::~TaskManagerDesktopSource() = default;

QList<TabPagerDesktop> TaskManagerDesktopSource::desktops() const {
  const QVariantList ids = d->info.desktopIds();
  const QStringList names = d->info.desktopNames();

  QList<TabPagerDesktop> desktops;
  desktops.reserve(ids.size());

  for (qsizetype index = 0; index < ids.size(); ++index) {
    desktops.append(TabPagerDesktop{
        .id = ids.at(index),
        .name = names.value(index),
    });
  }

  return desktops;
}

QVariant TaskManagerDesktopSource::currentDesktop() const {
  return d->info.currentDesktop();
}

bool TaskManagerDesktopSource::navigationWrappingAround() const {
  return d->info.navigationWrappingAround();
}

void TaskManagerDesktopSource::activateDesktop(const QVariant &desktopId) {
  if (desktopId.isValid()) {
    d->info.requestActivate(desktopId);
  }
}
