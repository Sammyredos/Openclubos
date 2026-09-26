import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../core/api/api_client.dart';
import '../features/scoring/presentation/screens/scoring_screen.dart';
import 'player_scorecard_screen.dart';
import 'add_friends_screen.dart';
import 'notifications_screen.dart';
import '../core/formatters.dart';

class CompetitorHomeScreen extends StatefulWidget {
  const CompetitorHomeScreen({super.key});

  @override
  State<CompetitorHomeScreen> createState() => _CompetitorHomeScreenState();
}

class _CompetitorHomeScreenState extends State<CompetitorHomeScreen> {
  final ApiClient _apiClient = ApiClient();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  IO.Socket? _socket;
  Map<String, dynamic>? _user;
  List<dynamic> _tournaments = [];
  bool _isLoadingTournaments = true;

  Map<String, dynamic>? _activeRound;
  Timer? _forfeitTimer;
  bool _hasInactivityWarning = false;

  // Live competitors on course for horizontal carousel
  List<Map<String, dynamic>> _friendsOnCourse = [];
  final Set<String> _acceptedFriendIds = {};
  final Set<String> _sentRequestIds = {};
  final Set<String> _blockedUserIds = {};
  String _searchQueryAddFriends = '';
  final TextEditingController _searchControllerAddFriends = TextEditingController();

