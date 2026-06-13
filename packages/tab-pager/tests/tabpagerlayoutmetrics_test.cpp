// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QLibraryInfo>
#include <QQmlComponent>
#include <QQmlEngine>
#include <QTest>

#include <memory>

class TabPagerLayoutMetricsTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void bindsLayoutMetricsHelper_data();
  void bindsLayoutMetricsHelper();
};

namespace {

constexpr double contentImplicitHeight = 17.0;
constexpr double contentImplicitWidth = 42.0;
constexpr double fillMinimumExtent = 1.0;
constexpr double horizontalPreferredWidth = contentImplicitWidth;
constexpr double unsetPreferredExtent = -1.0;
constexpr double verticalMinimumHeight = contentImplicitHeight;

std::unique_ptr<QObject> createPagerLayoutMetrics(QQmlEngine &engine,
                                                  bool verticalPanel,
                                                  QString *errorString) {
  QQmlComponent component(&engine,
                          QUrl::fromLocalFile(QStringLiteral(
                              TABPAGER_SOURCE_DIR "/package/contents/ui/"
                                                  "PagerLayoutMetrics.qml")));

  if (!component.isReady()) {
    *errorString = component.errorString();
    return nullptr;
  }

  const QVariantMap initialProperties = {
      {QStringLiteral("verticalPanel"), verticalPanel},
      {QStringLiteral("contentImplicitWidth"), contentImplicitWidth},
      {QStringLiteral("contentImplicitHeight"), contentImplicitHeight},
  };
  std::unique_ptr<QObject> metrics(
      component.createWithInitialProperties(initialProperties));
  if (metrics == nullptr) {
    *errorString = component.errorString();
  }
  return metrics;
}

} // namespace

void TabPagerLayoutMetricsTest::bindsLayoutMetricsHelper_data() {
  QTest::addColumn<bool>("verticalPanel");
  QTest::addColumn<bool>("fillWidth");
  QTest::addColumn<bool>("fillHeight");
  QTest::addColumn<QString>("extentPropertyName");
  QTest::addColumn<double>("extentPropertyValue");

  QTest::newRow("horizontal panel")
      << false << false << true << QStringLiteral("preferredWidth")
      << horizontalPreferredWidth;
  QTest::newRow("vertical panel")
      << true << true << false << QStringLiteral("minimumHeight")
      << verticalMinimumHeight;
}

void TabPagerLayoutMetricsTest::bindsLayoutMetricsHelper() {
  QFETCH(bool, verticalPanel);
  QFETCH(bool, fillWidth);
  QFETCH(bool, fillHeight);
  QFETCH(QString, extentPropertyName);
  QFETCH(double, extentPropertyValue);

  QString errorString;
  QQmlEngine engine;
  engine.addImportPath(QLibraryInfo::path(QLibraryInfo::QmlImportsPath));
  engine.addImportPath(QStringLiteral(TABPAGER_QML_IMPORT_PATH));

  std::unique_ptr<QObject> metrics =
      createPagerLayoutMetrics(engine, verticalPanel, &errorString);
  QVERIFY2(metrics != nullptr, qPrintable(errorString));
  QCOMPARE(metrics->property("desktopGap").toInt(), 1);
  QCOMPARE(metrics->property("fillMinimumExtent").toDouble(),
           fillMinimumExtent);
  QCOMPARE(metrics->property("panelCrossAxisInset").toInt(), 0);
  QCOMPARE(metrics->property("unsetPreferredExtent").toDouble(),
           unsetPreferredExtent);
  QCOMPARE(metrics->property("fillWidth").toBool(), fillWidth);
  QCOMPARE(metrics->property("fillHeight").toBool(), fillHeight);
  QCOMPARE(metrics->property(qPrintable(extentPropertyName)).toDouble(),
           extentPropertyValue);
}

QTEST_MAIN(TabPagerLayoutMetricsTest)

#include "tabpagerlayoutmetrics_test.moc"
