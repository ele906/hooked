--
-- PostgreSQL database dump
--

\restrict qtDbdEzQfZRDmTzOO1mZjNBYpadpl3STQockzHmfMlNzszbFM05BSQhsCcxt9Vt

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg12+1)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: hooked_db_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO hooked_db_user;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: albums; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.albums (
    album_id integer NOT NULL,
    album_name text NOT NULL,
    release_date date,
    cover_image_url text
);


ALTER TABLE public.albums OWNER TO hooked_db_user;

--
-- Name: albums_album_id_seq; Type: SEQUENCE; Schema: public; Owner: hooked_db_user
--

CREATE SEQUENCE public.albums_album_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.albums_album_id_seq OWNER TO hooked_db_user;

--
-- Name: albums_album_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hooked_db_user
--

ALTER SEQUENCE public.albums_album_id_seq OWNED BY public.albums.album_id;


--
-- Name: artists; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.artists (
    artist_id integer NOT NULL,
    artist_name text NOT NULL,
    artist_image_url text
);


ALTER TABLE public.artists OWNER TO hooked_db_user;

--
-- Name: artists_artist_id_seq; Type: SEQUENCE; Schema: public; Owner: hooked_db_user
--

CREATE SEQUENCE public.artists_artist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.artists_artist_id_seq OWNER TO hooked_db_user;

--
-- Name: artists_artist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hooked_db_user
--

ALTER SEQUENCE public.artists_artist_id_seq OWNED BY public.artists.artist_id;