  static String _getTwoInitials(String? name) {
    if (name == null || name.trim().isEmpty) return 'OC';
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
    }
    final single = parts[0];
    if (single.length >= 2) {
      return single.substring(0, 2).toUpperCase();
    }
    return single.toUpperCase();
  }

  Widget _buildFlightPlayerAvatar(String name, String? avatarUrl, String? initials) {
    final effectiveInitials = (initials != null && initials.isNotEmpty) ? initials : _getTwoInitials(name);
    if (avatarUrl != null && avatarUrl.trim().isNotEmpty) {
      final cleanUrl = avatarUrl.trim();
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return Image.network(
          cleanUrl,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
          errorBuilder: (ctx, err, stack) => _buildFlightInitialsText(effectiveInitials),
        );
      } else if (cleanUrl.startsWith('data:image')) {
        try {
          final commaIdx = cleanUrl.indexOf(',');
          final base64Str = commaIdx != -1 ? cleanUrl.substring(commaIdx + 1) : cleanUrl;
          return Image.memory(
            base64Decode(base64Str),
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (ctx, err, stack) => _buildFlightInitialsText(effectiveInitials),
          );
        } catch (_) {
          return _buildFlightInitialsText(effectiveInitials);
        }
      }
    }
    return _buildFlightInitialsText(effectiveInitials);
  }

  Widget _buildFlightInitialsText(String initials) {
    return Center(
      child: Text(
        initials,
        style: GoogleFonts.dmSans(
          fontSize: 10.0,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF10B981),
          letterSpacing: -0.5,
        ),
      ),
    );
  }

  static List<Map<String, dynamic>> _buildScorecardHoles(List<int?> strokesList) {
    const pars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];
    const yards = [385, 410, 175, 520, 395, 430, 190, 545, 415, 405, 390, 165, 535, 415, 440, 185, 420, 550];
    return List.generate(18, (idx) => {
      'hole': idx + 1,
      'par': pars[idx],
      'yards': yards[idx],
      'strokes': idx < strokesList.length ? strokesList[idx] : null,
    });
  }

  List<Map<String, dynamic>> _activeCompetitorsData = [];
  List<Map<String, dynamic>> _candidateCompetitors = [];
  List<Map<String, dynamic>> _notifications = [];
  List<Map<String, dynamic>> _incomingFriendRequests = [];
  bool _isLoadingNotifications = false;

  String _activeNavTab = 'home'; // Default to Home tab
  List<Map<String, dynamic>> _recentRounds = [];
  List<Map<String, dynamic>> _proBookings = [
    {
      'id': 'booking_pga_1',
      'proName': 'Pro Michael Dan, PGA',
      'proRole': 'Head Teaching Professional',
      'proClub': 'Ikoyi Club 1938',
      'serviceName': '1-on-1 Full Swing & TrackMan Session',
      'date': 'Sat, Oct 24',
      'time': '10:00 AM - 11:00 AM',
      'location': 'Golf Academy • Range Bay 4',
      'status': 'CONFIRMED',
      'price': '₦35,000',
    },
    {
      'id': 'booking_pga_2',
      'proName': 'Pro Sarah Jenkins, LPGA',
      'proRole': 'Short Game Specialist',
      'proClub': 'Ikoyi Club 1938',
      'serviceName': 'Short Game & Putting Masterclass',
      'date': 'Wed, Nov 4',
      'time': '02:30 PM - 03:30 PM',
      'location': 'Championship Putting Green',
      'status': 'UPCOMING',
      'price': '₦28,000',
    },
  ];

  final ScrollController _featuredTournamentsScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchTournaments();
    _fetchMembers();
    _fetchNotifications();
    _checkActiveRoundForfeitStatus();
  }

  @override
  void dispose() {
    try {
      _socket?.disconnect();
      _socket?.dispose();
    } catch (_) {}
    _searchControllerAddFriends.dispose();
    _featuredTournamentsScrollController.dispose();
    _forfeitTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkActiveRoundForfeitStatus() async {
    if (_activeRound == null) return;
    try {
      final roundKey = _activeRound!['id'] ?? 'active_round';
      final box = await Hive.openBox('rounds');
      final isForfeited = box.get('round_forfeited_$roundKey', defaultValue: false) == true;
      final isClosed = box.get('round_closed_$roundKey', defaultValue: false) == true;
      if (isForfeited || isClosed) {
        if (mounted) {
          setState(() {
            _activeRound = null;
            _hasInactivityWarning = false;
          });
        }
        return;
      }

      int? startedAt = box.get('round_started_at_$roundKey') as int?;
      final now = DateTime.now().millisecondsSinceEpoch;
      if (startedAt == null) {
        startedAt = now;
        await box.put('round_started_at_$roundKey', now);
      }

      final elapsedMs = now - startedAt;
      const thirtyMinsMs = 30 * 60 * 1000;
      final tournName = _activeRound!['tournamentName'] ?? 'Active Round';
      final holeNum = _activeRound!['holeNumber'] ?? '';
      if (elapsedMs >= thirtyMinsMs) {
        if (mounted) {
          setState(() => _hasInactivityWarning = true);
          final hasNotified = box.get('round_notified_$roundKey', defaultValue: false) == true;
          if (!hasNotified) {
            await box.put('round_notified_$roundKey', true);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$tournName: Inactivity alert on Hole $holeNum. Tap Resume Play to record your score.'),
                backgroundColor: const Color(0xFFD97706),
              ),
            );
          }
        }
      } else {
        if (mounted) setState(() => _hasInactivityWarning = false);
        final remainingMs = thirtyMinsMs - elapsedMs;
        _forfeitTimer?.cancel();
        _forfeitTimer = Timer(Duration(milliseconds: remainingMs), () async {
          final b = await Hive.openBox('rounds');
          await b.put('round_notified_$roundKey', true);
          if (mounted) {
            setState(() => _hasInactivityWarning = true);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$tournName: Inactivity alert on Hole $holeNum. Tap Resume Play to record your score.'),
                backgroundColor: const Color(0xFFD97706),
              ),
            );
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _loadUserData() async {
    final box = await Hive.openBox('auth');
    final storedUser = box.get('user');
    if (storedUser != null) {
      setState(() {
        _user = Map<String, dynamic>.from(storedUser);
      });
      try {
        final userId = _user?['id']?.toString() ?? _user?['email']?.toString() ?? 'anonymous';
        final sentList = box.get('sent_friend_requests_$userId');
        final acceptedList = box.get('accepted_friends_$userId');
        final incomingList = box.get('incoming_friend_requests_$userId');
        final blockedList = box.get('blocked_users_$userId');
        setState(() {
          _blockedUserIds.clear();
          if (blockedList is List) {
            _blockedUserIds.addAll(blockedList.map((e) => e.toString()));
          }
          _sentRequestIds.clear();
          if (sentList is List) {
            _sentRequestIds.addAll(sentList.map((e) => e.toString()));
          }
          _acceptedFriendIds.clear();
          if (acceptedList is List) {
            _acceptedFriendIds.addAll(acceptedList.map((e) => e.toString()));
          }
          // Critical fix: pending sent requests and blocked users can NEVER remain in accepted friends
          _acceptedFriendIds.removeWhere((id) => _sentRequestIds.contains(id) || _blockedUserIds.contains(id));
          _sentRequestIds.removeWhere((id) => _blockedUserIds.contains(id));

          _incomingFriendRequests.clear();
          if (incomingList is List) {
            _incomingFriendRequests.addAll(incomingList.map((e) => Map<String, dynamic>.from(e as Map)));
          }
        });
      } catch (_) {}
      _fetchFriendsFromDb();
      _initSocket();
    } else {
      try {
        _socket?.disconnect();
        _socket?.dispose();
        _socket = null;
      } catch (_) {}
      setState(() {
        _blockedUserIds.clear();
        _sentRequestIds.clear();
        _acceptedFriendIds.clear();
        _incomingFriendRequests.clear();
        _friendsOnCourse.clear();
      });
    }
  }

  void _initSocket() {
    final userId = _user?['id']?.toString() ?? _user?['email']?.toString();
    if (userId == null || userId.isEmpty) return;

    try {
      _socket?.disconnect();
      _socket?.dispose();
    } catch (_) {}

    final rawBase = ApiClient.resolveBaseUrl();
    final socketUrl = rawBase.replaceAll(RegExp(r'/api/?$'), '');

    try {
      final s = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(10)
            .setReconnectionDelay(1000)
            .setQuery({'userId': userId})
            .build(),
      );

      s.onConnect((_) {
        s.emit('subscribe:user', {'userId': userId});
      });

      s.on('friend:request_received', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final senderId = map['senderId']?.toString() ?? map['id']?.toString();
        if (senderId == null || senderId.isEmpty) return;
        if (_blockedUserIds.contains(senderId)) return;

        final incomingItem = {
          'id': map['id']?.toString() ?? map['requestId']?.toString() ?? 'freq_${DateTime.now().millisecondsSinceEpoch}',
          'requestId': map['requestId']?.toString() ?? map['id']?.toString(),
          'senderId': senderId,
          'senderName': map['senderName']?.toString() ?? 'Golfer',
          'senderEmail': map['senderEmail']?.toString() ?? '',
          'senderClub': map['senderClub']?.toString() ?? 'OpenClub Golfer',
          'senderHcp': map['senderHcp']?.toString() ?? '0.0',
          'senderInitial': (map['senderName']?.toString().isNotEmpty == true) ? map['senderName'][0].toUpperCase() : 'G',
          'senderAvatar': map['senderAvatar']?.toString() ?? map['profilePhoto']?.toString(),
          'createdAt': map['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
        };

        setState(() {
          _incomingFriendRequests.removeWhere((r) => r['senderId'] == senderId || r['id'] == incomingItem['id']);
          _incomingFriendRequests.insert(0, incomingItem);
        });

        Hive.openBox('auth').then((box) {
          box.put('incoming_friend_requests_$userId', _incomingFriendRequests);
        });
      });

      s.on('friend:request_cancelled', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final senderId = map['senderId']?.toString();
        final targetId = map['targetId']?.toString();
        final reqId = map['requestId']?.toString();

        setState(() {
          _incomingFriendRequests.removeWhere((r) {
            if (reqId != null && (r['id'] == reqId || r['requestId'] == reqId)) return true;
            if (senderId != null && (r['senderId'] == senderId || r['id'] == senderId)) return true;
            return false;
          });
          if (senderId == userId && targetId != null) {
            _sentRequestIds.remove(targetId);
          }
        });

        Hive.openBox('auth').then((box) {
          box.put('incoming_friend_requests_$userId', _incomingFriendRequests);
          box.put('sent_friend_requests_$userId', _sentRequestIds.toList());
        });
      });

      s.on('friend:request_accepted', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final friendMap = map['friend'] is Map ? Map<String, dynamic>.from(map['friend'] as Map) : null;
        final friendId = friendMap?['friendId']?.toString() ?? map['byUserId']?.toString();
        final friendName = friendMap?['name']?.toString() ?? map['byUserName']?.toString();
        if (friendId == null || friendId.isEmpty) return;

        setState(() {
          _acceptedFriendIds.add(friendId);
          if (friendName != null && friendName.isNotEmpty) {
            _acceptedFriendIds.add(friendName.toLowerCase());
          }
          _sentRequestIds.remove(friendId);
          _incomingFriendRequests.removeWhere((r) => r['senderId'] == friendId || r['id'] == friendId);
        });

        Hive.openBox('auth').then((box) {
          box.put('accepted_friends_$userId', _acceptedFriendIds.toList());
          box.put('sent_friend_requests_$userId', _sentRequestIds.toList());
          box.put('incoming_friend_requests_$userId', _incomingFriendRequests);
        });
      });

      s.on('friend:request_declined', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final targetId = map['targetId']?.toString();
        final senderId = map['senderId']?.toString();

        if (userId == senderId && targetId != null) {
          setState(() {
            _sentRequestIds.remove(targetId);
          });
          Hive.openBox('auth').then((box) {
            box.put('sent_friend_requests_$userId', _sentRequestIds.toList());
          });
        }
      });

      s.on('friend:removed', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final id1 = map['friendId']?.toString();
        final id2 = map['removedByUserId']?.toString();

        setState(() {
          if (id1 != null) {
            _acceptedFriendIds.remove(id1);
            _friendsOnCourse.removeWhere((f) => f['id'] == id1);
          }
          if (id2 != null) {
            _acceptedFriendIds.remove(id2);
            _friendsOnCourse.removeWhere((f) => f['id'] == id2);
          }
        });

        Hive.openBox('auth').then((box) {
          box.put('accepted_friends_$userId', _acceptedFriendIds.toList());
        });
      });

      s.on('friend:blocked', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final blockerId = map['blockerId']?.toString();
        final blockedId = map['blockedId']?.toString();

        setState(() {
          if (userId == blockerId && blockedId != null) {
            _blockedUserIds.add(blockedId);
          }
          final other = userId == blockerId ? blockedId : blockerId;
          if (other != null) {
            _acceptedFriendIds.remove(other);
            _sentRequestIds.remove(other);
            _incomingFriendRequests.removeWhere((r) => r['senderId'] == other || r['id'] == other);
            _friendsOnCourse.removeWhere((f) => f['id'] == other);
          }
        });

        Hive.openBox('auth').then((box) {
          box.put('blocked_users_$userId', _blockedUserIds.toList());
          box.put('accepted_friends_$userId', _acceptedFriendIds.toList());
        });
      });

      s.on('friend:unblocked', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final unblockerId = map['unblockerId']?.toString();
        final unblockedId = map['unblockedId']?.toString();

        if (userId == unblockerId && unblockedId != null) {
          setState(() {
            _blockedUserIds.remove(unblockedId);
          });
          Hive.openBox('auth').then((box) {
            box.put('blocked_users_$userId', _blockedUserIds.toList());
          });
        }
      });

      s.on('friend:playing_update', (data) {
        if (!mounted || data == null) return;
        final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
        if (map == null) return;
        final friendId = map['friendId']?.toString();
        final isPlaying = map['isPlaying'] == true;
        if (friendId == null || friendId.isEmpty) return;

        setState(() {
          if (isPlaying) {
            final idx = _friendsOnCourse.indexWhere((f) => f['id'] == friendId);
            final score = map['score']?.toString() ?? 'E';
            if (idx != -1) {
              _friendsOnCourse[idx]['score'] = score;
            } else {
              final name = map['name']?.toString() ?? 'Friend';
              _friendsOnCourse.add({
                'id': friendId,
                'name': name,
                'initials': _getTwoInitials(name),
                'score': score,
                'bg': 'bg-emerald-600',
              });
            }
          } else {
            _friendsOnCourse.removeWhere((f) => f['id'] == friendId);
          }
        });
      });

      _socket = s;
    } catch (_) {}
  }

  Future<void> _fetchFriendsFromDb() async {
    final userId = _user?['id']?.toString() ?? _user?['email']?.toString();
    if (userId == null || userId.isEmpty) return;

    try {
      // 1. Fetch accepted friends from database
      final friendsRes = await _apiClient.dio.get(
        '/friends',
        options: Options(headers: {'x-user-id': userId}),
      );
      if (friendsRes.statusCode == 200 && friendsRes.data is List) {
        final List<dynamic> list = friendsRes.data;
        final accepted = <String>[];
        for (final f in list) {
          final fid = f['id']?.toString();
          final fname = f['name']?.toString()?.toLowerCase();
          if (fid != null && fid.isNotEmpty) accepted.add(fid);
          if (fname != null && fname.isNotEmpty) accepted.add(fname);
        }
        if (mounted) {
          setState(() {
            _acceptedFriendIds.addAll(accepted);
            _acceptedFriendIds.removeWhere((id) => _sentRequestIds.contains(id));
          });
        }
        final box = await Hive.openBox('auth');
        await box.put('accepted_friends_$userId', _acceptedFriendIds.toList());
      }

      // 2. Fetch pending requests (incoming & outgoing)
      final reqRes = await _apiClient.dio.get(
        '/friends/requests',
        options: Options(headers: {'x-user-id': userId}),
      );
      if (reqRes.statusCode == 200 && reqRes.data is Map) {
        final incoming = reqRes.data['incoming'] as List? ?? [];
        final outgoing = reqRes.data['outgoing'] as List? ?? [];

        final incomingList = incoming.map((item) {
          return {
            'id': item['id']?.toString(),
            'senderId': item['senderId']?.toString(),
            'senderName': item['senderName']?.toString() ?? 'Golfer',
            'senderEmail': item['senderEmail']?.toString() ?? '',
            'senderClub': item['senderClub']?.toString() ?? 'OpenClub Golfer',
            'senderHcp': item['senderHcp']?.toString() ?? '0.0',
            'senderInitial': (item['senderName']?.toString().isNotEmpty == true)
                ? item['senderName'][0].toUpperCase()
                : 'G',
            'senderAvatar': item['senderAvatar']?.toString(),
            'createdAt': item['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
          };
        }).toList();

        final sentIds = outgoing
            .map((item) => item['receiverId']?.toString())
            .whereType<String>()
            .toList();

        if (mounted) {
          setState(() {
            _incomingFriendRequests.clear();
            _incomingFriendRequests.addAll(incomingList);
            _sentRequestIds.addAll(sentIds);
            _acceptedFriendIds.removeWhere((id) => _sentRequestIds.contains(id));
          });
        }

        final box = await Hive.openBox('auth');
        await box.put('incoming_friend_requests_$userId', _incomingFriendRequests);
        await box.put('sent_friend_requests_$userId', _sentRequestIds.toList());
        await box.put('accepted_friends_$userId', _acceptedFriendIds.toList());
      }

      // 3. Fetch blocked users from database
      final blockedRes = await _apiClient.dio.get(
        '/friends/blocked',
        options: Options(headers: {'x-user-id': userId}),
      );
      if (blockedRes.statusCode == 200 && blockedRes.data is List) {
        final List<dynamic> blockedData = blockedRes.data;
        final serverBlocked = <String>[];
        for (final b in blockedData) {
          final bid = b['id']?.toString();
          if (bid != null && bid.isNotEmpty) serverBlocked.add(bid);
        }
        if (mounted) {
          setState(() {
            _blockedUserIds.addAll(serverBlocked);
            _acceptedFriendIds.removeWhere((id) => _blockedUserIds.contains(id));
            _sentRequestIds.removeWhere((id) => _blockedUserIds.contains(id));
          });
        }
        final box = await Hive.openBox('auth');
        await box.put('blocked_users_$userId', _blockedUserIds.toList());
      }
    } catch (_) {}
  }

  Future<void> _fetchTournaments() async {
    try {
      final response = await _apiClient.dio.get('/tournaments');
      if (mounted) {
        final data = response.data;
        final List<dynamic> list = (data is Map && data['items'] != null)
            ? data['items']
            : (data is List ? data : []);
        setState(() {
          _tournaments = list;
          _isLoadingTournaments = false;
        });

        if (list.isNotEmpty) {
          final liveTourn = list.firstWhere(
            (t) => (t['status'] == 'LIVE' || t['status'] == 'IN_PROGRESS' || t['status'] == 'ACTIVE'),
            orElse: () => list.first,
          );
          if (liveTourn != null && liveTourn['id'] != null) {
            _fetchLiveTournamentData(liveTourn);
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingTournaments = false;
          _tournaments = [];
        });
      }
    }
  }

  Future<void> _fetchLiveTournamentData(dynamic tourn) async {
    try {
      final tournamentId = tourn['id'];
      final res = await _apiClient.dio.get('/scores/tournament/$tournamentId/leaderboard-data');
      final data = res.data;
      if (data != null && data['registrations'] is List) {
        final List<dynamic> regs = data['registrations'];
        final List<dynamic> scoresList = data['scores'] is List ? data['scores'] : [];
        List<int> pars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4];
        List<int> distances = [345, 286, 378, 359, 444, 131, 307, 355, 406, 450, 415, 183, 401, 399, 436, 344, 325, 138];
        final courseName = tourn['course']?['name']?.toString() ?? 'Oakwood Country Club Course';

        if (tourn['course']?['holes'] is List && (tourn['course']['holes'] as List).isNotEmpty) {
          final chList = (tourn['course']['holes'] as List).toList();
          chList.sort((a, b) => ((a['number'] ?? 0) as num).compareTo((b['number'] ?? 0) as num));
          pars = chList.map((h) => (h['par'] as num?)?.toInt() ?? 4).toList();
          distances = chList.map((h) => (h['distance'] as num?)?.toInt() ?? 350).toList();
        }

        final List<Map<String, dynamic>> mappedCompetitors = [];
        final List<Map<String, dynamic>> mappedFriends = [];
        Map<String, dynamic>? userActiveRound;

        for (int i = 0; i < regs.length; i++) {
          final reg = regs[i];
          final user = reg['user'] as Map<String, dynamic>?;
          final fName = user?['firstName']?.toString() ?? '';
          final lName = user?['lastName']?.toString() ?? '';
          final name = '$fName $lName'.trim().isNotEmpty ? '$fName $lName'.trim() : (reg['playerName']?.toString() ?? 'Player ${i + 1}');
          final initials = _getTwoInitials(name);
          final club = user?['homeClub']?.toString() ?? tourn['club']?['name']?.toString() ?? tourn['venue']?.toString() ?? 'OpenClub Member';
          final hcp = (user?['handicap'] ?? reg['extraStrokes'] ?? 0).toString();
          final photo = user?['profilePhoto']?.toString() ?? reg['avatar']?.toString() ?? reg['profilePhoto']?.toString();

          final regScores = scoresList.where((s) => s['registrationId'] == reg['id'] || s['userId'] == user?['id']).toList();
          final List<int?> strokes = List.generate(18, (hIdx) {
            final holeNum = hIdx + 1;
            final match = regScores.firstWhere((s) => s['holeNumber'] == holeNum, orElse: () => null);
            return match != null ? (match['strokes'] as int?) : null;
          });

          int gross = 0;
          int parSum = 0;
          int thruCount = 0;
          for (int h = 0; h < 18; h++) {
            if (strokes[h] != null) {
              gross += strokes[h]!;
              parSum += pars[h];
              thruCount++;
            }
          }
          final toPar = thruCount > 0 ? (gross - parSum) : 0;
          final currentHole = (thruCount < 18) ? (thruCount + 1) : 18;
          final scoreText = thruCount == 0 ? 'Tee Time: ${reg['teeTime'] ?? '08:00 AM'}' : 'Hole $currentHole • ${toPar == 0 ? 'Even' : (toPar > 0 ? '+$toPar' : '$toPar')}';

          final compData = {
            'id': user?['id']?.toString() ?? reg['id']?.toString() ?? 'c_$i',
            'registrationId': reg['id']?.toString(),
            'userId': user?['id']?.toString(),
            'name': name,
            'initials': initials,
            'avatar': photo,
            'profilePhoto': photo,
            'club': club,
            'hcp': hcp,
            'score': scoreText,
            'toPar': toPar,
            'currentHole': currentHole,
            'thru': thruCount,
            'gross': gross,
            'net': gross,
            'tournament': tourn['name']?.toString() ?? 'Tournament',
            'round': 'Round ${tourn['currentRound'] ?? 1}',
            'flight': reg['flight']?.toString() ?? 'Championship Flight',
            'teeTime': reg['teeTime']?.toString() ?? '08:00 AM',
            'ball': 'Titleist Pro V1',
            'marker': reg['markerName']?.toString() ?? 'Official Marker',
            'pace': 'On Pace',
            'holes': _buildScorecardHoles(strokes),
          };

          mappedCompetitors.add(compData);

          final currentUserId = _user?['id']?.toString();
          final currentUserEmail = _user?['email']?.toString()?.toLowerCase();
          final currentUserName = _user?['name']?.toString()?.toLowerCase();
          final regUserId = user?['id']?.toString();
          final regEmail = user?['email']?.toString()?.toLowerCase();

          final isCurrentUser = (currentUserId != null && currentUserId == regUserId) ||
              (currentUserEmail != null && currentUserEmail == regEmail) ||
              (currentUserName != null && currentUserName == name.toLowerCase());

          final isFriend = (_acceptedFriendIds.contains(reg['id']?.toString()) ||
                  _acceptedFriendIds.contains(user?['id']?.toString()) ||
                  _acceptedFriendIds.contains(name.toLowerCase())) &&
              !_sentRequestIds.contains(reg['id']?.toString()) &&
              !_sentRequestIds.contains(user?['id']?.toString()) &&
              !_sentRequestIds.contains(name.toLowerCase());

          // User rule: if a player has not started playing on the golfing course meaning if the player has not started a round dont let it display on friends playing now
          final hasStartedRound = thruCount > 0 || reg['roundStarted'] == true || reg['startedAt'] != null;

          if (!isCurrentUser && hasStartedRound && isFriend) {
            mappedFriends.add({
              'id': reg['id']?.toString() ?? 'f_$i',
              'name': name,
              'initials': initials,
              'score': scoreText,
            });
          }

          if (_user != null) {
            final currentUserId = _user!['id']?.toString();
            final currentUserEmail = _user!['email']?.toString()?.toLowerCase();
            final regUserId = user?['id']?.toString();
            final regEmail = user?['email']?.toString()?.toLowerCase();

            if ((currentUserId != null && currentUserId == regUserId) ||
                (currentUserEmail != null && currentUserEmail == regEmail)) {
              final curHoleIdx = (currentHole - 1).clamp(0, pars.length - 1);
              final holePar = pars[curHoleIdx];
              final holeDist = distances.length > curHoleIdx ? distances[curHoleIdx] : 345;
              userActiveRound = {
                'id': reg['id']?.toString() ?? 'ar_${tourn['id']}',
                'tournamentName': toTitleCase(tourn['name']?.toString() ?? 'Tournament'),
                'courseName': courseName,
                'holeNumber': currentHole,
                'par': holePar,
                'yardage': holeDist,
                'holeInfo': 'Par $holePar • $holeDist yds',
                'isLive': tourn['status'] == 'LIVE' || tourn['status'] == 'ONGOING' || tourn['status'] == 'IN_PROGRESS',
                'dayText': 'ROUND ${tourn['currentRound'] ?? 1}',
                'score': toPar == 0 ? 'E' : (toPar > 0 ? '+$toPar' : '$toPar'),
                'thru': thruCount.toString(),
                'flightText': 'Flight 1',
                'groupPlayers': <Map<String, dynamic>>[],
              };
            }
          }
        }

        if (userActiveRound != null) {
          final currentUserId = _user?['id']?.toString();
          final currentUserEmail = _user?['email']?.toString()?.toLowerCase();
          final currentUserName = _user?['name']?.toString()?.toLowerCase();
          final currentRoundId = userActiveRound['id']?.toString();
          final tournamentId = tourn['id']?.toString();
          final roundNumber = tourn['currentRound'] ?? 1;

          final List<Map<String, dynamic>> flightPlayers = [];
          String flightLabel = 'Flight 1';

          // Try fetching official groupings from database
          if (tournamentId != null) {
            try {
              final groupingsRes = await _apiClient.dio.get('/tournaments/$tournamentId/groupings?day=$roundNumber');
              final groupingsData = groupingsRes.data;
              final List<dynamic> groups = (groupingsData is Map && groupingsData['groups'] is List)
                  ? groupingsData['groups']
                  : [];

              if (groups.isNotEmpty) {
                // Find group containing the authenticated user
                dynamic matchedGroup;
                for (final g in groups) {
                  final regs = (g is Map && g['registrations'] is List) ? g['registrations'] as List : [];
                  final hasMe = regs.any((r) {
                    final u = r is Map ? r['user'] : null;
                    final uId = u?['id']?.toString() ?? r?['id']?.toString();
                    final uEmail = u?['email']?.toString()?.toLowerCase();
                    final uName = '${u?['firstName'] ?? ''} ${u?['lastName'] ?? ''}'.trim().toLowerCase();
                    return (currentUserId != null && currentUserId == uId) ||
                        (currentUserEmail != null && currentUserEmail == uEmail) ||
                        (currentUserName != null && currentUserName == uName) ||
                        (currentRoundId != null && currentRoundId == r?['id']?.toString());
                  });
                  if (hasMe) {
                    matchedGroup = g;
                    break;
                  }
                }

                if (matchedGroup != null) {
                  final groupName = matchedGroup['name']?.toString() ?? 'Flight 1';
                  flightLabel = groupName;
                  if (matchedGroup['day'] != null) {
                    userActiveRound['dayText'] = 'ROUND ${matchedGroup['day']}';
                  }
                  final regs = (matchedGroup['registrations'] as List);
                  for (final r in regs) {
                    final u = r is Map ? r['user'] : null;
                    final uId = u?['id']?.toString() ?? r?['id']?.toString();
                    final uEmail = u?['email']?.toString()?.toLowerCase();
                    final uName = '${u?['firstName'] ?? ''} ${u?['lastName'] ?? ''}'.trim();
                    final isCurrentUser = (currentUserId != null && currentUserId == uId) ||
                        (currentUserEmail != null && currentUserEmail == uEmail) ||
                        (currentUserName != null && currentUserName == uName.toLowerCase()) ||
                        (currentRoundId != null && currentRoundId == r?['id']?.toString());

                    if (!isCurrentUser) {
                      final displayName = uName.isNotEmpty ? uName : (uEmail ?? 'Player');
                      final photo = u?['profilePhoto']?.toString() ?? u?['avatar']?.toString() ?? r?['avatar']?.toString();
                      flightPlayers.add({
                        'id': uId,
                        'name': displayName,
                        'initials': _getTwoInitials(displayName),
                        'avatar': photo,
                      });
                    }
                    if (flightPlayers.length >= 3) break;
                  }
                } else {
                  flightLabel = 'Flight Pending';
                }
              }
            } catch (_) {
              // Groupings fetch failed or endpoint unavailable
            }
          }

          // Fallback: If no official database groupings found, populate from registered competitors with real photos or initials (no fake stock photos!)
          if (flightPlayers.isEmpty && flightLabel != 'Flight Pending') {
            for (final comp in mappedCompetitors) {
              final compId = comp['id']?.toString();
              final compEmail = comp['email']?.toString()?.toLowerCase();
              final compName = comp['name']?.toString()?.toLowerCase();

              final isCurrentUser = (currentUserId != null && currentUserId == compId) ||
                  (currentUserEmail != null && currentUserEmail == compEmail) ||
                  (currentUserName != null && currentUserName == compName) ||
                  (currentRoundId != null && currentRoundId == compId) ||
                  (currentUserName?.contains('adediran') == true && compName?.contains('adediran') == true);

              if (!isCurrentUser) {
                final photo = comp['avatar']?.toString() ?? comp['profilePhoto']?.toString();
                flightPlayers.add({
                  'id': comp['id'],
                  'name': comp['name'],
                  'initials': _getTwoInitials(comp['name']?.toString() ?? 'Golfer'),
                  'avatar': photo,
                });
              }
              if (flightPlayers.length >= 3) break;
            }
          }

          userActiveRound['flightText'] = flightLabel;
          userActiveRound['groupPlayers'] = flightPlayers;
        }

        if (mounted) {
          setState(() {
            _activeCompetitorsData = mappedCompetitors;
            _friendsOnCourse = mappedFriends;
            if (userActiveRound != null) {
              _activeRound = userActiveRound;
              _checkActiveRoundForfeitStatus();
            }
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchMembers() async {
    try {
      final res = await _apiClient.dio.get('/members?take=100');
      final data = res.data;
      final List<dynamic> items = (data is Map && data['items'] != null)
          ? data['items']
          : (data is List ? data : []);
      if (mounted) {
        setState(() {
          _candidateCompetitors = items.map((m) {
            final fName = m['firstName']?.toString() ?? '';
            final lName = m['lastName']?.toString() ?? '';
            final name = '$fName $lName'.trim();
            final email = m['email']?.toString() ?? '';
            final club = m['homeClub']?.toString() ?? m['club']?['name']?.toString() ?? 'OpenClub Member';
            final hcp = m['handicap']?.toString() ?? '0.0';
            final initial = _getTwoInitials(name);
            final photo = m['profilePhoto']?.toString() ?? m['avatar']?.toString();
            return {
              'id': m['id']?.toString() ?? '',
              'name': name.isNotEmpty ? name : 'Golfer',
              'email': email,
              'club': club,
              'hcp': hcp,
              'initial': initial,
              'avatar': photo,
              'profilePhoto': photo,
            };
          }).toList();
        });
      }
    } catch (_) {}
  }

  String _formatNotificationTime(dynamic dateVal) {
    if (dateVal == null) return 'Just now';
    try {
      final dt = dateVal is DateTime
          ? dateVal
          : DateTime.tryParse(dateVal.toString()) ?? DateTime.now();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.isNegative || diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';

      final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final minute = dt.minute.toString().padLeft(2, '0');
      final period = dt.hour >= 12 ? 'PM' : 'AM';
      final timeStr = '$hour:$minute $period';

      final isToday = dt.year == now.year && dt.month == now.month && dt.day == now.day;
      final yesterday = now.subtract(const Duration(days: 1));
      final isYesterday = dt.year == yesterday.year && dt.month == yesterday.month && dt.day == yesterday.day;

      if (isToday) {
        if (diff.inHours < 4) return '${diff.inHours}h ago';
        return timeStr;
      }
      if (isYesterday) {
        return 'Yesterday, $timeStr';
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[dt.month - 1]} ${dt.day}, $timeStr';
    } catch (_) {
      return 'Recently';
    }
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoadingNotifications = true);
    try {
      final res = await _apiClient.dio.get('/notifications');
      final data = res.data;
      final List<dynamic> items = (data is Map && data['items'] != null)
          ? data['items']
          : (data is List ? data : []);

      final List<Map<String, dynamic>> fetched = items.map((n) {
        final createdAt = n['createdAt'] ?? n['timestamp'] ?? n['created_at'];
        return {
          'id': n['id']?.toString() ?? '',
          'title': n['title']?.toString() ?? 'Tournament Notice',
          'desc': n['body']?.toString() ?? n['message']?.toString() ?? n['description']?.toString() ?? '',
          'time': _formatNotificationTime(createdAt),
          'createdAt': createdAt?.toString(),
          'unread': n['isRead'] != true,
          'type': n['type']?.toString() ?? 'SYSTEM',
          'data': n['data'] is Map ? Map<String, dynamic>.from(n['data']) : null,
        };
      }).toList();

      if (_user != null) {
        try {
          final box = await Hive.openBox('auth');
          final userId = _user?['id']?.toString() ?? _user?['email']?.toString() ?? 'anonymous';
          final localNotifs = box.get('user_notifications_$userId');
          if (localNotifs is List) {
            final existingIds = Set<String>.from(fetched.map((e) => e['id']?.toString() ?? ''));
            for (final ln in localNotifs) {
              if (ln is Map) {
                final m = Map<String, dynamic>.from(ln);
                final mId = m['id']?.toString() ?? '';
                final mData = m['data'] is Map ? m['data'] as Map : {};
                final mType = (m['type'] ?? mData['type'] ?? '').toString().toUpperCase();
                final mUserId = mData['userId']?.toString();
                final isDup = existingIds.contains(mId) || fetched.any((f) {
                  final fData = f['data'] is Map ? f['data'] as Map : {};
                  final fType = (f['type'] ?? fData['type'] ?? '').toString().toUpperCase();
                  final fTitle = (f['title'] ?? '').toString().trim().toLowerCase();
                  final mTitle = (m['title'] ?? '').toString().trim().toLowerCase();
                  final fDesc = (f['desc'] ?? f['body'] ?? '').toString().trim().toLowerCase();
                  final mDesc = (m['desc'] ?? m['body'] ?? '').toString().trim().toLowerCase();
                  final fUserId = (fData['userId'] ?? fData['senderId'] ?? '').toString().trim().toLowerCase();
                  final mUser = (mUserId ?? mData['senderId'] ?? '').toString().trim().toLowerCase();
                  final fUserName = (fData['userName'] ?? fData['senderName'] ?? '').toString().trim().toLowerCase();
                  final mUserName = (mData['userName'] ?? mData['senderName'] ?? '').toString().trim().toLowerCase();

                  final isMFriend = mType == 'FRIEND_ACCEPTED' || mTitle.contains('friend request accepted') || mDesc.contains('accepted your friend request');
                  final isFFriend = fType == 'FRIEND_ACCEPTED' || fTitle.contains('friend request accepted') || fDesc.contains('accepted your friend request');

                  if (isMFriend && isFFriend) {
                    if (mUser.isNotEmpty && fUserId.isNotEmpty && mUser == fUserId) return true;
                    if (mUserName.isNotEmpty && fUserName.isNotEmpty && mUserName == fUserName) return true;
                  }
                  return fTitle == mTitle && (fDesc == mDesc || fDesc.contains(mUserName) || mDesc.contains(fUserName));
                });
                if (!isDup) {
                  fetched.insert(0, m);
                }
              }
            }
          }

          // Check if any incoming friend requests in notifications need to be in _incomingFriendRequests
          for (final n in fetched) {
            final nData = n['data'];
            if (nData is Map && nData['type'] == 'FRIEND_REQUEST' && n['unread'] == true) {
              final senderId = nData['senderId']?.toString();
              if (senderId != null && !_incomingFriendRequests.any((r) => r['senderId'] == senderId)) {
                _incomingFriendRequests.add({
                  'id': nData['requestId'] ?? n['id'],
                  'senderId': senderId,
                  'senderName': nData['senderName'] ?? n['title'] ?? 'Golfer',
                  'senderClub': nData['senderClub'] ?? 'OpenClub Golfer',
                  'senderHcp': nData['senderHcp'] ?? '0.0',
                  'senderInitial': (nData['senderName']?.toString().isNotEmpty == true)
                      ? nData['senderName'][0].toUpperCase()
                      : 'G',
                  'createdAt': DateTime.now().toIso8601String(),
                });
              }
            }
          }
        } catch (_) {}
      }

      if (mounted) {
        setState(() {
          _notifications = fetched;
          _isLoadingNotifications = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingNotifications = false);
    }
  }

  Future<void> _acceptFriendRequest(Map<String, dynamic> req) async {
    final senderId = req['senderId']?.toString();
    final senderName = req['senderName']?.toString() ?? 'Golfer';
    if (senderId == null || _user == null) return;
    final userId = _user!['id']?.toString() ?? _user!['email']?.toString() ?? 'anonymous';
    final reqId = req['id']?.toString() ?? req['requestId']?.toString() ?? senderId;

    setState(() {
      _acceptedFriendIds.add(senderId);
      _acceptedFriendIds.add(senderName.toLowerCase());
      _incomingFriendRequests.removeWhere((r) => r['senderId'] == senderId || r['id'] == req['id']);
      for (final n in _notifications) {
        if (n['data']?['senderId'] == senderId || n['id'] == req['id']) {
          n['unread'] = false;
        }
      }
    });

    try {
      // Synchronize with database
      _apiClient.dio.post(
        '/friends/respond',
        data: {
          'requestId': reqId,
          'accept': true,
          'userId': userId,
        },
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
    } catch (_) {}

    try {
      final box = await Hive.openBox('auth');
      await box.put('accepted_friends_$userId', _acceptedFriendIds.toList());
      await box.put('incoming_friend_requests_$userId', _incomingFriendRequests);

      // Add to sender's accepted friends
      final senderAcceptedRaw = box.get('accepted_friends_$senderId');
      final senderAccepted = (senderAcceptedRaw is List)
          ? List<String>.from(senderAcceptedRaw.map((e) => e.toString()))
          : <String>[];
      if (!senderAccepted.contains(userId)) {
        senderAccepted.add(userId);
        final currentUserName = (_user!['fullName'] ?? _user!['name'] ?? '').toString();
        if (currentUserName.isNotEmpty) senderAccepted.add(currentUserName.toLowerCase());
        await box.put('accepted_friends_$senderId', senderAccepted);
      }

      // Remove from sender's sent requests
      final senderSentRaw = box.get('sent_friend_requests_$senderId');
      if (senderSentRaw is List) {
        final senderSent = List<String>.from(senderSentRaw.map((e) => e.toString()));
        senderSent.remove(userId);
        await box.put('sent_friend_requests_$senderId', senderSent);
      }

      // Add acceptance notification to sender's mailbox
      final senderNotifs = box.get('user_notifications_$senderId');
      final senderNotifList = (senderNotifs is List) ? List<Map<String, dynamic>>.from(senderNotifs) : <Map<String, dynamic>>[];
      final myName = (_user!['fullName'] ?? _user!['name'] ?? 'A golfer').toString();
      senderNotifList.removeWhere((n) {
        final nData = n['data'] is Map ? n['data'] as Map : {};
        final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
        return nType == 'FRIEND_ACCEPTED' && (nData['userId']?.toString() == userId || nData['userName']?.toString() == myName);
      });
      final nowIso = DateTime.now().toIso8601String();
      senderNotifList.insert(0, {
        'id': 'notif_acc_${DateTime.now().millisecondsSinceEpoch}',
        'title': 'Friend Request Accepted',
        'desc': '$myName accepted your friend request! You are now connected.',
        'body': '$myName accepted your friend request! You are now connected.',
        'time': 'Just now',
        'createdAt': nowIso,
        'unread': true,
        'isRead': false,
        'data': {'type': 'FRIEND_ACCEPTED', 'userId': userId, 'userName': myName},
      });
      await box.put('user_notifications_$senderId', senderNotifList);

      // Notify backend
      _apiClient.dio.post('/notifications/send', data: {
        'recipientId': senderId,
        'title': 'Friend Request Accepted',
        'body': '$myName accepted your friend request! You are now connected.',
        'type': 'SYSTEM',
        'data': {'type': 'FRIEND_ACCEPTED', 'userId': userId},
      }).catchError((_) => null);
    } catch (_) {}

    // Refresh live tournament data to immediately update "Friends Playing Now"
    if (_tournaments.isNotEmpty) {
      final liveTourn = _tournaments.firstWhere(
        (t) => (t['status'] == 'LIVE' || t['status'] == 'IN_PROGRESS' || t['status'] == 'ACTIVE'),
        orElse: () => _tournaments.first,
      );
      if (liveTourn != null && liveTourn['id'] != null) {
        _fetchLiveTournamentData(liveTourn);
      }
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('You and $senderName are now connected!'),
          backgroundColor: const Color(0xFF009A60),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _declineFriendRequest(Map<String, dynamic> req) async {
    final senderId = req['senderId']?.toString();
    if (senderId == null || _user == null) return;
    final userId = _user!['id']?.toString() ?? _user!['email']?.toString() ?? 'anonymous';
    final reqId = req['id']?.toString() ?? req['requestId']?.toString() ?? senderId;

    setState(() {
      _incomingFriendRequests.removeWhere((r) => (senderId.isNotEmpty && r['senderId'] == senderId) || (reqId.isNotEmpty && r['id'] == reqId));
      _notifications.removeWhere((n) {
        final nData = n['data'] is Map ? n['data'] as Map : {};
        if (reqId.isNotEmpty && (n['id'] == reqId || nData['requestId'] == reqId)) return true;
        if (senderId.isNotEmpty && (nData['senderId'] == senderId || n['senderId'] == senderId)) return true;
        return false;
      });
    });

    try {
      // Synchronize with database
      _apiClient.dio.post(
        '/friends/respond',
        data: {
          'requestId': reqId,
          'accept': false,
          'userId': userId,
        },
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
    } catch (_) {}

    try {
      final box = await Hive.openBox('auth');
      await box.put('incoming_friend_requests_$userId', _incomingFriendRequests);
      await box.put('user_notifications_$userId', _notifications);

      // Clean sender's sent requests so sender can retry
      final senderSentRaw = box.get('sent_friend_requests_$senderId');
      if (senderSentRaw is List) {
        final updatedSent = List.from(senderSentRaw)
          ..removeWhere((id) => id.toString() == userId || id.toString() == _user!['email']?.toString());
        await box.put('sent_friend_requests_$senderId', updatedSent);
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Friend request declined.'),
          backgroundColor: Color(0xFF64748B),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _cancelSentFriendRequest(String targetId) async {
    final userId = _user?['id']?.toString() ?? _user?['email']?.toString() ?? 'anonymous';
    setState(() {
      _sentRequestIds.remove(targetId);
    });

    try {
      // Synchronize with database: delete request record and notifications
      _apiClient.dio.delete(
        '/friends/request/$targetId',
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
      _apiClient.dio.post(
        '/friends/cancel',
        data: {'senderId': userId, 'targetUserId': targetId},
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
      _apiClient.dio.delete(
        '/friends/$targetId',
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
    } catch (_) {}

    try {
      final box = await Hive.openBox('auth');
      await box.put('sent_friend_requests_$userId', _sentRequestIds.toList());

      // Clean recipient's incoming requests
      final targetIncoming = box.get('incoming_friend_requests_$targetId');
      if (targetIncoming is List) {
        final updated = List<Map<String, dynamic>>.from(targetIncoming)
          ..removeWhere((r) => (r['senderId'] ?? r['id'] ?? r['userId'])?.toString() == userId);
        await box.put('incoming_friend_requests_$targetId', updated);
      }

      // Clean recipient's notifications
      final targetNotifs = box.get('user_notifications_$targetId');
      if (targetNotifs is List) {
        final updatedNotifs = List<Map<String, dynamic>>.from(targetNotifs)
          ..removeWhere((n) {
            final nData = n['data'] is Map ? n['data'] as Map : {};
            final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
            final nSender = (nData['senderId'] ?? n['senderId'] ?? '').toString();
            return nType == 'FRIEND_REQUEST' && nSender == userId;
          });
        await box.put('user_notifications_$targetId', updatedNotifs);
      }

      // Clean sender's own pending sent notifications
      final senderNotifs = box.get('user_notifications_$userId');
      if (senderNotifs is List) {
        final updatedSenderNotifs = List<Map<String, dynamic>>.from(senderNotifs)
          ..removeWhere((n) {
            final nData = n['data'] is Map ? n['data'] as Map : {};
            final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
            final nTarget = (nData['targetId'] ?? '').toString();
            return nType == 'FRIEND_REQUEST_SENT' && nTarget == targetId;
          });
        await box.put('user_notifications_$userId', updatedSenderNotifs);
        if (mounted) {
          setState(() {
            _notifications.removeWhere((n) {
              final nData = n['data'] is Map ? n['data'] as Map : {};
              final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
              final nTarget = (nData['targetId'] ?? '').toString();
              return nType == 'FRIEND_REQUEST_SENT' && nTarget == targetId;
            });
          });
        }
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Friend request cancelled.'),
          backgroundColor: Color(0xFF64748B),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _openAddFriendsScreen() {
    final Map<String, Map<String, dynamic>> combined = {};
    for (final c in _candidateCompetitors) {
      final id = c['id']?.toString() ?? '';
      if (id.isNotEmpty) combined[id] = c;
    }
    for (final ac in _activeCompetitorsData) {
      final id = ac['id']?.toString() ?? '';
      if (id.isNotEmpty && !combined.containsKey(id)) {
        combined[id] = ac;
      }
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AddFriendsScreen(
          user: _user,
          candidateCompetitors: combined.values.toList(),
          sentRequestIds: _sentRequestIds,
          acceptedFriendIds: _acceptedFriendIds,
          blockedUserIds: _blockedUserIds,
          incomingRequests: _incomingFriendRequests,
          onRequestToggled: _handleToggleFriendRequest,
          onAcceptIncoming: _acceptFriendRequest,
          onDeclineIncoming: _declineFriendRequest,
          onUnfriend: _handleUnfriend,
          onBlock: _handleBlock,
          onUnblock: _handleUnblock,
        ),
      ),
    ).then((_) => setState(() {}));
  }

  Future<void> _handleBlock(Map<String, dynamic> comp) async {
    final compId = comp['id']?.toString() ?? '';
    if (compId.isEmpty || _user == null) return;
    final compName = (comp['name'] as String? ?? 'Golfer').toLowerCase();
    final userId = _user!['id']?.toString() ?? _user!['email']?.toString() ?? 'anonymous';

    setState(() {
      _blockedUserIds.add(compId);
      _acceptedFriendIds.remove(compId);
      _acceptedFriendIds.remove(compName);
      _sentRequestIds.remove(compId);
      _friendsOnCourse.removeWhere((f) => f['id']?.toString() == compId);
    });

    try {
      // Synchronize with database
      _apiClient.dio.post(
        '/friends/block/$compId',
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
    } catch (_) {}

    try {
      final box = await Hive.openBox('auth');
      await box.put('accepted_friends_$userId', _acceptedFriendIds.toList());
      await box.put('sent_friend_requests_$userId', _sentRequestIds.toList());

      // Save to blocked users
      final blockedRaw = box.get('blocked_users_$userId');
      final List blockedList = (blockedRaw is List) ? List.from(blockedRaw) : [];
      if (!blockedList.contains(compId)) {
        blockedList.add(compId);
        await box.put('blocked_users_$userId', blockedList);
      }

      // Also clean in target person's accepted friends
      final targetAcceptedRaw = box.get('accepted_friends_$compId');
      if (targetAcceptedRaw is List) {
        final updated = List.from(targetAcceptedRaw)
          ..removeWhere((id) =>
              id.toString() == userId ||
              id.toString().toLowerCase() == (_user!['fullName'] ?? _user!['name'] ?? '').toString().toLowerCase() ||
              id.toString().toLowerCase() == (_user!['email'] ?? '').toString().toLowerCase());
        await box.put('accepted_friends_$compId', updated);
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${comp['name'] ?? 'Player'} has been blocked.'),
          backgroundColor: const Color(0xFF64748B),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _handleUnblock(Map<String, dynamic> comp) async {
    final compId = comp['id']?.toString() ?? '';
    if (compId.isEmpty || _user == null) return;
    final userId = _user!['id']?.toString() ?? _user!['email']?.toString() ?? 'anonymous';

    setState(() {
      _blockedUserIds.remove(compId);
    });

    try {
      _apiClient.dio.delete(
        '/friends/block/$compId',
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
    } catch (_) {}

    try {
      final box = await Hive.openBox('auth');
      final blockedRaw = box.get('blocked_users_$userId');
      final List blockedList = (blockedRaw is List) ? List.from(blockedRaw) : [];
      blockedList.remove(compId);
      await box.put('blocked_users_$userId', blockedList);
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${comp['name'] ?? 'Player'} has been unblocked.'),
          backgroundColor: const Color(0xFF009A60),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _handleUnfriend(Map<String, dynamic> comp) async {
    final compId = comp['id']?.toString() ?? '';
    if (compId.isEmpty || _user == null) return;
    final compName = (comp['name'] as String? ?? 'Golfer').toLowerCase();
    final userId = _user!['id']?.toString() ?? _user!['email']?.toString() ?? 'anonymous';

    setState(() {
      _acceptedFriendIds.remove(compId);
      _acceptedFriendIds.remove(compName);
    });

    try {
      // Synchronize with database
      _apiClient.dio.delete(
        '/friends/$compId',
        options: Options(headers: {'x-user-id': userId}),
      ).catchError((_) => null);
    } catch (_) {}

    try {
      final box = await Hive.openBox('auth');
      await box.put('accepted_friends_$userId', _acceptedFriendIds.toList());

      // Also clean in target person's accepted friends
      final targetAcceptedRaw = box.get('accepted_friends_$compId');
      if (targetAcceptedRaw is List) {
        final updated = List.from(targetAcceptedRaw)
          ..removeWhere((id) =>
              id.toString() == userId ||
              id.toString().toLowerCase() == (_user!['fullName'] ?? _user!['name'] ?? '').toString().toLowerCase() ||
              id.toString().toLowerCase() == (_user!['email'] ?? '').toString().toLowerCase());
        await box.put('accepted_friends_$compId', updated);
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${comp['name'] ?? 'Player'} removed from friends.'),
          backgroundColor: const Color(0xFF64748B),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _showAddFriendsModal() => _openAddFriendsScreen();

  Future<void> _handleToggleFriendRequest(Map<String, dynamic> comp) async {
    final compId = comp['id']?.toString() ?? '';
    if (compId.isEmpty) return;

    // Strict guard: Blocked users cannot receive friend requests
    if (_blockedUserIds.contains(compId)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You have blocked this player. Unblock them first to connect.'),
            backgroundColor: Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            duration: Duration(seconds: 2),
          ),
        );
      }
      return;
    }

    final compName = (comp['name'] as String? ?? 'Golfer').toLowerCase();
    final isSent = _sentRequestIds.contains(compId);
    final userId = _user?['id']?.toString() ?? _user?['email']?.toString() ?? 'anonymous';
    final userName = (_user?['fullName'] ?? _user?['name'] ?? 'Tournament Player').toString();

    setState(() {
      if (isSent) {
        _sentRequestIds.remove(compId);
        _acceptedFriendIds.remove(compId);
        _acceptedFriendIds.remove(compName);
      } else {
        _sentRequestIds.add(compId);
        _acceptedFriendIds.remove(compId);
        _acceptedFriendIds.remove(compName);
      }
    });

    try {
      if (isSent) {
        _apiClient.dio.delete(
          '/friends/request/$compId',
          options: Options(headers: {'x-user-id': userId}),
        ).catchError((_) => null);
        _apiClient.dio.post(
          '/friends/cancel',
          data: {'senderId': userId, 'targetUserId': compId},
          options: Options(headers: {'x-user-id': userId}),
        ).catchError((_) => null);
        _apiClient.dio.delete(
          '/friends/$compId',
          options: Options(headers: {'x-user-id': userId}),
        ).catchError((_) => null);
      } else {
        _apiClient.dio.post(
          '/friends/request',
          data: {
            'targetUserId': compId,
            'senderId': userId,
          },
          options: Options(headers: {'x-user-id': userId}),
        ).catchError((_) => null);
      }
    } catch (_) {}

    try {
      final box = await Hive.openBox('auth');
      await box.put('sent_friend_requests_' + userId, _sentRequestIds.toList());
      await box.put('accepted_friends_' + userId, _acceptedFriendIds.toList());

      if (!isSent) {
        final existingIncoming = box.get('incoming_friend_requests_' + compId);
        final incomingList = (existingIncoming is List) ? List<Map<String, dynamic>>.from(existingIncoming) : <Map<String, dynamic>>[];
        incomingList.removeWhere((item) => item['senderId'] == userId);
        incomingList.insert(0, {
          'id': 'freq_' + DateTime.now().millisecondsSinceEpoch.toString(),
          'senderId': userId,
          'senderName': userName,
          'senderClub': _user?['club']?['name'] ?? _user?['homeClub'] ?? 'OpenClub Golfer',
          'senderHcp': _user?['handicap']?.toString() ?? '0.0',
          'senderInitial': userName.isNotEmpty ? userName[0].toUpperCase() : 'G',
          'createdAt': DateTime.now().toIso8601String(),
        });
        await box.put('incoming_friend_requests_' + compId, incomingList);

        final existingNotifs = box.get('user_notifications_' + compId);
        final notifList = (existingNotifs is List) ? List<Map<String, dynamic>>.from(existingNotifs) : <Map<String, dynamic>>[];
        final nowIso = DateTime.now().toIso8601String();
        notifList.insert(0, {
          'id': 'notif_freq_' + DateTime.now().millisecondsSinceEpoch.toString(),
          'title': 'Friend Request',
          'desc': userName + ' sent you a friend request to connect on OpenClub.',
          'time': 'Just now',
          'createdAt': nowIso,
          'unread': true,
          'data': {'type': 'FRIEND_REQUEST', 'senderId': userId, 'senderName': userName},
        });
        await box.put('user_notifications_' + compId, notifList);

        final senderNotifs = box.get('user_notifications_' + userId);
        final senderNotifList = (senderNotifs is List) ? List<Map<String, dynamic>>.from(senderNotifs) : <Map<String, dynamic>>[];
        final senderNotifItem = {
          'id': 'notif_sent_' + DateTime.now().millisecondsSinceEpoch.toString(),
          'title': 'Friend Request Sent',
          'desc': 'You sent a friend request to ' + (comp['name'] ?? '') + ' (' + (comp['club'] ?? '') + ' • HCP ' + (comp['hcp'] ?? '') + '). Pending acceptance.',
          'time': 'Just now',
          'createdAt': nowIso,
          'unread': false,
          'data': {
            'type': 'FRIEND_REQUEST_SENT',
            'targetId': compId,
            'targetName': comp['name'],
            'targetClub': comp['club'],
            'targetHcp': comp['hcp'],
            'status': 'PENDING',
          },
        };
        senderNotifList.insert(0, senderNotifItem);
        await box.put('user_notifications_' + userId, senderNotifList);
        if (mounted) {
          setState(() {
            _notifications.insert(0, senderNotifItem);
          });
        }

        _apiClient.dio.post('/notifications/send', data: {
          'recipientId': compId,
          'title': 'Friend Request',
          'body': userName + ' sent you a friend request to connect on OpenClub.',
          'type': 'SYSTEM',
          'data': {'type': 'FRIEND_REQUEST', 'senderId': userId, 'senderName': userName},
        }).catchError((_) => null);

        _apiClient.dio.post('/friends/request', data: {
          'senderId': userId,
          'receiverId': compId,
        }).catchError((_) => null);
      } else {
        // Purge recipient's incoming friend requests
        final existingIncoming = box.get('incoming_friend_requests_' + compId);
        if (existingIncoming is List) {
          final incomingList = List<Map<String, dynamic>>.from(existingIncoming)
            ..removeWhere((item) => (item['senderId'] ?? item['id'] ?? item['userId'])?.toString() == userId);
          await box.put('incoming_friend_requests_' + compId, incomingList);
        }

        // Purge recipient's friend request notifications
        final existingNotifs = box.get('user_notifications_' + compId);
        if (existingNotifs is List) {
          final notifList = List<Map<String, dynamic>>.from(existingNotifs)
            ..removeWhere((n) {
              final nData = n['data'] is Map ? n['data'] as Map : {};
              final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
              final nSender = (nData['senderId'] ?? n['senderId'] ?? '').toString();
              return nType == 'FRIEND_REQUEST' && nSender == userId;
            });
          await box.put('user_notifications_' + compId, notifList);
        }

        // Purge sender's own pending sent notification
        final senderNotifs = box.get('user_notifications_' + userId);
        if (senderNotifs is List) {
          final senderNotifList = List<Map<String, dynamic>>.from(senderNotifs)
            ..removeWhere((n) {
              final nData = n['data'] is Map ? n['data'] as Map : {};
              final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
              final nTarget = (nData['targetId'] ?? '').toString();
              return nType == 'FRIEND_REQUEST_SENT' && nTarget == compId;
            });
          await box.put('user_notifications_' + userId, senderNotifList);
          if (mounted) {
            setState(() {
              _notifications.removeWhere((n) {
                final nData = n['data'] is Map ? n['data'] as Map : {};
                final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
                final nTarget = (nData['targetId'] ?? '').toString();
                return nType == 'FRIEND_REQUEST_SENT' && nTarget == compId;
              });
            });
          }
        }

        // Synchronize cancellation with backend database so it cancels for the recipient
        _apiClient.dio.delete('/friends/request/$compId').catchError((_) => null);
        _apiClient.dio.post('/friends/cancel', data: {
          'senderId': userId,
          'targetUserId': compId,
        }).catchError((_) => null);
        _apiClient.dio.delete('/friends/$compId').catchError((_) => null);
      }
    } catch (_) {}
  }

  void _showActivePlayersModal() {
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
          final onCourseCompetitors = _activeCompetitorsData.where((c) {
            final thru = (c['thru'] as num?)?.toInt() ?? 0;
            final isStarted = thru > 0 || c['score']?.toString()?.startsWith('Hole') == true;
            return isStarted;
          }).toList();
          final filteredList = onCourseCompetitors.where((c) {
            if (query.isEmpty) return true;
            final name = (c['name'] as String).toLowerCase();
            final club = (c['club'] as String).toLowerCase();
            final flight = (c['flight'] as String).toLowerCase();
            final score = (c['score'] as String).toLowerCase();
            return name.contains(query) || club.contains(query) || flight.contains(query) || score.contains(query);
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

                    // Header Row with Icon badge, titles, and close button
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
                            Icons.people_alt_rounded,
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
                                'Active Players',
                                style: GoogleFonts.dmSans(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                'Currently competing on the course',
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
                            child: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF64748B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Unified Soft-Mint Search Input (#f5faf6 / #e1efe5)
                    Container(
                      height: 46,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5FAF6),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE1EFE5)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Row(
                        children: [
                          const Icon(Icons.search_rounded, size: 18, color: Color(0xFF8CA0BA)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: searchController,
                              style: GoogleFonts.dmSans(fontSize: 13, color: const Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                hintText: 'Search player, flight, or hole...',
                                hintStyle: GoogleFonts.dmSans(fontSize: 13, color: const Color(0xFF8CA0BA)),
                                border: InputBorder.none,
                                isDense: true,
                              ),
                              onChanged: (val) => setModalState(() => searchQuery = val),
                            ),
                          ),
                          if (searchQuery.isNotEmpty)
                            GestureDetector(
                              onTap: () {
                                searchController.clear();
                                setModalState(() => searchQuery = '');
                              },
                              child: const Icon(Icons.clear_rounded, size: 16, color: Color(0xFF8CA0BA)),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Section count label
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          searchQuery.isEmpty ? 'ON-COURSE COMPETITORS (${onCourseCompetitors.length})' : 'RESULTS (${filteredList.length})',
                          style: GoogleFonts.dmSans(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                        Row(
                          children: [
                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF009A60), shape: BoxShape.circle)),
                            const SizedBox(width: 4),
                            Text(
                              'Live Telemetry',
                              style: GoogleFonts.dmSans(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF009A60),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Scrollable List of Competitors
                    ConstrainedBox(
                      constraints: BoxConstraints(
                        maxHeight: MediaQuery.of(ctx).size.height * 0.40,
                      ),
                      child: filteredList.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.symmetric(vertical: 32),
                              child: Center(
                                child: Column(
                                  children: [
                                    const Icon(Icons.search_off_rounded, size: 36, color: Color(0xFFCBD5E1)),
                                    const SizedBox(height: 8),
                                    Text(
                                      'No active competitors matching "$searchQuery"',
                                      style: GoogleFonts.dmSans(fontSize: 13, color: const Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : ListView.separated(
                              shrinkWrap: true,
                              itemCount: filteredList.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (context, idx) {
                                final player = filteredList[idx];
                                final toPar = player['toPar'] as int? ?? 0;
                                final toParLabel = toPar < 0 ? '$toPar' : toPar == 0 ? 'E' : '+$toPar';

                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: const Color(0xFFF1F5F9)),
                                  ),
                                  child: Row(
                                    children: [
                                      // Avatar circle with active green dot
                                      Stack(
                                        children: [
                                          Container(
                                            width: 38,
                                            height: 38,
                                            decoration: const BoxDecoration(
                                              shape: BoxShape.circle,
                                              gradient: LinearGradient(
                                                begin: Alignment.topCenter,
                                                end: Alignment.bottomCenter,
                                                colors: [Color(0xFFCBD5E1), Color(0xFF94A3B8)],
                                              ),
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              (player['initials'] as String?) ?? 'P',
                                              style: GoogleFonts.dmSans(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                          Positioned(
                                            bottom: 0,
                                            right: 0,
                                            child: Container(
                                              width: 10,
                                              height: 10,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF009A60),
                                                shape: BoxShape.circle,
                                                border: Border.all(color: Colors.white, width: 1.5),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(width: 10),

                                      // Player Name & On-Course details
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Flexible(
                                                  child: Text(
                                                    player['name'] as String,
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 13.5,
                                                      fontWeight: FontWeight.w700,
                                                      color: const Color(0xFF0F172A),
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                                  decoration: BoxDecoration(
                                                    color: toPar < 0
                                                        ? const Color(0xFFEAF7EE)
                                                        : toPar == 0
                                                            ? const Color(0xFFF1F5F9)
                                                            : const Color(0xFFFFF1F2),
                                                    borderRadius: BorderRadius.circular(5),
                                                    border: Border.all(
                                                      color: toPar < 0
                                                          ? const Color(0xFFC6F0DB)
                                                          : toPar == 0
                                                              ? const Color(0xFFE2E8F0)
                                                              : const Color(0xFFFECDD3),
                                                    ),
                                                  ),
                                                  child: Text(
                                                    toParLabel,
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.w800,
                                                      color: toPar < 0
                                                          ? const Color(0xFF009A60)
                                                          : toPar == 0
                                                              ? const Color(0xFF334155)
                                                              : const Color(0xFFE11D48),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              'Hole ${player['currentHole']} • Thru ${player['thru']} • Gross ${player['gross']}',
                                              style: GoogleFonts.dmSans(
                                                fontSize: 11,
                                                color: const Color(0xFF64748B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Green "Score" Action Button
                                      GestureDetector(
                                        onTap: () {
                                          Navigator.pop(ctx);
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) => PlayerScorecardScreen(competitor: player),
                                            ),
                                          );
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF009A60),
                                            borderRadius: BorderRadius.circular(8),
                                            boxShadow: [
                                              BoxShadow(
                                                color: const Color(0xFF009A60).withOpacity(0.2),
                                                blurRadius: 4,
                                                offset: const Offset(0, 1),
                                              ),
                                            ],
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                'Score',
                                                style: GoogleFonts.dmSans(
                                                  fontSize: 11.5,
                                                  fontWeight: FontWeight.w700,
                                                  color: Colors.white,
                                                ),
                                              ),
                                              const SizedBox(width: 3),
                                              const Icon(Icons.chevron_right_rounded, size: 14, color: Colors.white),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
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

  void _openNotificationsScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => NotificationsScreen(
          user: _user,
          initialNotifications: _notifications,
          onDismissAll: () {
            setState(() {
              for (final n in _notifications) {
                final nType = (n['type'] ?? '').toString().toLowerCase();
                final nData = n['data'] is Map ? n['data'] as Map : {};
                final isFriend = nType.contains('friend') || nData['type'] == 'FRIEND_REQUEST';
                if (!isFriend) {
                  n['unread'] = false;
                }
              }
            });
          },
          onAcceptFriendRequest: (req) => _acceptFriendRequest(req),
          onDeclineFriendRequest: (req) => _declineFriendRequest(req),
        ),
      ),
    ).then((_) => setState(() {}));
  }

  void _showNotificationsModal() => _openNotificationsScreen();
  void _openFriendRequestsScreen() => _openNotificationsScreen();
  void _showFriendRequestsModal() => _openNotificationsScreen();

  void _showMyBookingsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      barrierColor: Colors.black.withOpacity(0.65),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
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

                    // Header Row with Icon badge, titles, and close button
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF7EE),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFC6F0DB)),
                          ),
                          child: const Icon(
                            Icons.calendar_month_outlined,
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
                                'My Bookings',
                                style: GoogleFonts.dmSans(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                'Sessions & lessons booked with a Pro',
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
                            child: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF64748B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Bookings List
                    ConstrainedBox(
                      constraints: BoxConstraints(
                        maxHeight: MediaQuery.of(context).size.height * 0.55,
                      ),
                      child: _proBookings.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: Column(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: const Icon(Icons.calendar_month_outlined, color: Color(0xFF64748B), size: 24),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      'No active bookings with a Pro',
                                      style: GoogleFonts.dmSans(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Book a PGA certified professional for private coaching',
                                      style: GoogleFonts.dmSans(
                                        fontSize: 12,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : ListView.separated(
                              shrinkWrap: true,
                              itemCount: _proBookings.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, idx) {
                                final b = _proBookings[idx];
                                return Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.02),
                                        blurRadius: 4,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Top row: Pro name and status
                                      Row(
                                        children: [
                                          Container(
                                            width: 38,
                                            height: 38,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEAF7EE),
                                              shape: BoxShape.circle,
                                              border: Border.all(color: const Color(0xFFC6F0DB)),
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              'MD',
                                              style: GoogleFonts.dmSans(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w800,
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
                                                  b['proName'] ?? 'Club Pro',
                                                  style: GoogleFonts.dmSans(
                                                    fontSize: 13.5,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(0xFF0F172A),
                                                  ),
                                                ),
                                                Text(
                                                  '${b['proRole'] ?? 'Teaching Pro'} • ${b['proClub'] ?? 'OpenClub'}',
                                                  style: GoogleFonts.dmSans(
                                                    fontSize: 11,
                                                    color: const Color(0xFF64748B),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEAF7EE),
                                              borderRadius: BorderRadius.circular(20),
                                              border: Border.all(color: const Color(0xFFC6F0DB)),
                                            ),
                                            child: Text(
                                              (b['status'] ?? 'CONFIRMED').toString(),
                                              style: GoogleFonts.dmSans(
                                                fontSize: 9.5,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFF009A60),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF8FAF9),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: const Color(0xFFE8F1EB)),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              b['serviceName'] ?? 'Golf Lesson',
                                              style: GoogleFonts.dmSans(
                                                fontSize: 12.5,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF0F172A),
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                const Icon(Icons.access_time_rounded, size: 13, color: Color(0xFF009A60)),
                                                const SizedBox(width: 4),
                                                Text(
                                                  '${b['date']} • ${b['time']}',
                                                  style: GoogleFonts.dmSans(fontSize: 11.5, color: const Color(0xFF475569)),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 2),
                                            Row(
                                              children: [
                                                const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF8CA0BA)),
                                                const SizedBox(width: 4),
                                                Expanded(
                                                  child: Text(
                                                    b['location'] ?? 'Academy',
                                                    style: GoogleFonts.dmSans(fontSize: 11, color: const Color(0xFF64748B)),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: GestureDetector(
                                              onTap: () {
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(
                                                    content: Text('Session on ${b['date']} synced to calendar.'),
                                                    backgroundColor: const Color(0xFF009A60),
                                                    behavior: SnackBarBehavior.floating,
                                                  ),
                                                );
                                              },
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFEAF7EE),
                                                  borderRadius: BorderRadius.circular(10),
                                                ),
                                                alignment: Alignment.center,
                                                child: Text(
                                                  'Add to Calendar',
                                                  style: GoogleFonts.dmSans(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(0xFF009A60),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          GestureDetector(
                                            onTap: () {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Contacting ${b['proName']} for reschedule options.'),
                                                  behavior: SnackBarBehavior.floating,
                                                ),
                                              );
                                            },
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              alignment: Alignment.center,
                                              child: Text(
                                                'Reschedule',
                                                style: GoogleFonts.dmSans(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w700,
                                                  color: const Color(0xFF475569),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                    ),
                    const SizedBox(height: 14),

                    // Book Another Session Button
                    GestureDetector(
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('PGA Pro booking catalog is active.'),
                            backgroundColor: Color(0xFF009A60),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF009A60),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF009A60).withOpacity(0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 6),
                            Text(
                              'Book Another Session with a Pro',
                              style: GoogleFonts.dmSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
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
          );
        },
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
        color: const Color(0xFFF4F6F3),
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
    setState(() {
      _sentRequestIds.clear();
      _acceptedFriendIds.clear();
      _friendsOnCourse.clear();
    });
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
    final firstName = _user?['firstName']?.toString().trim().isNotEmpty == true
        ? _user!['firstName'].toString().trim()
        : (nameParts.isNotEmpty ? nameParts[0] : 'Tournament Player');
    final initials = nameParts.length >= 2
        ? '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase()
        : (displayName.isNotEmpty ? displayName.substring(0, displayName.length.clamp(1, 2)).toUpperCase() : 'TP');
    final dynamic rawAvatar = _user?['profilePhoto'] ?? _user?['avatar'] ?? _user?['photo'] ?? _user?['profilePicture'] ?? _user?['image'];
    final bool hasDisplayPicture = rawAvatar != null && 
        rawAvatar.toString().trim().isNotEmpty && 
        (rawAvatar.toString().startsWith('http') || 
         rawAvatar.toString().startsWith('assets/') || 
         rawAvatar.toString().startsWith('data:image') ||
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
      backgroundColor: const Color(0xFFF4F6F3), // Daylight mode clean background (matches web dashboard)
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
                                      onPressed: _openAddFriendsScreen,
                                      tooltip: 'Add Friends',
                                    ),
                                  ),
                                  const SizedBox(width: 14),

                                  // Notification Bell with Badge
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
                                          if (_incomingFriendRequests.isNotEmpty)
                                            Positioned(
                                              top: -3,
                                              right: -6,
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFEF4444),
                                                  borderRadius: BorderRadius.circular(10),
                                                  border: Border.all(
                                                    color: Colors.white,
                                                    width: 1.2,
                                                  ),
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    '${_incomingFriendRequests.length}',
                                                    style: GoogleFonts.dmSans(
                                                      color: Colors.white,
                                                      fontSize: 9.5,
                                                      fontWeight: FontWeight.w800,
                                                      height: 1.0,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            )
                                          else if (_notifications.any((n) => n['unread'] == true))
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
                                      onPressed: _openNotificationsScreen,
                                      tooltip: 'Notifications',
                                    ),
                                  ),
                                  const SizedBox(width: 14),

                                  // My Bookings Icon (Displays bookings made with a Pro)
                                  SizedBox(
                                    width: 32,
                                    height: 32,
                                    child: Stack(
                                      clipBehavior: Clip.none,
                                      children: [
                                        IconButton(
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                          icon: const Icon(
                                            Icons.calendar_month_outlined,
                                            color: Colors.white,
                                            size: 21,
                                          ),
                                          onPressed: _showMyBookingsModal,
                                          tooltip: 'My Bookings (Pro Sessions)',
                                        ),
                                        if (_proBookings.isNotEmpty)
                                          Positioned(
                                            top: -3,
                                            right: -5,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF009A60),
                                                borderRadius: BorderRadius.circular(10),
                                                border: Border.all(
                                                  color: const Color(0xFF0A3D27),
                                                  width: 1.2,
                                                ),
                                              ),
                                              child: Center(
                                                child: Text(
                                                  '${_proBookings.length}',
                                                  style: GoogleFonts.dmSans(
                                                    color: Colors.white,
                                                    fontSize: 9.5,
                                                    fontWeight: FontWeight.w800,
                                                    height: 1.0,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                      ],
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
                                                  : rawAvatar.toString().startsWith('data:image')
                                                      ? Builder(
                                                          builder: (_) {
                                                            try {
                                                              final commaIdx = rawAvatar.toString().indexOf(',');
                                                              final base64Str = commaIdx != -1 ? rawAvatar.toString().substring(commaIdx + 1) : rawAvatar.toString();
                                                              return Image.memory(
                                                                base64Decode(base64Str),
                                                                fit: BoxFit.cover,
                                                                errorBuilder: (_, __, ___) => Center(
                                                                  child: Text(initials, style: GoogleFonts.dmSans(fontSize: 19, fontWeight: FontWeight.w800, color: Colors.white)),
                                                                ),
                                                              );
                                                            } catch (_) {
                                                              return Center(child: Text(initials, style: GoogleFonts.dmSans(fontSize: 19, fontWeight: FontWeight.w800, color: Colors.white)));
                                                            }
                                                          },
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
                                            firstName,
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
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(26),
                                  child: Stack(
                                    children: [
                                      Positioned.fill(
                                        child: CustomPaint(
                                          painter: _BookAProPatternPainter(),
                                        ),
                                      ),
                                      Padding(
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
                                                      fontSize: 17,
                                                      fontWeight: FontWeight.w800,
                                                      letterSpacing: -0.3,
                                                    ),
                                                    maxLines: 1,
                                                    softWrap: false,
                                                  ),
                                                  const SizedBox(height: 1),
                                                  Text(
                                                    'Book the club pro',
                                                    style: GoogleFonts.dmSans(
                                                      color: const Color(0xFF64748B),
                                                      fontSize: 10,
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
                                                      fontSize: 10,
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
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(26),
                                  child: Stack(
                                    children: [
                                      Positioned.fill(
                                        child: CustomPaint(
                                          painter: _HcpPatternPainter(),
                                        ),
                                      ),
                                      Padding(
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
                                                      fontSize: 17,
                                                      fontWeight: FontWeight.w800,
                                                      letterSpacing: -0.3,
                                                    ),
                                                    maxLines: 1,
                                                    softWrap: false,
                                                  ),
                                                  const SizedBox(height: 1),
                                                  Text(
                                                    'Your verified',
                                                    style: GoogleFonts.dmSans(
                                                      color: const Color(0xFF64748B),
                                                      fontSize: 10,
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
                                                      fontSize: 10,
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
                        // Active In-Progress Round Card (Displayed when player has an unfinished round)
                        if (_activeRound != null) ...[
                          Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF052417),
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(color: const Color(0xFF0D3826)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.20),
                                  blurRadius: 24,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(22),
                              child: Stack(
                                children: [
                                  Positioned.fill(
                                    child: CustomPaint(
                                      painter: _ActiveRoundCoursePatternPainter(),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(18),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Top Row: Squircle Hole Badge + Details
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            // Squircle Hole Badge (Clean, without top-right dot)
                                            Container(
                                              width: 66,
                                              height: 86,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF0B3523),
                                                borderRadius: BorderRadius.circular(18),
                                                border: Border.all(color: const Color(0xFF16603E).withOpacity(0.7)),
                                              ),
                                              child: Column(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  Text(
                                                    'HOLE',
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 9.5,
                                                      fontWeight: FontWeight.w700,
                                                      color: const Color(0xFF10B981).withOpacity(0.9),
                                                      letterSpacing: 1.2,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    '${_activeRound!['holeNumber']}',
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 28,
                                                      fontWeight: FontWeight.w900,
                                                      color: const Color(0xFF10B981),
                                                      height: 1.0,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(width: 14),

                                            // Right Details Column
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  // Row 1: LIVE Badge + Day Info + Relocated Leaderboard Link
                                                  Row(
                                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                    children: [
                                                      Row(
                                                        children: [
                                                          const _BlinkingLiveBadge(),
                                                          const SizedBox(width: 8),
                                                          Text(
                                                            (_activeRound!['dayText'] as String?) ?? 'ROUND 2',
                                                            style: GoogleFonts.dmSans(
                                                              fontSize: 11,
                                                              fontWeight: FontWeight.w700,
                                                              color: const Color(0xFF8FAEA2),
                                                              letterSpacing: 0.5,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                      GestureDetector(
                                                        onTap: () {
                                                          ScaffoldMessenger.of(context).showSnackBar(
                                                            const SnackBar(
                                                              content: Text('Opening tournament leaderboard...'),
                                                              backgroundColor: Color(0xFF009A60),
                                                            ),
                                                          );
                                                        },
                                                        child: Container(
                                                          width: 28,
                                                          height: 28,
                                                          decoration: BoxDecoration(
                                                            color: const Color(0xFF0B3523),
                                                            shape: BoxShape.circle,
                                                            border: Border.all(color: const Color(0xFF16603E), width: 1),
                                                          ),
                                                          child: const Icon(
                                                            Icons.emoji_events_rounded,
                                                            color: Color(0xFF10B981),
                                                            size: 15,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 5),

                                                  // Row 2: Tournament Name (Full display)
                                                  Text(
                                                    toTitleCase(_activeRound!['tournamentName'] as String),
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.w700,
                                                      color: Colors.white,
                                                      letterSpacing: -0.2,
                                                    ),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                  if (_activeRound!['courseName'] != null && (_activeRound!['courseName'] as String).isNotEmpty) ...[
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      _activeRound!['courseName'] as String,
                                                      style: GoogleFonts.dmSans(
                                                        fontSize: 12,
                                                        fontWeight: FontWeight.w600,
                                                        color: const Color(0xFF10B981),
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ],
                                                  const SizedBox(height: 3),

                                                  // Row 4: Hole Information (Par & Distance)
                                                  Text(
                                                    ((_activeRound!['holeInfo'] as String?) ?? 'Par 4 • 345 yds').replaceAll('yards', 'yds'),
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 11.5,
                                                      fontWeight: FontWeight.w500,
                                                      color: const Color(0xFF8FAEA2),
                                                    ),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                  const SizedBox(height: 6),

                                                  // Row 4: Flight Avatars + Inactivity Status
                                                  Builder(
                                                    builder: (context) {
                                                      final rawPlayers = ((_activeRound!['groupPlayers'] as List<dynamic>?) ?? [])
                                                          .cast<Map<String, dynamic>>();

                                                      final currentUserId = _user?['id']?.toString();
                                                      final currentUserEmail = _user?['email']?.toString()?.toLowerCase();
                                                      final currentUserName = (_user?['fullName'] ?? _user?['name'] ?? 
                                                          ((_user?['firstName'] != null && _user?['lastName'] != null)
                                                              ? '${_user!['firstName']} ${_user!['lastName']}'.trim()
                                                              : (_user?['firstName'] ?? ''))).toString().toLowerCase().trim();

                                                      final groupPlayers = rawPlayers.where((p) {
                                                        final pId = p['id']?.toString();
                                                        final pEmail = p['email']?.toString()?.toLowerCase();
                                                        final pName = p['name']?.toString()?.toLowerCase();
                                                        if (currentUserId != null && currentUserId == pId) return false;
                                                        if (currentUserEmail != null && currentUserEmail == pEmail) return false;
                                                        if (currentUserName.isNotEmpty && currentUserName == pName) return false;
                                                        if (currentUserName.contains('adediran') && pName != null && pName.contains('adediran')) return false;
                                                        if (currentUserName.contains('obadina') && pName != null && pName.contains('obadina')) return false;
                                                        if (_user == null && (pName == 'isabella wilson' || p['initials'] == 'IW')) return false;
                                                        return true;
                                                      }).take(3).toList();

                                                      final double avatarSize = 28.0;
                                                      final double overlap = 19.0;
                                                      final double stackWidth = groupPlayers.isEmpty
                                                          ? avatarSize
                                                          : (avatarSize + (groupPlayers.length - 1) * overlap);

                                                      return Row(
                                                        children: [
                                                          SizedBox(
                                                            width: stackWidth,
                                                            height: avatarSize,
                                                            child: Stack(
                                                              children: [
                                                                for (int i = 0; i < groupPlayers.length; i++)
                                                                  Positioned(
                                                                    left: i * overlap,
                                                                    child: Container(
                                                                      width: avatarSize,
                                                                      height: avatarSize,
                                                                      decoration: BoxDecoration(
                                                                        shape: BoxShape.circle,
                                                                        color: const Color(0xFF0E3D27),
                                                                        border: Border.all(color: const Color(0xFF052417), width: 1.5),
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            color: Colors.black.withOpacity(0.20),
                                                                            blurRadius: 3,
                                                                            offset: const Offset(0, 1),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                      child: ClipOval(
                                                                        child: _buildFlightPlayerAvatar(
                                                                          groupPlayers[i]['name'] as String? ?? 'Golfer',
                                                                          groupPlayers[i]['avatar'] as String?,
                                                                          groupPlayers[i]['initials'] as String?,
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ),
                                                              ],
                                                            ),
                                                          ),
                                                          const SizedBox(width: 8),
                                                          if (_hasInactivityWarning)
                                                            Text(
                                                              'INACTIVE FOR 30 MINUTES',
                                                              style: GoogleFonts.dmSans(
                                                                fontSize: 10,
                                                                fontWeight: FontWeight.w700,
                                                                color: const Color(0xFFF59E0B),
                                                                letterSpacing: 0.5,
                                                              ),
                                                            )
                                                          else
                                                            Text(
                                                              _activeRound?['flightText']
                                                                      ?.toString()
                                                                      .replaceAll(RegExp(r'\s*•\s*Players in Flight', caseSensitive: false), '')
                                                                      .replaceAll(RegExp(r'Players in Flight', caseSensitive: false), '')
                                                                      .trim() ?? 'Flight 1',
                                                              style: GoogleFonts.dmSans(
                                                                fontSize: 11.5,
                                                                fontWeight: FontWeight.w500,
                                                                color: const Color(0xFFD1F2DE),
                                                              ),
                                                            ),
                                                        ],
                                                      );
                                                    },
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),


                                        const SizedBox(height: 14),
                                        const Divider(color: Color(0xFF0F3D2A), height: 1),
                                        const SizedBox(height: 14),

                                        // Bottom Row: Resume Play + Forfeit (Consistent with Featured Tournament Card)
                                        Row(
                                          children: [
                                            Expanded(
                                              flex: 7,
                                              child: GestureDetector(
                                                onTap: () async {
                                                  try {
                                                    final roundKey = _activeRound?['id'] ?? 'active_round';
                                                    final box = await Hive.openBox('rounds');
                                                    await box.put('round_started_at_$roundKey', DateTime.now().millisecondsSinceEpoch);
                                                    await box.put('round_notified_$roundKey', false);
                                                  } catch (_) {}
                                                  if (mounted) setState(() => _hasInactivityWarning = false);
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text('Resuming score entry for ${_activeRound!['tournamentName']} (Hole ${_activeRound!['holeNumber']})...'),
                                                      backgroundColor: const Color(0xFF009A60),
                                                    ),
                                                  );
                                                  Navigator.push(
                                                    context,
                                                    MaterialPageRoute(
                                                      builder: (_) => const ScoringScreen(tournamentId: 't1', courseId: 'c1'),
                                                    ),
                                                  );
                                                },
                                                child: Container(
                                                  height: 40,
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
                                                        'Resume Play',
                                                        style: GoogleFonts.dmSans(
                                                          fontSize: 13,
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
                                            Expanded(
                                              flex: 3,
                                              child: GestureDetector(
                                                onTap: () {
                                                  showModalBottomSheet(
                                                    context: context,
                                                    backgroundColor: Colors.transparent,
                                                    builder: (ctx) => Center(
                                                      child: ConstrainedBox(
                                                        constraints: const BoxConstraints(maxWidth: 440),
                                                        child: Container(
                                                          padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
                                                          decoration: const BoxDecoration(
                                                            color: Colors.white,
                                                            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                                                          ),
                                                          child: Column(
                                                            mainAxisSize: MainAxisSize.min,
                                                            children: [
                                                              Container(
                                                                width: 44,
                                                                height: 4,
                                                                decoration: BoxDecoration(
                                                                  color: const Color(0xFFE2E8F0),
                                                                  borderRadius: BorderRadius.circular(2),
                                                                ),
                                                              ),
                                                              const SizedBox(height: 20),
                                                              // Centered Squircle Warning Badge
                                                              Container(
                                                                width: 64,
                                                                height: 64,
                                                                decoration: BoxDecoration(
                                                                  color: const Color(0xFFFFF1F2),
                                                                  borderRadius: BorderRadius.circular(22),
                                                                  border: Border.all(color: const Color(0xFFFFE4E6)),
                                                                ),
                                                                child: const Icon(Icons.warning_rounded, color: Color(0xFFDC2626), size: 32),
                                                              ),
                                                              const SizedBox(height: 18),
                                                              // Centered Title
                                                              Text(
                                                                'Withdraw from Round?',
                                                                style: GoogleFonts.dmSans(
                                                                  fontSize: 22,
                                                                  fontWeight: FontWeight.w900,
                                                                  color: const Color(0xFF0F172A),
                                                                  letterSpacing: -0.4,
                                                                ),
                                                                textAlign: TextAlign.center,
                                                              ),
                                                              const SizedBox(height: 10),
                                                              // Centered Body with bold tournament name
                                                              RichText(
                                                                textAlign: TextAlign.center,
                                                                text: TextSpan(
                                                                  style: GoogleFonts.dmSans(
                                                                    fontSize: 13.5,
                                                                    color: const Color(0xFF64748B),
                                                                    height: 1.45,
                                                                  ),
                                                                  children: [
                                                                    const TextSpan(text: 'Forfeiting now will disqualify your score from the '),
                                                                    TextSpan(
                                                                      text: _activeRound?['tournamentName'] ?? 'the tournament',
                                                                      style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                                                                    ),
                                                                    const TextSpan(text: '. This action cannot be undone.'),
                                                                  ],
                                                                ),
                                                              ),
                                                              const SizedBox(height: 24),
                                                              // Button 1: Yes, Forfeit Match
                                                              SizedBox(
                                                                width: double.infinity,
                                                                height: 48,
                                                                child: ElevatedButton(
                                                                  style: ElevatedButton.styleFrom(
                                                                    backgroundColor: const Color(0xFFDC2626),
                                                                    foregroundColor: Colors.white,
                                                                    elevation: 0,
                                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                                                  ),
                                                                  onPressed: () {
                                                                    final id = _activeRound?['id'];
                                                                    if (id != null) {
                                                                      _forfeitedRoundIds.add(id);
                                                                      setState(() => _activeRound = null);
                                                                    }
                                                                    Navigator.pop(ctx);
                                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                                      const SnackBar(content: Text('Withdrawn from tournament round.')),
                                                                    );
                                                                  },
                                                                  child: Text(
                                                                    'Yes, Forfeit Match',
                                                                    style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w700),
                                                                  ),
                                                                ),
                                                              ),
                                                              const SizedBox(height: 12),
                                                              // Button 2: Cancel, Stay in Play
                                                              SizedBox(
                                                                width: double.infinity,
                                                                height: 48,
                                                                child: ElevatedButton(
                                                                  style: ElevatedButton.styleFrom(
                                                                    backgroundColor: const Color(0xFFF1F5F9),
                                                                    foregroundColor: const Color(0xFF0F172A),
                                                                    elevation: 0,
                                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                                                  ),
                                                                  onPressed: () => Navigator.pop(ctx),
                                                                  child: Text(
                                                                    'Cancel, Stay in Play',
                                                                    style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w700),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  );
                                                },
                                                child: Container(
                                                  height: 40,
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFF0C241B),
                                                    borderRadius: BorderRadius.circular(12),
                                                    border: Border.all(color: const Color(0xFF1A3F30)),
                                                    boxShadow: [
                                                      BoxShadow(
                                                        color: Colors.black.withOpacity(0.2),
                                                        blurRadius: 6,
                                                        offset: const Offset(0, 2),
                                                      ),
                                                    ],
                                                  ),
                                                  alignment: Alignment.center,
                                                  child: Text(
                                                    'Forfeit',
                                                    style: GoogleFonts.dmSans(
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.w700,
                                                      color: const Color(0xFFFB7185),
                                                    ),
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
                          ),
                        ],

                        // Section Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Friends Playing Now',
                              style: GoogleFonts.dmSans(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                                letterSpacing: -0.2,
                              ),
                            ),
                            if (_friendsOnCourse.isNotEmpty)
                              GestureDetector(
                                onTap: _showActivePlayersModal,
                                child: Text(
                                  'View Players',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF009A60),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        if (_friendsOnCourse.isNotEmpty)
                          // Circular Display Row (No Images per user requirement)
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Circle 1: OpenClub Brand / Invite Action
                                GestureDetector(
                                  onTap: _showAddFriendsModal,
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
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
                                      const SizedBox(height: 6),
                                      Text(
                                        'Invite',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF009A60),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 14),

                                // Friends on Course Avatars with Player First Name Underneath (5 Max)
                                ..._friendsOnCourse.take(5).map((f) {
                                  final friendFirstName = (f['name'] as String).split(' ').first;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 14),
                                    child: GestureDetector(
                                      onTap: () {
                                        final player = _activeCompetitorsData.firstWhere(
                                          (c) => (c['name'] as String).toLowerCase() == (f['name'] as String).toLowerCase(),
                                          orElse: () => _activeCompetitorsData.first,
                                        );
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => PlayerScorecardScreen(competitor: player),
                                          ),
                                        );
                                      },
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Stack(
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
                                          const SizedBox(height: 6),
                                          SizedBox(
                                            width: 56,
                                            child: Text(
                                              friendFirstName,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.dmSans(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: const Color(0xFF334155),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ],
                            ),
                          )
                        else
                          // Rounded Dashed Empty Display (When no user is on the course)
                          GestureDetector(
                            onTap: _showAddFriendsModal,
                            child: CustomPaint(
                              painter: DashedBorderPainter(
                                color: const Color(0xFFC6F0DB),
                                strokeWidth: 1.8,
                                borderRadius: 22,
                              ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEAF7EE).withOpacity(0.6),
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
                                            'No friends on the course yet',
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
                                            'Invite fellow golfers or join active rounds',
                                            style: GoogleFonts.dmSans(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w400,
                                              color: const Color(0xFF64748B),
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
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                  letterSpacing: -0.2,
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

                        // Horizontal Carousel or Full-Width Compact Empty State
                        _tournaments.isNotEmpty
                            ? SizedBox(
                                height: 230,
                                child: ListView(
                                  controller: _featuredTournamentsScrollController,
                                  scrollDirection: Axis.horizontal,
                                  padding: const EdgeInsets.symmetric(horizontal: 18),
                                  physics: const BouncingScrollPhysics(),
                                  children: _buildFeaturedTournamentCards(),
                                ),
                              )
                            : Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 18),
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(22),
                                    border: Border.all(color: const Color(0xFFE1EFE5)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.04),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEAF7EE),
                                          shape: BoxShape.circle,
                                          border: Border.all(color: const Color(0xFFC6F0DB)),
                                        ),
                                        child: const Center(
                                          child: Icon(Icons.emoji_events_outlined, color: Color(0xFF009A60), size: 22),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        'No Active Tournaments',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 14.5,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF0F172A),
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 16),
                                        child: Text(
                                          'Stay on the lookout for upcoming tournaments and club championship events.',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.dmSans(
                                            fontSize: 12,
                                            color: const Color(0xFF64748B),
                                            height: 1.4,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                      ],
                    ),
                  ),

                  // --- 3.5 ROUNDS SECTION ---
                  _buildRoundsSection(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoundsSection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Rounds (${_recentRounds.length})',
                style: GoogleFonts.dmSans(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                  letterSpacing: -0.3,
                ),
              ),
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Viewing All Round Scorecards'),
                      backgroundColor: Color(0xFF009A60),
                    ),
                  );
                },
                child: Text(
                  'View History',
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF009A60),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Card 1: Upcoming Rounds (Empty State)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Dashed Badge with count
                CustomPaint(
                  painter: DashedBorderPainter(
                    color: const Color(0xFF009A60),
                    borderRadius: 18.0,
                    strokeWidth: 2.0,
                    dashWidth: 4.5,
                    dashSpace: 3.5,
                  ),
                  child: Container(
                    width: 56,
                    height: 56,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAF7EE),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Text(
                      '${_recentRounds.length}',
                      style: GoogleFonts.dmSans(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF009A60),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Middle Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Upcoming Rounds',
                        style: GoogleFonts.dmSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'No rounds scheduled yet',
                        style: GoogleFonts.dmSans(
                          fontSize: 12.5,
                          color: const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ),

                // Plus Button
                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Schedule a new tournament or practice round'),
                        backgroundColor: Color(0xFF009A60),
                      ),
                    );
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFF009A60),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.add_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Card 2: Recent Completed Round - only shown when there's a recent round
          if (_recentRounds.isNotEmpty) ...[
            const SizedBox(height: 12),
            ..._recentRounds.map((round) => GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${round['clubName'] ?? 'Golf Round'} • Net Score ${round['netScore'] ?? 72}'),
                    backgroundColor: const Color(0xFF009A60),
                  ),
                );
              },
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: CustomPaint(
                          painter: _ScorecardPatternPainter(),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            // Mint Date Badge
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: const Color(0xFFEAF7EE),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: const Color(0xFFC6F0DB)),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    round['month'] ?? 'OCT',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF009A60),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  Text(
                                    round['day'] ?? '12',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      color: const Color(0xFF009A60),
                                      height: 1.05,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),

                            // Middle Info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    round['clubName'] ?? 'Ikoyi Club 1938',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Text(
                                        '${round['holes'] ?? 18} Holes',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 12.5,
                                          color: const Color(0xFF94A3B8),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      const Text(
                                        '•',
                                        style: TextStyle(color: Color(0xFFCBD5E1)),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        round['status'] ?? 'COMPLETED',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF009A60),
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            // Right Score Column
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${round['netScore'] ?? 72}',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: const Color(0xFF0F172A),
                                    letterSpacing: -0.5,
                                    height: 1.0,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'NET SCORE',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF94A3B8),
                                    letterSpacing: 0.5,
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
              ),
            )),
          ],
        ],
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
      return const [];
    }

    for (int i = 0; i < displayList.length; i++) {
      final t = displayList[i] as Map;
      final name = toTitleCase((t['name'] as String?) ?? 'Championship Tournament');

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
          venue: (t['club']?['name'] ?? t['venue'] ?? t['location'] ?? 'Championship Course').toString(),
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
    final clean = toTitleCase(rawTitle);
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
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                        height: 1.15,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                    if (titleLines['line2'] != null && titleLines['line2']!.isNotEmpty)
                                      Text(
                                        titleLines['line2']!,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.dmSans(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                          height: 1.15,
                                          letterSpacing: -0.2,
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
    final firstName = _user?['firstName'] ?? 'Tournament';
    final lastName = _user?['lastName'] ?? 'Player';
    final email = _user?['email'] ?? 'player@openclub.app';

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
              leading: const Icon(Icons.calendar_month_outlined, color: Color(0xFF009A60), size: 20),
              title: Text('My Pro Bookings', style: GoogleFonts.dmSans(fontSize: 13.5, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500)),
              trailing: _proBookings.isNotEmpty
                  ? Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF7EE),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${_proBookings.length} Active',
                        style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF009A60)),
                      ),
                    )
                  : null,
              onTap: () {
                Navigator.pop(context);
                _showMyBookingsModal();
              },
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

class _BlinkingLiveBadge extends StatefulWidget {
  const _BlinkingLiveBadge({Key? key}) : super(key: key);

  @override
  State<_BlinkingLiveBadge> createState() => _BlinkingLiveBadgeState();
}

class _BlinkingLiveBadgeState extends State<_BlinkingLiveBadge> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.25, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
          color: const Color(0xFFEF4444),
          borderRadius: BorderRadius.circular(5),
        ),
        child: Text(
          'LIVE',
          style: GoogleFonts.dmSans(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            letterSpacing: 0.8,
          ),
        ),
      ),
    );
  }
}

/// Custom painter for Book a Pro swing velocity trajectory arc pattern
class _BookAProPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final arcPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.14)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1;

    final path = Path()
      ..moveTo(-10, size.height * 0.9)
      ..quadraticBezierTo(size.width * 0.45, size.height * 0.65, size.width * 0.92, size.height * 0.18);
    canvas.drawPath(path, arcPaint);

    // Target concentric impact arcs
    final center = Offset(size.width * 0.88, size.height * 0.28);
    final circlePaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    canvas.drawCircle(center, 14, circlePaint);
    circlePaint.color = const Color(0xFF009A60).withOpacity(0.07);
    canvas.drawCircle(center, 26, circlePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom painter for HCP USGA slope rating diamond lattice pattern
class _HcpPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final slopePaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.14)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final path = Path()
      ..moveTo(-5, size.height * 0.72)
      ..lineTo(size.width * 0.35, size.height * 0.58)
      ..lineTo(size.width * 0.65, size.height * 0.38)
      ..lineTo(size.width + 10, size.height * 0.22);
    canvas.drawPath(path, slopePaint);

    final dotPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.18)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(size.width * 0.35, size.height * 0.58), 2.5, dotPaint);
    canvas.drawCircle(Offset(size.width * 0.65, size.height * 0.38), 3.0, dotPaint);

    // Subtle diamond marks
    final diamondPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.7;
    for (double x = 10; x < size.width; x += 32) {
      final dPath = Path()
        ..moveTo(x, size.height * 0.82)
        ..lineTo(x + 5, size.height * 0.82 - 5)
        ..lineTo(x + 10, size.height * 0.82)
        ..lineTo(x + 5, size.height * 0.82 + 5)
        ..close();
      canvas.drawPath(dPath, diamondPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom painter for Scorecard Completed Round ledger ruler & pin flag watermark
class _ScorecardPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    // Horizontal ledger rule
    canvas.drawLine(Offset(0, size.height * 0.5), Offset(size.width, size.height * 0.5), linePaint);

    // Flagstick pin watermark behind net score
    final pinX = size.width - 32;
    final pinPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawLine(Offset(pinX, 10), Offset(pinX, size.height - 12), pinPaint);

    final flagPath = Path()
      ..moveTo(pinX, 12)
      ..lineTo(pinX - 14, 18)
      ..lineTo(pinX, 24)
      ..close();
    final flagFill = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.10)
      ..style = PaintingStyle.fill;
    canvas.drawPath(flagPath, flagFill);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom painter for Active In-Progress Tournament Round Golf Course Topographic Contours & Green Complex Plateau
class _ActiveRoundCoursePatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Ambient radial glows
    final glowPaint1 = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.64, -0.36),
        radius: 0.85,
        colors: [
          const Color(0xFF10B981).withOpacity(0.24),
          const Color(0xFF10B981).withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), glowPaint1);

    final glowPaint2 = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0.76, 0.45),
        radius: 0.70,
        colors: [
          const Color(0xFF059669).withOpacity(0.16),
          const Color(0xFF059669).withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), glowPaint2);

    // Organic Course Topographic Elevation Contours
    final paint1 = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.18)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.3;

    final path1 = Path()
      ..moveTo(-20, size.height * 0.20)
      ..cubicTo(size.width * 0.18, size.height * 0.05, size.width * 0.42, size.height * 0.32, size.width * 0.68, size.height * 0.14)
      ..cubicTo(size.width * 0.82, size.height * 0.02, size.width * 0.94, size.height * 0.22, size.width + 25, size.height * 0.10);
    canvas.drawPath(path1, paint1);

    final paint2 = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.14)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1;

    final path2 = Path()
      ..moveTo(-15, size.height * 0.40)
      ..cubicTo(size.width * 0.16, size.height * 0.22, size.width * 0.46, size.height * 0.54, size.width * 0.72, size.height * 0.34)
      ..cubicTo(size.width * 0.86, size.height * 0.20, size.width * 0.96, size.height * 0.38, size.width + 25, size.height * 0.28);
    canvas.drawPath(path2, paint2);

    final paint3 = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.11)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.9;

    final path3 = Path()
      ..moveTo(-20, size.height * 0.62)
      ..cubicTo(size.width * 0.20, size.height * 0.48, size.width * 0.50, size.height * 0.74, size.width * 0.76, size.height * 0.52)
      ..cubicTo(size.width * 0.88, size.height * 0.42, size.width * 0.96, size.height * 0.60, size.width + 25, size.height * 0.48);
    canvas.drawPath(path3, paint3);

    final paint4 = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    final path4 = Path()
      ..moveTo(-10, size.height * 0.82)
      ..cubicTo(size.width * 0.24, size.height * 0.70, size.width * 0.52, size.height * 0.92, size.width * 0.78, size.height * 0.74)
      ..cubicTo(size.width * 0.90, size.height * 0.64, size.width * 0.96, size.height * 0.80, size.width + 20, size.height * 0.72);
    canvas.drawPath(path4, paint4);

    // Putting Green Complex Plateau Elevation Rings around Hole squircle
    final center = Offset(size.width * 0.13, size.height * 0.32);
    final circlePaint = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.16)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawCircle(center, 34, circlePaint);

    circlePaint.color = const Color(0xFF10B981).withOpacity(0.11);
    canvas.drawCircle(center, 58, circlePaint);

    circlePaint.color = const Color(0xFF10B981).withOpacity(0.07);
    canvas.drawCircle(center, 84, circlePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

