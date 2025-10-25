import fs from 'node:fs'


fs.copyFileSync('dist/index.html', 'dist/404.html')
fs.writeFileSync('dist/.nojekyll', '') // disable Jekyll
