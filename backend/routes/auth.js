const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const pool    = require('../db')

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, nickname: user.nickname, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, nickname, password, plan = 'free' } = req.body

  if (!email || !nickname || !password)
    return res.status(400).json({ message: 'Preencha todos os campos' })

  if (nickname.length < 3 || nickname.length > 30)
    return res.status(400).json({ message: 'Nickname deve ter entre 3 e 30 caracteres' })

  if (password.length < 6)
    return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' })

  if (!['free', 'premium'].includes(plan))
    return res.status(400).json({ message: 'Plano inválido' })

  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (email, nickname, password, plan) VALUES ($1, $2, $3, $4) RETURNING id, email, nickname, plan',
      [email.toLowerCase().trim(), nickname.trim(), hash, plan]
    )
    const user = rows[0]
    res.status(201).json({ user, token: makeToken(user) })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ message: 'Este e-mail já está cadastrado' })
    console.error(err)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'Preencha todos os campos' })

  try {
    const { rows } = await pool.query(
      'SELECT id, email, nickname, plan, password FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )
    const user = rows[0]
    if (!user)
      return res.status(401).json({ message: 'E-mail ou senha incorretos' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ message: 'E-mail ou senha incorretos' })

    const { password: _, ...safeUser } = user
    res.json({ user: safeUser, token: makeToken(safeUser) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

module.exports = router
