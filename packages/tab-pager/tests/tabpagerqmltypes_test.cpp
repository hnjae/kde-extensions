// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QFile>
#include <QRegularExpression>
#include <QString>
#include <QStringList>
#include <QTest>

#include <algorithm>

namespace {

struct QmlParameter {
  QString name;
  QString type;

  friend bool operator==(const QmlParameter &, const QmlParameter &) = default;
};

struct QmlMethod {
  QString name;
  QList<QmlParameter> parameters;

  friend bool operator==(const QmlMethod &, const QmlMethod &) = default;
};

struct QmlProperty {
  QString name;
  QString type;
  bool isPointer = false;
  bool isReadonly = false;

  friend bool operator==(const QmlProperty &, const QmlProperty &) = default;
};

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

QStringList splitArguments(const QString &arguments) {
  if (arguments.trimmed().isEmpty()) {
    return {};
  }

  const auto parts = arguments.split(QLatin1Char(','));
  QStringList result;
  result.reserve(parts.size());
  for (const auto &part : parts) {
    result.append(part.trimmed());
  }
  return result;
}

QString qmlTypeForCppType(QString type) {
  type.remove(QLatin1Char('*'));
  type.remove(QLatin1Char('&'));
  return type.trimmed();
}

QList<QmlParameter> cppParametersFromSignature(const QString &arguments) {
  QList<QmlParameter> parameters;
  for (const auto &argument : splitArguments(arguments)) {
    const auto spaceIndex = argument.lastIndexOf(QLatin1Char(' '));
    if (spaceIndex < 0) {
      qFatal("Unable to parse Q_INVOKABLE argument %s", qPrintable(argument));
    }
    parameters.append({argument.mid(spaceIndex + 1).trimmed(),
                       qmlTypeForCppType(argument.left(spaceIndex))});
  }
  return parameters;
}

QList<QmlProperty> backendHeaderProperties(const QString &header) {
  QList<QmlProperty> properties;
  const QRegularExpression propertyExpression(
      QStringLiteral("Q_PROPERTY\\(([^)]*)\\)"),
      QRegularExpression::DotMatchesEverythingOption);

  auto matchIterator = propertyExpression.globalMatch(header);
  while (matchIterator.hasNext()) {
    const auto declaration = matchIterator.next().captured(1).simplified();
    const auto readIndex = declaration.indexOf(QStringLiteral(" READ "));
    if (readIndex < 0) {
      qFatal("Q_PROPERTY without READ is not covered: %s",
             qPrintable(declaration));
    }

    auto typedName = declaration.left(readIndex).trimmed();
    const bool isPointer = typedName.contains(QLatin1Char('*'));
    typedName.replace(QLatin1Char('*'), QStringLiteral(" * "));
    const auto tokens = typedName.simplified().split(QLatin1Char(' '));
    if (tokens.size() < 2) {
      qFatal("Unable to parse Q_PROPERTY declaration %s",
             qPrintable(declaration));
    }

    properties.append(
        {tokens.last(),
         qmlTypeForCppType(
             tokens.mid(0, tokens.size() - 1).join(QLatin1Char(' '))),
         isPointer, !declaration.contains(QStringLiteral(" WRITE "))});
  }
  return properties;
}

QList<QmlMethod> backendHeaderInvokables(const QString &header) {
  QList<QmlMethod> methods;
  const QRegularExpression invokableExpression(
      QStringLiteral("Q_INVOKABLE\\s+\\w+\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*;"));

  auto matchIterator = invokableExpression.globalMatch(header);
  while (matchIterator.hasNext()) {
    const auto match = matchIterator.next();
    methods.append(
        {match.captured(1), cppParametersFromSignature(match.captured(2))});
  }
  return methods;
}

QString backendHeaderSignalSection(const QString &header) {
  const auto signalIndex = header.indexOf(QStringLiteral("Q_SIGNALS:"));
  const auto privateIndex =
      header.indexOf(QStringLiteral("private:"), signalIndex);
  if (signalIndex < 0 || privateIndex < 0) {
    qFatal("Unable to locate TabPagerBackend signal section");
  }
  return header.mid(signalIndex, privateIndex - signalIndex);
}

QStringList backendHeaderSignals(const QString &header) {
  QStringList signals;
  const QRegularExpression signalExpression(
      QStringLiteral("\\bvoid\\s+(\\w+)\\s*\\([^)]*\\)\\s*;"));

  auto matchIterator =
      signalExpression.globalMatch(backendHeaderSignalSection(header));
  while (matchIterator.hasNext()) {
    signals.append(matchIterator.next().captured(1));
  }
  return signals;
}

QList<QmlProperty> qmltypesProperties(const QString &qmltypes) {
  QList<QmlProperty> properties;
  const QRegularExpression propertyExpression(
      QStringLiteral("Property\\s*\\{([^}]*)\\}"),
      QRegularExpression::DotMatchesEverythingOption);
  const QRegularExpression nameExpression(
      QStringLiteral("name:\\s*\"([^\"]+)\""));
  const QRegularExpression typeExpression(
      QStringLiteral("type:\\s*\"([^\"]+)\""));

  auto matchIterator = propertyExpression.globalMatch(qmltypes);
  while (matchIterator.hasNext()) {
    const auto body = matchIterator.next().captured(1);
    properties.append({nameExpression.match(body).captured(1),
                       typeExpression.match(body).captured(1),
                       body.contains(QStringLiteral("isPointer: true")),
                       body.contains(QStringLiteral("isReadonly: true"))});
  }
  return properties;
}

QList<QmlMethod> qmltypesMethods(const QString &qmltypes) {
  QList<QmlMethod> methods;
  const QRegularExpression methodExpression(
      QStringLiteral("Method\\s*\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}"),
      QRegularExpression::DotMatchesEverythingOption);
  const QRegularExpression nameExpression(
      QStringLiteral("name:\\s*\"([^\"]+)\""));
  const QRegularExpression parameterExpression(
      QStringLiteral("Parameter\\s*\\{([^}]*)\\}"),
      QRegularExpression::DotMatchesEverythingOption);
  const QRegularExpression typeExpression(
      QStringLiteral("type:\\s*\"([^\"]+)\""));

  auto methodIterator = methodExpression.globalMatch(qmltypes);
  while (methodIterator.hasNext()) {
    const auto body = methodIterator.next().captured(1);
    QList<QmlParameter> parameters;
    auto parameterIterator = parameterExpression.globalMatch(body);
    while (parameterIterator.hasNext()) {
      const auto parameterBody = parameterIterator.next().captured(1);
      parameters.append({nameExpression.match(parameterBody).captured(1),
                         typeExpression.match(parameterBody).captured(1)});
    }
    methods.append({nameExpression.match(body).captured(1), parameters});
  }
  return methods;
}

QStringList qmltypesSignals(const QString &qmltypes) {
  QStringList signals;
  const QRegularExpression signalExpression(
      QStringLiteral("Signal\\s*\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}"),
      QRegularExpression::DotMatchesEverythingOption);
  const QRegularExpression nameExpression(
      QStringLiteral("name:\\s*\"([^\"]+)\""));

  auto matchIterator = signalExpression.globalMatch(qmltypes);
  while (matchIterator.hasNext()) {
    signals.append(
        nameExpression.match(matchIterator.next().captured(1)).captured(1));
  }
  return signals;
}

QString registeredBackendExport(const QString &pluginSource) {
  const QRegularExpression registerExpression(
      QStringLiteral("qmlRegisterType\\s*<[^>]+>\\s*\\(\\s*uri\\s*,\\s*(\\d+)"
                     "\\s*,\\s*(\\d+)\\s*,\\s*\"([^\"]+)\"\\s*\\)"));
  const auto match = registerExpression.match(pluginSource);
  if (!match.hasMatch()) {
    qFatal("Unable to locate TabPagerBackend qmlRegisterType call");
  }
  return QStringLiteral(TABPAGER_QML_URI) + QLatin1Char('/') +
         match.captured(3) + QLatin1Char(' ') + match.captured(1) +
         QLatin1Char('.') + match.captured(2);
}

QString qmltypesBackendExport(const QString &qmltypes) {
  const QRegularExpression exportExpression(
      QStringLiteral("exports:\\s*\\[\"([^\"]+)\"\\]"));
  const auto match = exportExpression.match(qmltypes);
  if (!match.hasMatch()) {
    qFatal("Unable to locate TabPagerBackend qmltypes export");
  }
  return match.captured(1);
}

template <typename T> void sortByName(QList<T> &values) {
  std::sort(values.begin(), values.end(), [](const T &left, const T &right) {
    return left.name < right.name;
  });
}

void sortMethods(QList<QmlMethod> &methods) {
  sortByName(methods);
  for (auto &method : methods) {
    sortByName(method.parameters);
  }
}

} // namespace

class TabPagerQmlTypesTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void backendExportMatchesRegisteredType();
  void backendPropertiesMatchInstalledQmlTypes();
  void backendInvokablesMatchInstalledQmlTypes();
  void backendSignalsMatchInstalledQmlTypes();
};

void TabPagerQmlTypesTest::backendExportMatchesRegisteredType() {
  const auto expected = registeredBackendExport(
      readSourceFile(QStringLiteral("src/"
                                    "tabpagerplugin.cpp")));
  const auto actual = qmltypesBackendExport(
      readBuildFile(QStringLiteral("src/"
                                   "tabpagerplugin.qmltypes")));

  QCOMPARE(actual, expected);
}

void TabPagerQmlTypesTest::backendPropertiesMatchInstalledQmlTypes() {
  auto expected = backendHeaderProperties(
      readSourceFile(QStringLiteral("src/"
                                    "tabpagerbackend.h")));
  auto actual = qmltypesProperties(
      readBuildFile(QStringLiteral("src/"
                                   "tabpagerplugin.qmltypes")));

  sortByName(expected);
  sortByName(actual);
  QCOMPARE(actual, expected);
}

void TabPagerQmlTypesTest::backendInvokablesMatchInstalledQmlTypes() {
  auto expected = backendHeaderInvokables(
      readSourceFile(QStringLiteral("src/"
                                    "tabpagerbackend.h")));
  auto actual =
      qmltypesMethods(readBuildFile(QStringLiteral("src/"
                                                   "tabpagerplugin.qmltypes")));

  sortMethods(expected);
  sortMethods(actual);
  QCOMPARE(actual, expected);
}

void TabPagerQmlTypesTest::backendSignalsMatchInstalledQmlTypes() {
  auto expected =
      backendHeaderSignals(readSourceFile(QStringLiteral("src/"
                                                         "tabpagerbackend.h")));
  auto actual =
      qmltypesSignals(readBuildFile(QStringLiteral("src/"
                                                   "tabpagerplugin.qmltypes")));

  expected.sort();
  actual.sort();
  QCOMPARE(actual, expected);
}

QTEST_MAIN(TabPagerQmlTypesTest)
#include "tabpagerqmltypes_test.moc"
