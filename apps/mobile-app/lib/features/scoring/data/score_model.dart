class Score {
  final String id;
  final int strokes;
  final int? putts;
  final int? points;
  final String holeId;
  final String userId;
  final String? groupId;
  final String status;
  final String? markerId;
  final DateTime? confirmedAt;

  Score({
    required this.id,
    required this.strokes,
    this.putts,
    this.points,
    required this.holeId,
    required this.userId,
    this.groupId,
    required this.status,
    this.markerId,
    this.confirmedAt,
  });

  factory Score.fromJson(Map<String, dynamic> json) {
    return Score(
      id: json['id'],
      strokes: json['strokes'],
      putts: json['putts'],
      points: json['points'],
      holeId: json['holeId'],
      userId: json['userId'],
      groupId: json['groupId'],
      status: json['status'],
      markerId: json['markerId'],
      confirmedAt: json['confirmedAt'] != null ? DateTime.parse(json['confirmedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'strokes': strokes,
      'putts': putts,
      'points': points,
      'holeId': holeId,
      'groupId': groupId,
      'userId': userId,
    };
  }
}
