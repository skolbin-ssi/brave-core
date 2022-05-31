// Copyright (c) 2022 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

#include "brave/browser/ui/webui/private_new_tab_page/brave_private_new_tab_page_handler.h"

#include <utility>

#include "base/strings/utf_string_conversions.h"
#include "brave/components/brave_private_new_tab_ui/common/pref_names.h"
#include "brave/components/search_engines/brave_prepopulated_engines.h"
#include "chrome/browser/profiles/profile.h"
#include "components/prefs/pref_service.h"
#include "components/search_engines/template_url.h"
#include "components/search_engines/template_url_data_util.h"
#include "components/search_engines/template_url_service.h"
#include "content/public/browser/page_navigator.h"
#include "content/public/browser/web_contents.h"

#if BUILDFLAG(ENABLE_TOR)
#include "brave/components/tor/tor_launcher_factory.h"
#endif

BravePrivateNewTabPageHandler::BravePrivateNewTabPageHandler(
    Profile* profile,
    content::WebContents* web_contents,
    mojo::PendingReceiver<brave_private_new_tab::mojom::PageHandler> receiver)
    : profile_(profile),
      web_contents_(web_contents),
      receiver_(this, std::move(receiver)) {
#if BUILDFLAG(ENABLE_TOR)
  tor_launcher_factory_ = TorLauncherFactory::GetInstance();
  if (tor_launcher_factory_)
    tor_launcher_factory_->AddObserver(this);
#endif
}

BravePrivateNewTabPageHandler::~BravePrivateNewTabPageHandler() {
#if BUILDFLAG(ENABLE_TOR)
  if (tor_launcher_factory_)
    tor_launcher_factory_->RemoveObserver(this);
#endif
}

void BravePrivateNewTabPageHandler::SetClientPage(
    mojo::PendingRemote<brave_private_new_tab::mojom::PrivateTabPage> page) {
  page_.Bind(std::move(page));
}

void BravePrivateNewTabPageHandler::SetHasUserSeenDisclaimerPref(
    bool has_seen) {
  DCHECK(profile_);

  profile_->GetOriginalProfile()->GetPrefs()->SetBoolean(
      profile_->IsTor()
          ? brave_private_new_tab::prefs::kBraveTorWindowDisclaimer
          : brave_private_new_tab::prefs::kBravePrivateWindowDisclaimer,
      has_seen);
}

void BravePrivateNewTabPageHandler::GetHasUserSeenDisclaimerPref(
    GetHasUserSeenDisclaimerPrefCallback callback) {
  DCHECK(profile_);

  bool has_seen = profile_->GetOriginalProfile()->GetPrefs()->GetBoolean(
      profile_->IsTor()
          ? brave_private_new_tab::prefs::kBraveTorWindowDisclaimer
          : brave_private_new_tab::prefs::kBravePrivateWindowDisclaimer);

  std::move(callback).Run(has_seen);
}

void BravePrivateNewTabPageHandler::GetIsTorConnected(
    GetIsTorConnectedCallback callback) {
#if BUILDFLAG(ENABLE_TOR)
  if (tor_launcher_factory_)
    std::move(callback).Run(tor_launcher_factory_->IsTorConnected());
#endif
}

void BravePrivateNewTabPageHandler::GoToBraveSearch(const std::string& input) {
  DCHECK(profile_);

  auto provider_data = TemplateURLDataFromPrepopulatedEngine(
      profile_->IsTor() ? TemplateURLPrepopulateData::brave_search_tor
                        : TemplateURLPrepopulateData::brave_search);
  auto t_url = std::make_unique<TemplateURL>(*provider_data);
  SearchTermsData search_terms_data;

  auto url = GURL(t_url->url_ref().ReplaceSearchTerms(
      TemplateURLRef::SearchTermsArgs(base::UTF8ToUTF16(input)),
      search_terms_data));

  web_contents_->OpenURL(content::OpenURLParams(
      url, content::Referrer(), WindowOpenDisposition::CURRENT_TAB,
      ui::PageTransition::PAGE_TRANSITION_FORM_SUBMIT, false));
}

void BravePrivateNewTabPageHandler::OnTorCircuitEstablished(bool result) {
  page_.get()->OnTorCircuitEstablished(result);
}

void BravePrivateNewTabPageHandler::OnTorInitializing(
    const std::string& percentage) {
  page_.get()->OnTorInitializing(percentage);
}
