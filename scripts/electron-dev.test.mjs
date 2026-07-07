import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createElectronSpawnConfig,
  isDevServerReachable,
  resolveElectronCli,
} from './electron-dev.mjs'

test('electron dev launcher spawns Electron through Node without cmd.exe', () => {
  const cwd = 'C:\\projects\\corgi-nite'
  const config = createElectronSpawnConfig({ cwd, nodePath: 'node.exe' })

  assert.equal(config.command, 'node.exe')
  assert.equal(config.args[1], '.')
  assert.equal(config.options.cwd, cwd)
  assert.equal(config.options.shell, false)
  assert.equal(config.options.env.NODE_ENV, 'development')
  assert.match(config.args[0], /node_modules[\\/]+electron[\\/]+cli\.js$/)
})

test('electron cli resolves inside the project node_modules folder', () => {
  const cwd = 'C:\\projects\\corgi-nite'

  assert.match(resolveElectronCli(cwd), /node_modules[\\/]+electron[\\/]+cli\.js$/)
})

test('dev launcher can reuse a reachable Vite server', async () => {
  const reachable = await isDevServerReachable('http://localhost:5173', async () => ({
    ok: true,
  }))

  assert.equal(reachable, true)
})

test('dev launcher starts Vite when no server is reachable', async () => {
  const reachable = await isDevServerReachable('http://localhost:5173', async () => {
    throw new Error('connection refused')
  })

  assert.equal(reachable, false)
})
