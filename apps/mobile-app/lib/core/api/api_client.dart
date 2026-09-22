import 'dart:io' show Platform;
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:hive_flutter/hive_flutter.dart';

class ApiClient {
  final Dio _dio;

  static String resolveBaseUrl() {
    const envUrl = String.fromEnvironment('API_URL', defaultValue: '');
    if (envUrl.isNotEmpty) return envUrl;
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:3001/api';
    }
    return 'http://localhost:3001/api';
  }

  ApiClient()
      : _dio = Dio(BaseOptions(
          baseUrl: resolveBaseUrl(),
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-client-platform': 'mobile',
          },
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        try {
          final box = await Hive.openBox('auth');
          final token = box.get('accessToken') ?? box.get('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        } catch (e) {
          debugPrint('ApiClient onRequest error reading token: $e');
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // Handle token refresh or logout here
        }
        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;
}
