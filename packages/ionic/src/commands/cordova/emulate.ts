import chalk from 'chalk';

import { CommandData } from '@ionic/cli-utils';
import { validators } from '@ionic/cli-framework/lib';

import { CORDOVA_RUN_COMMAND_OPTIONS, CordovaRunCommand } from './base';

export class EmulateCommand extends CordovaRunCommand {
  metadata: CommandData = {
    name: 'emulate',
    type: 'project',
    description: 'Emulate an Ionic project on a simulator or emulator',
    longDescription: `
Like running ${chalk.green('cordova emulate')} directly, but also watches for changes in web assets and provides live-reload functionality with the ${chalk.green('--livereload')} option.

For Android and iOS, you can setup Remote Debugging on your emulator with browser development tools: ${chalk.bold('https://docs.ionic.io/tools/developer/#remote-debugging')}

Just like with ${chalk.green('ionic cordova build')}, you can pass additional options to the Cordova CLI using the ${chalk.green('--')} separator.
    `,
    exampleCommands: ['', 'ios', 'ios -lc', 'android -lc --address=localhost', 'android -lc -- -d'],
    inputs: [
      {
        name: 'platform',
        description: `The platform to emulate (${['android', 'ios'].map(v => chalk.green(v)).join(', ')})`,
        validators: [validators.required],
      },
    ],
    options: CORDOVA_RUN_COMMAND_OPTIONS,
  };
}
