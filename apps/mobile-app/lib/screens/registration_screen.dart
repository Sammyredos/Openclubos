import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import 'verify_email_screen.dart';

class RegistrationScreen extends ConsumerStatefulWidget {
  const RegistrationScreen({super.key});

  @override
  ConsumerState<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends ConsumerState<RegistrationScreen> {
  int _currentStep = 1;

  // Form Controllers
  final _firstNameController = TextEditingController(text: 'Alex');
  final _lastNameController = TextEditingController(text: 'Wright');
  final _emailController = TextEditingController(text: 'player@domain.com');
  final _passwordController = TextEditingController(text: 'Password123!');
  final _confirmPasswordController = TextEditingController(text: 'Password123!');

  final _handicapController = TextEditingController(text: '2.4');
  final _homeClubController = TextEditingController(text: 'Oakwood Country Club');
  final _dobController = TextEditingController(text: '05 / 14 / 1994');

  final _phoneController = TextEditingController(text: '(706) 555-0192');
  final _cityController = TextEditingController(text: 'Augusta');
  final _stateController = TextEditingController(text: 'GA');

  // Interactive UI States
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _noHandicapIndex = false;
  String _selectedGender = 'MALE';
  bool _pushNotifications = true;
  bool _agreedToRules = true;
  bool _agreedToMarkerDuty = true;
  bool _isLoading = false;
  String? _errorMessage;

  // Custom Brand Colors
  static const Color kGreenInputBg = Color(0xFFF5FAF6);
  static const Color kGreenInputBorder = Color(0xFFE1EFE5);
  static const Color kTournamentEmerald = Color(0xFF009A60);
  static const Color kTextDark = Color(0xFF111827);
  static const Color kTextMuted = Color(0xFF64748B);

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _handicapController.dispose();
    _homeClubController.dispose();
    _dobController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    super.dispose();
  }

  // Password strength calculation (0 to 4)
  int _calculatePasswordStrength(String password) {
    if (password.isEmpty) return 0;
    int strength = 0;
    if (password.length >= 8) strength++;
    if (RegExp(r'[A-Z]').hasMatch(password) && RegExp(r'[a-z]').hasMatch(password)) strength++;
    if (RegExp(r'[0-9]').hasMatch(password)) strength++;
    if (RegExp(r'[!@#\$&*~%^+=]').hasMatch(password)) strength++;
    return strength;
  }

  void _nextStep() {
    setState(() {
      _errorMessage = null;
    });

    if (_currentStep == 1) {
      if (_firstNameController.text.trim().isEmpty || _lastNameController.text.trim().isEmpty) {
        setState(() => _errorMessage = 'Please enter your full first and last name.');
        return;
      }
      if (!_emailController.text.contains('@')) {
        setState(() => _errorMessage = 'Please provide a valid email address.');
        return;
      }
      if (_passwordController.text.length < 8) {
        setState(() => _errorMessage = 'Password must be at least 8 characters.');
        return;
      }
      if (_passwordController.text != _confirmPasswordController.text) {
        setState(() => _errorMessage = 'Passwords do not match.');
        return;
      }
    }

    if (_currentStep < 4) {
      setState(() {
        _currentStep++;
      });
    }
  }

  void _prevStep() {
    if (_currentStep > 1) {
      setState(() {
        _errorMessage = null;
        _currentStep--;
      });
    } else {
      Navigator.of(context).pop();
    }
  }

