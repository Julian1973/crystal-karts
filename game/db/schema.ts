import {sqliteTable,text,integer,uniqueIndex,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('race_rooms',{code:text('code').primaryKey(),host:text('host').notNull(),track:text('track').notNull().default('wood'),phase:text('phase').notNull().default('lobby'),snapshot:text('snapshot'),updated:integer('updated').notNull(),expires:integer('expires').notNull()});
export const members=sqliteTable('race_members',{token:text('token').primaryKey(),room:text('room').notNull().references(()=>rooms.code,{onDelete:'cascade'}),bear:integer('bear').notNull(),ready:integer('ready').notNull().default(0),input:text('input').notNull().default('{}'),seen:integer('seen').notNull()},t=>[uniqueIndex('race_member_bear').on(t.room,t.bear),index('race_member_room').on(t.room)]);

export const guests=sqliteTable('kart_guests',{id:text('id').primaryKey(),progress:text('progress').notNull().default('{}')});
export const attempts=sqliteTable('kart_attempts',{guest:text('guest').primaryKey().references(()=>guests.id,{onDelete:'cascade'}),id:text('id').notNull(),track:text('track').notNull(),bear:integer('bear').notNull(),started:integer('started').notNull()});
export const challenges=sqliteTable('kart_challenges',{id:text('id').primaryKey(),track:text('track').notNull(),bear:integer('bear').notNull(),ms:integer('ms').notNull(),rules:text('rules').notNull()});
export const bests=sqliteTable('kart_bests',{guest:text('guest').notNull().references(()=>guests.id,{onDelete:'cascade'}),track:text('track').notNull(),rules:text('rules').notNull(),bear:integer('bear').notNull(),ms:integer('ms').notNull(),challenge:text('challenge').notNull()},t=>[primaryKey({columns:[t.guest,t.track,t.rules]})]);

export const arcadeRecords=sqliteTable('kart_arcade_records',{
 guest:text('guest').notNull().references(()=>guests.id,{onDelete:'cascade'}),
 track:text('track').notNull(),rules:text('rules').notNull(),
 challenge:text('challenge').notNull().references(()=>challenges.id),
 name:text('name').notNull(),country:text('country').notNull().default(''),
 listed:integer('listed').notNull().default(0),ms:integer('ms').notNull(),updated:integer('updated').notNull()
},t=>[primaryKey({columns:[t.guest,t.track,t.rules]}),index('arcade_board_order').on(t.track,t.rules,t.listed,t.ms)]);
