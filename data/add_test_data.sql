-- Insert a test user
INSERT INTO users (email) VALUES ('user0');
INSERT INTO users (email) VALUES ('user1');

-- Insert a test artist
INSERT INTO artists (artist_name) VALUES ('Artist 0');
INSERT INTO artists (artist_name) VALUES ('Artist 1');

-- Insert a test song
INSERT INTO songs (song_name, preview_mp3_url) VALUES ('Test Song 0', 'www.google.com');
INSERT INTO songs (song_name, preview_mp3_url) VALUES ('Test Song 1', 'www.youtube.com');