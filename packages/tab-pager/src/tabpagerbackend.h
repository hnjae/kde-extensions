// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include "tabpagerdesktopsource.h"

#include <QAbstractListModel>
#include <QFont>
#include <QList>
#include <QString>
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
  struct DesktopSnapshot {
    QList<TabPagerDesktop> desktops;
    QVariant currentDesktop;
  };

  struct DesktopRowData {
    QVariant desktopId;
    QString name;
    QString label;
    int number = 0;
    bool active = false;
  };

  void initializeSource();
  void connectSource();
  void reloadDesktops();
  void reloadCurrentDesktop();
  void reloadNavigationWrappingAround();
  [[nodiscard]] DesktopSnapshot currentDesktopSnapshot() const;
  [[nodiscard]] DesktopSnapshot sourceDesktopSnapshot() const;
  static bool sameDesktopSnapshot(const DesktopSnapshot &left,
                                  const DesktopSnapshot &right);
  static QList<int>
  changedRolesForDesktop(qsizetype row, const DesktopSnapshot &previousSnapshot,
                         const DesktopSnapshot &nextSnapshot);
  [[nodiscard]] static DesktopRowData
  desktopRowData(qsizetype row, const TabPagerDesktop &desktop,
                 const QVariant &currentDesktop);
  void applyDesktopSnapshot(const DesktopSnapshot &snapshot);
  void resetDesktopSnapshot(const DesktopSnapshot &snapshot);
  void updateDesktopSnapshotRows(const DesktopSnapshot &previousSnapshot,
                                 const DesktopSnapshot &nextSnapshot);
  void activateOffset(int offset);
  [[nodiscard]] int indexOfDesktop(const QVariant &desktopId) const;

  std::unique_ptr<TabPagerDesktopSource> m_ownedSource;
  TabPagerDesktopSource *m_source = nullptr;
  QList<TabPagerDesktop> m_desktops;
  QVariant m_currentDesktop;
  bool m_navigationWrappingAround = false;
};
