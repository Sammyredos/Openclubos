import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  int? _putts = 2;
  String? _fairwayHit = 'CENTER'; // 'LEFT', 'CENTER', 'RIGHT', 'MISSED'
  bool _gir = true;

  final List<Map<String, dynamic>> _mockHoles = List.generate(18, (index) {
    final pars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];
    final yards = [395, 412, 178, 535, 420, 388, 192, 545, 405, 418, 390, 165, 510, 432, 380, 205, 440, 520];
    return {
      'id': 'hole_$index',
      'number': index + 1,
      'par': pars[index],
      'yards': yards[index],
      'hcp': ((index * 3) % 18) + 1,
    };
  });

  void _incrementStrokes() => setState(() => _strokes++);
  void _decrementStrokes() => setState(() {
    if (_strokes > 1) _strokes--;
  });

  Future<void> _saveScore() async {
    final currentHole = _mockHoles[_currentHoleIndex];
    
    final score = Score(
      id: '',
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
        SnackBar(
          backgroundColor: const Color(0xFF065F46),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Text(
            'Hole ${currentHole['number']} score saved successfully',
            style: const TextStyle(fontFamily: 'ZxGamut', fontWeight: FontWeight.w600),
          ),
        ),
      );
      if (_currentHoleIndex < 17) {
        setState(() {
          _currentHoleIndex++;
          _strokes = _mockHoles[_currentHoleIndex]['par'];
          _putts = 2;
          _gir = true;
          _fairwayHit = 'CENTER';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentHole = _mockHoles[_currentHoleIndex];
    final par = currentHole['par'] as int;
    final yards = currentHole['yards'] as int;
    final hcp = currentHole['hcp'] as int;
    final scoreDiff = _strokes - par;

    return Scaffold(
      backgroundColor: const Color(0xFF06090E),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white70, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.35)),
              ),
              child: const Text(
                'TOURNAMENT ROUND 1',
                style: TextStyle(
                  fontFamily: 'ZxGamut',
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  color: Color(0xFFF59E0B),
                ),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Championship Course',
              style: TextStyle(
                fontFamily: 'ZxGamut',
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.table_chart_outlined, color: Colors.white70),
            onPressed: () {
              // Open 18-hole scorecard summary
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.6),
            radius: 1.2,
            colors: [
              Color(0xFF0F221E), // Subtle dark emerald ambient glow
              Color(0xFF06090E),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Hole Selector Horizontal Carousel
              _buildHoleCarousel(),
              
              const SizedBox(height: 12),

              // Main Hole Detail Telemetry Card
              _buildHoleInfoCard(currentHole['number'] as int, par, yards, hcp, scoreDiff),

              const SizedBox(height: 14),

              // Tactile Stroke Stepper & Relative Badge
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      _buildStrokeCounter(scoreDiff),
                      const SizedBox(height: 16),
                      _buildStatsTracker(par),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),

              // Bottom Luxury Action Dock
              _buildBottomActionDock(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHoleCarousel() {
    return SizedBox(
      height: 52,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 18,
        itemBuilder: (context, index) {
          final isSelected = index == _currentHoleIndex;
          final holeNum = index + 1;
          return GestureDetector(
            onTap: () => setState(() {
              _currentHoleIndex = index;
              _strokes = _mockHoles[index]['par'];
            }),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF10B981).withOpacity(0.2) : Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? const Color(0xFF10B981) : Colors.white.withOpacity(0.08),
                  width: isSelected ? 1.5 : 1,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: const Color(0xFF10B981).withOpacity(0.3),
                          blurRadius: 10,
                          spreadRadius: 1,
                        )
                      ]
                    : [],
              ),
              child: Center(
                child: Text(
                  '$holeNum',
                  style: TextStyle(
                    fontFamily: 'ZxGamut',
                    fontSize: 14,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected ? const Color(0xFF34D399) : Colors.white60,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHoleInfoCard(int holeNumber, int par, int yards, int hcp, int diff) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1521).withOpacity(0.85),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF059669), Color(0xFF047857)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.35),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '$holeNumber',
                    style: const TextStyle(
                      fontFamily: 'ZxGamut',
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'HOLE $holeNumber',
                    style: const TextStyle(
                      fontFamily: 'ZxGamut',
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.3,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Handicap Index: $hcp',
                    style: TextStyle(
                      fontFamily: 'ZxGamut',
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ],
          ),
          Row(
            children: [
              _buildMetricChip('PAR', '$par', const Color(0xFF10B981)),
              const SizedBox(width: 12),
              _buildMetricChip('YARDS', '$yards', const Color(0xFF94A3B8)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricChip(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'ZxGamut',
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
            color: Colors.white38,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'ZxGamut',
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildStrokeCounter(int diff) {
    String badgeText;
    Color badgeColor;
    Color badgeBg;
    Border? customBorder;

    if (diff <= -2) {
      badgeText = 'EAGLE (${diff})';
      badgeColor = const Color(0xFFFBBF24);
      badgeBg = const Color(0xFFF59E0B).withOpacity(0.2);
      customBorder = Border.all(color: const Color(0xFFF59E0B), width: 1.5);
    } else if (diff == -1) {
      badgeText = 'BIRDIE (-1)';
      badgeColor = const Color(0xFF34D399);
      badgeBg = const Color(0xFF10B981).withOpacity(0.18);
      customBorder = Border.all(color: const Color(0xFF10B981), width: 1.5);
    } else if (diff == 0) {
      badgeText = 'PAR (E)';
      badgeColor = Colors.white;
      badgeBg = Colors.white.withOpacity(0.08);
      customBorder = Border.all(color: Colors.white.withOpacity(0.2), width: 1);
    } else if (diff == 1) {
      badgeText = 'BOGEY (+1)';
      badgeColor = const Color(0xFFFCA5A5);
      badgeBg = const Color(0xFFEF4444).withOpacity(0.18);
      customBorder = Border.all(color: const Color(0xFFF87171), width: 1.5);
    } else {
      badgeText = 'DOUBLE BOGEY+ (+${diff})';
      badgeColor = const Color(0xFFF87171);
      badgeBg = const Color(0xFFDC2626).withOpacity(0.25);
      customBorder = Border.all(color: const Color(0xFFEF4444), width: 2);
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1521).withOpacity(0.75),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'SCORE / TOTAL STROKES',
            style: TextStyle(
              fontFamily: 'ZxGamut',
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
              color: Colors.white38,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Decrement Button
              GestureDetector(
                onTap: _decrementStrokes,
                child: Container(
                  width: 62,
                  height: 62,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withOpacity(0.12)),
                  ),
                  child: const Icon(Icons.remove_rounded, color: Colors.white, size: 28),
                ),
              ),
              const SizedBox(width: 32),

              // Giant Score Digits
              Text(
                '$_strokes',
                style: const TextStyle(
                  fontFamily: 'ZxGamut',
                  fontSize: 76,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -2,
                  color: Colors.white,
                  height: 1.0,
                ),
              ),

              const SizedBox(width: 32),
              // Increment Button
              GestureDetector(
                onTap: _incrementStrokes,
                child: Container(
                  width: 62,
                  height: 62,
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.25),
                        blurRadius: 14,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.add_rounded, color: Color(0xFF34D399), size: 28),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // USGA Dynamic Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(20),
              border: customBorder,
            ),
            child: Text(
              badgeText,
              style: TextStyle(
                fontFamily: 'ZxGamut',
                fontSize: 13,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: badgeColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsTracker(int par) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1521).withOpacity(0.75),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PERFORMANCE STATS',
            style: TextStyle(
              fontFamily: 'ZxGamut',
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              color: Colors.white38,
            ),
          ),
          const SizedBox(height: 14),

          // Fairway Hit (if Par 4 or Par 5)
          if (par >= 4) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Fairway Accuracy',
                  style: TextStyle(fontFamily: 'ZxGamut', color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                Row(
                  children: [
                    _buildPillToggle('LEFT', _fairwayHit == 'LEFT', () => setState(() => _fairwayHit = 'LEFT')),
                    const SizedBox(width: 6),
                    _buildPillToggle('CENTER', _fairwayHit == 'CENTER', () => setState(() => _fairwayHit = 'CENTER')),
                    const SizedBox(width: 6),
                    _buildPillToggle('RIGHT', _fairwayHit == 'RIGHT', () => setState(() => _fairwayHit = 'RIGHT')),
                  ],
                ),
              ],
            ),
            const Divider(color: Colors.white10, height: 24),
          ],

          // Putts Selector
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Putts Taken',
                style: TextStyle(fontFamily: 'ZxGamut', color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              Row(
                children: [1, 2, 3, 4].map((p) {
                  final isSelected = _putts == p;
                  return GestureDetector(
                    onTap: () => setState(() => _putts = p),
                    child: Container(
                      margin: const EdgeInsets.only(left: 6),
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF10B981) : Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF34D399) : Colors.white.withOpacity(0.1),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '$p',
                          style: TextStyle(
                            fontFamily: 'ZxGamut',
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : Colors.white60,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          const Divider(color: Colors.white10, height: 24),

          // Green in Regulation (GIR)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Green in Regulation (GIR)',
                style: TextStyle(fontFamily: 'ZxGamut', color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              Switch.adaptive(
                value: _gir,
                activeColor: const Color(0xFF10B981),
                activeTrackColor: const Color(0xFF059669).withOpacity(0.4),
                onChanged: (val) => setState(() => _gir = val),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPillToggle(String text, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF10B981).withOpacity(0.2) : Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: active ? const Color(0xFF10B981) : Colors.white.withOpacity(0.1),
          ),
        ),
        child: Text(
          text,
          style: TextStyle(
            fontFamily: 'ZxGamut',
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: active ? const Color(0xFF34D399) : Colors.white60,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomActionDock() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0F18).withOpacity(0.95),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08))),
      ),
      child: ElevatedButton(
        onPressed: _saveScore,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF059669),
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 54),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 6,
          shadowColor: const Color(0xFF10B981).withOpacity(0.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _currentHoleIndex < 17 ? 'SAVE & PROCEED TO HOLE ${_currentHoleIndex + 2}' : 'COMPLETE ROUND',
              style: const TextStyle(
                fontFamily: 'ZxGamut',
                fontSize: 15,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward_rounded, size: 20),
          ],
        ),
      ),
    );
  }
}
