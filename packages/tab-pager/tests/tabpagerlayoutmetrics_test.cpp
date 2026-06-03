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
  void exposesKdePagerSpacing_data();
  void exposesKdePagerSpacing();
};

namespace {

void comparePagerLayoutMetrics(const QObject &metrics) {
  QCOMPARE(metrics.property("desktopGap").toInt(), 1);
  QCOMPARE(metrics.property("panelCrossAxisInset").toInt(), 0);
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

QTEST_MAIN(TabPagerLayoutMetricsTest)

#include "tabpagerlayoutmetrics_test.moc"
