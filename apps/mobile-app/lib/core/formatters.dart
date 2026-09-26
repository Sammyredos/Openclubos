/// Formatting utilities for OpenClub mobile app.

String toTitleCase(String? text) {
  if (text == null || text.trim().isEmpty) return '';
  final trimmed = text.trim();
  const preservedAcronyms = {
    'PGA', 'USGA', 'LPGA', 'GHIN', 'WHS', 'DP', 'OWGR', 'UK', 'USA', 'USD', 'NGN', 'EUR', 'GBP', 'R&A'
  };
  const romanNumerals = {
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'
  };
  const minorWords = {
    'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'via', 'with'
  };

  String capitalizeWord(String word) {
    if (word.isEmpty) return '';
    final upper = word.toUpperCase();
    if (preservedAcronyms.contains(upper)) return upper;
    if (romanNumerals.contains(upper)) return upper;

    final ordinalMatch = RegExp(r'^(\d+)(st|nd|rd|th)$', caseSensitive: false).firstMatch(word);
    if (ordinalMatch != null) {
      return '${ordinalMatch.group(1)}${ordinalMatch.group(2)!.toLowerCase()}';
    }

    if (word.contains("'")) {
      return word.split("'").map((part) {
        if (part.toLowerCase() == 's') return 's';
        return part.isEmpty ? '' : '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}';
      }).join("'");
    }

    if (word.contains('-')) {
      return word.split('-').map(capitalizeWord).join('-');
    }

    return '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}';
  }

  final words = trimmed.split(RegExp(r'\s+'));
  final total = words.length;

  return words.asMap().entries.map((entry) {
    final idx = entry.key;
    final word = entry.value;
    final lower = word.toLowerCase();
    if (idx > 0 && idx < total - 1 && minorWords.contains(lower)) {
      return lower;
    }
    return capitalizeWord(word);
  }).join(' ');
}
