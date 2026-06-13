// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QFile>
#include <QJSEngine>
#include <QJSValue>
#include <QTest>

namespace {
QJSValue loadWheelInputHelper(QJSEngine &engine) {
  QFile helperFile(
      QStringLiteral(":/package/contents/ui/TabPagerWheelInput.js"));
  if (!helperFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
    qFatal("Unable to load TabPagerWheelInput.js test resource");
  }

  const QJSValue result = engine.evaluate(
      QString::fromUtf8(helperFile.readAll()),
      QStringLiteral("qrc:/package/contents/ui/TabPagerWheelInput.js"));
  if (result.isError()) {
    qFatal("Unable to evaluate TabPagerWheelInput.js: %s",
           qPrintable(result.toString()));
  }

  QJSValue normalizeWheelDelta =
      engine.globalObject().property(QStringLiteral("normalizeWheelDelta"));
  if (!normalizeWheelDelta.isCallable()) {
    qFatal("TabPagerWheelInput.js does not export normalizeWheelDelta()");
  }
  return normalizeWheelDelta;
}
} // namespace

class TabPagerWheelInputTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void normalizesWheelDelta_data();
  void normalizesWheelDelta();
};

void TabPagerWheelInputTest::normalizesWheelDelta_data() {
  QTest::addColumn<int>("angleDeltaX");
  QTest::addColumn<int>("angleDeltaY");
  QTest::addColumn<bool>("inverted");
  QTest::addColumn<int>("expectedDelta");

  QTest::newRow("vertical") << 0 << 120 << false << 120;
  QTest::newRow("horizontal fallback") << 120 << 0 << false << 120;
  QTest::newRow("vertical preferred over horizontal")
      << 120 << -120 << false << -120;
  QTest::newRow("inverted vertical") << 0 << 120 << true << -120;
  QTest::newRow("inverted horizontal fallback") << 120 << 0 << true << -120;
  QTest::newRow("zero") << 0 << 0 << false << 0;
}

void TabPagerWheelInputTest::normalizesWheelDelta() {
  QFETCH(int, angleDeltaX);
  QFETCH(int, angleDeltaY);
  QFETCH(bool, inverted);
  QFETCH(int, expectedDelta);

  QJSEngine engine;
  QJSValue normalizeWheelDelta = loadWheelInputHelper(engine);

  QJSValue actual =
      normalizeWheelDelta.call({angleDeltaX, angleDeltaY, QJSValue(inverted)});

  QVERIFY2(!actual.isError(), qPrintable(actual.toString()));
  QCOMPARE(actual.toInt(), expectedDelta);
}

QTEST_MAIN(TabPagerWheelInputTest)

#include "tabpagerwheelinput_test.moc"
