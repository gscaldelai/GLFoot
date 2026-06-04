const router      = require('express').Router()
const pool        = require('../db')
const requireAuth = require('../middleware/auth')

// GET /api/seasons/mine — temporadas do usuário logado
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM seasons WHERE user_id = $1 ORDER BY season_num',
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao buscar temporadas' })
  }
})

// POST /api/seasons — salva temporada concluída
router.post('/', requireAuth, async (req, res) => {
  const {
    season_num, year, club_id, club_name,
    final_position, points, wins, draws, losses,
    goals_for, goals_against,
    title_brasileirao  = false,
    title_copa_brasil  = false,
    title_libertadores = false,
    title_sulamericana = false,
    title_recopa       = false,
    title_mundial      = false,
    title_estadual     = 0,
  } = req.body

  // Verifica plano Free: só T1
  if (req.user.plan === 'free' && season_num > 1) {
    return res.status(403).json({
      message: 'Plano gratuito permite apenas 1 temporada. Faça upgrade para Premium.',
      upgrade: true,
    })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO seasons
         (user_id, season_num, year, club_id, club_name,
          final_position, points, wins, draws, losses, goals_for, goals_against,
          title_brasileirao, title_copa_brasil, title_libertadores,
          title_sulamericana, title_recopa, title_mundial, title_estadual)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (user_id, season_num) DO UPDATE SET
         club_id            = EXCLUDED.club_id,
         club_name          = EXCLUDED.club_name,
         final_position     = EXCLUDED.final_position,
         points             = EXCLUDED.points,
         wins               = EXCLUDED.wins,
         draws              = EXCLUDED.draws,
         losses             = EXCLUDED.losses,
         goals_for          = EXCLUDED.goals_for,
         goals_against      = EXCLUDED.goals_against,
         title_brasileirao  = EXCLUDED.title_brasileirao,
         title_copa_brasil  = EXCLUDED.title_copa_brasil,
         title_libertadores = EXCLUDED.title_libertadores,
         title_sulamericana = EXCLUDED.title_sulamericana,
         title_recopa       = EXCLUDED.title_recopa,
         title_mundial      = EXCLUDED.title_mundial,
         title_estadual     = EXCLUDED.title_estadual,
         completed_at       = NOW()
       RETURNING *`,
      [req.user.id, season_num, year, club_id, club_name,
       final_position, points, wins, draws, losses, goals_for, goals_against,
       title_brasileirao, title_copa_brasil, title_libertadores,
       title_sulamericana, title_recopa, title_mundial, title_estadual]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao salvar temporada' })
  }
})

module.exports = router
