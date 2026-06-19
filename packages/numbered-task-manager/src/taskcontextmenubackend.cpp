// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskcontextmenubackend.h"

#include "desktopactionlogic.h"

#include <KDesktopFile>
#include <KIO/ApplicationLauncherJob>
#include <KService>

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
                                                    QObject *parent) {
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
      desktopActionDescriptors(desktopActionSources(service->actions()));
  const QList<DesktopActionDescriptor> contextualDescriptors =
      descriptorsWithContext(descriptors, launcherUrl, entryUrl.toLocalFile());
  return desktopActionsFromDescriptors(
      contextualDescriptors, parent,
      [](const DesktopActionDescriptor &descriptor) -> KJob * {
        return new KIO::ApplicationLauncherJob(descriptor.serviceAction);
      },
      [this](const QVariantMap &result) {
        Q_EMIT desktopActionResult(result);
      });
}
