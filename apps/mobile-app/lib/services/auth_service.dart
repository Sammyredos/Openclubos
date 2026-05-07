import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

final authServiceProvider = Provider((ref) => AuthService());

class AuthService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3001/api', // Use actual IP or tunnel for physical devices
    headers: {'Content-Type': 'application/json'},
  ));

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final token = data['accessToken'];
        final user = data['user'];

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
}
