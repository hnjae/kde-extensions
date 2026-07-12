// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

#include "desktopactionjobowner.h"

#include <utility>

DesktopActionJobOwner::DesktopActionJobOwner(
    DesktopActionJobFactory jobFactory,
    DesktopActionResultHandler resultHandler, QObject *parent)
    : QObject(parent), m_jobFactory(std::move(jobFactory)),
      m_resultHandler(std::move(resultHandler)) {}

DesktopActionJobOwner::~DesktopActionJobOwner() {
  const QList<KJob *> activeJobs = m_activeJobs.values();
  m_activeJobs.clear();
  for (KJob *job : activeJobs) {
    if (job == nullptr) {
      continue;
    }

    QObject::disconnect(job, nullptr, this, nullptr);
    job->kill(KJob::Quietly);
  }
}

void DesktopActionJobOwner::launch(const DesktopActionDescriptor &descriptor) {
  if (!m_jobFactory) {
    return;
  }

  KJob *job = m_jobFactory(descriptor);
  if (job == nullptr) {
    return;
  }

  m_activeJobs.insert(job);
  QObject::connect(
      job, &KJob::result, this, [this, descriptor](KJob *completedJob) {
        if (completedJob == nullptr || completedJob->error() == 0 ||
            !m_resultHandler) {
          return;
        }

        m_resultHandler(
            desktopActionLaunchFailureResult(descriptor, completedJob));
      });
  QObject::connect(job, &KJob::finished, this, [this](KJob *finishedJob) {
    m_activeJobs.remove(finishedJob);
  });
  QObject::connect(job, &QObject::destroyed, this,
                   [this, job]() { m_activeJobs.remove(job); });
  job->start();
}

qsizetype DesktopActionJobOwner::activeJobCount() const {
  return m_activeJobs.size();
}
