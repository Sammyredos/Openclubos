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
  final _homeClubController = TextEditingController(text: '');
  final _dobController = TextEditingController(text: '05 / 14 / 1994');

  final _phoneController = TextEditingController(text: '(706) 555-0192');
  final _cityController = TextEditingController(text: 'Augusta');
  final _stateController = TextEditingController(text: 'GA');
  final _scrollController = ScrollController();

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
  static const Color kGreenActiveBorder = Color(0xFFD1E7D8);
  static const Color kTournamentEmerald = Color(0xFF009A60);
  static const Color kTextDark = Color(0xFF111827);
  static const Color kTextLabel = Color(0xFF0F172A);
  static const Color kTextMuted = Color(0xFF5B6B7F);
  static const Color kTextHint = Color(0xFF8CA0BA);
  static const Color kPillBg = Color(0xFFEEF2F6);

  bool _showClubSuggestions = false;

  final List<Map<String, String>> _allGolfCourses = [
    {'name': 'Oakwood Country Club Course', 'location': 'Augusta, GA • 18 Holes'},
    {'name': 'Augusta National Golf Club', 'location': 'Augusta, GA • 18 Holes'},
    {'name': 'Pinehurst Resort No. 2', 'location': 'Pinehurst, NC • 18 Holes'},
    {'name': 'St Andrews Old Course', 'location': 'St Andrews, Fife • 18 Holes'},
    {'name': 'Pebble Beach Golf Links', 'location': 'Pebble Beach, CA • 18 Holes'},
    {'name': 'OpenClub Golf Club 2 Course', 'location': 'City 2 • 18 Holes'},
    {'name': 'OpenClub Golf Club 3 Course', 'location': 'City 3 • 18 Holes'},
    {'name': 'OpenClub Golf Club 4 Course', 'location': 'City 4 • 18 Holes'},
    {'name': 'OpenClub Golf Club 5 Course', 'location': 'City 5 • 18 Holes'},
    {'name': 'OpenClub Golf Club 6 Course', 'location': 'City 6 • 18 Holes'},
    {'name': 'OpenClub Golf Club 7 Course', 'location': 'City 7 • 18 Holes'},
    {'name': 'OpenClub Golf Club 8 Course', 'location': 'City 8 • 18 Holes'},
    {'name': 'OpenClub Golf Club 9 Course', 'location': 'City 9 • 18 Holes'},
    {'name': 'OpenClub Golf Club 10 Course', 'location': 'City 10 • 18 Holes'},
    {'name': 'OpenClub Golf Club 11 Course', 'location': 'City 11 • 18 Holes'},
    {'name': 'OpenClub Golf Club 12 Course', 'location': 'City 12 • 18 Holes'},
    {'name': 'OpenClub Golf Club 13 Course', 'location': 'City 13 • 18 Holes'},
    {'name': 'OpenClub Golf Club 14 Course', 'location': 'City 14 • 18 Holes'},
    {'name': 'OpenClub Golf Club 15 Course', 'location': 'City 15 • 18 Holes'},
    {'name': 'OpenClub Golf Club 16 Course', 'location': 'City 16 • 18 Holes'},
    {'name': 'OpenClub Golf Club 17 Course', 'location': 'City 17 • 18 Holes'},
    {'name': 'OpenClub Golf Club 18 Course', 'location': 'City 18 • 18 Holes'},
    {'name': 'OpenClub Golf Club 19 Course', 'location': 'City 19 • 18 Holes'},
    {'name': 'OpenClub Golf Club 20 Course', 'location': 'City 20 • 18 Holes'},
  ];

  // Reactive step completion validation getters
  bool get _isStep1Valid {
    final first = _firstNameController.text.trim();
    final last = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final pass = _passwordController.text;
    final confirm = _confirmPasswordController.text;
    return first.isNotEmpty &&
        last.isNotEmpty &&
        email.contains('@') &&
        email.contains('.') &&
        pass.length >= 8 &&
        pass == confirm;
  }

  bool get _isStep2Valid {
    final hcp = _handicapController.text.trim();
    final dob = _dobController.text.trim();
    return (_noHandicapIndex || (hcp.isNotEmpty && double.tryParse(hcp) != null)) &&
        _selectedGender.isNotEmpty &&
        dob.isNotEmpty;
  }

  bool get _isStep3Valid {
    final phone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    final city = _cityController.text.trim();
    final state = _stateController.text.trim();
    return phone.length >= 7 && city.isNotEmpty && state.isNotEmpty;
  }

  bool get _isStep4Valid {
    return _agreedToRules && _agreedToMarkerDuty;
  }

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
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0.0,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
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
      _scrollToTop();
    }
  }

  void _prevStep() {
    if (_currentStep > 1) {
      setState(() {
        _errorMessage = null;
        _currentStep--;
      });
      _scrollToTop();
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
                    controller: _scrollController,
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
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: kPillBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'STEP $_currentStep OF 4',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: kTextMuted,
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
            minimumSize: const Size(double.infinity, 48),
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
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF374151)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

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
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.8,
                ),
              ),
            ),
            Expanded(child: Divider(color: Color(0xFFE5E7EB))),
          ],
        ),
        const SizedBox(height: 24),

        // First Name & Last Name Row
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('First Name'),
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
                  _buildLabel('Last Name'),
                  _buildGreenTextField(
                    controller: _lastNameController,
                    hintText: 'Wright',
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),

        // Email Address
        _buildLabel('Email Address'),
        _buildGreenTextField(
          controller: _emailController,
          hintText: 'player@domain.com',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 22),

        // Password
        _buildLabel('Password'),
        _buildGreenTextField(
          controller: _passwordController,
          hintText: '••••••••••••',
          obscureText: _obscurePassword,
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
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),

        // Confirm Password
        _buildLabel('Confirm Password'),
        _buildGreenTextField(
          controller: _confirmPasswordController,
          hintText: '••••••••••••',
          obscureText: _obscureConfirm,
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
          onPressed: _isStep1Valid ? _nextStep : null,
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
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
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
        _buildLabel('Official Handicap Index'),
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
                fontWeight: FontWeight.w500,
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
        const SizedBox(height: 22),

        // Home Golf Club
        _buildLabel('Home Golf Club'),
        GestureDetector(
          onTap: () => _showClubPickerModal(context),
          child: AbsorbPointer(
            child: _buildGreenTextField(
              controller: _homeClubController,
              hintText: 'Select your home golf club...',
              prefixIcon: const Icon(Icons.location_on_rounded, color: Color(0xFF64748B), size: 18),
              suffixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 18),
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Tap to search or select from registered golf courses.',
          style: TextStyle(
            fontSize: 11,
            fontStyle: FontStyle.italic,
            color: Color(0xFF8CA0BA),
          ),
        ),
        const SizedBox(height: 22),

        // Gender Segmented Control
        _buildLabel('Gender'),
        Container(
          height: 48,
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
                      border: _selectedGender == 'MALE'
                          ? Border.all(color: kGreenActiveBorder, width: 1.2)
                          : Border.all(color: Colors.transparent, width: 1.2),
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
                      'Male',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: _selectedGender == 'MALE' ? kTournamentEmerald : const Color(0xFF64748B),
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
                      border: _selectedGender == 'FEMALE'
                          ? Border.all(color: kGreenActiveBorder, width: 1.2)
                          : Border.all(color: Colors.transparent, width: 1.2),
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
                      'Female',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: _selectedGender == 'FEMALE' ? kTournamentEmerald : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Date of Birth
        _buildLabel('Date of Birth'),
        GestureDetector(
          onTap: () => _openModernDobCalendar(context),
          child: AbsorbPointer(
            child: _buildGreenTextField(
              controller: _dobController,
              hintText: 'MM / DD / YYYY',
              keyboardType: TextInputType.datetime,
              suffixIcon: const Icon(Icons.calendar_today_rounded, color: Color(0xFF94A3B8), size: 18),
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'For Junior / Senior bracket eligibility verification.',
          style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 22),

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
          onNext: _isStep2Valid ? _nextStep : null,
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
                        fontWeight: FontWeight.w500,
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
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF374151)),
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
        _buildLabel('Mobile Phone Number'),
        Row(
          children: [
            // US Country Code Selector
            Container(
              height: 48,
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
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1E293B)),
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
        const SizedBox(height: 22),

        // City & State Row
        Row(
          children: [
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('City'),
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
                  _buildLabel('State'),
                  _buildGreenTextField(
                    controller: _stateController,
                    hintText: 'GA',
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),

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
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1E293B)),
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
          onNext: _isStep3Valid ? _nextStep : null,
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
        _buildLabel('Summary Profile Card'),
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
                            fontWeight: FontWeight.w500,
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
                            'HCP Index $hcp${club.isNotEmpty ? " • $club" : ""} • $flight',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
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
        const SizedBox(height: 22),

        // Rules & Attestation Pledge Box
        _buildLabel('Rules & Attestation Pledge'),
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
                      fontWeight: FontWeight.w500,
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
          onNext: _isStep4Valid ? _handleCompleteRegistration : null,
          isLoading: _isLoading,
        ),
      ],
    );
  }

  // --- Helper Widget Builders ---
  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Color(0xFF0F172A),
          letterSpacing: -0.2,
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
      height: 48,
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
        textAlignVertical: TextAlignVertical.center,
        onChanged: (val) {
          if (onChanged != null) onChanged(val);
          setState(() {});
        },
        style: const TextStyle(
          fontSize: 14,
          height: 1.2,
          fontWeight: FontWeight.w500,
          color: Color(0xFF0F172A),
        ),
        decoration: InputDecoration(
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: InputBorder.none,
          hintText: hintText,
          hintStyle: const TextStyle(color: kTextHint, fontSize: 13.5, height: 1.2, fontWeight: FontWeight.w500),
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
    final isEnabled = onPressed != null && !isLoading;
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: kTournamentEmerald,
          disabledBackgroundColor: kTournamentEmerald.withOpacity(0.35),
          foregroundColor: Colors.white,
          disabledForegroundColor: Colors.white.withOpacity(0.75),
          elevation: isEnabled ? 2 : 0,
          shadowColor: kTournamentEmerald.withOpacity(0.3),
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
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isEnabled ? Colors.white : Colors.white.withOpacity(0.75),
                ),
              ),
      ),
    );
  }

  Widget _buildBottomNavButtons({
    required String nextLabel,
    required VoidCallback? onNext,
    bool isLoading = false,
  }) {
    return Row(
      children: [
        // Outlined Back Button (Arrow only)
        SizedBox(
          width: 48,
          height: 48,
          child: OutlinedButton(
            onPressed: _prevStep,
            style: OutlinedButton.styleFrom(
              padding: EdgeInsets.zero,
              backgroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Icon(
              Icons.arrow_back_rounded,
              size: 20,
              color: Color(0xFF0F172A),
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

  void _showClubPickerModal(BuildContext context) {
    final searchController = TextEditingController(text: _homeClubController.text);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final query = searchController.text.trim().toLowerCase();
            final matches = _allGolfCourses.where((c) {
              if (query.isEmpty) return true;
              return c['name']!.toLowerCase().contains(query) ||
                  c['location']!.toLowerCase().contains(query);
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.78,
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'Select Home Golf Club',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Choose your registered course or location',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w400,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                          onPressed: () => Navigator.pop(ctx),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    // Search bar inside modal
                    Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kGreenInputBorder),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          const Icon(Icons.location_on_rounded, color: kTournamentEmerald, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: searchController,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF0F172A),
                              ),
                              decoration: const InputDecoration(
                                hintText: 'Search golf club or location...',
                                hintStyle: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF8CA0BA),
                                ),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                          if (searchController.text.isNotEmpty)
                            GestureDetector(
                              onTap: () {
                                searchController.clear();
                                setModalState(() {});
                              },
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFE2E8F0),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, size: 12, color: Color(0xFF475569)),
                              ),
                            )
                          else
                            const Icon(Icons.search_rounded, size: 18, color: Color(0xFF94A3B8)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: matches.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: kGreenInputBg,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: kGreenInputBorder),
                                      ),
                                      child: const Icon(Icons.location_off_rounded, size: 22, color: Color(0xFF8CA0BA)),
                                    ),
                                    const SizedBox(height: 10),
                                    const Text(
                                      'No golf clubs found',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'No registered courses matching "${searchController.text.trim()}".',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w400,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                    if (searchController.text.trim().isNotEmpty) ...[
                                      const SizedBox(height: 14),
                                      ElevatedButton(
                                        onPressed: () {
                                          setState(() {
                                            _homeClubController.text = searchController.text.trim();
                                          });
                                          Navigator.pop(ctx);
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: kTournamentEmerald,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                        ),
                                        child: Text(
                                          'Use "${searchController.text.trim()}" as Home Club',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            )
                          : ListView.separated(
                              itemCount: matches.length,
                              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              itemBuilder: (ctx, idx) {
                                final item = matches[idx];
                                final isSelected = _homeClubController.text == item['name'];
                                return InkWell(
                                  borderRadius: BorderRadius.circular(10),
                                  onTap: () {
                                    setState(() {
                                      _homeClubController.text = item['name']!;
                                    });
                                    Navigator.pop(ctx);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isSelected ? const Color(0xFFE8F5ED) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 32,
                                          height: 32,
                                          decoration: BoxDecoration(
                                            color: isSelected ? kTournamentEmerald : kGreenInputBg,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: isSelected ? kTournamentEmerald : kGreenInputBorder),
                                          ),
                                          child: Icon(
                                            Icons.location_on_rounded,
                                            size: 16,
                                            color: isSelected ? Colors.white : kTournamentEmerald,
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item['name']!,
                                                style: const TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                  color: Color(0xFF0F172A),
                                                ),
                                              ),
                                              Text(
                                                item['location']!,
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w400,
                                                  color: Color(0xFF64748B),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (isSelected)
                                          const Icon(Icons.check_rounded, size: 18, color: kTournamentEmerald),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                    if (_homeClubController.text.isNotEmpty) ...[
                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _homeClubController.clear();
                                });
                                Navigator.pop(ctx);
                              },
                              child: const Text(
                                'Clear Selection',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFFEF4444),
                                ),
                              ),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(ctx),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kTournamentEmerald,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              ),
                              child: const Text(
                                'Confirm',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _openModernDobCalendar(BuildContext context) {
    DateTime initial = DateTime(1994, 5, 14);
    final parts = _dobController.text.split('/');
    if (parts.length == 3) {
      final m = int.tryParse(parts[0].trim());
      final d = int.tryParse(parts[1].trim());
      final y = int.tryParse(parts[2].trim());
      if (m != null && d != null && y != null) {
        initial = DateTime(y, m, d);
      }
    }

    int viewYear = initial.year;
    int viewMonth = initial.month;
    DateTime? selected = initial;
    final now = DateTime.now();

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final daysInMonth = DateUtils.getDaysInMonth(viewYear, viewMonth);
            final firstWeekday = DateTime(viewYear, viewMonth, 1).weekday % 7;
            final cells = <int?>[];
            for (int i = 0; i < firstWeekday; i++) {
              cells.add(null);
            }
            for (int d = 1; d <= daysInMonth; d++) {
              cells.add(d);
            }

            final isFutureMonth = viewYear > now.year || (viewYear == now.year && viewMonth >= now.month);

            return Container(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Select Date of Birth',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                          onPressed: () => Navigator.pop(ctx),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kGreenInputBorder),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          InkWell(
                            onTap: () {
                              setModalState(() {
                                if (viewMonth == 1) {
                                  viewMonth = 12;
                                  viewYear--;
                                } else {
                                  viewMonth--;
                                }
                              });
                            },
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: kGreenInputBorder),
                              ),
                              child: const Icon(Icons.chevron_left_rounded, size: 22, color: Color(0xFF1E293B)),
                            ),
                          ),
                          Row(
                            children: [
                              Container(
                                height: 38,
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: kGreenInputBorder),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<int>(
                                    value: viewMonth,
                                    isDense: true,
                                    icon: const Icon(Icons.arrow_drop_down_rounded, size: 18, color: Color(0xFF64748B)),
                                    items: List.generate(12, (i) {
                                      return DropdownMenuItem(
                                        value: i + 1,
                                        child: Text(
                                          months[i],
                                          style: const TextStyle(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w500,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                      );
                                    }),
                                    onChanged: (v) {
                                      if (v != null) {
                                        setModalState(() => viewMonth = v);
                                      }
                                    },
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                height: 38,
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: kGreenInputBorder),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<int>(
                                    value: viewYear,
                                    isDense: true,
                                    icon: const Icon(Icons.arrow_drop_down_rounded, size: 18, color: Color(0xFF64748B)),
                                    items: List.generate(100, (i) {
                                      final y = now.year - i;
                                      return DropdownMenuItem(
                                        value: y,
                                        child: Text(
                                          '$y',
                                          style: const TextStyle(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w500,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                      );
                                    }),
                                    onChanged: (v) {
                                      if (v != null) {
                                        setModalState(() => viewYear = v);
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: isFutureMonth
                                ? null
                                : () {
                                    setModalState(() {
                                      if (viewMonth == 12) {
                                        viewMonth = 1;
                                        viewYear++;
                                      } else {
                                        viewMonth++;
                                      }
                                    });
                                  },
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: kGreenInputBorder),
                              ),
                              child: Icon(
                                Icons.chevron_right_rounded,
                                size: 22,
                                color: isFutureMonth ? const Color(0xFFCBD5E1) : const Color(0xFF1E293B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: const ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) {
                        return Expanded(
                          child: Center(
                            child: Text(
                              w,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 8),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 7,
                        mainAxisSpacing: 4,
                        crossAxisSpacing: 4,
                        childAspectRatio: 1.15,
                      ),
                      itemCount: cells.length,
                      itemBuilder: (ctx, idx) {
                        final day = cells[idx];
                        if (day == null) return const SizedBox.shrink();

                        final cellDate = DateTime(viewYear, viewMonth, day);
                        final isFuture = cellDate.isAfter(now);
                        final isSelected = selected != null &&
                            selected!.year == viewYear &&
                            selected!.month == viewMonth &&
                            selected!.day == day;

                        return GestureDetector(
                          onTap: isFuture
                              ? null
                              : () {
                                  setModalState(() {
                                    selected = cellDate;
                                  });
                                },
                          child: Container(
                            decoration: BoxDecoration(
                              color: isSelected ? kTournamentEmerald : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '$day',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: isFuture
                                    ? const Color(0xFFCBD5E1)
                                    : isSelected
                                        ? Colors.white
                                        : const Color(0xFF1E293B),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildPrimaryButton(
                      label: selected != null
                          ? 'Confirm: ${months[selected!.month - 1]} ${selected!.day}, ${selected!.year}'
                          : 'Select Date',
                      onPressed: selected != null
                          ? () {
                              final formatted =
                                  '${selected!.month.toString().padLeft(2, '0')} / ${selected!.day.toString().padLeft(2, '0')} / ${selected!.year}';
                              setState(() {
                                _dobController.text = formatted;
                              });
                              Navigator.pop(ctx);
                            }
                          : null,
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
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
