// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopmodelstate.h"
#include "tabpagerdesktopsource.h"

#include <QAbstractListModel>
#include <QFont>
#include <QVariant>

#include <cstdint>
#include <memory>

class TabPagerBackend : public QAbstractListModel {
  Q_OBJECT
  Q_PROPERTY(int count READ count NOTIFY countChanged)
  Q_PROPERTY(int currentIndex READ currentIndex NOTIFY currentIndexChanged)
  Q_PROPERTY(bool navigationWrappingAround READ navigationWrappingAround NOTIFY
                 navigationWrappingAroundChanged)
  Q_PROPERTY(QFont labelFont READ labelFont CONSTANT)

public:
  enum Role : std::uint16_t {
    DesktopIdRole = Qt::UserRole + 1,
    NameRole,
    LabelRole,
    NumberRole,
    ActiveRole,
  };
  Q_ENUM(Role)

  explicit TabPagerBackend(TabPagerDesktopSource *source,
                           QObject *parent = nullptr);
  explicit TabPagerBackend(std::unique_ptr<TabPagerDesktopSource> source,
                           QObject *parent = nullptr);
  ~TabPagerBackend() override;

  [[nodiscard]] int
  rowCount(const QModelIndex &parent = QModelIndex()) const override;
  [[nodiscard]] QVariant data(const QModelIndex &index,
                              int role = Qt::DisplayRole) const override;
  [[nodiscard]] QHash<int, QByteArray> roleNames() const override;

  [[nodiscard]] int count() const;
  [[nodiscard]] int currentIndex() const;
  [[nodiscard]] bool navigationWrappingAround() const;
  [[nodiscard]] QFont labelFont() const;

  Q_INVOKABLE void activate(int index);
  Q_INVOKABLE void activateNext();
  Q_INVOKABLE void activatePrevious();

Q_SIGNALS:
  void countChanged();
  void currentIndexChanged();
  void navigationWrappingAroundChanged();

private:
  void initializeSource();
  void connectSource();
  void reloadDesktops();
  void reloadCurrentDesktop();
  void reloadNavigationWrappingAround();
  [[nodiscard]] TabPagerDesktopSnapshot sourceDesktopSnapshot() const;
  [[nodiscard]] static QList<int>
  changedRolesForRow(qsizetype row,
                     const TabPagerDesktopSnapshot &previousSnapshot,
                     const TabPagerDesktopSnapshot &nextSnapshot);
  void applyDesktopSnapshot(const TabPagerDesktopSnapshot &snapshot);
  void resetDesktopSnapshot(const TabPagerDesktopSnapshot &snapshot);
  void
  updateDesktopSnapshotRows(const TabPagerDesktopSnapshot &previousSnapshot,
                            const TabPagerDesktopSnapshot &nextSnapshot);
  void activateOffset(int offset);

  std::unique_ptr<TabPagerDesktopSource> m_ownedSource;
  TabPagerDesktopSource *m_source = nullptr;
  TabPagerDesktopModelState m_state;
  bool m_navigationWrappingAround = false;
};
