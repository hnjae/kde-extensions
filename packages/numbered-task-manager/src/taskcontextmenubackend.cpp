// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskcontextmenubackend.h"

#include <KDesktopFile>
#include <KIO/ApplicationLauncherJob>
#include <KService>
#include <KServiceAction>

#include <QAction>
#include <QIcon>

TaskContextMenuBackend::TaskContextMenuBackend(QObject *parent)
    : QObject(parent) {}

TaskContextMenuBackend::~TaskContextMenuBackend() = default;

QUrl TaskContextMenuBackend::desktopEntryUrl(const QUrl &launcherUrl) const {
  if (launcherUrl.isValid() &&
      launcherUrl.scheme() == QLatin1String("applications")) {
    const KService::Ptr service = KService::serviceByMenuId(launcherUrl.path());
    if (service) {
      return QUrl::fromLocalFile(service->entryPath());
    }
  }

  return launcherUrl;
}

QVariantList TaskContextMenuBackend::desktopActions(const QUrl &launcherUrl,
                                                    QObject *parent) const {
  QVariantList actions;
  if (!parent) {
    return actions;
  }

  const QUrl entryUrl = desktopEntryUrl(launcherUrl);
  if (!entryUrl.isValid() || !entryUrl.isLocalFile() ||
      !KDesktopFile::isDesktopFile(entryUrl.toLocalFile())) {
    return actions;
  }

  const KService::Ptr service =
      KService::serviceByDesktopPath(entryUrl.toLocalFile());
  if (!service) {
    return actions;
  }

  const QList<DesktopActionDescriptor> descriptors =
      desktopActionDescriptors(service->actions());
  return desktopActionsFromDescriptors(descriptors, parent);
}

QList<TaskContextMenuBackend::DesktopActionDescriptor>
TaskContextMenuBackend::desktopActionDescriptors(
    const QList<KServiceAction> &serviceActions) const {
  QList<DesktopActionDescriptor> descriptors;
  for (const KServiceAction &serviceAction : serviceActions) {
    if (serviceAction.noDisplay()) {
      continue;
    }

    descriptors << DesktopActionDescriptor{
        .text = serviceAction.text(),
        .iconName = serviceAction.icon(),
        .separator = serviceAction.isSeparator(),
        .serviceAction = serviceAction,
    };
  }

  return descriptors;
}

QVariantList TaskContextMenuBackend::desktopActionsFromDescriptors(
    const QList<DesktopActionDescriptor> &descriptors, QObject *parent) const {
  QVariantList actions;
  if (!parent) {
    return actions;
  }

  for (const DesktopActionDescriptor &descriptor : descriptors) {
    auto *action = new QAction(parent);
    action->setText(descriptor.text);
    action->setIcon(QIcon::fromTheme(descriptor.iconName));
    action->setSeparator(descriptor.separator);

    connect(action, &QAction::triggered, action, [descriptor]() {
      auto *job = new KIO::ApplicationLauncherJob(descriptor.serviceAction);
      job->start();
    });

    actions << QVariant::fromValue(action);
  }

  return actions;
}
