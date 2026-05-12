// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QSignalSpy>
#include <QTest>

#include <memory>
#include <utility>

namespace {
class FakeDesktopSource final : public TabPagerDesktopSource {
  Q_OBJECT

public:
  explicit FakeDesktopSource(const QList<TabPagerDesktop> &desktops = {},
                             QVariant currentDesktop = {},
                             bool navigationWrappingAround = false)
      : m_desktops(desktops), m_currentDesktop(std::move(currentDesktop)),
        m_navigationWrappingAround(navigationWrappingAround) {}

  [[nodiscard]] TabPagerDesktopSnapshot desktopSnapshot() const override {
    return TabPagerDesktopSnapshot{
        .desktops = m_desktops,
        .currentDesktop = m_currentDesktop,
    };
  }

  [[nodiscard]] bool navigationWrappingAround() const override {
    return m_navigationWrappingAround;
  }

  void activateDesktop(const QVariant &desktopId) override {
    m_activatedDesktops.append(desktopId);
  }

  void setDesktops(const QList<TabPagerDesktop> &desktops) {
    m_desktops = desktops;
    Q_EMIT desktopSnapshotChanged();
  }

  void setDesktopState(const QList<TabPagerDesktop> &desktops,
                       const QVariant &currentDesktop) {
    m_desktops = desktops;
    m_currentDesktop = currentDesktop;
    Q_EMIT desktopSnapshotChanged();
  }

  void setCurrentDesktop(const QVariant &desktopId) {
    m_currentDesktop = desktopId;
    Q_EMIT desktopSnapshotChanged();
  }

  void setNavigationWrappingAround(bool navigationWrappingAround) {
    m_navigationWrappingAround = navigationWrappingAround;
    Q_EMIT navigationWrappingAroundChanged();
  }

  [[nodiscard]] QList<QVariant> activatedDesktops() const {
    return m_activatedDesktops;
  }

private:
  QList<TabPagerDesktop> m_desktops;
  QList<QVariant> m_activatedDesktops;
  QVariant m_currentDesktop;
  bool m_navigationWrappingAround = false;
};

struct BackendFixture {
private:
  struct AdoptSource {};

public:
  explicit BackendFixture(const QList<TabPagerDesktop> &desktops,
                          const QVariant &currentDesktop = {},
                          bool navigationWrappingAround = false)
      : BackendFixture(AdoptSource{}, std::make_unique<FakeDesktopSource>(
                                          desktops, currentDesktop,
                                          navigationWrappingAround)) {}

  FakeDesktopSource *source = nullptr;
  TabPagerBackend backend;

private:
  explicit BackendFixture([[maybe_unused]] AdoptSource adoptSource,
                          std::unique_ptr<FakeDesktopSource> fakeSource)
      : source(fakeSource.get()), backend(std::move(fakeSource)) {}
};
} // namespace

class TabPagerBackendTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void exposesModelState();
  void exposesModelData();
  void exposesRoleNames();
  void updatesWhenDesktopsChange();
  void updatesDesktopRowsWithoutReset();
  void emitsChangedRolesForUpdatedDesktopRows();
  void tracksCurrentDesktopFromDesktopReload();
  void tracksCurrentDesktop();
  void updatesNavigationWrapping();
  void activatesDesktopByIndex();
  void ignoresRelativeActivationWithoutCurrentDesktop();
  void stopsAtEdgesWithoutWrapping();
  void activatesNextAndPreviousWithoutWrapping();
  void activatesNextAndPreviousWithWrapping();
};

void TabPagerBackendTest::exposesModelState() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Work")},
          {.id = QStringLiteral("c"), .name = QString()},
      },
      QStringLiteral("b"), true);
  const TabPagerBackend &backend = fixture.backend;

  QCOMPARE(backend.count(), 3);
  QCOMPARE(backend.rowCount(), 3);
  QCOMPARE(backend.currentIndex(), 1);
  QCOMPARE(backend.navigationWrappingAround(), true);
}

void TabPagerBackendTest::exposesModelData() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Work")},
          {.id = QStringLiteral("c"), .name = QString()},
      },
      QStringLiteral("b"), true);
  const TabPagerBackend &backend = fixture.backend;

  const QModelIndex first = backend.index(0);
  QCOMPARE(backend.data(first, TabPagerBackend::DesktopIdRole),
           QVariant(QStringLiteral("a")));
  QCOMPARE(backend.data(first, TabPagerBackend::NameRole),
           QVariant(QStringLiteral("Desktop 1")));
  QCOMPARE(backend.data(first, TabPagerBackend::LabelRole),
           QVariant(QStringLiteral("1")));
  QCOMPARE(backend.data(first, TabPagerBackend::NumberRole), QVariant(1));
  QCOMPARE(backend.data(first, TabPagerBackend::ActiveRole), QVariant(false));

  const QModelIndex second = backend.index(1);
  QCOMPARE(backend.data(second, TabPagerBackend::LabelRole),
           QVariant(QStringLiteral("Work")));
  QCOMPARE(backend.data(second, TabPagerBackend::ActiveRole), QVariant(true));
}

void TabPagerBackendTest::exposesRoleNames() {
  BackendFixture fixture({});
  const TabPagerBackend &backend = fixture.backend;
  const QHash<int, QByteArray> roles = backend.roleNames();

  const QHash<int, QByteArray> expected = {
      {TabPagerBackend::DesktopIdRole, "desktopId"},
      {TabPagerBackend::NameRole, "name"},
      {TabPagerBackend::LabelRole, "label"},
      {TabPagerBackend::NumberRole, "number"},
      {TabPagerBackend::ActiveRole, "active"},
  };
  QCOMPARE(roles, expected);
}

