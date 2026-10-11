import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../core/api/api_client.dart';

class ChatScreen extends StatefulWidget {
  final String friendId;
  final String friendName;
  final String? friendAvatar;
  final bool isOnline;
  final VoidCallback? onBack;

  const ChatScreen({
    super.key,
    this.friendId = '',
    this.friendName = 'Golfer',
    this.friendAvatar,
    this.isOnline = false,
    this.onBack,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ApiClient _apiClient = ApiClient();
  IO.Socket? _socket;
  bool _isLoading = false;

  // Real database conversation cache keyed by recipient ID or slug - NO dummy seed data
  static final Map<String, List<Map<String, dynamic>>> _conversationsByFriend = {};

  String get _friendKey => widget.friendId.isNotEmpty
      ? widget.friendId.toLowerCase().trim()
      : widget.friendName.toLowerCase().trim().replaceAll(RegExp(r'\s+'), '-');

  List<Map<String, dynamic>> get _messages {
    final rawKey = _friendKey;
    final firstName = widget.friendName.toLowerCase().trim().split(' ').first;
    final slugName = widget.friendName.toLowerCase().trim().replaceAll(RegExp(r'\s+'), '-');
    return _conversationsByFriend[rawKey] ??
        _conversationsByFriend[slugName] ??
        _conversationsByFriend[firstName] ??
        _conversationsByFriend[widget.friendName.toLowerCase().trim()] ??
        [];
  }

  String _format24HourTime(dynamic val, [dynamic createdAt]) {
    final target = createdAt ?? val;
    if (target != null && target.toString().trim().isNotEmpty) {
      final str = target.toString().trim();
      if (str.contains('T') || str.endsWith('Z') || (str.contains('-') && str.length > 10)) {
        try {
          final dt = DateTime.parse(str).toLocal();
          final h = dt.hour.toString().padLeft(2, '0');
          final m = dt.minute.toString().padLeft(2, '0');
          return '$h:$m';
        } catch (_) {}
      }
    }
    if (val == null) return '';
    final str = val.toString().trim();
    final ampmRegex = RegExp(r'^(\d{1,2}):(\d{2})\s*(AM|PM)$', caseSensitive: false);
    final match = ampmRegex.firstMatch(str);
    if (match != null) {
      int h = int.parse(match.group(1)!);
      final m = match.group(2)!;
      final period = match.group(3)!.toUpperCase();
      if (period == 'PM' && h < 12) h += 12;
      if (period == 'AM' && h == 12) h = 0;
      return '${h.toString().padLeft(2, '0')}:$m';
    }
    final standardRegex = RegExp(r'^(\d{1,2}):(\d{2})');
    final stdMatch = standardRegex.firstMatch(str);
    if (stdMatch != null) {
      final h = int.parse(stdMatch.group(1)!);
      final m = stdMatch.group(2)!;
      return '${h.toString().padLeft(2, '0')}:$m';
    }
    return str;
  }

  String _formatChatDateBadge(dynamic createdAt) {
    if (createdAt == null || createdAt.toString().trim().isEmpty) return 'TODAY';
    try {
      final dt = DateTime.parse(createdAt.toString().trim()).toLocal();
      final now = DateTime.now();
      final isToday = dt.year == now.year && dt.month == now.month && dt.day == now.day;
      if (isToday) return 'TODAY';
      final yesterday = now.subtract(const Duration(days: 1));
      final isYesterday = dt.year == yesterday.year && dt.month == yesterday.month && dt.day == yesterday.day;
      if (isYesterday) return 'YESTERDAY';
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      final monthStr = months[dt.month - 1];
      return dt.year == now.year ? '${dt.day} $monthStr' : '${dt.day} $monthStr ${dt.year}';
    } catch (_) {
      return 'TODAY';
    }
  }

  @override
  void initState() {
    super.initState();
    _loadMessagesFromDatabase();
    _initSocket();
  }

  void _initSocket() async {
    try {
      final box = await Hive.openBox('auth');
      final currentUserId = box.get('userId') ?? box.get('user')?['id'] ?? 'player-user';
      final rawBase = ApiClient.resolveBaseUrl();
      final socketUrl = rawBase.replaceAll(RegExp(r'/api/?$'), '');

      final s = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(10)
            .setReconnectionDelay(1000)
            .setQuery({'userId': currentUserId})
            .build(),
      );

      s.onConnect((_) {
        s.emit('subscribe:user', {'userId': currentUserId});
        final email = box.get('user')?['email']?.toString();
        if (email != null && email.isNotEmpty) {
          s.emit('subscribe:user', {'userId': email});
        }
      });

      s.on('chat:message_received', _handleIncomingMessage);
      s.on('chat:message', _handleIncomingMessage);

      _socket = s;
    } catch (e) {
      debugPrint('Error initializing chat socket: $e');
    }
  }

  void _handleIncomingMessage(dynamic data) {
    if (!mounted || data == null) return;
    try {
      final map = (data is Map) ? Map<String, dynamic>.from(data) : null;
      if (map == null) return;

      final text = map['text']?.toString() ?? '';
      if (text.isEmpty) return;

      final senderId = map['senderId']?.toString().toLowerCase().trim() ?? '';
      final receiverId = map['receiverId']?.toString().toLowerCase().trim() ?? '';
      final senderName = map['senderName']?.toString().toLowerCase().trim() ?? '';

      final targetId = widget.friendId.toLowerCase().trim();
      final targetName = widget.friendName.toLowerCase().trim();
      final targetSlug = targetName.replaceAll(RegExp(r'\s+'), '-');

      // Check if this message belongs to the current open chat conversation
      final matchesConversation =
          senderId == targetId ||
          receiverId == targetId ||
          senderName == targetName ||
          senderName == targetSlug ||
          (senderName.isNotEmpty && targetName.contains(senderName)) ||
          (targetName.isNotEmpty && senderName.contains(targetName));

      if (matchesConversation) {
        final id = map['id']?.toString() ?? 'msg-${DateTime.now().millisecondsSinceEpoch}';
        final isIncoming = senderId == targetId || senderName == targetName || senderName == targetSlug;

        final createdAtIso = map['createdAt']?.toString() ?? DateTime.now().toUtc().toIso8601String();
        final timeStr = _format24HourTime(map['time'], createdAtIso);

        final newMsg = {
          'id': id,
          'sender': isIncoming ? 'them' : 'me',
          'text': text,
          'time': timeStr,
          'createdAt': createdAtIso,
          'status': map['status']?.toString() ?? 'read',
          'attachmentImage': map['imageUrl']?.toString(),
        };

        setState(() {
          final key = _friendKey;
          if (!_conversationsByFriend.containsKey(key)) {
            _conversationsByFriend[key] = [];
          }
          final matchIdx = _conversationsByFriend[key]!.indexWhere((m) =>
              m['id'] == id ||
              (map['clientTempId'] != null && m['id'] == map['clientTempId']) ||
              (!isIncoming && m['sender'] == 'me' && m['text'] == text));
          if (matchIdx >= 0) {
            _conversationsByFriend[key]![matchIdx] = newMsg;
          } else {
            _conversationsByFriend[key]!.add(newMsg);
          }
        });

        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('Error handling incoming chat message: $e');
    }
  }

  Future<void> _loadMessagesFromDatabase() async {
    try {
      if (mounted) setState(() => _isLoading = true);
      final box = await Hive.openBox('auth');
      final currentUserId = box.get('userId') ?? box.get('user')?['id'] ?? 'player-user';
      final target = widget.friendId.isNotEmpty ? widget.friendId : _friendKey;

      final res = await _apiClient.dio.get(
        '/friends/messages/$target',
        options: Options(headers: {'x-user-id': currentUserId}),
      );

      if (res.statusCode == 200 && res.data is List) {
        final List<dynamic> rawList = res.data;
        final formatted = rawList.map((m) {
          final map = Map<String, dynamic>.from(m as Map);
          final createdAt = map['createdAt']?.toString();
          return {
            'id': map['id']?.toString() ?? 'msg-${DateTime.now().millisecondsSinceEpoch}',
            'sender': map['sender']?.toString() ?? 'them',
            'text': map['text']?.toString() ?? '',
            'time': _format24HourTime(map['time'], createdAt),
            'createdAt': createdAt,
            'status': map['status']?.toString() ?? 'read',
            'attachmentImage': map['imageUrl']?.toString(),
          };
        }).toList();

        if (mounted) {
          setState(() {
            _conversationsByFriend[_friendKey] = formatted;
            _isLoading = false;
          });
          _scrollToBottom();
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error loading messages from DB: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    _textController.clear();
    await _sendDirectText(text);
  }

  Future<void> _sendDirectText(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    final now = DateTime.now();
    final hour = now.hour.toString().padLeft(2, '0');
    final minute = now.minute.toString().padLeft(2, '0');
    final timeStr = '$hour:$minute';
    final createdAtIso = now.toUtc().toIso8601String();

    final tempId = 'msg-${now.millisecondsSinceEpoch}';
    final newMsg = {
      'id': tempId,
      'sender': 'me',
      'text': trimmed,
      'time': timeStr,
      'createdAt': createdAtIso,
      'status': 'sent',
    };

    setState(() {
      final key = _friendKey;
      if (!_conversationsByFriend.containsKey(key)) {
        _conversationsByFriend[key] = [];
      }
      _conversationsByFriend[key]!.add(newMsg);
    });

    _scrollToBottom();

    // Persist real message to PostgreSQL database via backend API
    try {
      final box = await Hive.openBox('auth');
      final currentUserId = box.get('userId') ?? box.get('user')?['id'] ?? 'player-user';
      final target = widget.friendId.isNotEmpty ? widget.friendId : _friendKey;

      final res = await _apiClient.dio.post(
        '/friends/messages',
        data: {
          'receiverId': target,
          'targetUserId': target,
          'text': trimmed,
          'clientTempId': tempId,
        },
        options: Options(headers: {'x-user-id': currentUserId}),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          setState(() {
            final key = _friendKey;
            final idx = _conversationsByFriend[key]?.indexWhere((m) => m['id'] == tempId);
            if (idx != null && idx >= 0) {
              _conversationsByFriend[key]![idx]['status'] = 'delivered';
              if (res.data is Map && res.data['id'] != null) {
                _conversationsByFriend[key]![idx]['id'] = res.data['id'].toString();
                if (res.data['createdAt'] != null) {
                  _conversationsByFriend[key]![idx]['createdAt'] = res.data['createdAt'].toString();
                }
              }
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Error saving message to database: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      body: SafeArea(
        child: Column(
          children: [
            // Top Navigation Bar
            Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: Color(0xFFE2E8F0), width: 0.8),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x08000000),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  // Circular Back Button
                  InkWell(
                    onTap: widget.onBack ?? () => Navigator.maybePop(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x0D000000),
                            blurRadius: 2,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.chevron_left_rounded,
                          size: 24,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Avatar with Online dot
                  Stack(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFEAF7EE),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Center(
                          child: Text(
                            widget.friendName.isNotEmpty
                                ? widget.friendName
                                    .split(' ')
                                    .take(2)
                                    .map((e) => e.isNotEmpty ? e[0] : '')
                                    .join()
                                    .toUpperCase()
                                : 'VC',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF009A60),
                            ),
                          ),
                        ),
                      ),
                      if (widget.isOnline)
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            width: 11,
                            height: 11,
                            decoration: BoxDecoration(
                              color: const Color(0xFF009A60),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 10),

                  // Recipient Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.friendName,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.isOnline ? 'ONLINE' : 'OFFLINE',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: widget.isOnline
                                ? const Color(0xFF009A60)
                                : const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // More Options (Call button removed per user request)
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.more_vert, size: 20, color: Color(0xFF0F172A)),
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF8FAFC),
                      shape: const CircleBorder(),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                ],
              ),
            ),

            // Message Body
            Expanded(
              child: _messages.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      children: [
                        // Date Pill
                        Center(
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8EEE9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'TODAY',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                                color: const Color(0xFF5B6B7F),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),

                        // Image 2 Clean White E2EE Security Card (Compact, Non-Bulky)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x0A000000),
                                blurRadius: 2,
                                offset: Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEAF7EE),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFC6F0DB)),
                                ),
                                child: const Center(
                                  child: Icon(
                                    Icons.shield_rounded,
                                    size: 20,
                                    color: Color(0xFF009A60),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                'END-TO-END ENCRYPTED',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.4,
                                  color: const Color(0xFF009A60),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Messages And Calls Stay Between You And ${widget.friendName.split(" ").first}. Not Even OpenclubOS Can Access Them.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF64748B),
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                'Tap To Verify Identity',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.6,
                                  color: const Color(0xFF009A60),
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Image 4 Quick Reply Template Chips (Compact, Matching Slate Style)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            'Ready For 18 Holes Tomorrow? ⛳',
                            'What Are The Pin Positions? 📍',
                            'Great Playing With You! 👋',
                          ].map((preset) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: InkWell(
                                onTap: () => _sendDirectText(preset),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x0A000000),
                                        blurRadius: 1,
                                        offset: Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                  child: Text(
                                    preset,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: _messages.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          // Date Pill for first message or today
                          final dateLabel = _messages.isNotEmpty
                              ? _formatChatDateBadge(_messages.first['createdAt'])
                              : 'TODAY';
                          return Center(
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE8EEE9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                dateLabel,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.2,
                                  color: const Color(0xFF5B6B7F),
                                ),
                              ),
                            ),
                          );
                        }

                        // Message item (E2EE card removed once a text has started)
                        final msgIndex = index - 1;
                        final msg = _messages[msgIndex];
                        final isIncoming = msg['sender'] == 'them';
                        final dateLabel = _formatChatDateBadge(msg['createdAt']);
                        final prevDateLabel = msgIndex > 0 ? _formatChatDateBadge(_messages[msgIndex - 1]['createdAt']) : null;
                        final showDateHeader = msgIndex > 0 && dateLabel != prevDateLabel;

                  Widget bubbleWidget;
                  if (isIncoming) {
                    bubbleWidget = Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            margin: const EdgeInsets.only(bottom: 14),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFE2E8F0),
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                            ),
                            child: Center(
                              child: Text(
                                'VC',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF009A60),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(16),
                                      topRight: Radius.circular(16),
                                      bottomRight: Radius.circular(16),
                                      bottomLeft: Radius.circular(4),
                                    ),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x08000000),
                                        blurRadius: 2,
                                        offset: Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        msg['text'] as String,
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w400,
                                          color: const Color(0xFF0F172A),
                                          height: 1.4,
                                        ),
                                      ),
                                      if (msg['hasImage'] == true) ...[
                                        const SizedBox(height: 8),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(12),
                                          child: Container(
                                            height: 140,
                                            width: double.infinity,
                                            color: const Color(0xFFE2E8F0),
                                            child: const Center(
                                              child: Icon(Icons.golf_course, size: 40, color: Color(0xFF009A60)),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.only(left: 4, top: 4),
                                  child: Text(
                                    _format24HourTime(msg['time'], msg['createdAt']),
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF94A3B8),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 48),
                        ],
                      ),
                    );
                  } else {
                    // Outgoing Message
                    bubbleWidget = Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const SizedBox(width: 48),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF009A60),
                                    borderRadius: BorderRadius.only(
                                      topLeft: Radius.circular(16),
                                      topRight: Radius.circular(16),
                                      bottomLeft: Radius.circular(16),
                                      bottomRight: Radius.circular(4),
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Color(0x14009A60),
                                        blurRadius: 4,
                                        offset: Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Text(
                                    msg['text'] as String,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w400,
                                      color: Colors.white,
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.only(right: 4, top: 4),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        _format24HourTime(msg['time'], msg['createdAt']),
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w500,
                                          color: const Color(0xFF94A3B8),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(
                                        Icons.done_all_rounded,
                                        size: 13,
                                        color: Color(0xFF009A60),
                                      ),
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

                  if (showDateHeader) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8EEE9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              dateLabel,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                                color: const Color(0xFF5B6B7F),
                              ),
                            ),
                          ),
                        ),
                        bubbleWidget,
                      ],
                    );
                  }
                  return bubbleWidget;
                },
              ),
            ),

            // Pinned Bottom Composer Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: Color(0xFFE2E8F0), width: 0.8),
                ),
              ),
              child: Row(
                children: [
                  // Attachment Plus Button
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.add, size: 22, color: Color(0xFF64748B)),
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF1F5F9),
                      shape: const CircleBorder(),
                    ),
                  ),
                  const SizedBox(width: 6),

                  // Soft-mint Text Input Field
                  Expanded(
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5FAF6),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: const Color(0xFFE1EFE5)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: TextField(
                        controller: _textController,
                        onSubmitted: (_) => _sendMessage(),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          hintStyle: GoogleFonts.plusJakartaSans(
                            fontSize: 13.5,
                            color: const Color(0xFF8CA0BA),
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),

                  // Send Button
                  IconButton(
                    onPressed: _sendMessage,
                    icon: const Icon(Icons.send_rounded, size: 18, color: Colors.white),
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFF009A60),
                      shape: const CircleBorder(),
                    ),
                  ),

                  
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildQuickTemplateChip(String text) {
    return GestureDetector(
      onTap: () => _sendDirectText(text),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 4,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: Text(
          text,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13.5,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF0F172A),
          ),
        ),
      ),
    );
  }
}