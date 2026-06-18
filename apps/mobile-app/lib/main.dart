import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'screens/login_screen.dart';
import 'features/tournaments/screens/tournament_list_screen.dart';
import 'features/tournaments/screens/leaderboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive
  await Hive.initFlutter();
  await Hive.openBox('auth');
  
  runApp(
    const ProviderScope(
      child: OpenclubApp(),
    ),
  );
}

class OpenclubApp extends StatelessWidget {
  const OpenclubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OpenclubOS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      initialRoute: '/login',
      onGenerateRoute: (settings) {
        if (settings.name == '/tournaments/leaderboard') {
          final tournamentId = settings.arguments as String?;
          return MaterialPageRoute(
            builder: (context) => LeaderboardScreen(tournamentId: tournamentId),
          );
        }
        return null;
      },
      routes: {
        '/login': (context) => const LoginScreen(),
        '/super-admin/dashboard': (context) => const DashboardScreen(title: 'Super Admin Dashboard'),
        '/admin/dashboard': (context) => const DashboardScreen(title: 'Club Admin Dashboard'),
        '/staff/dashboard': (context) => const DashboardScreen(title: 'Staff Dashboard'),
        '/app/home': (context) => const TournamentListScreen(),
        '/app/scoring': (context) => const DashboardScreen(title: 'Scoring Panel'),
        '/dashboard': (context) => const DashboardScreen(title: 'Dashboard'),
      },
    );
  }
}

class DashboardScreen extends StatelessWidget {
  final String title;
  const DashboardScreen({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final box = await Hive.openBox('auth');
              await box.clear();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.golf_course, size: 64, color: Colors.green),
            const SizedBox(height: 16),
            Text(
              'Welcome to OpenclubOS',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            const Text('Industry-grade golf management'),
          ],
        ),
      ),
    );
  }
}
