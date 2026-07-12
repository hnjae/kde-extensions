// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import QtQuick
import QtTest
import org.hnjae.numberedtaskmanager.testing 1.0
import "../../package/contents/ui" as NumberedTaskManager

TestCase {
    name: "TaskSources"

    TestTaskModel {
        id: normalModel
    }
    TestTaskModel {
        id: attentionModel
    }

    NumberedTaskManager.NormalTaskSource {
        id: normalSource
        taskModel: normalModel
        currentDesktop: "1"
        createPublicationKey: () => "normal-key"
        visibleLauncherPosition: () => -1
    }
    NumberedTaskManager.RemoteAttentionSource {
        id: attentionSource
        taskModel: attentionModel
        currentDesktop: "1"
    }

    SignalSpy {
        id: normalPublished
        target: normalSource
        signalName: "taskPublished"
    }
    SignalSpy {
        id: normalRemoved
        target: normalSource
        signalName: "taskRemoved"
    }
    SignalSpy {
        id: attentionPublished
        target: attentionSource
        signalName: "attentionPublished"
    }
    SignalSpy {
        id: attentionRemoved
        target: attentionSource
        signalName: "attentionRemoved"
    }

    function normalRow(overrides) {
        return Object.assign({
            Activities: [],
            AppName: "App",
            CanLaunchNewInstance: true,
            CanSetNoBorder: true,
            HasNoBorder: false,
            IsActive: false,
            IsClosable: true,
            IsDemandingAttention: false,
            IsExcludedFromCapture: false,
            IsFullScreen: false,
            IsFullScreenable: true,
            IsKeepAbove: false,
            IsKeepBelow: false,
            IsLauncher: false,
            IsMaximizable: true,
            IsMaximized: false,
            IsMinimizable: true,
            IsMinimized: false,
            IsMovable: true,
            IsOnAllVirtualDesktops: true,
            IsResizable: true,
            IsShadeable: true,
            IsShaded: false,
            IsStartup: false,
            IsVirtualDesktopsChangeable: true,
            IsWindow: true,
            LauncherUrl: "applications:app.desktop",
            LauncherUrlWithoutIcon: "applications:app.desktop",
            VirtualDesktops: [],
            WinIdList: [42],
            decoration: "",
            display: "Window"
        }, overrides || {});
    }

    function init() {
        while (normalModel.rowCount() > 0)
            normalModel.removeRow(0);
        while (attentionModel.rowCount() > 0)
            attentionModel.removeRow(0);
        wait(0);
        normalPublished.clear();
        normalRemoved.clear();
        attentionPublished.clear();
        attentionRemoved.clear();
    }

    function test_normal_publication_change_and_destruction() {
        normalModel.appendRow(normalRow());
        tryVerify(() => normalPublished.count >= 1);
        compare(normalPublished.signalArguments[0][0], "normal-key");
        verify(normalPublished.signalArguments[0][1]);

        normalModel.changeRow(0, {
            IsWindow: false
        });
        tryVerify(() => normalPublished.count >= 2);
        verify(!normalPublished.signalArguments[normalPublished.count - 1][1]);

        normalModel.removeRow(0);
        tryCompare(normalRemoved, "count", 1);
        compare(normalRemoved.signalArguments[0][0], "normal-key");
    }

    function test_remote_publication_change_and_destruction() {
        attentionModel.appendRow(normalRow({
            IsDemandingAttention: true,
            IsOnAllVirtualDesktops: false,
            VirtualDesktops: ["2"]
        }));
        tryVerify(() => attentionPublished.count >= 1);
        verify(attentionPublished.signalArguments[0][2]);

        attentionModel.changeRow(0, {
            IsDemandingAttention: false
        });
        tryVerify(() => attentionPublished.count >= 2);
        verify(!attentionPublished.signalArguments[attentionPublished.count - 1][2]);

        attentionModel.changeRow(0, {
            IsDemandingAttention: true
        });
        tryVerify(() => attentionPublished.count >= 3 && attentionPublished.signalArguments[attentionPublished.count - 1][2]);
        const key = attentionPublished.signalArguments[attentionPublished.count - 1][1];
        attentionModel.removeRow(0);
        tryCompare(attentionSource, "count", 0);
        verify(attentionRemoved.count === 1 || attentionPublished.signalArguments[attentionPublished.count - 1][2] === false);
        if (attentionRemoved.count === 1)
            compare(attentionRemoved.signalArguments[0][0], key);
    }
}
