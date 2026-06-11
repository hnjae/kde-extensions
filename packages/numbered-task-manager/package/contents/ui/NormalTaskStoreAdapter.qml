// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

pragma ComponentBehavior: Bound

import QtQuick as QtQuick
import "NormalTaskStoreLogic.mjs" as NormalTaskStoreLogic
import "TaskModelLogic.mjs" as TaskModelLogic

QtQuick.QtObject {
    id: root

    property var storeState: NormalTaskStoreLogic.createNormalTaskStore()
    property var visibleLauncherPosition
    readonly property var entries: storeState.entries || []

    function launcherPositionForUrl(launcherUrl) {
        if (typeof root.visibleLauncherPosition !== "function") {
            return -1;
        }

        return root.visibleLauncherPosition(launcherUrl);
    }

    function allocatePublicationKey() {
        const publication = NormalTaskStoreLogic.allocateNormalTaskPublication(storeState);
        storeState = publication.store;
        return publication.key;
    }

    function publishNormalTask(key, qualifies, task) {
        const store = storeState;
        const nextStore = NormalTaskStoreLogic.publishNormalTask(store, key, qualifies, task, launcherUrl => launcherPositionForUrl(launcherUrl));
        if (nextStore !== store) {
            storeState = nextStore;
        }
    }

    function removeNormalTask(key) {
        const store = storeState;
        const nextStore = NormalTaskStoreLogic.removeNormalTask(store, key, launcherUrl => launcherPositionForUrl(launcherUrl));
        if (nextStore !== store) {
            storeState = nextStore;
        }
    }

    function recomputeEntries() {
        storeState = NormalTaskStoreLogic.recomputeNormalTaskStore(storeState, launcherUrl => launcherPositionForUrl(launcherUrl));
    }

    function moveManualTask(sourceKey, targetKey) {
        const result = TaskModelLogic.moveManualTaskOrder(entries, sourceKey, targetKey);
        if (!result.moved) {
            return false;
        }

        storeState = Object.assign({}, storeState, {
            manualOrder: result.order
        });
        recomputeEntries();
        return true;
    }
}
