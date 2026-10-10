import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _progressAnimController;
  late AnimationController _dotAnimController;

  static const Color kEmerald = Color(0xFF009A60);
  static const Color kDarkSlate = Color(0xFF0F172A);

  @override
  void initState() {
    super.initState();

    // 1. Loading state 3-dot animation
    _dotAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();

    // 2. Centralized System Load Bar: 3-second duration
    _progressAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );

    _progressAnimController.forward();

    _progressAnimController.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        _handleSplashNavigation();
      }
    });

    // Fallback safety timeout for 3 seconds
    Future.delayed(const Duration(milliseconds: 3050), () {
      if (mounted) {
        _handleSplashNavigation();
      }
    });
  }

  Future<void> _handleSplashNavigation() async {
    try {
      final box =
          Hive.isBoxOpen('auth') ? Hive.box('auth') : await Hive.openBox('auth');
      final token = box.get('token') ?? box.get('accessToken');
      final hasSession = token != null && token.toString().trim().isNotEmpty;
      if (mounted) {
        if (hasSession) {
          // Simply login user to their dashboard without any intermediate UI
          Navigator.of(context).pushReplacementNamed('/app/home');
        } else {
          // Default landing page is the login page directly without any UI
          Navigator.of(context).pushReplacementNamed('/login');
        }
      }
    } catch (_) {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }

  @override
  void dispose() {
    _progressAnimController.dispose();
    _dotAnimController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFFFFFF),
              Color(0xFFF3FAF6),
              Color(0xFFE2F4EA),
            ],
            stops: [0.0, 0.45, 1.0],
          ),
        ),
        child: Stack(
          children: [
            // Ambient soft glowing bokeh over green gradient
            Positioned.fill(
              child: CustomPaint(
                painter: _GreenAuraBokehPainter(),
              ),
            ),

            SafeArea(
              child: Column(
                children: [
                  const Spacer(flex: 5),

                  // Center Brand Identity
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Squircle Emblem with soft organic outer ring
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            // Soft organic contour ring
                            Transform.rotate(
                              angle: 0.08,
                              child: Container(
                                width: 148,
                                height: 148,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(44),
                                  border: Border.all(
                                    color: const Color(0xFFA7DEC0)
                                        .withOpacity(0.55),
                                    width: 1.2,
                                  ),
                                ),
                              ),
                            ),

                            // Emerald Squircle Container
                            Container(
                              width: 124,
                              height: 124,
                              decoration: BoxDecoration(
                                color: kEmerald,
                                borderRadius: BorderRadius.circular(34),
                                boxShadow: [
                                  BoxShadow(
                                    color: kEmerald.withOpacity(0.24),
                                    blurRadius: 36,
                                    offset: const Offset(0, 12),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: CustomPaint(
                                  size: const Size(68, 68),
                                  painter: _GolfBallTeePainter(),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),

                        // Main Brand Title: OPENCLUBOS
                        RichText(
                          text: TextSpan(
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 29,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.5,
                              color: kDarkSlate,
                            ),
                            children: const [
                              TextSpan(text: 'OPENCLUB'),
                              TextSpan(
                                text: 'OS',
                                style: TextStyle(color: kEmerald),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Sub-tagline: — EVOLUTION OF GOLF —
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 46,
                              height: 1,
                              color: const Color(0xFFA7DEC0).withOpacity(0.8),
                            ),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 14),
                              child: Text(
                                'EVOLUTION OF GOLF',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 2.8,
                                  color: const Color(0xFF52796F),
                                ),
                              ),
                            ),
                            Container(
                              width: 46,
                              height: 1,
                              color: const Color(0xFFA7DEC0).withOpacity(0.8),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Spacer(flex: 4),

                  // Lower Section: System Load & Tagline & 3 Loading Dots
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Centralized SYSTEM LOAD (v2.x removed)
                      Text(
                        'SYSTEM LOAD',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2.2,
                          color: const Color(0xFF7E9892),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Centralized 2-Second Progress Bar
                      Container(
                        width: 220,
                        height: 2.5,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCCEBD8),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        alignment: Alignment.centerLeft,
                        child: AnimatedBuilder(
                          animation: _progressAnimController,
                          builder: (context, child) {
                            return Container(
                              width: 220 * _progressAnimController.value,
                              height: 2.5,
                              decoration: BoxDecoration(
                                color: kEmerald,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 34),

                      // Precision Management for the Modern Golfers
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          'PRECISION MANAGEMENT FOR THE MODERN GOLFERS',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2.2,
                            color: const Color(0xFF7E9892),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // 3 Animated Loading State Dots
                      AnimatedBuilder(
                        animation: _dotAnimController,
                        builder: (context, child) {
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(3, (index) {
                              final phase = (_dotAnimController.value +
                                      (index * 0.28)) %
                                  1.0;
                              final opacity = 0.25 +
                                  (0.75 *
                                      (1.0 - (phase - 0.5).abs() * 2));
                              final scale = 0.8 +
                                  (0.35 *
                                      (1.0 - (phase - 0.5).abs() * 2));
                              return Transform.scale(
                                scale: scale,
                                child: Container(
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 3),
                                  width: 5.5,
                                  height: 5.5,
                                  decoration: BoxDecoration(
                                    color: kEmerald.withOpacity(
                                        opacity.clamp(0.2, 1.0)),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              );
                            }),
                          );
                        },
                      ),
                    ],
                  ),

                  const Spacer(flex: 2),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Custom painter to draw the stylized golf ball on tee icon
class _GolfBallTeePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final whitePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final emeraldPaint = Paint()
      ..color = const Color(0xFF009A60)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    final centerX = size.width / 2;
    final ballCenterY = size.height * 0.38;
    final ballRadius = size.width * 0.27;

    // 1. Golf Ball
    canvas.drawCircle(Offset(centerX, ballCenterY), ballRadius, whitePaint);

    // 2. Dimple Crescent Accents
    final dimple1 = Path()
      ..moveTo(centerX + 6, ballCenterY - 8)
      ..quadraticBezierTo(
          centerX + 9, ballCenterY - 4, centerX + 6, ballCenterY);
    canvas.drawPath(dimple1, emeraldPaint);

    final dimple2 = Path()
      ..moveTo(centerX + 11, ballCenterY - 1)
      ..quadraticBezierTo(
          centerX + 14, ballCenterY + 3, centerX + 11, ballCenterY + 7);
    canvas.drawPath(dimple2, emeraldPaint);

    final dimple3 = Path()
      ..moveTo(centerX + 4, ballCenterY + 6)
      ..quadraticBezierTo(
          centerX + 7, ballCenterY + 10, centerX + 4, ballCenterY + 13);
    canvas.drawPath(dimple3, emeraldPaint);

    // 3. Golf Tee Cup
    final cupPath = Path()
      ..moveTo(centerX - 10, ballCenterY + ballRadius - 1)
      ..lineTo(centerX + 10, ballCenterY + ballRadius - 1)
      ..quadraticBezierTo(centerX + 5, ballCenterY + ballRadius + 4, centerX,
          ballCenterY + ballRadius + 4)
      ..quadraticBezierTo(centerX - 5, ballCenterY + ballRadius + 4,
          centerX - 10, ballCenterY + ballRadius - 1)
      ..close();
    canvas.drawPath(cupPath, whitePaint);

    // 4. Golf Tee Stem
    final stemPath = Path()
      ..moveTo(centerX - 3.5, ballCenterY + ballRadius + 3)
      ..lineTo(centerX - 3.5, size.height * 0.88)
      ..quadraticBezierTo(
          centerX, size.height * 0.94, centerX + 3.5, size.height * 0.88)
      ..lineTo(centerX + 3.5, ballCenterY + ballRadius + 3)
      ..close();
    canvas.drawPath(stemPath, whitePaint);

    // 5. Tee horizontal collar
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(centerX, ballCenterY + ballRadius + 10),
          width: 14,
          height: 3,
        ),
        const Radius.circular(1.5),
      ),
      whitePaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom painter for background soft green aura and bokeh blooms
class _GreenAuraBokehPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // 1. Center halo aura behind emblem
    final auraPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.045)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 50);

    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.38),
      130,
      auraPaint,
    );

    // 2. Middle-left soft bloom
    final bloomLeftPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.035)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 60);

    canvas.drawCircle(
      Offset(size.width * 0.15, size.height * 0.45),
      120,
      bloomLeftPaint,
    );

    // 3. Bottom-right soft bloom
    final bloomRightPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.04)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 60);

    canvas.drawCircle(
      Offset(size.width * 0.85, size.height * 0.65),
      130,
      bloomRightPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
