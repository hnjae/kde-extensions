// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include "tabpagerdesktoplogic.h"

#include <QFontDatabase>

#include <cassert>
#include <utility>

namespace {
[[nodiscard]] int indexOfDesktop(const QList<TabPagerDesktop> &desktops,
                                 const QVariant &desktopId) {
  for (qsizetype index = 0; index < desktops.size(); ++index) {
    if (desktops.at(index).id == desktopId) {
      return static_cast<int>(index);
    }
  }

  return -1;
}

[[nodiscard]] QList<int>
changedRolesForDesktop(qsizetype row, const TabPagerDesktop &previousDesktop,
                       const TabPagerDesktop &nextDesktop,
                       const QVariant &previousCurrentDesktop,
                       const QVariant &nextCurrentDesktop) {
  QList<int> roles;

  if (previousDesktop.id != nextDesktop.id) {
    roles.append(TabPagerBackend::DesktopIdRole);
  }

  if (previousDesktop.name != nextDesktop.name) {
    roles.append(TabPagerBackend::NameRole);
  }

  const int number = static_cast<int>(row + 1);
  if (TabPagerDesktopLogic::labelForDesktop(number, previousDesktop.name) !=
      TabPagerDesktopLogic::labelForDesktop(number, nextDesktop.name)) {
    roles.append(TabPagerBackend::LabelRole);
  }

  if ((previousDesktop.id == previousCurrentDesktop) !=
      (nextDesktop.id == nextCurrentDesktop)) {
    roles.append(TabPagerBackend::ActiveRole);
  }

  return roles;
}
} // namespace

TabPagerBackend::TabPagerBackend(TabPagerDesktopSource *source, QObject *parent)
    : QAbstractListModel(parent), m_source(source) {
  initializeSource();
}

TabPagerBackend::TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                                 QObject *parent)
    : QAbstractListModel(parent), m_ownedSource(std::move(source)),
      m_source(m_ownedSource.get()) {
  initializeSource();
}

TabPagerBackend::~TabPagerBackend() = default;

int TabPagerBackend::rowCount(const QModelIndex &parent) const {
  if (parent.isValid()) {
    return 0;
  }

  return count();
}

QVariant TabPagerBackend::data(const QModelIndex &index, int role) const {
  if (!index.isValid() || index.row() < 0 || index.row() >= m_desktops.size()) {
    return {};
  }

  const int row = index.row();
  const TabPagerDesktop &desktop = m_desktops.at(row);

  switch (role) {
  case DesktopIdRole:
    return desktop.id;
  case NameRole:
    return desktop.name;
  case LabelRole:
    return TabPagerDesktopLogic::labelForDesktop(row + 1, desktop.name);
  case NumberRole:
    return row + 1;
  case ActiveRole:
    return desktop.id == m_currentDesktop;
  default:
    return {};
  }
}

QHash<int, QByteArray> TabPagerBackend::roleNames() const {
  return {
      {DesktopIdRole, "desktopId"}, {NameRole, "name"},
      {LabelRole, "label"},         {NumberRole, "number"},
      {ActiveRole, "active"},
  };
}

int TabPagerBackend::count() const {
  return static_cast<int>(m_desktops.size());
}

int TabPagerBackend::currentIndex() const {
  return indexOfDesktop(m_currentDesktop);
}

bool TabPagerBackend::navigationWrappingAround() const {
  return m_navigationWrappingAround;
}

QFont TabPagerBackend::labelFont() const {
  return QFontDatabase::systemFont(QFontDatabase::FixedFont);
}

void TabPagerBackend::activate(int index) {
  if (index < 0 || index >= m_desktops.size()) {
    return;
  }

  m_source->activateDesktop(m_desktops.at(index).id);
}

void TabPagerBackend::activateNext() { activateOffset(1); }

void TabPagerBackend::activatePrevious() { activateOffset(-1); }

void TabPagerBackend::initializeSource() {
  assert(m_source != nullptr);
  connectSource();
  reloadDesktops();
  reloadNavigationWrappingAround();
}

