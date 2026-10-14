import { app } from './app.js'
import { env } from './config/env.js'

const port = Number(process.env.PORT ?? env.APP_PORT)

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on port ${port}`)
})