void TabPagerBackendTest::updatesWhenDesktopsChange() {
  BackendFixture fixture({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
  });
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&fixture.backend, &QAbstractItemModel::modelReset);

  fixture.source->setDesktops({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("b"), .name = QStringLiteral("Chat")},
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(countSpy.count(), 1);
  QCOMPARE(resetSpy.count(), 1);
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                TabPagerBackend::LabelRole),
           QVariant(QStringLiteral("Chat")));
}

void TabPagerBackendTest::updatesDesktopRowsWithoutReset() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
      },
      QStringLiteral("b"));
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&fixture.backend, &QAbstractItemModel::modelReset);

  fixture.source->setDesktops({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("b"), .name = QStringLiteral("Chat")},
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(resetSpy.count(), 0);
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                TabPagerBackend::LabelRole),
           QVariant(QStringLiteral("Chat")));
}

void TabPagerBackendTest::emitsChangedRolesForUpdatedDesktopRows() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
      },
      QStringLiteral("b"));
  QSignalSpy dataSpy(&fixture.backend, &QAbstractItemModel::dataChanged);

  fixture.source->setDesktops({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("c"), .name = QStringLiteral("Chat")},
  });

  QCOMPARE(dataSpy.count(), 1);
  const QList<QVariant> arguments = dataSpy.takeFirst();
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(0)).row(), 1);
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(1)).row(), 1);
  const auto roles = qvariant_cast<QList<int>>(arguments.at(2));
  QCOMPARE(roles, (QList<int>{
                      TabPagerBackend::DesktopIdRole,
                      TabPagerBackend::NameRole,
                      TabPagerBackend::LabelRole,
                      TabPagerBackend::ActiveRole,
                  }));
}

void TabPagerBackendTest::tracksCurrentDesktopFromDesktopReload() {
  const QList<TabPagerDesktop> desktops = {
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
  };
  BackendFixture fixture(desktops, QStringLiteral("a"));
  QSignalSpy currentSpy(&fixture.backend,
                        &TabPagerBackend::currentIndexChanged);
  QSignalSpy dataSpy(&fixture.backend, &QAbstractItemModel::dataChanged);

  fixture.source->setDesktopState(desktops, QStringLiteral("b"));

  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 2);
  QCOMPARE(fixture.backend.data(fixture.backend.index(0),
                                TabPagerBackend::ActiveRole),
           QVariant(false));
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                TabPagerBackend::ActiveRole),
           QVariant(true));
}

void TabPagerBackendTest::tracksCurrentDesktop() {
  BackendFixture fixture({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
  });
  QSignalSpy currentSpy(&fixture.backend,
                        &TabPagerBackend::currentIndexChanged);
  QSignalSpy dataSpy(&fixture.backend, &QAbstractItemModel::dataChanged);

  fixture.source->setCurrentDesktop(QStringLiteral("b"));

  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 1);
  const QList<QVariant> arguments = dataSpy.takeFirst();
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(0)).row(), 1);
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(1)).row(), 1);
  const auto roles = qvariant_cast<QList<int>>(arguments.at(2));
  QCOMPARE(roles, QList<int>{TabPagerBackend::ActiveRole});
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                TabPagerBackend::ActiveRole),
           QVariant(true));
}

void TabPagerBackendTest::updatesNavigationWrapping() {
  BackendFixture fixture({});
  QSignalSpy wrappingSpy(&fixture.backend,
                         &TabPagerBackend::navigationWrappingAroundChanged);

  fixture.source->setNavigationWrappingAround(true);

  QCOMPARE(fixture.backend.navigationWrappingAround(), true);
  QCOMPARE(wrappingSpy.count(), 1);
}

void TabPagerBackendTest::activatesDesktopByIndex() {
  BackendFixture fixture({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
  });

  fixture.backend.activate(-1);
  fixture.backend.activate(2);
  fixture.backend.activate(1);

  QCOMPARE(fixture.source->activatedDesktops(),
           QList<QVariant>{QStringLiteral("b")});
}

void TabPagerBackendTest::ignoresRelativeActivationWithoutCurrentDesktop() {
  BackendFixture fixture({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
  });

  fixture.backend.activateNext();
  fixture.backend.activatePrevious();

  const QList<QVariant> expected;
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::stopsAtEdgesWithoutWrapping() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
      },
      QStringLiteral("a"), false);

  fixture.backend.activatePrevious();
  fixture.source->setCurrentDesktop(QStringLiteral("b"));
  fixture.backend.activateNext();

  const QList<QVariant> expected;
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::activatesNextAndPreviousWithoutWrapping() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
          {.id = QStringLiteral("c"), .name = QStringLiteral("Desktop 3")},
      },
      QStringLiteral("b"), false);

  fixture.backend.activateNext();
  fixture.backend.activatePrevious();
  fixture.source->setCurrentDesktop(QStringLiteral("c"));
  fixture.backend.activateNext();

  const QList<QVariant> expected = {QStringLiteral("c"), QStringLiteral("a")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

void TabPagerBackendTest::activatesNextAndPreviousWithWrapping() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
          {.id = QStringLiteral("c"), .name = QStringLiteral("Desktop 3")},
      },
      QStringLiteral("c"), true);

  fixture.backend.activateNext();
  fixture.source->setCurrentDesktop(QStringLiteral("a"));
  fixture.backend.activatePrevious();

  const QList<QVariant> expected = {QStringLiteral("a"), QStringLiteral("c")};
  QCOMPARE(fixture.source->activatedDesktops(), expected);
}

QTEST_MAIN(TabPagerBackendTest)

#include "tabpagerbackend_test.moc"
