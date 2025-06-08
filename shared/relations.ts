import { relations } from "drizzle-orm";
import {
  users,
  properties,
  cities,
  reviews,
  neighborhoods,
  favorites,
  apiIntegrations
} from "./schema";

// Define user relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties, { relationName: "userProperties" }),
  reviews: many(reviews),
  favorites: many(favorites)
}));

// Define property relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  host: one(users, {
    fields: [properties.hostId],
    references: [users.id],
    relationName: "userProperties"
  }),
  city: one(cities, {
    fields: [properties.city],
    references: [cities.name]
  }),
  reviews: many(reviews),
  favorites: many(favorites)
}));

// Define city relations
export const citiesRelations = relations(cities, ({ many }) => ({
  properties: many(properties),
  neighborhoods: many(neighborhoods)
}));

// Define review relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  property: one(properties, {
    fields: [reviews.propertyId],
    references: [properties.id]
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  })
}));

// Define neighborhood relations
export const neighborhoodsRelations = relations(neighborhoods, ({ one, many }) => ({
  city: one(cities, {
    fields: [neighborhoods.cityId],
    references: [cities.id]
  }),
  properties: many(properties)
}));

// Define favorites relations
export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id]
  })
}));

// Define API integrations relations
export const apiIntegrationsRelations = relations(apiIntegrations, ({ one }) => ({
  property: one(properties, {
    fields: [apiIntegrations.id],  // Using id as a temporary reference until we have proper propertyId column
    references: [properties.id]
  })
}));