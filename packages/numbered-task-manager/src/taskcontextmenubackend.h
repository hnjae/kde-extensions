// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <QObject>
#include <QUrl>
#include <QVariantList>
#include <QVariantMap>

class DesktopActionJobOwner;

class TaskContextMenuBackend : public QObject {
  Q_OBJECT

public:
  explicit TaskContextMenuBackend(QObject *parent = nullptr);
  ~TaskContextMenuBackend() override;

  Q_INVOKABLE QVariantList desktopActions(const QUrl &launcherUrl,
                                          QObject *parent);

  Q_SIGNAL void desktopActionResult(const QVariantMap &result);

private:
  [[nodiscard]] QUrl desktopEntryUrl(const QUrl &launcherUrl) const;

  DesktopActionJobOwner *m_desktopActionJobOwner = nullptr;
};
