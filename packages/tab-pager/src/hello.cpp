// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QCoreApplication>
#include <QTextStream>

int main(int argc, char *argv[]) {
  QCoreApplication app(argc, argv);
  QTextStream(stdout) << TabPagerBackend::labelForDesktop(
                             1, QStringLiteral("Desktop 1"))
                      << Qt::endl;

  return 0;
}
