// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QAbstractListModel>
#include <QFont>
#include <QLibraryInfo>
#include <QQmlComponent>
#include <QQmlEngine>
#include <QQuickItem>
#include <QQuickWindow>
#include <QStringList>
#include <QTest>
#include <QWheelEvent>

#include <memory>

namespace {
class FakeBackend final : public QObject {
  Q_OBJECT
  Q_PROPERTY(QFont labelFont READ labelFont CONSTANT)

public:
  [[nodiscard]] QFont labelFont() const { return {}; }

  Q_INVOKABLE void activate(int desktopIndex) {
    activatedDesktopIndexes.append(desktopIndex);
  }

  Q_INVOKABLE void activateByWheelDelta(int delta) {
    activatedWheelDeltas.append(delta);
  }

  QList<int> activatedDesktopIndexes;
  QList<int> activatedWheelDeltas;
};

class FakeDesktopModel final : public QAbstractListModel {
  Q_OBJECT

public:
  enum Role {
    LabelRole = Qt::UserRole + 1,
    ActiveRole,
  };

  [[nodiscard]] int
  rowCount(const QModelIndex &parent = QModelIndex()) const override {
    return parent.isValid() ? 0 : 1;
  }

  [[nodiscard]] QVariant data(const QModelIndex &index,
                              int role) const override {
    if (!index.isValid() || index.row() != 0) {
      return {};
    }

    switch (role) {
    case LabelRole:
      return QStringLiteral("1");
    case ActiveRole:
      return true;
    default:
      return {};
    }
  }

  [[nodiscard]] QHash<int, QByteArray> roleNames() const override {
    return {
        {LabelRole, QByteArrayLiteral("label")},
        {ActiveRole, QByteArrayLiteral("active")},
    };
  }
};

void addQmlImportPathsFromEnvironment(QQmlEngine &engine,
                                      const char *variableName) {
  const QString importPaths = QString::fromLocal8Bit(qgetenv(variableName));
  for (const QString &path :
       importPaths.split(QLatin1Char(':'), Qt::SkipEmptyParts)) {
    engine.addImportPath(path);
  }
}

std::unique_ptr<QObject> createTabPagerView(QQmlEngine &engine,
                                            FakeBackend &backend,
                                            FakeDesktopModel &model,
                                            QString *errorString) {
  addQmlImportPathsFromEnvironment(engine, "QML2_IMPORT_PATH");
  addQmlImportPathsFromEnvironment(engine, "NIXPKGS_QML_SEARCH_PATHS");
  engine.addImportPath(QLibraryInfo::path(QLibraryInfo::QmlImportsPath));
  engine.addImportPath(QStringLiteral(TABPAGER_QML_IMPORT_PATH));

  QQmlComponent component(&engine,
                          QUrl::fromLocalFile(QStringLiteral(
                              TABPAGER_SOURCE_DIR "/package/contents/ui/"
                                                  "TabPagerView.qml")));
  if (!component.isReady()) {
    *errorString = component.errorString();
    return nullptr;
  }

  const QVariantMap initialProperties = {
      {QStringLiteral("backend"), QVariant::fromValue(&backend)},
      {QStringLiteral("model"), QVariant::fromValue(&model)},
      {QStringLiteral("verticalPanel"), false},
  };
  std::unique_ptr<QObject> view(
      component.createWithInitialProperties(initialProperties));
  if (view == nullptr) {
    *errorString = component.errorString();
  }
  return view;
}
} // namespace

class TabPagerViewTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void loadsWithoutPlasmaShellImports();
  void rendersWithOnlyViewRoles();
  void dispatchesClickAndWheelToBackend();
};

void TabPagerViewTest::loadsWithoutPlasmaShellImports() {
  QQmlEngine engine;
  FakeBackend backend;
  FakeDesktopModel model;
  QString errorString;

  const std::unique_ptr<QObject> view =
      createTabPagerView(engine, backend, model, &errorString);

  QVERIFY2(view != nullptr, qPrintable(errorString));
  QVERIFY(qobject_cast<QQuickItem *>(view.get()) != nullptr);
}

void TabPagerViewTest::rendersWithOnlyViewRoles() {
  QQmlEngine engine;
  FakeBackend backend;
  FakeDesktopModel model;
  QString errorString;

  const QHash<int, QByteArray> expectedRoles = {
      {FakeDesktopModel::LabelRole, "label"},
      {FakeDesktopModel::ActiveRole, "active"},
  };
  QCOMPARE(model.roleNames(), expectedRoles);

  const std::unique_ptr<QObject> view =
      createTabPagerView(engine, backend, model, &errorString);

  QVERIFY2(view != nullptr, qPrintable(errorString));
  QVERIFY(qobject_cast<QQuickItem *>(view.get()) != nullptr);
}

void TabPagerViewTest::dispatchesClickAndWheelToBackend() {
  QQmlEngine engine;
  FakeBackend backend;
  FakeDesktopModel model;
  QString errorString;
  std::unique_ptr<QObject> viewObject =
      createTabPagerView(engine, backend, model, &errorString);
  QVERIFY2(viewObject != nullptr, qPrintable(errorString));
  auto *viewItem = qobject_cast<QQuickItem *>(viewObject.get());
  QVERIFY(viewItem != nullptr);

  QQuickWindow window;
  window.resize(160, 48);
  viewItem->setParentItem(window.contentItem());
  viewItem->setSize(QSizeF(window.width(), window.height()));
  window.show();
  QVERIFY(QTest::qWaitForWindowExposed(&window));

  QTest::mouseClick(&window, Qt::LeftButton, Qt::NoModifier,
                    QPoint(window.width() / 2, window.height() / 2));
  QCOMPARE(backend.activatedDesktopIndexes, QList<int>{0});

  QWheelEvent wheelEvent(QPointF(window.width() / 2.0, window.height() / 2.0),
                         QPointF(window.width() / 2.0, window.height() / 2.0),
                         QPoint{}, QPoint{0, 120}, Qt::NoButton, Qt::NoModifier,
                         Qt::NoScrollPhase, false);
  QCoreApplication::sendEvent(&window, &wheelEvent);
  QCOMPARE(backend.activatedWheelDeltas, QList<int>{120});
}

QTEST_MAIN(TabPagerViewTest)

#include "tabpagerview_test.moc"
