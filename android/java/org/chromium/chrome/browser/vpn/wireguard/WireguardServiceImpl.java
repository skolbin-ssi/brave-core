/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.chromium.chrome.browser.vpn.wireguard;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.wireguard.android.backend.Backend;
import com.wireguard.android.backend.BackendException;
import com.wireguard.android.backend.GoBackend;
import com.wireguard.android.backend.Statistics;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.config.Config;

import org.chromium.base.ContextUtils;
import org.chromium.base.Log;
import org.chromium.chrome.R;
import org.chromium.chrome.browser.app.BraveActivity;
import org.chromium.chrome.browser.notifications.channels.BraveChannelDefinitions;
import org.chromium.chrome.browser.vpn.utils.BraveVpnPrefUtils;
import org.chromium.chrome.browser.vpn.utils.BraveVpnUtils;

import java.util.Timer;
import java.util.TimerTask;

public class WireguardServiceImpl
        extends WireguardService.Impl implements TunnelModel.TunnelStateUpdateListener {
    private Backend mBackend;
    private TunnelModel mTunnelModel;
    private final IBinder mBinder = new LocalBinder();
    private Timer mVpnStatisticsTimer;
    private static final int BRAVE_VPN_NOTIFICATION_ID = 801;
    private Context mContext = ContextUtils.getApplicationContext();

    class LocalBinder extends Binder {
        WireguardServiceImpl getService() {
            return WireguardServiceImpl.this;
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return mBinder;
    }

    public TunnelModel getTunnelModel() {
        return mTunnelModel;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mBackend = new GoBackend(mContext);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        new Thread() {
            @Override
            public void run() {
                try {
                    startVpn();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }.start();
        getService().startForeground(BRAVE_VPN_NOTIFICATION_ID, getBraveVpnNotification(""));
        return Service.START_NOT_STICKY;
    }

    private void startVpn() throws Exception {
        Config config = WireguardConfigUtils.loadConfig(mContext);
        mTunnelModel = TunnelModel.createTunnel(config, this);
        mBackend.setState(mTunnelModel, Tunnel.State.UP, config);
        updateVpnStatisticsTimer();
    }

    private Notification getBraveVpnNotification(String notificationText) {
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(mContext, BraveActivity.CHANNEL_ID);
        notificationBuilder.setSmallIcon(R.drawable.ic_vpn)
                .setAutoCancel(false)
                .setContentTitle(
                        String.format(mContext.getResources().getString(R.string.connected_to_host),
                                BraveVpnPrefUtils.getHostnameDisplay()))
                .setContentText(notificationText)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(notificationText))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setOnlyAlertOnce(true);

        return notificationBuilder.build();
    }

    private void updateVpnNotification(String notificationText) {
        Notification notification = getBraveVpnNotification(notificationText);
        NotificationManager mNotificationManager =
                (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
        mNotificationManager.notify(BRAVE_VPN_NOTIFICATION_ID, notification);
    }

    private void updateVpnStatisticsTimer() {
        mVpnStatisticsTimer = new Timer();
        mVpnStatisticsTimer.schedule(new TimerTask() {
            public void run() {
                if (mBackend != null && mTunnelModel != null) {
                    try {
                        Statistics statistics = mBackend.getStatistics(mTunnelModel);
                        updateVpnNotification(String.format(
                                mContext.getResources().getString(R.string.transfer_rx_tx),
                                WireguardUtils.formatBytes(mContext, statistics.totalRx()),
                                WireguardUtils.formatBytes(mContext, statistics.totalTx())));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }, 0, 500);
    }

    private void cancelVpnStatisticsTimer() {
        if (mVpnStatisticsTimer != null) {
            mVpnStatisticsTimer.cancel();
        }
    }

    @Override
    public void onDestroy() {
        try {
            mBackend.setState(mTunnelModel, Tunnel.State.DOWN, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
        cancelVpnStatisticsTimer();
        super.onDestroy();
    }

    @Override
    public void onTunnelStateUpdated(TunnelModel tunnelModel) {
        if (tunnelModel.getState() == Tunnel.State.DOWN) {
            getService().stopForeground(true);
            getService().stopSelf();
        }
    }
}