--
-- Name: disliked; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.disliked (
    user_id integer NOT NULL,
    song_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.disliked OWNER TO hooked_db_user;

--
-- Name: friends; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.friends (
    user_id integer NOT NULL,
    friend_id integer NOT NULL,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.friends OWNER TO hooked_db_user;

--
-- Name: interactions; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.interactions (
    interaction_id integer NOT NULL,
    user_id integer,
    song_id integer,
    type character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    duration_sec integer,
    CONSTRAINT interactions_type_check CHECK (((type)::text = ANY ((ARRAY['play'::character varying, 'like'::character varying, 'dislike'::character varying, 'favorite'::character varying])::text[])))
);


ALTER TABLE public.interactions OWNER TO hooked_db_user;

--
-- Name: interactions_interaction_id_seq; Type: SEQUENCE; Schema: public; Owner: hooked_db_user
--

CREATE SEQUENCE public.interactions_interaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interactions_interaction_id_seq OWNER TO hooked_db_user;

--
-- Name: interactions_interaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hooked_db_user
--

ALTER SEQUENCE public.interactions_interaction_id_seq OWNED BY public.interactions.interaction_id;


--
-- Name: liked; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.liked (
    user_id integer NOT NULL,
    song_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.liked OWNER TO hooked_db_user;

--
-- Name: playlist_tracks; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.playlist_tracks (
    playlist_id integer NOT NULL,
    song_id integer NOT NULL,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.playlist_tracks OWNER TO hooked_db_user;

--
-- Name: playlists; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.playlists (
    playlist_id integer NOT NULL,
    owner_user_id integer,
    playlist_name text NOT NULL,
    is_public boolean,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.playlists OWNER TO hooked_db_user;

--
-- Name: playlists_playlist_id_seq; Type: SEQUENCE; Schema: public; Owner: hooked_db_user
--

CREATE SEQUENCE public.playlists_playlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playlists_playlist_id_seq OWNER TO hooked_db_user;

--
-- Name: playlists_playlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hooked_db_user
--

ALTER SEQUENCE public.playlists_playlist_id_seq OWNED BY public.playlists.playlist_id;


--
-- Name: song_artists; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.song_artists (
    song_id integer NOT NULL,
    artist_id integer NOT NULL
);


ALTER TABLE public.song_artists OWNER TO hooked_db_user;

--
-- Name: songs; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.songs (
    song_id integer NOT NULL,
    song_name text NOT NULL,
    album_id integer,
    duration_ms integer,
    preview_mp3_url text,
    song_image_url text,
    release_date date,
    genre text,
    feature_vector public.vector(398),
    itunes_track_id text
);


ALTER TABLE public.songs OWNER TO hooked_db_user;

--
-- Name: songs_song_id_seq; Type: SEQUENCE; Schema: public; Owner: hooked_db_user
--

CREATE SEQUENCE public.songs_song_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.songs_song_id_seq OWNER TO hooked_db_user;

--
-- Name: songs_song_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hooked_db_user
--

ALTER SEQUENCE public.songs_song_id_seq OWNED BY public.songs.song_id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.user_profiles (
    user_id integer NOT NULL,
    genre_weights jsonb DEFAULT '{}'::jsonb,
    artist_weights jsonb DEFAULT '{}'::jsonb,
    weight_vector public.vector(398),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_profiles OWNER TO hooked_db_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hooked_db_user
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password_hash text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_image_url text,
    weight_vector jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.users OWNER TO hooked_db_user;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: hooked_db_user
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO hooked_db_user;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hooked_db_user
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: albums album_id; Type: DEFAULT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.albums ALTER COLUMN album_id SET DEFAULT nextval('public.albums_album_id_seq'::regclass);


--
-- Name: artists artist_id; Type: DEFAULT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.artists ALTER COLUMN artist_id SET DEFAULT nextval('public.artists_artist_id_seq'::regclass);


--
-- Name: interactions interaction_id; Type: DEFAULT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.interactions ALTER COLUMN interaction_id SET DEFAULT nextval('public.interactions_interaction_id_seq'::regclass);


--
-- Name: playlists playlist_id; Type: DEFAULT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.playlists ALTER COLUMN playlist_id SET DEFAULT nextval('public.playlists_playlist_id_seq'::regclass);


--
-- Name: songs song_id; Type: DEFAULT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.songs ALTER COLUMN song_id SET DEFAULT nextval('public.songs_song_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: albums albums_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_pkey PRIMARY KEY (album_id);


--
-- Name: artists artists_artist_name_key; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_artist_name_key UNIQUE (artist_name);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (artist_id);


--
-- Name: disliked disliked_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.disliked
    ADD CONSTRAINT disliked_pkey PRIMARY KEY (user_id, song_id);


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (user_id, friend_id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (interaction_id);


--
-- Name: liked liked_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.liked
    ADD CONSTRAINT liked_pkey PRIMARY KEY (user_id, song_id);


--
-- Name: playlist_tracks playlist_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.playlist_tracks
    ADD CONSTRAINT playlist_tracks_pkey PRIMARY KEY (playlist_id, song_id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (playlist_id);


--
-- Name: song_artists song_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.song_artists
    ADD CONSTRAINT song_artists_pkey PRIMARY KEY (song_id, artist_id);


--
-- Name: songs songs_itunes_track_id_key; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_itunes_track_id_key UNIQUE (itunes_track_id);


--
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (song_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: interactions_user_id_song_id_idx; Type: INDEX; Schema: public; Owner: hooked_db_user
--

CREATE INDEX interactions_user_id_song_id_idx ON public.interactions USING btree (user_id, song_id);


--
-- Name: songs_song_id_idx; Type: INDEX; Schema: public; Owner: hooked_db_user
--

CREATE INDEX songs_song_id_idx ON public.songs USING btree (song_id) WHERE (feature_vector IS NOT NULL);


--
-- Name: disliked disliked_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.disliked
    ADD CONSTRAINT disliked_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- Name: disliked disliked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.disliked
    ADD CONSTRAINT disliked_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friends friends_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friends friends_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: interactions interactions_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- Name: interactions interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: liked liked_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.liked
    ADD CONSTRAINT liked_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- Name: liked liked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.liked
    ADD CONSTRAINT liked_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: playlist_tracks playlist_tracks_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.playlist_tracks
    ADD CONSTRAINT playlist_tracks_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(playlist_id) ON DELETE CASCADE;


--
-- Name: playlist_tracks playlist_tracks_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.playlist_tracks
    ADD CONSTRAINT playlist_tracks_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- Name: playlists playlists_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(user_id);


--
-- Name: song_artists song_artists_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.song_artists
    ADD CONSTRAINT song_artists_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(artist_id) ON DELETE CASCADE;


--
-- Name: song_artists song_artists_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.song_artists
    ADD CONSTRAINT song_artists_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- Name: songs songs_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(album_id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hooked_db_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: FUNCTION halfvec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_out(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_send(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO hooked_db_user;


--
-- Name: TYPE halfvec; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TYPE public.halfvec TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_out(public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_send(public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO hooked_db_user;


--
-- Name: TYPE sparsevec; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TYPE public.sparsevec TO hooked_db_user;


--
-- Name: FUNCTION vector_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO hooked_db_user;


--
-- Name: FUNCTION vector_out(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_out(public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO hooked_db_user;


--
-- Name: FUNCTION vector_send(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_send(public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO hooked_db_user;


--
-- Name: TYPE vector; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TYPE public.vector TO hooked_db_user;


--
-- Name: FUNCTION array_to_halfvec(real[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_sparsevec(real[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_vector(real[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_halfvec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_sparsevec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_vector(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_halfvec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_sparsevec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_vector(integer[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_halfvec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_sparsevec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION array_to_vector(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_to_float4(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION halfvec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_to_sparsevec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_to_vector(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_to_halfvec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_to_vector(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION vector_to_float4(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION vector_to_halfvec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION vector_to_sparsevec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION vector(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO hooked_db_user;


--
-- Name: FUNCTION binary_quantize(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION binary_quantize(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO hooked_db_user;


--
-- Name: FUNCTION cosine_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION cosine_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION cosine_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_accum(double precision[], public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_add(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_avg(double precision[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_cmp(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_combine(double precision[], double precision[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_concat(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_eq(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_ge(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_gt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_l2_squared_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_le(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_lt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_mul(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_ne(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_negative_inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_spherical_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION halfvec_sub(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION hamming_distance(bit, bit); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO hooked_db_user;


--
-- Name: FUNCTION hnsw_bit_support(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO hooked_db_user;


--
-- Name: FUNCTION hnsw_halfvec_support(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO hooked_db_user;


--
-- Name: FUNCTION hnsw_sparsevec_support(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO hooked_db_user;


--
-- Name: FUNCTION hnswhandler(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hnswhandler(internal) TO hooked_db_user;


--
-- Name: FUNCTION inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION inner_product(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION inner_product(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION ivfflat_bit_support(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO hooked_db_user;


--
-- Name: FUNCTION ivfflat_halfvec_support(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO hooked_db_user;


--
-- Name: FUNCTION ivfflathandler(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO hooked_db_user;


--
-- Name: FUNCTION jaccard_distance(bit, bit); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO hooked_db_user;


--
-- Name: FUNCTION l1_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION l1_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION l1_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION l2_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION l2_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION l2_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION l2_norm(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION l2_norm(public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION l2_normalize(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION l2_normalize(public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION l2_normalize(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_cmp(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_eq(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_ge(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_gt(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_le(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_lt(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_ne(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION sparsevec_negative_inner_product(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO hooked_db_user;


--
-- Name: FUNCTION subvector(public.halfvec, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO hooked_db_user;


--
-- Name: FUNCTION subvector(public.vector, integer, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO hooked_db_user;


--
-- Name: FUNCTION vector_accum(double precision[], public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_add(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_avg(double precision[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO hooked_db_user;


--
-- Name: FUNCTION vector_cmp(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_combine(double precision[], double precision[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO hooked_db_user;


--
-- Name: FUNCTION vector_concat(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_dims(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION vector_dims(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_eq(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_ge(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_gt(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_l2_squared_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_le(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_lt(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_mul(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_ne(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_negative_inner_product(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_norm(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_spherical_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION vector_sub(public.vector, public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO hooked_db_user;


--
-- Name: FUNCTION avg(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.avg(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION avg(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.avg(public.vector) TO hooked_db_user;


--
-- Name: FUNCTION sum(public.halfvec); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sum(public.halfvec) TO hooked_db_user;


--
-- Name: FUNCTION sum(public.vector); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sum(public.vector) TO hooked_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO hooked_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO hooked_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO hooked_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO hooked_db_user;


--
-- PostgreSQL database dump complete
--

\unrestrict qtDbdEzQfZRDmTzOO1mZjNBYpadpl3STQockzHmfMlNzszbFM05BSQhsCcxt9Vt

