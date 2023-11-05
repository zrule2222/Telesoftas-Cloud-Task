CREATE OR REPLACE VIEW track_info AS
SELECT
    t.id AS track_id,
    t.name AS track_name,
    t.popularity AS track_popularity,
    t.energy AS track_energy,
    t.danceability AS track_danceability,
    SUM(a.followers) AS total_followers
FROM tracks t
JOIN artists a ON a.id = ANY(t.id_artists)
GROUP BY t.id, t.name, t.popularity, t.energy, t.danceability;

CREATE OR REPLACE VIEW tracks_with_followers AS
SELECT
    ti.track_id,
    ti.track_name,
    ti.track_popularity,
    ti.track_energy,
    ti.track_danceability,
    ti.total_followers
FROM track_info ti
WHERE ti.total_followers > 0;

CREATE OR REPLACE VIEW most_energizing_tracks AS
WITH ranked_tracks AS (
    SELECT
        ti.*,
        ROW_NUMBER() OVER (PARTITION BY t.release_year ORDER BY ti.track_energy DESC) AS track_rank
    FROM tracks_with_followers ti
    JOIN tracks t ON ti.track_id = t.id
)
SELECT
    rt.track_id,
    rt.track_name,
    rt.track_popularity,
    rt.track_energy,
    rt.track_danceability,
    rt.total_followers,
    t.release_year
FROM ranked_tracks rt
JOIN tracks t ON rt.track_id = t.id
WHERE rt.track_rank = 1;
