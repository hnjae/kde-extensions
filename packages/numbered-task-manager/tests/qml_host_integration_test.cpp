// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include <QDragEnterEvent>
#include <QDropEvent>
#include <QMimeData>
#include <QQuickItem>
#include <QQuickView>
#include <QTest>

class QmlHostIntegrationTest : public QObject {
  Q_OBJECT

private Q_SLOTS:
  void dragHandlerReachesDropArea();
};

void QmlHostIntegrationTest::dragHandlerReachesDropArea() {
  QQuickView view;
  view.setSource(
      QUrl::fromLocalFile(QStringLiteral(NUMBERED_TASK_MANAGER_DRAG_FIXTURE)));
  QCOMPARE(view.status(), QQuickView::Ready);
  view.resize(400, 200);
  view.show();
  QTest::qWait(50);

  auto *root = view.rootObject();
  QVERIFY(root);
  QMimeData mimeData;
  mimeData.setData(QStringLiteral("application/x-numbered-task"),
                   QByteArrayLiteral("1"));
  QDragEnterEvent enterEvent(QPoint(280, 44), Qt::MoveAction, &mimeData,
                             Qt::LeftButton, Qt::NoModifier);
  QCoreApplication::sendEvent(&view, &enterEvent);
  QVERIFY(enterEvent.isAccepted());
  QDropEvent dropEvent(QPointF(280, 44), Qt::MoveAction, &mimeData,
                       Qt::LeftButton, Qt::NoModifier);
  QCoreApplication::sendEvent(&view, &dropEvent);
  QTRY_COMPARE(root->property("droppedSource").toInt(), 1);
  QCOMPARE(root->property("droppedTarget").toInt(), 2);
  QVERIFY(root->property("accepted").toBool());

  root->setProperty("acceptDrops", false);
  root->setProperty("accepted", false);
  root->setProperty("droppedSource", -1);
  QDragEnterEvent rejectedEvent(QPoint(280, 44), Qt::MoveAction, &mimeData,
                                Qt::LeftButton, Qt::NoModifier);
  QCoreApplication::sendEvent(&view, &rejectedEvent);
  QVERIFY(!rejectedEvent.isAccepted());
  QCOMPARE(root->property("droppedSource").toInt(), -1);
  QVERIFY(!root->property("accepted").toBool());
}

QTEST_MAIN(QmlHostIntegrationTest)

#include "qml_host_integration_test.moc"
