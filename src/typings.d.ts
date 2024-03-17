/*
 * Extra typings definitions
 */

// Allow .json files imports
declare module '*.json';

// SystemJS module definition

// eslint-disable-next-line no-var
declare var module: NodeModule;
interface NodeModule {
  id: string;
}
