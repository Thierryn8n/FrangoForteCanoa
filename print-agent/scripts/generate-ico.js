const fs = require('node:fs');
const path = require('node:path');
const pngToIco = require('png-to-ico');

async function main() {
  const root = path.resolve(__dirname, '..');
  const input = path.join(root, 'build', 'icon.png');
  const output = path.join(root, 'build', 'icon.ico');

  if (!fs.existsSync(input)) {
    throw new Error(`Arquivo nao encontrado: ${input}`);
  }

  const buf = await pngToIco(input);
  fs.writeFileSync(output, buf);
  // eslint-disable-next-line no-console
  console.log(`ICO gerado: ${output}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.message || String(err));
  process.exit(1);
});
