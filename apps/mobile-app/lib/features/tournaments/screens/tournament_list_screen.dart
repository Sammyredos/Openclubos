import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';

class TournamentListScreen extends StatefulWidget {
  const TournamentListScreen({super.key});

  @override
  State<TournamentListScreen> createState() => _TournamentListScreenState();
}

class _TournamentListScreenState extends State<TournamentListScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _tournaments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchTournaments();
  }

  Future<void> _fetchTournaments() async {
    try {
      final response = await _apiClient.dio.get('/tournaments');
      setState(() {
        _tournaments = response.data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        // Mock sample tournament if offline for preview
        _tournaments = [
          {
            'id': 'tourn_1',
            'name': 'Openclub Masters Invitational 2026',
            'status': 'LIVE',
            'course': 'Augusta National GC',
            'format': 'Stroke Play',
            'dates': 'Sep 2 - Sep 5',
            'purse': '$2,500,000',
          },
          {
            'id': 'tourn_2',
            'name': 'Autumn Club Championship',
            'status': 'UPCOMING',
            'course': 'Pinehurst No. 2',
            'format': 'Stableford',
            'dates': 'Sep 12 - Sep 14',
            'purse': '$500,000',
          },
        ];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF06090E),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'TOURNAMENT HUB',
          style: TextStyle(
            fontFamily: 'ZxGamut',
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
            fontSize: 16,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: Colors.white70),
            onPressed: () {},
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.7),
            radius: 1.1,
            colors: [
              Color(0xFF0D1D18),
              Color(0xFF06090E),
            ],
          ),
        ),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
            : _tournaments.isEmpty
                ? const Center(
                    child: Text(
                      'No active tournaments found.',
                      style: TextStyle(fontFamily: 'ZxGamut', color: Colors.white60),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    itemCount: _tournaments.length,
                    itemBuilder: (context, index) {
                      final tournament = _tournaments[index];
                      final isLive = tournament['status'] == 'LIVE';
                      return GestureDetector(
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            '/tournaments/leaderboard',
                            arguments: tournament['id'],
                          );
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0E1521).withOpacity(0.85),
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(
                              color: isLive ? const Color(0xFF10B981).withOpacity(0.4) : Colors.white.withOpacity(0.08),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isLive ? const Color(0xFF10B981).withOpacity(0.15) : Colors.black.withOpacity(0.3),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isLive ? const Color(0xFF10B981).withOpacity(0.2) : Colors.white.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: isLive ? const Color(0xFF10B981) : Colors.white.withOpacity(0.15),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        if (isLive) ...[
                                          Container(
                                            width: 6,
                                            height: 6,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF34D399),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                        ],
                                        Text(
                                          isLive ? 'LIVE NOW' : (tournament['status'] ?? 'UPCOMING'),
                                          style: TextStyle(
                                            fontFamily: 'ZxGamut',
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.8,
                                            color: isLive ? const Color(0xFF34D399) : Colors.white70,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (tournament['purse'] != null)
                                    Text(
                                      tournament['purse'],
                                      style: const TextStyle(
                                        fontFamily: 'ZxGamut',
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFF59E0B),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                tournament['name'] ?? 'Tournament Championship',
                                style: const TextStyle(
                                  fontFamily: 'ZxGamut',
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: -0.3,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                tournament['course'] ?? 'Championship Golf Course',
                                style: TextStyle(
                                  fontFamily: 'ZxGamut',
                                  fontSize: 13,
                                  color: Colors.white.withOpacity(0.6),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.calendar_today_rounded, size: 14, color: Colors.white38),
                                      const SizedBox(width: 6),
                                      Text(
                                        tournament['dates'] ?? 'Official Round',
                                        style: const TextStyle(
                                          fontFamily: 'ZxGamut',
                                          fontSize: 12,
                                          color: Colors.white38,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: const [
                                      Text(
                                        'Leaderboard',
                                        style: TextStyle(
                                          fontFamily: 'ZxGamut',
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF10B981),
                                        ),
                                      ),
                                      SizedBox(width: 4),
                                      Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF10B981)),
                                    ],
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
    );
  }
}
