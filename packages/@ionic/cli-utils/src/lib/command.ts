import chalk from 'chalk';

import { Command as BaseCommand, parsedArgsToArgv } from '@ionic/cli-framework/lib';

import {
  CommandData,
  CommandLineInputs,
  CommandLineOptions,
  ICommand,
  IonicEnvironment,
} from '../definitions';

import { isCommandPreRun } from '../guards';

export abstract class Command extends BaseCommand<CommandData> implements ICommand {
  public env: IonicEnvironment;

  async execute(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const config = await this.env.config.load();

    if (isCommandPreRun(this)) {
      await this.preRun(inputs, options);
    }

    try {
      await this.validate(inputs);
    } catch (e) {
      if (!this.env.flags.interactive) {
        this.env.log.warn(`Command ran non-interactively due to ${chalk.green('--no-interactive')} flag, CI being detected, or a config setting.`);
      }

      throw e;
    }

    const runPromise = this.run(inputs, options);

    const telemetryPromise = (async () => {
      if (config.telemetry !== false) {
        let cmdInputs: CommandLineInputs = [];

        if (this.metadata.name === 'login' || this.metadata.name === 'logout') {
          await runPromise;
        } else if (this.metadata.name === 'help') {
          cmdInputs = inputs;
        } else {
          cmdInputs = await this.getCleanInputsForTelemetry(inputs, options);
        }

        await this.env.telemetry.sendCommand(`ionic ${this.metadata.fullName}`, cmdInputs);
      }
    })();

    await Promise.all([runPromise, telemetryPromise]);
  }

  async getCleanInputsForTelemetry(inputs: CommandLineInputs, options: CommandLineOptions): Promise<string[]> {
    const initialOptions: CommandLineOptions = { _: [] };

    const filteredInputs = inputs.filter((input, i) => !this.metadata.inputs || (this.metadata.inputs[i] && !this.metadata.inputs[i].private));
    const filteredOptions = Object.keys(options)
      .filter(optionName => {
        const metadataOption = this.metadata.options && this.metadata.options.find((o) => {
          return o.name === optionName || (typeof o.aliases !== 'undefined' && o.aliases.includes(optionName));
        });

        if (metadataOption && metadataOption.aliases && metadataOption.aliases.includes(optionName)) {
          return false; // exclude aliases
        }

        if (!metadataOption) {
          return true; // include unknown options
        }

        if (metadataOption.private) {
          return false; // exclude private options
        }

        if (typeof metadataOption.default !== 'undefined' && metadataOption.default === options[optionName]) {
          return false; // exclude options that match their default value (means it wasn't supplied by user)
        }

        return true;
      })
      .reduce((allOptions, optionName) => {
        allOptions[optionName] = options[optionName];
        return allOptions;
      }, initialOptions);

    const optionInputs = parsedArgsToArgv(filteredOptions, { useDoubleQuotes: true });
    return filteredInputs.concat(optionInputs);
  }
}
