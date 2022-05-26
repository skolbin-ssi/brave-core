/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef BRAVE_CHROMIUM_SRC_COMPONENTS_HISTORY_CORE_BROWSER_HISTORY_SERVICE_H_
#define BRAVE_CHROMIUM_SRC_COMPONENTS_HISTORY_CORE_BROWSER_HISTORY_SERVICE_H_

class BraveHistoryURLProviderTest;
class BraveHistoryQuickProviderTest;

#define BRAVE_HISTORY_SERVICE_H               \
 private:                                     \
  friend class ::BraveHistoryURLProviderTest; \
  friend class ::BraveHistoryQuickProviderTest;

#include "src/components/history/core/browser/history_service.h"

#undef BRAVE_HISTORY_SERVICE_H

#endif  // BRAVE_CHROMIUM_SRC_COMPONENTS_HISTORY_CORE_BROWSER_HISTORY_SERVICE_H_
