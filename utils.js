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
const Path = require('path');
const Fs = require('fs-extra');
const _ = require('lodash');

const glob = require('glob').sync;

exports.pathToFilename = function(path) {
  let ret = path.replace(/\//g, '@');
  return ret;
};

exports.filenameToPath = function(filename) {
  return filename.replace(/@/g, '/');
}

exports.anyYamlOrMd = '*.{yaml,md}';
exports.any_Yaml = '_*.yaml';
exports.anyYaml = '*.yaml';

exports.getAllYamls = function(dir) {
  return _.fromPairs(
    _.map(glob(Path.join(dir, exports.anyYaml)), fname => [Path.basename(fname), fname])
  );
};

exports.dirExist = function(path) {
  try {
    return Fs.statSync(path).isDirectory();
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
};

exports.isDirEmpty = function(path) {
  try {
    return !Fs.statSync(path).isDirectory() || Fs.readdirSync(path).length === 0;
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return true;
    }
    throw err;
  }
}

exports.isMultiLineString = function(value) {
  return _.isString(value) && value.includes('\n');
}

exports.baseName = function(path) {
  return Path.parse(path).name;
}

exports.removeEmptyDirs = function(dir) {
  Fs
   .readdirSync(dir)
   .forEach((file) => {
     let path = Path.join(dir, file);
     if(Fs.statSync(path).isDirectory()) {
       if(Fs.readdirSync(path).length === 0) {
         Fs.removeSync(path);
       } else {
         exports.removeEmptyDirs(path);
       }
     }
   });
}
