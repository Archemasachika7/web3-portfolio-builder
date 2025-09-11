import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Settings table: single-row configuration (admin-updatable display name)
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  displayName: text('display_name').notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(), // epoch ms
});

// Projects table: stores portfolio projects and optional IPFS metadata
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  repoUrl: text('repo_url'),
  nftBadgeUrl: text('nft_badge_url'),
  ipfsCid: text('ipfs_cid'),
  ipfsUrl: text('ipfs_url'),
  ipfsPinned: integer('ipfs_pinned').default(0).notNull(), // 0/1 flag
  assetName: text('asset_name'),
  assetSize: integer('asset_size'), // bytes
  createdAt: integer('created_at', { mode: 'number' }).notNull(), // epoch ms
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(), // epoch ms
});