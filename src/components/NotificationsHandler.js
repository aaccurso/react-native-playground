import React, {Component} from 'react';
import {Platform} from 'react-native';
import FCM, {
    FCMEvent,
    NotificationType,
    RemoteNotificationResult,
    WillPresentNotificationResult
} from 'react-native-fcm';

// this shall be called regardless of app state: running, background or not running. Won't be called when app is killed by user in iOS
FCM.on(FCMEvent.Notification, async (notif) => {
    // there are two parts of notif. notif.notification contains the notification payload, notif.data contains data payload
    if (notif.local_notification) {
        // this is a local notification
        console.log('local_notification', notif);
    }
    if (notif.opened_from_tray) {
        // iOS: app is open/resumed because user clicked banner
        // Android: app is open/resumed because user clicked banner or tapped app icon
        console.log('opened_from_tray', notif);
    }
    // await someAsyncCall();

    if (Platform.OS === 'ios') {
        // optional
        // iOS requires developers to call completionHandler to end notification process. If you do not call it your background remote notifications could be throttled, to read more about it see the above documentation link.
        // This library handles it for you automatically with default behavior (for remote notification, finish with NoData; for WillPresent, finish depend on "show_in_foreground"). However if you want to return different result, follow the following code to override
        //notif._notificationType is available for iOS platfrom
        switch (notif._notificationType) {
            case NotificationType.Remote:
                notif.finish(RemoteNotificationResult.NewData); //other types available: RemoteNotificationResult.NewData, RemoteNotificationResult.ResultFailed
                break;
            case NotificationType.NotificationResponse:
                notif.finish();
                break;
            case NotificationType.WillPresent:
                notif.finish(WillPresentNotificationResult.All); //other types available:
                // WillPresentNotificationResult.None
                break;
        }
    }
});

export class NotificationsHandler extends Component<{}> {
    componentDidMount() {
        // iOS: show permission prompt for the first call. later just check permission in user settings
        // Android: check permission in user settings
        FCM.requestPermissions()
            .then(() => console.log('granted'))
            .catch(() => console.log('notification permission rejected'));

        FCM.getFCMToken()
            .then(token => {
                console.log('token', token);
                // store fcm token in your server
            });

        this.notificationListener = FCM.on(FCMEvent.Notification, async (notif) => {
            // optional, do some component related stuff
            console.log('notif', notif);
        });

        this.refreshListener = FCM.on(FCMEvent.RefreshToken, (token) => {
            // fcm token may not be available on first load, catch it here
            console.log('refresh', token);
        });

        // initial notification contains the notification that launchs the app. If user launchs app by clicking banner, the banner notification info will be here rather than through FCM.on event
        // sometimes Android kills activity when app goes to background, and when resume it broadcasts notification before JS is run. You can use FCM.getInitialNotification() to capture those missed events.
        // initial notification will be triggered all the time even when open app by icon so send some action identifier when you send notification
        FCM.getInitialNotification()
            .then(notif => {
                console.log('initial_notification', notif)
            });
    }

    componentWillUnmount() {
        // stop listening for events
        this.notificationListener.remove();
        this.refreshListener.remove();
    }

    render() {
        return null;
    }
}
