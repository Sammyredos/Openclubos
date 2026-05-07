import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/score_model.dart';
import '../../../core/network/dio_provider.dart';

final scoringRepositoryProvider = Provider((ref) {
  final dio = ref.watch(dioProvider);
  return ScoringRepository(dio);
});

class ScoringRepository {
  final Dio _dio;

  ScoringRepository(this._dio);

  Future<Score> upsertScore(Score score) async {
    try {
      final response = await _dio.post('/scores', data: score.toJson());
      return Score.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<Score> confirmScore(String scoreId) async {
    try {
      final response = await _dio.post('/scores/$scoreId/confirm');
      return Score.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Score>> getGroupScores(String groupId) async {
    try {
      final response = await _dio.get('/scores/group/$groupId');
      return (response.data as List).map((e) => Score.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }
}
