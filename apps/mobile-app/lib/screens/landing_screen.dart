import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../widgets/skeleton_loader.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuthStateAndRoute();
  }

  Future<void> _checkAuthStateAndRoute() async {
    try {
      final box =
          Hive.isBoxOpen('auth') ? Hive.box('auth') : await Hive.openBox('auth');
      final token = box.get('token') ?? box.get('accessToken');
      final hasSession = token != null && token.toString().trim().isNotEmpty;
      if (mounted) {
        if (hasSession) {
          // Simply login user to their dashboard without any intermediate UI
          Navigator.of(context).pushReplacementNamed('/app/home');
        } else {
          // Default landing page is the login page directly without any UI
          Navigator.of(context).pushReplacementNamed('/login');
        }
      }
    } catch (_) {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Zero generic spinner policy: render destination screen skeleton immediately
    return const HubSkeleton();
  }
}

