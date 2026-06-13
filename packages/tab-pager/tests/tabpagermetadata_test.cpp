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
  const QString qmldirTemplate =
      readSourceFile(QStringLiteral("src/qmldir.in"));
  const QString qmldir = readBuildFile(QStringLiteral("src/qmldir"));
  const QString qmltypesTemplate =
      readSourceFile(QStringLiteral("src/tabpagerplugin.qmltypes.in"));
  const QString qmltypes =
      readBuildFile(QStringLiteral("src/tabpagerplugin.qmltypes"));

  QVERIFY2(qmldirTemplate.contains(QStringLiteral("module @QML_MODULE_URI@")),
           "qmldir template should derive module URI from CMake");
  QVERIFY2(!qmldirTemplate.contains(QStringLiteral(TABPAGER_QML_URI)),
           "qmldir template should not repeat the concrete QML module URI");
  QVERIFY2(qmltypesTemplate.contains(
               QStringLiteral("@QML_MODULE_URI@/TabPagerBackend 1.0")),
           "qmltypes template should derive export URI from CMake");
  QVERIFY2(!qmltypesTemplate.contains(QStringLiteral(TABPAGER_QML_URI)),
           "qmltypes template should not repeat the concrete QML module URI");
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
  const QString mainQmlTemplate =
      readSourceFile(QStringLiteral("package/contents/ui/main.qml.in"));
  const QString mainQml =
      readBuildFile(QStringLiteral("package/contents/ui/main.qml"));

  QVERIFY2(mainQmlTemplate.contains(
               QStringLiteral("import @QML_MODULE_URI@ as TabPager")),
           "main.qml template should derive import URI from CMake");
  QVERIFY2(!mainQmlTemplate.contains(QStringLiteral(TABPAGER_QML_URI)),
           "main.qml template should not repeat the concrete QML module URI");
  QVERIFY2(mainQml.contains(
               QStringLiteral("import " TABPAGER_QML_URI " as TabPager")),
           "generated main.qml should import the configured QML module URI");
  QVERIFY2(mainQml.contains(QStringLiteral("TabPager.TabPagerBackend")),
           "generated main.qml should still instantiate the backend");
}

void TabPagerMetadataTest::cmakeInstallPathsUseCMakeIdentity() {
  const QString cmake = readSourceFile(QStringLiteral("CMakeLists.txt"));

  QVERIFY2(
      cmake.contains(QStringLiteral(
          "file(READ \"${CMAKE_CURRENT_SOURCE_DIR}/package/metadata.json\" "
          "TABPAGER_PACKAGE_METADATA_JSON)")),
      "CMake package metadata should be read from package/metadata.json");
  QVERIFY2(cmake.contains(QStringLiteral(
               "string(JSON PLASMOID_ID GET "
               "\"${TABPAGER_PACKAGE_METADATA_JSON}\" KPlugin Id)")),
           "CMake PLASMOID_ID should be derived from package metadata");
  QVERIFY2(cmake.contains(QStringLiteral(
               "string(JSON TABPAGER_VERSION GET "
               "\"${TABPAGER_PACKAGE_METADATA_JSON}\" KPlugin Version)")),
           "CMake project version should be derived from package metadata");
  QVERIFY2(
      cmake.contains(QStringLiteral("set(QML_MODULE_URI \"${PLASMOID_ID}\")")),
      "CMake QML module URI should be derived from PLASMOID_ID");
  QVERIFY2(
      cmake.contains(QStringLiteral("string(REPLACE \".\" \"/\" QML_MODULE_DIR "
                                    "\"${QML_MODULE_URI}\")")),
      "CMake QML module dir should be derived from QML_MODULE_URI");
  QVERIFY2(
      !cmake.contains(QStringLiteral("VERSION " TABPAGER_VERSION " LANGUAGES")),
      "CMake project version should not repeat the concrete package "
      "version");
  QVERIFY2(!cmake.contains(
               QStringLiteral("set(QML_MODULE_URI \"" TABPAGER_QML_URI "\")")),
           "CMake QML module URI should not repeat the concrete package id");
  QVERIFY2(!cmake.contains(
               QStringLiteral("set(PLASMOID_ID \"" TABPAGER_PLASMOID_ID "\")")),
           "CMake plasmoid id should not repeat the concrete package id");
  QVERIFY2(
      cmake.contains(QStringLiteral("${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}")),
      "CMake QML install destination should use QML_MODULE_DIR");
  QVERIFY2(cmake.contains(QStringLiteral(
               "configure_file(src/qmldir.in src/qmldir @ONLY)")),
           "CMake should configure qmldir from QML_MODULE_URI");
  QVERIFY2(
      cmake.contains(QStringLiteral("${CMAKE_CURRENT_BINARY_DIR}/src/qmldir")),
      "CMake should install the generated qmldir");
  QVERIFY2(cmake.contains(
               QStringLiteral("configure_file(src/tabpagerplugin.qmltypes.in "
                              "src/tabpagerplugin.qmltypes @ONLY)")),
           "CMake should configure qmltypes from QML_MODULE_URI");
  QVERIFY2(cmake.contains(QStringLiteral(
               "${CMAKE_CURRENT_BINARY_DIR}/src/tabpagerplugin.qmltypes")),
           "CMake should install the generated qmltypes");
  QVERIFY2(cmake.contains(
               QStringLiteral("configure_file(package/contents/ui/main.qml.in "
                              "package/contents/ui/main.qml @ONLY)")),
           "CMake should configure main.qml from QML_MODULE_URI");
  QVERIFY2(cmake.contains(QStringLiteral(
               "${CMAKE_CURRENT_BINARY_DIR}/package/contents/ui/main.qml")),
           "CMake should install the generated main.qml");
  QVERIFY2(cmake.contains(QStringLiteral(
               "${KDE_INSTALL_DATADIR}/plasma/plasmoids/${PLASMOID_ID}")),
           "CMake plasmoid install destination should use PLASMOID_ID");
}

void TabPagerMetadataTest::nixMetadataMatchesCMakeIdentity() {
  const QString packageNix =
      readSourceFile(QStringLiteral("nix/module/package.nix"));
  const QString ciNix =
      readSourceFile(QStringLiteral("nix/lib/tab-pager-ci.nix"));

  QVERIFY2(packageNix.contains(QStringLiteral(
               "packageMetadata = builtins.fromJSON "
               "(builtins.readFile ../../package/metadata.json);")),
           "Nix package metadata should be read from package/metadata.json");
  QVERIFY2(packageNix.contains(
               QStringLiteral("pluginId = packageMetadata.KPlugin.Id;")),
           "Nix pluginId should be derived from package metadata");
  QVERIFY2(packageNix.contains(
               QStringLiteral("version = packageMetadata.KPlugin.Version;")),
           "Nix version should be derived from package metadata");
  QVERIFY2(!packageNix.contains(
               QStringLiteral("pluginId = \"" TABPAGER_PLASMOID_ID "\";")),
           "Nix pluginId should not repeat the concrete package id");
  QVERIFY2(!packageNix.contains(
               QStringLiteral("version = \"" TABPAGER_VERSION "\";")),
           "Nix version should not repeat the concrete package version");
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
