-- The first table, and the only one the scaffold ships.
--
-- It covers a record that is written text with no files attached, which is
-- enough for the first endpoint. Everything else is yours: media, transcripts,
-- translations, flags. Add them as numbered files alongside this one.
--
-- The columns come from `sourceRecord` in packages/contracts/src/model.ts.
-- When the contract and this table disagree, the contract is right.

create table if not exists records (
  -- bigint is a 64 bit integer which can be represented as a string for ZOD and typescript
  id              bigint generated always as identity primary key,
  site_id         text not null,
  contributor_id  text not null,

  -- What somebody says about what they handed over.
  note            text,

  -- The record itself, when the record is writing. Quoted because `text` is
  -- also a type name in Postgres, and the quotes stop that being confusing.
  "text"          text,

  language        text,
  captured_at     timestamptz,
  submission      text not null,
  created_at      timestamptz not null
);

-- Most reads will be "everything at this place". Worth an index from the start
-- because it costs nothing now and is invisible to add later.
create index if not exists records_site_id_idx on records (site_id);

-- Note for all the enums the types: these are temporary, and can be added to and changed as needed.
-- For all the record variants they model the mediaRef from packages/contracts/src/model.ts.

-- Enum for written file types. Will help with assembly of files after transfer.
create type written_record_type as enum (
  'txt',
  'md',
  'docx'
);

create table if not exists written_records (
  record_id bigint primary key references records(id) on delete cascade,
  content_type written_record_type not null,
  --original_filename text not null,
  -- For our current iteration, store the written record as a text string. 
  -- This will likely change in the future with file upload, and ones written in the browser will be stored as a txt.
  file_data text not null 

);

-- Enum for image file types. Will help with assembly of files after transfer.
create type image_record_type as enum (
  'jpeg',
  'png'
);

create table if not exists image_records (
  record_id bigint primary key references records(id) on delete cascade,
  content_type image_record_type not null,
  original_filename text not null
);

-- Enum for audio file types. Will help with assembly of files after transfer.
create type audio_record_type as enum (
  'wav',
  'mp3'
);

create table if not exists audio_records (
  record_id bigint primary key references records(id) on delete cascade,
  content_type audio_record_type not null,
  original_filename text not null
);

-- Enum for video file types. Will help with assembly of files after transfer.
create type video_record_type as enum (
  'mp4',
  'mov'
);

create table if not exists video_records (
  record_id bigint primary key references records(id) on delete cascade,
  content_type video_record_type not null,
  original_filename text not null
);