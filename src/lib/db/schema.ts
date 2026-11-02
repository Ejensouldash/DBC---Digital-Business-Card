import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { LINK_TYPES } from "../link-types";
import type { ProfileTheme } from "../profile-theme";

import { neonAuthUser } from "./neon-auth";

export const linkType = pgEnum("link_type", LINK_TYPES);
export const cardStatus = pgEnum("card_status", ["unclaimed", "active", "disabled"]);
export const tapSource = pgEnum("tap_source", ["nfc", "qr", "link"]);
export const deviceType = pgEnum("device_type", ["mobile", "tablet", "desktop", "unknown"]);

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const ownerRef = () => uuid("owner_id").references(() => neonAuthUser.id, { onDelete: "cascade" });

export const profiles = pgTable(
  "profiles",
  {
    id: id(),
    ownerId: ownerRef().notNull(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    jobTitle: text("job_title"),
    company: text("company"),
    bio: text("bio"),
    avatarPath: text("avatar_path"),
    coverPath: text("cover_path"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    website: text("website"),
    address: text("address"),
    mapsUrl: text("maps_url"),
    location: text("location"),
    industry: text("industry"),
    officePhone: text("office_phone"),
    companyWebsite: text("company_website"),
    companyLogoPath: text("company_logo_path"),
    theme: jsonb("theme").$type<Partial<ProfileTheme>>().notNull().default({}),
    isPublished: boolean("is_published").notNull().default(false),
    allowIndexing: boolean("allow_indexing").notNull().default(false),
    leadFormEnabled: boolean("lead_form_enabled").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("profiles_slug_key").on(t.slug),
    index("profiles_owner_id_idx").on(t.ownerId),
    check("profiles_slug_format", sql`${t.slug} ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'`),
    check("profiles_display_name_length", sql`char_length(${t.displayName}) between 1 and 80`),
    check("profiles_bio_length", sql`char_length(${t.bio}) <= 500`),
  ],
);

// Gallery photos shown in the profile's Photos card (at most 8, enforced in the action).
export const profilePhotos = pgTable(
  "profile_photos",
  {
    id: id(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("profile_photos_profile_position_idx").on(t.profileId, t.position)],
);

export const profileLinks = pgTable(
  "profile_links",
  {
    id: id(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: linkType("type").notNull(),
    label: text("label"),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("profile_links_profile_position_idx").on(t.profileId, t.position),
    check("profile_links_url_format", sql`${t.url} ~* '^https?://'`),
  ],
);

export const cardBatches = pgTable(
  "card_batches",
  {
    id: id(),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => neonAuthUser.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("card_batches_quantity_range", sql`${t.quantity} between 1 and 10000`)],
);

export const cards = pgTable(
  "cards",
  {
    id: id(),
    code: text("code").notNull(),
    batchId: uuid("batch_id").references(() => cardBatches.id, { onDelete: "set null" }),
    ownerId: uuid("owner_id").references(() => neonAuthUser.id, { onDelete: "set null" }),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    status: cardStatus("status").notNull().default("unclaimed"),
    label: text("label"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("cards_code_key").on(t.code),
    index("cards_owner_id_idx").on(t.ownerId),
    index("cards_batch_id_idx").on(t.batchId),
    check("cards_code_format", sql`${t.code} ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$'`),
    check(
      "cards_unclaimed_is_empty",
      sql`${t.status} <> 'unclaimed' or (${t.ownerId} is null and ${t.profileId} is null and ${t.claimedAt} is null)`,
    ),
  ],
);

// Append-only. No IP addresses are stored (PDPA).
export const tapEvents = pgTable(
  "tap_events",
  {
    id: id(),
    cardId: uuid("card_id").references(() => cards.id, { onDelete: "set null" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    source: tapSource("source").notNull(),
    userAgent: text("user_agent"),
    deviceType: deviceType("device_type").notNull().default("unknown"),
    country: text("country"),
    referrer: text("referrer"),
    createdAt: createdAt(),
  },
  (t) => [index("tap_events_profile_created_idx").on(t.profileId, t.createdAt.desc())],
);

// Append-only.
export const leads = pgTable(
  "leads",
  {
    id: id(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    company: text("company"),
    message: text("message"),
    consent: boolean("consent").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("leads_profile_created_idx").on(t.profileId, t.createdAt.desc()),
    check("leads_consent_given", sql`${t.consent}`),
    check("leads_has_contact", sql`${t.phone} is not null or ${t.email} is not null`),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type ProfileLink = typeof profileLinks.$inferSelect;
export type ProfilePhoto = typeof profilePhotos.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type CardStatus = (typeof cardStatus.enumValues)[number];
export type TapSource = (typeof tapSource.enumValues)[number];
export type DeviceType = (typeof deviceType.enumValues)[number];
