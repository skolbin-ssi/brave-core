/* Copyright (c) 2020 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "brave/components/omnibox/browser/brave_bookmark_provider.h"
#include "brave/components/omnibox/browser/brave_history_quick_provider.h"
#include "brave/components/omnibox/browser/brave_history_url_provider.h"
#include "brave/components/omnibox/browser/brave_search_provider.h"
#include "brave/components/omnibox/browser/suggested_sites_provider.h"
#include "brave/components/omnibox/browser/topsites_provider.h"
#include "components/omnibox/browser/clipboard_provider.h"

#define SearchProvider BraveSearchProvider
#define HistoryQuickProvider BraveHistoryQuickProvider
#define HistoryURLProvider BraveHistoryURLProvider
#define BookmarkProvider BraveBookmarkProvider
#define ShortcutsProvider BraveShortcutsProvider
#define BRAVE_AUTOCOMPLETE_CONTROLLER_AUTOCOMPLETE_CONTROLLER         \
  providers_.push_back(new TopSitesProvider(provider_client_.get())); \
  providers_.push_back(new SuggestedSitesProvider(provider_client_.get()));

#include "src/components/omnibox/browser/autocomplete_controller.cc"
#undef BRAVE_AUTOCOMPLETE_CONTROLLER_AUTOCOMPLETE_CONTROLLER
#undef ShortcutsProvider
#undef BookmarkProvider
#undef HistoryURLProvider
#undef HistoryQuickProvider
#undef SearchProvider
