#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const program = require('commander');
const chalk = require('chalk');

const api = require('.');

function writeAndLog(filename, contents) {
  fs.writeFileSync(filename, contents);
  console.log(`Created ${chalk.blue(filename)}`);
}

program
  .command('bundle')
  .description('Bundles a directory into file')
  .option('-o, --outfile <filename>', 'The output file')
  .option('-j, --json', 'Output JSON(Default is YAML)')
  .arguments('[dir]')
  .action(async function(options) {
    const spec = await api.bundle({ ...options, verbose: true });
    const str = api.stringify(spec, options);

    if (options.outfile) {
      fs.writeFileSync(options.outfile, str);
      console.log('Created "%s" openapi file.', options.outfile);
    } else {
      // Write the bundled spec to stdout
      console.log(str);
    }
  });

  program
    .command('unbundle')
    .description('Unbundles a file into directory')
    .option('-o, --outdir <foldername>', 'The output folder')
    .arguments('[file]')
    .action(async function(options) {
      const spec = await api.bundle({ ...options, verbose: true });
      const str = api.stringify(spec, options);

      if (options.outfile) {
        fs.writeFileSync(options.outfile, str);
        console.log('Created "%s" openapi file.', options.outfile);
      } else {
        // Write the bundled spec to stdout
        console.log(str);
      }
    });

program.version(require('../package').version).parse(process.argv);

// Show help if no options were given
if (program.rawArgs.length < 3) {
  program.help();
}
