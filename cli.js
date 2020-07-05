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
  .action(async function(options) {
    try{
      const spec = await api.bundle({ ...options, basedir: dir, verbose: true });
      const str = Api.stringify(spec, options);
      options.outfile = options.outfile || dir+(json ? ".json" : ".yaml");
      if (spec) {
        writeAndLog(options.outfile, str);
      }
    } catch(e) {
      console.log('Failed');
    }
  });

Program
  .command('unbundle')
  .description('Unbundles a file into directory')
  .option('-o, --outdir <foldername>', 'The output folder')
  .arguments('[file]')
  .action(async function(options) {
    try {
      options.outdir = options.outdir || Path.dirname(file);
      const success = await Api.unbundle({ ...options, basefile: file, verbose: true });
      console.log('Created folder:', options.outdir);
    } catch(e) {
      console.log('Failed');
    }
  });

Program.version(require('../package').version).parse(process.argv);

// Show help if no options were given
if (Program.rawArgs.length < 3) {
  Program.help();
}
