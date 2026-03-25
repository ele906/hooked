-- Insert a test user
INSERT INTO users (email, password_hash, user_image_url)
VALUES ('el8403@princeton.edu', '12345', 'https://cdn.forumcomm.com/dims4/default/5bbd344/2147483647/strip/true/crop/6392x4261+0+0/resize/1680x1120!/format/webp/quality/90/?url=https%3A%2F%2Fforum-communications-production-web.s3.us-west-2.amazonaws.com%2Fbrightspot%2F5c%2F38%2F44062e9748f8bc53af8c3cd3ae52%2F090525-geese-on-the-golf-course.jpg');

--- Insert a test song
INSERT INTO songs(song_name, preview_mp3_url, song_image_url)
VALUES('Goose Honk', 'https://www.youtube.com/watch?v=1P-vkFcnSD4', 'https://en.wikipedia.org/wiki/Goose#/media/File:B%C3%BCtyk%C3%B6s_l%C3%BAd_-_Gergelyiugornya.JPG');
