import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';

class SetNewPasswordScreen extends ConsumerStatefulWidget {
  final String? resetToken;
  const SetNewPasswordScreen({super.key, this.resetToken});

  @override
  ConsumerState<SetNewPasswordScreen> createState() => _SetNewPasswordScreenState();
}

class _SetNewPasswordScreenState extends ConsumerState<SetNewPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  String? _errorMessage;

  static const Color kTournamentEmerald = Color(0xFF009A60);
  static const Color kGreenInputBg = Color(0xFFF5FAF6);
  static const Color kGreenInputBorder = Color(0xFFE1EFE5);
  static const Color kTextDark = Color(0xFF0F172A);
  static const Color kTextMuted = Color(0xFF64748B);

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(() => setState(() {}));
    _confirmPasswordController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  int _calcStrength(String pass) {
    if (pass.isEmpty) return 0;
    int s = 0;
    if (pass.length >= 8) s++;
    if (RegExp(r'[A-Z]').hasMatch(pass) && RegExp(r'[a-z]').hasMatch(pass)) s++;
    if (RegExp(r'[0-9]').hasMatch(pass)) s++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(pass)) s++;
    return s;
  }

  Future<void> _handleUpdatePassword() async {
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;

    if (password.length < 8) {
      setState(() => _errorMessage = 'Password must be at least 8 characters long.');
      return;
    }

    final strength = _calcStrength(password);
    if (strength < 4) {
      setState(() => _errorMessage = 'Password meter is not full. Add uppercase, number & symbol to proceed.');
      return;
    }

    if (password != confirm) {
      setState(() => _errorMessage = 'Passwords do not match. Please verify your password entry.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      if (widget.resetToken != null && widget.resetToken!.isNotEmpty) {
        await authService.resetPassword(widget.resetToken!, password);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: kTournamentEmerald,
            content: Text('Password updated successfully! Please sign in with your new credentials.'),
          ),
        );
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        final errMsg = e.toString().replaceAll('Exception: ', '');
        final isRoleRestricted = errMsg.toLowerCase().contains('role') ||
            errMsg.toLowerCase().contains('access denied') ||
            errMsg.toLowerCase().contains('reserved');
        final isConnectionError = errMsg.toLowerCase().contains('connection') ||
            errMsg.toLowerCase().contains('socket') ||
            errMsg.toLowerCase().contains('timeout') ||
            errMsg.toLowerCase().contains('failed to connect') ||
            errMsg.toLowerCase().contains('network');
        final errorTitle = isRoleRestricted
            ? 'ACCESS RESTRICTED'
            : isConnectionError
                ? 'SERVER CONNECTION FAILURE'
                : 'PASSWORD RESET FAILED';

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Row(
              children: [
                const Icon(Icons.shield_outlined, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        errorTitle,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        errMsg,
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;
    final strength = _calcStrength(password);
    final isValid = password.length >= 8 && strength == 4 && password == confirm && !_isLoading;

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
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
              // Centered Shield Brand Icon Badge (Standardized 76x76)
              Center(
                child: Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF7EE),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFC6F0DB)),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.verified_user_rounded,
                      size: 36,
                      color: kTournamentEmerald,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Title & Subtitle (Centralized)
              Center(
                child: Column(
                  children: const [
                    Text(
                      'Set New Password',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: kTextDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Create a strong password to secure your tournament player account. Your new password must be different from previous ones.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13.5,
                        color: kTextMuted,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Error banner if any
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Field 1: Password (Exact reference design match)
              const Text(
                'Password',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: kTextDark,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: kGreenInputBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kGreenInputBorder, width: 1.2),
                ),
                child: TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textAlignVertical: TextAlignVertical.center,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: kTextDark),
                  decoration: InputDecoration(
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: InputBorder.none,
                    hintText: '••••••••••••',
                    hintStyle: const TextStyle(color: Color(0xFF8CA0BA), fontSize: 13.5),
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _obscurePassword = !_obscurePassword),
                      child: Icon(
                        _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        size: 18,
                        color: const Color(0xFF8CA0BA),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // 4-Segment Strength Indicator (Exact Screenshot Match)
              Row(
                children: [
                  Expanded(
                    child: Row(
                      children: List.generate(4, (index) {
                        final isFilled = index < strength;
                        return Expanded(
                          child: Container(
                            height: 3.5,
                            margin: EdgeInsets.only(right: index < 3 ? 4 : 0),
                            decoration: BoxDecoration(
                              color: isFilled ? kTournamentEmerald : const Color(0xFFE2E8F0),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    strength == 4 ? 'STRONG PASSWORD' : 'MIN. 8 CHARACTERS',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      color: strength == 4 ? kTournamentEmerald : kTextMuted,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),

              // Amber Warning Card (Exact Screenshot Match)
              if (password.isNotEmpty && strength < 4) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.warning_amber_rounded, size: 18, color: Color(0xFFD97706)),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Password meter is not full.\nAdd uppercase, number & symbol to proceed.',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF92400E),
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 18),

              // Field 2: Confirm Password
              const Text(
                'Confirm Password',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: kTextDark,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: kGreenInputBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kGreenInputBorder, width: 1.2),
                ),
                child: TextField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirm,
                  textAlignVertical: TextAlignVertical.center,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: kTextDark),
                  decoration: InputDecoration(
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: InputBorder.none,
                    hintText: '••••••••••••',
                    hintStyle: const TextStyle(color: Color(0xFF8CA0BA), fontSize: 13.5),
                    suffixIcon: confirm.isNotEmpty && confirm == password && strength == 4
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: Icon(Icons.check_circle_rounded, color: kTournamentEmerald, size: 20),
                          )
                        : GestureDetector(
                            onTap: () => setState(() => _obscureConfirm = !_obscureConfirm),
                            child: Icon(
                              _obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                              size: 18,
                              color: const Color(0xFF8CA0BA),
                            ),
                          ),
                  ),
                ),
              ),

              const SizedBox(height: 28),

              // Primary Action Button: "Update Password & Login"
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: isValid ? _handleUpdatePassword : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kTournamentEmerald,
                    disabledBackgroundColor: kTournamentEmerald.withOpacity(0.35),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Update Password & Login',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.white),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 20),

              // Return to login
              Center(
                child: GestureDetector(
                  onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
                  child: const Text(
                    'Back to Login',
                    style: TextStyle(
                      color: kTournamentEmerald,
                      fontWeight: FontWeight.bold,
                      fontSize: 13.5,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
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
