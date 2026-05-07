import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/scoring_provider.dart';
import '../data/score_model.dart';

class ScoringScreen extends ConsumerStatefulWidget {
  final String tournamentId;
  final String courseId;
  final String? groupId;

  const ScoringScreen({
    super.key,
    required this.tournamentId,
    required this.courseId,
    this.groupId,
  });

  @override
  ConsumerState<ScoringScreen> createState() => _ScoringScreenState();
}

class _ScoringScreenState extends ConsumerState<ScoringScreen> {
  int _currentHoleIndex = 0;
  int _strokes = 4;
  int? _putts;

  final List<Map<String, dynamic>> _mockHoles = List.generate(18, (index) => {
    'id': 'hole_$index',
    'number': index + 1,
    'par': [4, 3, 5][index % 3],
    'index': index + 1,
  });

  void _incrementStrokes() => setState(() => _strokes++);
  void _decrementStrokes() => setState(() {
    if (_strokes > 1) _strokes--;
  });

  Future<void> _saveScore() async {
    final currentHole = _mockHoles[_currentHoleIndex];
    
    // In a real app, we'd get userId from auth provider
    final score = Score(
      id: '', // Backend generates UUID
      strokes: _strokes,
      putts: _putts,
      holeId: currentHole['id'],
      userId: 'current_user_id', 
      groupId: widget.groupId,
      status: 'ENTERED',
    );

    await ref.read(scoringNotifierProvider.notifier).submitScore(score);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Score saved successfully')),
      );
      if (_currentHoleIndex < 17) {
        setState(() {
          _currentHoleIndex++;
          _strokes = _mockHoles[_currentHoleIndex]['par'];
          _putts = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentHole = _mockHoles[_currentHoleIndex];
    final par = currentHole['par'] as int;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Deep dark blue
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Scoring',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.grid_view_rounded),
            onPressed: () {
              // Show hole selector grid
            },
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFF0F172A),
              const Color(0xFF1E293B).withOpacity(0.8),
            ],
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Hole Header
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildHoleNavButton(Icons.arrow_back_ios_new_rounded, () {
                  if (_currentHoleIndex > 0) {
                    setState(() => _currentHoleIndex--);
                  }
                }),
                const SizedBox(width: 40),
                Column(
                  children: [
                    Text(
                      'HOLE',
                      style: GoogleFonts.outfit(
                        color: Colors.white60,
                        letterSpacing: 2,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      '${currentHole['number']}',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 64,
                        fontWeight: FontWeight.black,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.blue.withOpacity(0.3)),
                      ),
                      child: Text(
                        'PAR $par',
                        style: GoogleFonts.outfit(
                          color: Colors.blue.shade300,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 40),
                _buildHoleNavButton(Icons.arrow_forward_ios_rounded, () {
                  if (_currentHoleIndex < 17) {
                    setState(() => _currentHoleIndex++);
                  }
                }),
              ],
            ),
            const Spacer(),
            // Score Input
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Column(
                children: [
                  Text(
                    'STROKES',
                    style: GoogleFonts.outfit(
                      color: Colors.white60,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildScoreButton(Icons.remove_rounded, _decrementStrokes),
                      Text(
                        '$_strokes',
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 80,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      _buildScoreButton(Icons.add_rounded, _incrementStrokes),
                    ],
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _saveScore,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 60),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 8,
                      shadowColor: Colors.blueAccent.withOpacity(0.5),
                    ),
                    child: Text(
                      'SAVE SCORE',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHoleNavButton(IconData icon, VoidCallback onPressed) {
    return IconButton(
      onPressed: onPressed,
      icon: Icon(icon, color: Colors.white24, size: 28),
    );
  }

  Widget _buildScoreButton(IconData icon, VoidCallback onPressed) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 70,
        height: 70,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Icon(icon, color: Colors.white, size: 32),
      ),
    );
  }
}
