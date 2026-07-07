import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const appSource = fs.readFileSync('src/App.jsx', 'utf8')
const appCss = fs.readFileSync('src/App.css', 'utf8')

test('app chooser uses a compact flat catalog grid instead of category sections', () => {
  assert.match(appSource, /className="catalog-grid"/)
  assert.doesNotMatch(appSource, /groupedApps\.map/)
  assert.doesNotMatch(appSource, /className="category-header"/)
})

test('compact chooser CSS uses dense rows and responsive columns', () => {
  assert.match(appCss, /\.catalog-grid\s*{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(220px, 1fr\)\)/s)
  assert.match(appCss, /\.app-row\s*{[^}]*min-height:\s*44px/s)
  assert.match(appCss, /\.preset-row\s*{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(180px, 1fr\)\)/s)
})
