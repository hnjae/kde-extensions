# SPDX-FileCopyrightText: 2026 KIM Hyunjae
# SPDX-License-Identifier: AGPL-3.0-or-later

cmake_minimum_required(VERSION 3.25)

project(numbered-task-manager VERSION 0.1.0 LANGUAGES CXX)

set(PLASMOID_ID "io.github.hnjae.numberedtaskmanager")

find_package(ECM 6.0 REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${ECM_MODULE_PATH})

include(KDEInstallDirs)
include(KDECMakeSettings)

install(DIRECTORY package/
    DESTINATION "${KDE_INSTALL_DATADIR}/plasma/plasmoids/${PLASMOID_ID}"
)

install(FILES metainfo/${PLASMOID_ID}.metainfo.xml
    DESTINATION "${KDE_INSTALL_METAINFODIR}"
)

install(DIRECTORY LICENSES/
    DESTINATION "${KDE_INSTALL_DATADIR}/licenses/${PROJECT_NAME}"
    FILES_MATCHING PATTERN "*.txt"
)
