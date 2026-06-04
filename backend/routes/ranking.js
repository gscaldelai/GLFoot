const router = require('express').Router()
const pool   = require('../db')

// GET /api/ranking — público, sem autenticação
// Retorna apenas técnicos com >= 2 temporadas completas
// Ordenado: títulos DESC → pontos totais DESC
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.nickname,
        SUM(
          (s.title_brasileirao::int) + (s.title_copa_brasil::int) +
          (s.title_libertadores::int) + (s.title_sulamericana::int) +
          (s.title_recopa::int) + (s.title_mundial::int) + s.title_estadual
        ) AS total_titles,
        SUM(s.points) AS total_points,

        -- Score ponderado pela hierarquia de títulos
        -- Desempate automático: total_points
        SUM(
          (s.title_mundial::int)      * 1000 +
          (s.title_libertadores::int) * 500  +
          (s.title_recopa::int)       * 200  +
          (s.title_sulamericana::int) * 150  +
          (s.title_brasileirao::int)  * 100  +
          (s.title_copa_brasil::int)  * 50   +
          s.title_estadual            * 5
        ) AS ranking_score,

        MAX(s.club_name)         FILTER (WHERE s.season_num = 1) AS t1_clube,
        MAX(s.wins)              FILTER (WHERE s.season_num = 1) AS t1_vitorias,
        MAX(s.points)            FILTER (WHERE s.season_num = 1) AS t1_pontos,
        BOOL_OR(s.title_brasileirao)  FILTER (WHERE s.season_num = 1) AS t1_brasileirao,
        BOOL_OR(s.title_copa_brasil)  FILTER (WHERE s.season_num = 1) AS t1_copa_brasil,
        BOOL_OR(s.title_libertadores) FILTER (WHERE s.season_num = 1) AS t1_libertadores,
        BOOL_OR(s.title_sulamericana) FILTER (WHERE s.season_num = 1) AS t1_sulamericana,
        BOOL_OR(s.title_recopa)       FILTER (WHERE s.season_num = 1) AS t1_recopa,
        BOOL_OR(s.title_mundial)      FILTER (WHERE s.season_num = 1) AS t1_mundial,
        MAX(s.title_estadual)         FILTER (WHERE s.season_num = 1) AS t1_estadual,

        MAX(s.club_name)         FILTER (WHERE s.season_num = 2) AS t2_clube,
        MAX(s.wins)              FILTER (WHERE s.season_num = 2) AS t2_vitorias,
        MAX(s.points)            FILTER (WHERE s.season_num = 2) AS t2_pontos,
        BOOL_OR(s.title_brasileirao)  FILTER (WHERE s.season_num = 2) AS t2_brasileirao,
        BOOL_OR(s.title_copa_brasil)  FILTER (WHERE s.season_num = 2) AS t2_copa_brasil,
        BOOL_OR(s.title_libertadores) FILTER (WHERE s.season_num = 2) AS t2_libertadores,
        BOOL_OR(s.title_sulamericana) FILTER (WHERE s.season_num = 2) AS t2_sulamericana,
        BOOL_OR(s.title_recopa)       FILTER (WHERE s.season_num = 2) AS t2_recopa,
        BOOL_OR(s.title_mundial)      FILTER (WHERE s.season_num = 2) AS t2_mundial,
        MAX(s.title_estadual)         FILTER (WHERE s.season_num = 2) AS t2_estadual

      FROM users u
      JOIN seasons s ON s.user_id = u.id
      GROUP BY u.id, u.nickname
      HAVING COUNT(s.id) >= 2
      ORDER BY ranking_score DESC, total_points DESC
      LIMIT 100
    `)

    res.json(rows.map((r, i) => ({ rank: i + 1, ...r })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao buscar ranking' })
  }
})

module.exports = router
