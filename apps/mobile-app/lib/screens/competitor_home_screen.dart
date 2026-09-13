import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../core/api/api_client.dart';

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

  // Live competitors on course for horizontal carousel
  List<Map<String, dynamic>> _friendsOnCourse = [
    {'id': 'f1', 'name': 'Sarah Jenkins', 'initials': 'SJ', 'score': 'Hole 14 • Even'},
    {'id': 'f2', 'name': 'David Miller', 'initials': 'DM', 'score': 'Hole 9 • +2'},
    {'id': 'f3', 'name': 'Marcus Chen', 'initials': 'MC', 'score': 'Hole 18 • -1'},
    {'id': 'f4', 'name': 'Kevin Brown', 'initials': 'KB', 'score': 'Hole 7 • +3'},
    {'id': 'f5', 'name': 'Alex Wright', 'initials': 'AW', 'score': 'Hole 11 • -2'},
    {'id': 'f6', 'name': 'Sophie Van Der Merwe', 'initials': 'SV', 'score': 'Hole 5 • Even'},
    {'id': 'f7', 'name': 'Amina Bello', 'initials': 'AB', 'score': 'Hole 16 • +1'},
    {'id': 'f8', 'name': 'Chidi Okafor', 'initials': 'CO', 'score': 'Hole 3 • -1'},
    {'id': 'f9', 'name': 'Liam Gallagher', 'initials': 'LG', 'score': 'Hole 8 • +4'},
  ];
  String _activeNavTab = 'home'; // Default to Home tab

  final ScrollController _featuredTournamentsScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchTournaments();
  }

  @override
  void dispose() {
    _featuredTournamentsScrollController.dispose();
    super.dispose();
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
              'id': 'tourn_ikoyi_open_2024',
              'name': 'Ikoyi Open Championship 2024',
              'status': 'REGISTRATION_OPEN',
              'isFeatured': true,
              'course': 'Ikoyi 1938 Championship Course',
              'city': 'Lagos, Nigeria',
              'organizerClub': 'Ikoyi Club 1938',
              'format': 'Stroke Play',
              'dates': 'Oct 14 - Oct 17',
              'purse': '₦15,000,000',
              'fieldCount': 120,
              'cutLine': '+4',
              'entryFee': 'Free',
            },
            {
              'id': 'tourn_masters_2026',
              'name': 'Openclub Masters Invitational 2026',
              'status': 'LIVE',
              'isFeatured': true,
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
              'isFeatured': true,
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

  static const List<Map<String, dynamic>> _candidateCompetitors = [
    {
      'id': 'c1',
      'name': 'Marcus Thorne',
      'email': 'marcus.thorne@golf.com',
      'club': 'Augusta GC',
      'hcp': '1.2',
      'initial': 'M',
    },
    {
      'id': 'c2',
      'name': 'David O\'Connor',
      'email': 'david.oconnor@golf.com',
      'club': 'Pine Valley',
      'hcp': '4.8',
      'initial': 'D',
    },
    {
      'id': 'c3',
      'name': 'Elena Rostova',
      'email': 'elena.rostova@cypress.org',
      'club': 'Cypress Point',
      'hcp': '0.4',
      'initial': 'E',
    },
    {
      'id': 'c4',
      'name': 'Samuel Obadina',
      'email': 'samuel.obadina@openclubos.com',
      'club': 'Oakwood Country Club',
      'hcp': '10.0',
      'initial': 'S',
    },
    {
      'id': 'c5',
      'name': 'Adedamola Bello',
      'email': 'damola.bello@ikoyiclub.ng',
      'club': 'Ikoyi Club 1938',
      'hcp': '7.4',
      'initial': 'A',
    },
    {
      'id': 'c6',
      'name': 'Kolawole Johnson',
      'email': 'kola.johnson@ibadanclub.com',
      'club': 'Ibadan Golf Club',
      'hcp': '12.1',
      'initial': 'K',
    },
    {
      'id': 'c7',
      'name': 'Chloe Sterling',
      'email': 'chloe.sterling@pebblebeach.com',
      'club': 'Pebble Beach GL',
      'hcp': '3.5',
      'initial': 'C',
    },
    {
      'id': 'c8',
      'name': 'Tunde Bakare',
      'email': 'tunde.bakare@smokin-hills.ng',
      'club': 'Smokin Hills Golf Resort',
      'hcp': '8.2',
      'initial': 'T',
    },
  ];

  void _showAddFriendsModal() {
    final Set<String> sentRequestIds = {};
    String searchQuery = '';
    final TextEditingController searchController = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      barrierColor: Colors.black.withOpacity(0.65),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final query = searchQuery.trim().toLowerCase();
          final filteredList = _candidateCompetitors.where((c) {
            if (query.isEmpty) return true;
            final name = (c['name'] as String).toLowerCase();
            final email = (c['email'] as String).toLowerCase();
            final club = (c['club'] as String).toLowerCase();
            return name.contains(query) || email.contains(query) || club.contains(query);
          }).toList();

          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(ctx).viewInsets.bottom + 28),
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
                    const SizedBox(height: 16),
                    // Header row with Icon badge, titles, and close button
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
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
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                'Connect with competitors and markers',
                                style: GoogleFonts.dmSans(
                                  fontSize: 12.5,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF1F5F9),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close_rounded,
                              size: 18,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Search by Name or Email (GHIN removed)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: searchController,
                              onChanged: (val) {
                                setModalState(() {
                                  searchQuery = val;
                                });
                              },
                              style: GoogleFonts.dmSans(fontSize: 13.5, color: const Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                hintText: 'Search by player name or email...',
                                hintStyle: GoogleFonts.dmSans(
                                  fontSize: 13,
                                  color: const Color(0xFF94A3B8),
                                ),
                                border: InputBorder.none,
                                isDense: true,
                              ),
                            ),
                          ),
                          if (searchQuery.isNotEmpty)
                            GestureDetector(
                              onTap: () {
                                setModalState(() {
                                  searchController.clear();
                                  searchQuery = '';
                                });
                              },
                              child: const Icon(Icons.cancel_rounded, size: 18, color: Color(0xFF94A3B8)),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      searchQuery.trim().isEmpty ? 'RECENT CLUB COMPETITORS' : 'MATCHING COMPETITORS (${filteredList.length})',
                      style: GoogleFonts.dmSans(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (filteredList.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: Text(
                            'No players found matching "$searchQuery"',
                            style: GoogleFonts.dmSans(fontSize: 13, color: const Color(0xFF94A3B8)),
                          ),
                        ),
                      )
                    else
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 220),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: filteredList.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final comp = filteredList[index];
                            final compId = comp['id'] as String;
                            final isSent = sentRequestIds.contains(compId);

                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: const Color(0xFFD1FAE5),
                                    child: Text(
                                      comp['initial'] as String,
                                      style: GoogleFonts.dmSans(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF009A60),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          comp['name'] as String,
                                          style: GoogleFonts.dmSans(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        Text(
                                          '${comp['club']} • ${comp['hcp']} HCP',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 11.5,
                                            color: const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      setModalState(() {
                                        if (isSent) {
                                          sentRequestIds.remove(compId);
                                        } else {
                                          sentRequestIds.add(compId);
                                        }
                                      });
                                    },
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                                      decoration: BoxDecoration(
                                        color: isSent ? const Color(0xFFE2E8F0) : const Color(0xFF009A60),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        isSent ? 'Sent ✓' : 'Add',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w700,
                                          color: isSent ? const Color(0xFF475569) : Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: const Color(0xFF009A60),
                              content: Text(
                                sentRequestIds.isEmpty
                                    ? 'Invitation link copied to clipboard!'
                                    : '${sentRequestIds.length} friend request(s) sent successfully!',
                              ),
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
                          'Share Invite Link or QR',
                          style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
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

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF8FAFC), // Daylight mode clean background
      endDrawer: _buildMenuDrawer(),
      bottomNavigationBar: _buildBottomNav(),
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
                          // Left Card: "Book a Pro" (Equal flex 1, height 66px, icon & description)
                          Expanded(
                            flex: 1,
                            child: GestureDetector(
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('PGA Certified Pro booking directory is active.'),
                                  ),
                                );
                              },
                              child: Container(
                                height: 66,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(26),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.06),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.center,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.calendar_month_rounded,
                                        color: Color(0xFF009A60),
                                        size: 20,
                                      ),
                                      const SizedBox(width: 7),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            'Book a Pro',
                                            style: GoogleFonts.dmSans(
                                              color: const Color(0xFF009A60),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: -0.2,
                                            ),
                                            maxLines: 1,
                                            softWrap: false,
                                          ),
                                          const SizedBox(height: 1),
                                          Text(
                                            'Book the club pro',
                                            style: GoogleFonts.dmSans(
                                              color: const Color(0xFF64748B),
                                              fontSize: 9,
                                              fontWeight: FontWeight.w500,
                                              letterSpacing: -0.2,
                                              height: 1.1,
                                            ),
                                            maxLines: 1,
                                            softWrap: false,
                                          ),
                                          Text(
                                            'for golfing sessions',
                                            style: GoogleFonts.dmSans(
                                              color: const Color(0xFF64748B),
                                              fontSize: 9,
                                              fontWeight: FontWeight.w500,
                                              letterSpacing: -0.2,
                                              height: 1.1,
                                            ),
                                            maxLines: 1,
                                            softWrap: false,
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(width: 10),

                          // Right Card: "HCP" (Equal flex 1, height 66px, matching Book a Pro icon & description)
                          Expanded(
                            flex: 1,
                            child: GestureDetector(
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Your verified handicap index is active.'),
                                  ),
                                );
                              },
                              child: Container(
                                height: 66,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(26),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.06),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.center,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.workspace_premium_rounded,
                                        color: Color(0xFF009A60),
                                        size: 20,
                                      ),
                                      const SizedBox(width: 7),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            '$handicapValue HCP',
                                            style: GoogleFonts.dmSans(
                                              color: const Color(0xFF009A60),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: -0.2,
                                            ),
                                            maxLines: 1,
                                            softWrap: false,
                                          ),
                                          const SizedBox(height: 1),
                                          Text(
                                            'Your verified',
                                            style: GoogleFonts.dmSans(
                                              color: const Color(0xFF64748B),
                                              fontSize: 9,
                                              fontWeight: FontWeight.w500,
                                              letterSpacing: -0.2,
                                              height: 1.1,
                                            ),
                                            maxLines: 1,
                                            softWrap: false,
                                          ),
                                          Text(
                                            'handicap index',
                                            style: GoogleFonts.dmSans(
                                              color: const Color(0xFF64748B),
                                              fontSize: 9,
                                              fontWeight: FontWeight.w500,
                                              letterSpacing: -0.2,
                                              height: 1.1,
                                            ),
                                            maxLines: 1,
                                            softWrap: false,
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // --- 2.5 PLAYING NOW SECTION (ENHANCED VERTICAL SPACING & EMPTY STATE) ---
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 16, 18, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Playing Now',
                              style: GoogleFonts.dmSans(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                                letterSpacing: -0.2,
                              ),
                            ),
                            if (_friendsOnCourse.isNotEmpty)
                              GestureDetector(
                                onTap: _showAddFriendsModal,
                                child: Text(
                                  'Invite New',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF009A60),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        if (_friendsOnCourse.isNotEmpty)
                          // Circular Display Row (No Images per user requirement)
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                // Circle 1: OpenClub Brand / Invite Action
                                GestureDetector(
                                  onTap: _showAddFriendsModal,
                                  child: Container(
                                    width: 54,
                                    height: 54,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: const Color(0xFF009A60), width: 2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF009A60).withOpacity(0.12),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'OPEN',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 7.5,
                                            fontWeight: FontWeight.w900,
                                            color: const Color(0xFF009A60),
                                            letterSpacing: 0.5,
                                            height: 1,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'CLUB',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 8,
                                            fontWeight: FontWeight.w900,
                                            color: const Color(0xFF009A60),
                                            letterSpacing: 0.5,
                                            height: 1,
                                          ),
                                        ),
                                        const SizedBox(height: 1),
                                        Text(
                                          'GOLF',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 6.5,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF009A60).withOpacity(0.85),
                                            letterSpacing: 0.8,
                                            height: 1,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),

                                // Friends on Course Avatars with Initials (No Images, 5 Max)
                                ..._friendsOnCourse.take(5).map((f) => Padding(
                                  padding: const EdgeInsets.only(right: 14),
                                  child: GestureDetector(
                                    onTap: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('${f['name']} is currently on ${f['score']}')),
                                      );
                                    },
                                    child: Stack(
                                      children: [
                                        Container(
                                          width: 54,
                                          height: 54,
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              begin: Alignment.topCenter,
                                              end: Alignment.bottomCenter,
                                              colors: [Color(0xFFCBD5E1), Color(0xFF94A3B8)],
                                            ),
                                            shape: BoxShape.circle,
                                            border: Border.all(color: Colors.white, width: 2),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withOpacity(0.08),
                                                blurRadius: 8,
                                                offset: const Offset(0, 2),
                                              ),
                                            ],
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            f['initials'] as String,
                                            style: GoogleFonts.dmSans(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                        Positioned(
                                          bottom: 1,
                                          right: 1,
                                          child: Container(
                                            width: 10,
                                            height: 10,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF009A60),
                                              shape: BoxShape.circle,
                                              border: Border.all(color: Colors.white, width: 2),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )).toList(),
                              ],
                            ),
                          )
                        else
                          // Rounded Dashed Empty Display (When no user is on the course)
                          GestureDetector(
                            onTap: _showAddFriendsModal,
                            child: CustomPaint(
                              painter: DashedBorderPainter(
                                color: const Color(0xFFCBD5E1),
                                strokeWidth: 1.8,
                                borderRadius: 22,
                              ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC).withOpacity(0.75),
                                  borderRadius: BorderRadius.circular(22),
                                ),
                                child: Row(
                                  children: [
                                    CustomPaint(
                                      painter: DashedBorderPainter(
                                        color: const Color(0xFF009A60),
                                        strokeWidth: 1.8,
                                        isCircle: true,
                                      ),
                                      child: Container(
                                        width: 52,
                                        height: 52,
                                        decoration: const BoxDecoration(
                                          color: Colors.white,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Center(
                                          child: Icon(
                                            Icons.person_add_alt_1_outlined,
                                            color: Color(0xFF009A60),
                                            size: 22,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            'No friends active',
                                            style: GoogleFonts.dmSans(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: const Color(0xFF0F172A),
                                              letterSpacing: -0.2,
                                            ),
                                            maxLines: 1,
                                            softWrap: false,
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Tap to add friends',
                                            style: GoogleFonts.dmSans(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w400,
                                              color: const Color(0xFF94A3B8),
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF009A60),
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF009A60).withOpacity(0.2),
                                            blurRadius: 6,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: Text(
                                        '+ Add Friends',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // --- 2.75 OPENCLUBOS SYSTEM PROMOTIONAL CARD (HOST. SCORE. WIN.) ---
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          // Left side: Brand, Title, Subtitle, Explore button
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'OPENCLUBOS',
                                      style: GoogleFonts.dmSans(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                        color: const Color(0xFF009A60),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF009A60),
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      child: Text(
                                        'SYSTEM',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 7.5,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.8,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 5),
                                Text(
                                  'Host. Score. Win.',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Full Tournament OS',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFFF97316),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                GestureDetector(
                                  onTap: () {
                                    setState(() => _activeNavTab = 'tournaments');
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Accessing OpenClub Full Tournament OS'),
                                        backgroundColor: Color(0xFF009A60),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    height: 32,
                                    padding: const EdgeInsets.symmetric(horizontal: 14),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF064E3B),
                                      borderRadius: BorderRadius.circular(10),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.06),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      'EXPLORE',
                                      style: GoogleFonts.dmSans(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.8,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Right side: Abstract Tournament Leaderboard Illustration Card
                          Container(
                            width: 98,
                            height: 74,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF4F9F6),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                // Row 1: Green Active Dot + Mint Bar
                                Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF009A60),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Container(
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF009A60).withOpacity(0.30),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 7),
                                // Row 2: Soft Blue Dot + Soft Pastel Blue Bar
                                Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF93C5FD),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      flex: 4,
                                      child: Container(
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE0EDFA),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                      ),
                                    ),
                                    const Spacer(flex: 1),
                                  ],
                                ),
                                const SizedBox(height: 7),
                                // Row 3: Soft Slate Dot + Subtle Bar
                                Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFCBD5E1),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      flex: 3,
                                      child: Container(
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                      ),
                                    ),
                                    const Spacer(flex: 2),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // --- 3. FEATURED TOURNAMENTS SECTION (REFERENCE MATCH) ---
                  Padding(
                    padding: const EdgeInsets.only(top: 12, bottom: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section Header
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 18),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Featured Tournaments',
                                style: GoogleFonts.dmSans(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                  letterSpacing: -0.3,
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  setState(() => _activeNavTab = 'tournaments');
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Viewing All Scheduled Tournaments'),
                                      backgroundColor: Color(0xFF009A60),
                                    ),
                                  );
                                },
                                child: Text(
                                  'View More',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF009A60),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),

                        // Horizontal Carousel
                        SizedBox(
                          height: 230,
                          child: ListView(
                            controller: _featuredTournamentsScrollController,
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 18),
                            physics: const BouncingScrollPhysics(),
                            children: _buildFeaturedTournamentCards(),
                          ),
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
    );
  }

  List<Widget> _buildFeaturedTournamentCards() {
    final List<Widget> cards = [];
    final List<String> golfCourseBanners = [
      'assets/images/tournaments/course_banner_01.jpg',
      'assets/images/tournaments/course_banner_02.jpg',
      'assets/images/tournaments/course_banner_03.jpg',
      'assets/images/tournaments/course_banner_04.jpg',
      'assets/images/tournaments/course_banner_05.jpg',
      'assets/images/tournaments/course_banner_06.jpg',
      'assets/images/tournaments/course_banner_07.jpg',
      'assets/images/tournaments/course_banner_08.jpg',
      'assets/images/tournaments/course_banner_09.jpg',
      'assets/images/tournaments/course_banner_10.jpg',
      'assets/images/tournaments/course_banner_11.jpg',
      'assets/images/tournaments/course_banner_12.jpg',
      'assets/images/tournaments/course_banner_13.jpg',
      'assets/images/tournaments/course_banner_14.jpg',
      'assets/images/tournaments/course_banner_15.jpg',
      'assets/images/tournaments/course_banner_16.jpg',
      'assets/images/tournaments/course_banner_17.jpg',
      'assets/images/tournaments/course_banner_18.jpg',
      'assets/images/tournaments/course_banner_19.jpg',
      'assets/images/tournaments/course_banner_20.jpg',
      'assets/images/tournaments/course_banner_21.jpg',
      'assets/images/tournaments/course_banner_22.jpg',
      'assets/images/tournaments/course_banner_23.jpg',
      'assets/images/tournaments/course_banner_24.jpg',
    ];

    // Deterministic 24-element permutation cycle ensuring no repeats across 24 consecutive cards
    const List<int> bannerPermutation = [
      0, 11, 4, 18, 1, 14, 7, 21, 2, 12, 8, 19, 5, 15, 9, 22, 3, 16, 6, 20, 10, 23, 13, 17
    ];

    final featuredTournaments = _tournaments.where((t) {
      if (t is Map) {
        return t['isFeatured'] == true || t['isFeatured'] == 1 || t['isFeatured'] == 'true';
      }
      return false;
    }).toList();

    final displayList = featuredTournaments.isNotEmpty ? featuredTournaments : _tournaments;

    if (displayList.isEmpty) {
      return [
        Container(
          width: 315,
          height: 238,
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white.withOpacity(0.15)),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.emoji_events_outlined, color: Color(0xFF34D399), size: 36),
                const SizedBox(height: 8),
                Text(
                  'No Active Tournaments',
                  style: GoogleFonts.dmSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Create a tournament in Admin to view it here',
                  style: GoogleFonts.dmSans(
                    fontSize: 11.5,
                    color: const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        )
      ];
    }

    for (int i = 0; i < displayList.length; i++) {
      final t = displayList[i] as Map;
      final name = (t['name'] as String?) ?? 'Championship Tournament';

      final divisions = t['divisions'] is List && (t['divisions'] as List).isNotEmpty
          ? (t['divisions'] as List).join(' & ')
          : 'Championship';

      String? gender;
      if (t['genderRestriction'] == 'MALE_ONLY') gender = 'Male';
      final isFree = t['requiresPayment'] == false || t['entryFee'] == null || t['entryFee'] == 0 || t['entryFee'].toString() == '0';
      final fee = isFree ? 'Free' : (t['currency'] == 'USD' ? '\$${t['entryFee']}' : '₦${t['entryFee']}');
      final hcp = t['hasHandicapRestriction'] == true
          ? 'HCP ${t['minHandicap'] ?? 0}–${t['maxHandicap'] ?? 36}'
          : 'No Limit';
      final deadline = t['registrationCloseAt'] != null
          ? t['registrationCloseAt'].toString().split('T').first
          : 'Open';

      final rawBanner = (t['bannerUrl'] as String?) ?? '';
      String effectiveBanner = rawBanner;
      if (effectiveBanner.startsWith('/images/')) {
        effectiveBanner = 'assets' + effectiveBanner;
      } else if (effectiveBanner.startsWith('images/')) {
        effectiveBanner = 'assets/' + effectiveBanner;
      }
      final bool hasCustomUpload = effectiveBanner.isNotEmpty &&
          !effectiveBanner.contains('yellow-9') &&
          (effectiveBanner.startsWith('data:') || (effectiveBanner.startsWith('http') && !effectiveBanner.contains('course_banner')));
      final banner = hasCustomUpload
          ? effectiveBanner
          : golfCourseBanners[bannerPermutation[i % bannerPermutation.length]];

      if (cards.isNotEmpty) {
        cards.add(const SizedBox(width: 14));
      }
      cards.add(
        _buildFeaturedTournamentCardItem(
          id: t['id']?.toString() ?? 'featured_${cards.length}',
          title: name,
          gender: gender,
          divisions: divisions,
          venue: (t['club']?['name'] ?? t['venue'] ?? 'OpenClub Golf Club').toString(),
          entryFee: fee,
          hcpLimit: hcp,
          deadline: deadline,
          imageAsset: banner,
          isAd: false,
        ),
      );
    }

    return cards;
  }

  Widget _buildTournamentMetaItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 6),
        Text(
          '$label: ',
          style: GoogleFonts.dmSans(fontSize: 11, color: const Color(0xFF94A3B8)),
        ),
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

  Map<String, String> _formatFeaturedTournamentTitle(String rawTitle) {
    final clean = rawTitle.trim();
    if (clean.isEmpty) {
      return {'line1': 'Championship Tournament', 'line2': ''};
    }

    if (clean.contains('\n')) {
      final parts = clean.split('\n').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      return {'line1': parts.first, 'line2': parts.skip(1).join(' ')};
    }

    final words = clean.split(RegExp(r'\s+'));
    if (words.length <= 2) {
      return {'line1': clean, 'line2': ''};
    }

    if (words.length == 3) {
      if (clean.length <= 22) {
        return {'line1': clean, 'line2': ''};
      }
      return {'line1': '${words[0]} ${words[1]}', 'line2': words[2]};
    }

    const majorSplitKeywords = [
      'championship',
      'championships',
      'invitational',
      'memorial',
      'classic',
      'masters',
      'trophy',
      'challenge',
      'cup',
      'tournament',
    ];

    int splitIdx = -1;
    for (int i = 1; i < words.length; i++) {
      if (majorSplitKeywords.contains(words[i].toLowerCase())) {
        splitIdx = i;
        break;
      }
    }

    if (splitIdx <= 0 || splitIdx >= words.length) {
      splitIdx = (words.length / 2).ceil();
    }

    return {
      'line1': words.sublist(0, splitIdx).join(' '),
      'line2': words.sublist(splitIdx).join(' '),
    };
  }

  Widget _buildFeaturedTournamentCardItem({
    required String id,
    required String title,
    String? gender,
    required String divisions,
    required String venue,
    required String entryFee,
    required String hcpLimit,
    required String deadline,
    required String imageAsset,
    bool isAd = false,
  }) {
    return Container(
      width: 315,
      height: 224,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Background Image
            imageAsset.startsWith('http')
                ? Image.network(
                    imageAsset,
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, stack) => Container(
                      color: const Color(0xFF0F172A),
                      child: const Center(
                        child: Icon(Icons.image_not_supported_outlined, color: Colors.white24, size: 36),
                      ),
                    ),
                  )
                : Image.asset(
                    imageAsset,
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, stack) => Container(
                      color: const Color(0xFF0F172A),
                      child: const Center(
                        child: Icon(Icons.sports_golf, color: Colors.white24, size: 36),
                      ),
                    ),
                  ),

            // Contrast Gradient Overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.50),
                    Colors.black.withOpacity(0.75),
                    Colors.black.withOpacity(0.95),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),

            // Card Content
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Row: Badges, Title + Bookmark
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Badges: Gender & Divisions
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                if (gender != null && gender.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(6),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.06),
                                          blurRadius: 2,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                    child: Text(
                                      gender.toUpperCase(),
                                      style: GoogleFonts.dmSans(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF0F172A),
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                  ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF009A60).withOpacity(0.35),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFF009A60).withOpacity(0.50)),
                                  ),
                                  child: Text(
                                    divisions.toUpperCase(),
                                    style: GoogleFonts.dmSans(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF6EE7B7),
                                      letterSpacing: 0.6,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 5),
                            Builder(
                              builder: (context) {
                                final titleLines = _formatFeaturedTournamentTitle(title);
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      titleLines['line1']!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.dmSans(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                        height: 1.2,
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                    if (titleLines['line2'] != null && titleLines['line2']!.isNotEmpty)
                                      Text(
                                        titleLines['line2']!,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.dmSans(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                          height: 1.2,
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                  ],
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('$title saved to bookmarks')),
                          );
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.10),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.white.withOpacity(0.12)),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.bookmark_border_rounded,
                            color: Color(0xFF34D399),
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Tight spacing directly under tournament title
                  const SizedBox(height: 8),

                  // Middle: 2x2 Grid
                  Column(
                    children: [
                      // Row 1: Venue & Entry Fee
                      Row(
                        children: [
                          // Venue
                          Expanded(
                            child: _buildTournamentMetaItem(
                              icon: Icons.location_on_rounded,
                              label: 'VENUE',
                              value: venue,
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Entry Fee
                          Expanded(
                            child: _buildTournamentMetaItem(
                              icon: Icons.payments_rounded,
                              label: 'ENTRY FEE',
                              value: entryFee,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Row 2: HCP Limit & Deadline
                      Row(
                        children: [
                          // HCP Limit
                          Expanded(
                            child: _buildTournamentMetaItem(
                              icon: Icons.military_tech_rounded,
                              label: 'HCP LIMIT',
                              value: hcpLimit,
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Deadline
                          Expanded(
                            child: _buildTournamentMetaItem(
                              icon: Icons.access_time_rounded,
                              label: 'DEADLINE',
                              value: deadline,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Flexible Spacer between Metadata and Action Buttons
                  const Spacer(),

                  // Bottom: Action Buttons (Register 70%, Share 30%)
                  Row(
                    children: [
                      // Register: 70% width
                      Expanded(
                        flex: 7,
                        child: GestureDetector(
                          onTap: () {
                            Navigator.pushNamed(context, '/app/scoring');
                          },
                          child: Container(
                            height: 38,
                            decoration: BoxDecoration(
                              color: const Color(0xFF009A60),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF009A60).withOpacity(0.35),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Register Now',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 16),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Share: 30% width ("card carrying the share", white bg)
                      Expanded(
                        flex: 3,
                        child: GestureDetector(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('$title link copied to clipboard!')),
                            );
                          },
                          child: Container(
                            height: 38,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.12),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.share_rounded, color: Color(0xFF009A60), size: 14),
                                const SizedBox(width: 4),
                                Text(
                                  'Share',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
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
              title: Text('Verified Handicap Index', style: GoogleFonts.dmSans(fontSize: 13.5, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500)),
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

/// Custom painter to draw clean dashed borders around rounded rectangles and circles
class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double dashWidth;
  final double dashSpace;
  final double borderRadius;
  final bool isCircle;

  DashedBorderPainter({
    required this.color,
    this.strokeWidth = 1.8,
    this.dashWidth = 5.0,
    this.dashSpace = 3.5,
    this.borderRadius = 22.0,
    this.isCircle = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final path = Path();
    if (isCircle) {
      path.addOval(Rect.fromLTWH(
        strokeWidth / 2,
        strokeWidth / 2,
        size.width - strokeWidth,
        size.height - strokeWidth,
      ));
    } else {
      path.addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(
          strokeWidth / 2,
          strokeWidth / 2,
          size.width - strokeWidth,
          size.height - strokeWidth,
        ),
        Radius.circular(borderRadius),
      ));
    }

    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double distance = 0.0;
      while (distance < metric.length) {
        final length = (distance + dashWidth < metric.length) ? dashWidth : metric.length - distance;
        final extractPath = metric.extractPath(distance, distance + length);
        canvas.drawPath(extractPath, paint);
        distance += dashWidth + dashSpace;
      }
    }
  }

  @override
  bool shouldRepaint(covariant DashedBorderPainter oldDelegate) =>
      oldDelegate.color != color ||
      oldDelegate.strokeWidth != strokeWidth ||
      oldDelegate.borderRadius != borderRadius ||
      oldDelegate.isCircle != isCircle;
}

extension on _CompetitorHomeScreenState {
  Widget _buildBottomNav() {
    return Container(
      color: Colors.white,
      child: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Container(
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(
                  top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  // 1. Home
                  _buildNavItem(
                    id: 'home',
                    icon: Icons.home_rounded,
                    label: 'Home',
                  ),
                  // 2. Tournaments (with Red Notification Dot)
                  _buildNavItem(
                    id: 'tournaments',
                    icon: Icons.emoji_events_rounded,
                    label: 'Tournaments',
                    hasNotification: true,
                  ),
                  // 3. Center Flush Action Button ("PLAY GOLF" - Does NOT protrude)
                  GestureDetector(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Starting Live Golf Round...'),
                          backgroundColor: Color(0xFF009A60),
                        ),
                      );
                    },
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFF009A60),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF009A60).withOpacity(0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'PLAY',
                            style: GoogleFonts.dmSans(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                              height: 1.05,
                            ),
                          ),
                          Text(
                            'GOLF',
                            style: GoogleFonts.dmSans(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                              height: 1.05,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // 4. Challenges
                  _buildNavItem(
                    id: 'challenges',
                    icon: Icons.star_rounded,
                    label: 'Challenges',
                  ),
                  // 5. Deals
                  _buildNavItem(
                    id: 'deals',
                    icon: Icons.local_fire_department_rounded,
                    label: 'Deals',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required String id,
    required IconData icon,
    required String label,
    bool hasNotification = false,
  }) {
    final isActive = _activeNavTab == id;
    const activeColor = Color(0xFF009A60);
    const inactiveColor = Color(0xFF94A3B8);

    return GestureDetector(
      onTap: () {
        setState(() => _activeNavTab = id);
      },
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: isActive ? activeColor : inactiveColor,
                ),
                if (hasNotification)
                  Positioned(
                    top: -1,
                    right: -5,
                    child: Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: GoogleFonts.dmSans(
                fontSize: 10.5,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? activeColor : inactiveColor,
                letterSpacing: -0.2,
              ),
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}
