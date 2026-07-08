// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QRegularExpression>
#include <QString>
#include <QTest>

namespace {
QString readSourceFile(const QString &relativePath) {
  QFile file(QStringLiteral(TABPAGER_SOURCE_DIR) + QLatin1Char('/') +
             relativePath);
  if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
    qFatal("Unable to read %s", qPrintable(relativePath));
  }
  return QString::fromUtf8(file.readAll());
}

QString readBuildFile(const QString &relativePath) {
  QFile file(QStringLiteral(TABPAGER_BUILD_DIR) + QLatin1Char('/') +
             relativePath);
  if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
    qFatal("Unable to read build file %s", qPrintable(relativePath));
  }
  return QString::fromUtf8(file.readAll());
}

QString firstCapturedValue(const QString &text, const QString &pattern,
                           const QString &description) {
  const QRegularExpression expression(pattern);
  const QRegularExpressionMatch match = expression.match(text);
  if (!match.hasMatch()) {
    qFatal("Unable to find %s", qPrintable(description));
  }
  return match.captured(1);
}

QJsonObject packagePluginMetadata() {
  const QJsonDocument document = QJsonDocument::fromJson(
      readSourceFile(QStringLiteral("package/metadata.json")).toUtf8());
  return document.object().value(QStringLiteral("KPlugin")).toObject();
}
} // namespace

class TabPagerMetadataTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void packageMetadataMatchesCMakeIdentity();
  void qmlModuleMetadataMatchesCMakeIdentity();
  void plasmoidMainQmlUsesCMakeIdentity();
};

void TabPagerMetadataTest::packageMetadataMatchesCMakeIdentity() {
  const QJsonObject plugin = packagePluginMetadata();

  QCOMPARE(plugin.value(QStringLiteral("Id")).toString(),
           QStringLiteral(TABPAGER_PLASMOID_ID));
  QCOMPARE(plugin.value(QStringLiteral("Version")).toString(),
           QStringLiteral(TABPAGER_VERSION));
}

void TabPagerMetadataTest::qmlModuleMetadataMatchesCMakeIdentity() {
  const QString qmldir = readBuildFile(QStringLiteral("src/qmldir"));
  const QString qmltypes =
      readBuildFile(QStringLiteral("src/tabpagerplugin.qmltypes"));

  QCOMPARE(firstCapturedValue(qmldir, QStringLiteral("^module\\s+([^\\n]+)"),
                              QStringLiteral("qmldir module")),
           QStringLiteral(TABPAGER_QML_URI));
  QCOMPARE(firstCapturedValue(qmltypes,
                              QStringLiteral("exports:\\s*\\[\"([^\"]+)\"\\]"),
                              QStringLiteral("qmltypes export")),
           QStringLiteral(TABPAGER_QML_URI) +
               QStringLiteral("/TabPagerBackend 1.0"));
  QCOMPARE(QStringLiteral(TABPAGER_QML_MODULE_DIR),
           QStringLiteral(TABPAGER_QML_URI)
               .replace(QLatin1Char('.'), QLatin1Char('/')));
}

void TabPagerMetadataTest::plasmoidMainQmlUsesCMakeIdentity() {
  const QString mainQml =
      readBuildFile(QStringLiteral("package/contents/ui/main.qml"));

  QVERIFY2(mainQml.contains(
               QStringLiteral("import " TABPAGER_QML_URI " as TabPager")),
           "generated main.qml should import the configured QML module URI");
  QVERIFY2(mainQml.contains(QStringLiteral("TabPager.TabPagerBackend")),
           "generated main.qml should still instantiate the backend");
}

QTEST_MAIN(TabPagerMetadataTest)

#include "tabpagermetadata_test.moc"
