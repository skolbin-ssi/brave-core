/* Copyright (c) 2020 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef BAT_ADS_INTERNAL_AD_EVENTS_PROMOTED_CONTENT_ADS_PROMOTED_CONTENT_AD_EVENT_CLICKED_H_  // NOLINT
#define BAT_ADS_INTERNAL_AD_EVENTS_PROMOTED_CONTENT_ADS_PROMOTED_CONTENT_AD_EVENT_CLICKED_H_  // NOLINT

#include "bat/ads/internal/ad_events/ad_event.h"

namespace ads {

struct PromotedContentAdInfo;

namespace promoted_content_ads {

class AdEventClicked : public AdEvent<PromotedContentAdInfo> {
 public:
  AdEventClicked();

  ~AdEventClicked() override;

  void FireEvent(
      const PromotedContentAdInfo& ad) override;
};

}  // namespace promoted_content_ads
}  // namespace ads

#endif  // BAT_ADS_INTERNAL_AD_EVENTS_PROMOTED_CONTENT_ADS_PROMOTED_CONTENT_AD_EVENT_CLICKED_H_  // NOLINT
