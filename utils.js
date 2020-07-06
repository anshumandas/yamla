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
