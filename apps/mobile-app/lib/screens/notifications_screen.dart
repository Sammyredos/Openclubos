import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive/hive.dart';
import '../core/formatters.dart';

class NotificationsScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  final List<Map<String, dynamic>> initialNotifications;
  final VoidCallback? onDismissAll;
  final Function(Map<String, dynamic>)? onAcceptFriendRequest;
  final Function(Map<String, dynamic>)? onDeclineFriendRequest;

  const NotificationsScreen({
    super.key,
    required this.user,
    required this.initialNotifications,
    this.onDismissAll,
    this.onAcceptFriendRequest,
    this.onDeclineFriendRequest,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late List<Map<String, dynamic>> _notifications;
  bool _isAllRead = false;

  @override
  void initState() {
    super.initState();
    _notifications = List<Map<String, dynamic>>.from(widget.initialNotifications);
  }

  Future<void> _markAllAsRead() async {
    setState(() {
      _isAllRead = true;
      for (final n in _notifications) {
        final nType = (n['type'] ?? '').toString().toLowerCase();
        final nData = n['data'] is Map ? n['data'] as Map : {};
        final isFriend = nType.contains('friend') && !nType.contains('accepted');
        if (!isFriend) {
          n['unread'] = false;
          n['isRead'] = true;
        }
      }
    });

    try {
      final userId = widget.user?['id']?.toString() ?? 'anonymous';
      final box = await Hive.openBox('auth');
      await box.put('user_notifications_$userId', _notifications);
    } catch (_) {}

    if (widget.onDismissAll != null) {
      widget.onDismissAll!();
    }
  }

  Future<void> _handleCardClick(Map<String, dynamic> item) async {
    if (item['isRead'] != true || item['unread'] != false) {
      setState(() {
        item['isRead'] = true;
        item['unread'] = false;
      });
      try {
        final userId = widget.user?['id']?.toString() ?? 'anonymous';
        final box = await Hive.openBox('auth');
        await box.put('user_notifications_$userId', _notifications);
      } catch (_) {}
    }
  }


  Future<void> _handleDeclineFriendRequest(Map<String, dynamic> item) async {
    final reqData = item['data'] is Map ? item['data'] as Map : item;
    final senderId = reqData['senderId']?.toString() ?? item['senderId']?.toString();
    final reqId = reqData['id']?.toString() ?? reqData['requestId']?.toString() ?? item['id']?.toString();
    final userId = widget.user?['id']?.toString() ?? widget.user?['email']?.toString() ?? 'anonymous';

    setState(() {
      _notifications.removeWhere((n) {
        final nData = n['data'] is Map ? n['data'] as Map : {};
        if (reqId != null && (n['id'] == reqId || nData['requestId'] == reqId)) return true;
        if (senderId != null && (nData['senderId'] == senderId || n['senderId'] == senderId)) return true;
        return false;
      });
    });

    try {
      final box = await Hive.openBox('auth');
      await box.put('user_notifications_$userId', _notifications);

      final incomingRaw = box.get('incoming_friend_requests_$userId');
      if (incomingRaw is List) {
        final updated = List<Map<String, dynamic>>.from(incomingRaw)
          ..removeWhere((r) => (senderId != null && r['senderId']?.toString() == senderId) || (reqId != null && r['id']?.toString() == reqId));
        await box.put('incoming_friend_requests_$userId', updated);
      }

      if (senderId != null) {
        final senderSentRaw = box.get('sent_friend_requests_$senderId');
        if (senderSentRaw is List) {
          final updatedSent = List.from(senderSentRaw)
            ..removeWhere((id) => id.toString() == userId || id.toString() == widget.user?['email']?.toString());
          await box.put('sent_friend_requests_$senderId', updatedSent);
        }
      }
    } catch (_) {}

    widget.onDeclineFriendRequest?.call(Map<String, dynamic>.from(reqData));

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

  Future<void> _handleAcceptFriendRequest(Map<String, dynamic> item) async {
    final reqData = item['data'] is Map ? item['data'] as Map : item;
    final senderId = reqData['senderId']?.toString() ?? item['senderId']?.toString();
    final senderName = reqData['senderName']?.toString() ??
        item['senderName']?.toString() ??
        reqData['userName']?.toString() ??
        'a golfer';
    final reqId = reqData['id']?.toString() ?? reqData['requestId']?.toString() ?? item['id']?.toString();
    final userId = widget.user?['id']?.toString() ?? widget.user?['email']?.toString() ?? 'anonymous';

    final acceptedNotif = {
      'id': 'notif_acc_rec_${DateTime.now().millisecondsSinceEpoch}',
      'title': 'Friend Request Accepted',
      'body': 'You and $senderName are now connected!',
      'message': 'You and $senderName are now connected!',
      'isRead': false,
      'unread': true,
      'createdAt': DateTime.now().toIso8601String(),
      'type': 'FRIEND_ACCEPTED',
      'data': {
        'type': 'FRIEND_ACCEPTED',
        'userId': senderId,
        'userName': senderName,
      },
    };

    setState(() {
      _notifications.removeWhere((n) {
        final nData = n['data'] is Map ? n['data'] as Map : {};
        final nType = (n['type'] ?? nData['type'] ?? '').toString().toUpperCase();
        if (reqId != null && (n['id'] == reqId || nData['requestId'] == reqId)) return true;
        if (senderId != null && (nData['senderId'] == senderId || n['senderId'] == senderId)) return true;
        // Also remove any pre-existing FRIEND_ACCEPTED from same sender to prevent duplicate cards
        if (senderId != null && nData['userId']?.toString() == senderId && nType == 'FRIEND_ACCEPTED') return true;
        return false;
      });
      _notifications.insert(0, acceptedNotif);
    });

    try {
      final box = await Hive.openBox('auth');
      await box.put('user_notifications_$userId', _notifications);

      final incomingRaw = box.get('incoming_friend_requests_$userId');
      if (incomingRaw is List) {
        final updated = List<Map<String, dynamic>>.from(incomingRaw)
          ..removeWhere((r) => (senderId != null && r['senderId']?.toString() == senderId) || (reqId != null && r['id']?.toString() == reqId));
        await box.put('incoming_friend_requests_$userId', updated);
      }

      if (senderId != null) {
        final acceptedRaw = box.get('accepted_friend_ids_$userId');
        final Set<String> accepted = acceptedRaw is List ? Set<String>.from(acceptedRaw.map((e) => e.toString())) : {};
        accepted.add(senderId);
        await box.put('accepted_friend_ids_$userId', accepted.toList());
      }
    } catch (_) {}

    widget.onAcceptFriendRequest?.call(Map<String, dynamic>.from(reqData));

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

  Future<void> _dismissAll() async {
    setState(() {
      _isAllRead = true;
      for (final n in _notifications) {
        n['unread'] = false;
        n['isRead'] = true;
      }
    });

    try {
      final userId = widget.user?['id']?.toString() ?? 'anonymous';
      final box = await Hive.openBox('auth');
      await box.put('user_notifications_$userId', _notifications);
    } catch (_) {}

    if (widget.onDismissAll != null) {
      widget.onDismissAll!();
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All notifications marked as read.'),
          backgroundColor: Color(0xFF009A60),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  String _formatTime(dynamic dateVal) {
    if (dateVal == null) return 'Just now';
    try {
      final DateTime dt = dateVal is DateTime
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

  String _getInitials(String name) {
    if (name.trim().isEmpty) return 'PL';
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.length == 1) {
      return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
    }
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  Widget _buildFriendRequestCard(Map<String, dynamic> item) {
    final data = item['data'] is Map ? item['data'] as Map : {};
    final senderId = (item['senderId'] ?? data['senderId'] ?? data['userId'] ?? item['id'])?.toString() ?? '';
    final rawSenderName = (item['senderName'] ?? data['senderName'] ?? data['userName'] ?? 'Golfer').toString();
    final senderName = rawSenderName.isEmpty ? 'Golfer' : rawSenderName;
    final senderClub = (item['senderClub'] ?? data['senderClub'] ?? data['club'] ?? '').toString();
    final senderHcp = (item['senderHcp'] ?? data['senderHcp'] ?? data['hcp'] ?? '').toString();
    final createdAt = item['createdAt'];
    final timeStr = _formatTime(createdAt);
    final reqId = (item['id'] ?? data['requestId'] ?? 'freq_$senderId').toString();
    final hasActions = senderId.isNotEmpty;

    return Container(
      key: ValueKey(reqId),
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFC6F0DB), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Ripple background pattern
          Positioned.fill(
            child: CustomPaint(
              painter: _FriendRipplePatternPainter(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar / Initials circle with UserPlus badge
                SizedBox(
                  width: 36,
                  height: 36,
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF7EE),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFC6F0DB)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF009A60).withOpacity(0.06),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _getInitials(senderName),
                          style: GoogleFonts.dmSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF009A60),
                          ),
                        ),
                      ),
                      // UserPlus badge at bottom-right
                      Positioned(
                        bottom: -2,
                        right: -2,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: const Color(0xFF009A60),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          child: const Icon(
                            Icons.person_add_rounded,
                            size: 8,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              senderName,
                              style: GoogleFonts.dmSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            timeStr,
                            style: GoogleFonts.dmSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF8CA0BA),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        senderClub.isNotEmpty
                            ? '$senderClub${senderHcp.isNotEmpty ? " • HCP $senderHcp" : ""}'
                            : 'Sent you a friend request',
                        style: GoogleFonts.dmSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      if (hasActions) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 34,
                                child: ElevatedButton(
                                  onPressed: () => _handleAcceptFriendRequest(item),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF009A60),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    padding: EdgeInsets.zero,
                                  ),
                                  child: Text(
                                    'ACCEPT',
                                    style: GoogleFonts.dmSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              height: 34,
                              child: ElevatedButton(
                                onPressed: () => _handleDeclineFriendRequest(item),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFEEF2F6),
                                  foregroundColor: const Color(0xFF64748B),
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                ),
                                child: Text(
                                  'DECLINE',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> item) {
    // Route all incoming friend requests to the dedicated Card 1 design
    final type = (item['type'] ?? '').toString().toLowerCase();
    final itemData = item['data'] is Map ? item['data'] as Map : {};
    final isFriendAccepted = type.contains('accepted') ||
        itemData['type'] == 'FRIEND_ACCEPTED' ||
        (item['title'] ?? '').toString().toLowerCase().contains('accepted');
    final isFriendSent = type.contains('sent') ||
        itemData['type'] == 'FRIEND_SENT' ||
        (item['title'] ?? '').toString().toLowerCase().contains('sent');
    final isFriendRequest = !isFriendAccepted &&
        !isFriendSent &&
        (type == 'friend_request' ||
            itemData['type'] == 'FRIEND_REQUEST' ||
            ((item['title'] ?? '').toString().toLowerCase().contains('friend request') &&
                !(item['title'] ?? '').toString().toLowerCase().contains('flight')));

    if (isFriendRequest) {
      return _buildFriendRequestCard(item);
    }

    final title = item['title']?.toString() ?? 'Notification';
    final message = (item['message'] ?? item['body'] ?? '').toString();
    final timeStr = _formatTime(item['createdAt']);
    final isUnread = !_isAllRead && (item['isRead'] != true && item['unread'] != false);
    // Note: type, itemData, isFriendAccepted, isFriendSent, isFriendRequest already declared above
    final shouldDim = !isUnread && !isFriendRequest;

    final isFlightGrouping = type.contains('flight') ||
        type.contains('group') ||
        title.toLowerCase().contains('flight grouping');

    List<String> flightPartners = [];
    String flightName = '';
    String tournamentName = '';

    if (isFlightGrouping) {
      if (item['data'] is Map) {
        final d = item['data'] as Map;
        if (d['flightPartners'] is List) {
          flightPartners = (d['flightPartners'] as List).map((e) => e.toString().trim()).where((s) => s.isNotEmpty).toList();
        }
        flightName = d['flightName']?.toString() ?? d['groupName']?.toString() ?? '';
        tournamentName = d['tournamentName']?.toString() ?? '';
      }

      if (flightPartners.isEmpty && message.isNotEmpty) {
        final multilineMatch = RegExp(r'You are grouped with:\s*([\s\S]*?)\s*for\s+(.*?)\s+of\s+(.*?)\.?$', caseSensitive: false).firstMatch(message);
        if (multilineMatch != null) {
          final namesStr = multilineMatch.group(1) ?? '';
          flightPartners = namesStr.split('\n').map((s) => s.replaceAll(RegExp(r'-\d+$'), '').trim()).where((s) => s.isNotEmpty).toList();
          if (flightName.isEmpty) flightName = multilineMatch.group(2)?.trim() ?? '';
          if (tournamentName.isEmpty) tournamentName = multilineMatch.group(3)?.replaceAll(RegExp(r'\.$'), '').trim() ?? '';
        } else {
          final singleMatch = RegExp(r'You are grouped with\s+(.*?)\s+for\s+(.*?)\.?$', caseSensitive: false).firstMatch(message);
          if (singleMatch != null) {
            final namesStr = singleMatch.group(1) ?? '';
            flightPartners = namesStr.split(',').map((s) => s.replaceAll(RegExp(r'-\d+$'), '').trim()).where((s) => s.isNotEmpty).toList();
            final rest = singleMatch.group(2)?.trim() ?? '';
            if (rest.contains(' of ')) {
              final parts = rest.split(' of ');
              if (flightName.isEmpty) flightName = parts[0].trim();
              if (tournamentName.isEmpty) tournamentName = parts[1].replaceAll(RegExp(r'\.$'), '').trim();
            } else if (flightName.isEmpty) {
              flightName = rest;
            }
          }
        }
      }

      if (flightName.isEmpty && title.contains(':')) {
        flightName = title.split(':').last.trim();
      }
    }

    IconData iconData = Icons.notifications_rounded;
    Color iconColor = const Color(0xFF009A60);
    Color iconBg = const Color(0xFFEAF7EE);
    Color iconBorder = const Color(0xFFC6F0DB);

    if (isFlightGrouping) {
      iconData = Icons.groups_rounded;
      iconColor = const Color(0xFF009A60);
      iconBg = const Color(0xFFEAF7EE);
      iconBorder = const Color(0xFFC6F0DB);
    } else if (type.contains('pair') || type.contains('tourn') || type.contains('leaderboard')) {
      iconData = Icons.emoji_events_rounded;
      iconColor = const Color(0xFF009A60);
      iconBg = const Color(0xFFEAF7EE);
      iconBorder = const Color(0xFFC6F0DB);
    } else if (isFriendAccepted) {
      iconData = Icons.groups_rounded;
      iconColor = const Color(0xFF009A60);
      iconBg = const Color(0xFFEAF7EE);
      iconBorder = const Color(0xFFC6F0DB);
    } else if (isFriendRequest) {
      iconData = Icons.person_add_rounded;
      iconColor = const Color(0xFF009A60);
      iconBg = const Color(0xFFEAF7EE);
      iconBorder = const Color(0xFFC6F0DB);
    } else if (type.contains('book') || type.contains('lesson') || type.contains('pro')) {
      iconData = Icons.calendar_month_rounded;
      iconColor = const Color(0xFF7C3AED);
      iconBg = const Color(0xFFF5F3FF);
      iconBorder = const Color(0xFFDDD6FE);
    } else if (type.contains('alert') || type.contains('warn')) {
      iconData = Icons.warning_amber_rounded;
      iconColor = const Color(0xFFD97706);
      iconBg = const Color(0xFFFFFBEB);
      iconBorder = const Color(0xFFFDE68A);
    }

    return GestureDetector(
      onTap: () => _handleCardClick(item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isUnread ? const Color(0xFFC6F0DB) : const Color(0xFFE2E8F0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: iconBorder),
                  ),
                  child: Icon(iconData, color: iconColor, size: 16),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Opacity(
                    opacity: shouldDim ? 0.6 : 1.0,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: isFlightGrouping
                                ? Row(
                                    children: [
                                      Text(
                                        'Flight Grouping',
                                        style: GoogleFonts.dmSans(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEAF7EE),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: const Color(0xFFC6F0DB)),
                                        ),
                                        child: Text(
                                          flightPartners.isNotEmpty
                                              ? '${flightPartners.length} PLAYERS'
                                              : 'PLAYERS',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF009A60),
                                          ),
                                        ),
                                      ),
                                    ],
                                  )
                                : Text(
                                    title,
                                    style: GoogleFonts.dmSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                          ),
                          Row(
                            children: [
                              Text(
                                timeStr,
                                style: GoogleFonts.dmSans(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF8CA0BA),
                                ),
                              ),
                              if (isUnread) ...[
                                const SizedBox(width: 6),
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF009A60),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                      if (isFlightGrouping) ...[
                        if (tournamentName.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            toTitleCase(tournamentName),
                            style: GoogleFonts.dmSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                        if (flightPartners.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.only(top: 8),
                            decoration: const BoxDecoration(
                              border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  flightName.isNotEmpty
                                      ? '${flightName.toUpperCase()} • GROUPED WITH:'
                                      : 'GROUPED WITH:',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF8CA0BA),
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: flightPartners.map((p) {
                                    return Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 2.5),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 20,
                                            height: 20,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEAF7EE),
                                              shape: BoxShape.circle,
                                              border: Border.all(color: const Color(0xFFC6F0DB)),
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              _getInitials(p),
                                              style: GoogleFonts.dmSans(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w900,
                                                color: const Color(0xFF009A60),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              p,
                                              style: GoogleFonts.dmSans(
                                                fontSize: 12.5,
                                                fontWeight: FontWeight.w600,
                                                color: const Color(0xFF0F172A),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ),
                          ),
                        ] else if (message.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            message,
                            style: GoogleFonts.dmSans(
                              fontSize: 12.5,
                              color: const Color(0xFF475569),
                              height: 1.35,
                            ),
                          ),
                        ],
                      ] else if (message.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          message,
                          style: GoogleFonts.dmSans(
                            fontSize: 12.5,
                            color: const Color(0xFF475569),
                            height: 1.35,
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
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final seenKeys = <String>{};
    final deduplicatedNotifs = <Map<String, dynamic>>[];
    for (final notif in _notifications) {
      final nData = notif['data'] is Map ? notif['data'] as Map : {};
      final nTitle = (notif['title'] ?? '').toString().trim().toLowerCase();
      final nBody = (notif['body'] ?? notif['message'] ?? notif['desc'] ?? '').toString().trim().toLowerCase();
      final nType = (notif['type'] ?? nData['type'] ?? '').toString().toUpperCase();
      final isFriendAccepted = nType == 'FRIEND_ACCEPTED' ||
          nTitle.contains('friend request accepted') ||
          nBody.contains('accepted your friend request');
      final friendId = (nData['userId'] ?? notif['userId'] ?? nData['senderId'] ?? notif['senderId'] ?? '')
          .toString()
          .trim()
          .toLowerCase();
      final friendName = (nData['userName'] ?? nData['senderName'] ?? notif['userName'] ?? '')
          .toString()
          .trim()
          .toLowerCase();
      final key = isFriendAccepted && (friendId.isNotEmpty || friendName.isNotEmpty)
          ? 'FRIEND_ACCEPTED_${friendId.isNotEmpty ? friendId : friendName}'
          : '${nTitle}:::$nBody';
      if (key.isNotEmpty && seenKeys.contains(key)) continue;
      seenKeys.add(key);
      deduplicatedNotifs.add(notif);
    }

  DateTime _parseNotificationDateTime(dynamic dateVal, [dynamic notifId]) {
    if (dateVal is DateTime) return dateVal;
    if (dateVal != null) {
      final parsed = DateTime.tryParse(dateVal.toString());
      if (parsed != null) return parsed;
    }
    // Attempt extraction from ID if it contains epoch milliseconds (e.g. notif_freq_1789...)
    if (notifId != null) {
      final match = RegExp(r'(\d{10,13})').firstMatch(notifId.toString());
      if (match != null) {
        final ms = int.tryParse(match.group(1)!);
        if (ms != null) return DateTime.fromMillisecondsSinceEpoch(ms);
      }
    }
    return DateTime.now();
  }

  @override
  Widget build(BuildContext context) {
    // Partition notifications chronologically
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final yesterdayStart = todayStart.subtract(const Duration(days: 1));

    final todayNotifs = <Map<String, dynamic>>[];
    final yesterdayNotifs = <Map<String, dynamic>>[];
    final earlierNotifs = <Map<String, dynamic>>[];

    for (final notif in deduplicatedNotifs) {
      final dateVal = notif['createdAt'] ?? notif['time'];
      final dt = _parseNotificationDateTime(dateVal, notif['id']);
      if (dt.isAfter(todayStart) || dt.isAtSameMomentAs(todayStart)) {
        todayNotifs.add(notif);
      } else if (dt.isAfter(yesterdayStart) || dt.isAtSameMomentAs(yesterdayStart)) {
        yesterdayNotifs.add(notif);
      } else {
        earlierNotifs.add(notif);
      }
    }

    // Sort strictly in reverse-chronological order: latest notification is first to display
    todayNotifs.sort((a, b) {
      final dtA = _parseNotificationDateTime(a['createdAt'] ?? a['time'], a['id']);
      final dtB = _parseNotificationDateTime(b['createdAt'] ?? b['time'], b['id']);
      return dtB.compareTo(dtA);
    });

    yesterdayNotifs.sort((a, b) {
      final dtA = _parseNotificationDateTime(a['createdAt'] ?? a['time'], a['id']);
      final dtB = _parseNotificationDateTime(b['createdAt'] ?? b['time'], b['id']);
      return dtB.compareTo(dtA);
    });

    earlierNotifs.sort((a, b) {
      final dtA = _parseNotificationDateTime(a['createdAt'] ?? a['time'], a['id']);
      final dtB = _parseNotificationDateTime(b['createdAt'] ?? b['time'], b['id']);
      return dtB.compareTo(dtA);
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. FIXED TOP SECTION: Top Navigation Bar (Strictly Non-Scrollable, Centered Title)
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 0.8)),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x06000000),
                        blurRadius: 4,
                        offset: Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 14),
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
                        Text(
                          'Notifications',
                          style: GoogleFonts.dmSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        // Empty balance spacer to preserve mathematical center alignment
                        const SizedBox(width: 36, height: 36),
                      ],
                    ),
                  ),
                ),

                // 2. Scrollable Feed Content: Pure Dynamic Database Data
                Expanded(
                  child: deduplicatedNotifs.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEAF7EE),
                                    borderRadius: BorderRadius.circular(24),
                                    border: Border.all(color: const Color(0xFFC6F0DB)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF009A60).withOpacity(0.06),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.notifications_none_rounded,
                                    size: 32,
                                    color: Color(0xFF009A60),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No Notifications',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'All caught up! Real-time tournament updates, pairings, and announcements from the database will appear here.',
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.dmSans(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                    height: 1.45,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              children: [
                                if (todayNotifs.isNotEmpty) ...[
                                  Padding(
                                    padding: const EdgeInsets.only(left: 4, right: 4, bottom: 10, top: 4),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'TODAY',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF8CA0BA),
                                            letterSpacing: 1.2,
                                          ),
                                        ),
                                        if (!_isAllRead && todayNotifs.any((n) => n['unread'] == true || n['isRead'] == false))
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF009A60),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  ...todayNotifs.map(_buildNotificationItem),
                                ],
                                if (yesterdayNotifs.isNotEmpty) ...[
                                  Padding(
                                    padding: const EdgeInsets.only(left: 4, right: 4, bottom: 10, top: 12),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'YESTERDAY',
                                          style: GoogleFonts.dmSans(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF8CA0BA),
                                            letterSpacing: 1.2,
                                          ),
                                        ),
                                        if (!_isAllRead && yesterdayNotifs.any((n) => n['unread'] == true || n['isRead'] == false))
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF009A60),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  ...yesterdayNotifs.map(_buildNotificationItem),
                                ],
                                if (earlierNotifs.isNotEmpty) ...[
                                  Padding(
                                    padding: const EdgeInsets.only(left: 4, right: 4, bottom: 10, top: 12),
                                    child: Text(
                                      'EARLIER',
                                      style: GoogleFonts.dmSans(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF8CA0BA),
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                  ),
                                  ...earlierNotifs.map(_buildNotificationItem),
                                ],
                                const SizedBox(height: 20),
                              ],
                            ),
                ),

                // Bottom nav removed as requested — notifications is a full-screen detail page
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Custom painter for Incoming Friend Request notifications
/// Features subtle welcoming social ripple rings radiating from the avatar
class _FriendRipplePatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = const Offset(35, 35);

    // Ripple concentric circles
    final ripplePaint = Paint()
      ..color = const Color(0xFF2563EB).withOpacity(0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (double r = 28; r <= 110; r += 20) {
      canvas.drawCircle(center, r, ripplePaint);
    }

    // Welcoming subtle social connectivity arc
    final arcPaint = Paint()
      ..color = const Color(0xFF009A60).withOpacity(0.04)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    for (double r = 38; r <= 98; r += 30) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: r),
        0.2,
        2.2,
        false,
        arcPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
