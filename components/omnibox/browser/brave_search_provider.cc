/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "brave/components/omnibox/browser/brave_search_provider.h"

#include "brave/components/constants/pref_names.h"
#include "components/omnibox/browser/autocomplete_provider.h"
#include "components/omnibox/browser/autocomplete_provider_client.h"
#include "components/omnibox/browser/search_provider.h"
#include "components/prefs/pref_service.h"

BraveSearchProvider::BraveSearchProvider(AutocompleteProviderClient* provider,
                                         AutocompleteProviderListener* listener)
    : SearchProvider(provider, listener) {}

BraveSearchProvider::~BraveSearchProvider() = default;

void BraveSearchProvider::DoHistoryQuery(bool minimal_changes) {
  if (!client()->GetPrefs()->GetBoolean(kHistorySuggestionsEnabled))
    return;

  SearchProvider::DoHistoryQuery(minimal_changes);
}
