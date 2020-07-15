/*
* Copyright 2020 YAMLA Contributors (https://github.com/anshumandas/yamla)
* Copyright 2020
*
* Licensed under the MIT, Version 1 (the "License");
* A copy of the license is present in the root directory of the project in file LICENSE
* You may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     https://opensource.org/licenses/MIT
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
'use strict';

const Fs = require('fs-extra');
const Path = require('path');

const _ = require('lodash');
const Yaml = require('js-yaml');
const Chalk = require('chalk');

const glob = require('glob').sync;
const mkdirp = require('mkdirp').sync;

const { pathToFilename, any_Yaml, anyYamlOrMd, dirExist, isDirEmpty, isMultiLineString, baseName, filenameToPath, removeEmptyDirs } = require('./utils');

var routes = {};

exports.unbundle = async function(options = {}, avoidFolder, multiLineAsMd, allowUnbundle) {
  const inFile = options.basefile;
  const outFolder = options.outdir;
  const mainFile = Path.join(outFolder, '_' + baseName(inFile) + '.yaml');
  if(outFolder && !dirExist(outFolder)) {
    Fs.mkdirSync(outFolder);
  }
  let spec = readYaml(inFile);
  updateGlobObject(outFolder, mainFile, spec, 1, avoidFolder, multiLineAsMd, allowUnbundle);
  removeEmptyDirs(outFolder);
};

exports.bundle = async function(options = {}, handleFiles = readYaml) {
  const inDir = options.basedir;
  let main = _.keys(globObject(inDir, any_Yaml, baseName))[0];
  const spec = globYamlObject(inDir, _.flow([baseName, filenameToPath]), main, handleFiles);
  return spec;
};

exports.stringify = function(spec, options = {}) {
  if (!options.json) {
    return Yaml.safeDump(spec, { indent: 2, lineWidth: -1, noRefs: true, skipInvalid: true });
  }

  return JSON.stringify(spec, null, 2) + '\n';
};

exports.parse = function(string) {
  try {
    return Yaml.safeLoad(string, { json: true });
  } catch (e) {
    throw new Error('Can not parse OpenAPI file ' + e.message);
  }
};

function globObject(dir, pattern, objectPathCb) {
  let ret = _.reduce(
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
  return ret;
}

function ifArray(ret) {
  let ret2 = _.reduce(
    ret,
    function(result, value, key) {
      if(!isNaN(key)) {
        result.push(value);
      }
      return result;
    },
    []
  );
  let a = _.remove(_.keys(ret), function(n) {
      return n != '_';
    });
  return ret2.length == a.length ? ret2 : ret;
}

function globYamlObject(dir, objectPathCb, main, handleFiles) {
  let ret = {};
  Fs
   .readdirSync(dir)
   .forEach((file) => {
     let path = Path.join(dir, file);
     if(Fs.statSync(path).isDirectory()) {
       ret[file] = globYamlObject(path, objectPathCb, '_', handleFiles);
     }
   });
  let rest = _.mapValues(globObject(dir, anyYamlOrMd, objectPathCb), handleFiles);
  let _yaml = rest[main];
  delete rest[main];
  ret = _.merge(ret, rest);
  ret = _.merge(ret, _yaml);

  ret = ifArray(ret);
  return ret;
}

function map(obj, fn) {
  return _.isArray(obj) ? _.map(obj, fn) : _.mapValues(obj, fn);
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
  const knownKeys = globObject(dir, anyYamlOrMd, baseName);
  _.each(object, function(value, key) {
    if (value && canBeUnbundled(value, key, dir, level, multiLineAsMd, allowUnbundle)) {
      if(avoidFolder == null || !avoidFolder(value, key, dir, level)) {
        if(isMultiLineString(value)) {
          saveMd(Path.join(dir, key + '.md'), value);
          delete object[key];
        } else {
          let varDir = Path.join(dir, ""+key);

          const vars = _.mapKeys(value, function(_value, p) {
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
    if(file.endsWith('.yaml')) {
        return Yaml.safeLoad(Fs.readFileSync(file, 'utf-8'), { filename: file });
    } else {
      return Fs.readFileSync(file, {encoding:'utf8', flag:'r'});
    }
  } catch (e) {
    if (!silent) {
      console.log(Chalk.red(e.message));
    }
  }
}
exports.readYaml = readYaml;

function readYamlOrDefault(fileName, defaultVal, defaultMessage) {
  try {
    return Yaml.safeLoad(Fs.readFileSync(fileName, 'utf-8'), { filename: fileName });
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
  return Fs.writeFileSync(file, Yaml.safeDump(object, { noRefs: true, skipInvalid: true }));
}
