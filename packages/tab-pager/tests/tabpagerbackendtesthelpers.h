// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerbackend.h"
#include "tabpagertesthelpers.h"

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

  [[nodiscard]] TabPagerDesktopSourceState sourceState() const override {
    return TabPagerDesktopSourceState{
        .desktopSnapshot =
            TabPagerTest::desktopSnapshot(m_desktops, m_currentDesktop),
    };
  }

  [[nodiscard]] bool navigationWrappingAround() const override {
    return m_navigationWrappingAround;
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

  void setNavigationWrappingAround(bool navigationWrappingAround) {
    m_navigationWrappingAround = navigationWrappingAround;
    Q_EMIT navigationWrappingAroundChanged();
  }

  void setSourceState(const QList<TabPagerDesktop> &desktops,
                      const TabPagerDesktopId &currentDesktop,
                      bool navigationWrappingAround) {
    m_desktops = desktops;
    m_currentDesktop = currentDesktop;
    m_navigationWrappingAround = navigationWrappingAround;
    Q_EMIT sourceStateChanged();
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

} // namespace TabPagerTest
