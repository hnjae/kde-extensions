# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later

cmake_minimum_required(VERSION 3.25)

project(numberedtaskmanager VERSION 0.1.0 LANGUAGES CXX)

set(QML_MODULE_URI "org.hnjae.numberedtaskmanager")
set(QML_MODULE_DIR "org/hnjae/numberedtaskmanager")
set(PLASMOID_ID "org.hnjae.numberedtaskmanager")

find_package(ECM 6.0 REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${ECM_MODULE_PATH})

include(KDEInstallDirs)
include(KDECMakeSettings)
include(KDECompilerSettings NO_POLICY_SCOPE)
include(CTest)

find_package(Qt6 REQUIRED COMPONENTS Core Gui Qml Test)
find_package(KF6 REQUIRED COMPONENTS Config KIO Service)

set(CMAKE_AUTOMOC ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(numberedtaskmanagerplugin SHARED
    src/desktopactionlogic.cpp
    src/desktopactionlogic.h
    src/numberedtaskmanagerplugin.cpp
    src/numberedtaskmanagerplugin.h
    src/taskcontextmenubackend.cpp
    src/taskcontextmenubackend.h
)
target_compile_definitions(numberedtaskmanagerplugin PRIVATE
    NUMBEREDTASKMANAGER_QML_URI="${QML_MODULE_URI}"
)
target_link_libraries(numberedtaskmanagerplugin PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    KF6::ConfigCore
    KF6::KIOGui
    KF6::Service
)

if(BUILD_TESTING)
    add_executable(desktopactionlogic_test
        src/desktopactionlogic.cpp
        src/desktopactionlogic.h
        tests/desktopactionlogic_test.cpp
    )
    target_link_libraries(desktopactionlogic_test PRIVATE
        Qt6::Core
        Qt6::Gui
        Qt6::Test
        KF6::KIOGui
        KF6::Service
    )
    add_test(NAME desktopactionlogic_test COMMAND desktopactionlogic_test)
    set_tests_properties(desktopactionlogic_test PROPERTIES
        ENVIRONMENT "QT_QPA_PLATFORM=offscreen"
    )
endif()

install(TARGETS numberedtaskmanagerplugin
    LIBRARY DESTINATION "${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}"
)
install(FILES
    src/org/hnjae/numberedtaskmanager/qmldir
    src/org/hnjae/numberedtaskmanager/numberedtaskmanagerplugin.qmltypes
    DESTINATION "${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}"
)
install(DIRECTORY package/
    DESTINATION "${KDE_INSTALL_DATADIR}/plasma/plasmoids/${PLASMOID_ID}"
)
install(FILES metainfo/${PLASMOID_ID}.metainfo.xml
    DESTINATION "${KDE_INSTALL_DATADIR}/metainfo"
)
install(DIRECTORY LICENSES/
    DESTINATION "${KDE_INSTALL_DATADIR}/licenses/numbered-task-manager"
    FILES_MATCHING PATTERN "*.txt"
)
