/**
 * gen_ccy_data.py - Generate List of Currencies for nvlps
 *
 *   Copyright (c) 2020 Asymworks, LLC.
 *
 *   The jt-currency library may be freely distributed under the terms of
 *   the BSD license.  For all licensing information, details and documentation:
 *   https://jadetree.io/api/jt-currency
 *
 * This script pulls data from ISO 4217 and xe.com to generate a list of
 * currencies that are currently in circulation.  This data is used to filter
 * the Unicode CLDR databases and limit the amount of data packaged for the
 * Nvlps frontend.
 *
 * Sources:
 * - {@link https://www.currency-iso.org/dam/downloads/lists/list_one.xml}
 * - {@link https://www.xe.com/iso4217.php}
 */

var fs = require('fs');

const { ArgumentParser } = require('argparse');
const { version } = require('../package.json');

const { generateList } = require('./ccy_list');

async function main(args) {
  const ccyList = await generateList();

  // Write output
  if (!args.output || args.output === '-') {
    process.stdout.write(`${JSON.stringify(Object.keys(ccyList).sort())}\n`);
  } else {
    await fs.writeFile(
      args.output,
      JSON.stringify(Object.keys(ccyList).sort()),
      (err) => {
        if (err) {
          throw err;
        }
        process.stderr.write(`Wrote currency data to ${args.output}\n`);
      }
    );
  }
}

const parser = new ArgumentParser({
  description: 'Generates the list of supported currencies for the Jade Tree '
    + 'Currency library',
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-o', '--output', { help: 'currency list output file (default writes to STDOUT)', default: '-' });

const args = parser.parse_args();

main(args);
