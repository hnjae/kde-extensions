// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <KServiceAction>

#include <QObject>
#include <QString>
#include <QUrl>
#include <QVariantList>
#include <QVariantMap>

class TaskContextMenuBackend : public QObject {
  Q_OBJECT

public:
  struct DesktopActionDescriptor {
    QString text;
    QString iconName;
    QString launcherUrl;
    QString desktopEntryPath;
    bool separator = false;
    KServiceAction serviceAction;
  };

  explicit TaskContextMenuBackend(QObject *parent = nullptr);
  ~TaskContextMenuBackend() override;

  Q_INVOKABLE QVariantList desktopActions(const QUrl &launcherUrl,
                                          QObject *parent);

  Q_SIGNAL void desktopActionResult(const QVariantMap &result);

private:
  [[nodiscard]] QList<DesktopActionDescriptor>
  desktopActionDescriptors(const QList<KServiceAction> &serviceActions) const;
  [[nodiscard]] QList<DesktopActionDescriptor>
  descriptorsWithContext(const QList<DesktopActionDescriptor> &descriptors,
                         const QUrl &launcherUrl,
                         const QString &desktopEntryPath) const;
  [[nodiscard]] QVariantList desktopActionsFromDescriptors(
      const QList<DesktopActionDescriptor> &descriptors, QObject *parent);
  [[nodiscard]] QUrl desktopEntryUrl(const QUrl &launcherUrl) const;
};
