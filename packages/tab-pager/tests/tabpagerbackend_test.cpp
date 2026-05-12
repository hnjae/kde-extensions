// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"
#include "tabpagerdesktoplogic.h"

#include <QSignalSpy>
#include <QTest>

namespace {
class FakeDesktopSource final : public TabPagerDesktopSource {
  Q_OBJECT

public:
  [[nodiscard]] QList<TabPagerDesktop> desktops() const override {
    return m_desktops;
  }

  [[nodiscard]] QVariant currentDesktop() const override {
    return m_currentDesktop;
  }

  [[nodiscard]] bool navigationWrappingAround() const override {
    return m_navigationWrappingAround;
  }

  void activateDesktop(const QVariant &desktopId) override {
    m_activatedDesktops.append(desktopId);
  }

  void setDesktops(const QList<TabPagerDesktop> &desktops) {
    m_desktops = desktops;
    Q_EMIT desktopsChanged();
  }

  void setDesktopState(const QList<TabPagerDesktop> &desktops,
                       const QVariant &currentDesktop) {
    m_desktops = desktops;
    m_currentDesktop = currentDesktop;
    Q_EMIT desktopsChanged();
  }

  void setCurrentDesktop(const QVariant &desktopId) {
    m_currentDesktop = desktopId;
    Q_EMIT currentDesktopChanged();
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
  explicit BackendFixture(const QList<TabPagerDesktop> &desktops,
                          const QVariant &currentDesktop = {},
                          bool navigationWrappingAround = false)
      : backend(&source) {
    source.setDesktops(desktops);
    source.setCurrentDesktop(currentDesktop);
    source.setNavigationWrappingAround(navigationWrappingAround);
  }

  FakeDesktopSource source;
  TabPagerBackend backend;
};
} // namespace

class TabPagerBackendTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void formatsDesktopLabel_data();
  void formatsDesktopLabel();
  void resolvesNavigationTarget_data();
  void resolvesNavigationTarget();
  void exposesModelState();
  void exposesModelData();
  void exposesRoleNames();
  void updatesWhenDesktopsChange();
  void updatesDesktopRowsWithoutReset();
  void tracksCurrentDesktopFromDesktopReload();
  void tracksCurrentDesktop();
  void updatesNavigationWrapping();
  void activatesDesktopByIndex();
  void ignoresRelativeActivationWithoutCurrentDesktop();
  void stopsAtEdgesWithoutWrapping();
  void activatesNextAndPreviousWithoutWrapping();
  void activatesNextAndPreviousWithWrapping();
};

void TabPagerBackendTest::formatsDesktopLabel_data() {
  constexpr int prefixOnlyDesktopNumber = 5;
  constexpr int laterDesktopNumber = 12;

  QTest::addColumn<int>("number");
  QTest::addColumn<QString>("name");
  QTest::addColumn<QString>("expected");

  QTest::newRow("default first")
      << 1 << QStringLiteral("Desktop 1") << QStringLiteral("1");
  QTest::newRow("default later")
      << laterDesktopNumber << QStringLiteral("Desktop 12")
      << QStringLiteral("12");
  QTest::newRow("custom") << 2 << QStringLiteral("Work")
                          << QStringLiteral("Work");
  QTest::newRow("empty") << 3 << QString() << QStringLiteral("3");
  QTest::newRow("prefix only")
      << prefixOnlyDesktopNumber << QStringLiteral("Desktop 5x")
      << QStringLiteral("Desktop 5x");
  QTest::newRow("number mismatch")
      << 4 << QStringLiteral("Desktop 5") << QStringLiteral("Desktop 5");
}

void TabPagerBackendTest::formatsDesktopLabel() {
  QFETCH(int, number);
  QFETCH(QString, name);
  QFETCH(QString, expected);

  QCOMPARE(TabPagerDesktopLogic::labelForDesktop(number, name), expected);
}

void TabPagerBackendTest::resolvesNavigationTarget_data() {
  QTest::addColumn<int>("currentIndex");
  QTest::addColumn<int>("desktopCount");
  QTest::addColumn<int>("offset");
  QTest::addColumn<bool>("wrappingAround");
  QTest::addColumn<int>("expected");

  QTest::newRow("empty") << 0 << 0 << 1 << false << -1;
  QTest::newRow("invalid count") << 0 << -1 << 1 << true << -1;
  QTest::newRow("missing current") << -1 << 3 << 1 << true << -1;
  QTest::newRow("past current") << 3 << 3 << -1 << true << -1;
  QTest::newRow("next") << 1 << 3 << 1 << false << 2;
  QTest::newRow("previous") << 1 << 3 << -1 << false << 0;
  QTest::newRow("stop before first") << 0 << 3 << -1 << false << -1;
  QTest::newRow("stop after last") << 2 << 3 << 1 << false << -1;
  QTest::newRow("wrap before first") << 0 << 3 << -1 << true << 2;
  QTest::newRow("wrap after last") << 2 << 3 << 1 << true << 0;
}

