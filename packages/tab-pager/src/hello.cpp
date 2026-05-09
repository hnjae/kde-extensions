// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QCoreApplication>
#include <QTextStream>

int main(int argc, char *argv[]) {
  QCoreApplication app(argc, argv);
  TabPagerBackend backend;

  QTextStream(stdout) << backend.greeting() << Qt::endl;

  return 0;
}
