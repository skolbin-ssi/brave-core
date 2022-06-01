/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LEDGER_HARDWARE_VENDOR } from 'gen/brave/components/brave_wallet/common/brave_wallet.mojom.m.js'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import Sol from '@ledgerhq/hw-app-solana'
import * as bs58 from 'bs58'
import { BraveWallet } from '../../../constants/types'
import { LedgerSolanaKeyring } from '../interfaces'
// import { HardwareVendor, getCoinName } from '../../api/hardware_keyrings'
import { HardwareVendor } from '../../api/hardware_keyrings'
import {
  GetAccountsHardwareOperationResult,
  HardwareOperationResult,
  SignHardwareMessageOperationResult,
  SignHardwareTransactionOperationResult, // SolanaNetwork
} from '../types'
// import { getLocale } from '../../../../common/locale' // TODO(nvonpentz) use this
import { hardwareDeviceIdFromAddress } from '../hardwareDeviceIdFromAddress'

export default class SolanaLedgerKeyring implements LedgerSolanaKeyring {
  private app?: Sol
  private deviceId: string

  coin = (): BraveWallet.CoinType => {
    return BraveWallet.CoinType.SOL
  }

  type = (): HardwareVendor => {
    return LEDGER_HARDWARE_VENDOR
  }

  getAccounts = async (from: number, to: number): Promise<GetAccountsHardwareOperationResult> => {
    const unlocked = await this.unlock()
    if (!unlocked.success || !this.app) {
      return unlocked
    }
    from = (from < 0) ? 0 : from
    const sol: Sol = this.app
    const accounts = []
    for (let i = from; i <= to; i++) {
      const path = this.getPathForIndex(i)
      const address = await sol.getAddress(path)
      accounts.push({
        // address: address.address.toString("base64"),
        address: bs58.encode(address.address),
        derivationPath: path,
        name: this.type(),
        hardwareVendor: this.type(),
        deviceId: this.deviceId,
        coin: this.coin()
      })
    }
    return { success: true, payload: [...accounts] }
  }

  isUnlocked = (): boolean => {
    return this.app !== undefined && this.deviceId !== undefined
  }

  makeApp = async () => {
    this.app = new Sol(await TransportWebHID.create())
  }

  unlock = async (): Promise<HardwareOperationResult> => {
    if (this.isUnlocked()) {
      return { success: true }
    }

    if (!this.app) {
      await this.makeApp()
    }

    if (this.app && !this.deviceId) {
      const sol: Sol = this.app
      // TODO(nvonpentz) - can't access 'transport' since it's private
      // sol.transport.on('disconnect', this.onDisconnected)
      const zeroPath = this.getPathForIndex(0)
      // const address = (await sol.getAddress(zeroPath)).address.toString("base64")
      const address = bs58.encode((await sol.getAddress(zeroPath)).address)
      this.deviceId = await hardwareDeviceIdFromAddress(address)
    }
    return { success: this.isUnlocked() }
  }

  signPersonalMessage (path: string, address: string, message: string): Promise<SignHardwareMessageOperationResult> {
    throw new Error('Method not implemented.')
  }

  signTransaction = async (path: string, rawTxBase64: string): Promise<SignHardwareTransactionOperationResult> => {
    try {
      const unlocked = await this.unlock()
      if (!unlocked.success || !this.app) {
        return unlocked
      }
      const sol: Sol = this.app
      const rawTxBytes = new Buffer(rawTxBase64, 'base64')
      const signed = await sol.signTransaction(path, rawTxBytes)
      return { success: true, payload: signed.signature.toString('base64') }
    } catch (e) {
      return { success: false, error: e.message, code: e.statusCode || e.id || e.name }
    }
  }

  // TODO(nvonpentz)
  // private onDisconnected = (e: any) => {
  //   if (e.name !== 'DisconnectedDevice') {
  //     return
  //   }
  //   this.app = undefined
  // }

  // TODO(nvonpentz) - support a 'scheme' argument, so user can select derivation path?
  private readonly getPathForIndex = (index: number): string => {
    return `44'/501'/0'/${index}`
  }
}
