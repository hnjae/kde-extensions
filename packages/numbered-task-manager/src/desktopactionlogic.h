// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <KJob>
#include <KServiceAction>

#include <QAction>
#include <QList>
#include <QObject>
#include <QString>
#include <QUrl>
#include <QVariantList>
#include <QVariantMap>

#include <functional>

struct DesktopActionSource {
  QString text;
  QString iconName;
  bool noDisplay = false;
  bool separator = false;
  KServiceAction serviceAction;
};

struct DesktopActionDescriptor {
  QString text;
  QString iconName;
  QString launcherUrl;
  QString desktopEntryPath;
  bool separator = false;
  KServiceAction serviceAction;
};

using DesktopActionJobFactory =
    std::function<KJob *(const DesktopActionDescriptor &descriptor)>;
using DesktopActionResultHandler =
    std::function<void(const QVariantMap &result)>;

[[nodiscard]] QList<DesktopActionSource>
desktopActionSources(const QList<KServiceAction> &serviceActions);
[[nodiscard]] QList<DesktopActionDescriptor>
desktopActionDescriptors(const QList<DesktopActionSource> &sources);
[[nodiscard]] QList<DesktopActionDescriptor>
descriptorsWithContext(const QList<DesktopActionDescriptor> &descriptors,
                       const QUrl &launcherUrl,
                       const QString &desktopEntryPath);
[[nodiscard]] QVariantMap
desktopActionLaunchFailureResult(const DesktopActionDescriptor &descriptor,
                                 KJob *job);
[[nodiscard]] QAction *
desktopActionFromDescriptor(const DesktopActionDescriptor &descriptor,
                            QObject *parent,
                            const DesktopActionJobFactory &jobFactory,
                            const DesktopActionResultHandler &resultHandler);
[[nodiscard]] QVariantList
desktopActionsFromDescriptors(const QList<DesktopActionDescriptor> &descriptors,
                              QObject *parent,
                              const DesktopActionJobFactory &jobFactory,
                              const DesktopActionResultHandler &resultHandler);
