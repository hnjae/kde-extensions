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

} // namespace

QList<int>
TabPagerBackend::changedRolesForDesktop(qsizetype row,
                                        const DesktopSnapshot &previousSnapshot,
                                        const DesktopSnapshot &nextSnapshot) {
  const TabPagerDesktop &previousDesktop = previousSnapshot.desktops.at(row);
  const TabPagerDesktop &nextDesktop = nextSnapshot.desktops.at(row);
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

  if ((previousDesktop.id == previousSnapshot.currentDesktop) !=
      (nextDesktop.id == nextSnapshot.currentDesktop)) {
    roles.append(TabPagerBackend::ActiveRole);
  }

  return roles;
}

bool TabPagerBackend::sameDesktopSnapshot(const DesktopSnapshot &left,
                                          const DesktopSnapshot &right) {
  return left.desktops == right.desktops &&
         left.currentDesktop == right.currentDesktop;
}

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
  applyDesktopSnapshot(sourceDesktopSnapshot());
}

void TabPagerBackend::reloadCurrentDesktop() {
  DesktopSnapshot snapshot = currentDesktopSnapshot();
  snapshot.currentDesktop = m_source->currentDesktop();
  applyDesktopSnapshot(snapshot);
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

TabPagerBackend::DesktopSnapshot
TabPagerBackend::currentDesktopSnapshot() const {
  return DesktopSnapshot{
      .desktops = m_desktops,
      .currentDesktop = m_currentDesktop,
  };
}

TabPagerBackend::DesktopSnapshot
TabPagerBackend::sourceDesktopSnapshot() const {
  return DesktopSnapshot{
      .desktops = m_source->desktops(),
      .currentDesktop = m_source->currentDesktop(),
  };
}

void TabPagerBackend::applyDesktopSnapshot(const DesktopSnapshot &snapshot) {
  const DesktopSnapshot previousSnapshot = currentDesktopSnapshot();
  if (sameDesktopSnapshot(previousSnapshot, snapshot)) {
    return;
  }

  const int previousCount = count();
  const int previousCurrentIndex = currentIndex();

  if (previousCount != snapshot.desktops.size()) {
    resetDesktopSnapshot(snapshot);
  } else {
    updateDesktopSnapshotRows(previousSnapshot, snapshot);
  }

  if (previousCount != count()) {
    Q_EMIT countChanged();
  }

  if (previousCurrentIndex != currentIndex()) {
    Q_EMIT currentIndexChanged();
  }
}

void TabPagerBackend::resetDesktopSnapshot(const DesktopSnapshot &snapshot) {
  beginResetModel();
  m_desktops = snapshot.desktops;
  m_currentDesktop = snapshot.currentDesktop;
  endResetModel();
}

void TabPagerBackend::updateDesktopSnapshotRows(
    const DesktopSnapshot &previousSnapshot,
    const DesktopSnapshot &nextSnapshot) {
  m_desktops = nextSnapshot.desktops;
  m_currentDesktop = nextSnapshot.currentDesktop;

  for (qsizetype row = 0; row < m_desktops.size(); ++row) {
    const QList<int> roles =
        changedRolesForDesktop(row, previousSnapshot, nextSnapshot);
    if (!roles.isEmpty()) {
      const QModelIndex changedIndex = index(static_cast<int>(row));
      Q_EMIT dataChanged(changedIndex, changedIndex, roles);
    }
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
