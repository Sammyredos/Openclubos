import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import 'set_new_password_screen.dart';

class CheckInboxScreen extends ConsumerStatefulWidget {
  final String email;
  const CheckInboxScreen({super.key, required this.email});

  @override
  ConsumerState<CheckInboxScreen> createState() => _CheckInboxScreenState();
}

class _CheckInboxScreenState extends ConsumerState<CheckInboxScreen> {
  static const Color kTournamentEmerald = Color(0xFF009A60);
  static const Color kMintBadgeBg = Color(0xFFEAF5EE);
  static const Color kTextDark = Color(0xFF0F172A);
  static const Color kTextMuted = Color(0xFF64748B);

  int _countdown = 48;
  Timer? _timer;
  bool _isResending = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        setState(() => _countdown--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _handleResend() async {
    if (_countdown > 0 || _isResending) return;

    setState(() => _isResending = true);
    try {
      final authService = ref.read(authServiceProvider);
      await authService.forgotPassword(widget.email);
      setState(() {
        _countdown = 60;
      });
      _startTimer();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: kTournamentEmerald,
            content: Text('Password reset instructions resent to ${widget.email}'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(e.toString().replaceAll('Exception: ', '')),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isResending = false);
    }
  }

  void _handleOpenEmailApp() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const SetNewPasswordScreen(),
      ),
    );
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
                // Pinned Top Navigation Bar (Exact match with registration_screen)
                Container(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                      const SizedBox(width: 36),
                    ],
                  ),
                ),

                // Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                    child: Column(
                      children: [
                        const SizedBox(height: 12),

                        // Visual Centerpiece: Mint Squircle + Emerald Envelope + Check Badge (Standardized 76x76)
              Center(
                child: SizedBox(
                  width: 76,
                  height: 76,
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      // Mint Squircle
                      Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF7EE),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFC6F0DB)),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.mark_email_read_rounded,
                            size: 36,
                            color: kTournamentEmerald,
                          ),
                        ),
                      ),

                      // Top-Right Circular Green Check Badge
                      Positioned(
                        top: -4,
                        right: -4,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: kTournamentEmerald,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Heading: "Check Your Inbox"
              const Text(
                'Check Your Inbox',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: kTextDark,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 10),

              // Description with dynamic bolded email
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 13.5,
                      color: kTextMuted,
                      height: 1.45,
                    ),
                    children: [
                      const TextSpan(text: "We've sent password reset instructions to\n"),
                      TextSpan(
                        text: widget.email,
                        style: const TextStyle(
                          color: kTextDark,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const TextSpan(text: "."),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Action Button: "Open Email App" with paper plane icon
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _handleOpenEmailApp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kTournamentEmerald,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.send_rounded, size: 18, color: Colors.white),
                      SizedBox(width: 8),
                      Text(
                        'Open Email App',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Resend prompt with countdown
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Didn't receive the email? ",
                    style: TextStyle(fontSize: 13, color: kTextMuted),
                  ),
                  if (_countdown > 0)
                    Text(
                      'RESEND IN ${_countdown}s',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: kTournamentEmerald,
                        letterSpacing: 0.5,
                      ),
                    )
                  else
                    GestureDetector(
                      onTap: _isResending ? null : _handleResend,
                      child: Text(
                        _isResending ? 'RESENDING...' : 'RESEND NOW',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: kTournamentEmerald,
                          letterSpacing: 0.5,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                ],
              ),

              const Spacer(),
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
