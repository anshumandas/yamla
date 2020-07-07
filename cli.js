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
#!/usr/bin/env node
'use strict';

const Fs = require('fs-extra');
const Path = require('path');
const _ = require('lodash');
const Program = require('commander');
const Chalk = require('chalk');
const Api = require('.');

function writeAndLog(filename, contents) {
  Fs.writeFileSync(filename, contents);
  console.log(`Created ${Chalk.blue(filename)}`);
}

Program
  .command('bundle')
  .description('Bundles a directory into file')
  .option('-o, --outfile <filename>', 'The output file')
  .option('-j, --json', 'Output JSON(Default is YAML)')
  .arguments('[dir]')
  .action(async function(dir, options) {
    try{
      const spec = await Api.bundle({ ...options, basedir: dir, verbose: true });
      const str = Api.stringify(spec, options);
      options.outfile = options.outfile || dir+(options.json ? ".json" : ".yaml");
      if (spec) {
        writeAndLog(options.outfile, str);
      }
    } catch(e) {
      console.log(e.stack);
      console.log('Failed');
    }
  });

Program
  .command('unbundle')
  .description('Unbundles a file into directory')
  .option('-o, --outdir <foldername>', 'The output folder')
  .arguments('[file]')
  .action(async function(file, options) {
    try {
      options.outdir = options.outdir || Path.dirname(file);
      const success = await Api.unbundle({ ...options, basefile: file, verbose: true });
      console.log('Created folder:', options.outdir);
    } catch(e) {
      console.log(e.stack);
      console.log('Failed');
    }
  });

Program.version(require('./package').version).parse(process.argv);

// Show help if no options were given
if (Program.rawArgs.length < 3) {
  Program.help();
}
