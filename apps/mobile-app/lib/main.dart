import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'screens/login_screen.dart';
import 'screens/registration_screen.dart';
import 'screens/verify_email_screen.dart';
import 'features/tournaments/screens/tournament_list_screen.dart';
import 'features/tournaments/screens/leaderboard_screen.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive
  await Hive.initFlutter();
  await Hive.openBox('auth');

  // Initialize Firebase & Push Notification Service
  try {
    await Firebase.initializeApp();
    final notificationService = NotificationService();
    await notificationService.initialize();
  } catch (e) {
    debugPrint('Firebase/Notification init note: $e');
  }
  
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
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF06090E),
        fontFamily: 'ZxGamut',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981), // Masters Tournament Emerald
          secondary: Color(0xFFF59E0B), // Championship Gold
          surface: Color(0xFF0E1521), // Luxury obsidian surface
          background: Color(0xFF06090E),
          onPrimary: Colors.white,
          onSurface: Color(0xFFF8FAFC),
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontFamily: 'ZxGamut',
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.2,
            color: Color(0xFFF8FAFC),
          ),
        ),
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
        '/register': (context) => const RegistrationScreen(),
        '/verify': (context) => const VerifyEmailScreen(),
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
