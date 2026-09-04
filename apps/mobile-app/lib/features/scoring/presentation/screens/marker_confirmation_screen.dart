import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/scoring_provider.dart';
import '../data/score_model.dart';

class MarkerConfirmationScreen extends ConsumerWidget {
  final String groupId;

  const MarkerConfirmationScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scoresAsync = ref.watch(groupScoresProvider(groupId));

    return Scaffold(
      backgroundColor: const Color(0xFF06090E),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'OFFICIAL ATTESTATION',
          style: TextStyle(
            fontFamily: 'ZxGamut',
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
            fontSize: 16,
            color: Colors.white,
          ),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.6),
            radius: 1.1,
            colors: [
              Color(0xFF0D1D18),
              Color(0xFF06090E),
            ],
          ),
        ),
        child: scoresAsync.when(
          data: (scores) {
            final userScores = <String, List<Score>>{};
            for (var score in scores) {
              userScores.putIfAbsent(score.userId, () => []).add(score);
            }

            if (userScores.isEmpty) {
              return const Center(
                child: Text(
                  'No scores submitted for group attestation.',
                  style: TextStyle(fontFamily: 'ZxGamut', color: Colors.white60),
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              itemCount: userScores.length,
              itemBuilder: (context, index) {
                final userId = userScores.keys.elementAt(index);
                final playerScores = userScores[userId]!;
                final allConfirmed = playerScores.every((s) => s.status == 'CONFIRMED');

                return _buildPlayerCard(context, ref, userId, playerScores, allConfirmed);
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
          error: (err, stack) => Center(
            child: Text(
              'Attestation Error: $err',
              style: const TextStyle(fontFamily: 'ZxGamut', color: Color(0xFFEF4444)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlayerCard(BuildContext context, WidgetRef ref, String userId, List<Score> scores, bool allConfirmed) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1521).withOpacity(0.85),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: allConfirmed ? const Color(0xFF10B981).withOpacity(0.4) : Colors.white.withOpacity(0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Theme(
        data: ThemeData().copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: Colors.white70,
          collapsedIconColor: Colors.white38,
          title: Text(
            'Competitor $userId',
            style: const TextStyle(
              fontFamily: 'ZxGamut',
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 17,
              letterSpacing: -0.2,
            ),
          ),
          subtitle: Text(
            allConfirmed ? 'Official Scorecard Attested' : '${scores.length} / 18 Holes Submitted',
            style: TextStyle(
              fontFamily: 'ZxGamut',
              fontSize: 13,
              color: allConfirmed ? const Color(0xFF34D399) : Colors.white60,
            ),
          ),
          trailing: allConfirmed
              ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF10B981)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.check_circle_rounded, color: Color(0xFF34D399), size: 14),
                      SizedBox(width: 4),
                      Text(
                        'ATTESTED',
                        style: TextStyle(
                          fontFamily: 'ZxGamut',
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF34D399),
                        ),
                      ),
                    ],
                  ),
                )
              : ElevatedButton(
                  onPressed: () => _confirmAll(ref, scores),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: const Text(
                    'Attest All',
                    style: TextStyle(fontFamily: 'ZxGamut', fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: scores.map((score) => _buildHoleChip(score)).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHoleChip(Score score) {
    final strokes = score.strokes;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            score.holeId.replaceAll('hole_', 'H'),
            style: const TextStyle(
              fontFamily: 'ZxGamut',
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Colors.white38,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$strokes',
            style: const TextStyle(
              fontFamily: 'ZxGamut',
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmAll(WidgetRef ref, List<Score> scores) async {
    for (final score in scores) {
      if (score.status != 'CONFIRMED') {
        final confirmedScore = Score(
          id: score.id,
          strokes: score.strokes,
          putts: score.putts,
          holeId: score.holeId,
          userId: score.userId,
          groupId: score.groupId,
          status: 'CONFIRMED',
        );
        await ref.read(scoringNotifierProvider.notifier).submitScore(confirmedScore);
      }
    }
  }
}
