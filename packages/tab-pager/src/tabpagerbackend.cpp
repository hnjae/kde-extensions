// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerbackend.h"

#include <QFontDatabase>

#include <cassert>
#include <utility>

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
    return labelForDesktop(row + 1, desktop.name);
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

QString TabPagerBackend::labelForDesktop(int number, const QString &name) {
  if (name.isEmpty()) {
    return QString::number(number);
  }

  if (name == QStringLiteral("Desktop %1").arg(number)) {
    return QString::number(number);
  }

  return name;
}

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

  beginResetModel();
  m_desktops = m_source->desktops();
  m_currentDesktop = m_source->currentDesktop();
  endResetModel();

  if (previousCount != count()) {
    Q_EMIT countChanged();
  }

  if (previousCurrentIndex != currentIndex()) {
    Q_EMIT currentIndexChanged();
  }
}

void TabPagerBackend::reloadCurrentDesktop() {
  const int previousIndex = currentIndex();
  m_currentDesktop = m_source->currentDesktop();
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

void TabPagerBackend::reloadNavigationWrappingAround() {
  const bool nextNavigationWrappingAround =
      m_source->navigationWrappingAround();

  if (m_navigationWrappingAround == nextNavigationWrappingAround) {
    return;
  }

  m_navigationWrappingAround = nextNavigationWrappingAround;
  Q_EMIT navigationWrappingAroundChanged();
}

void TabPagerBackend::activateOffset(int offset) {
  const int desktopCount = count();
  const int sourceIndex = currentIndex();

  if (desktopCount == 0 || sourceIndex < 0) {
    return;
  }

  const int targetIndex = sourceIndex + offset;
  if (targetIndex >= 0 && targetIndex < desktopCount) {
    activate(targetIndex);
    return;
  }

  if (!m_navigationWrappingAround) {
    return;
  }

  if (targetIndex < 0) {
    activate(desktopCount - 1);
  } else {
    activate(0);
  }
}

int TabPagerBackend::indexOfDesktop(const QVariant &desktopId) const {
  for (qsizetype index = 0; index < m_desktops.size(); ++index) {
    if (m_desktops.at(index).id == desktopId) {
      return static_cast<int>(index);
    }
  }

  return -1;
}
