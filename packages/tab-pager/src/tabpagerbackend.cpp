// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QFontDatabase>

#include <utility>

TabPagerBackend::TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                                 QObject *parent)
    : QObject(parent), m_controller(std::move(source), m_model) {
  connect(&m_model, &TabPagerDesktopModel::countChanged, this,
          &TabPagerBackend::countChanged);
  connect(&m_model, &TabPagerDesktopModel::currentIndexChanged, this,
          &TabPagerBackend::currentIndexChanged);
  connect(&m_controller,
          &TabPagerDesktopController::navigationWrappingAroundChanged, this,
          &TabPagerBackend::navigationWrappingAroundChanged);
}

TabPagerBackend::~TabPagerBackend() = default;

QAbstractItemModel *TabPagerBackend::model() { return &m_model; }

int TabPagerBackend::count() const { return m_model.count(); }

int TabPagerBackend::currentIndex() const { return m_model.currentIndex(); }

QFont TabPagerBackend::labelFont() const {
  return QFontDatabase::systemFont(QFontDatabase::FixedFont);
}

bool TabPagerBackend::navigationWrappingAround() const {
  return m_controller.navigationWrappingAround();
}

void TabPagerBackend::activate(int index) { m_controller.activate(index); }

void TabPagerBackend::activateNext() { m_controller.activateNext(); }

void TabPagerBackend::activatePrevious() { m_controller.activatePrevious(); }

void TabPagerBackend::activateByWheelDelta(int delta) {
  m_controller.activateByWheelDelta(delta);
}
