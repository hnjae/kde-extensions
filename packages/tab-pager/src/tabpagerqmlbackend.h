// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerbackend.h"

class TabPagerQmlBackend : public TabPagerBackend {
  Q_OBJECT

public:
  explicit TabPagerQmlBackend(QObject *parent = nullptr);
  ~TabPagerQmlBackend() override;
};
