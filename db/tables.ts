/**
 * Horoscope AI - generate horoscopes for zodiac signs & user profiles.
 *
 * Design goals:
 * - System-level daily horoscopes per sign.
 * - User profiles (birth data, preferred sign view).
 * - Log which horoscopes user viewed.
 *
 * Note: We don't need to implement astrology logic here, just storage.
 */

import { defineTable, column, NOW } from "astro:db";

export const HoroscopeProfiles = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    name: column.text({ optional: true }),            // "Self", "Partner"
    birthDate: column.date({ optional: true }),
    birthTime: column.text({ optional: true }),       // "14:30" if captured
    birthPlace: column.text({ optional: true }),

    zodiacSign: column.text({ optional: true }),      // "aries", "taurus", etc.
    preferredLanguage: column.text({ optional: true }),

    notes: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const DailyHoroscopes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    // date for which this horoscope applies
    horoscopeDate: column.date(),

    zodiacSign: column.text(),                        // "aries", "taurus", ...
    language: column.text({ optional: true }),        // "en", etc.

    generalText: column.text(),                       // main horoscope body
    loveText: column.text({ optional: true }),
    careerText: column.text({ optional: true }),
    healthText: column.text({ optional: true }),

    luckyNumber: column.text({ optional: true }),
    luckyColor: column.text({ optional: true }),
    mood: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

export const HoroscopeViews = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    profileId: column.text({
      references: () => HoroscopeProfiles.columns.id,
      optional: true,
    }),
    userId: column.text(),

    dailyHoroscopeId: column.text({
      references: () => DailyHoroscopes.columns.id,
      optional: true,
    }),

    viewedAt: column.date({ default: NOW }),
    deviceInfo: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

export const tables = {
  HoroscopeProfiles,
  DailyHoroscopes,
  HoroscopeViews,
} as const;
