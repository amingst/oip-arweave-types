import { generateCommand } from './generate';
import { addCommand } from './add';
import { configCommand } from './config';

const commands = [generateCommand(), addCommand(), configCommand()];

export default commands;
