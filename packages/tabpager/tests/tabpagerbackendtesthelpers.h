// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerbackend.h"
#include "tabpagertesthelpers.h"

#include <QSignalSpy>
#include <QVariant>

#include <memory>
#include <utility>

namespace TabPagerTest {
class FakeDesktopSource final : public TabPagerDesktopSource {
public:
  explicit FakeDesktopSource(const QList<TabPagerDesktop> &desktops = {},
                             TabPagerDesktopId currentDesktop = {},
                             bool navigationWrappingAround = false)
      : m_desktops(desktops), m_currentDesktop(std::move(currentDesktop)),
        m_navigationWrappingAround(navigationWrappingAround) {}

  [[nodiscard]] TabPagerDesktopSnapshot desktopSnapshot() const override {
    return TabPagerTest::desktopSnapshot(m_desktops, m_currentDesktop);
  }

  [[nodiscard]] bool navigationWrappingAround() const override {
    return m_navigationWrappingAround;
  }

  void activateDesktop(const TabPagerDesktopId &desktopId) override {
    m_activatedDesktops.append(desktopId);
  }

  void setDesktops(const QList<TabPagerDesktop> &desktops) {
    m_desktops = desktops;
    Q_EMIT desktopSnapshotChanged();
  }

  void setDesktopState(const QList<TabPagerDesktop> &desktops,
                       const TabPagerDesktopId &currentDesktop) {
    m_desktops = desktops;
    m_currentDesktop = currentDesktop;
    Q_EMIT desktopSnapshotChanged();
  }

  void setCurrentDesktop(const TabPagerDesktopId &desktopId) {
    m_currentDesktop = desktopId;
    Q_EMIT desktopSnapshotChanged();
  }

  void setNavigationWrappingAround(bool navigationWrappingAround) {
    m_navigationWrappingAround = navigationWrappingAround;
    Q_EMIT navigationWrappingAroundChanged();
  }

  [[nodiscard]] QList<TabPagerDesktopId> activatedDesktops() const {
    return m_activatedDesktops;
  }

private:
  QList<TabPagerDesktop> m_desktops;
  QList<TabPagerDesktopId> m_activatedDesktops;
  TabPagerDesktopId m_currentDesktop;
  bool m_navigationWrappingAround = false;
};

struct BackendFixture {
private:
  struct AdoptSource {};

public:
  explicit BackendFixture(const QList<TabPagerDesktop> &desktops,
                          const TabPagerDesktopId &currentDesktop = {},
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

struct DataChangedEmission {
  int firstRow = -1;
  int lastRow = -1;
  QList<int> roles;
};

[[nodiscard]] inline DataChangedEmission
takeDataChangedEmission(QSignalSpy &spy) {
  const QList<QVariant> arguments = spy.takeFirst();
  return DataChangedEmission{
      .firstRow = qvariant_cast<QModelIndex>(arguments.at(0)).row(),
      .lastRow = qvariant_cast<QModelIndex>(arguments.at(1)).row(),
      .roles = qvariant_cast<QList<int>>(arguments.at(2)),
  };
}
} // namespace TabPagerTest
