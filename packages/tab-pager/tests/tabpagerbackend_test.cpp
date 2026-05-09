// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QTest>

class TabPagerBackendTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesConstants();
  void formatsGreeting_data();
  void formatsGreeting();
};

void TabPagerBackendTest::exposesConstants() {
  const TabPagerBackend backend;

  QCOMPARE(backend.pluginId(),
           QStringLiteral("com.example.plasmaextensions.tab-pager"));
  QCOMPARE(backend.greeting(), QStringLiteral("Hello from C++/QML"));
}

void TabPagerBackendTest::formatsGreeting_data() {
  QTest::addColumn<QString>("target");
  QTest::addColumn<QString>("expected");

  QTest::newRow("named target")
      << QStringLiteral("Pager") << QStringLiteral("Hello from Pager");
  QTest::newRow("trimmed target")
      << QStringLiteral("  Plasma  ") << QStringLiteral("Hello from Plasma");
  QTest::newRow("empty target")
      << QString() << QStringLiteral("Hello from C++/QML");
  QTest::newRow("blank target")
      << QStringLiteral("  ") << QStringLiteral("Hello from C++/QML");
}

void TabPagerBackendTest::formatsGreeting() {
  QFETCH(QString, target);
  QFETCH(QString, expected);

  const TabPagerBackend backend;

  QCOMPARE(backend.greetingFor(target), expected);
}

QTEST_MAIN(TabPagerBackendTest)

#include "tabpagerbackend_test.moc"
