// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerbackend.h"
#include "tabpagernavigationsettingssource.h"
#include "tabpagertesthelpers.h"

#include <memory>
#include <utility>

namespace TabPagerTest {
class FakeDesktopSource final : public TabPagerDesktopSource {
public:
  explicit FakeDesktopSource(const QList<TabPagerDesktop> &desktops = {},
                             TabPagerDesktopId currentDesktop = {})
      : m_desktops(desktops), m_currentDesktop(std::move(currentDesktop)) {}

  [[nodiscard]] TabPagerDesktopSourceState sourceState() const override {
    return TabPagerDesktopSourceState{
        .desktopSnapshot =
            TabPagerTest::desktopSnapshot(m_desktops, m_currentDesktop),
    };
  }

  [[nodiscard]] bool sourceHasDiagnostics() const override {
    return m_sourceHasDiagnostics;
  }

  void activateDesktop(const TabPagerDesktopId &desktopId) override {
    m_activatedDesktops.append(desktopId);
  }

  void setDesktops(const QList<TabPagerDesktop> &desktops) {
    m_desktops = desktops;
    Q_EMIT sourceStateChanged();
  }

  void setDesktopState(const QList<TabPagerDesktop> &desktops,
                       const TabPagerDesktopId &currentDesktop) {
    m_desktops = desktops;
    m_currentDesktop = currentDesktop;
    Q_EMIT sourceStateChanged();
  }

  void setCurrentDesktop(const TabPagerDesktopId &desktopId) {
    m_currentDesktop = desktopId;
    Q_EMIT sourceStateChanged();
  }

  void setSourceState(const QList<TabPagerDesktop> &desktops,
                      const TabPagerDesktopId &currentDesktop) {
    m_desktops = desktops;
    m_currentDesktop = currentDesktop;
    Q_EMIT sourceStateChanged();
  }

  void setSourceHasDiagnostics(bool sourceHasDiagnostics) {
    if (m_sourceHasDiagnostics == sourceHasDiagnostics) {
      return;
    }

    m_sourceHasDiagnostics = sourceHasDiagnostics;
    Q_EMIT sourceDiagnosticsChanged();
  }

  [[nodiscard]] QList<TabPagerDesktopId> activatedDesktops() const {
    return m_activatedDesktops;
  }

private:
  QList<TabPagerDesktop> m_desktops;
  QList<TabPagerDesktopId> m_activatedDesktops;
  TabPagerDesktopId m_currentDesktop;
  bool m_sourceHasDiagnostics = false;
};

class FakeNavigationSettingsSource final
    : public TabPagerNavigationSettingsSource {
public:
  explicit FakeNavigationSettingsSource(bool navigationWrappingAround = false)
      : m_navigationWrappingAround(navigationWrappingAround) {}

  [[nodiscard]] bool navigationWrappingAround() const override {
    return m_navigationWrappingAround;
  }

  void setNavigationWrappingAround(bool navigationWrappingAround) {
    m_navigationWrappingAround = navigationWrappingAround;
    Q_EMIT navigationWrappingAroundChanged();
  }

private:
  bool m_navigationWrappingAround = false;
};

struct BackendFixture {
private:
  struct AdoptSources {};

public:
  explicit BackendFixture(const QList<TabPagerDesktop> &desktops,
                          const TabPagerDesktopId &currentDesktop = {},
                          bool navigationWrappingAround = false)
      : BackendFixture(
            AdoptSources{},
            std::make_unique<FakeDesktopSource>(desktops, currentDesktop),
            std::make_unique<FakeNavigationSettingsSource>(
                navigationWrappingAround)) {}

  FakeDesktopSource *source = nullptr;
  FakeNavigationSettingsSource *settings = nullptr;
  TabPagerBackend backend;

private:
  explicit BackendFixture(
      [[maybe_unused]] AdoptSources adoptSources,
      std::unique_ptr<FakeDesktopSource> fakeSource,
      std::unique_ptr<FakeNavigationSettingsSource> fakeSettings)
      : source(fakeSource.get()), settings(fakeSettings.get()),
        backend(std::move(fakeSource), std::move(fakeSettings)) {}
};

} // namespace TabPagerTest
