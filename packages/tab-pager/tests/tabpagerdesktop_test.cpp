// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "tabpagerdesktop.h"
#include "tabpagertesthelpers.h"

#include <QTest>

namespace {
using TabPagerTest::defaultDesktop;
using TabPagerTest::desktopId;
using TabPagerTest::invalidDesktop;
using TabPagerTest::namedDesktop;

using NormalizationIssueType = TabPagerDesktopSnapshotNormalizationIssue::Type;
} // namespace

class TabPagerDesktopTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void normalizesSnapshotIdentity();
  void clearsCurrentDesktopWhenItDoesNotMatchNormalizedDesktops();
};

void TabPagerDesktopTest::normalizesSnapshotIdentity() {
  const TabPagerDesktopSnapshotNormalizationResult result =
      normalizeTabPagerDesktopSnapshot(
          {
              invalidDesktop(QStringLiteral("Bad")),
              namedDesktop("a", "Work"),
              namedDesktop("a", "Duplicate"),
              defaultDesktop("b", 2),
          },
          desktopId("a"));

  QCOMPARE(result.snapshot.desktops().size(), 2);
  QCOMPARE(result.snapshot.desktops().at(0).id, desktopId("a"));
  QCOMPARE(result.snapshot.desktops().at(0).name, QStringLiteral("Work"));
  QCOMPARE(result.snapshot.desktops().at(1).id, desktopId("b"));
  QCOMPARE(result.snapshot.currentDesktop(), desktopId("a"));

  QCOMPARE(result.issues.size(), 2);
  QCOMPARE(result.issues.at(0).type, NormalizationIssueType::InvalidDesktopId);
  QCOMPARE(result.issues.at(0).row, 0);
  QCOMPARE(result.issues.at(1).type,
           NormalizationIssueType::DuplicateDesktopId);
  QCOMPARE(result.issues.at(1).row, 2);
  QCOMPARE(result.issues.at(1).relatedRow, 1);
  QCOMPARE(result.issues.at(1).desktopId, desktopId("a"));
}

void TabPagerDesktopTest::
    clearsCurrentDesktopWhenItDoesNotMatchNormalizedDesktops() {
  const TabPagerDesktopSnapshotNormalizationResult result =
      normalizeTabPagerDesktopSnapshot(
          {namedDesktop("a", "Work"), namedDesktop("b", "Chat")},
          desktopId("missing"));

  QCOMPARE(result.snapshot.desktops().size(), 2);
  QCOMPARE(result.snapshot.currentDesktop().isValid(), false);
  QCOMPARE(result.issues.size(), 1);
  QCOMPARE(result.issues.at(0).type,
           NormalizationIssueType::UnmatchedCurrentDesktop);
  QCOMPARE(result.issues.at(0).desktopId, desktopId("missing"));
}

QTEST_MAIN(TabPagerDesktopTest)

#include "tabpagerdesktop_test.moc"
