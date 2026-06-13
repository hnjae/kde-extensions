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
  void cmakeInstallPathsUseCMakeIdentity();
  void nixMetadataMatchesCMakeIdentity();
};

void TabPagerMetadataTest::packageMetadataMatchesCMakeIdentity() {
  const QJsonObject plugin = packagePluginMetadata();

  QCOMPARE(plugin.value(QStringLiteral("Id")).toString(),
           QStringLiteral(TABPAGER_PLASMOID_ID));
  QCOMPARE(plugin.value(QStringLiteral("Version")).toString(),
           QStringLiteral(TABPAGER_VERSION));
}

void TabPagerMetadataTest::qmlModuleMetadataMatchesCMakeIdentity() {
  const QString qmldir = readSourceFile(QStringLiteral("src/qmldir"));
  const QString qmltypes =
      readSourceFile(QStringLiteral("src/tabpagerplugin.qmltypes"));

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

void TabPagerMetadataTest::cmakeInstallPathsUseCMakeIdentity() {
  const QString cmake = readSourceFile(QStringLiteral("CMakeLists.txt"));

  QVERIFY2(
      cmake.contains(QStringLiteral("${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}")),
      "CMake QML install destination should use QML_MODULE_DIR");
  QVERIFY2(cmake.contains(QStringLiteral(
               "${KDE_INSTALL_DATADIR}/plasma/plasmoids/${PLASMOID_ID}")),
           "CMake plasmoid install destination should use PLASMOID_ID");
}

void TabPagerMetadataTest::nixMetadataMatchesCMakeIdentity() {
  const QString packageNix =
      readSourceFile(QStringLiteral("nix/module/package.nix"));
  const QString ciNix =
      readSourceFile(QStringLiteral("nix/lib/tab-pager-ci.nix"));

  QCOMPARE(firstCapturedValue(packageNix,
                              QStringLiteral("pluginId\\s*=\\s*\"([^\"]+)\""),
                              QStringLiteral("Nix pluginId")),
           QStringLiteral(TABPAGER_PLASMOID_ID));
  QCOMPARE(firstCapturedValue(packageNix,
                              QStringLiteral("version\\s*=\\s*\"([^\"]+)\""),
                              QStringLiteral("Nix version")),
           QStringLiteral(TABPAGER_VERSION));
  QVERIFY2(packageNix.contains(QStringLiteral(
               "qmlModuleDir = lib.replaceStrings [ \".\" ] [ \"/\" ] "
               "pluginId;")),
           "Nix qmlModuleDir should be derived from pluginId");
  QVERIFY2(ciNix.contains(QStringLiteral("${package.pluginId}")),
           "Nix kpackage check should use package.pluginId");
  QVERIFY2(ciNix.contains(QStringLiteral("${package.qmlModuleDir}")),
           "Nix qml check should use package.qmlModuleDir");
  QVERIFY2(!ciNix.contains(QStringLiteral("io/github/hnjae/tabpager")),
           "Nix qml check should not repeat the concrete QML module path");
}

QTEST_MAIN(TabPagerMetadataTest)

#include "tabpagermetadata_test.moc"
