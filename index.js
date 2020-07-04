'use strict';

const fs = require('fs');
const Path = require('path');

const _ = require('lodash');
const YAML = require('js-yaml');
const glob = require('glob').sync;
const chalk = require('chalk');
const mkdirp = require('mkdirp').sync;

const { pathToFilename, anyYaml, dirExist } = require('./utils');

var routes = {};

function calcPaths(basedir = 'spec/') {
  return {
    mainFile: basedir + 'openapi.yaml',
    pathsDir: basedir + 'paths/',
    definitionsDir: basedir + 'definitions/',
    codeSamplesDir: basedir + 'code_samples/',
    componentsDir: basedir + 'components/',
    children: findChildren(basedir) //By Anshuman Das
  };
}

const OPENAPI3_COMPONENTS = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'headers',
  'requestBodies',
  'links',
  'callbacks',
  'securitySchemes'
];

exports.bundle = async function(options = {}) {
  const { pathsDir, definitionsDir, componentsDir, mainFile, codeSamplesDir } = calcPaths(
    options.basedir
  );
  const spec = readYaml(mainFile);

  if (dirExist(pathsDir)) {
    if (options.verbose) {
      console.log('[spec] Adding paths to spec');
    }
    if (spec.paths) {
      throw Error('All paths should be defined inside ' + pathsDir);
    }
    spec.paths = globYamlObject(pathsDir, _.flow([baseName, filenameToPath]));
  }

  if (spec.openapi) {
    if (dirExist(componentsDir)) {
      if (spec.components) {
        throw Error(`All components should be defined inside ${componentsDir}`);
      }
      spec.components = {};

      for (const componentType of OPENAPI3_COMPONENTS) {
        const compDir = Path.join(componentsDir, componentType);
        if (!dirExist(compDir)) {
          continue;
        }
        if (options.verbose) {
          console.log(`[spec] Adding components/${componentType} to spec`);
        }
        spec.components[componentType] = globYamlObject(compDir, baseName);
      }
    }
  } else {
    if (dirExist(definitionsDir)) {
      if (options.verbose) {
        console.log('[spec] Adding definitions to spec');
      }
      if (spec.definitions) {
        throw Error('All definitions should be defined inside ' + definitionsDir);
      }
      spec.definitions = globYamlObject(definitionsDir, baseName);
    }
  }

  if (!options.skipCodeSamples && dirExist(codeSamplesDir)) {
    if (options.verbose) {
      console.log('[spec] Adding code samples to spec');
    }
    bundleCodeSample(spec, codeSamplesDir);
  }

  if (!options.skipHeadersInlining && spec.headers) {
    if (options.verbose) {
      console.log('[spec] Inlining headers referencess');
    }
    inlineHeaders(spec);
  }

  if (!options.skipPlugins) {
    await runPlugins(spec, options);
  }

  return spec;
};

exports.stringify = function(spec, options = {}) {
  if (options.yaml) {
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

function baseName(path) {
  return Path.parse(path).name;
}

function filenameToPath(filename) {
  return '/' + filename.replace(/@/g, '/');
}

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

function updateGlobObject(dir, object) {
  const knownKeys = globObject(dir, anyYaml, baseName);

  _.each(object, function(value, key) {
    let filename = Path.join(dir, key + '.yaml');
    if (key in knownKeys) {
      filename = knownKeys[key];
      delete knownKeys[key];
    }
    updateYaml(filename, value);
  });

  _(knownKeys)
    .values()
    .each(fs.unlinkSync);
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
    return YAML.safeLoad(fs.readFileSync(file, 'utf-8'), { filename: file });
  } catch (e) {
    if (!silent) {
      console.log(chalk.red(e.message));
    }
  }
}

function readYamlOrDefault(fileName, defaultVal, defaultMessage) {
  try {
    return YAML.safeLoad(fs.readFileSync(fileName, 'utf-8'), { filename: fileName });
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
  return fs.writeFileSync(file, YAML.safeDump(object, { noRefs: true, skipInvalid: true }));
}
