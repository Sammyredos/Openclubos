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
                            (competitor['tournament'] as String?) ?? 'Oakwood Championship',
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
                          padding: const EdgeInsets.all(16),
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

                        const SizedBox(height: 16),

                        // Card B: 18-Hole Official Scorecard Table
                        Container(
                          padding: const EdgeInsets.all(14),
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Filter Buttons Row
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'SCORECARD',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: kDarkSlate,
                                      letterSpacing: 0.6,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(2.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        _buildFilterTab('all', 'All 18'),
                                        _buildFilterTab('out', 'Out (1-9)'),
                                        _buildFilterTab('in', 'In (10-18)'),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 10),

                              // Legend
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  _buildLegendItem(
                                    Container(
                                      width: 14,
                                      height: 14,
                                      decoration: BoxDecoration(
                                        color: kSoftMintBg,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: kTournamentEmerald),
                                      ),
                                    ),
                                    'Birdie',
                                  ),
                                  const SizedBox(width: 14),
                                  _buildLegendItem(
                                    Container(
                                      width: 14,
                                      height: 14,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFEF3C7),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: const Color(0xFFF59E0B)),
                                      ),
                                    ),
                                    'Eagle',
                                  ),
                                  const SizedBox(width: 14),
                                  _buildLegendItem(
                                    Text('#', style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.bold, color: kDarkSlate)),
                                    'Par',
                                  ),
                                  const SizedBox(width: 14),
                                  _buildLegendItem(
                                    Container(
                                      width: 14,
                                      height: 14,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(3),
                                        border: Border.all(color: const Color(0xFFCBD5E1)),
                                      ),
                                    ),
                                    'Bogey',
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),
                              const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              const SizedBox(height: 8),

                              // Scorecard Header
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                                child: Row(
                                  children: [
                                    Expanded(flex: 2, child: _tableHeader('HOLE')),
                                    Expanded(flex: 2, child: _tableHeader('PAR', align: TextAlign.center)),
                                    Expanded(flex: 2, child: _tableHeader('YDS', align: TextAlign.center)),
                                    Expanded(flex: 2, child: _tableHeader('SCORE', align: TextAlign.center)),
                                    Expanded(flex: 2, child: _tableHeader('DIFF', align: TextAlign.right)),
                                  ],
                                ),
                              ),
                              const Divider(height: 1, color: Color(0xFFE2E8F0)),

                              // Holes List
                              ...displayedHoles.map((h) {
                                final holeNum = h['hole'] as int? ?? 0;
                                final par = h['par'] as int? ?? 4;
                                final yards = h['yards'] as int? ?? 400;
                                final strokes = h['strokes'] as int?;
                                final isCurrent = holeNum == (competitor['currentHole'] as int? ?? 0);
                                final diff = strokes != null ? strokes - par : null;

                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: isCurrent ? const Color(0xFFF0FDF4) : Colors.transparent,
                                    border: const Border(bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1)),
                                  ),
                                  child: Row(
                                    children: [
                                      // Hole #
                                      Expanded(
                                        flex: 2,
                                        child: Row(
                                          children: [
                                            Text(
                                              '$holeNum',
                                              style: GoogleFonts.dmSans(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700,
                                                color: kDarkSlate,
                                              ),
                                            ),
                                            if (isCurrent) ...[
                                              const SizedBox(width: 4),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                                decoration: BoxDecoration(
                                                  color: kTournamentEmerald,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text(
                                                  'NOW',
                                                  style: GoogleFonts.dmSans(
                                                    fontSize: 8,
                                                    fontWeight: FontWeight.w900,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),

                                      // Par
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          '$par',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.dmSans(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w600,
                                            color: const Color(0xFF475569),
                                          ),
                                        ),
                                      ),

                                      // Yards
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          '$yards',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.dmSans(
                                            fontSize: 11.5,
                                            color: const Color(0xFF94A3B8),
                                          ),
                                        ),
                                      ),

                                      // Strokes Badge
                                      Expanded(
                                        flex: 2,
                                        child: Center(
                                          child: _buildStrokesBadge(strokes, par),
                                        ),
                                      ),

                                      // Diff
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          diff == null
                                              ? '-'
                                              : diff == 0
                                                  ? 'E'
                                                  : diff > 0
                                                      ? '+$diff'
                                                      : '$diff',
                                          textAlign: TextAlign.right,
                                          style: GoogleFonts.dmSans(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: diff == null || diff == 0
                                                ? const Color(0xFF94A3B8)
                                                : diff > 0
                                                    ? const Color(0xFFE11D48)
                                                    : kTournamentEmerald,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),

                              // Front 9 Out Row
                              if (_selectedSection == 'all' || _selectedSection == 'out')
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                                  color: const Color(0xFFF8FAFC),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 2,
                                        child: Text('OUT (1-9)', style: GoogleFonts.dmSans(fontSize: 11.5, fontWeight: FontWeight.w800, color: kDarkSlate)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text('$outPar', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 11.5, fontWeight: FontWeight.w800, color: kDarkSlate)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text('$outYards', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 11, color: const Color(0xFF94A3B8))),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(outPlayed > 0 ? '$outGross' : '-', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 12.5, fontWeight: FontWeight.w800, color: kDarkSlate)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          outPlayed > 0 ? (outGross - outPar == 0 ? 'E' : outGross - outPar > 0 ? '+${outGross - outPar}' : '${outGross - outPar}') : '-',
                                          textAlign: TextAlign.right,
                                          style: GoogleFonts.dmSans(fontSize: 11.5, fontWeight: FontWeight.w800, color: kDarkSlate),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                              // Back 9 In Row
                              if (_selectedSection == 'all' || _selectedSection == 'in')
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                                  color: const Color(0xFFF8FAFC),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 2,
                                        child: Text('IN (10-18)', style: GoogleFonts.dmSans(fontSize: 11.5, fontWeight: FontWeight.w800, color: kDarkSlate)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text('$inPar', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 11.5, fontWeight: FontWeight.w800, color: kDarkSlate)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text('$inYards', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 11, color: const Color(0xFF94A3B8))),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(inPlayed > 0 ? '$inGross' : '-', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 12.5, fontWeight: FontWeight.w800, color: kDarkSlate)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          inPlayed > 0 ? (inGross - inPar == 0 ? 'E' : inGross - inPar > 0 ? '+${inGross - inPar}' : '${inGross - inPar}') : '-',
                                          textAlign: TextAlign.right,
                                          style: GoogleFonts.dmSans(fontSize: 11.5, fontWeight: FontWeight.w800, color: kDarkSlate),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                              // Total Row
                              if (_selectedSection == 'all')
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFEAF7EE),
                                    border: Border(top: BorderSide(color: kTournamentEmerald, width: 2)),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 2,
                                        child: Text('TOTAL', style: GoogleFonts.dmSans(fontSize: 12, fontWeight: FontWeight.w900, color: kTournamentEmerald)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text('$totalPar', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 12, fontWeight: FontWeight.w900, color: kTournamentEmerald)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text('$totalYards', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 11, color: const Color(0xFF007A4D))),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(totalPlayed > 0 ? '$totalGross' : '-', textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 13, fontWeight: FontWeight.w900, color: kTournamentEmerald)),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          totalPlayed > 0 ? toParText : '-',
                                          textAlign: TextAlign.right,
                                          style: GoogleFonts.dmSans(fontSize: 12.5, fontWeight: FontWeight.w900, color: kTournamentEmerald),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
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

  Widget _buildLegendItem(Widget iconWidget, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        iconWidget,
        const SizedBox(width: 4),
        Text(
          text,
          style: GoogleFonts.dmSans(fontSize: 10, color: const Color(0xFF64748B)),
        ),
      ],
    );
  }

  Widget _tableHeader(String text, {TextAlign align = TextAlign.left}) {
    return Text(
      text,
      textAlign: align,
      style: GoogleFonts.dmSans(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        color: const Color(0xFF94A3B8),
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildStrokesBadge(int? strokes, int par) {
    if (strokes == null) {
      return Text('-', style: GoogleFonts.dmSans(fontSize: 13, color: const Color(0xFFCBD5E1)));
    }
    final diff = strokes - par;
    if (diff <= -2) {
      // Eagle
      return Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
        ),
        alignment: Alignment.center,
        child: Text(
          '$strokes',
          style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFFB45309)),
        ),
      );
    }
    if (diff == -1) {
      // Birdie
      return Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: kSoftMintBg,
          shape: BoxShape.circle,
          border: Border.all(color: kTournamentEmerald, width: 1.5),
        ),
        alignment: Alignment.center,
        child: Text(
          '$strokes',
          style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w900, color: kTournamentEmerald),
        ),
      );
    }
    if (diff == 0) {
      // Par
      return Text(
        '$strokes',
        style: GoogleFonts.dmSans(fontSize: 12.5, fontWeight: FontWeight.w800, color: kDarkSlate),
      );
    }
    if (diff == 1) {
      // Bogey
      return Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: const Color(0xFFCBD5E1)),
        ),
        alignment: Alignment.center,
        child: Text(
          '$strokes',
          style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
        ),
      );
    }
    // Double Bogey or worse
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: const Color(0xFFFECDD3)),
      ),
      alignment: Alignment.center,
      child: Text(
        '$strokes',
        style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFFE11D48)),
      ),
    );
  }
}
