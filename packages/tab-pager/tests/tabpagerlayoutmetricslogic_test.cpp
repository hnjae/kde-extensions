// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QFile>
#include <QJSEngine>
#include <QJSValue>
#include <QTest>

#include <cmath>

namespace {
constexpr double contentImplicitHeight = 17.0;
constexpr double contentImplicitWidth = 42.0;
constexpr double fillMinimumExtent = 1.0;
constexpr double finiteMaximumPlaceholder = 0.0;
constexpr double unsetPreferredExtent = -1.0;

QJSValue loadLayoutMetricsHelper(QJSEngine &engine) {
  QFile helperFile(
      QStringLiteral(":/package/contents/ui/PagerLayoutMetricsLogic.js"));
  if (!helperFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
    qFatal("Unable to load PagerLayoutMetricsLogic.js test resource");
  }

  const QJSValue result = engine.evaluate(
      QString::fromUtf8(helperFile.readAll()),
      QStringLiteral("qrc:/package/contents/ui/PagerLayoutMetricsLogic.js"));
  if (result.isError()) {
    qFatal("Unable to evaluate PagerLayoutMetricsLogic.js: %s",
           qPrintable(result.toString()));
  }

  QJSValue calculateLayoutMetrics =
      engine.globalObject().property(QStringLiteral("calculateLayoutMetrics"));
  if (!calculateLayoutMetrics.isCallable()) {
    qFatal("PagerLayoutMetricsLogic.js does not export "
           "calculateLayoutMetrics()");
  }
  return calculateLayoutMetrics;
}

void compareBoolProperty(const QJSValue &metrics, const QString &propertyName,
                         bool expected) {
  QCOMPARE(metrics.property(propertyName).toBool(), expected);
}

void compareDoubleProperty(const QJSValue &metrics, const QString &propertyName,
                           double expected) {
  QCOMPARE(metrics.property(propertyName).toNumber(), expected);
}

void compareInfiniteProperty(const QJSValue &metrics,
                             const QString &propertyName) {
  QVERIFY2(std::isinf(metrics.property(propertyName).toNumber()),
           qPrintable(propertyName));
}

void compareExtentProperty(const QJSValue &metrics, const QString &propertyName,
                           bool expectedInfinite, double expectedFiniteValue) {
  if (expectedInfinite) {
    compareInfiniteProperty(metrics, propertyName);
    return;
  }

  compareDoubleProperty(metrics, propertyName, expectedFiniteValue);
}
} // namespace

class TabPagerLayoutMetricsLogicTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesLayoutConstants_data();
  void exposesLayoutConstants();
  void calculatesPanelSizingContract_data();
  void calculatesPanelSizingContract();
};

void TabPagerLayoutMetricsLogicTest::exposesLayoutConstants_data() {
  QTest::addColumn<bool>("verticalPanel");

  QTest::newRow("horizontal panel") << false;
  QTest::newRow("vertical panel") << true;
}

void TabPagerLayoutMetricsLogicTest::exposesLayoutConstants() {
  QFETCH(bool, verticalPanel);

  QJSEngine engine;
  QJSValue calculateLayoutMetrics = loadLayoutMetricsHelper(engine);

  const QJSValue metrics = calculateLayoutMetrics.call(
      {QJSValue(verticalPanel), contentImplicitWidth, contentImplicitHeight});

  QCOMPARE(metrics.property(QStringLiteral("desktopGap")).toInt(), 1);
  QCOMPARE(metrics.property(QStringLiteral("fillMinimumExtent")).toNumber(),
           fillMinimumExtent);
  QCOMPARE(metrics.property(QStringLiteral("panelCrossAxisInset")).toInt(), 0);
  QCOMPARE(metrics.property(QStringLiteral("unsetPreferredExtent")).toNumber(),
           unsetPreferredExtent);
}

void TabPagerLayoutMetricsLogicTest::calculatesPanelSizingContract_data() {
  QTest::addColumn<bool>("verticalPanel");
  QTest::addColumn<bool>("fillWidth");
  QTest::addColumn<bool>("fillHeight");
  QTest::addColumn<double>("minimumWidth");
  QTest::addColumn<double>("preferredWidth");
  QTest::addColumn<bool>("maximumWidthIsInfinite");
  QTest::addColumn<double>("maximumWidth");
  QTest::addColumn<double>("minimumHeight");
  QTest::addColumn<double>("preferredHeight");
  QTest::addColumn<bool>("maximumHeightIsInfinite");
  QTest::addColumn<double>("maximumHeight");
  QTest::addColumn<bool>("useFillAreaConstraintHint");

  QTest::newRow("horizontal panel")
      << false << false << true << contentImplicitWidth << contentImplicitWidth
      << false << contentImplicitWidth << fillMinimumExtent
      << unsetPreferredExtent << true << finiteMaximumPlaceholder << false;
  QTest::newRow("vertical panel")
      << true << true << false << fillMinimumExtent << unsetPreferredExtent
      << true << finiteMaximumPlaceholder << contentImplicitHeight
      << contentImplicitHeight << false << contentImplicitHeight << true;
}

void TabPagerLayoutMetricsLogicTest::calculatesPanelSizingContract() {
  QFETCH(bool, verticalPanel);
  QFETCH(bool, fillWidth);
  QFETCH(bool, fillHeight);
  QFETCH(double, minimumWidth);
  QFETCH(double, preferredWidth);
  QFETCH(bool, maximumWidthIsInfinite);
  QFETCH(double, maximumWidth);
  QFETCH(double, minimumHeight);
  QFETCH(double, preferredHeight);
  QFETCH(bool, maximumHeightIsInfinite);
  QFETCH(double, maximumHeight);
  QFETCH(bool, useFillAreaConstraintHint);

  QJSEngine engine;
  QJSValue calculateLayoutMetrics = loadLayoutMetricsHelper(engine);

  const QJSValue metrics = calculateLayoutMetrics.call(
      {QJSValue(verticalPanel), contentImplicitWidth, contentImplicitHeight});

  compareBoolProperty(metrics, QStringLiteral("fillWidth"), fillWidth);
  compareBoolProperty(metrics, QStringLiteral("fillHeight"), fillHeight);
  compareDoubleProperty(metrics, QStringLiteral("minimumWidth"), minimumWidth);
  compareDoubleProperty(metrics, QStringLiteral("preferredWidth"),
                        preferredWidth);
  compareExtentProperty(metrics, QStringLiteral("maximumWidth"),
                        maximumWidthIsInfinite, maximumWidth);
  compareDoubleProperty(metrics, QStringLiteral("minimumHeight"),
                        minimumHeight);
  compareDoubleProperty(metrics, QStringLiteral("preferredHeight"),
                        preferredHeight);
  compareExtentProperty(metrics, QStringLiteral("maximumHeight"),
                        maximumHeightIsInfinite, maximumHeight);
  compareBoolProperty(metrics, QStringLiteral("useFillAreaConstraintHint"),
                      useFillAreaConstraintHint);
}

QTEST_MAIN(TabPagerLayoutMetricsLogicTest)

#include "tabpagerlayoutmetricslogic_test.moc"
