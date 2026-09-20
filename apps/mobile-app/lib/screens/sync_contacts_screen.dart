import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SyncContactsScreen extends StatefulWidget {
  final VoidCallback? onContactsAllowed;

  const SyncContactsScreen({
    super.key,
    this.onContactsAllowed,
  });

  @override
  State<SyncContactsScreen> createState() => _SyncContactsScreenState();
}

class _SyncContactsScreenState extends State<SyncContactsScreen> {
  bool _isSyncing = false;

  Future<void> _handleAllowAccess() async {
    if (_isSyncing) return;
    setState(() => _isSyncing = true);

    // Simulate address book access & matching
    await Future.delayed(const Duration(milliseconds: 650));

    if (!mounted) return;

    if (widget.onContactsAllowed != null) {
      widget.onContactsAllowed!();
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Contacts synced! 4 friends found on OpenclubOS.'),
        backgroundColor: Color(0xFF009A60),
        behavior: SnackBarBehavior.floating,
        duration: Duration(seconds: 2),
      ),
    );

    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              children: [
                // 1. Unified Navigation Header with standard circular back pill
                Container(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                  child: Row(
                    children: [
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
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.arrow_back_rounded,
                            size: 18,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Scrollable / Centered Body
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Upper content: Hero icon, titles, and benefit cards
                        Column(
                          children: [
                            const SizedBox(height: 16),

                            // Hero Contact Badge matching screenshot
                            Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  width: 104,
                                  height: 104,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFD5F2E3),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: const Color(0xFFEAF7EE),
                                      width: 4,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF009A60).withOpacity(0.08),
                                        blurRadius: 16,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF009A60),
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF009A60).withOpacity(0.2),
                                            blurRadius: 6,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: const Center(
                                        child: Icon(
                                          Icons.contact_phone_rounded,
                                          color: Colors.white,
                                          size: 26,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),

                                // Top-Right Security Shield Indicator
                                Positioned(
                                  top: 0,
                                  right: 0,
                                  child: Container(
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: const Color(0xFFC6F0DB),
                                        width: 1.5,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.06),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                    child: const Center(
                                      child: Icon(
                                        Icons.shield_rounded,
                                        color: Color(0xFF009A60),
                                        size: 15,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 24),

                            // Headline
                            Text(
                              'Sync Your Contacts',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.dmSans(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                                letterSpacing: -0.5,
                              ),
                            ),

                            const SizedBox(height: 10),

                            // Subtitle
                            RichText(
                              textAlign: TextAlign.center,
                              text: TextSpan(
                                style: GoogleFonts.dmSans(
                                  fontSize: 13.5,
                                  color: const Color(0xFF64748B),
                                  height: 1.45,
                                ),
                                children: const [
                                  TextSpan(
                                    text: 'Find friends and fellow club members\nwho are already on ',
                                  ),
                                  TextSpan(
                                    text: 'OpenclubOS',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  TextSpan(text: '.'),
                                ],
                              ),
                            ),

                            const SizedBox(height: 32),

                            // Benefit Card 1: Auto-Connect With Friends
                            Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.02),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Stack(
                                  children: [
                                    Positioned.fill(
                                      child: CustomPaint(
                                        painter: _AutoConnectPatternPainter(),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 36,
                                            height: 36,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEAF7EE),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: const Center(
                                              child: Icon(
                                                Icons.people_alt_rounded,
                                                color: Color(0xFF009A60),
                                                size: 18,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Text(
                                              'Auto-Connect with Friends',
                                              style: GoogleFonts.dmSans(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF5E718D),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            const SizedBox(height: 12),

                            // Benefit Card 2: Secure & Private Sync
                            Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.02),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Stack(
                                  children: [
                                    Positioned.fill(
                                      child: CustomPaint(
                                        painter: _SecurePrivatePatternPainter(),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 36,
                                            height: 36,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEAF7EE),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: const Center(
                                              child: Icon(
                                                Icons.lock_rounded,
                                                color: Color(0xFF009A60),
                                                size: 18,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Text(
                                              'Secure & Private Sync',
                                              style: GoogleFonts.dmSans(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF5E718D),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),

                        // Lower content: Action Buttons
                        Padding(
                          padding: const EdgeInsets.only(bottom: 24, top: 16),
                          child: Column(
                            children: [
                              // Primary "ALLOW ACCESS" Button
                              SizedBox(
                                width: double.infinity,
                                height: 52,
                                child: ElevatedButton(
                                  onPressed: _isSyncing ? null : _handleAllowAccess,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF009A60),
                                    foregroundColor: Colors.white,
                                    elevation: 4,
                                    shadowColor: const Color(0xFF009A60).withOpacity(0.35),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                  ),
                                  child: _isSyncing
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : Text(
                                          'Allow Access',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.white,
                                          ),
                                        ),
                                ),
                              ),

                              const SizedBox(height: 12),

                              // Secondary "Maybe Later" Button
                              GestureDetector(
                                onTap: () => Navigator.of(context).pop(),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  child: Text(
                                    'Maybe Later',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF8CA0BA),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
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
}

/// Custom painter for Auto-Connect friend network constellation pattern
class _AutoConnectPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.16)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.9;

    final p1 = Offset(size.width * 0.65, size.height * 0.6);
    final p2 = Offset(size.width * 0.78, size.height * 0.32);
    final p3 = Offset(size.width * 0.90, size.height * 0.65);
    final p4 = Offset(size.width * 0.84, size.height * 0.2);

    canvas.drawLine(p1, p2, linePaint);
    canvas.drawLine(p2, p3, linePaint);
    canvas.drawLine(p2, p4, linePaint);

    final dotPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.24)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(p1, 2.5, dotPaint);
    canvas.drawCircle(p2, 3.2, dotPaint);
    canvas.drawCircle(p3, 3.5, dotPaint);
    canvas.drawCircle(p4, 2.0, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom painter for Secure & Private hexagonal privacy vault pattern
class _SecurePrivatePatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final hexPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.09)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    // Draw small hexagonal vault cell on right side
    final center = Offset(size.width * 0.85, size.height * 0.5);
    final circlePaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    canvas.drawCircle(center, 16, circlePaint);
    circlePaint.color = const Color(0xFF009A60).withOpacity(0.06);
    canvas.drawCircle(center, 26, circlePaint);

    // Draw privacy cross ticks
    final tickPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.14)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.9;
    canvas.drawLine(Offset(center.dx - 20, center.dy), Offset(center.dx - 12, center.dy), tickPaint);
    canvas.drawLine(Offset(center.dx + 12, center.dy), Offset(center.dx + 20, center.dy), tickPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
