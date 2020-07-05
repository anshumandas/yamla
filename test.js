const Yamla = require('yamla');
const Fs = require('fs-extra');
const Path = require('path');

const { baseName } = require('./utils');

function avoidFolder1(value, key, dir, level) {
  return ['paths', 'tags'].includes(baseName(dir)) || level > 2;
}

function avoidFolder2(value, key, dir, level) {
  return !['paths', 'components', 'parameters', 'responses', 'schemas', 'securitySchemes'].includes(key) || level > 2;
}

function canBeUnbundled(value, key, dir, level, multiLineAsMd) {
  return ['paths', 'components', 'parameters', 'responses', 'schemas', 'securitySchemes'].includes(key) || ['paths', 'components', 'parameters', 'responses', 'schemas', 'securitySchemes'].includes(baseName(dir));
}

const inFile = "test_resources/inFile.yaml";

describe('test unbudle and bundle with avoidFolder1', () => {
  let outFolder = "test_resources/generated1";
  Fs.removeSync(outFolder);
  it('unbundle', async () => {
    let multiLineAsMd = true;
    await Yamla.unbundle({baseFile:inFile, outdir:outFolder}, avoidFolder1, multiLineAsMd);
    expect(Fs.existsSync(Path.join(outFolder, 'inFile.yaml'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'schemas'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'securitySchemes'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'paths'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'tags'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'info'))).toBe(true);
  });
  it('bundle', async () => {
    let yaml = await Yamla.bundle({baseDir:outFolder}, avoidFolder);
    expect(Yamla.readYaml(inFile, true)).toEqual(yaml);
  });
});

describe('test unbudle and bundle with avoidFolder2', () => {
  let outFolder = "test_resources/generated2";
  Fs.removeSync(outFolder);
  it('unbundle', async () => {
    let multiLineAsMd = true;
    await Yamla.unbundle({baseFile:inFile, outdir:outFolder}, avoidFolder2, multiLineAsMd);
    expect(Fs.existsSync(Path.join(outFolder, 'inFile.yaml'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'schemas'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'securitySchemes'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'paths'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'tags'))).toBe(false);
    expect(Fs.existsSync(Path.join(outFolder, 'info'))).toBe(false);
    expect(Fs.existsSync(Path.join(outFolder, 'info.yaml'))).toBe(true);
  });
  it('bundle', async () => {
    let yaml = await Yamla.bundle({baseDir:outFolder}, avoidFolder);
    expect(Yamla.readYaml(inFile, true)).toEqual(yaml);
  });
});

describe('test unbudle and bundle with avoidFolder2', () => {
  let outFolder = "test_resources/generated3";
  Fs.removeSync(outFolder);
  it('unbundle', async () => {
    let multiLineAsMd = true;
    await Yamla.unbundle({baseFile:inFile, outdir:outFolder}, avoidFolder1, multiLineAsMd, canBeUnbundled);
    expect(Fs.existsSync(Path.join(outFolder, 'inFile.yaml'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'schemas'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'components', 'securitySchemes'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'paths'))).toBe(true);
    expect(Fs.existsSync(Path.join(outFolder, 'tags'))).toBe(false);
    expect(Fs.existsSync(Path.join(outFolder, 'info'))).toBe(false);
    expect(Fs.existsSync(Path.join(outFolder, 'info.yaml'))).toBe(false);
  });
  it('bundle', async () => {
    let yaml = await Yamla.bundle({baseDir:outFolder}, avoidFolder);
    expect(Yamla.readYaml(inFile, true)).toEqual(yaml);
  });
});
