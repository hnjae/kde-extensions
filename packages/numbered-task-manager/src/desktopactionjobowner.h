// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "desktopactionlogic.h"

#include <QObject>
#include <QSet>

class DesktopActionJobOwner final : public QObject {
public:
  explicit DesktopActionJobOwner(DesktopActionJobFactory jobFactory,
                                 DesktopActionResultHandler resultHandler,
                                 QObject *parent = nullptr);
  ~DesktopActionJobOwner() override;

  void launch(const DesktopActionDescriptor &descriptor);
  [[nodiscard]] qsizetype activeJobCount() const;

private:
  DesktopActionJobFactory m_jobFactory;
  DesktopActionResultHandler m_resultHandler;
  QSet<KJob *> m_activeJobs;
};
