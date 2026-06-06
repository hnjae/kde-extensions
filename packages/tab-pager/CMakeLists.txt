# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later

cmake_minimum_required(VERSION 3.25)

project(tabpager VERSION 0.1.0 LANGUAGES C CXX)

set(QML_MODULE_URI "io.github.hnjae.tabpager")
set(QML_MODULE_DIR "io/github/hnjae/tabpager")
set(PLASMOID_ID "io.github.hnjae.tabpager")

find_package(ECM 6.0 REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${ECM_MODULE_PATH})

include(KDEInstallDirs)
include(KDECMakeSettings)
include(KDECompilerSettings NO_POLICY_SCOPE)

find_package(Qt6 REQUIRED COMPONENTS Core Gui Qml Quick)
find_package(LibTaskManager REQUIRED)

include(CTest)

set(CMAKE_AUTOMOC ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(tabpagermodel STATIC
    src/tabpagerbackend.cpp
    src/tabpagerbackend.h
    src/tabpagerdesktop.h
    src/tabpagerdesktopcontroller.cpp
    src/tabpagerdesktopcontroller.h
    src/tabpagerdesktopid.cpp
    src/tabpagerdesktopid.h
    src/tabpagerdesktoplogic.cpp
    src/tabpagerdesktoplogic.h
    src/tabpagerdesktopmodel.cpp
    src/tabpagerdesktopmodel.h
    src/tabpagerdesktopmodelstate.cpp
    src/tabpagerdesktopmodelstate.h
    src/tabpagerdesktopnavigator.cpp
    src/tabpagerdesktopnavigator.h
    src/tabpagerdesktoprow.cpp
    src/tabpagerdesktoprow.h
    src/tabpagerdesktoprows.cpp
    src/tabpagerdesktoprows.h
    src/tabpagerdesktopsource.cpp
    src/tabpagerdesktopsource.h
    src/tabpagerlogging.cpp
    src/tabpagerlogging.h
)
set_target_properties(tabpagermodel PROPERTIES
    POSITION_INDEPENDENT_CODE ON
)
target_include_directories(tabpagermodel PUBLIC
    "${CMAKE_CURRENT_SOURCE_DIR}/src"
)
target_link_libraries(tabpagermodel PUBLIC
    Qt6::Core
    Qt6::Gui
)

add_library(tabpagerplasma STATIC
    src/taskmanagerdesktopmapper.cpp
    src/taskmanagerdesktopmapper.h
    src/tabpagerqmlbackend.cpp
    src/tabpagerqmlbackend.h
    src/tabpagervirtualdesktopinfo.cpp
    src/tabpagervirtualdesktopinfo.h
    src/taskmanagerdesktopsource.cpp
    src/taskmanagerdesktopsource.h
)
set_target_properties(tabpagerplasma PROPERTIES
    POSITION_INDEPENDENT_CODE ON
)
target_link_libraries(tabpagerplasma PUBLIC
    tabpagermodel
)
target_link_libraries(tabpagerplasma PRIVATE
    PW::LibTaskManager
)

add_library(tabpagerplugin SHARED
    src/tabpagerplugin.cpp
    src/tabpagerplugin.h
)
target_compile_definitions(tabpagerplugin PRIVATE
    TABPAGER_QML_URI="${QML_MODULE_URI}"
)
target_link_libraries(tabpagerplugin PRIVATE
    Qt6::Qml
    tabpagerplasma
)

if(BUILD_TESTING)
    find_package(Qt6 REQUIRED COMPONENTS Test)

    function(add_tabpager_test test_name test_source)
        set(test_target "${test_name}_test")
        add_executable("${test_target}"
            "${test_source}"
            ${ARGN}
        )
        target_link_libraries("${test_target}" PRIVATE
            Qt6::Test
            tabpagermodel
        )

        add_test(NAME "${test_name}" COMMAND "${test_target}")
        set_tests_properties("${test_name}" PROPERTIES
            ENVIRONMENT "QT_QPA_PLATFORM=offscreen"
        )
    endfunction()

    add_tabpager_test(tabpagerdesktoplogic tests/tabpagerdesktoplogic_test.cpp)
    add_tabpager_test(tabpagerdesktoprow tests/tabpagerdesktoprow_test.cpp)
    add_tabpager_test(tabpagerdesktoprows tests/tabpagerdesktoprows_test.cpp)
    add_tabpager_test(tabpagerdesktopmodel tests/tabpagerdesktopmodel_test.cpp)
    add_tabpager_test(tabpagerdesktopmodelstate tests/tabpagerdesktopmodelstate_test.cpp)
    add_tabpager_test(tabpagerdesktopnavigator tests/tabpagerdesktopnavigator_test.cpp)
    add_tabpager_test(tabpagerdesktopcontroller
        tests/tabpagerdesktopcontroller_test.cpp
        tests/tabpagerbackendtesthelpers.h
    )
    add_tabpager_test(tabpagerlayoutmetrics tests/tabpagerlayoutmetrics_test.cpp)
    get_filename_component(QT6_QML_INSTALL_PREFIX "${Qt6Qml_DIR}/../../.." ABSOLUTE)
    target_compile_definitions(tabpagerlayoutmetrics_test PRIVATE
        TABPAGER_SOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}"
        TABPAGER_QML_IMPORT_PATH="${QT6_QML_INSTALL_PREFIX}/lib/qt-6/qml"
    )
    target_link_libraries(tabpagerlayoutmetrics_test PRIVATE
        Qt6::Qml
    )
    add_tabpager_test(tabpagerview tests/tabpagerview_test.cpp)
    target_compile_definitions(tabpagerview_test PRIVATE
        TABPAGER_SOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}"
        TABPAGER_QML_IMPORT_PATH="${QT6_QML_INSTALL_PREFIX}/lib/qt-6/qml"
    )
    target_link_libraries(tabpagerview_test PRIVATE
        Qt6::Qml
        Qt6::Quick
    )
    add_tabpager_test(tabpagerbackend tests/tabpagerbackend_test.cpp
        tests/tabpagerbackendtesthelpers.h
    )
    add_tabpager_test(taskmanagerdesktopsource
        tests/taskmanagerdesktopsource_test.cpp
    )
    target_link_libraries(taskmanagerdesktopsource_test PRIVATE
        tabpagerplasma
    )
endif()

install(TARGETS tabpagerplugin
    LIBRARY DESTINATION "${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}"
)
install(FILES src/qmldir
    src/tabpagerplugin.qmltypes
    DESTINATION "${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}"
)
install(DIRECTORY package/
    DESTINATION "${KDE_INSTALL_DATADIR}/plasma/plasmoids/${PLASMOID_ID}"
)
