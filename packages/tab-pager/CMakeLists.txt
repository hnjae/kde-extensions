# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later

cmake_minimum_required(VERSION 3.25)

project(tab-pager VERSION 0.1.0 LANGUAGES CXX)

set(QML_MODULE_URI "com.example.plasmaextensions.tabpager")
set(QML_MODULE_DIR "com/example/plasmaextensions/tabpager")
set(PLASMOID_ID "com.example.plasmaextensions.tab-pager")

find_package(ECM 6.0 REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${ECM_MODULE_PATH})

include(KDEInstallDirs)
include(KDECMakeSettings)
include(KDECompilerSettings NO_POLICY_SCOPE)

find_package(Qt6 REQUIRED COMPONENTS Core Qml)

include(CTest)

set(CMAKE_AUTOMOC ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(tabpagercore STATIC
    src/tabpagerbackend.cpp
    src/tabpagerbackend.h
)
set_target_properties(tabpagercore PROPERTIES
    POSITION_INDEPENDENT_CODE ON
)
target_include_directories(tabpagercore PUBLIC
    "${CMAKE_CURRENT_SOURCE_DIR}/src"
)
target_link_libraries(tabpagercore PUBLIC
    Qt6::Core
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
    tabpagercore
)

add_executable(tab-pager-hello
    src/hello.cpp
)
target_link_libraries(tab-pager-hello PRIVATE
    tabpagercore
)

if(BUILD_TESTING)
    find_package(Qt6 REQUIRED COMPONENTS Test)

    add_executable(tabpagerbackend_test
        tests/tabpagerbackend_test.cpp
    )
    target_link_libraries(tabpagerbackend_test PRIVATE
        Qt6::Test
        tabpagercore
    )

    add_test(NAME tabpagerbackend COMMAND tabpagerbackend_test)
endif()

install(TARGETS tabpagerplugin
    LIBRARY DESTINATION "${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}"
)
install(FILES src/qmldir
    src/tabpagerplugin.qmltypes
    DESTINATION "${KDE_INSTALL_QMLDIR}/${QML_MODULE_DIR}"
)
install(TARGETS tab-pager-hello
    RUNTIME DESTINATION "${KDE_INSTALL_BINDIR}"
)
install(DIRECTORY package/
    DESTINATION "${KDE_INSTALL_DATADIR}/plasma/plasmoids/${PLASMOID_ID}"
)
