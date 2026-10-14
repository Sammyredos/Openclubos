import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../core/api/api_client.dart';
import 'sync_contacts_screen.dart';
import 'chat_screen.dart';

class AddFriendsScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  final List<Map<String, dynamic>> candidateCompetitors;
  final Set<String> sentRequestIds;
  final Set<String> acceptedFriendIds;
  final List<Map<String, dynamic>> incomingRequests;
  final Function(Map<String, dynamic> comp)? onRequestToggled;
  final Function(Map<String, dynamic> comp)? onAcceptIncoming;
  final Function(Map<String, dynamic> comp)? onDeclineIncoming;
  final Function(Map<String, dynamic> comp)? onUnfriend;
  final Function(Map<String, dynamic> comp)? onBlock;
  final Function(Map<String, dynamic> comp)? onUnblock;
  final Set<String> blockedUserIds;

  const AddFriendsScreen({
    super.key,
    required this.user,
    required this.candidateCompetitors,
    required this.sentRequestIds,
    required this.acceptedFriendIds,
    this.blockedUserIds = const {},
    this.incomingRequests = const [],
    this.onRequestToggled,
    this.onAcceptIncoming,
    this.onDeclineIncoming,
    this.onUnfriend,
    this.onBlock,
    this.onUnblock,
  });

  @override
  State<AddFriendsScreen> createState() => _AddFriendsScreenState();
}

