import 'package:flutter/material.dart';

/// Reusable bone element that pulses gently to indicate loading state
class SkeletonBone extends StatefulWidget {
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final Color? color;
  final EdgeInsetsGeometry? margin;

  const SkeletonBone({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.color,
    this.margin,
  });

  @override
  State<SkeletonBone> createState() => _SkeletonBoneState();
}

class _SkeletonBoneState extends State<SkeletonBone>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 950),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.45, end: 0.95).animate(
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
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          margin: widget.margin,
          decoration: BoxDecoration(
            color: (widget.color ?? const Color(0xFFE2EDE5))
                .withOpacity(_animation.value),
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
          ),
        );
      },
    );
  }
}

/// 1. Player Hub Skeleton Loader matching Competitor Profile & Tournament Hub layout
class HubSkeleton extends StatelessWidget {
  const HubSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      body: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Scenic Hero Placeholder
            Container(
              height: 310,
              width: double.infinity,
              color: const Color(0xFF0A2619),
              padding: const EdgeInsets.fromLTRB(16, 44, 16, 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Action Bar Icons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      _buildCircularIconPlaceholder(),
                      const SizedBox(width: 8),
                      _buildCircularIconPlaceholder(),
                      const SizedBox(width: 8),
                      _buildCircularIconPlaceholder(),
                      const SizedBox(width: 8),
                      _buildCircularIconPlaceholder(),
                    ],
                  ),
                  // Avatar & Player Identity Bones
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SkeletonBone(
                        width: 56,
                        height: 56,
                        borderRadius: BorderRadius.all(Radius.circular(28)),
                        color: Colors.white24,
                      ),
                      const SizedBox(height: 10),
                      const SkeletonBone(
                        width: 110,
                        height: 11,
                        borderRadius: BorderRadius.all(Radius.circular(6)),
                        color: Colors.white24,
                      ),
                      const SizedBox(height: 6),
                      const SkeletonBone(
                        width: 170,
                        height: 22,
                        borderRadius: BorderRadius.all(Radius.circular(8)),
                        color: Colors.white30,
                      ),
                      const SizedBox(height: 10),
                      const SkeletonBone(
                        width: 130,
                        height: 24,
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                        color: Colors.white24,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Dual Floating Action Cards
            Transform.translate(
              offset: const Offset(0, -20),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(child: _buildFloatingActionCardSkeleton()),
                    const SizedBox(width: 10),
                    Expanded(child: _buildFloatingActionCardSkeleton()),
                  ],
                ),
              ),
            ),

            // In-Progress / Playing Now Card Skeleton
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Container(
                height: 140,
                decoration: BoxDecoration(
                  color: const Color(0xFF052417),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF0D3826)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0D000000),
                      blurRadius: 2,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SkeletonBone(
                          width: 56,
                          height: 66,
                          borderRadius: BorderRadius.all(Radius.circular(14)),
                          color: Color(0xFF16603E),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              SkeletonBone(
                                width: 70,
                                height: 12,
                                color: Color(0xFF16603E),
                              ),
                              SizedBox(height: 6),
                              SkeletonBone(
                                width: 160,
                                height: 16,
                                color: Color(0xFF16603E),
                              ),
                              SizedBox(height: 6),
                              SkeletonBone(
                                width: 110,
                                height: 12,
                                color: Color(0xFF16603E),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: const [
                        Expanded(
                          flex: 7,
                          child: SkeletonBone(
                            height: 36,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            color: Color(0xFF009A60),
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          flex: 3,
                          child: SkeletonBone(
                            height: 36,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            color: Color(0xFF0C241B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Friends Playing Now Row Skeleton
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonBone(
                    width: 140,
                    height: 14,
                    color: Color(0xFFCBD5E1),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: List.generate(
                      4,
                      (index) => Container(
                        margin: const EdgeInsets.only(right: 12),
                        child: const SkeletonBone(
                          width: 48,
                          height: 48,
                          borderRadius: BorderRadius.all(Radius.circular(24)),
                          color: Color(0xFFE2E8F0),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Featured Tournaments Section Skeleton
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonBone(
                    width: 160,
                    height: 14,
                    color: Color(0xFFCBD5E1),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    height: 180,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0D000000),
                          blurRadius: 2,
                          offset: Offset(0, 1),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        SkeletonBone(
                          width: double.infinity,
                          height: 90,
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                          color: Color(0xFFE2EDE5),
                        ),
                        SizedBox(height: 10),
                        SkeletonBone(
                          width: 200,
                          height: 14,
                          color: Color(0xFFCBD5E1),
                        ),
                        SizedBox(height: 6),
                        SkeletonBone(
                          width: 130,
                          height: 11,
                          color: Color(0xFFE2E8F0),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  static Widget _buildCircularIconPlaceholder() {
    return const SkeletonBone(
      width: 36,
      height: 36,
      borderRadius: BorderRadius.all(Radius.circular(18)),
      color: Colors.white24,
    );
  }

  static Widget _buildFloatingActionCardSkeleton() {
    return Container(
      height: 68,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          const SkeletonBone(
            width: 32,
            height: 32,
            borderRadius: BorderRadius.all(Radius.circular(16)),
            color: Color(0xFFE2EDE5),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                SkeletonBone(
                  width: 55,
                  height: 14,
                  color: Color(0xFFCBD5E1),
                ),
                SizedBox(height: 4),
                SkeletonBone(
                  width: 75,
                  height: 9,
                  color: Color(0xFFE2E8F0),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// 2. Tournaments Screen Skeleton Loader
class TournamentsSkeleton extends StatelessWidget {
  const TournamentsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: Container(
          margin: const EdgeInsets.all(8),
          child: const SkeletonBone(
            width: 36,
            height: 36,
            borderRadius: BorderRadius.all(Radius.circular(18)),
            color: Color(0xFFE2E8F0),
          ),
        ),
        title: const SkeletonBone(
          width: 120,
          height: 18,
          borderRadius: BorderRadius.all(Radius.circular(6)),
          color: Color(0xFFCBD5E1),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            child: const SkeletonBone(
              width: 36,
              height: 36,
              borderRadius: BorderRadius.all(Radius.circular(18)),
              color: Color(0xFFE2EDE5),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Input Placeholder
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(24, 4, 24, 14),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFF5FAF6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE1EFE5)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(
                  children: const [
                    SkeletonBone(
                      width: 18,
                      height: 18,
                      borderRadius: BorderRadius.all(Radius.circular(9)),
                      color: Color(0xFFCBD5E1),
                    ),
                    SizedBox(width: 10),
                    SkeletonBone(
                      width: 130,
                      height: 12,
                      color: Color(0xFFCBD5E1),
                    ),
                  ],
                ),
              ),
            ),

            // Category Filter Pills
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: List.generate(
                  4,
                  (index) => Container(
                    margin: const EdgeInsets.only(right: 8),
                    child: SkeletonBone(
                      width: index == 0 ? 54 : 78,
                      height: 32,
                      borderRadius: const BorderRadius.all(Radius.circular(16)),
                      color: index == 0 ? Colors.white : const Color(0xFFE2E8F0),
                    ),
                  ),
                ),
              ),
            ),

            // Featured Hero Tournament Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 175,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0D000000),
                      blurRadius: 2,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    SkeletonBone(
                      width: double.infinity,
                      height: 86,
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                      color: Color(0xFFE2EDE5),
                    ),
                    SizedBox(height: 10),
                    SkeletonBone(
                      width: 190,
                      height: 15,
                      color: Color(0xFFCBD5E1),
                    ),
                    SizedBox(height: 6),
                    SkeletonBone(
                      width: 120,
                      height: 11,
                      color: Color(0xFFE2E8F0),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Tournament List Cards
            ...List.generate(
              3,
              (index) => Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Container(
                  height: 96,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0D000000),
                        blurRadius: 2,
                        offset: Offset(0, 1),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const SkeletonBone(
                        width: 72,
                        height: 72,
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                        color: Color(0xFFE2EDE5),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            SkeletonBone(
                              width: 160,
                              height: 14,
                              color: Color(0xFFCBD5E1),
                            ),
                            SizedBox(height: 6),
                            SkeletonBone(
                              width: 110,
                              height: 11,
                              color: Color(0xFFE2E8F0),
                            ),
                            SizedBox(height: 8),
                            SkeletonBone(
                              width: 68,
                              height: 18,
                              borderRadius: BorderRadius.all(Radius.circular(9)),
                              color: Color(0xFFEAF7EE),
                            ),
                          ],
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
    );
  }
}

/// 3. Authentication Screens Skeleton Loader
class AuthSkeleton extends StatelessWidget {
  final bool showBackButton;
  const AuthSkeleton({super.key, this.showBackButton = false});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Top Back Button Row (Only rendered when showBackButton is true)
              if (showBackButton)
                Align(
                  alignment: Alignment.centerLeft,
                  child: const SkeletonBone(
                    width: 40,
                    height: 40,
                    borderRadius: BorderRadius.all(Radius.circular(20)),
                    color: Colors.white,
                  ),
                )
              else
                const SizedBox(height: 40),
              const SizedBox(height: 16),

              // Squircle Brand Badge (76x76 geometry)
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF7EE),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFC6F0DB)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0A000000),
                      blurRadius: 4,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: const SkeletonBone(
                  width: 32,
                  height: 32,
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                  color: Color(0xFF009A60),
                ),
              ),
              const SizedBox(height: 24),

              // Title and Subtitle Bones
              const SkeletonBone(
                width: 180,
                height: 24,
                borderRadius: BorderRadius.all(Radius.circular(8)),
                color: Color(0xFFCBD5E1),
              ),
              const SizedBox(height: 8),
              const SkeletonBone(
                width: 130,
                height: 13,
                borderRadius: BorderRadius.all(Radius.circular(6)),
                color: Color(0xFFE2E8F0),
              ),
              const SizedBox(height: 28),

              // Inputs & Buttons
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFF5FAF6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE1EFE5)),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFF5FAF6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE1EFE5)),
                ),
              ),
              const SizedBox(height: 24),

              // Primary Action Button Skeleton (48px height)
              Container(
                height: 48,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFF009A60).withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
