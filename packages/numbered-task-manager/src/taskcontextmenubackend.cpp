// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "taskcontextmenubackend.h"

#include <KDesktopFile>
#include <KIO/ApplicationLauncherJob>
#include <KJob>
#include <KService>
#include <KServiceAction>

#include <QAction>
#include <QIcon>
#include <QVariantMap>

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
      desktopActionDescriptors(service->actions());
  const QList<DesktopActionDescriptor> contextualDescriptors =
      descriptorsWithContext(descriptors, launcherUrl, entryUrl.toLocalFile());
  return desktopActionsFromDescriptors(contextualDescriptors, parent);
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
        .launcherUrl = {},
        .desktopEntryPath = {},
        .separator = serviceAction.isSeparator(),
        .serviceAction = serviceAction,
    };
  }

  return descriptors;
}

QList<TaskContextMenuBackend::DesktopActionDescriptor>
TaskContextMenuBackend::descriptorsWithContext(
    const QList<DesktopActionDescriptor> &descriptors, const QUrl &launcherUrl,
    const QString &desktopEntryPath) const {
  QList<DesktopActionDescriptor> contextualDescriptors;
  contextualDescriptors.reserve(descriptors.size());
  for (DesktopActionDescriptor descriptor : descriptors) {
    descriptor.launcherUrl = launcherUrl.toString();
    descriptor.desktopEntryPath = desktopEntryPath;
    contextualDescriptors << descriptor;
  }

  return contextualDescriptors;
}

QVariantList TaskContextMenuBackend::desktopActionsFromDescriptors(
    const QList<DesktopActionDescriptor> &descriptors, QObject *parent) {
  QVariantList actions;
  if (!parent) {
    return actions;
  }

  for (const DesktopActionDescriptor &descriptor : descriptors) {
    auto *action = new QAction(parent);
    action->setText(descriptor.text);
    action->setIcon(QIcon::fromTheme(descriptor.iconName));
    action->setSeparator(descriptor.separator);

    connect(action, &QAction::triggered, action, [this, descriptor]() {
      auto *job = new KIO::ApplicationLauncherJob(descriptor.serviceAction);
      connect(job, &KJob::result, this, [this, descriptor](KJob *job) {
        if (!job || job->error() == 0) {
          return;
        }

        QVariantMap context{
            {QStringLiteral("launcherUrl"), descriptor.launcherUrl},
            {QStringLiteral("desktopEntryPath"), descriptor.desktopEntryPath},
            {QStringLiteral("desktopActionText"), descriptor.text},
            {QStringLiteral("errorCode"), job->error()},
            {QStringLiteral("errorMessage"), job->errorString()},
        };
        QVariantMap actionResult{
            {QStringLiteral("action"), QStringLiteral("desktopAction")},
            {QStringLiteral("code"),
             QStringLiteral("desktop-action-launch-failed")},
            {QStringLiteral("ok"), false},
            {QStringLiteral("diagnostic"), true},
            {QStringLiteral("context"), context},
        };
        Q_EMIT desktopActionResult(actionResult);
      });
      job->start();
    });

    actions << QVariant::fromValue(action);
  }

  return actions;
}