class _AddFriendsScreenState extends State<AddFriendsScreen> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  late Set<String> _localSentIds;
  late Set<String> _localAcceptedIds;
  late Set<String> _localBlockedIds;
  List<Map<String, dynamic>> _localIncomingRequests = [];
  final Set<String> _localIncomingIds = {};
  final Set<String> _localIncomingNames = {};
  bool _contactsSynced = false;
  bool _copiedLink = false;
  int _displayLimit = 4;
  Map<String, int> _unreadBySender = {};

  String get _userInviteCode {
    final name = widget.user?['fullName'] ?? widget.user?['name'] ?? 'Golfer';
    final namePart = name.toString().trim().toLowerCase().split(RegExp(r'\s+')).first.replaceAll(RegExp(r'[^a-z0-9]'), '');
    final id = widget.user?['id']?.toString() ?? widget.user?['email']?.toString();
    String code = '7782';
    if (id != null && id.isNotEmpty) {
      final cleanId = id.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
      code = cleanId.length >= 4 ? cleanId.substring(cleanId.length - 4).toLowerCase() : cleanId.toLowerCase();
    }
    return '$namePart-$code';
  }

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

  Widget _buildPlayerAvatar(String name, String? avatarUrl, {double size = 44}) {
    final initials = _getTwoInitials(name);
    final hasImage = avatarUrl != null && avatarUrl.trim().isNotEmpty;

    if (hasImage) {
      Widget imageWidget;
      if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        imageWidget = Image.network(
          avatarUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackInitials(initials, size),
        );
      } else if (avatarUrl.startsWith('data:image')) {
        try {
          final commaIdx = avatarUrl.indexOf(',');
          final base64Str = commaIdx != -1 ? avatarUrl.substring(commaIdx + 1) : avatarUrl;
          imageWidget = Image.memory(
            base64Decode(base64Str),
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildFallbackInitials(initials, size),
          );
        } catch (_) {
          imageWidget = _buildFallbackInitials(initials, size);
        }
      } else {
        imageWidget = Image.asset(
          avatarUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackInitials(initials, size),
        );
      }

      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFC6F0DB)),
        ),
        child: ClipOval(child: imageWidget),
      );
    }

    return _buildFallbackInitials(initials, size);
  }

  Widget _buildFallbackInitials(String initials, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7EE),
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFC6F0DB)),
      ),
      child: Center(
        child: Text(
          initials,
          style: GoogleFonts.plusJakartaSans(
            fontSize: size * 0.34,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF009A60),
          ),
        ),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _localSentIds = Set<String>.from(widget.sentRequestIds);
    _localAcceptedIds = Set<String>.from(widget.acceptedFriendIds);
    _localIncomingRequests = List<Map<String, dynamic>>.from(widget.incomingRequests);
    _syncIncomingSets();
    _loadIncomingRequestsFromHive();
    _fetchUnreadCounts();
  }

  Future<void> _fetchUnreadCounts() async {
    try {
      final userId = widget.user?['id']?.toString() ?? widget.user?['email']?.toString() ?? '';
      final res = await _apiClient.dio.get(
        '/friends/messages/unread',
        options: Options(headers: {'x-user-id': userId}),
      );
      if (res.statusCode == 200 && res.data != null && res.data is Map) {
        final breakdown = res.data['unreadBySender'];
        if (breakdown is Map && mounted) {
          final Map<String, int> counts = {};
          breakdown.forEach((k, v) {
            if (v is int) counts[k.toString().toLowerCase().trim()] = v;
          });
          setState(() => _unreadBySender = counts);
        }
      }
    } catch (_) {}
  }

  int _getFriendUnreadCount(Map<String, dynamic> player) {
    final id = player['id']?.toString().toLowerCase().trim() ?? '';
    final name = (player['name'] ?? player['fullName'])?.toString().toLowerCase().trim() ?? '';
    final email = player['email']?.toString().toLowerCase().trim() ?? '';
    if (id.isNotEmpty && _unreadBySender.containsKey(id)) return _unreadBySender[id]!;
    if (name.isNotEmpty && _unreadBySender.containsKey(name)) return _unreadBySender[name]!;
    if (email.isNotEmpty && _unreadBySender.containsKey(email)) return _unreadBySender[email]!;
    return 0;
  }

  void _syncIncomingSets() {
    _localIncomingIds.clear();
    _localIncomingNames.clear();
    for (final req in _localIncomingRequests) {
      final sId = (req['senderId'] ?? req['id'] ?? req['userId'])?.toString();
      final sName = (req['senderName'] ?? req['name'])?.toString().trim().toLowerCase();
      if (sId != null && sId.isNotEmpty) _localIncomingIds.add(sId.toLowerCase());
      if (sName != null && sName.isNotEmpty) _localIncomingNames.add(sName);
    }
  }

  Future<void> _loadIncomingRequestsFromHive() async {
    try {
      final box = await Hive.openBox('auth');
      final userId = widget.user?['id']?.toString() ?? widget.user?['email']?.toString() ?? 'anonymous';
      final incoming = box.get('incoming_friend_requests_$userId');
      if (incoming is List) {
        for (final item in incoming) {
          if (item is Map) {
            final m = Map<String, dynamic>.from(item);
            final sId = (m['senderId'] ?? m['id'])?.toString();
            if (sId != null && !_localIncomingRequests.any((r) => (r['senderId'] ?? r['id'])?.toString() == sId)) {
              _localIncomingRequests.add(m);
            }
          }
        }
      }
      final notifs = box.get('user_notifications_$userId');
      if (notifs is List) {
        for (final n in notifs) {
          if (n is Map) {
            final nMap = Map<String, dynamic>.from(n);
            final nData = nMap['data'];
            if (nData is Map && nData['type'] == 'FRIEND_REQUEST' && nMap['unread'] == true) {
              final sId = nData['senderId']?.toString();
              if (sId != null && !_localIncomingRequests.any((r) => (r['senderId'] ?? r['id'])?.toString() == sId)) {
                _localIncomingRequests.add({
                  'id': nData['requestId'] ?? nMap['id'],
                  'senderId': sId,
                  'senderName': nData['senderName'] ?? nMap['title'] ?? 'Golfer',
                  'senderClub': nData['senderClub'] ?? '',
                  'senderHcp': nData['senderHcp'] ?? '0.0',
                  'senderInitial': (nData['senderName']?.toString().isNotEmpty == true)
                      ? nData['senderName'][0].toUpperCase()
                      : 'G',
                });
              }
            }
          }
        }
      }
      if (mounted) {
        setState(() {
          _syncIncomingSets();
        });
      }
    } catch (_) {}
  }

  bool _isIncomingPlayer(Map<String, dynamic> c) {
    final id = (c['id']?.toString() ?? '').toLowerCase().trim();
    final name = (c['name'] as String? ?? '').toLowerCase().trim();
    final email = (c['email'] as String? ?? '').toLowerCase().trim();

    if (id.isNotEmpty && _localIncomingIds.contains(id)) return true;
    if (name.isNotEmpty && _localIncomingNames.contains(name)) return true;

    return _localIncomingRequests.any((req) {
      final rId = (req['senderId'] ?? req['id'] ?? req['userId'])?.toString().toLowerCase().trim();
      final rName = (req['senderName'] ?? req['name'])?.toString().toLowerCase().trim();
      final rEmail = (req['senderEmail'] ?? req['email'])?.toString().toLowerCase().trim();
      if (rId != null && rId.isNotEmpty && rId == id) return true;
      if (rName != null && rName.isNotEmpty && rName == name) return true;
      if (rEmail != null && rEmail.isNotEmpty && email.isNotEmpty && rEmail == email) return true;
      // Cross-match: check if the request sender ID matches the player's email or vice versa
      if (rId != null && email.isNotEmpty && rId == email) return true;
      if (rEmail != null && rEmail.isNotEmpty && id.isNotEmpty && rEmail == id) return true;
      return false;
    });
  }

  Map<String, dynamic>? _getMatchingIncomingRequest(Map<String, dynamic> c) {
    final id = (c['id']?.toString() ?? '').toLowerCase().trim();
    final name = (c['name'] as String? ?? '').toLowerCase().trim();
    final email = (c['email'] as String? ?? '').toLowerCase().trim();

    for (final req in _localIncomingRequests) {
      final rId = (req['senderId'] ?? req['id'] ?? req['userId'])?.toString().toLowerCase().trim();
      final rName = (req['senderName'] ?? req['name'])?.toString().toLowerCase().trim();
      final rEmail = (req['senderEmail'] ?? req['email'])?.toString().toLowerCase().trim();
      if (rId != null && rId.isNotEmpty && rId == id) return req;
      if (rName != null && rName.isNotEmpty && rName == name) return req;
      if (rEmail != null && rEmail.isNotEmpty && email.isNotEmpty && rEmail == email) return req;
    }
    return null;
  }

  void _acceptIncomingRequest(Map<String, dynamic> player) {
    final compId = player['id']?.toString() ?? '';
    final compName = player['name']?.toString() ?? 'Golfer';
    final matchingReq = _getMatchingIncomingRequest(player) ?? {
      'id': 'req_${compId}_${DateTime.now().millisecondsSinceEpoch}',
      'senderId': compId,
      'senderName': compName,
      'senderClub': player['club']?.toString() ?? '',
      'senderHcp': player['hcp']?.toString() ?? '0.0',
    };

    setState(() {
      _localAcceptedIds.add(compId);
      _localAcceptedIds.add(compName.toLowerCase());
      _localIncomingRequests.removeWhere((r) {
        final rId = (r['senderId'] ?? r['id'])?.toString();
        final rName = (r['senderName'] ?? r['name'])?.toString().toLowerCase().trim();
        return rId == compId || rName == compName.toLowerCase();
      });
      _syncIncomingSets();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Accepted friend request from $compName!'),
        backgroundColor: const Color(0xFF009A60),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );

    if (widget.onAcceptIncoming != null) {
      widget.onAcceptIncoming!(matchingReq);
    }
  }

  void _declineIncomingRequest(Map<String, dynamic> player) {
    final compId = player['id']?.toString() ?? '';
    final compName = player['name']?.toString() ?? 'Golfer';
    final matchingReq = _getMatchingIncomingRequest(player) ?? {
      'id': 'req_${compId}_${DateTime.now().millisecondsSinceEpoch}',
      'senderId': compId,
      'senderName': compName,
      'senderClub': player['club']?.toString() ?? '',
      'senderHcp': player['hcp']?.toString() ?? '0.0',
    };

    setState(() {
      _localIncomingRequests.removeWhere((r) {
        final rId = (r['senderId'] ?? r['id'])?.toString();
        final rName = (r['senderName'] ?? r['name'])?.toString().toLowerCase().trim();
        return rId == compId || rName == compName.toLowerCase();
      });
      _syncIncomingSets();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Friend request declined.'),
        backgroundColor: Color(0xFF64748B),
        behavior: SnackBarBehavior.floating,
        duration: Duration(seconds: 2),
      ),
    );

    if (widget.onDeclineIncoming != null) {
      widget.onDeclineIncoming!(matchingReq);
    }
  }

  void _unfriendPlayer(Map<String, dynamic> player) {
    final compId = player['id']?.toString() ?? '';
    final compName = player['name']?.toString() ?? 'Golfer';

    setState(() {
      _localAcceptedIds.remove(compId);
      _localAcceptedIds.remove(compName.toLowerCase());
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$compName removed from friends.'),
        backgroundColor: const Color(0xFF64748B),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );

    if (widget.onUnfriend != null) {
      widget.onUnfriend!(player);
    }
  }

  String _getTwoInitials(String name) {
    if (name.trim().isEmpty) return 'OC';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      final first = parts[0].isNotEmpty ? parts[0][0].toUpperCase() : '';
      final second = parts[1].isNotEmpty ? parts[1][0].toUpperCase() : '';
      return '$first$second';
    }
    return name.trim().substring(0, name.trim().length >= 2 ? 2 : 1).toUpperCase();
  }

  void _showFriendActionSheet(Map<String, dynamic> player) {
    final compName = player['name']?.toString() ?? 'Golfer';
    final compClub = player['club']?.toString() ?? 'Ikoyi Golf Club';
    final compHcp = player['hcp']?.toString() ?? '12';

    // Resolve display photo with candidates lookup fallback
    final compPhoto = player['avatar']?.toString() ??
        player['profilePhoto']?.toString() ??
        player['photo']?.toString() ??
        player['image']?.toString();
    String? resolvedPhoto = compPhoto;
    if (resolvedPhoto == null || resolvedPhoto.trim().isEmpty) {
      final compId = player['id']?.toString();
      final compEmail = player['email']?.toString()?.toLowerCase();
      for (final c in widget.candidateCompetitors) {
        if ((compId != null && c['id']?.toString() == compId) ||
            (compEmail != null && c['email']?.toString()?.toLowerCase() == compEmail) ||
            (c['name']?.toString().toLowerCase() == compName.toLowerCase())) {
          final cPhoto = c['avatar']?.toString() ?? c['profilePhoto']?.toString() ?? c['photo']?.toString();
          if (cPhoto != null && cPhoto.trim().isNotEmpty) {
            resolvedPhoto = cPhoto;
            break;
          }
        }
      }
    }

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
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle pill
                Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),

                // Centered Friend Squircle Badge (Matching forfeit warning geometry)
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF7EE),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFC6F0DB)),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      _buildPlayerAvatar(compName, resolvedPhoto, size: 44),
                      Positioned(
                        right: 8,
                        bottom: 8,
                        child: Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFF009A60),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Center(
                            child: Icon(Icons.check_rounded, size: 10, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Centered Golfer Full Name
                Text(
                  compName,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.4,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),

                // Subtitle / Body
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13.5,
                      color: const Color(0xFF64748B),
                    ),
                    children: [
                      const TextSpan(
                        text: 'Connected Friend',
                        style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF009A60)),
                      ),
                      TextSpan(text: ' | $compClub | $compHcp HCP'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Button 0: Send Direct Message
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF009A60),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ChatScreen(
                            friendId: player['id']?.toString() ?? '',
                            friendName: compName,
                            friendAvatar: resolvedPhoto,
                            isOnline: player['isOnline'] == true || player['online'] == true,
                          ),
                        ),
                      );
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: Colors.white),
                        const SizedBox(width: 8),
                        Text(
                          'Send Direct Message',
                          style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Button 1: Remove from Friends
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0F172A),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showUnfriendConfirmation(player);
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.person_remove_rounded, size: 18, color: Color(0xFF0F172A)),
                        const SizedBox(width: 8),
                        Text(
                          'Remove from Friends',
                          style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Button 2: Report Golfer
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0F172A),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showReportGolferDialog(player);
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.flag_rounded, size: 18, color: Color(0xFF0F172A)),
                        const SizedBox(width: 8),
                        Text(
                          'Report Golfer',
                          style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Button 3: Block Golfer
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFF1F2),
                      foregroundColor: const Color(0xFFDC2626),
                      side: const BorderSide(color: Color(0xFFFFE4E6)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showBlockConfirmation(player);
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.block_rounded, size: 18, color: Color(0xFFDC2626)),
                        const SizedBox(width: 8),
                        Text(
                          'Block Golfer',
                          style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Button 4: Cancel
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0F172A),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    onPressed: () => Navigator.pop(ctx),
                    child: Text(
                      'Cancel',
                      style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
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

  void _showReportGolferDialog(Map<String, dynamic> player) {
    final compName = player['name']?.toString() ?? 'Golfer';
    final compId = player['id']?.toString() ?? '';
    final compClub = player['club']?.toString() ?? '';
    final compHcp = player['hcp']?.toString() ?? '0.0';

    String selectedReason = 'Unsportsmanlike Conduct / Cheating';
    final TextEditingController detailsController = TextEditingController();
    bool isSubmitting = false;

    final List<String> reasons = [
      'Unsportsmanlike Conduct / Cheating',
      'Harassment / Offensive Behavior',
      'Impersonation / Fake Profile',
      'Inappropriate Content or Avatar',
      'Spam or Solicitation',
      'Other Violation',
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) => Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: EdgeInsets.fromLTRB(
                24,
                12,
                24,
                MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Drag handle
                    Container(
                      width: 48,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Flag Icon Badge (Red/Danger tint)
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: const Center(
                        child: Icon(Icons.flag_rounded, color: Color(0xFFDC2626), size: 30),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Title & Description
                    Text(
                      'Report Golfer',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.3,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: GoogleFonts.plusJakartaSans(fontSize: 13, color: const Color(0xFF64748B), height: 1.4),
                        children: [
                          const TextSpan(text: 'Help maintain a fair, respectful community. Select the infraction regarding '),
                          TextSpan(
                            text: compName,
                            style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Infraction Reason Selection
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'INFRACTION REASON',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF64748B),
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...reasons.map((r) {
                      final isSelected = selectedReason == r;
                      return GestureDetector(
                        onTap: () => setModalState(() => selectedReason = r),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFEAF7EE) : const Color(0xFFF5FAF6),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF009A60) : const Color(0xFFE1EFE5),
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF009A60) : const Color(0xFFCBD5E1),
                                    width: 2,
                                  ),
                                  color: isSelected ? const Color(0xFF009A60) : Colors.transparent,
                                ),
                                child: isSelected
                                    ? const Center(
                                        child: Icon(Icons.check, size: 12, color: Colors.white),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  r,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    color: isSelected ? const Color(0xFF009A60) : const Color(0xFF0F172A),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 12),

                    // Additional Details
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'ADDITIONAL DETAILS (OPTIONAL)',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF64748B),
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: detailsController,
                      maxLines: 3,
                      style: GoogleFonts.plusJakartaSans(fontSize: 13, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF5FAF6),
                        hintText: 'Describe what happened or reference specific tournament rounds...',
                        hintStyle: GoogleFonts.plusJakartaSans(fontSize: 12, color: const Color(0xFF8CA0BA)),
                        contentPadding: const EdgeInsets.all(12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE1EFE5)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE1EFE5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF009A60), width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Submit button
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
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                setModalState(() => isSubmitting = true);
                                final reporterId = widget.user?['id']?.toString() ??
                                    widget.user?['email']?.toString() ??
                                    'anonymous';
                                final reporterName = widget.user?['fullName'] ?? widget.user?['name'] ?? 'Golfer';
                                final details = detailsController.text.trim();

                                try {
                                  final authBox = await Hive.openBox('auth');
                                  final dynamic storedUserRaw = authBox.get('user');
                                  final Map<String, dynamic>? storedUser = (storedUserRaw is Map)
                                      ? Map<String, dynamic>.from(storedUserRaw)
                                      : null;

                                  final effectiveReporterId = widget.user?['id']?.toString() ??
                                      storedUser?['id']?.toString() ??
                                      widget.user?['email']?.toString() ??
                                      storedUser?['email']?.toString() ??
                                      'anonymous';

                                  final effectiveReporterName = widget.user?['fullName'] ??
                                      widget.user?['name'] ??
                                      storedUser?['fullName'] ??
                                      storedUser?['name'] ??
                                      'Golfer';

                                  final effectiveReporterEmail = widget.user?['email']?.toString() ??
                                      storedUser?['email']?.toString() ??
                                      'player@openclubos.com';

                                  final reportPayload = {
                                    'reporterId': effectiveReporterId,
                                    'reporterName': effectiveReporterName,
                                    'reporterEmail': effectiveReporterEmail,
                                    'reportedId': compId,
                                    'reportedName': compName,
                                    'reportedClub': compClub,
                                    'reportedHcp': compHcp,
                                    'reason': selectedReason,
                                    'details': details,
                                  };

                                  bool posted = false;
                                  try {
                                    final apiClient = ApiClient();
                                    final res = await apiClient.dio.post(
                                      '/reports/user',
                                      data: reportPayload,
                                      options: Options(headers: {
                                        'x-user-id': effectiveReporterId,
                                        'Content-Type': 'application/json',
                                      }),
                                    );
                                    if (res.statusCode == 200 || res.statusCode == 201) {
                                      posted = true;
                                    }
                                  } catch (e) {
                                    debugPrint('Primary ApiClient report error: $e');
                                  }

                                  if (!posted) {
                                    final fallbackUrls = [
                                      'http://10.0.2.2:3001/api/reports/user',
                                      'http://localhost:3001/api/reports/user',
                                      'http://127.0.0.1:3001/api/reports/user',
                                    ];
                                    for (final url in fallbackUrls) {
                                      try {
                                        final fallbackDio = Dio(BaseOptions(
                                          connectTimeout: const Duration(seconds: 4),
                                          receiveTimeout: const Duration(seconds: 4),
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'x-user-id': effectiveReporterId,
                                          },
                                        ));
                                        final res = await fallbackDio.post(url, data: reportPayload);
                                        if (res.statusCode == 200 || res.statusCode == 201) {
                                          posted = true;
                                          debugPrint('Report successfully posted via fallback: $url');
                                          break;
                                        }
                                      } catch (fallbackError) {
                                        debugPrint('Fallback report host failed ($url): $fallbackError');
                                      }
                                    }
                                  }
                                } catch (e) {
                                  debugPrint('General report submission error: $e');
                                }

                                try {
                                  // Persist locally in Hive
                                  final box = await Hive.openBox('auth');
                                  final existingReports = box.get('user_reports');
                                  final reportsList = (existingReports is List)
                                      ? List<Map<String, dynamic>>.from(existingReports)
                                      : <Map<String, dynamic>>[];
                                  reportsList.insert(0, {
                                    'id': 'rep_${DateTime.now().millisecondsSinceEpoch}',
                                    'reporterId': reporterId,
                                    'reporterName': reporterName,
                                    'reportedId': compId,
                                    'reportedName': compName,
                                    'reportedClub': compClub,
                                    'reportedHcp': compHcp,
                                    'reason': selectedReason,
                                    'details': details,
                                    'status': 'PENDING',
                                    'createdAt': DateTime.now().toIso8601String(),
                                  });
                                  await box.put('user_reports', reportsList);
                                } catch (_) {}

                                if (mounted) {
                                  Navigator.pop(ctx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Report submitted. Our moderation team will review this shortly.'),
                                      backgroundColor: Color(0xFF009A60),
                                      behavior: SnackBarBehavior.floating,
                                      duration: Duration(seconds: 3),
                                    ),
                                  );
                                }
                              },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.flag_rounded, size: 18, color: Colors.white),
                            const SizedBox(width: 8),
                            Text(
                              isSubmitting ? 'Submitting...' : 'Submit Report to Moderation',
                              style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Cancel button
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
                          'Cancel',
                          style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showUnfriendConfirmation(Map<String, dynamic> player) {
    final compName = player['name']?.toString() ?? 'Golfer';

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
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle pill
                Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),

                // Centered Warning Squircle Badge (Matching forfeit warning display)
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFFFE4E6)),
                  ),
                  child: const Center(
                    child: Icon(Icons.warning_rounded, color: Color(0xFFDC2626), size: 32),
                  ),
                ),
                const SizedBox(height: 18),

                // Centered Title
                Text(
                  'Remove Friend?',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.4,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),

                // Centered Body with bold friend name
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13.5,
                      color: const Color(0xFF64748B),
                      height: 1.45,
                    ),
                    children: [
                      const TextSpan(text: 'Are you sure you want to remove '),
                      TextSpan(
                        text: compName,
                        style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                      ),
                      const TextSpan(text: ' from your golf friends? You will no longer see their live scores and updates.'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Button 1: Yes, Remove Friend (Destructive red)
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
                      Navigator.pop(ctx);
                      _unfriendPlayer(player);
                    },
                    child: Text(
                      'Yes, Remove Friend',
                      style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Button 2: Cancel, Keep Friend (Subtle light)
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
                      'Cancel, Keep Friend',
                      style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
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

  void _blockPlayer(Map<String, dynamic> player) {
    final compId = player['id']?.toString() ?? '';
    final compName = player['name']?.toString() ?? 'Golfer';

    setState(() {
      _localAcceptedIds.remove(compId);
      _localAcceptedIds.remove(compName.toLowerCase());
      _localSentIds.remove(compId);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$compName has been blocked.'),
        backgroundColor: const Color(0xFF64748B),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );

    if (widget.onBlock != null) {
      widget.onBlock!(player);
    }
  }

  void _showBlockConfirmation(Map<String, dynamic> player) {
    final compName = player['name']?.toString() ?? 'Golfer';

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
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle pill
                Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),

                // Centered Warning Squircle Badge (Matching forfeit warning display)
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFFFE4E6)),
                  ),
                  child: const Center(
                    child: Icon(Icons.warning_rounded, color: Color(0xFFDC2626), size: 32),
                  ),
                ),
                const SizedBox(height: 18),

                // Centered Title
                Text(
                  'Block Golfer?',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.4,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),

                // Centered Body with bold friend name
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13.5,
                      color: const Color(0xFF64748B),
                      height: 1.45,
                    ),
                    children: [
                      const TextSpan(text: 'Are you sure you want to block '),
                      TextSpan(
                        text: compName,
                        style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                      ),
                      const TextSpan(text: '? They will not be able to find your profile, view your rounds, or send you game requests.'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Button 1: Yes, Block Golfer (Destructive red)
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
                      Navigator.pop(ctx);
                      _blockPlayer(player);
                    },
                    child: Text(
                      'Yes, Block Golfer',
                      style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Button 2: Cancel, Keep Unblocked (Subtle light)
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
                      'Cancel, Keep Unblocked',
                      style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
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

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleSendRequest(Map<String, dynamic> comp) {
    final compId = comp['id']?.toString() ?? '';
    if (compId.isEmpty) return;
    final isSent = _localSentIds.contains(compId);
    final compName = comp['name']?.toString() ?? 'Golfer';

    setState(() {
      if (isSent) {
        _localSentIds.remove(compId);
        _localAcceptedIds.remove(compId);
        _localAcceptedIds.remove(compName.toLowerCase());
      } else {
        _localSentIds.add(compId);
        _localAcceptedIds.remove(compId);
        _localAcceptedIds.remove(compName.toLowerCase());
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isSent ? 'Friend request cancelled.' : 'Friend request sent to $compName.',
        ),
        backgroundColor: isSent ? const Color(0xFF64748B) : const Color(0xFF009A60),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );

    if (isSent) {
      final myId = widget.user?['id']?.toString() ?? widget.user?['email']?.toString() ?? '';
      _apiClient.dio.delete('/friends/request/$compId').catchError((_) => null);
      _apiClient.dio.post('/friends/cancel', data: {
        'senderId': myId,
        'targetUserId': compId,
      }).catchError((_) => null);
      _apiClient.dio.delete('/friends/$compId').catchError((_) => null);
    } else {
      final myId = widget.user?['id']?.toString() ?? widget.user?['email']?.toString() ?? '';
      _apiClient.dio.post('/friends/request', data: {
        'senderId': myId,
        'targetUserId': compId,
      }).catchError((_) => null);
    }

    if (widget.onRequestToggled != null) {
      widget.onRequestToggled!(comp);
    }
  }

  Widget _buildShareInviteLinkCard(BuildContext context, [List<Map<String, dynamic>>? allRealCompetitors]) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: CustomPaint(
        painter: DashedBorderPainter(
          color: const Color(0xFF009A60),
          strokeWidth: 1.6,
          radius: 16.0,
          dashWidth: 6.0,
          dashSpace: 4.0,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Column(
            children: [
              // Centered Squircle Badge with tap to open QR Code
              GestureDetector(
                onTap: () => _showMyQrCodeDialog(context, allRealCompetitors ?? widget.competitors ?? []),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF7EE),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFC6F0DB)),
                  ),
                  child: const Center(
                    child: Icon(Icons.qr_code_2_rounded, size: 24, color: Color(0xFF009A60)),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Centered Title
              Text(
                'Connect via QR Code',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),

              // Centered Subtitle
              Text(
                'Scan or share your unique golfer QR code to connect instantly on the course',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF64748B),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              // Dedicated QR Code Button
              GestureDetector(
                onTap: () => _showMyQrCodeDialog(context, allRealCompetitors ?? widget.competitors ?? []),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF009A60),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.qr_code_rounded, size: 16, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        'My QR Code & Scanner',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
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
  }

  void _showMyQrCodeDialog(BuildContext context, List<Map<String, dynamic>> allRealCompetitors) {
    final name = widget.user?['fullName'] ?? widget.user?['name'] ?? 'Golfer';
    final club = widget.user?['club'] ?? widget.user?['golfClub'] ?? 'OpenClub';
    final rawHcp = widget.user?['handicap'] ?? widget.user?['hcp'] ?? widget.user?['handicapIndex'];
    final hcp = rawHcp != null ? rawHcp.toString() : '0.0';
    final qrPayload = '${UniqueQrCodePainter.appBaseUrl}/invite/$_userInviteCode';
    final initials = name.toString().trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).map((s) => s[0]).take(2).join('').toUpperCase();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) {
        int activeTab = 0;
        Map<String, dynamic>? scannedResult;

        return StatefulBuilder(
          builder: (modalCtx, setSheetState) {
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Container(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(modalCtx).size.height * 0.88,
                  ),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 10),
                      // Drag Handle
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Header Row (Matching My Bookings Display)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
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
                                Icons.qr_code_2_rounded,
                                size: 22,
                                color: Color(0xFF009A60),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    activeTab == 0 ? 'My QR Code' : 'Scan QR Code',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  if (activeTab == 0)
                                    Text(
                                      'Connect with golfers on course instantly',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.of(sheetCtx).pop(),
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
                      ),

                      // Segmented Mode Switcher: My QR Code vs Scan QR Code
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF4F6F3),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0).withOpacity(0.8), width: 1),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setSheetState(() {
                                    activeTab = 0;
                                    scannedResult = null;
                                  }),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: activeTab == 0 ? Colors.white : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                      boxShadow: activeTab == 0
                                          ? [
                                              BoxShadow(
                                                color: Colors.black.withOpacity(0.04),
                                                blurRadius: 4,
                                                offset: const Offset(0, 1),
                                              ),
                                            ]
                                          : null,
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.qr_code_rounded,
                                          size: 14,
                                          color: activeTab == 0 ? const Color(0xFF009A60) : const Color(0xFF64748B),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'My QR Code',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: activeTab == 0 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setSheetState(() {
                                    activeTab = 1;
                                    scannedResult = null;
                                  }),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: activeTab == 1 ? Colors.white : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                      boxShadow: activeTab == 1
                                          ? [
                                              BoxShadow(
                                                color: Colors.black.withOpacity(0.04),
                                                blurRadius: 4,
                                                offset: const Offset(0, 1),
                                              ),
                                            ]
                                          : null,
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.qr_code_scanner_rounded,
                                          size: 14,
                                          color: activeTab == 1 ? const Color(0xFF009A60) : const Color(0xFF64748B),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Scan QR Code',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: activeTab == 1 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
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
                      ),

                      // Sheet Body
                      Flexible(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
                          child: activeTab == 0
                              ? Column(
                                  children: [
                                    _buildPlayerAvatar(
                                      name.toString(),
                                      widget.user?['profilePhoto']?.toString() ??
                                          widget.user?['avatar']?.toString() ??
                                          widget.user?['photo']?.toString() ??
                                          widget.user?['profilePicture']?.toString(),
                                      size: 52,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      name.toString(),
                                      style: GoogleFonts.plusJakartaSans(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                    ),
                                    Text(
                                      '$club | $hcp HCP',
                                      style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF64748B)),
                                    ),
                                    const SizedBox(height: 14),
                                    Container(
                                      width: 165,
                                      height: 165,
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEAF7EE),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: const Color(0xFFC6F0DB), width: 1.5),
                                      ),
                                      child: Center(
                                        child: CustomPaint(
                                          size: const Size(140, 140),
                                          painter: UniqueQrCodePainter(
                                            payload: qrPayload,
                                            initials: initials.isNotEmpty ? initials : 'OC',
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      'Let other golfers scan your code on the course to connect instantly.',
                                      style: GoogleFonts.plusJakartaSans(fontSize: 12, color: const Color(0xFF64748B)),
                                      textAlign: TextAlign.center,
                                    ),
                                    const SizedBox(height: 16),
                                    SizedBox(
                                      width: double.infinity,
                                      height: 44,
                                      child: ElevatedButton(
                                        onPressed: () {
                                          Navigator.of(sheetCtx).pop();
                                          Clipboard.setData(ClipboardData(text: '${UniqueQrCodePainter.appBaseUrl}/invite/$_userInviteCode'));
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(
                                              content: Text('QR Code invite link copied to clipboard!'),
                                              backgroundColor: Color(0xFF009A60),
                                              behavior: SnackBarBehavior.floating,
                                            ),
                                          );
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF009A60),
                                          foregroundColor: Colors.white,
                                          elevation: 0,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        ),
                                        child: Text('Share QR Code', style: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w700)),
                                      ),
                                    ),
                                  ],
                                )
                              : Column(
                                  children: [
                                    // Viewfinder (Taller 270dp container for ergonomic camera scanning)
                                    Container(
                                      width: double.infinity,
                                      height: 270,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0F172A),
                                        borderRadius: BorderRadius.circular(18),
                                        border: Border.all(color: const Color(0xFF1E293B)),
                                      ),
                                      child: Stack(
                                        alignment: Alignment.center,
                                        children: [
                                          // Centered 190x190 targeting reticle frame
                                          SizedBox(
                                            width: 190,
                                            height: 190,
                                            child: Stack(
                                              children: [
                                                Positioned(
                                                  top: 0,
                                                  left: 0,
                                                  child: Container(
                                                    width: 22,
                                                    height: 22,
                                                    decoration: const BoxDecoration(
                                                      border: Border(
                                                        top: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                        left: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                Positioned(
                                                  top: 0,
                                                  right: 0,
                                                  child: Container(
                                                    width: 22,
                                                    height: 22,
                                                    decoration: const BoxDecoration(
                                                      border: Border(
                                                        top: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                        right: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                Positioned(
                                                  bottom: 0,
                                                  left: 0,
                                                  child: Container(
                                                    width: 22,
                                                    height: 22,
                                                    decoration: const BoxDecoration(
                                                      border: Border(
                                                        bottom: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                        left: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                Positioned(
                                                  bottom: 0,
                                                  right: 0,
                                                  child: Container(
                                                    width: 22,
                                                    height: 22,
                                                    decoration: const BoxDecoration(
                                                      border: Border(
                                                        bottom: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                        right: BorderSide(color: Color(0xFF009A60), width: 2.5),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                Center(
                                                  child: Container(
                                                    height: 2,
                                                    margin: const EdgeInsets.symmetric(horizontal: 10),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFF009A60),
                                                      boxShadow: [
                                                        BoxShadow(
                                                          color: const Color(0xFF009A60).withOpacity(0.8),
                                                          blurRadius: 8,
                                                          spreadRadius: 2,
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Positioned(
                                            bottom: 14,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                              decoration: BoxDecoration(
                                                color: Colors.black.withOpacity(0.65),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(Icons.camera_alt_rounded, size: 13, color: Color(0xFF009A60)),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    'Align QR code within frame',
                                                    style: GoogleFonts.plusJakartaSans(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.w500),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 14),

                                    if (scannedResult != null) ...[
                                      // Scanned Result Card
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF0FDF4),
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(color: const Color(0xFFA7F3D0)),
                                        ),
                                        child: Row(
                                          children: [
                                            _buildPlayerAvatar(
                                              scannedResult!['name']?.toString() ?? 'Golfer',
                                              scannedResult!['avatar']?.toString() ?? scannedResult!['profilePhoto']?.toString(),
                                              size: 40,
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    children: [
                                                      Flexible(
                                                        child: Text(
                                                          scannedResult!['name']?.toString() ?? 'Golfer',
                                                          style: GoogleFonts.plusJakartaSans(
                                                            fontSize: 13,
                                                            fontWeight: FontWeight.w700,
                                                            color: const Color(0xFF0F172A),
                                                          ),
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 6),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                                        decoration: BoxDecoration(
                                                          color: const Color(0xFFEAF7EE),
                                                          borderRadius: BorderRadius.circular(20),
                                                        ),
                                                        child: Text(
                                                          'CONNECTED LIVE',
                                                          style: GoogleFonts.plusJakartaSans(
                                                            fontSize: 8.5,
                                                            fontWeight: FontWeight.w700,
                                                            color: const Color(0xFF009A60),
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  Text(
                                                    '${scannedResult!['club'] != null && scannedResult!['club'].toString().isNotEmpty ? "${scannedResult!['club']} | " : ""}${scannedResult!['hcp'] ?? '0.0'} HCP',
                                                    style: GoogleFonts.plusJakartaSans(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w500,
                                                      color: const Color(0xFF009A60),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              width: 30,
                                              height: 30,
                                              decoration: const BoxDecoration(
                                                color: Color(0xFF009A60),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(Icons.check_rounded, size: 16, color: Colors.white),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        '✓ Instantly connected as mutual golf friends with ${scannedResult!['name'] ?? 'player'}',
                                        style: GoogleFonts.plusJakartaSans(fontSize: 11, color: const Color(0xFF009A60), fontWeight: FontWeight.w600),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: SizedBox(
                                              height: 40,
                                              child: OutlinedButton(
                                                onPressed: () => setSheetState(() => scannedResult = null),
                                                style: OutlinedButton.styleFrom(
                                                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                ),
                                                child: Text('Scan Another', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF334155))),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: SizedBox(
                                              height: 40,
                                              child: ElevatedButton(
                                                onPressed: () => Navigator.of(sheetCtx).pop(),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: const Color(0xFF009A60),
                                                  foregroundColor: Colors.white,
                                                  elevation: 0,
                                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                ),
                                                child: Text('Done', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ] else ...[
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                        child: Column(
                                          children: [
                                            Text(
                                              'Point camera at a golfer\'s QR code\nto connect on the course',
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF0F172A),
                                                height: 1.4,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              'Hold phone steady to detect and add player instantly',
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF64748B),
                                                height: 1.3,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
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
        );
      },
    );
  }

  void _showContactsBottomSheet(BuildContext context, List<Map<String, dynamic>> allRealCompetitors) {
    setState(() => _contactsSynced = true);

    // Curated address book contacts synchronized with OpenclubOS
    final List<Map<String, dynamic>> phoneContacts = [
      {
        'id': 'cont_sarah_01',
        'name': 'Sarah Jenkins',
        'phone': '+234 802 314 8821',
        'isOnApp': true,
        'club': 'Ikoyi Club 1938',
        'hcp': '8.4',
        'email': 'sarah.jenkins@openclubos.com',
        'avatar': 'assets/images/competitor/sarah_jenkins.jpg',
      },
      {
        'id': 'cont_tunde_02',
        'name': 'Tunde Adekunle',
        'phone': '+234 803 551 9012',
        'isOnApp': true,
        'club': 'Lagos Amateur Golf',
        'hcp': '12.2',
        'email': 'tunde.adekunle@openclubos.com',
        'avatar': 'assets/images/competitor/tunde_adekunle.jpg',
      },
      {
        'id': 'cont_emmanuel_03',
        'name': 'Emmanuel Eze',
        'phone': '+234 805 112 4433',
        'isOnApp': true,
        'club': 'Lakowe Lakes',
        'hcp': '10.5',
        'email': 'emmanuel.eze@openclubos.com',
        'avatar': 'assets/images/competitor/emmanuel_eze.jpg',
      },
      {
        'id': 'cont_femi_04',
        'name': 'Femi Adebayo',
        'phone': '+234 807 998 2211',
        'isOnApp': true,
        'club': 'Ikoyi Club 1938',
        'hcp': '14.0',
        'email': 'femi.adebayo@openclubos.com',
      },
      {
        'id': 'cont_chioma_05',
        'name': 'Chioma Nwachukwu',
        'phone': '+234 809 771 0022',
        'isOnApp': true,
        'club': 'IBB International',
        'hcp': '18.0',
        'email': 'chioma.n@openclubos.com',
      },
      {
        'id': 'cont_babatunde_06',
        'name': 'Babatunde Lawal',
        'phone': '+234 810 445 6677',
        'isOnApp': true,
        'club': 'Ikeja Golf Club',
        'hcp': '16.8',
        'email': 'babatunde.lawal@openclubos.com',
      },
      {
        'id': 'cont_david_07',
        'name': 'David Adeleke',
        'phone': '+234 812 334 5566',
        'isOnApp': false,
        'source': 'Phone Contacts',
      },
      {
        'id': 'cont_amina_08',
        'name': 'Amina Yusuf',
        'phone': '+234 803 912 3456',
        'isOnApp': false,
        'source': 'SIM Contacts',
      },
      {
        'id': 'cont_emeka_09',
        'name': 'Emeka Okonkwo',
        'phone': '+234 806 223 9988',
        'isOnApp': false,
        'source': 'Google Contacts',
      },
      {
        'id': 'cont_kola_10',
        'name': 'Kolawole Sanusi',
        'phone': '+234 808 441 5566',
        'isOnApp': false,
        'source': 'Phone Contacts',
      },
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) {
        String filter = 'all'; // 'all', 'on_app', 'invite'
        String sheetQuery = '';
        bool isSyncing = false;
        final Set<String> invitedPhones = <String>{};
        final TextEditingController sheetSearchController = TextEditingController();

        return StatefulBuilder(
          builder: (modalCtx, setSheetState) {
            final q = sheetQuery.trim().toLowerCase();
            final filteredContacts = phoneContacts.where((c) {
              final isOnApp = c['isOnApp'] == true;
              if (filter == 'on_app' && !isOnApp) return false;
              if (filter == 'invite' && isOnApp) return false;
              if (q.isEmpty) return true;
              final name = (c['name'] as String? ?? '').toLowerCase();
              final phone = (c['phone'] as String? ?? '').toLowerCase();
              final club = (c['club'] as String? ?? '').toLowerCase();
              return name.contains(q) || phone.contains(q) || club.contains(q);
            }).toList();

            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Container(
                  height: MediaQuery.of(modalCtx).size.height * 0.82,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 10),
                      // Drag handle
                      Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Header: Squircle Address Book Badge + Title + Close Button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: const Color(0xFFEAF7EE),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFC6F0DB)),
                              ),
                              child: const Icon(Icons.contacts_rounded, color: Color(0xFF009A60), size: 21),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Find From Contacts',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.of(sheetCtx).pop(),
                              child: Container(
                                width: 32,
                                height: 32,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF1F5F9),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close_rounded, size: 17, color: Color(0xFF64748B)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Contacts Synced Status Card (Matching Screenshot)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF7EE),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFC6F0DB)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 42,
                                height: 42,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF009A60),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.check_rounded, color: Colors.white, size: 22),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Contacts Synced',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF009A60),
                                      ),
                                    ),
                                    Text(
                                      '84 GOLFERS FOUND',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.8,
                                        color: const Color(0xFF009A60).withOpacity(0.85),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              GestureDetector(
                                onTap: isSyncing
                                    ? null
                                    : () {
                                        setSheetState(() => isSyncing = true);
                                        Future.delayed(const Duration(milliseconds: 600), () {
                                          if (modalCtx.mounted) {
                                            setSheetState(() => isSyncing = false);
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                content: Text('Address book synchronized! 84 golfers matched on OpenclubOS.'),
                                                backgroundColor: Color(0xFF009A60),
                                                behavior: SnackBarBehavior.floating,
                                              ),
                                            );
                                          }
                                        });
                                      },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFFC6F0DB)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.03),
                                        blurRadius: 2,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                  child: isSyncing
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF009A60)),
                                        )
                                      : Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.sync_rounded, size: 14, color: Color(0xFF009A60)),
                                            const SizedBox(width: 4),
                                            Text(
                                              'SYNC',
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF009A60),
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
                      const SizedBox(height: 14),

                      // In-App Standardized Search Input (bg-[#f5faf6], border-[#e1efe5])
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5FAF6),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE1EFE5)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.search_rounded, color: Color(0xFF8CA0BA), size: 19),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: sheetSearchController,
                                  onChanged: (val) => setSheetState(() => sheetQuery = val),
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    color: const Color(0xFF0F172A),
                                    fontWeight: FontWeight.w500,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: 'Search contacts by name or phone...',
                                    hintStyle: GoogleFonts.plusJakartaSans(
                                      fontSize: 12.5,
                                      color: const Color(0xFF8CA0BA),
                                    ),
                                    border: InputBorder.none,
                                    isDense: true,
                                  ),
                                ),
                              ),
                              if (sheetQuery.isNotEmpty)
                                GestureDetector(
                                  onTap: () {
                                    sheetSearchController.clear();
                                    setSheetState(() => sheetQuery = '');
                                  },
                                  child: const Icon(Icons.cancel_rounded, size: 17, color: Color(0xFF94A3B8)),
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Filter tabs: ALL (84), ON APP (12), INVITE (72) (Matching Screenshot)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setSheetState(() => filter = 'all'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: filter == 'all' ? const Color(0xFF009A60) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'ALL (84)',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: filter == 'all' ? Colors.white : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setSheetState(() => filter = 'on_app'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: filter == 'on_app' ? const Color(0xFF009A60) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'ON APP (12)',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: filter == 'on_app' ? Colors.white : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setSheetState(() => filter = 'invite'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: filter == 'invite' ? const Color(0xFF009A60) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'INVITE (72)',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: filter == 'invite' ? Colors.white : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Eyebrow label: MATCHES FOUND
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'MATCHES FOUND',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.2,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Contacts list (Cards with Avatar + Green Active Dot, Name, Club, Add/Added Button)
                      Expanded(
                        child: filteredContacts.isEmpty
                            ? Center(
                                child: Text(
                                  'No contacts found matching "$sheetQuery"',
                                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: const Color(0xFF94A3B8)),
                                ),
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                                itemCount: filteredContacts.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (ctx, i) {
                                  final contact = filteredContacts[i];
                                  final cId = contact['id']?.toString() ?? '';
                                  final cName = contact['name']?.toString() ?? '';
                                  final cPhone = contact['phone']?.toString() ?? '';
                                  final isOnApp = contact['isOnApp'] == true;
                                  final isSent = _localSentIds.contains(cId);
                                  final isAccepted = _localAcceptedIds.contains(cId);
                                  final isInvited = invitedPhones.contains(cPhone);

                                  return Container(
                                    padding: const EdgeInsets.all(12),
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
                                    child: Row(
                                      children: [
                                        // Avatar with bottom-right green active dot
                                        Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            _buildPlayerAvatar(cName, contact['avatar'], size: 42),
                                            Positioned(
                                              bottom: 0,
                                              right: 0,
                                              child: Container(
                                                width: 12,
                                                height: 12,
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF009A60),
                                                  shape: BoxShape.circle,
                                                  border: Border.all(color: Colors.white, width: 2),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                cName,
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 14.5,
                                                  fontWeight: FontWeight.w700,
                                                  color: const Color(0xFF0F172A),
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                isOnApp ? (contact['club'] ?? 'Ikoyi Club 1938') : (contact['source'] ?? 'Phone Contacts'),
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 12,
                                                  color: const Color(0xFF64748B),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (isOnApp) ...[
                                          if (isAccepted || isSent)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF8FAFC),
                                                borderRadius: BorderRadius.circular(10),
                                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                              ),
                                              child: Text(
                                                'Added',
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                  color: const Color(0xFF64748B),
                                                ),
                                              ),
                                            )
                                          else
                                            GestureDetector(
                                              onTap: () {
                                                _toggleSendRequest({
                                                  'id': cId,
                                                  'name': cName,
                                                  'club': contact['club'] ?? '',
                                                  'hcp': contact['hcp'] ?? '',
                                                });
                                                setSheetState(() {});
                                              },
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 7),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF009A60),
                                                  borderRadius: BorderRadius.circular(10),
                                                ),
                                                child: Text(
                                                  'Add',
                                                  style: GoogleFonts.plusJakartaSans(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w700,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                            ),
                                        ] else ...[
                                          if (isInvited)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                'Invited ✓',
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w700,
                                                  color: const Color(0xFF64748B),
                                                ),
                                              ),
                                            )
                                          else
                                            GestureDetector(
                                              onTap: () {
                                                Clipboard.setData(ClipboardData(
                                                  text: '${UniqueQrCodePainter.appBaseUrl}/invite/$_userInviteCode?ref=${Uri.encodeComponent(cPhone)}',
                                                ));
                                                setSheetState(() => invitedPhones.add(cPhone));
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(
                                                    content: Text('Invite link copied for $cName!'),
                                                    backgroundColor: const Color(0xFF009A60),
                                                    behavior: SnackBarBehavior.floating,
                                                  ),
                                                );
                                              },
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF1F5F9),
                                                  borderRadius: BorderRadius.circular(10),
                                                ),
                                                child: Text(
                                                  'Invite',
                                                  style: GoogleFonts.plusJakartaSans(
                                                    fontSize: 11.5,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(0xFF0F172A),
                                                  ),
                                                ),
                                              ),
                                            ),
                                        ],
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
// Footer: Pinned Full-Width Dark Navy DONE Button
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 10, 20, 22),
                        child: SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: () => Navigator.of(sheetCtx).pop(),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              foregroundColor: Colors.white,
                              elevation: 2,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: Text(
                              'DONE',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchQuery.trim().toLowerCase();
    final currentUserId = widget.user?['id']?.toString() ?? '';
    final currentUserEmail = widget.user?['email']?.toString().toLowerCase() ?? '';
    final currentUserName = (widget.user?['fullName'] ?? widget.user?['name'] ?? '').toString().toLowerCase();

    // 1. Build real pool from database candidateCompetitors and incoming requests
    final List<Map<String, dynamic>> sourceList = List<Map<String, dynamic>>.from(widget.candidateCompetitors);
    final Set<String> existingSourceIds = sourceList.map((c) => c['id']?.toString() ?? '').toSet();

    // Include incoming request senders in source pool so they are findable via search
    for (final req in _localIncomingRequests) {
      final sId = (req['senderId'] ?? req['id'])?.toString();
      if (sId != null && sId.isNotEmpty && !existingSourceIds.contains(sId)) {
        existingSourceIds.add(sId);
        sourceList.add({
          'id': sId,
          'name': req['senderName'] ?? req['name'] ?? 'Golfer',
          'club': req['senderClub'] ?? req['club'] ?? '',
          'hcp': req['senderHcp'] ?? req['hcp'] ?? '0.0',
          'initial': (req['senderName']?.toString().isNotEmpty == true) ? req['senderName'][0].toUpperCase() : 'G',
        });
      }
    }

    final allRealCompetitors = sourceList.where((c) {
      final id = c['id']?.toString() ?? '';
      final email = (c['email'] as String? ?? '').toLowerCase();
      final name = (c['name'] as String? ?? '').toLowerCase();
      if (currentUserId.isNotEmpty && id == currentUserId) return false;
      if (currentUserEmail.isNotEmpty && email == currentUserEmail) return false;
      if (currentUserName.isNotEmpty && name == currentUserName) return false;
      return true;
    }).toList();

    final allMatchedList = query.isEmpty
        ? allRealCompetitors.where((c) {
            final id = c['id']?.toString() ?? '';
            final name = (c['name'] as String? ?? '').toLowerCase();
            if (_isIncomingPlayer(c)) return false;
            if (_localSentIds.contains(id) || widget.sentRequestIds.contains(id)) return false;
            if (_localAcceptedIds.contains(id) || widget.acceptedFriendIds.contains(id) || _localAcceptedIds.contains(name)) return false;
            return true;
          }).take(3).toList()
        : allRealCompetitors.where((c) {
            final name = (c['name'] as String? ?? '').toLowerCase();
            final email = (c['email'] as String? ?? '').toLowerCase();
            return name.contains(query) || email.contains(query);
          }).toList();
    final filteredList = query.isNotEmpty ? allMatchedList.take(_displayLimit).toList() : allMatchedList;
    final hasMoreResults = query.isNotEmpty && allMatchedList.length > _displayLimit;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Navigation Header: 24px horizontal gutters, 16px top offset
                Container(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                  ),
                  child: Row(
                    children: [
                      // Back Button (36x36 white circular pill, border, soft shadow)
                      GestureDetector(
                        onTap: () {
                          if (Navigator.of(context).canPop()) {
                            Navigator.of(context).pop();
                          } else {
                            Navigator.of(context).pushReplacementNamed('/app/home');
                          }
                        },
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
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.arrow_back_rounded,
                            size: 18,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          'Add Friends',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      // Right Action Buttons matching reference UI: Friends/Contacts + QR Code
                      GestureDetector(
                        onTap: () => _showContactsBottomSheet(context),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF7EE),
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFFC6F0DB), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.group_rounded,
                            size: 19,
                            color: Color(0xFF009A60),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // QR Code Button (36x36 soft-mint circular pill, emerald icon)
                      GestureDetector(
                        onTap: () => _showMyQrCodeDialog(context, allRealCompetitors),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF7EE),
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFFC6F0DB), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.qr_code_2_rounded,
                            size: 19,
                            color: Color(0xFF009A60),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Search Input Bar (Soft-mint background bg-[#f5faf6], border-[#e1efe5])
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5FAF6),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE1EFE5)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search_rounded, color: Color(0xFF8CA0BA), size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) => setState(() {
                              _searchQuery = val;
                              _displayLimit = 4;
                            }),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13.5,
                              color: const Color(0xFF0F172A),
                              fontWeight: FontWeight.w500,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Search by name or email...',
                              hintStyle: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                color: const Color(0xFF8CA0BA),
                              ),
                              border: InputBorder.none,
                              isDense: true,
                            ),
                          ),
                        ),
                        if (_searchQuery.isNotEmpty)
                          GestureDetector(
                            onTap: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                                _displayLimit = 4;
                              });
                            },
                            child: const Icon(Icons.cancel_rounded, size: 18, color: Color(0xFF94A3B8)),
                          ),
                      ],
                    ),
                  ),
                ),

                // 3. Scrollable Body Content
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
                    children: [
                      // Find from Contacts Deep Green Card Banner (matching Home Screen Active Match #052417)
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (ctx) => SyncContactsScreen(
                                onContactsAllowed: () {
                                  setState(() => _contactsSynced = true);
                                  _showContactsBottomSheet(context, allRealCompetitors);
                                },
                              ),
                            ),
                          );
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF052417),
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(color: const Color(0xFF0D3826)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.18),
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
                                    painter: _TopographicPatternPainter(),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Find from Contacts',
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w700,
                                                color: Colors.white,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              'Connect to see who\'s on OpenclubOS',
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 12,
                                                color: const Color(0xFF8FAEA2),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      GestureDetector(
                                        onTap: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (ctx) => SyncContactsScreen(
                                                onContactsAllowed: () {
                                                  setState(() => _contactsSynced = true);
                                                  _showContactsBottomSheet(context, allRealCompetitors);
                                                },
                                              ),
                                            ),
                                          );
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            'CONNECT',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              color: const Color(0xFF052417),
                                              letterSpacing: 0.6,
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
                      ),

                      const SizedBox(height: 18),

                      // Section Header: PLAYERS YOU MAY KNOW
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            query.isEmpty ? 'PLAYERS YOU MAY KNOW' : 'SEARCH RESULTS (${allMatchedList.length})',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF64748B),
                              letterSpacing: 0.8,
                            ),
                          ),
                          if (query.isNotEmpty && allMatchedList.isNotEmpty)
                            Text(
                              filteredList.length < allMatchedList.length
                                  ? 'Showing ${filteredList.length} of ${allMatchedList.length}'
                                  : 'All ${allMatchedList.length}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF94A3B8),
                                letterSpacing: 0.4,
                              ),
                            ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      // Recommended Real Competitor Cards (Strictly using App's Own Box Shadow)
                      ...filteredList.map((player) {
                        final compId = player['id']?.toString() ?? '';
                        final name = player['name']?.toString() ?? 'Golfer';
                        final isSent = _localSentIds.contains(compId);
                        final isConnected = _localAcceptedIds.contains(compId) || _localAcceptedIds.contains(name.toLowerCase());
                        final isIncoming = _isIncomingPlayer(player);
                        final club = player['club']?.toString() ?? '';
                        final hcp = player['hcp']?.toString() ?? '12';
                        final initial = (player['initial'] ?? (name.isNotEmpty ? name[0] : 'G')).toString().toUpperCase();

                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
                          child: Row(
                            children: [
                              // Avatar with Status Badge
                              Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  _buildPlayerAvatar(name, player['avatar']?.toString() ?? player['profilePhoto']?.toString()),
                                  Positioned(
                                    bottom: -1,
                                    right: -1,
                                    child: Container(
                                      width: 16,
                                      height: 16,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF009A60),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.white, width: 2),
                                      ),
                                      child: const Center(
                                        child: Icon(Icons.check_rounded, size: 10, color: Colors.white),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 12),
                              // Name & Subtitle displaying Club and HCP (No mutuals)
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Wrap(
                                      crossAxisAlignment: WrapCrossAlignment.center,
                                      spacing: 6,
                                      runSpacing: 2,
                                      children: [
                                        Text(
                                          name,
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        if (isConnected)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEAF7EE),
                                              borderRadius: BorderRadius.circular(20),
                                              border: Border.all(color: const Color(0xFFC6F0DB)),
                                            ),
                                            child: Text(
                                              'Friend',
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF009A60),
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      club.isNotEmpty ? '$club | $hcp HCP' : '$hcp HCP',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: const Color(0xFF64748B),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Right Action Button: Four Authentic Interactive States
                              if (isConnected)
                                GestureDetector(
                                  onTap: () => _showFriendActionSheet(player),
                                  child: Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: const Center(
                                      child: Icon(Icons.more_horiz_rounded, size: 18, color: Color(0xFF64748B)),
                                    ),
                                  ),
                                )
                              else if (isIncoming)
                                // Incoming state: displays mark icon button (accept) + cancel icon button (decline)
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Accept Mark Icon Button
                                    GestureDetector(
                                      onTap: () => _acceptIncomingRequest(player),
                                      child: Container(
                                        width: 34,
                                        height: 34,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF009A60),
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF009A60).withOpacity(0.25),
                                              blurRadius: 4,
                                              offset: const Offset(0, 1),
                                            ),
                                          ],
                                        ),
                                        child: const Center(
                                          child: Icon(Icons.check_rounded, size: 18, color: Colors.white),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    // Cancel Icon Button
                                    GestureDetector(
                                      onTap: () => _declineIncomingRequest(player),
                                      child: Container(
                                        width: 34,
                                        height: 34,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFEF2F2),
                                          shape: BoxShape.circle,
                                          border: Border.all(color: const Color(0xFFFECACA)),
                                        ),
                                        child: const Center(
                                          child: Icon(Icons.close_rounded, size: 16, color: Color(0xFFEF4444)),
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              else if (isSent)
                                // Sent state: displays SENT text + subtle red circular X cancel button
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'SENT',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF94A3B8),
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    GestureDetector(
                                      onTap: () => _toggleSendRequest(player),
                                      child: Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFEF2F2),
                                          shape: BoxShape.circle,
                                          border: Border.all(color: const Color(0xFFFECACA)),
                                        ),
                                        child: const Center(
                                          child: Icon(Icons.close_rounded, size: 16, color: Color(0xFFEF4444)),
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              else
                                // Unsent state: displays circular emerald add friend button
                                GestureDetector(
                                  onTap: () => _toggleSendRequest(player),
                                  child: Container(
                                    width: 36,
                                    height: 36,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF009A60),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Center(
                                      child: Icon(Icons.person_add_rounded, size: 18, color: Colors.white),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),

                      // Empty state when suggestions are empty
                      if (filteredList.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Column(
                            children: [
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEAF7EE),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: const Color(0xFFC6F0DB)),
                                ),
                                child: const Center(
                                  child: Icon(Icons.people_outline_rounded, color: Color(0xFF009A60), size: 26),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                query.isNotEmpty ? 'No Matching Golfers' : 'All Caught Up!',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                query.isNotEmpty
                                    ? 'Try searching with a different name or club.'
                                    : 'You are connected with all recommended golfers right now.',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: const Color(0xFF64748B),
                                  height: 1.4,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),

                      // Lazy Loading: Show More Button
                      if (hasMoreResults)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: GestureDetector(
                            onTap: () => setState(() => _displayLimit += 4),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 12),
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
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.expand_more_rounded, size: 18, color: Color(0xFF009A60)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Show More (${allMatchedList.length - filteredList.length} remaining)',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF009A60),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      const SizedBox(height: 12),

                      // Share Invitation Link Card (Displayed After Player Suggestions)
                      _buildShareInviteLinkCard(context, allRealCompetitors),

                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInitialAvatar(String initial) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7EE),
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFC6F0DB)),
      ),
      child: Center(
        child: Text(
          initial,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF009A60),
          ),
        ),
      ),
    );
  }
}

