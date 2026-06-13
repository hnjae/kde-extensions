// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopsource.h"
#include "tabpagervirtualdesktopinfo.h"
#include "taskmanagerdesktopmapper.h"

#include <memory>

class TaskManagerDesktopSource final : public TabPagerDesktopSource {
  Q_OBJECT

public:
  explicit TaskManagerDesktopSource(QObject *parent = nullptr);
  explicit TaskManagerDesktopSource(
      std::unique_ptr<TabPagerVirtualDesktopInfo> info,
      QObject *parent = nullptr);
  ~TaskManagerDesktopSource() override;

  [[nodiscard]] TabPagerDesktopSourceState sourceState() const override;
  [[nodiscard]] bool navigationWrappingAround() const override;
  [[nodiscard]] QList<TaskManagerDesktopSourceDiagnostic>
  sourceDiagnostics() const;
  void activateDesktop(const TabPagerDesktopId &desktopId) override;

private:
  void connectDesktopInfo();
  void logDiagnosticsIfChanged(
      const QList<TaskManagerDesktopSourceDiagnostic> &diagnostics) const;

  std::unique_ptr<TabPagerVirtualDesktopInfo> m_info;
  mutable QList<TaskManagerDesktopSourceDiagnostic> m_loggedDiagnostics;
  mutable bool m_hasLoggedDiagnostics = false;
};
