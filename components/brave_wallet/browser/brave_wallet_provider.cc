/* Copyright (c) 2021 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "brave/components/brave_wallet/browser/brave_wallet_provider.h"

#include <utility>

#include "brave/components/brave_wallet/browser/brave_wallet_service.h"

namespace brave_wallet {

BraveWalletProvider::BraveWalletProvider(
    base::WeakPtr<BraveWalletService> wallet_service)
    : wallet_service_(wallet_service), weak_factory_(this) {}

BraveWalletProvider::~BraveWalletProvider() {}

void BraveWalletProvider::Request(const std::string& json_payload,
                                  RequestCallback callback) {
  if (!wallet_service_)
    return;

  auto* controller = wallet_service_->controller();
  controller->Request(
      json_payload,
      base::BindOnce(&BraveWalletProvider::OnResponse,
                     weak_factory_.GetWeakPtr(), std::move(callback)),
      true);
}

void BraveWalletProvider::OnResponse(
    RequestCallback callback,
    const int status,
    const std::string& response,
    const std::map<std::string, std::string>& headers) {
  // Do we need to pass headers map to a renderer? We would need to convert
  // it to base::flat_map in that case
  std::move(callback).Run(status, response);
}

}  // namespace brave_wallet
