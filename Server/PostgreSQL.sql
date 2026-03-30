-- PostgreSQL Dump
BEGIN;

-- 1. Create Tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT DEFAULT 'New User',
    profile_picture TEXT DEFAULT NULL,
    description TEXT DEFAULT 'No bio provided.',
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0
);

CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT,
    release_year INTEGER,
    release_month INTEGER,
    cover_path TEXT,
    audio_path TEXT,
    play_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0
);

CREATE TABLE song_contributors (
    song_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (song_id, user_id),
    CONSTRAINT fk_song FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE favorites (
    user_id INTEGER,
    song_id INTEGER,
    user_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, song_id),
    CONSTRAINT fk_user_fav FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_song_fav FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    CONSTRAINT fk_user_playlist FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE playlist_songs (
    playlist_id INTEGER,
    song_id INTEGER,
    PRIMARY KEY (playlist_id, song_id),
    CONSTRAINT fk_playlist FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_song_playlist FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE user_follows (
    follower_id INTEGER,
    following_id INTEGER,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT fk_follower FOREIGN KEY(follower_id) REFERENCES users(id),
    CONSTRAINT fk_following FOREIGN KEY(following_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    song_id INTEGER,
    user_id INTEGER,
    text TEXT NOT NULL CHECK(length(text) <= 400),
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_song_comment FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_comment FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Insert Data
-- Userstule
INSERT INTO users (id, username, password, email, display_name, profile_picture, description, follower_count, following_count) VALUES
(1,'3rdprototype','dummy_password','3rdprototype@example.com','3rd Prototype',NULL,'No bio provided.',0,0),
(2,'acejax','dummy_password','acejax@example.com','Acejax',NULL,'No bio provided.',0,0),
(3,'inx','dummy_password','inx@example.com','INX',NULL,'No bio provided.',0,0),
(4,'danilyon','dummy_password','danilyon@example.com','Danilyon',NULL,'No bio provided.',0,0),
(5,'alexisdonn','dummy_password','alexisdonn@example.com','Alexis Donn',NULL,'No bio provided.',0,0),
(6,'culturecode','dummy_password','culturecode@example.com','Culture Code',NULL,'No bio provided.',0,0),
(7,'alltair','dummy_password','alltair@example.com','Alltair',NULL,'No bio provided.',0,0),
(8,'wiguez','dummy_password','wiguez@example.com','Wiguez',NULL,'No bio provided.',0,0),
(9,'maestrochives','dummy_password','maestrochives@example.com','Maestro Chives',NULL,'No bio provided.',0,0),
(10,'egzod','dummy_password','egzod@example.com','Egzod',NULL,'No bio provided.',0,0),
(11,'brentonmattheus','dummy_password','brentonmattheus@example.com','Brenton Mattheus',NULL,'No bio provided.',0,0),
(12,'mendum','dummy_password','mendum@example.com','Mendum',NULL,'No bio provided.',0,0),
(13,'britolani','dummy_password','britolani@example.com','Bri Tolani',NULL,'No bio provided.',0,0),
(14,'marvindivine','dummy_password','marvindivine@example.com','Marvin Divine',NULL,'No bio provided.',0,0),
(15,'unknownbrain','dummy_password','unknownbrain@example.com','Unknown Brain',NULL,'No bio provided.',0,0),
(16,'cadmium','dummy_password','cadmium@example.com','Cadmium',NULL,'No bio provided.',0,0),
(17,'rival','dummy_password','rival@example.com','Rival',NULL,'No bio provided.',0,0),
(18,'futuristik','dummy_password','futuristik@example.com','Futuristik',NULL,'No bio provided.',0,0),
(19,'clarx','dummy_password','clarx@example.com','Clarx',NULL,'No bio provided.',0,0),
(20,'ddark','dummy_password','ddark@example.com','DDark',NULL,'No bio provided.',0,0),
(21,'deafkev','dummy_password','deafkev@example.com','DEAF KEV',NULL,'No bio provided.',0,0),
(22,'damonempero','dummy_password','damonempero@example.com','Damon Empero',NULL,'No bio provided.',0,0),
(23,'veronica','dummy_password','veronica@example.com','Veronica',NULL,'No bio provided.',0,0),
(24,'diamondeyes','dummy_password','diamondeyes@example.com','Diamond Eyes',NULL,'No bio provided.',0,0),
(25,'differentheaven','dummy_password','differentheaven@example.com','Different Heaven',NULL,'No bio provided.',0,0),
(26,'eh!de','dummy_password','eh!de@example.com','EH!DE',NULL,'No bio provided.',0,0),
(27,'diviners','dummy_password','diviners@example.com','Diviners',NULL,'No bio provided.',0,0),
(28,'ren','dummy_password','ren@example.com','Ren',NULL,'No bio provided.',0,0),
(29,'electricjoyride','dummy_password','electricjoyride@example.com','Electric Joy Ride',NULL,'No bio provided.',0,0),
(30,'electro-light','dummy_password','electro-light@example.com','Electro-Light',NULL,'No bio provided.',0,0),
(31,'ellis','dummy_password','ellis@example.com','Ellis',NULL,'No bio provided.',0,0),
(32,'annayvette','dummy_password','annayvette@example.com','Anna Yvette',NULL,'No bio provided.',0,0),
(33,'floatinurboat','dummy_password','floatinurboat@example.com','Floatinurboat',NULL,'No bio provided.',0,0),
(34,'chrislinton','dummy_password','chrislinton@example.com','Chris Linton',NULL,'No bio provided.',0,0),
(35,'illenium','dummy_password','illenium@example.com','Illenium',NULL,'No bio provided.',0,0),
(36,'halcyon','dummy_password','halcyon@example.com','Halcyon',NULL,'No bio provided.',0,0),
(37,'heleen','dummy_password','heleen@example.com','Heleen',NULL,'No bio provided.',0,0),
(38,'distrion','dummy_password','distrion@example.com','Distrion',NULL,'No bio provided.',0,0),
(39,'jpb','dummy_password','jpb@example.com','JPB',NULL,'No bio provided.',0,0),
(40,'janji','dummy_password','janji@example.com','Janji',NULL,'No bio provided.',0,0),
(41,'johnning','dummy_password','johnning@example.com','Johnning',NULL,'No bio provided.',0,0),
(42,'jimyosef','dummy_password','jimyosef@example.com','Jim Yosef',NULL,'No bio provided.',0,0),
(43,'koven','dummy_password','koven@example.com','Koven',NULL,'No bio provided.',0,0),
(44,'royknox','dummy_password','royknox@example.com','ROY KNOX',NULL,'No bio provided.',0,0),
(45,'krewella','dummy_password','krewella@example.com','Krewella',NULL,'No bio provided.',0,0),
(46,'lum!x','dummy_password','lum!x@example.com','LUM!X',NULL,'No bio provided.',0,0),
(47,'gabryponte','dummy_password','gabryponte@example.com','Gabry Ponte',NULL,'No bio provided.',0,0),
(48,'neoni','dummy_password','neoni@example.com','Neoni',NULL,'No bio provided.',0,0),
(49,'mangoo','dummy_password','mangoo@example.com','Mangoo',NULL,'No bio provided.',0,0),
(50,'bbyivy','dummy_password','bbyivy@example.com','bby ivy',NULL,'No bio provided.',0,0),
(51,'krystalk','dummy_password','krystalk@example.com','Krys Talk',NULL,'No bio provided.',0,0),
(52,'niviro','dummy_password','niviro@example.com','NIVIRO',NULL,'No bio provided.',0,0),
(53,'alanwalker','dummy_password','alanwalker@example.com','Alan Walker',NULL,'No bio provided.',0,0),
(54,'paulflint','dummy_password','paulflint@example.com','Paul Flint',NULL,'No bio provided.',0,0),
(55,'phillees','dummy_password','phillees@example.com','Phil Lees',NULL,'No bio provided.',0,0),
(56,'lw','dummy_password','lw@example.com','LW',NULL,'No bio provided.',0,0),
(57,'phantomsage','dummy_password','phantomsage@example.com','Phantom Sage',NULL,'No bio provided.',0,0),
(58,'raizhell','dummy_password','raizhell@example.com','RAIZHELL',NULL,'No bio provided.',0,0),
(59,'rarin','dummy_password','rarin@example.com','Rarin',NULL,'No bio provided.',0,0),
(60,'ratfoot','dummy_password','ratfoot@example.com','Ratfoot',NULL,'No bio provided.',0,0),
(61,'tritan','dummy_password','tritan@example.com','Tritan',NULL,'No bio provided.',0,0),
(62,'sheisjules','dummy_password','sheisjules@example.com','She Is Jules',NULL,'No bio provided.',0,0),
(63,'lostsky','dummy_password','lostsky@example.com','Lost Sky',NULL,'No bio provided.',0,0),
(64,'speo','dummy_password','speo@example.com','Speo',NULL,'No bio provided.',0,0),
(65,'budobo','dummy_password','budobo@example.com','Budobo',NULL,'No bio provided.',0,0),
(66,'suburban','dummy_password','suburban@example.com','Sub Urban',NULL,'No bio provided.',0,0),
(67,'svniivan','dummy_password','svniivan@example.com','Svniivan',NULL,'No bio provided.',0,0),
(68,'timbeeren','dummy_password','timbeeren@example.com','Tim Beeren',NULL,'No bio provided.',0,0),
(69,'skrillex','dummy_password','skrillex@example.com','Skrillex',NULL,'No bio provided.',0,0),
(70,'tule','dummy_password','tule@example.com','TULE',NULL,'No bio provided.',0,0),
(71,'tobu','dummy_password','tobu@example.com','Tobu',NULL,'No bio provided.',0,0),
(72,'itro','dummy_password','itro@example.com','Itro',NULL,'No bio provided.',0,0),
(73,'vanze','dummy_password','vanze@example.com','Vanze',NULL,'No bio provided.',0,0),
(74,'balco','dummy_password','balco@example.com','Balco',NULL,'No bio provided.',0,0),
(75,'fransisderelle','dummy_password','fransisderelle@example.com','Fransis Derelle',NULL,'No bio provided.',0,0),
(76,'xaia','dummy_password','xaia@example.com','Xaia',NULL,'No bio provided.',0,0),
(77,'rainman','dummy_password','rainman@example.com','Rain Man',NULL,'No bio provided.',0,0),
(78,'oly','dummy_password','oly@example.com','Oly',NULL,'No bio provided.',0,0),
(79,'rootkit','dummy_password','rootkit@example.com','Rootkit',NULL,'No bio provided.',0,0),
(80,'afk','dummy_password','afk@example.com','AFK',NULL,'No bio provided.',0,0),
(81,'azertion','dummy_password','azertion@example.com','Azertion',NULL,'No bio provided.',0,0),
(82,'karra','dummy_password','karra@example.com','KARRA',NULL,'No bio provided.',0,0),
(83,'desmeon','dummy_password','desmeon@example.com','Desmeon',NULL,'No bio provided.',0,0),
(84,'heuse','dummy_password','heuse@example.com','Heuse',NULL,'No bio provided.',0,0),
(85,'zeusxcrona','dummy_password','zeusxcrona@example.com','Zeus X Crona',NULL,'No bio provided.',0,0),
(86,'emmasameth','dummy_password','emmasameth@example.com','Emma Sameth',NULL,'No bio provided.',0,0),
(87,'lfz','dummy_password','lfz@example.com','LFZ',NULL,'No bio provided.',0,0),
(88,'heathersommer','dummy_password','heathersommer@example.com','Heather Sommer',NULL,'No bio provided.',0,0),
(89,'rudelies','dummy_password','rudelies@example.com','RudeLies',NULL,'No bio provided.',0,0),
(90,'unknown','dummy_password','unknown@example.com','Unknown',NULL,'No bio provided.',0,0),
(91,'senbei','dummy_password','senbei@example.com','Senbei',NULL,'No bio provided.',0,0);

-- Songs
INSERT INTO songs (id, title, genre, release_year, release_month, cover_path, audio_path, play_count, favorite_count) VALUES
(1,'I Know','Electronic',2020,NULL,'storage/cover/I Know-3rdprototype.jpg','storage/audio/3rd Prototype - I Know.mp3',0,0),
(2,'By My Side','Electronic',2021,NULL,'storage/cover/By My Side-acejax,inx,danilyon.jpg','storage/audio/Acejax, INX, Danilyon - By My Side (feat. Danilyon).mp3',0,0),
(3,'You & I','Electronic',2019,NULL,'storage/cover/You & I-alexisdonn,culturecode.jpg','storage/audio/Alexis Donn, Culture Code - You & I.mp3',0,0),
(4,'Royalty (Wiguez & Alltair Remix)','Future Bass',2021,NULL,'storage/cover/Royalty (Wiguez & Alltair Remix)-alltair,wiguez,maestrochives,egzod.jpg','storage/audio/Alltair, Wiguez, Maestro Chives, Egzod - Royalty (Wiguez & Alltair Remix).mp3',0,0),
(5,'You','Dubstep',2020,NULL,'storage/cover/You-brentonmattheus,mendum.jpg','storage/audio/Brenton Mattheus, Mendum - You.mp3',0,0),
(6,'Faceless','Future Bass',2018,NULL,'storage/cover/Faceless-britolani,marvindivine,unknownbrain.jpg','storage/audio/Bri Tolani, Marvin Divine, Unknown Brain - Faceless.mp3',0,0),
(7,'Seasons (Futuristik & Whogaux Remix)','Electronic',2019,NULL,'storage/cover/Seasons (Futuristik & Whogaux Remix)-cadmium,rival,futuristik.jpg','storage/audio/Cadmium, Rival, Futuristik - Seasons (feat. Harley Bird).mp3',0,0),
(8,'H.A.Y','Electronic',2019,NULL,'storage/cover/H.A.Y-clarx.jpg','storage/audio/Clarx - H.A.Y.mp3',0,0),
(9,'Shootin Stars','Electronic',2020,NULL,'storage/cover/Shootin Stars-ddark.jpg','storage/audio/DDark - Shootin Stars.mp3',0,0),
(10,'Invincible','Electro House',2015,NULL,'storage/cover/Invincible-deafkev.jpg','storage/audio/DEAF KEV - Invincible.mp3',0,0),
(11,'Vacation','Tropical House',2017,NULL,'storage/cover/Vacation-damonempero,veronica.jpg','storage/audio/Damon Empero ft. Veronica - Vacation  Tropical House No Copyright.mp3',0,0),
(12,'Everything','Electronic',2021,NULL,'storage/cover/Everything-diamondeyes.jpg','storage/audio/Diamond Eyes - Everything.mp3',0,0),
(13,'My Heart','House',2014,NULL,'storage/cover/My Heart-differentheaven,eh!de.jpg','storage/audio/Different Heaven, EH!DE - My Heart.mp3',0,0),
(14,'Savannah 2026','Electronic',2026,NULL,'storage/cover/Savannah 2026-diviners,ren.jpg','storage/audio/Diviners, Ren - Savannah 2026 (Japanese version).mp3',0,0),
(15,'Origin','Electronic',2018,NULL,'storage/cover/Origin-electricjoyride.jpg','storage/audio/Electric Joy Ride - Origin.mp3',0,0),
(16,'Symbolism','Electronic',2014,NULL,'storage/cover/Symbolism-electro-light.jpg','storage/audio/Electro-Light - Symbolism.mp3',0,0),
(17,'Migraine','Electronic',2020,NULL,'storage/cover/Migraine-ellis,annayvette.jpg','storage/audio/Ellis, Anna Yvette - Migraine (feat. Anna Yvette).mp3',0,0),
(18,'Spirit Of Things','Electronic',2017,NULL,'storage/cover/Spirit Of Things-floatinurboat.jpg','storage/audio/Floatinurboat - Spirit Of Things.mp3',0,0),
(19,'Holding On','Electronic',2018,NULL,'storage/cover/Holding On-floatinurboat,chrislinton.jpg','storage/audio/Floatinurboat, Chris Linton - Holding On.mp3',0,0),
(20,'Fractures','Electronic',2017,NULL,'storage/cover/Fractures-illenium.jpg','storage/audio/Fractures - Illenium.mp3',0,0),
(21,'Runaway','Electronic',2019,NULL,'storage/cover/Runaway-halcyon.jpg','storage/audio/Halcyon - Runaway (feat. Valentina Franco) (TARI Remix).mp3',0,0),
(22,'Alibi','Electronic',2021,NULL,'storage/cover/Alibi-heleen,distrion.jpg','storage/audio/Heleen, Distrion - Alibi.mp3',0,0),
(23,'High','Electronic',2015,NULL,'storage/cover/High-jpb.jpg','storage/audio/JPB - High.mp3',0,0),
(24,'Heroes Tonight','Progressive House',2015,NULL,'storage/cover/Heroes Tonight-janji,johnning.jpg','storage/audio/Janji, Johnning - Heroes Tonight (feat. Johnning).mp3',0,0),
(25,'Samurai','Progressive House',2018,NULL,'storage/cover/Samurai-jimyosef.jpg','storage/audio/Jim Yosef - Samurai.mp3',0,0),
(26,'Courage','Progressive House',2018,NULL,'storage/cover/Courage-jimyosef,annayvette.jpg','storage/audio/Jim Yosef, Anna Yvette - Courage.mp3',0,0),
(27,'Linked','Progressive House',2019,NULL,'storage/cover/Linked-jimyosef,annayvette.jpg','storage/audio/Jim Yosef, Anna Yvette - Linked.mp3',0,0),
(28,'WHAT THE HELL','Electronic',2020,NULL,'storage/cover/WHAT THE HELL-johnning.jpg','storage/audio/Johnning - WHAT THE HELL.mp3',0,0),
(29,'Never Have I Felt This','Drum & Bass',2021,NULL,'storage/cover/Never Have I Felt This-koven.jpg','storage/audio/Koven - Never Have I Felt This.mp3',0,0),
(30,'About Me','Drum & Bass',2020,NULL,'storage/cover/About Me-koven,royknox.jpg','storage/audio/Koven, ROY KNOX - About Me.mp3',0,0),
(31,'Come And Get It (Razihel Remix)','Dubstep',2013,NULL,'storage/cover/Come And Get It (Razihel Remix)-krewella.jpg','storage/audio/Krewella - Come And Get It (Razihel Remix).mp3',0,0),
(32,'Monster','Electronic',2019,NULL,'storage/cover/Monster-lum!x,gabryponte.jpg','storage/audio/LUM!X, Gabry Ponte - Monster (Official Music Video).mp3',0,0),
(33,'Royalty','Future Bass',2021,NULL,'storage/cover/Royalty-maestrochives,egzod,neoni.jpg','storage/audio/Maestro Chives, Egzod, Neoni - Royalty.mp3',0,0),
(34,'Happi','Electronic',2021,NULL,'storage/cover/Happi-mangoo,bbyivy.jpg','storage/audio/Mangoo, bby ivy - Happi.mp3',0,0),
(35,'Stay With Me','Electronic',2015,NULL,'storage/cover/Stay With Me-mendum.jpg','storage/audio/Mendum - Stay With Me.mp3',0,0),
(36,'Stay With Me (Krys Talk Remix)','Electronic',2015,NULL,'storage/cover/Stay With Me (Krys Talk Remix)-mendum,krystalk.jpg','storage/audio/Mendum, Krys Talk - Stay With Me (Krys Talk Remix).mp3',0,0),
(37,'Demons','Hardstyle',2017,NULL,'storage/cover/Demons-niviro.jpg','storage/audio/NIVIRO - Demons.mp3',0,0),
(38,'PLAY','Slap House',2019,NULL,'storage/cover/PLAY-alanwalker.jpg','storage/audio/PLAY.mp3',0,0),
(39,'Girlfriend','Electronic',2017,NULL,'storage/cover/Girlfriend-paulflint,phillees,lw.jpg','storage/audio/Paul Flint, Phil Lees, LW - Girlfriend (feat. LW).mp3',0,0),
(40,'When I''m Gone','Future Bass',2017,NULL,'storage/cover/When I''m Gone-phantomsage.jpg','storage/audio/Phantom Sage - When I''m Gone.mp3',0,0),
(41,'PULL THE TRIGGER','Phonk',2022,NULL,'storage/cover/PULL THE TRIGGER-raizhell.jpg','storage/audio/RAIZHELL - PULL THE TRIGGER (PHONK).mp3',0,0),
(42,'Blue Eyed Demon','Dubstep',2020,NULL,'storage/cover/Blue Eyed Demon-royknox.jpg','storage/audio/ROY KNOX - Blue Eyed Demon.mp3',0,0),
(43,'Shining','Dubstep',2020,NULL,'storage/cover/Shining-royknox.jpg','storage/audio/ROY KNOX - Shining.mp3',0,0),
(44,'Wonder','Future Bass',2021,NULL,'storage/cover/Wonder-rarin,britolani,unknownbrain.jpg','storage/audio/Rarin, Bri Tolani, Unknown Brain - Wonder (ft. Rarin & Bri Tolani).mp3',0,0),
(45,'Hollow Life','Electronic',2018,NULL,'storage/cover/Hollow Life-ratfoot,tritan.jpg','storage/audio/Ratfoot, Tritan - Hollow Life.mp3',0,0),
(46,'Vision pt. II','Electronic',2020,NULL,'storage/cover/Vision pt. II-sheisjules,lostsky.jpg','storage/audio/She Is Jules, Lost Sky - Vision pt. II.mp3',0,0),
(47,'Make A Stand','Electronic',2016,NULL,'storage/cover/Make A Stand-speo,budobo.jpg','storage/audio/Speo, Budobo - Make A Stand (feat. Budobo).mp3',0,0),
(48,'Cradles','Indie Pop',2019,NULL,'storage/cover/Cradles-suburban.jpg','storage/audio/Sub Urban - Cradles.mp3',0,0),
(49,'Save Me','Dubstep',2021,NULL,'storage/cover/Save Me-svniivan,timbeeren,royknox.jpg','storage/audio/Svniivan, Tim Beeren, ROY KNOX - Save Me .mp3',0,0),
(50,'Syndicate','Dubstep',2011,NULL,'storage/cover/Syndicate-skrillex.jpg','storage/audio/Syndicate-Skrillex.mp3',0,0),
(51,'Fearless pt. II','Electronic',2017,NULL,'storage/cover/Fearless pt. II-tule,chrislinton.jpg','storage/audio/TULE, Chris Linton - Fearless pt. II (feat. Chris Linton).mp3',0,0),
(52,'Sunburst','Progressive House',2014,NULL,'storage/cover/Sunburst-tobu,itro.jpg','storage/audio/Tobu & Itro - Sunburst.mp3',0,0),
(53,'Hope','Progressive House',2014,NULL,'storage/cover/Hope-tobu.jpg','storage/audio/Tobu - Hope (Original Mix).mp3',0,0),
(54,'Why Do I?','Future Bass',2018,NULL,'','storage/audio/Unknown Brain, Bri Tolani - Why Do I_ (feat. Bri Tolani).mp3',0,0),
(55,'All I Need','Electronic',2016,NULL,'storage/cover/All I Need-vanze,balco,fransisderelle,brentonmattheus.jpg','storage/audio/Vanze, Balco, Fransis Derelle, Brenton Mattheus - All I Need (feat Brenton Mattheus).mp3',0,0),
(56,'Breakdown','Electronic',2020,NULL,'storage/cover/Breakdown-xaia,rainman,oly.jpg','storage/audio/Xaia, Rain Man, Oly - Breakdown.mp3',0,0),
(57,'Against the Sun','Drumstep',2014,NULL,'storage/cover/Against the Sun-rootkit,annayvette.jpg','storage/audio/.mp3',0,0),
(58,'Clouds','Electronic',2021,NULL,'storage/cover/Clouds-annayvette,afk.jpg','storage/audio/Anna Yvette, AFK - Clouds.mp3',0,0),
(59,'Carry On','Electronic',2020,NULL,'storage/cover/Carry On-annayvette,lostsky.jpg','storage/audio/Anna Yvette, Lost Sky - Carry On.mp3',0,0),
(60,'Feelings','Electronic',2021,NULL,'storage/cover/Feelings-azertion,diviners.jpg','storage/audio/Azertion, Diviners - Feelings.mp3',0,0),
(61,'Make Me Move','Electronic',2017,NULL,'storage/cover/Make Me Move-culturecode,karra.jpg','storage/audio/Culture Code, KARRA - Make Me Move (feat. KARRA).mp3',0,0),
(62,'Hellcat','Electronic',2015,NULL,'storage/cover/Hellcat-desmeon.jpg','storage/audio/Desmeon - Hellcat.mp3',0,0),
(63,'Pill','Electronic',2018,NULL,'storage/cover/Pill-heuse,zeusxcrona,emmasameth.jpg','storage/audio/Heuse, Zeus X Crona, Emma Sameth - Pill (feat. Emma Sameth).mp3',0,0),
(64,'Popsicle','Electronic',2019,NULL,'storage/cover/Popsicle-lfz.jpg','storage/audio/LFZ - Popsicle.mp3',0,0),
(65,'Need You','Electronic',2021,NULL,'storage/cover/Need You-lostsky.jpg','storage/audio/Lost Sky - Need You.mp3',0,0),
(66,'Memory Lane','Progressive House',2020,NULL,'storage/cover/Memory Lane-tobu.jpg','storage/audio/Tobu - Memory Lane.mp3',0,0),
(67,'Perfect 10','Future Bass',2021,NULL,'storage/cover/Perfect 10-unknownbrain,heathersommer,rudelies.jpg','storage/audio/Unknown Brain, Heather Sommer, RudeLies - Perfect 10 (Unknown Brain & RudeLies VIP).mp3',0,0),
(68,'hola_1774862327333-35042544','Electronic',2021,NULL,'','storage/audio/hola_1774862327333-35042544.mp3',0,0),
(69,'When I''m Gone','Future Bass',2021,NULL,'storage/cover/When I''m Gone-phantomsage.jpg','storage/audio/Phantom Sage - When I''m Gone.mp3',0,0),
(70,'Robot Race (Official Visualizer) (320)','Glitch Hop',2021,NULL,'','storage/audio/Senbei - Robot Race (Official Visualizer) (320).mp3',0,0);

-- Song Contributors
INSERT INTO song_contributors (song_id, user_id) VALUES
(1,1),(2,2),(2,3),(2,4),(3,5),(3,6),(4,7),(4,8),(4,9),(4,10),(5,11),(5,12),(6,13),(6,14),(6,15),(7,16),(7,17),(7,18),(8,19),(9,20),(10,21),(11,22),(11,23),(12,24),(13,25),(13,26),(14,27),(14,28),(15,29),(16,30),(17,31),(17,32),(18,33),(19,33),(19,34),(20,35),(21,36),(22,37),(22,38),(23,39),(24,40),(24,41),(25,42),(26,42),(26,32),(27,42),(27,32),(28,41),(29,43),(30,43),(30,44),(31,45),(32,46),(32,47),(33,9),(33,10),(33,48),(34,49),(34,50),(35,12),(36,12),(36,51),(37,52),(38,53),(39,54),(39,55),(39,56),(40,57),(41,58),(42,44),(43,44),(44,59),(44,13),(44,15),(45,60),(45,61),(46,62),(46,63),(47,64),(47,65),(48,66),(49,67),(49,68),(49,44),(50,69),(51,70),(51,34),(52,71),(52,72),(53,71),(54,15),(54,13),(55,73),(55,74),(55,75),(55,11),(56,76),(56,77),(56,78),(57,79),(57,32),(58,32),(58,80),(59,32),(59,63),(60,81),(60,27),(61,6),(61,82),(62,83),(63,84),(63,85),(63,86),(64,87),(65,63),(66,71),(67,15),(67,88),(67,89),(68,90),(69,57),(70,91);

-- Favorites
-- (No data)

-- Playlists
-- (No data)

-- Playlist Songs
-- (No data)

-- User Follows
-- (No data)

-- Comments
-- (No data)

-- 3. Synchronize Sequences
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('songs', 'id'), (SELECT MAX(id) FROM songs));
SELECT setval(pg_get_serial_sequence('playlists', 'id'), (SELECT MAX(id) FROM playlists));
SELECT setval(pg_get_serial_sequence('comments', 'id'), (SELECT MAX(id) FROM comments));

COMMIT;