/// Custom painter for subtle golf topographic contour curves inside card backgrounds
class _TopographicPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint1 = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.18)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.3;

    final path1 = Path()
      ..moveTo(-20, size.height * 0.6)
      ..quadraticBezierTo(size.width * 0.25, size.height * 0.2, size.width * 0.5, size.height * 0.55)
      ..quadraticBezierTo(size.width * 0.78, size.height * 0.3, size.width + 20, size.height * 0.62);
    canvas.drawPath(path1, paint1);

    final paint2 = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final path2 = Path()
      ..moveTo(-10, size.height * 0.32)
      ..quadraticBezierTo(size.width * 0.3, size.height * 0.72, size.width * 0.62, size.height * 0.28)
      ..quadraticBezierTo(size.width * 0.85, size.height * 0.52, size.width + 25, size.height * 0.4);
    canvas.drawPath(path2, paint2);

    // Concentric elevation rings around the right action button
    final center = Offset(size.width * 0.88, size.height * 0.5);
    final circlePaint = Paint()
      ..color = const Color(0xFF10B981).withOpacity(0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.9;
    canvas.drawCircle(center, 34, circlePaint);

    circlePaint.color = const Color(0xFF10B981).withOpacity(0.10);
    canvas.drawCircle(center, 56, circlePaint);

    circlePaint.color = const Color(0xFF10B981).withOpacity(0.06);
    canvas.drawCircle(center, 78, circlePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom painter for dashed rounded rectangle
class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double radius;
  final double dashWidth;
  final double dashSpace;

  DashedBorderPainter({
    required this.color,
    this.strokeWidth = 1.5,
    this.radius = 24.0,
    this.dashWidth = 6.0,
    this.dashSpace = 4.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(strokeWidth / 2, strokeWidth / 2, size.width - strokeWidth, size.height - strokeWidth),
        Radius.circular(radius),
      ));

    final dashPath = Path();
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final length = (distance + dashWidth < metric.length) ? dashWidth : metric.length - distance;
        dashPath.addPath(metric.extractPath(distance, distance + length), Offset.zero);
        distance += dashWidth + dashSpace;
      }
    }
    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}

