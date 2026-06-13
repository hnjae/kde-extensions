// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktop.h"

#include <QObject>

struct TabPagerDesktopSourceState {
  TabPagerDesktopSnapshot desktopSnapshot;
};

class TabPagerDesktopSource : public QObject {
  Q_OBJECT

public:
  explicit TabPagerDesktopSource(QObject *parent = nullptr);
  ~TabPagerDesktopSource() override;

  [[nodiscard]] virtual TabPagerDesktopSourceState sourceState() const = 0;
  [[nodiscard]] virtual bool sourceHasDiagnostics() const = 0;
  virtual void activateDesktop(const TabPagerDesktopId &desktopId) = 0;

Q_SIGNALS:
  void sourceStateChanged();
  void sourceDiagnosticsChanged();
};