  Future<void> _handleCompleteRegistration() async {
    if (!_agreedToRules || !_agreedToMarkerDuty) {
      setState(() {
        _errorMessage = 'Please accept both rules and marker duty pledges to complete registration.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.registerPlayer({
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'name': '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
        'handicap': _noHandicapIndex ? 36.0 : (double.tryParse(_handicapController.text) ?? 18.0),
        'gender': _selectedGender,
        'phone': _phoneController.text.trim(),
        'city': _cityController.text.trim(),
        'state': _stateController.text.trim(),
      });

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => VerifyEmailScreen(
              email: _emailController.text.trim(),
              playerName: '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
            ),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
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
                // Top Header Navigation & Progress Indicator
                _buildHeader(context),

                // Step Body
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_errorMessage != null) _buildErrorBanner(),
                        if (_currentStep == 1) _buildStep1(context),
                        if (_currentStep == 2) _buildStep2(context),
                        if (_currentStep == 3) _buildStep3(context),
                        if (_currentStep == 4) _buildStep4(context),
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

  // --- Top Navigation & Segmented Progress Bar ---
  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Circular Back Arrow
              GestureDetector(
                onTap: _prevStep,
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

              // Pill Badge: "STEP X OF 4"
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: kGreenInputBg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: kGreenInputBorder, width: 1),
                ),
                child: Text(
                  'STEP $_currentStep OF 4',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: kTournamentEmerald,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 4-Segment Progress Bar
          Row(
            children: List.generate(4, (index) {
              final stepNumber = index + 1;
              final isCompleted = stepNumber <= _currentStep;
              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index < 3 ? 6 : 0),
                  decoration: BoxDecoration(
                    color: isCompleted ? kTournamentEmerald : const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
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
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _errorMessage!,
              style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), height: 1.3),
            ),
          ),
        ],
      ),
    );
  }

  // --- STEP 1: CREATE PLAYER ACCOUNT ---
  Widget _buildStep1(BuildContext context) {
    final strength = _calculatePasswordStrength(_passwordController.text);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Create Player Account',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Enter your personal credentials to compete in verified club tournaments.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 18),

        // Google Sign-up Button
        OutlinedButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Google Sign-up configured for tournament players.')),
            );
          },
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 46),
            backgroundColor: Colors.white,
            side: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildGoogleLogo(),
              const SizedBox(width: 10),
              const Text(
                'Sign up with Google',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Divider
        Row(
          children: const [
            Expanded(child: Divider(color: Color(0xFFE5E7EB))),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'OR REGISTER WITH EMAIL',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.8,
                ),
              ),
            ),
            Expanded(child: Divider(color: Color(0xFFE5E7EB))),
          ],
        ),
        const SizedBox(height: 18),

        // First Name & Last Name Row
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('FIRST NAME'),
                  _buildGreenTextField(
                    controller: _firstNameController,
                    hintText: 'Alex',
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('LAST NAME'),
                  _buildGreenTextField(
                    controller: _lastNameController,
                    hintText: 'Wright',
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Email Address
        _buildLabel('EMAIL ADDRESS'),
        _buildGreenTextField(
          controller: _emailController,
          hintText: 'player@domain.com',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 14),

        // Password
        _buildLabel('PASSWORD'),
        _buildGreenTextField(
          controller: _passwordController,
          hintText: '••••••••••••',
          obscureText: _obscurePassword,
          onChanged: (_) => setState(() {}),
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              size: 18,
              color: const Color(0xFF94A3B8),
            ),
            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
          ),
        ),
        const SizedBox(height: 6),

        // Password Strength Indicator Bar
        Row(
          children: [
            Expanded(
              child: Row(
                children: List.generate(4, (index) {
                  final filled = index < strength;
                  return Expanded(
                    child: Container(
                      height: 3.5,
                      margin: EdgeInsets.only(right: index < 3 ? 4 : 0),
                      decoration: BoxDecoration(
                        color: filled ? kTournamentEmerald : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'MIN. 8 CHARACTERS',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64748B),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Confirm Password
        _buildLabel('CONFIRM PASSWORD'),
        _buildGreenTextField(
          controller: _confirmPasswordController,
          hintText: '••••••••••••',
          obscureText: _obscureConfirm,
          onChanged: (_) => setState(() {}),
          suffixIcon: _confirmPasswordController.text.isNotEmpty &&
                  _confirmPasswordController.text == _passwordController.text
              ? const Padding(
                  padding: EdgeInsets.all(12),
                  child: Icon(Icons.check_circle_rounded, color: kTournamentEmerald, size: 20),
                )
              : IconButton(
                  icon: Icon(
                    _obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    size: 18,
                    color: const Color(0xFF94A3B8),
                  ),
                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
        ),
        const SizedBox(height: 24),

        // CTA Button
        _buildPrimaryButton(
          label: 'Continue to Golf Profile →',
          onPressed: _nextStep,
        ),
        const SizedBox(height: 16),

        // Sign In Link
        Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Already registered? ',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              GestureDetector(
                onTap: () => Navigator.of(context).pushReplacementNamed('/login'),
                child: const Text(
                  'Sign In',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: kTournamentEmerald,
                    decoration: TextDecoration.underline,
                    decorationColor: kTournamentEmerald,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // --- STEP 2: YOUR GOLF PROFILE ---
  Widget _buildStep2(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Your Golf Profile',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Used by tournament committees to calculate course handicaps and flight brackets.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 20),

        // Official Handicap Index
        _buildLabel('OFFICIAL HANDICAP INDEX'),
        _buildGreenTextField(
          controller: _handicapController,
          hintText: 'e.g. 2.4',
          enabled: !_noHandicapIndex,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          suffixIcon: Container(
            margin: const EdgeInsets.only(right: 12),
            alignment: Alignment.centerRight,
            width: 44,
            child: const Text(
              'GHIN',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: kTournamentEmerald,
                letterSpacing: 1.0,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),

        // Checkbox: No Official Index
        GestureDetector(
          onTap: () {
            setState(() {
              _noHandicapIndex = !_noHandicapIndex;
              if (_noHandicapIndex) {
                _handicapController.text = '36.0';
              } else {
                _handicapController.text = '2.4';
              }
            });
          },
          child: Row(
            children: [
              _buildCustomCheckbox(_noHandicapIndex),
              const SizedBox(width: 8),
              const Text(
                "I don't have an official index yet",
                style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Home Golf Club
        _buildLabel('HOME GOLF CLUB'),
        _buildGreenTextField(
          controller: _homeClubController,
          hintText: 'Oakwood Country Club',
          prefixIcon: const Icon(Icons.location_on_rounded, color: Color(0xFF64748B), size: 18),
          suffixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 18),
        ),
        const SizedBox(height: 18),

        // Gender / Competition Flight Segmented Control
        _buildLabel('GENDER / COMPETITION FLIGHT'),
        Container(
          height: 44,
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: kGreenInputBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kGreenInputBorder, width: 1.2),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedGender = 'MALE'),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _selectedGender == 'MALE' ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(9),
                      boxShadow: _selectedGender == 'MALE'
                          ? [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'MALE',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _selectedGender == 'MALE' ? kTournamentEmerald : const Color(0xFF64748B),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedGender = 'FEMALE'),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _selectedGender == 'FEMALE' ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(9),
                      boxShadow: _selectedGender == 'FEMALE'
                          ? [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'FEMALE',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _selectedGender == 'FEMALE' ? kTournamentEmerald : const Color(0xFF64748B),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Date of Birth
        _buildLabel('DATE OF BIRTH'),
        _buildGreenTextField(
          controller: _dobController,
          hintText: 'MM / DD / YYYY',
          keyboardType: TextInputType.datetime,
          suffixIcon: const Icon(Icons.calendar_today_rounded, color: Color(0xFF94A3B8), size: 18),
        ),
        const SizedBox(height: 4),
        const Text(
          'For Junior / Senior bracket eligibility verification.',
          style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 20),

        // Verification Notice Box
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kGreenInputBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kGreenInputBorder, width: 1),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.verified_user_outlined, color: Color(0xFF64748B), size: 18),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Handicap indexes are verified against the national golf registry (GHIN/USGA) before tournament play begins.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF475569), height: 1.35),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Navigation Buttons Row
        _buildBottomNavButtons(
          nextLabel: 'Continue to Contact →',
          onNext: _nextStep,
        ),
      ],
    );
  }

  // --- STEP 3: PLAYER CONTACT & AVATAR ---
  Widget _buildStep3(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Player Contact & Avatar',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Used for live on-course tee time notifications and official pairing scorecards.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 18),

        // Circular Avatar Upload Container
        Center(
          child: Column(
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: kGreenInputBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: kGreenInputBorder, width: 2),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.camera_alt_rounded, color: kTournamentEmerald, size: 26),
                    SizedBox(height: 4),
                    Text(
                      'PHOTO',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: kTournamentEmerald,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Avatar picker opened: Choose profile photo.')),
                  );
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(140, 36),
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text(
                  'Upload Player Photo',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'High-contrast headshot used on the live clubhouse leaderboard.',
                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Mobile Phone Number
        _buildLabel('MOBILE PHONE NUMBER'),
        Row(
          children: [
            // US Country Code Selector
            Container(
              height: 46,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: kGreenInputBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kGreenInputBorder, width: 1.2),
              ),
              child: Row(
                children: const [
                  Text(
                    'US  +1',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
                  ),
                  SizedBox(width: 4),
                  Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Color(0xFF64748B)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            // Phone Text Input
            Expanded(
              child: _buildGreenTextField(
                controller: _phoneController,
                hintText: '(555) 000-0000',
                keyboardType: TextInputType.phone,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'Used for emergency shotgun and weather sirens.',
          style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 18),

        // City & State Row
        Row(
          children: [
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('CITY'),
                  _buildGreenTextField(
                    controller: _cityController,
                    hintText: 'Augusta',
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 1,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('STATE'),
                  _buildGreenTextField(
                    controller: _stateController,
                    hintText: 'GA',
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Push Notifications Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: kGreenInputBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: kGreenInputBorder, width: 1.2),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Push Notifications',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Instant Tee Time & Marker Pairing Alerts',
                    style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                ],
              ),
              Switch(
                value: _pushNotifications,
                activeColor: kTournamentEmerald,
                activeTrackColor: kTournamentEmerald.withOpacity(0.3),
                inactiveThumbColor: Colors.white,
                inactiveTrackColor: const Color(0xFFCBD5E1),
                onChanged: (val) => setState(() => _pushNotifications = val),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Navigation Buttons Row
        _buildBottomNavButtons(
          nextLabel: 'Review & Finish →',
          onNext: _nextStep,
        ),
      ],
    );
  }

  // --- STEP 4: REVIEW & COMPETITOR PLEDGE ---
  Widget _buildStep4(BuildContext context) {
    final fullName = '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}';
    final hcp = _noHandicapIndex ? '36.0 (Callaway)' : _handicapController.text;
    final club = _homeClubController.text.trim();
    final flight = _selectedGender == 'MALE' ? "Men's Championship Flight" : "Women's Championship Flight";
    final phone = _phoneController.text.trim();
    final location = '${_cityController.text.trim()}, ${_stateController.text.trim()}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Review & Competitor Pledge',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Verify your tournament credentials and confirm rules compliance before activation.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 20),

        // Summary Profile Card
        _buildLabel('SUMMARY PROFILE CARD'),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 6,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Golfer Avatar
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: kGreenInputBg,
                    child: const Icon(Icons.person_rounded, color: kTournamentEmerald, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          fullName.isEmpty ? 'Alex Wright' : fullName,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: kGreenInputBg,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: kGreenInputBorder),
                          ),
                          child: Text(
                            'HCP Index $hcp • $club • $flight',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: kTournamentEmerald,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(color: Color(0xFFF1F5F9), thickness: 1),
              ),
              Text(
                '${_emailController.text} • +1 $phone • $location',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF475569),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Rules & Attestation Pledge Box
        _buildLabel('RULES & ATTESTATION PLEDGE BOX'),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: kGreenInputBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFBBF7D0), width: 1.2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(Icons.verified_rounded, color: kTournamentEmerald, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Official Competitor Attestation Pledge',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF166534),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Pledge 1
              GestureDetector(
                onTap: () => setState(() => _agreedToRules = !_agreedToRules),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildCustomCheckbox(_agreedToRules),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'I agree to abide by the USGA & R&A Rules of Golf and Tournament Committee local rules.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF1E293B), height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Pledge 2
              GestureDetector(
                onTap: () => setState(() => _agreedToMarkerDuty = !_agreedToMarkerDuty),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildCustomCheckbox(_agreedToMarkerDuty),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'I agree to act as an official score marker for fellow competitors under USGA Rule 3.3b.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF1E293B), height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Bottom Nav Buttons
        _buildBottomNavButtons(
          nextLabel: 'Complete Registration →',
          onNext: _handleCompleteRegistration,
          isLoading: _isLoading,
        ),
      ],
    );
  }

  // --- Helper Widget Builders ---
  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Color(0xFF1F2937),
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildGreenTextField({
    required TextEditingController controller,
    required String hintText,
    bool obscureText = false,
    bool enabled = true,
    TextInputType? keyboardType,
    Widget? prefixIcon,
    Widget? suffixIcon,
    ValueChanged<String>? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: enabled ? kGreenInputBg : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kGreenInputBorder, width: 1.2),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        enabled: enabled,
        keyboardType: keyboardType,
        onChanged: onChanged,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: Color(0xFF1E293B),
        ),
        decoration: InputDecoration(
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          border: InputBorder.none,
          hintText: hintText,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          prefixIcon: prefixIcon,
          suffixIcon: suffixIcon,
        ),
      ),
    );
  }

  Widget _buildCustomCheckbox(bool checked) {
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: checked ? kTournamentEmerald : kGreenInputBg,
        borderRadius: BorderRadius.circular(5),
        border: Border.all(
          color: checked ? kTournamentEmerald : kGreenInputBorder,
          width: 1.5,
        ),
      ),
      child: checked
          ? const Icon(Icons.check, size: 14, color: Colors.white)
          : null,
    );
  }

  Widget _buildPrimaryButton({
    required String label,
    required VoidCallback? onPressed,
    bool isLoading = false,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: kTournamentEmerald,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : Text(
                label,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
              ),
      ),
    );
  }

  Widget _buildBottomNavButtons({
    required String nextLabel,
    required VoidCallback onNext,
    bool isLoading = false,
  }) {
    return Row(
      children: [
        // Outlined Back Button
        SizedBox(
          width: 100,
          height: 48,
          child: OutlinedButton(
            onPressed: _prevStep,
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text(
              'Back',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF374151),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Primary Next / Finish Button
        Expanded(
          child: _buildPrimaryButton(
            label: nextLabel,
            onPressed: onNext,
            isLoading: isLoading,
          ),
        ),
      ],
    );
  }

  Widget _buildGoogleLogo() {
    return SizedBox(
      width: 18,
      height: 18,
      child: CustomPaint(painter: _GoogleIconPainter()),
    );
  }
}

class _GoogleIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    const strokeWidth = 3.5;

    final paintRed = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintYellow = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintGreen = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintBlue = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final rect = Rect.fromCircle(center: center, radius: size.width / 2.2);

    canvas.drawArc(rect, 3.14 * 0.75, 3.14 * 0.5, false, paintRed);
    canvas.drawArc(rect, 3.14 * 0.25, 3.14 * 0.5, false, paintYellow);
    canvas.drawArc(rect, -3.14 * 0.25, 3.14 * 0.5, false, paintGreen);
    canvas.drawArc(rect, -3.14 * 0.75, 3.14 * 0.5, false, paintBlue);

    final paintBlueFill = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;

    canvas.drawRect(
      Rect.fromLTWH(center.dx - 1, center.dy - 1.8, size.width / 2.1, 3.6),
      paintBlueFill,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
