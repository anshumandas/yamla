'use strict';

const Fs = require('fs-extra');
const Path = require('path');

const _ = require('lodash');
const YAML = require('js-yaml');
const Chalk = require('chalk');

const glob = require('glob').sync;
const mkdirp = require('mkdirp').sync;

const { pathToFilename, anyYaml, dirExist, isDirEmpty, isMultiLineString, baseName, filenameToPath, removeEmptyDirs } = require('./utils');

var routes = {};

exports.unbundle = async function(options = {}, avoidFolder, multiLineAsMd, allowUnbundle) {
  const inFile = options.baseFile;
  const outFolder = options.outdir;
  const mainFile = Path.join(outFolder, baseName(inFile) + '.yaml');
  if(outFolder && !dirExist(outFolder)) {
    Fs.mkdirSync(outFolder);
  }
  let spec = readYaml(inFile);
  updateGlobObject(outFolder, mainFile, spec, 1, avoidFolder, multiLineAsMd, allowUnbundle);
  removeEmptyDirs(outFolder);
};

exports.bundle = async function(options = {}) {
  const inDir = options.basedir;
  const mainFile = Path.join(inDir, baseName(inFile));
  const spec = globYamlObject(pathsDir, _.flow([baseName, filenameToPath]));

  //traverse

  // spec.paths = globYamlObject(pathsDir, _.flow([baseName, filenameToPath]));
  return spec;
};

exports.stringify = function(spec, options = {}) {
  if (!options.json) {
    return YAML.safeDump(spec, { indent: 2, lineWidth: -1, noRefs: true, skipInvalid: true });
  }

  return JSON.stringify(spec, null, 2) + '\n';
};

exports.parse = function(string) {
  try {
    return YAML.safeLoad(string, { json: true });
  } catch (e) {
    throw new Error('Can not parse OpenAPI file ' + e.message);
  }
};

function globObject(dir, pattern, objectPathCb) {
  return _.reduce(
    glob(Path.join(dir, pattern)),
    function(result, path) {
      const objPath = objectPathCb(path.substring(dir.length));
      if (_.has(result, objPath)) {
        throw new Error(objPath + ' definition already exists');
      }
      _.set(result, objPath, path);

      return result;
    },
    {}
  );
}

function globYamlObject(dir, objectPathCb) {
  return _.mapValues(globObject(dir, anyYaml, objectPathCb), readYaml);
}

function canBeUnbundled(value, key, dir, level, multiLineAsMd, allowUnbundle) {
  return (allowUnbundle && allowUnbundle(value, key, dir, level, multiLineAsMd)) || (!allowUnbundle && _.isObject(value) || (isMultiLineString(value) && multiLineAsMd));
}

function saveMd(file, object) {
  mkdirp(Path.dirname(file));
  return Fs.writeFileSync(file, object);
}

function updateGlobObject(dir, fname, object, level, avoidFolder, multiLineAsMd = true, allowUnbundle) {
  let ret = false;
  const knownKeys = globObject(dir, anyYaml, baseName);
  _.each(object, function(value, key) {
    if (value && canBeUnbundled(value, key, dir, level, multiLineAsMd, allowUnbundle)) {
      if(avoidFolder == null || !avoidFolder(value, key, dir, level)) {
        if(isMultiLineString(value)) {
          saveMd(Path.join(dir, key + '.md'), value);
          delete object[key];
        } else {
          let varDir = Path.join(dir, ""+key);

          const vars = (_.isArray(value)) ? value : _.mapKeys(value, function(_value, p) {
            return pathToFilename(p);
          });
          mkdirp(dir);
          if(updateGlobObject(varDir, Path.join(varDir, '_.yaml'), vars, level + 1, avoidFolder, multiLineAsMd, allowUnbundle)) {
            delete object[key];
          }
        }
      } else {
        let filename = Path.join(dir, key + '.yaml');
        if (key in knownKeys) {
          filename = knownKeys[key];
          delete knownKeys[key];
        }
        updateYaml(filename, value);
        delete object[key];
      }
    }
  });

  if(!isDirEmpty(dir)) {
    ret = true;
    if(_.keys(object).length > 0) updateYaml(fname, object);
  }

  _(knownKeys)
    .values()
    .each(Fs.unlinkSync);
  return ret;
}

function updateYaml(file, newData) {
  let currentData;
  try {
    currentData = readYaml(file, true);
  } catch (e) {
    // nope
  }

  if (!_.isEqual(newData, currentData)) {
    saveYaml(file, newData);
  }
}

function readYaml(file, silent) {
  try {
    return YAML.safeLoad(Fs.readFileSync(file, 'utf-8'), { filename: file });
  } catch (e) {
    if (!silent) {
      console.log(Chalk.red(e.message));
    }
  }
}
exports.readYaml = readYaml;

function readYamlOrDefault(fileName, defaultVal, defaultMessage) {
  try {
    return YAML.safeLoad(Fs.readFileSync(fileName, 'utf-8'), { filename: fileName });
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.warn(defaultMessage);
      return defaultVal;
    } else {
      throw e;
    }
  }
}

function saveYaml(file, object) {
  mkdirp(Path.dirname(file));
  return Fs.writeFileSync(file, YAML.safeDump(object, { noRefs: true, skipInvalid: true }));
}
