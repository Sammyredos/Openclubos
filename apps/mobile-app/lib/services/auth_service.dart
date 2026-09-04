import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

final authServiceProvider = Provider((ref) => AuthService());

class AuthService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3001/api', // Use actual IP or tunnel for physical devices
    headers: {
      'Content-Type': 'application/json',
      'x-client-platform': 'mobile',
    },
  ));

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
        'clientPlatform': 'mobile',
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final user = data['user'];
        final role = user?['role'];

        // Strict Role Gate: Exclusively registered players can log in via the mobile application
        if (role != 'PLAYER') {
          throw Exception(
            'Access Denied: The Openclub Mobile App is reserved for players. Organizers and Administrators must sign in through the Web Admin Portal.',
          );
        }

        final token = data['accessToken'];

        // Store in Hive
        final box = await Hive.openBox('auth');
        await box.put('token', token);
        await box.put('user', user);

        return data;
      } else {
        throw Exception('Failed to login');
      }
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 'Connection error';
      throw Exception(message);
    }
  }

  Future<void> logout() async {
    final box = await Hive.openBox('auth');
    await box.clear();
  }

  Future<bool> isAuthenticated() async {
    final box = await Hive.openBox('auth');
    return box.containsKey('token');
  }

  Future<Map<String, dynamic>?> getUser() async {
    final box = await Hive.openBox('auth');
    return box.get('user');
  }

  Future<void> verifyEmail(String token) async {
    try {
      final response = await _dio.post('/auth/verify-email', data: {
        'token': token.trim(),
      });
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception(response.data?['message'] ?? 'Failed to verify email');
      }
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 'Verification failed';
      throw Exception(message);
    }
  }

  Future<void> resendVerification(String email) async {
    try {
      final response = await _dio.post('/auth/resend-verification', data: {
        'email': email.trim(),
      });
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception(response.data?['message'] ?? 'Failed to resend code');
      }
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 'Failed to resend code';
      throw Exception(message);
    }
  Future<Map<String, dynamic>> registerPlayer(Map<String, dynamic> playerData) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        ...playerData,
        'clientPlatform': 'mobile',
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data;
      } else {
        throw Exception(response.data?['message'] ?? 'Registration failed');
      }
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 'Registration failed';
      throw Exception(message);
    }
  }
}
