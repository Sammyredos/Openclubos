import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/scoring_provider.dart';
import '../data/score_model.dart';

class MarkerConfirmationScreen extends ConsumerWidget {
  final String groupId;

  const MarkerConfirmationScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scoresAsync = ref.watch(groupScoresProvider(groupId));

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Confirm Scores',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
      ),
      body: scoresAsync.when(
        data: (scores) {
          // Group scores by user
          final userScores = <String, List<Score>>{};
          for (var score in scores) {
            userScores.putIfAbsent(score.userId, () => []).add(score);
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: userScores.length,
            itemBuilder: (context, index) {
              final userId = userScores.keys.elementAt(index);
              final playerScores = userScores[userId]!;
              final allConfirmed = playerScores.every((s) => s.status == 'CONFIRMED');

              return _buildPlayerCard(context, ref, userId, playerScores, allConfirmed);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildPlayerCard(BuildContext context, WidgetRef ref, String userId, List<Score> scores, bool allConfirmed) {
    return Container(
      margin: const EdgeInsets.bottom(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: ExpansionTile(
        title: Text(
          'Player $userId', // Replace with actual name if available
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        subtitle: Text(
          allConfirmed ? 'All scores confirmed' : '${scores.length} scores entered',
          style: GoogleFonts.outfit(
            color: allConfirmed ? Colors.greenAccent : Colors.white60,
          ),
        ),
        trailing: allConfirmed
            ? const Icon(Icons.check_circle_rounded, color: Colors.greenAccent)
            : ElevatedButton(
                onPressed: () => _confirmAll(ref, scores),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Confirm All'),
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
    );
  }

  Widget _buildHoleChip(Score score) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: score.status == 'CONFIRMED' ? Colors.greenAccent.withOpacity(0.3) : Colors.white10,
        ),
      ),
      child: Column(
        children: [
          Text(
            'H${score.holeId.split('_').last}', // Simplified hole number
            style: GoogleFonts.outfit(color: Colors.white60, fontSize: 10),
          ),
          Text(
            '${score.strokes}',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmAll(WidgetRef ref, List<Score> scores) async {
    for (var score in scores) {
      if (score.status != 'CONFIRMED') {
        await ref.read(scoringNotifierProvider.notifier).confirmScore(score.id, groupId);
      }
    }
  }
}
