import type { ActionAPIContext } from "astro:actions";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import {
  db,
  eq,
  and,
  HoroscopeProfiles,
  DailyHoroscopes,
  HoroscopeViews,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createProfile: defineAction({
    input: z.object({
      name: z.string().optional(),
      birthDate: z.coerce.date().optional(),
      birthTime: z.string().optional(),
      birthPlace: z.string().optional(),
      zodiacSign: z.string().optional(),
      preferredLanguage: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();
      const id = crypto.randomUUID();

      await db.insert(HoroscopeProfiles).values({
        id,
        userId: user.id,
        name: input.name,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        birthPlace: input.birthPlace,
        zodiacSign: input.zodiacSign,
        preferredLanguage: input.preferredLanguage,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        data: { id },
      };
    },
  }),

  updateProfile: defineAction({
    input: z.object({
      id: z.string().min(1),
      name: z.string().optional(),
      birthDate: z.coerce.date().optional(),
      birthTime: z.string().optional(),
      birthPlace: z.string().optional(),
      zodiacSign: z.string().optional(),
      preferredLanguage: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const existing = (
        await db
          .select()
          .from(HoroscopeProfiles)
          .where(
            and(
              eq(HoroscopeProfiles.id, input.id),
              eq(HoroscopeProfiles.userId, user.id),
            ),
          )
          .limit(1)
      )[0];

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updates.name = input.name;
      if (input.birthDate !== undefined) updates.birthDate = input.birthDate;
      if (input.birthTime !== undefined) updates.birthTime = input.birthTime;
      if (input.birthPlace !== undefined) updates.birthPlace = input.birthPlace;
      if (input.zodiacSign !== undefined) updates.zodiacSign = input.zodiacSign;
      if (input.preferredLanguage !== undefined)
        updates.preferredLanguage = input.preferredLanguage;
      if (input.notes !== undefined) updates.notes = input.notes;

      await db
        .update(HoroscopeProfiles)
        .set(updates)
        .where(
          and(
            eq(HoroscopeProfiles.id, input.id),
            eq(HoroscopeProfiles.userId, user.id),
          ),
        );

      return {
        success: true,
        data: { id: input.id },
      };
    },
  }),

  deleteProfile: defineAction({
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const existing = (
        await db
          .select()
          .from(HoroscopeProfiles)
          .where(
            and(
              eq(HoroscopeProfiles.id, input.id),
              eq(HoroscopeProfiles.userId, user.id),
            ),
          )
          .limit(1)
      )[0];

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      await db
        .delete(HoroscopeProfiles)
        .where(
          and(
            eq(HoroscopeProfiles.id, input.id),
            eq(HoroscopeProfiles.userId, user.id),
          ),
        );

      return {
        success: true,
        data: { id: input.id },
      };
    },
  }),

  listProfiles: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const profiles = await db
        .select()
        .from(HoroscopeProfiles)
        .where(eq(HoroscopeProfiles.userId, user.id));

      return {
        success: true,
        data: {
          items: profiles,
          total: profiles.length,
        },
      };
    },
  }),

  createDailyHoroscope: defineAction({
    input: z.object({
      horoscopeDate: z.coerce.date(),
      zodiacSign: z.string().min(1),
      language: z.string().optional(),
      generalText: z.string().min(1),
      loveText: z.string().optional(),
      careerText: z.string().optional(),
      healthText: z.string().optional(),
      luckyNumber: z.string().optional(),
      luckyColor: z.string().optional(),
      mood: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const id = crypto.randomUUID();

      await db.insert(DailyHoroscopes).values({
        id,
        horoscopeDate: input.horoscopeDate,
        zodiacSign: input.zodiacSign,
        language: input.language,
        generalText: input.generalText,
        loveText: input.loveText,
        careerText: input.careerText,
        healthText: input.healthText,
        luckyNumber: input.luckyNumber,
        luckyColor: input.luckyColor,
        mood: input.mood,
        createdAt: new Date(),
      });

      return {
        success: true,
        data: { id, ownerId: user.id },
      };
    },
  }),

  updateDailyHoroscope: defineAction({
    input: z.object({
      id: z.string().min(1),
      horoscopeDate: z.coerce.date().optional(),
      zodiacSign: z.string().optional(),
      language: z.string().optional(),
      generalText: z.string().optional(),
      loveText: z.string().optional(),
      careerText: z.string().optional(),
      healthText: z.string().optional(),
      luckyNumber: z.string().optional(),
      luckyColor: z.string().optional(),
      mood: z.string().optional(),
    }),
    handler: async (input, context) => {
      requireUser(context);

      const existing = (
        await db
          .select()
          .from(DailyHoroscopes)
          .where(eq(DailyHoroscopes.id, input.id))
          .limit(1)
      )[0];

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Daily horoscope not found.",
        });
      }

      const updates: Record<string, unknown> = {};

      if (input.horoscopeDate !== undefined)
        updates.horoscopeDate = input.horoscopeDate;
      if (input.zodiacSign !== undefined) updates.zodiacSign = input.zodiacSign;
      if (input.language !== undefined) updates.language = input.language;
      if (input.generalText !== undefined) updates.generalText = input.generalText;
      if (input.loveText !== undefined) updates.loveText = input.loveText;
      if (input.careerText !== undefined) updates.careerText = input.careerText;
      if (input.healthText !== undefined) updates.healthText = input.healthText;
      if (input.luckyNumber !== undefined) updates.luckyNumber = input.luckyNumber;
      if (input.luckyColor !== undefined) updates.luckyColor = input.luckyColor;
      if (input.mood !== undefined) updates.mood = input.mood;

      await db
        .update(DailyHoroscopes)
        .set(updates)
        .where(eq(DailyHoroscopes.id, input.id));

      return {
        success: true,
        data: { id: input.id },
      };
    },
  }),

  getDailyHoroscope: defineAction({
    input: z.object({
      zodiacSign: z.string().min(1),
      horoscopeDate: z.coerce.date().optional(),
      language: z.string().optional(),
    }),
    handler: async (input) => {
      const targetDate = input.horoscopeDate ?? new Date();
      const conditions = [
        eq(DailyHoroscopes.zodiacSign, input.zodiacSign),
        eq(DailyHoroscopes.horoscopeDate, targetDate),
      ];

      if (input.language) {
        conditions.push(eq(DailyHoroscopes.language, input.language));
      }

      const horoscope = (
        await db
          .select()
          .from(DailyHoroscopes)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .limit(1)
      )[0];

      if (!horoscope) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "No horoscope found for the given sign and date.",
        });
      }

      return {
        success: true,
        data: { horoscope },
      };
    },
  }),

  listDailyHoroscopes: defineAction({
    input: z
      .object({
        zodiacSign: z.string().optional(),
        horoscopeDate: z.coerce.date().optional(),
        language: z.string().optional(),
      })
      .optional(),
    handler: async (input) => {
      const conditions = [] as ReturnType<typeof eq>[];

      if (input?.zodiacSign) {
        conditions.push(eq(DailyHoroscopes.zodiacSign, input.zodiacSign));
      }

      if (input?.horoscopeDate) {
        conditions.push(eq(DailyHoroscopes.horoscopeDate, input.horoscopeDate));
      }

      if (input?.language) {
        conditions.push(eq(DailyHoroscopes.language, input.language));
      }

      const query = db.select().from(DailyHoroscopes);
      const rows =
        conditions.length > 0
          ? await query.where(
              conditions.length === 1 ? conditions[0] : and(...conditions),
            )
          : await query;

      return {
        success: true,
        data: {
          items: rows,
          total: rows.length,
        },
      };
    },
  }),

  logHoroscopeView: defineAction({
    input: z.object({
      profileId: z.string().optional(),
      dailyHoroscopeId: z.string().optional(),
      deviceInfo: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.profileId) {
        const profile = (
          await db
            .select()
            .from(HoroscopeProfiles)
            .where(
              and(
                eq(HoroscopeProfiles.id, input.profileId),
                eq(HoroscopeProfiles.userId, user.id),
              ),
            )
            .limit(1)
        )[0];

        if (!profile) {
          throw new ActionError({
            code: "FORBIDDEN",
            message: "Profile not found for this user.",
          });
        }
      }

      if (input.dailyHoroscopeId) {
        const horoscope = (
          await db
            .select()
            .from(DailyHoroscopes)
            .where(eq(DailyHoroscopes.id, input.dailyHoroscopeId))
            .limit(1)
        )[0];

        if (!horoscope) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Daily horoscope not found.",
          });
        }
      }

      const id = crypto.randomUUID();
      const now = new Date();

      await db.insert(HoroscopeViews).values({
        id,
        profileId: input.profileId,
        userId: user.id,
        dailyHoroscopeId: input.dailyHoroscopeId,
        viewedAt: now,
        deviceInfo: input.deviceInfo,
        createdAt: now,
      });

      return {
        success: true,
        data: { id },
      };
    },
  }),
};