class UniqueQrCodePainter extends CustomPainter {
  final String payload;
  final String initials;

  UniqueQrCodePainter({required this.payload, this.initials = 'OC'});

  /// Dynamically resolves the active application domain.
  static String get appDomain {
    const envDomain = String.fromEnvironment('APP_DOMAIN', defaultValue: '');
    if (envDomain.isNotEmpty) return envDomain;

    const apiUrl = String.fromEnvironment('API_URL', defaultValue: '');
    if (apiUrl.isNotEmpty) {
      try {
        final uri = Uri.parse(apiUrl);
        if (uri.host.isNotEmpty) return uri.host;
      } catch (_) {}
    }

    try {
      final base = ApiClient.resolveBaseUrl();
      final uri = Uri.parse(base);
      if (uri.host.isNotEmpty) return uri.host;
    } catch (_) {}

    return 'openclubos.com';
  }

  /// Dynamically resolves the active application base URL.
  static String get appBaseUrl {
    final domain = appDomain;
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      return domain;
    }
    if (domain.contains('localhost') || domain.contains('127.0.0.1')) {
      return 'http://$domain';
    }
    return 'https://$domain';
  }

  @override
  void paint(Canvas canvas, Size size) {
    const gridSize = 25;
    // 4-module quiet zone margin on all edges for effortless camera scanning
    final quietZone = size.width * 0.08;
    final contentSize = size.width - (2 * quietZone);
    final cellSize = contentSize / gridSize;

    final darkPaint = Paint()..color = const Color(0xFF052417)..style = PaintingStyle.fill;
    final emeraldPaint = Paint()..color = const Color(0xFF009A60)..style = PaintingStyle.fill;
    final whitePaint = Paint()..color = Colors.white..style = PaintingStyle.fill;

    // Draw clean white background for entire quiet zone
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, size.width, size.height), const Radius.circular(12)),
      whitePaint,
    );

    final grid = List.generate(gridSize, (_) => List.filled(gridSize, 0));
    final reserved = List.generate(gridSize, (_) => List.filled(gridSize, false));

    // Place corner finders
    void markFinder(int startR, int startC) {
      for (int r = -1; r <= 7; r++) {
        for (int c = -1; c <= 7; c++) {
          final tr = startR + r;
          final tc = startC + c;
          if (tr >= 0 && tr < gridSize && tc >= 0 && tc < gridSize) {
            reserved[tr][tc] = true;
          }
        }
      }
    }

    markFinder(0, 0);
    markFinder(0, gridSize - 7);
    markFinder(gridSize - 7, 0);

    // Timing tracks
    for (int c = 8; c < gridSize - 8; c++) {
      grid[6][c] = c % 2 == 0 ? 1 : 0;
      reserved[6][c] = true;
    }
    for (int r = 8; r < gridSize - 8; r++) {
      grid[r][6] = r % 2 == 0 ? 1 : 0;
      reserved[r][6] = true;
    }

    // Center emblem area (5x5)
    final mid = gridSize ~/ 2;
    for (int r = mid - 2; r <= mid + 2; r++) {
      for (int c = mid - 2; c <= mid + 2; c++) {
        reserved[r][c] = true;
      }
    }

    // Deterministic FNV-1a hash of payload
    int hash = 2166136261;
    for (int i = 0; i < payload.length; i++) {
      hash ^= payload.codeUnitAt(i);
      hash = (hash * 16777619) & 0xFFFFFFFF;
    }

    for (int r = 0; r < gridSize; r++) {
      for (int c = 0; c < gridSize; c++) {
        if (!reserved[r][c]) {
          int cellHash = hash ^ ((r * 397) ^ (c * 7919));
          cellHash = ((cellHash ^ (cellHash >> 16)) * 2246822507) & 0xFFFFFFFF;
          cellHash = ((cellHash ^ (cellHash >> 13)) * 3266489909) & 0xFFFFFFFF;
          cellHash = (cellHash ^ (cellHash >> 16)) & 0xFFFFFFFF;
          grid[r][c] = (cellHash % 100) < 48 ? 1 : 0;
        }
      }
    }

    // Draw data cells with quiet zone offset
    for (int r = 0; r < gridSize; r++) {
      for (int c = 0; c < gridSize; c++) {
        final isCorner = (r < 7 && c < 7) ||
            (r < 7 && c >= gridSize - 7) ||
            (r >= gridSize - 7 && c < 7);
        final isCenter = r >= mid - 2 && r <= mid + 2 && c >= mid - 2 && c <= mid + 2;
        if (isCorner || isCenter) continue;

        if (grid[r][c] == 1) {
          final rect = RRect.fromRectAndRadius(
            Rect.fromLTWH(
              quietZone + c * cellSize + 0.3,
              quietZone + r * cellSize + 0.3,
              cellSize - 0.6,
              cellSize - 0.6,
            ),
            const Radius.circular(1),
          );
          canvas.drawRRect(rect, darkPaint);
        }
      }
    }

    // Helper to draw clean authentic 7x7 corner finder pattern (1:1:3:1:1 concentric ratio, high-contrast dark core)
    void drawFinder(double x, double y) {
      final outerRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, y, 7 * cellSize, 7 * cellSize),
        const Radius.circular(5),
      );
      canvas.drawRRect(outerRect, darkPaint);

      final midRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize),
        const Radius.circular(3),
      );
      canvas.drawRRect(midRect, whitePaint);

      final coreRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize),
        const Radius.circular(2),
      );
      canvas.drawRRect(coreRect, darkPaint);
    }

    drawFinder(quietZone, quietZone);
    drawFinder(quietZone + (gridSize - 7) * cellSize, quietZone);
    drawFinder(quietZone, quietZone + (gridSize - 7) * cellSize);

    // Center Monogram Emblem
    final emblemRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        quietZone + (mid - 2) * cellSize,
        quietZone + (mid - 2) * cellSize,
        5 * cellSize,
        5 * cellSize,
      ),
      const Radius.circular(6),
    );
    canvas.drawRRect(emblemRect, whitePaint);
    final emblemBorder = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawRRect(emblemRect, emblemBorder);

    canvas.drawCircle(
      Offset(quietZone + mid * cellSize + cellSize / 2, quietZone + mid * cellSize + cellSize / 2),
      1.7 * cellSize,
      emeraldPaint,
    );

    // Draw Initials
    final textSpan = TextSpan(
      text: initials.isNotEmpty ? initials : 'OC',
      style: const TextStyle(
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.w700,
      ),
    );
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        (quietZone + mid * cellSize + cellSize / 2) - textPainter.width / 2,
        (quietZone + mid * cellSize + cellSize / 2) - textPainter.height / 2,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant UniqueQrCodePainter oldDelegate) {
    return oldDelegate.payload != payload || oldDelegate.initials != initials;
  }
}

