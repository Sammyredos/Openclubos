import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/score_model.dart';
import '../data/scoring_repository.dart';

final groupScoresProvider = FutureProvider.family<List<Score>, String>((ref, groupId) async {
  final repository = ref.watch(scoringRepositoryProvider);
  return repository.getGroupScores(groupId);
});

final scoringNotifierProvider = StateNotifierProvider<ScoringNotifier, AsyncValue<void>>((ref) {
  final repository = ref.watch(scoringRepositoryProvider);
  return ScoringNotifier(repository, ref);
});

class ScoringNotifier extends StateNotifier<AsyncValue<void>> {
  final ScoringRepository _repository;
  final Ref _ref;

  ScoringNotifier(this._repository, this._ref) : super(const AsyncValue.data(null));

  Future<void> submitScore(Score score) async {
    state = const AsyncValue.loading();
    try {
      await _repository.upsertScore(score);
      state = const AsyncValue.data(null);
      // Refresh group scores if we have a groupId
      if (score.groupId != null) {
        _ref.invalidate(groupScoresProvider(score.groupId!));
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> confirmScore(String scoreId, String groupId) async {
    state = const AsyncValue.loading();
    try {
      await _repository.confirmScore(scoreId);
      state = const AsyncValue.data(null);
      _ref.invalidate(groupScoresProvider(groupId));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
