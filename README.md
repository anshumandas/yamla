<!--
- Copyright 2020 YAMLA Contributors (https://github.com/anshumandas/yamla)
- Copyright 2020 
-
- Licensed under the MIT, Version 1 (the "License");
- A copy of the license is present in the root directory of the project in file LICENSE
- You may not use this file except in compliance with the License.
- You may obtain a copy of the License at
-
-     https://opensource.org/licenses/MIT
-
- Unless required by applicable law or agreed to in writing, software
- distributed under the License is distributed on an "AS IS" BASIS,
- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
- See the License for the specific language governing permissions and
- limitations under the License.
-->
# yamla
YAML Aggregator that bundles large yaml files from directory structure and unbundle to a directory structure

## Problem
YAML is a great format that is both machine readable and easy for human comprehension.
However there may be cases where the YAML file is large and can be structured as a bunch of files and folders.
Also sometimes we may want to bundle the contents of a folder structure into an YAML

## Solution
This tool splits YAML file as follows (joins also using same logic)
- In the target folder create one yaml file of the original file name
- properties with single line texts and native values saved in same yaml file
- multiline texts saved as .md files
- properties that are arrays of objects are converted to folders
- properties that are objects and contain multiline texts, arrays or objects are converted to folders

## Installation

With npm:
```sh
npm install --save yamla
```

With yarn:
```sh
yarn add -D yamla
```

## Usage
### Bundle
```sh
npm run bundle <folder>
```
option('-o, --outfile <filename>', 'The output file')
option('-j, --json', 'Output JSON(Default is YAML)')


### Unbundle
```sh
npm run unbundle <file.(yaml|json)>
```
option('-o, --outdir <foldername>', 'The output folder')

## Contributing
All contributions are welcomed

## License

[MIT](/LICENSE)

## Credits
Inspired from the work done by people at https://github.com/Redocly/swagger-repo
