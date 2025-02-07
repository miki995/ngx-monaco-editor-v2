import { InjectionToken } from '@angular/core';
import type MonacoNamespace from 'monaco-editor';

export const NGX_MONACO_EDITOR_CONFIG = new InjectionToken(
  'NGX_MONACO_EDITOR_CONFIG'
);

type MonacoDefaultOpts = MonacoNamespace.editor.IEditorOptions &
  MonacoNamespace.editor.IGlobalEditorOptions &
  MonacoNamespace.editor.ITextModelUpdateOptions;

export interface NgxMonacoEditorConfig {
  baseUrl?: string;
  requireConfig?: { [key: string]: any };
  defaultOptions?: MonacoDefaultOpts;
  monacoRequire?: Function;
  onMonacoLoad?: Function;
}
