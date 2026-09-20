import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PlayerScorecardScreen extends StatefulWidget {
  final Map<String, dynamic> competitor;

  const PlayerScorecardScreen({
    super.key,
    required this.competitor,
  });

  @override
  State<PlayerScorecardScreen> createState() => _PlayerScorecardScreenState();
}

class _PlayerScorecardScreenState extends State<PlayerScorecardScreen> {
  String _selectedSection = 'all'; // 'all', 'out', 'in'

  static const Color kTournamentEmerald = Color(0xFF009A60);
  static const Color kDarkSlate = Color(0xFF0F172A);
  static const Color kMutedSlate = Color(0xFF64748B);
  static const Color kSoftMintBg = Color(0xFFEAF7EE);
  static const Color kSoftMintBorder = Color(0xFFC6F0DB);

  @override
  Widget build(BuildContext context) {
    final competitor = widget.competitor;
    final List<dynamic> rawHoles = competitor['holes'] as List<dynamic>? ?? [];
    final List<Map<String, dynamic>> holes = rawHoles.map((h) => Map<String, dynamic>.from(h as Map)).toList();

    final front9 = holes.length >= 9 ? holes.sublist(0, 9) : holes;
    final back9 = holes.length >= 18 ? holes.sublist(9, 18) : <Map<String, dynamic>>[];

    final List<Map<String, dynamic>> displayedHoles;
    if (_selectedSection == 'out') {
      displayedHoles = front9;
    } else if (_selectedSection == 'in') {
      displayedHoles = back9;
    } else {
      displayedHoles = holes;
    }

    // Calculations
    int outPar = 0;
    int outYards = 0;
    int outGross = 0;
    int outPlayed = 0;
    for (final h in front9) {
      outPar += (h['par'] as int? ?? 0);
      outYards += (h['yards'] as int? ?? 0);
      if (h['strokes'] != null) {
        outGross += (h['strokes'] as int);
        outPlayed++;
      }
    }

    int inPar = 0;
    int inYards = 0;
    int inGross = 0;
    int inPlayed = 0;
    for (final h in back9) {
      inPar += (h['par'] as int? ?? 0);
      inYards += (h['yards'] as int? ?? 0);
      if (h['strokes'] != null) {
        inGross += (h['strokes'] as int);
        inPlayed++;
      }
    }

    final totalPar = outPar + inPar;
    final totalYards = outYards + inYards;
    final totalGross = outGross + inGross;
    final totalPlayed = outPlayed + inPlayed;

    final toPar = competitor['toPar'] as int? ?? 0;
    final toParText = toPar < 0 ? '$toPar' : toPar == 0 ? 'Even' : '+$toPar';

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              children: [
                // 1. Unified Mobile Navigation Header (Standard 16dp top & 24dp horizontal gutter)
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Circular Back Button
                      GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.arrow_back_rounded,
                            size: 18,
                            color: kDarkSlate,
                          ),
                        ),
                      ),

                      // Title & Tournament Subtitle
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Player Scorecard',
                            style: GoogleFonts.dmSans(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: kDarkSlate,
                            ),
                          ),
                          Text(
                            (competitor['tournament'] as String?) ?? 'Tournament',
                            style: GoogleFonts.dmSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: kMutedSlate,
                            ),
                          ),
                        ],
                      ),

                      // Right Live Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: kSoftMintBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: kSoftMintBorder),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: kTournamentEmerald,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'LIVE',
                              style: GoogleFonts.dmSans(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: kTournamentEmerald,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Scrollable Body
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Card A: On-Course Telemetry Hero Card
                        Container(
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Stack(
                            children: [
                              // Bespoke Telemetry Radar Arcs Pattern
                              Positioned.fill(
                                child: CustomPaint(
                                  painter: _TelemetryRadarPatternPainter(),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                            children: [
                              Row(
                                children: [
                                  // Player Avatar
                                  Stack(
                                    children: [
                                      Container(
                                        width: 48,
                                        height: 48,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          gradient: const LinearGradient(
                                            begin: Alignment.topCenter,
                                            end: Alignment.bottomCenter,
                                            colors: [Color(0xFFCBD5E1), Color(0xFF94A3B8)],
                                          ),
                                          border: Border.all(color: Colors.white, width: 2),
                                        ),
                                        alignment: Alignment.center,
                                        child: Text(
                                          (competitor['initials'] as String?) ?? 'P',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        bottom: 0,
                                        right: 0,
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: BoxDecoration(
                                            color: kTournamentEmerald,
                                            shape: BoxShape.circle,
                                            border: Border.all(color: Colors.white, width: 2),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(width: 12),

                                  // Name & Details
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Flexible(
                                              child: Text(
                                                (competitor['name'] as String?) ?? 'Player',
                                                style: GoogleFonts.dmSans(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w800,
                                                  color: kDarkSlate,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: kSoftMintBg,
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(color: kSoftMintBorder),
                                              ),
                                              child: Text(
                                                'HCP ${(competitor['hcp'] as String?) ?? '0.0'}',
                                                style: GoogleFonts.dmSans(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w700,
                                                  color: kTournamentEmerald,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${(competitor['club'] as String?) ?? 'Golf Club'} • ${(competitor['flight'] as String?) ?? 'Flight A'}',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 11.5,
                                            color: kMutedSlate,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Score to Par Badge
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: toPar < 0
                                              ? const Color(0xFFEAF7EE)
                                              : toPar == 0
                                                  ? const Color(0xFFF1F5F9)
                                                  : const Color(0xFFFFF1F2),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(
                                            color: toPar < 0
                                                ? const Color(0xFFC6F0DB)
                                                : toPar == 0
                                                    ? const Color(0xFFE2E8F0)
                                                    : const Color(0xFFFECDD3),
                                          ),
                                        ),
                                        child: Text(
                                          toParText,
                                          style: GoogleFonts.dmSans(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w900,
                                            color: toPar < 0
                                                ? kTournamentEmerald
                                                : toPar == 0
                                                    ? const Color(0xFF334155)
                                                    : const Color(0xFFE11D48),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        'TO PAR',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF94A3B8),
                                          letterSpacing: 0.6,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),

                              const SizedBox(height: 14),
                              const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              const SizedBox(height: 14),

                              // 4-Box Telemetry KPI Grid
                              Row(
                                children: [
                                  _buildKpiBox('HOLE', '#${competitor['currentHole'] ?? 1}'),
                                  const SizedBox(width: 8),
                                  _buildKpiBox('THRU', '${competitor['thru'] ?? 0}'),
                                  const SizedBox(width: 8),
                                  _buildKpiBox('GROSS', '${competitor['gross'] ?? 0}'),
                                  const SizedBox(width: 8),
                                  _buildKpiBox('NET', '${competitor['net'] ?? 0}', isEmerald: true),
                                ],
                              ),

                              const SizedBox(height: 12),

                              // Meta pills
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: [
                                  _buildMetaPill('Tee: ${(competitor['teeTime'] as String?) ?? '08:00 AM'}'),
                                  _buildMetaPill('Ball: ${(competitor['ball'] as String?) ?? 'Titleist'}'),
                                  _buildMetaPill('Pace: ${(competitor['pace'] as String?) ?? 'On Pace'}', isGreen: true),
                                  _buildMetaPill('Marker: ${(competitor['marker'] as String?) ?? 'Attested'}'),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                        const SizedBox(height: 16),

                        // Card B: 18-Hole Official Scorecard Card (Matching Reference Design Pattern)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.03),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Header: FINAL SCORECARD • ROUND 1   and   Total: 71 (-1)
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'FINAL SCORECARD • ROUND 1',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF8CA0BA),
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Total: ',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: kDarkSlate,
                                        ),
                                      ),
                                      Text(
                                        totalPlayed > 0 ? '$totalGross ' : '$totalPar ',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w900,
                                          color: kDarkSlate,
                                        ),
                                      ),
                                      Text(
                                        '(${toPar < 0 ? "$toPar" : toPar == 0 ? "E" : "+$toPar"})',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w800,
                                          color: toPar < 0
                                              ? kTournamentEmerald
                                              : toPar == 0
                                                  ? const Color(0xFF64748B)
                                                  : const Color(0xFFD97706),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),
                              const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              const SizedBox(height: 10),

                              // Filter Tabs Row & Mini Legend
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  // Mini Legend Chips
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _buildMiniLegendBadge(const Color(0xFFEAF7EE), const Color(0xFF86EFAC), 'Birdie'),
                                      const SizedBox(width: 8),
                                      _buildMiniLegendBadge(Colors.white, const Color(0xFFE2E8F0), 'Par'),
                                      const SizedBox(width: 8),
                                      _buildMiniLegendBadge(const Color(0xFFFFFBEB), const Color(0xFFFDE68A), 'Bogey'),
                                    ],
                                  ),
                                  // Filter Tabs
                                  Container(
                                    padding: const EdgeInsets.all(2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        _buildFilterTab('all', 'All 18'),
                                        _buildFilterTab('out', 'Out'),
                                        _buildFilterTab('in', 'In'),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),

                              // Front 9 (OUT)
                              if (_selectedSection == 'all' || _selectedSection == 'out') ...[
                                _buildNineHoleGrid(front9),
                                const SizedBox(height: 6),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: Text(
                                    'OUT: ${outPlayed > 0 ? outGross : outPar}',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF8CA0BA),
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ),
                              ],

                              // Divider between Front 9 and Back 9
                              if (_selectedSection == 'all') ...[
                                const SizedBox(height: 10),
                                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                const SizedBox(height: 10),
                              ],

                              // Back 9 (IN)
                              if (_selectedSection == 'all' || _selectedSection == 'in') ...[
                                _buildNineHoleGrid(back9),
                                const SizedBox(height: 6),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: Text(
                                    'IN: ${inPlayed > 0 ? inGross : inPar}',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF8CA0BA),
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Card C: Marker Attestation Information
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: kSoftMintBg,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: kSoftMintBorder),
                                ),
                                child: const Icon(
                                  Icons.verified_rounded,
                                  color: kTournamentEmerald,
                                  size: 18,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'USGA Rule 3.3b Peer Attestation',
                                      style: GoogleFonts.dmSans(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w700,
                                        color: kDarkSlate,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Scores recorded & confirmed by marker ${(competitor['marker'] as String?) ?? 'Marker'} for ${(competitor['round'] as String?) ?? 'Round 2'}.',
                                      style: GoogleFonts.dmSans(
                                        fontSize: 11.5,
                                        color: kMutedSlate,
                                        height: 1.35,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Primary Action: Return to Hub
                        ElevatedButton(
                          onPressed: () => Navigator.of(context).pop(),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kTournamentEmerald,
                            foregroundColor: Colors.white,
                            minimumSize: const Size(double.infinity, 48),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.arrow_back_rounded, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                'Return to Tournament Hub',
                                style: GoogleFonts.dmSans(fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKpiBox(String title, String value, {bool isEmerald = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Column(
          children: [
            Text(
              title,
              style: GoogleFonts.dmSans(
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF94A3B8),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: GoogleFonts.dmSans(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: isEmerald ? kTournamentEmerald : kDarkSlate,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaPill(String text, {bool isGreen = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isGreen ? kSoftMintBg : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: isGreen ? kSoftMintBorder : const Color(0xFFE2E8F0)),
      ),
      child: Text(
        text,
        style: GoogleFonts.dmSans(
          fontSize: 10.5,
          fontWeight: FontWeight.w600,
          color: isGreen ? kTournamentEmerald : const Color(0xFF475569),
        ),
      ),
    );
  }

  Widget _buildFilterTab(String id, String label) {
    final isSelected = _selectedSection == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedSection = id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.dmSans(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? kDarkSlate : kMutedSlate,
          ),
        ),
      ),
    );
  }

  Widget _buildMiniLegendBadge(Color bg, Color border, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(2.5),
            border: Border.all(color: border, width: 1),
          ),
        ),
        const SizedBox(width: 3.5),
        Text(
          label,
          style: GoogleFonts.dmSans(
            fontSize: 9.5,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF8CA0BA),
          ),
        ),
      ],
    );
  }

  Widget _buildNineHoleGrid(List<Map<String, dynamic>> slice) {
    return Column(
      children: [
        // Row 1: H (Hole Numbers)
        Row(
          children: [
            SizedBox(
              width: 18,
              child: Text(
                'H',
                style: GoogleFonts.dmSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF8CA0BA),
                ),
              ),
            ),
            ...slice.map((h) {
              return Expanded(
                child: Center(
                  child: Text(
                    '${h['hole'] ?? 0}',
                    style: GoogleFonts.dmSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF8CA0BA),
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
        const SizedBox(height: 5),

        // Row 2: P (Pars)
        Row(
          children: [
            SizedBox(
              width: 18,
              child: Text(
                'P',
                style: GoogleFonts.dmSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF8CA0BA),
                ),
              ),
            ),
            ...slice.map((h) {
              return Expanded(
                child: Center(
                  child: Text(
                    '${h['par'] ?? 4}',
                    style: GoogleFonts.dmSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
        const SizedBox(height: 5),

        // Row 3: S (Scores - Squircles)
        Row(
          children: [
            SizedBox(
              width: 18,
              child: Text(
                'S',
                style: GoogleFonts.dmSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: kDarkSlate,
                ),
              ),
            ),
            ...slice.map((h) {
              final par = (h['par'] as int?) ?? 4;
              final strokes = h['strokes'] as int?;
              final diff = strokes != null ? strokes - par : null;

              Color bgColor = Colors.white;
              Color borderColor = const Color(0xFFE2E8F0);
              Color textColor = kDarkSlate;

              if (strokes != null) {
                if (diff! < 0) {
                  bgColor = const Color(0xFFEAF7EE);
                  borderColor = const Color(0xFF86EFAC);
                  textColor = kTournamentEmerald;
                } else if (diff > 0) {
                  bgColor = const Color(0xFFFFFBEB);
                  borderColor = const Color(0xFFFDE68A);
                  textColor = const Color(0xFFD97706);
                } else {
                  bgColor = Colors.white;
                  borderColor = const Color(0xFFE2E8F0);
                  textColor = kDarkSlate;
                }
              } else {
                bgColor = const Color(0xFFF8FAFC);
                borderColor = const Color(0xFFE2E8F0);
                textColor = const Color(0xFFCBD5E1);
              }

              return Expanded(
                child: Container(
                  height: 38,
                  margin: const EdgeInsets.symmetric(horizontal: 1.5),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: borderColor, width: 1.1),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    strokes != null ? '$strokes' : '-',
                    style: GoogleFonts.dmSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: textColor,
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
      ],
    );
  }
}

/// Custom painter for On-Course Telemetry Hero Card
/// Features concentric radar sweep arcs radiating from the top-right score badge and a subtle telemetry distance grid
class _TelemetryRadarPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // 1. Telemetry distance grid lines
    final gridPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.04)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.75;

    for (double y = 20; y < size.height; y += 36) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
    for (double x = 30; x < size.width; x += 60) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }

    // 2. Concentric radar sweep arcs centered near top-right (around the TO PAR badge)
    final radarCenter = Offset(size.width - 32, 28);
    final radarPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.07)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (double r = 24; r <= 140; r += 28) {
      canvas.drawCircle(radarCenter, r, radarPaint);
    }

    // Crosshairs on the radar center
    final crosshairPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.09)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.9;
    canvas.drawLine(Offset(radarCenter.dx - 16, radarCenter.dy), Offset(radarCenter.dx + 16, radarCenter.dy), crosshairPaint);
    canvas.drawLine(Offset(radarCenter.dy, radarCenter.dx - 16), Offset(radarCenter.dy, radarCenter.dx + 16), crosshairPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
