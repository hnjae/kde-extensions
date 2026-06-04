// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QLibraryInfo>
#include <QQmlComponent>
#include <QQmlEngine>
#include <QTest>

#include <cmath>
#include <memory>

class TabPagerLayoutMetricsTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesKdePagerSpacing_data();
  void exposesKdePagerSpacing();
  void exposesPanelSizingContract_data();
  void exposesPanelSizingContract();
};

namespace {

constexpr double contentImplicitHeight = 17.0;
constexpr double contentImplicitWidth = 42.0;
constexpr double fillMinimumExtent = 1.0;
constexpr double finiteMaximumPlaceholder = 0.0;
constexpr double unsetPreferredExtent = -1.0;

void comparePagerLayoutMetrics(const QObject &metrics) {
  QCOMPARE(metrics.property("desktopGap").toInt(), 1);
  QCOMPARE(metrics.property("panelCrossAxisInset").toInt(), 0);
}

void compareBoolProperty(const QObject &metrics, const char *propertyName,
                         bool expected) {
  QCOMPARE(metrics.property(propertyName).toBool(), expected);
}

void compareDoubleProperty(const QObject &metrics, const char *propertyName,
                           double expected) {
  QCOMPARE(metrics.property(propertyName).toDouble(), expected);
}

void compareInfiniteProperty(const QObject &metrics, const char *propertyName) {
  QVERIFY2(std::isinf(metrics.property(propertyName).toDouble()), propertyName);
}

void compareExtentProperty(const QObject &metrics, const char *propertyName,
                           bool expectedInfinite, double expectedFiniteValue) {
  if (expectedInfinite) {
    compareInfiniteProperty(metrics, propertyName);
    return;
  }

  compareDoubleProperty(metrics, propertyName, expectedFiniteValue);
}

} // namespace

void TabPagerLayoutMetricsTest::exposesKdePagerSpacing_data() {
  QTest::addColumn<bool>("verticalPanel");

  QTest::newRow("horizontal panel") << false;
  QTest::newRow("vertical panel") << true;
}

void TabPagerLayoutMetricsTest::exposesKdePagerSpacing() {
  QFETCH(bool, verticalPanel);

  QQmlEngine engine;
  engine.addImportPath(QLibraryInfo::path(QLibraryInfo::QmlImportsPath));
  engine.addImportPath(QStringLiteral(TABPAGER_QML_IMPORT_PATH));

  QQmlComponent component(&engine,
                          QUrl::fromLocalFile(QStringLiteral(
                              TABPAGER_SOURCE_DIR "/package/contents/ui/"
                                                  "PagerLayoutMetrics.qml")));

  QVERIFY2(component.isReady(), qPrintable(component.errorString()));

  const QVariantMap initialProperties = {
      {QStringLiteral("verticalPanel"), verticalPanel},
  };
  std::unique_ptr<QObject> metrics(
      component.createWithInitialProperties(initialProperties));

  QVERIFY2(metrics != nullptr, qPrintable(component.errorString()));
  comparePagerLayoutMetrics(*metrics);
}

void TabPagerLayoutMetricsTest::exposesPanelSizingContract_data() {
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

void TabPagerLayoutMetricsTest::exposesPanelSizingContract() {
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

  QQmlEngine engine;
  engine.addImportPath(QLibraryInfo::path(QLibraryInfo::QmlImportsPath));
  engine.addImportPath(QStringLiteral(TABPAGER_QML_IMPORT_PATH));

  QQmlComponent component(&engine,
                          QUrl::fromLocalFile(QStringLiteral(
                              TABPAGER_SOURCE_DIR "/package/contents/ui/"
                                                  "PagerLayoutMetrics.qml")));

  QVERIFY2(component.isReady(), qPrintable(component.errorString()));

  const QVariantMap initialProperties = {
      {QStringLiteral("verticalPanel"), verticalPanel},
      {QStringLiteral("contentImplicitWidth"), contentImplicitWidth},
      {QStringLiteral("contentImplicitHeight"), contentImplicitHeight},
  };
  std::unique_ptr<QObject> metrics(
      component.createWithInitialProperties(initialProperties));

  QVERIFY2(metrics != nullptr, qPrintable(component.errorString()));
  compareBoolProperty(*metrics, "fillWidth", fillWidth);
  compareBoolProperty(*metrics, "fillHeight", fillHeight);
  compareDoubleProperty(*metrics, "minimumWidth", minimumWidth);
  compareDoubleProperty(*metrics, "preferredWidth", preferredWidth);
  compareExtentProperty(*metrics, "maximumWidth", maximumWidthIsInfinite,
                        maximumWidth);
  compareDoubleProperty(*metrics, "minimumHeight", minimumHeight);
  compareDoubleProperty(*metrics, "preferredHeight", preferredHeight);
  compareExtentProperty(*metrics, "maximumHeight", maximumHeightIsInfinite,
                        maximumHeight);
  compareBoolProperty(*metrics, "useFillAreaConstraintHint",
                      useFillAreaConstraintHint);
}

QTEST_MAIN(TabPagerLayoutMetricsTest)

#include "tabpagerlayoutmetrics_test.moc"
