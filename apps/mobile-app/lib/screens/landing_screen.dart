import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  static const Color kTournamentEmerald = Color(0xFF009A60);
  static const Color kTournamentEmeraldDark = Color(0xFF008251);

  final List<OnboardingSlideData> _slides = const [
    OnboardingSlideData(
      imagePath: 'assets/images/onboarding1.jpg',
      titlePrefix: 'The Modern Operating\nSystem for ',
      titleHighlight: 'Golf\nTournaments',
      subtitle:
          'Experience elite tournament management, real-time leaderboards, and automated peer-attested scoring.',
      buttonText: 'Continue',
      isLast: false,
    ),
    OnboardingSlideData(
      imagePath: 'assets/images/onboarding2.jpg',
      titlePrefix: 'Real-Time Leaderboards\n& ',
      titleHighlight: 'Live Scoring',
      subtitle:
          'Follow the action as it happens. Every stroke, every hole, updated instantly across all devices.',
      buttonText: 'Continue',
      isLast: false,
    ),
    OnboardingSlideData(
      imagePath: 'assets/images/onboarding3.jpg',
      titlePrefix: 'Automated Bookings &\n',
      titleHighlight: 'Practice Rounds',
      subtitle:
          'Secure your spot. Manage tee times, payments, and practice sessions with seamless automation.',
      buttonText: 'Get Started Free',
      isLast: true,
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _handleContinue() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      Navigator.of(context).pushNamed('/register');
    }
  }

  void _goToLogin() {
    Navigator.of(context).pushNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background PageView with cross-fading imagery
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            itemCount: _slides.length,
            itemBuilder: (context, index) {
              return Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    _slides[index].imagePath,
                    fit: BoxFit.cover,
                    alignment: const Alignment(0, -0.45),
                    errorBuilder: (context, error, stackTrace) {
                      // Fallback gradient if image not loaded
                      return Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: index == 0
                                ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                                : index == 1
                                    ? [const Color(0xFF064E3B), const Color(0xFF022C22)]
                                    : [const Color(0xFF78350F), const Color(0xFF451A03)],
                          ),
                        ),
                      );
                    },
                  ),
                  // Dark gradient overlay for logo contrast
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.55),
                          Colors.transparent,
                          Colors.black.withOpacity(0.25),
                        ],
                        stops: const [0.0, 0.35, 1.0],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // Top Header: Centered OpenclubOS Logo Badge
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.only(top: 16.0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.25),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.white.withOpacity(0.12)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: kTournamentEmerald,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: kTournamentEmerald.withOpacity(0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.sports_golf_rounded,
                            size: 18,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      RichText(
                        text: TextSpan(
                          style: GoogleFonts.dmSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.4,
                            color: Colors.white,
                          ),
                          children: const [
                            TextSpan(text: 'Openclub'),
                            TextSpan(
                              text: 'OS',
                              style: TextStyle(color: Color(0xFF10B981)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Bottom Sheet: White Rounded Card with Slides & Actions
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              constraints: const BoxConstraints(maxWidth: 460),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 24,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Pagination Indicator (Pill + Dots)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_slides.length, (idx) {
                      final isActive = _currentPage == idx;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isActive ? 26 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: isActive ? kTournamentEmerald : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 24),

                  // Headline with Italic Green Accent
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: GoogleFonts.dmSans(
                        fontSize: 25,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF111827),
                        letterSpacing: -0.5,
                        height: 1.22,
                      ),
                      children: [
                        TextSpan(text: _slides[_currentPage].titlePrefix),
                        TextSpan(
                          text: _slides[_currentPage].titleHighlight,
                          style: const TextStyle(
                            color: kTournamentEmerald,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Subtitle
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 310),
                    child: Text(
                      _slides[_currentPage].subtitle,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF5B6B7F),
                        height: 1.5,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ),
                  const SizedBox(height: 26),

                  // Primary Action Button: "Continue >" or "Get Started Free >"
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _handleContinue,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kTournamentEmerald,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _slides[_currentPage].buttonText,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.chevron_right_rounded,
                            size: 18,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Secondary Action: "Already a member? Sign In"
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Already a member? ',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.normal,
                        ),
                      ),
                      GestureDetector(
                        onTap: _goToLogin,
                        child: const Text(
                          'Sign In',
                          style: TextStyle(
                            fontSize: 13,
                            color: kTournamentEmerald,
                            fontWeight: FontWeight.bold,
                            decoration: TextDecoration.underline,
                            decorationColor: kTournamentEmerald,
                            decorationThickness: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Trust Badges: SOC2 TYPE II & GDPR READY
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: const [
                          Icon(
                            Icons.shield_outlined,
                            size: 13,
                            color: Color(0xFF8CA0BA),
                          ),
                          SizedBox(width: 4),
                          Text(
                            'SOC2 TYPE II',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.normal,
                              letterSpacing: 0.8,
                              color: Color(0xFF8CA0BA),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 20),
                      Row(
                        children: const [
                          Icon(
                            Icons.lock_outline_rounded,
                            size: 13,
                            color: Color(0xFF8CA0BA),
                          ),
                          SizedBox(width: 4),
                          Text(
                            'GDPR READY',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.normal,
                              letterSpacing: 0.8,
                              color: Color(0xFF8CA0BA),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingSlideData {
  final String imagePath;
  final String titlePrefix;
  final String titleHighlight;
  final String subtitle;
  final String buttonText;
  final bool isLast;

  const OnboardingSlideData({
    required this.imagePath,
    required this.titlePrefix,
    required this.titleHighlight,
    required this.subtitle,
    required this.buttonText,
    required this.isLast,
  });
}
