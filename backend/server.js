require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const authRouter    = require('./routes/auth')
const rankingRouter = require('./routes/ranking')
const seasonsRouter = require('./routes/seasons')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
app.use(express.json())

// Rotas
app.use('/api/auth',    authRouter)
app.use('/api/ranking', rankingRouter)
app.use('/api/seasons', seasonsRouter)

// Health check para Railway
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }))

app.listen(PORT, () =>
  console.log(`⚽ GLfoot API rodando na porta ${PORT}`)
)
