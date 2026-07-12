// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "desktopactionlogic.h"

#include <QIcon>

QList<DesktopActionSource>
desktopActionSources(const QList<KServiceAction> &serviceActions) {
  QList<DesktopActionSource> sources;
  sources.reserve(serviceActions.size());
  for (const KServiceAction &serviceAction : serviceActions) {
    sources << DesktopActionSource{
        .text = serviceAction.text(),
        .iconName = serviceAction.icon(),
        .noDisplay = serviceAction.noDisplay(),
        .separator = serviceAction.isSeparator(),
        .serviceAction = serviceAction,
    };
  }
  return sources;
}

QList<DesktopActionDescriptor>
desktopActionDescriptors(const QList<DesktopActionSource> &sources) {
  QList<DesktopActionDescriptor> descriptors;
  for (const DesktopActionSource &source : sources) {
    if (source.noDisplay) {
      continue;
    }

    descriptors << DesktopActionDescriptor{
        .text = source.text,
        .iconName = source.iconName,
        .launcherUrl = {},
        .desktopEntryPath = {},
        .separator = source.separator,
        .serviceAction = source.serviceAction,
    };
  }

  return descriptors;
}

QList<DesktopActionDescriptor>
descriptorsWithContext(const QList<DesktopActionDescriptor> &descriptors,
                       const QUrl &launcherUrl,
                       const QString &desktopEntryPath) {
  QList<DesktopActionDescriptor> contextualDescriptors;
  contextualDescriptors.reserve(descriptors.size());
  for (DesktopActionDescriptor descriptor : descriptors) {
    descriptor.launcherUrl = launcherUrl.toString();
    descriptor.desktopEntryPath = desktopEntryPath;
    contextualDescriptors << descriptor;
  }

  return contextualDescriptors;
}

QVariantMap
desktopActionLaunchFailureResult(const DesktopActionDescriptor &descriptor,
                                 KJob *job) {
  const bool hasJob = job != nullptr;
  QVariantMap context{
      {QStringLiteral("launcherUrl"), descriptor.launcherUrl},
      {QStringLiteral("desktopEntryPath"), descriptor.desktopEntryPath},
      {QStringLiteral("desktopActionText"), descriptor.text},
      {QStringLiteral("errorCode"), hasJob ? job->error() : 0},
      {QStringLiteral("errorMessage"), hasJob ? job->errorString() : QString()},
  };
  return QVariantMap{
      {QStringLiteral("action"), QStringLiteral("desktopAction")},
      {QStringLiteral("code"), QStringLiteral("desktop-action-launch-failed")},
      {QStringLiteral("ok"), false},
      {QStringLiteral("diagnostic"), true},
      {QStringLiteral("context"), context},
  };
}

QAction *
desktopActionFromDescriptor(const DesktopActionDescriptor &descriptor,
                            QObject *parent, QObject *triggerContext,
                            const DesktopActionTriggerHandler &triggerHandler) {
  if (parent == nullptr || triggerContext == nullptr) {
    return nullptr;
  }

  auto *action = new QAction(parent);
  action->setText(descriptor.text);
  action->setIcon(QIcon::fromTheme(descriptor.iconName));
  action->setSeparator(descriptor.separator);

  QObject::connect(action, &QAction::triggered, triggerContext,
                   [descriptor, triggerHandler]() {
                     if (triggerHandler) {
                       triggerHandler(descriptor);
                     }
                   });

  return action;
}

QVariantList desktopActionsFromDescriptors(
    const QList<DesktopActionDescriptor> &descriptors, QObject *parent,
    QObject *triggerContext,
    const DesktopActionTriggerHandler &triggerHandler) {
  QVariantList actions;
  if (parent == nullptr) {
    return actions;
  }

  for (const DesktopActionDescriptor &descriptor : descriptors) {
    QAction *action = desktopActionFromDescriptor(
        descriptor, parent, triggerContext, triggerHandler);
    if (action != nullptr) {
      actions << QVariant::fromValue(action);
    }
  }

  return actions;
}
