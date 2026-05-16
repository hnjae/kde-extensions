// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktopid.h"
#include "taskmanagerdesktopsource.h"

#include <QSignalSpy>
#include <QTest>

#include <memory>
#include <utility>

namespace {
class FakeVirtualDesktopInfo final : public TabPagerVirtualDesktopInfo {
public:
  explicit FakeVirtualDesktopInfo(QVariantList desktopIds = {},
                                  QStringList desktopNames = {},
                                  QVariant currentDesktop = {},
                                  bool navigationWrappingAround = false)
      : m_desktopIds(std::move(desktopIds)),
        m_desktopNames(std::move(desktopNames)),
        m_currentDesktop(std::move(currentDesktop)),
        m_navigationWrappingAround(navigationWrappingAround) {}

  [[nodiscard]] QVariantList desktopIds() const override {
    return m_desktopIds;
  }

  [[nodiscard]] QStringList desktopNames() const override {
    return m_desktopNames;
  }

  [[nodiscard]] QVariant currentDesktop() const override {
    return m_currentDesktop;
  }

  [[nodiscard]] bool navigationWrappingAround() const override {
    return m_navigationWrappingAround;
  }

  void requestActivate(const QVariant &desktopId) override {
    m_requestedActivations.append(desktopId);
  }

  void setDesktopIds(QVariantList desktopIds) {
    m_desktopIds = std::move(desktopIds);
    Q_EMIT desktopIdsChanged();
  }

  void setDesktopNames(QStringList desktopNames) {
    m_desktopNames = std::move(desktopNames);
    Q_EMIT desktopNamesChanged();
  }

  void emitNumberOfDesktopsChanged() { Q_EMIT numberOfDesktopsChanged(); }

  void setCurrentDesktop(QVariant currentDesktop) {
    m_currentDesktop = std::move(currentDesktop);
    Q_EMIT currentDesktopChanged();
  }

  void setNavigationWrappingAround(bool navigationWrappingAround) {
    m_navigationWrappingAround = navigationWrappingAround;
    Q_EMIT navigationWrappingAroundChanged();
  }

  [[nodiscard]] QVariantList requestedActivations() const {
    return m_requestedActivations;
  }

private:
  QVariantList m_desktopIds;
  QStringList m_desktopNames;
  QVariant m_currentDesktop;
  bool m_navigationWrappingAround = false;
  QVariantList m_requestedActivations;
};

struct SourceFixture {
private:
  struct AdoptInfo {};

public:
  explicit SourceFixture(QVariantList desktopIds = {},
                         QStringList desktopNames = {},
                         QVariant currentDesktop = {},
                         bool navigationWrappingAround = false)
      : SourceFixture(AdoptInfo{},
                      std::make_unique<FakeVirtualDesktopInfo>(
                          std::move(desktopIds), std::move(desktopNames),
                          std::move(currentDesktop),
                          navigationWrappingAround)) {}

  FakeVirtualDesktopInfo *info = nullptr;
  TaskManagerDesktopSource source;

private:
  explicit SourceFixture([[maybe_unused]] AdoptInfo adoptInfo,
                         std::unique_ptr<FakeVirtualDesktopInfo> fakeInfo)
      : info(fakeInfo.get()), source(std::move(fakeInfo)) {}
};
} // namespace

class TaskManagerDesktopSourceTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void projectsVirtualDesktopInfoToSourceState();
  void emitsSourceStateChangedWhenVirtualDesktopInfoChanges();
  void requestsActivationForValidDesktopIdsOnly();
};

void TaskManagerDesktopSourceTest::projectsVirtualDesktopInfoToSourceState() {
  SourceFixture fixture({QStringLiteral("a"), QStringLiteral("b")},
                        {QStringLiteral("Desktop 1"), QStringLiteral("Work")},
                        QStringLiteral("b"), true);

  const TabPagerDesktopSourceState state = fixture.source.sourceState();

  QCOMPARE(state.desktopSnapshot.desktops.size(), 2);
  QCOMPARE(state.desktopSnapshot.desktops.at(0).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("a")));
  QCOMPARE(state.desktopSnapshot.desktops.at(0).name,
           QStringLiteral("Desktop 1"));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).id,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.desktopSnapshot.desktops.at(1).name, QStringLiteral("Work"));
  QCOMPARE(state.desktopSnapshot.currentDesktop,
           TabPagerDesktopId::fromVariant(QStringLiteral("b")));
  QCOMPARE(state.navigationWrappingAround, true);
}

void TaskManagerDesktopSourceTest::
    emitsSourceStateChangedWhenVirtualDesktopInfoChanges() {
  SourceFixture fixture;
  QSignalSpy spy(&fixture.source, &TabPagerDesktopSource::sourceStateChanged);

  fixture.info->setDesktopIds({QStringLiteral("a")});
  fixture.info->setDesktopNames({QStringLiteral("Work")});
  fixture.info->emitNumberOfDesktopsChanged();
  fixture.info->setCurrentDesktop(QStringLiteral("a"));
  fixture.info->setNavigationWrappingAround(true);

  QCOMPARE(spy.count(), 5);
}

void TaskManagerDesktopSourceTest::requestsActivationForValidDesktopIdsOnly() {
  SourceFixture fixture;

  fixture.source.activateDesktop(TabPagerDesktopId{});
  fixture.source.activateDesktop(
      TabPagerDesktopId::fromVariant(QStringLiteral("a")));

  QCOMPARE(fixture.info->requestedActivations(),
           QVariantList{QStringLiteral("a")});
}

QTEST_MAIN(TaskManagerDesktopSourceTest)

#include "taskmanagerdesktopsource_test.moc"
