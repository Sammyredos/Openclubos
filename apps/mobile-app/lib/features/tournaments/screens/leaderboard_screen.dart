import 'package:flutter/material.dart';

class LeaderboardScreen extends StatelessWidget {
  final String? tournamentId;

  const LeaderboardScreen({super.key, this.tournamentId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.leaderboard, size: 64, color: Colors.green),
            const SizedBox(height: 16),
            Text(
              'Tournament Leaderboard',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text('Displaying scores for tournament: ${tournamentId ?? "Unknown"}'),
            const SizedBox(height: 16),
            const Text('Real-time updates coming soon...'),
          ],
        ),
      ),
    );
  }
}
