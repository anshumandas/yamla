const Yamla = require('yamla');
const Fs = require('fs-extra');
const Path = require('path');

const { baseName } = require('./utils');

function avoidFolder(value, key, dir, level) {
  return ['paths'].includes(baseName(dir)) || level > 2;
}

describe('test unbudle and bundle', () => {
  let inFile = "test_resources/inFile.yaml";
  let outFile = "test_resources/outFile.yaml";
  let outFolder = "test_resources/generated";
  Fs.removeSync(outFolder);
  it('unbundle', async () => {
    let multiLineAsMd = true;
    await Yamla.unbundle({baseFile:inFile, outdir:outFolder}, avoidFolder, multiLineAsMd);
    expect(Fs.existsSync(Path.join(outFolder, 'inFile.yaml'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'schemas'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'securitySchemes'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'info'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'paths'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'tags'))).toBe(true);
  });
  it('bundle', async () => {
    let yaml = await Yamla.bundle({baseDir:outFolder}, avoidFolder);
    expect(Yamla.readYaml(inFile, true)).toEqual(yaml);
  });
});
