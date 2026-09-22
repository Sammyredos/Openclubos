export const COURSE_BANNER_URLS: string[] = [
  '/images/tournaments/course_banner_01.jpg',
  '/images/tournaments/course_banner_02.jpg',
  '/images/tournaments/course_banner_03.jpg',
  '/images/tournaments/course_banner_04.jpg',
  '/images/tournaments/course_banner_05.jpg',
  '/images/tournaments/course_banner_06.jpg',
  '/images/tournaments/course_banner_07.jpg',
  '/images/tournaments/course_banner_08.jpg',
  '/images/tournaments/course_banner_09.jpg',
  '/images/tournaments/course_banner_10.jpg',
  '/images/tournaments/course_banner_11.jpg',
  '/images/tournaments/course_banner_12.jpg',
  '/images/tournaments/course_banner_13.jpg',
  '/images/tournaments/course_banner_14.jpg',
  '/images/tournaments/course_banner_15.jpg',
  '/images/tournaments/course_banner_16.jpg',
  '/images/tournaments/course_banner_17.jpg',
  '/images/tournaments/course_banner_18.jpg',
  '/images/tournaments/course_banner_19.jpg',
  '/images/tournaments/course_banner_20.jpg',
  '/images/tournaments/course_banner_21.jpg',
  '/images/tournaments/course_banner_22.jpg',
  '/images/tournaments/course_banner_23.jpg',
  '/images/tournaments/course_banner_24.jpg',
];

export const GOLF_COURSE_BANNERS = COURSE_BANNER_URLS;

export const COURSE_BANNER_PERMUTATION: number[] = [
  0, 11, 4, 18, 1, 14, 7, 21, 2, 12, 8, 19, 5, 15, 9, 22, 3, 16, 6, 20, 10, 23, 13, 17,
];

export function getRandomCourseBanner(): string {
  const index = Math.floor(Math.random() * COURSE_BANNER_URLS.length);
  return COURSE_BANNER_URLS[index];
}

export function resolveTournamentBanner(
  arg1?: string | number | null,
  arg2?: string | number | null,
): string {
  let bannerUrl: string | null = null;
  let index = 0;

  if (typeof arg1 === 'number') {
    index = arg1;
    if (typeof arg2 === 'string') bannerUrl = arg2;
  } else if (typeof arg1 === 'string') {
    bannerUrl = arg1;
    if (typeof arg2 === 'number') index = arg2;
  }

  if (bannerUrl && bannerUrl.trim() !== '') {
    return bannerUrl;
  }

  const idx = Math.abs(index);
  const permIdx = COURSE_BANNER_PERMUTATION[idx % COURSE_BANNER_PERMUTATION.length];
  return COURSE_BANNER_URLS[permIdx];
}

export function formatFeaturedTournamentTitle(name?: string | null): { line1: string; line2: string } {
  if (!name) return { line1: 'Featured', line2: 'Tournament' };
  const words = name.trim().split(' ');
  if (words.length <= 2) {
    return { line1: words[0] || '', line2: words.slice(1).join(' ') || '' };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(' '),
    line2: words.slice(mid).join(' '),
  };
}
