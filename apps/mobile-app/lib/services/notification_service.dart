import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

final notificationServiceProvider = Provider((ref) => NotificationService());

/// Background FCM message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase already initialized or error: $e');
  }
  debugPrint('Handling background FCM message: ${message.messageId}');
}

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3001/api',
    headers: {'Content-Type': 'application/json'},
  ));

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'high_importance_channel',
    'High Importance Notifications',
    description: 'Used for important payout, withdrawal, and tournament alerts.',
    importance: Importance.high,
    playSound: true,
  );

  /// Initializes push notification channels, permissions, and listeners.
  Future<void> initialize() async {
    try {
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 1. Request notification permissions (iOS APNs & Android 13+)
      final settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint('FCM Authorization status: ${settings.authorizationStatus}');

      // 2. Setup Local Notifications for foreground heads-up banner display
      const initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const initializationSettingsDarwin = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsDarwin,
        macOS: initializationSettingsDarwin,
      );

      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          debugPrint('Notification clicked with payload: ${response.payload}');
          // Handle in-app navigation on notification tap
        },
      );

      // Create Android Notification Channel
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // 3. Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Received foreground notification: ${message.notification?.title}');

        final notification = message.notification;
        final android = message.notification?.android;

        if (notification != null) {
          _localNotifications.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                _channel.id,
                _channel.name,
                channelDescription: _channel.description,
                icon: android?.smallIcon ?? '@mipmap/ic_launcher',
                importance: Importance.max,
                priority: Priority.high,
                playSound: true,
              ),
              iOS: const DarwinNotificationDetails(
                presentAlert: true,
                presentBadge: true,
                presentSound: true,
              ),
            ),
            payload: message.data.toString(),
          );
        }
      });

      // 4. Background message click listener
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('App opened from background push notification: ${message.data}');
      });

      // 5. Check if app was opened from terminated state via notification
      final initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('App launched from terminated state via push: ${initialMessage.data}');
      }

      // 6. Token management & refresh listener
      await syncTokenWithBackend();
      _fcm.onTokenRefresh.listen((newToken) {
        _registerTokenToBackend(newToken);
      });
    } catch (e) {
      debugPrint('NotificationService initialization error: $e');
    }
  }

  /// Syncs FCM token to backend if user is authenticated.
  Future<void> syncTokenWithBackend() async {
    try {
      final token = await _fcm.getToken();
      if (token != null) {
        debugPrint('Obtained FCM Device Token: $token');
        await _registerTokenToBackend(token);
      }
    } catch (e) {
      debugPrint('Failed to obtain FCM token: $e');
    }
  }

  /// Registers device token with backend API.
  Future<void> _registerTokenToBackend(String token) async {
    try {
      final box = await Hive.openBox('auth');
      final jwtToken = box.get('token');

      if (jwtToken == null) {
        debugPrint('User not logged in yet. Device token will sync upon login.');
        return;
      }

      final platform = Platform.isIOS ? 'IOS' : 'ANDROID';

      final response = await _dio.post(
        '/notifications/device-token',
        data: {
          'token': token,
          'platform': platform,
          'deviceInfo': '${Platform.operatingSystem} ${Platform.operatingSystemVersion}',
        },
        options: Options(
          headers: {'Authorization': 'Bearer $jwtToken'},
        ),
      );

      debugPrint('Device token registered with backend: ${response.statusCode}');
    } catch (e) {
      debugPrint('Failed to register device token with backend: $e');
    }
  }

  /// De-registers device token upon logout.
  Future<void> unregisterToken() async {
    try {
      final token = await _fcm.getToken();
      final box = await Hive.openBox('auth');
      final jwtToken = box.get('token');

      if (token != null && jwtToken != null) {
        await _dio.delete(
          '/notifications/device-token',
          data: {'token': token},
          options: Options(
            headers: {'Authorization': 'Bearer $jwtToken'},
          ),
        );
      }
    } catch (e) {
      debugPrint('Failed to unregister device token on logout: $e');
    }
  }
}