void TabPagerBackend::connectSource() {
  connect(m_source, &TabPagerDesktopSource::desktopsChanged, this,
          &TabPagerBackend::reloadDesktops);
  connect(m_source, &TabPagerDesktopSource::currentDesktopChanged, this,
          &TabPagerBackend::reloadCurrentDesktop);
  connect(m_source, &TabPagerDesktopSource::navigationWrappingAroundChanged,
          this, &TabPagerBackend::reloadNavigationWrappingAround);
}

void TabPagerBackend::reloadDesktops() {
  const int previousCount = count();
  const int previousCurrentIndex = currentIndex();
  const QList<TabPagerDesktop> nextDesktops = m_source->desktops();
  const QVariant nextCurrentDesktop = m_source->currentDesktop();

  if (previousCount != nextDesktops.size()) {
    resetDesktops(nextDesktops, nextCurrentDesktop);
  } else {
    updateDesktopRows(nextDesktops, nextCurrentDesktop);
  }

  if (previousCount != count()) {
    Q_EMIT countChanged();
  }

  if (previousCurrentIndex != currentIndex()) {
    Q_EMIT currentIndexChanged();
  }
}

void TabPagerBackend::reloadCurrentDesktop() {
  setCurrentDesktop(m_source->currentDesktop());
}

void TabPagerBackend::reloadNavigationWrappingAround() {
  const bool nextNavigationWrappingAround =
      m_source->navigationWrappingAround();

  if (m_navigationWrappingAround == nextNavigationWrappingAround) {
    return;
  }

  m_navigationWrappingAround = nextNavigationWrappingAround;
  Q_EMIT navigationWrappingAroundChanged();
}

void TabPagerBackend::resetDesktops(const QList<TabPagerDesktop> &desktops,
                                    const QVariant &currentDesktop) {
  beginResetModel();
  m_desktops = desktops;
  m_currentDesktop = currentDesktop;
  endResetModel();
}

void TabPagerBackend::updateDesktopRows(const QList<TabPagerDesktop> &desktops,
                                        const QVariant &currentDesktop) {
  if (m_desktops == desktops && m_currentDesktop == currentDesktop) {
    return;
  }

  const QList<TabPagerDesktop> previousDesktops = m_desktops;
  const QVariant previousCurrentDesktop = m_currentDesktop;

  m_desktops = desktops;
  m_currentDesktop = currentDesktop;

  for (qsizetype row = 0; row < m_desktops.size(); ++row) {
    const QList<int> roles = changedRolesForDesktop(
        row, previousDesktops.at(row), m_desktops.at(row),
        previousCurrentDesktop, m_currentDesktop);
    if (!roles.isEmpty()) {
      const QModelIndex changedIndex = index(static_cast<int>(row));
      Q_EMIT dataChanged(changedIndex, changedIndex, roles);
    }
  }
}

void TabPagerBackend::setCurrentDesktop(const QVariant &currentDesktop) {
  const int previousIndex = currentIndex();
  m_currentDesktop = currentDesktop;
  const int nextIndex = currentIndex();

  if (previousIndex == nextIndex) {
    return;
  }

  Q_EMIT currentIndexChanged();

  const QList<int> roles = {ActiveRole};
  if (previousIndex >= 0) {
    Q_EMIT dataChanged(index(previousIndex), index(previousIndex), roles);
  }
  if (nextIndex >= 0) {
    Q_EMIT dataChanged(index(nextIndex), index(nextIndex), roles);
  }
}

void TabPagerBackend::activateOffset(int offset) {
  const int targetIndex = TabPagerDesktopLogic::targetIndexForOffset(
      currentIndex(), count(), offset, m_navigationWrappingAround);
  if (targetIndex >= 0) {
    activate(targetIndex);
  }
}

int TabPagerBackend::indexOfDesktop(const QVariant &desktopId) const {
  return ::indexOfDesktop(m_desktops, desktopId);
}
