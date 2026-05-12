// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopsource.h"

#include <memory>

class TaskManagerDesktopSource final : public TabPagerDesktopSource {
  Q_OBJECT

public:
  explicit TaskManagerDesktopSource(QObject *parent = nullptr);
  ~TaskManagerDesktopSource() override;

  [[nodiscard]] TabPagerDesktopSnapshot desktopSnapshot() const override;
  [[nodiscard]] bool navigationWrappingAround() const override;
  void activateDesktop(const QVariant &desktopId) override;

private:
  class Private;
  std::unique_ptr<Private> d;
};