void TabPagerBackendTest::resolvesNavigationTarget() {
  QFETCH(int, currentIndex);
  QFETCH(int, desktopCount);
  QFETCH(int, offset);
  QFETCH(bool, wrappingAround);
  QFETCH(int, expected);

  QCOMPARE(TabPagerDesktopLogic::targetIndexForOffset(
               currentIndex, desktopCount, offset, wrappingAround),
           expected);
}

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

  QCOMPARE(roles.value(TabPagerBackend::DesktopIdRole),
           QByteArray("desktopId"));
  QCOMPARE(roles.value(TabPagerBackend::LabelRole), QByteArray("label"));
  QCOMPARE(roles.value(TabPagerBackend::ActiveRole), QByteArray("active"));
}

void TabPagerBackendTest::updatesWhenDesktopsChange() {
  BackendFixture fixture({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
  });
  QSignalSpy countSpy(&fixture.backend, &TabPagerBackend::countChanged);
  QSignalSpy resetSpy(&fixture.backend, &QAbstractItemModel::modelReset);

  fixture.source.setDesktops({
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
  QSignalSpy dataSpy(&fixture.backend, &QAbstractItemModel::dataChanged);

  fixture.source.setDesktops({
      {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
      {.id = QStringLiteral("b"), .name = QStringLiteral("Chat")},
  });

  QCOMPARE(fixture.backend.count(), 2);
  QCOMPARE(countSpy.count(), 0);
  QCOMPARE(resetSpy.count(), 0);
  QCOMPARE(dataSpy.count(), 1);
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                TabPagerBackend::LabelRole),
           QVariant(QStringLiteral("Chat")));

  const QList<QVariant> arguments = dataSpy.takeFirst();
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(0)).row(), 1);
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(1)).row(), 1);
  const QList<int> roles = qvariant_cast<QList<int>>(arguments.at(2));
  QVERIFY(roles.contains(TabPagerBackend::NameRole));
  QVERIFY(roles.contains(TabPagerBackend::LabelRole));
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

  fixture.source.setDesktopState(desktops, QStringLiteral("b"));

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

  fixture.source.setCurrentDesktop(QStringLiteral("b"));

  QCOMPARE(fixture.backend.currentIndex(), 1);
  QCOMPARE(currentSpy.count(), 1);
  QCOMPARE(dataSpy.count(), 1);
  const QList<QVariant> arguments = dataSpy.takeFirst();
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(0)).row(), 1);
  QCOMPARE(qvariant_cast<QModelIndex>(arguments.at(1)).row(), 1);
  const QList<int> roles = qvariant_cast<QList<int>>(arguments.at(2));
  QCOMPARE(roles, QList<int>{TabPagerBackend::ActiveRole});
  QCOMPARE(fixture.backend.data(fixture.backend.index(1),
                                TabPagerBackend::ActiveRole),
           QVariant(true));
}

void TabPagerBackendTest::updatesNavigationWrapping() {
  BackendFixture fixture({});
  QSignalSpy wrappingSpy(&fixture.backend,
                         &TabPagerBackend::navigationWrappingAroundChanged);

  fixture.source.setNavigationWrappingAround(true);

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

  QCOMPARE(fixture.source.activatedDesktops(),
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
  QCOMPARE(fixture.source.activatedDesktops(), expected);
}

void TabPagerBackendTest::stopsAtEdgesWithoutWrapping() {
  BackendFixture fixture(
      {
          {.id = QStringLiteral("a"), .name = QStringLiteral("Desktop 1")},
          {.id = QStringLiteral("b"), .name = QStringLiteral("Desktop 2")},
      },
      QStringLiteral("a"), false);

  fixture.backend.activatePrevious();
  fixture.source.setCurrentDesktop(QStringLiteral("b"));
  fixture.backend.activateNext();

  const QList<QVariant> expected;
  QCOMPARE(fixture.source.activatedDesktops(), expected);
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
  fixture.source.setCurrentDesktop(QStringLiteral("c"));
  fixture.backend.activateNext();

  const QList<QVariant> expected = {QStringLiteral("c"), QStringLiteral("a")};
  QCOMPARE(fixture.source.activatedDesktops(), expected);
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
  fixture.source.setCurrentDesktop(QStringLiteral("a"));
  fixture.backend.activatePrevious();

  const QList<QVariant> expected = {QStringLiteral("a"), QStringLiteral("c")};
  QCOMPARE(fixture.source.activatedDesktops(), expected);
}

QTEST_MAIN(TabPagerBackendTest)

#include "tabpagerbackend_test.moc"
