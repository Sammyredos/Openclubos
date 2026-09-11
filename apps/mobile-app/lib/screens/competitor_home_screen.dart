import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../core/api/api_client.dart';
import '../features/tournaments/screens/leaderboard_screen.dart';

class CompetitorHomeScreen extends StatefulWidget {
  const CompetitorHomeScreen({super.key});

  @override
  State<CompetitorHomeScreen> createState() => _CompetitorHomeScreenState();
}

class _CompetitorHomeScreenState extends State<CompetitorHomeScreen> {
  final ApiClient _apiClient = ApiClient();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  Map<String, dynamic>? _user;
  List<dynamic> _tournaments = [];
  bool _isLoadingTournaments = true;
  int _selectedTournamentIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchTournaments();
  }

  Future<void> _loadUserData() async {
    final box = await Hive.openBox('auth');
    final storedUser = box.get('user');
    if (storedUser != null) {
      setState(() {
        _user = Map<String, dynamic>.from(storedUser);
      });
    }
  }

  Future<void> _fetchTournaments() async {
    try {
      final response = await _apiClient.dio.get('/tournaments');
      if (mounted) {
        setState(() {
          _tournaments = response.data;
          _isLoadingTournaments = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingTournaments = false;
          // Fallback realistic tournaments for preview
          _tournaments = [
            {
              'id': 'tourn_masters_2026',
              'name': 'Openclub Masters Invitational 2026',
              'status': 'LIVE',
              'course': 'Augusta National Golf Club',
              'city': 'Augusta, GA',
              'organizerClub': 'Augusta National GC',
              'format': 'Stroke Play',
              'dates': 'Sep 2 - Sep 5',
              'purse': '\$2,500,000',
              'fieldCount': 72,
              'cutLine': '+3',
              'entryFee': '\$350',
            },
            {
              'id': 'tourn_autumn_2026',
              'name': 'Autumn Club Championship',
              'status': 'UPCOMING',
              'course': 'Pinehurst No. 2',
              'city': 'Pinehurst, NC',
              'organizerClub': 'Pinehurst Resort',
              'format': 'Stableford',
              'dates': 'Sep 12 - Sep 14',
              'purse': '\$500,000',
              'fieldCount': 48,
              'cutLine': 'None',
              'entryFee': '\$150',
            },
          ];
        });
      }
    }
  }

  void _showAddFriendsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF7EE),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.person_add_rounded,
                        color: Color(0xFF009A60),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Add Golf Friends',
                            style: GoogleFonts.dmSans(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Connect with competitors and peer markers',
                            style: GoogleFonts.dmSans(
                              fontSize: 12.5,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          style: GoogleFonts.dmSans(fontSize: 13, color: const Color(0xFF0F172A)),
                          decoration: InputDecoration(
                            hintText: 'Search by Player Name, GHIN, or Club...',
                            hintStyle: GoogleFonts.dmSans(
                              fontSize: 12.5,
                              color: const Color(0xFF94A3B8),
                            ),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'RECENT CLUB PLAYERS',
                  style: GoogleFonts.dmSans(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.8,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 8),
                _buildFriendCandidate('Marcus Thorne', 'GHIN #92811 • Augusta GC', '1.2'),
                _buildFriendCandidate('David O\'Connor', 'GHIN #44102 • Pine Valley', '4.8'),
                _buildFriendCandidate('Elena Rostova', 'GHIN #11849 • Cypress Point', '0.4'),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          backgroundColor: Color(0xFF009A60),
                          content: Text('Friend invitation sent successfully!'),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF009A60),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Invite via Link or QR',
                      style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w600),
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

  Widget _buildFriendCandidate(String name, String meta, String hcp) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          CircleAvatar(
            radius: 17,
            backgroundColor: const Color(0xFF009A60).withOpacity(0.1),
            child: Text(
              name.split(' ').map((n) => n[0]).take(2).join(),
              style: GoogleFonts.dmSans(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF009A60),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                Text(
                  meta,
                  style: GoogleFonts.dmSans(
                    fontSize: 11.5,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '$hcp HCP',
              style: GoogleFonts.dmSans(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF334155),
              ),
            ),
          ),
          const SizedBox(width: 6),
          IconButton(
            icon: const Icon(Icons.person_add_alt_1_rounded, size: 18, color: Color(0xFF009A60)),
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: const Color(0xFF009A60),
                  content: Text('Invite sent to $name'),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showNotificationsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF7EE),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.notifications_active_rounded,
                        color: Color(0xFF009A60),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Notifications & Alerts',
                            style: GoogleFonts.dmSans(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Official tournament tee-times and attestations',
                            style: GoogleFonts.dmSans(fontSize: 12, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildNotificationTile(
                  icon: Icons.golf_course_rounded,
                  title: 'Tee Time Confirmed: 08:40 AM',
                  desc: 'Hole 1 • Group 4 • Augusta National Masters',
                  time: '12m ago',
                  unread: true,
                ),
                _buildNotificationTile(
                  icon: Icons.verified_user_rounded,
                  title: 'Scorecard Attestation Request',
                  desc: 'Marcus Thorne requested marker score verification for Round 1',
                  time: '1h ago',
                  unread: true,
                ),
                _buildNotificationTile(
                  icon: Icons.emoji_events_rounded,
                  title: 'Cut Line Movement: +3',
                  desc: 'Projected cut settled at +3 after morning flight finishes',
                  time: '3h ago',
                  unread: false,
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Close',
                      style: GoogleFonts.dmSans(color: const Color(0xFF475569), fontWeight: FontWeight.w600),
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

  Widget _buildNotificationTile({
    required IconData icon,
    required String title,
    required String desc,
    required String time,
    required bool unread,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: unread ? const Color(0xFFF0FDF4) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: unread ? const Color(0xFFC6F0DB) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFF009A60), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.dmSans(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: GoogleFonts.dmSans(fontSize: 11, color: const Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Text(
            time,
            style: GoogleFonts.dmSans(fontSize: 10, color: const Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  void _showMessagesModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF7EE),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.send_rounded,
                        color: Color(0xFF009A60),
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Player Messaging',
                            style: GoogleFonts.dmSans(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Chat with group members & tournament staff',
                            style: GoogleFonts.dmSans(fontSize: 12, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildMessageConversation(
                  sender: 'Tournament Committee',
                  preview: 'Weather advisory: Tee times delayed by 15 mins due to morning mist.',
                  time: '07:15 AM',
                ),
                _buildMessageConversation(
                  sender: 'Marcus Thorne (Marker)',
                  preview: 'Hey Alex, ready at the 1st tee box whenever you arrive!',
                  time: 'Yesterday',
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF009A60),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text('Start New Chat', style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMessageConversation({
    required String sender,
    required String preview,
    required String time,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 15,
            backgroundColor: const Color(0xFF009A60).withOpacity(0.1),
            child: const Icon(Icons.chat_bubble_outline_rounded, size: 15, color: Color(0xFF009A60)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  sender,
                  style: GoogleFonts.dmSans(fontSize: 12.5, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
                ),
                const SizedBox(height: 2),
                Text(
                  preview,
                  style: GoogleFonts.dmSans(fontSize: 11.5, color: const Color(0xFF64748B)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(time, style: GoogleFonts.dmSans(fontSize: 10, color: const Color(0xFF94A3B8))),
        ],
      ),
    );
  }

  Future<void> _handleLogout() async {
    final box = await Hive.openBox('auth');
    await box.clear();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final fullName = (_user?['fullName'] ?? _user?['name'] ?? 
        ((_user?['firstName'] != null && _user?['lastName'] != null)
            ? '${_user!['firstName']} ${_user!['lastName']}'.trim()
            : (_user?['firstName'] ?? ''))).toString().trim();
    final displayName = fullName.isNotEmpty ? fullName : 'Tournament Player';
    final nameParts = displayName.trim().split(RegExp(r'\s+'));
    final initials = nameParts.length >= 2
        ? '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase()
        : (displayName.isNotEmpty ? displayName.substring(0, displayName.length.clamp(1, 2)).toUpperCase() : 'TP');
    final dynamic rawAvatar = _user?['avatar'] ?? _user?['photo'] ?? _user?['profilePicture'] ?? _user?['image'];
    final bool hasDisplayPicture = rawAvatar != null && 
        rawAvatar.toString().trim().isNotEmpty && 
        (rawAvatar.toString().startsWith('http') || 
         rawAvatar.toString().startsWith('assets/') || 
         rawAvatar.toString().startsWith('/'));
    final isPro = _user?['isPro'] == true || 
        _user?['classification']?.toString().toUpperCase() == 'PROFESSIONAL' || 
        _user?['category']?.toString().toUpperCase() == 'PRO';
    final rawClub = _user?['club'] is Map ? _user?['club']['name']?.toString() : _user?['club']?.toString();
    final clubName = (rawClub != null && !rawClub.toLowerCase().contains('openclub') && !rawClub.toLowerCase().contains('open club'))
        ? rawClub.trim()
        : (_user?['homeClub']?.toString() ?? '');
    final locationText = clubName.isNotEmpty
        ? clubName.toUpperCase()
        : (city.isNotEmpty && state.isNotEmpty)
            ? '$city, $state'.toUpperCase()
            : (city.isNotEmpty ? city.toUpperCase() : 'IKOYI GOLF CLUB');
    final handicapValue = _user?['handicap'] != null
        ? (_user!['handicap'] as num).toStringAsFixed(1)
        : (isPro ? '+2.4' : '36.0');

    final activeTournament = _tournaments.isNotEmpty
        ? _tournaments[_selectedTournamentIndex.clamp(0, _tournaments.length - 1)]
        : null;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF8FAFC), // Daylight mode clean background
      endDrawer: _buildMenuDrawer(),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: RefreshIndicator(
            color: const Color(0xFF009A60),
            backgroundColor: Colors.white,
            onRefresh: () async {
              await _loadUserData();
              await _fetchTournaments();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  // --- 1. TOP HERO BANNER & COMPETITOR PROFILE ---
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      // Course Background Image (Sagamu Golf Club, Ogun State, Africa)
                      SizedBox(
                        height: 325,
                        width: double.infinity,
                        child: Image.asset(
                          'assets/images/sagamu_golf_course.jpg',
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, err, stack) {
                            return Container(
                              color: const Color(0xFF194C38),
                              child: const Center(
                                child: Icon(Icons.golf_course_rounded, size: 64, color: Colors.white24),
                              ),
                            );
                          },
                        ),
                      ),

                      // Gradient Overlay: Pure protective dark contrast (NO white fog)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withOpacity(0.65),
                                Colors.black.withOpacity(0.30),
                                Colors.black.withOpacity(0.55),
                              ],
                              stops: const [0.0, 0.45, 1.0],
                            ),
                          ),
                        ),
                      ),

                      // Top Content: Header Action Icons & Competitor Profile (Avatar at top of welcome text)
                      SafeArea(
                        bottom: false,
                        child: Container(
                          height: 305,
                          padding: const EdgeInsets.fromLTRB(20, 6, 20, 18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // TOP ACTION BAR: 4 White Icons properly spaced at top right corner
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  // User Plus (Add Friends / Competitors)
                                  SizedBox(
                                    width: 32,
                                    height: 32,
                                    child: IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(
                                        Icons.person_add_alt_1_outlined,
                                        color: Colors.white,
                                        size: 21,
                                      ),
                                      onPressed: _showAddFriendsModal,
                                      tooltip: 'Add Friends',
                                    ),
                                  ),
                                  const SizedBox(width: 14),

                                  // Notification Bell with Red Badge Dot
                                  SizedBox(
                                    width: 32,
                                    height: 32,
                                    child: IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: Stack(
                                        clipBehavior: Clip.none,
                                        children: [
                                          const Icon(
                                            Icons.notifications_none_rounded,
                                            color: Colors.white,
                                            size: 21,
                                          ),
                                          Positioned(
                                            top: 0,
                                            right: 0,
                                            child: Container(
                                              width: 7,
                                              height: 7,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFEF4444),
                                                shape: BoxShape.circle,
                                                border: Border.all(
                                                  color: Colors.white,
                                                  width: 1.2,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      onPressed: _showNotificationsModal,
                                      tooltip: 'Notifications',
                                    ),
                                  ),
                                  const SizedBox(width: 14),

                                  // Paper Airplane / Send Icon (Messages)
                                  SizedBox(
                                    width: 32,
                                    height: 32,
                                    child: IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(
                                        Icons.send_outlined,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      onPressed: _showMessagesModal,
                                      tooltip: 'Messages',
                                    ),
                                  ),
                                  const SizedBox(width: 14),

                                  // Menu / Drawer Icon (Three Bars)
                                  SizedBox(
                                    width: 32,
                                    height: 32,
                                    child: IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(
                                        Icons.menu_rounded,
                                        color: Colors.white,
                                        size: 23,
                                      ),
                                      onPressed: () {
                                        _scaffoldKey.currentState?.openEndDrawer();
                                      },
                                      tooltip: 'Menu',
                                    ),
                                  ),
                                ],
                              ),

                              // COMPETITOR PROFILE BLOCK: Avatar positioned directly at the top of the welcome text
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // 1. Player Avatar at Top of Welcome Text with Green Verified Check Badge
                                  Stack(
                                    clipBehavior: Clip.none,
                                    children: [
                                      Container(
                                        width: 56,
                                        height: 56,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 2,
                                          ),
                                          gradient: const LinearGradient(
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                            colors: [Color(0xFF009A60), Color(0xFF0A5536)],
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.35),
                                              blurRadius: 8,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                        ),
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(28),
                                          child: hasDisplayPicture
                                              ? (rawAvatar.toString().startsWith('http')
                                                  ? Image.network(
                                                      rawAvatar.toString(),
                                                      fit: BoxFit.cover,
                                                      errorBuilder: (ctx, err, stack) => Center(
                                                        child: Text(
                                                          initials,
                                                          style: GoogleFonts.dmSans(
                                                            fontSize: 19,
                                                            fontWeight: FontWeight.w800,
                                                            color: Colors.white,
                                                            letterSpacing: 0.5,
                                                          ),
                                                        ),
                                                      ),
                                                    )
                                                  : Image.asset(
                                                      rawAvatar.toString(),
                                                      fit: BoxFit.cover,
                                                      errorBuilder: (ctx, err, stack) => Center(
                                                        child: Text(
                                                          initials,
                                                          style: GoogleFonts.dmSans(
                                                            fontSize: 19,
                                                            fontWeight: FontWeight.w800,
                                                            color: Colors.white,
                                                            letterSpacing: 0.5,
                                                          ),
                                                        ),
                                                      ),
                                                    ))
                                              : Center(
                                                  child: Text(
                                                    initials,
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 19,
                                                      fontWeight: FontWeight.w800,
                                                      color: Colors.white,
                                                      letterSpacing: 0.5,
                                                    ),
                                                  ),
                                                ),
                                        ),
                                      ),
                                      // Green Status Indicator Check Badge
                                      Positioned(
                                        bottom: -1,
                                        right: -1,
                                        child: Container(
                                          width: 18,
                                          height: 18,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF009A60),
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: Colors.white,
                                              width: 2,
                                            ),
                                          ),
                                          child: const Icon(
                                            Icons.check_rounded,
                                            color: Colors.white,
                                            size: 11,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 9),

                                  // 2. Sporty Welcome Eyebrow
                                  Text(
                                    'READY TO TEE OFF',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 1.2,
                                      color: Colors.white.withOpacity(0.95),
                                      shadows: [
                                        Shadow(
                                          color: Colors.black.withOpacity(0.6),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 3),

                                  // 3. Player Name with 'PRO.' prefix and full-width auto-scaling
                                  SizedBox(
                                    width: double.infinity,
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      alignment: Alignment.centerLeft,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        children: [
                                          if (isPro) ...[
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 6,
                                                vertical: 2,
                                              ),
                                              margin: const EdgeInsets.only(right: 6),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF009A60).withOpacity(0.35),
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(
                                                  color: const Color(0xFF34D399).withOpacity(0.55),
                                                  width: 1,
                                                ),
                                              ),
                                              child: Text(
                                                'PRO.',
                                                style: GoogleFonts.dmSans(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w800,
                                                  letterSpacing: 0.8,
                                                  color: const Color(0xFF6EE7B7),
                                                ),
                                              ),
                                            ),
                                          ],
                                          Text(
                                            displayName,
                                            style: GoogleFonts.dmSans(
                                              fontSize: 24,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: -0.4,
                                              color: Colors.white,
                                              shadows: [
                                                Shadow(
                                                  color: Colors.black.withOpacity(0.8),
                                                  blurRadius: 8,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ],
                                            ),
                                            maxLines: 1,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 9),

                                  // 4. Location Pill (Sagamu, Ogun)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.40),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: Colors.white.withOpacity(0.25),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.location_on_outlined,
                                          color: Colors.white,
                                          size: 12,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          locationText,
                                          style: GoogleFonts.dmSans(
                                            color: Colors.white,
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w600,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  // --- 2. DUAL FLOATING ACTION CARDS (REDUCED HEIGHT, EXPANDED UNBROKEN WIDTH, LIGHTER FONT) ---
                  Transform.translate(
                    offset: const Offset(0, -18),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      child: Row(
                        children: [
                          // Left Card: "Add friends" (Wider flex 7, reduced height 64px, unbroken text)
                          Expanded(
                            flex: 7,
                            child: GestureDetector(
                              onTap: _showAddFriendsModal,
                              child: Container(
                                height: 64,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.06),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 14),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.person_add_alt_1_outlined,
                                      color: Color(0xFF009A60),
                                      size: 22,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Add friends',
                                      style: GoogleFonts.dmSans(
                                        color: const Color(0xFF009A60),
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: -0.1,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(width: 10),

                          // Right Card: "36.0 HCP" (Flex 5, reduced height 64px, lighter font)
                          Expanded(
                            flex: 5,
                            child: Container(
                              height: 64,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.06),
                                    blurRadius: 16,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Text(
                                    handicapValue,
                                    style: GoogleFonts.dmSans(
                                      color: const Color(0xFF009A60),
                                      fontSize: 24,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: -0.6,
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    'HCP',
                                    style: GoogleFonts.dmSans(
                                      color: const Color(0xFF94A3B8),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 0.3,
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

                  // --- 3. TOURNAMENT HUB & LIVE ACTION SECTION (DAYLIGHT MODE) ---
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 0, 18, 30),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.home_outlined,
                                  color: Color(0xFF009A60),
                                  size: 17,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'HOME',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.8,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEAF7EE),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: const Color(0xFFC6F0DB),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 5,
                                    height: 5,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF009A60),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 4.5),
                                  Text(
                                    '${_tournaments.length} EVENTS',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF009A60),
                                      letterSpacing: 0.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        if (_isLoadingTournaments)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 40),
                              child: CircularProgressIndicator(color: Color(0xFF009A60)),
                            ),
                          )
                        else if (activeTournament != null) ...[
                          // Featured Live Tournament Card (Daylight)
                          _buildFeaturedTournamentCard(activeTournament),

                          const SizedBox(height: 12),

                          // Quick Actions Row
                          _buildQuickActionShortcuts(),

                          const SizedBox(height: 18),

                          // Secondary Tournaments Carousel
                          if (_tournaments.length > 1) ...[
                            Text(
                              'ALL ACTIVE SCHEDULE',
                              style: GoogleFonts.dmSans(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.6,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 102,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: _tournaments.length,
                                itemBuilder: (ctx, idx) {
                                  final t = _tournaments[idx];
                                  final isSelected = idx == _selectedTournamentIndex;
                                  return GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedTournamentIndex = idx;
                                      });
                                    },
                                    child: Container(
                                      width: 180,
                                      margin: const EdgeInsets.only(right: 10),
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(
                                          color: isSelected
                                              ? const Color(0xFF009A60)
                                              : const Color(0xFFE2E8F0),
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.04),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            t['organizerClub'] ?? 'Openclub Tour',
                                            style: GoogleFonts.dmSans(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF009A60),
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Text(
                                            t['name'] ?? 'Tournament',
                                            style: GoogleFonts.dmSans(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF0F172A),
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                t['dates'] ?? 'Sep 2026',
                                                style: GoogleFonts.dmSans(
                                                  fontSize: 9.5,
                                                  color: const Color(0xFF64748B),
                                                ),
                                              ),
                                              Text(
                                                t['purse'] ?? '',
                                                style: GoogleFonts.dmSans(
                                                  fontSize: 9.5,
                                                  fontWeight: FontWeight.w600,
                                                  color: const Color(0xFFD97706),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturedTournamentCard(Map<String, dynamic> tournament) {
    final isLive = tournament['status'] == 'LIVE';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isLive ? const Color(0xFF009A60).withOpacity(0.35) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Status Badge + Purse
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: isLive ? const Color(0xFFEAF7EE) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isLive ? const Color(0xFFC6F0DB) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    if (isLive) ...[
                      Container(
                        width: 5,
                        height: 5,
                        decoration: const BoxDecoration(
                          color: Color(0xFF009A60),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                    ],
                    Text(
                      isLive ? 'LIVE NOW' : (tournament['status'] ?? 'UPCOMING'),
                      style: GoogleFonts.dmSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.6,
                        color: isLive ? const Color(0xFF009A60) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              if (tournament['purse'] != null)
                Text(
                  tournament['purse'],
                  style: GoogleFonts.dmSans(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFD97706),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 10),

          // Tournament Name
          Text(
            tournament['name'] ?? 'Championship Invitational',
            style: GoogleFonts.dmSans(
              fontSize: 16.5,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 3),

          // Course & Location
          Row(
            children: [
              const Icon(Icons.flag_outlined, size: 13, color: Color(0xFF009A60)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${tournament['course'] ?? 'Championship Golf Course'} (${tournament['city'] ?? 'Augusta, GA'})',
                  style: GoogleFonts.dmSans(
                    fontSize: 11.5,
                    color: const Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Specs Grid (Clean Daylight)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSpecItem('FORMAT', tournament['format'] ?? 'Stroke Play'),
                _buildSpecItem('FIELD', '${tournament['fieldCount'] ?? 72} Players'),
                _buildSpecItem('CUT', tournament['cutLine'] ?? '+3'),
                _buildSpecItem('FEE', tournament['entryFee'] ?? '\$350'),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Action Buttons: Enter Scoring & Leaderboard
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/app/scoring');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF009A60),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'Enter Scoring',
                      style: GoogleFonts.dmSans(fontSize: 12.5, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (ctx) => LeaderboardScreen(
                            tournamentId: tournament['id']?.toString(),
                          ),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0F172A),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'Leaderboard',
                      style: GoogleFonts.dmSans(fontSize: 12.5, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSpecItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.dmSans(
            fontSize: 9,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.5,
            color: const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 1.5),
        Text(
          value,
          style: GoogleFonts.dmSans(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionShortcuts() {
    return Row(
      children: [
        Expanded(
          child: _buildShortcutTile(
            icon: Icons.qr_code_scanner_rounded,
            title: 'Attest Scorecard',
            subtitle: 'Marker verification',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Attestation scanner active. Ready to scan player QR code.'),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildShortcutTile(
            icon: Icons.history_rounded,
            title: 'Round History',
            subtitle: 'Past gross & net',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Loading your attested handicap history...'),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildShortcutTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF7EE),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: const Color(0xFF009A60), size: 17),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.dmSans(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.dmSans(
                      fontSize: 9.5,
                      color: const Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuDrawer() {
    final firstName = _user?['firstName'] ?? 'Samuel';
    final lastName = _user?['lastName'] ?? 'Obadina';
    final email = _user?['email'] ?? 'samuel.obadina@openclub.app';

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // User Header in Drawer
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: const Color(0xFF009A60),
                    child: Text(
                      '${firstName.isNotEmpty ? firstName[0] : 'S'}${lastName.isNotEmpty ? lastName[0] : 'O'}'.toUpperCase(),
                      style: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$firstName $lastName'.trim(),
                          style: GoogleFonts.dmSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          email,
                          style: GoogleFonts.dmSans(fontSize: 11.5, color: const Color(0xFF64748B)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: Color(0xFFE2E8F0)),

            // Navigation Items
            ListTile(
              leading: const Icon(Icons.person_outline_rounded, color: Color(0xFF009A60), size: 20),
              title: Text('My Competitor Profile', style: GoogleFonts.dmSans(fontSize: 13.5, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500)),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.shield_outlined, color: Color(0xFF009A60), size: 20),
              title: Text('GHIN & Handicap Index', style: GoogleFonts.dmSans(fontSize: 13.5, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500)),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.golf_course_rounded, color: Color(0xFF009A60), size: 20),
              title: Text('Home Club Directory', style: GoogleFonts.dmSans(fontSize: 13.5, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500)),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined, color: Color(0xFF009A60), size: 20),
              title: Text('Settings & Preferences', style: GoogleFonts.dmSans(fontSize: 13.5, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500)),
              onTap: () => Navigator.pop(context),
            ),

            const Spacer(),
            const Divider(color: Color(0xFFE2E8F0)),

            // Sign Out
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: Colors.roseAccent, size: 20),
              title: Text('Sign Out', style: GoogleFonts.dmSans(color: Colors.roseAccent, fontSize: 13.5, fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                _handleLogout();
              },
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}
