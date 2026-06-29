import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import type * as Monaco from 'monaco-editor';

import { NGX_MONACO_EDITOR_CONFIG, NgxMonacoEditorConfig } from './config';

// `monaco` is exposed as a global by the AMD loader (see `ngAfterViewInit`).
declare const monaco: typeof Monaco;

let loadedMonaco = false;
let loadPromise: Promise<void>;

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export abstract class BaseEditor<TEditor extends Monaco.editor.IEditor = Monaco.editor.IEditor>
  implements AfterViewInit, OnDestroy {
  protected readonly config = inject<NgxMonacoEditorConfig>(NGX_MONACO_EDITOR_CONFIG);

  /** Run monaco creation inside Angular's zone (defaults to outside for performance). */
  readonly insideNg = input(false);
  /** Emits the underlying monaco editor instance once it has been created. */
  readonly onInit = output<TEditor>();

  protected readonly editorContainer = viewChild.required<ElementRef<HTMLElement>>('editorContainer');

  protected _editor?: TEditor;
  /** Models created by this component, tracked so they can be disposed (monaco keeps them globally otherwise). */
  protected _models: Monaco.editor.ITextModel[] = [];
  /** Editor event listeners, disposed alongside the editor. */
  protected _listeners: Monaco.IDisposable[] = [];
  protected _windowResizeSubscription?: Subscription;

  protected constructor() {
    // Re-create the editor when `insideNg` changes after it already exists.
    effect(() => {
      this.insideNg();
      if (this._editor) {
        this.reinit();
      }
    });
  }

  ngAfterViewInit(): void {
    if (loadedMonaco) {
      // Wait until monaco editor is available
      loadPromise.then(() => {
        this.initMonaco();
      });
    } else {
      loadedMonaco = true;
      loadPromise = new Promise<void>((resolve: any) => {
        let baseUrl = this.config.baseUrl;
        // ensure backward compatibility
        if (baseUrl === "assets" || !baseUrl) {
          baseUrl = "./assets/monaco/min/vs";
        }
        if (typeof ((<any>window).monaco) === 'object') {
          this.initMonaco();
          resolve();
          return;
        }
        const onGotAmdLoader: any = (require?: any) => {
          let usedRequire = require || (<any>window).require;
          let requireConfig = { paths: { vs: `${baseUrl}` } };
          Object.assign(requireConfig, this.config.requireConfig || {});

          // Load monaco
          usedRequire.config(requireConfig);
          usedRequire([`vs/editor/editor.main`], () => {
            if (typeof this.config.onMonacoLoad === 'function') {
              this.config.onMonacoLoad();
            }
            this.initMonaco();
            resolve();
          });
        };

        if (this.config.monacoRequire) {
          onGotAmdLoader(this.config.monacoRequire);
        // Load AMD loader if necessary
        } else if (!(<any>window).require) {
          const loaderScript: HTMLScriptElement = document.createElement('script');
          loaderScript.type = 'text/javascript';
          loaderScript.src = `${baseUrl}/loader.js`;
          loaderScript.addEventListener('load', () => { onGotAmdLoader(); });
          document.body.appendChild(loaderScript);
        // Load AMD loader without over-riding node's require
        } else if (!(<any>window).require.config) {
            var src = `${baseUrl}/loader.js`;

            var loaderRequest = new XMLHttpRequest();
            loaderRequest.addEventListener("load", () => {
                let scriptElem = document.createElement('script');
                scriptElem.type = 'text/javascript';
                scriptElem.text = [
                    // Monaco uses a custom amd loader that over-rides node's require.
                    // Keep a reference to node's require so we can restore it after executing the amd loader file.
                    'var nodeRequire = require;',
                    loaderRequest.responseText.replace('"use strict";', ''),
                    // Save Monaco's amd require and restore Node's require
                    'var monacoAmdRequire = require;',
                    'require = nodeRequire;',
                    'require.nodeRequire = require;'
                ].join('\n');
                document.body.appendChild(scriptElem);
                onGotAmdLoader((<any>window).monacoAmdRequire);
            });
            loaderRequest.open("GET", src);
            loaderRequest.send();
        } else {
          onGotAmdLoader();
        }
      });
    }
  }

  protected abstract initMonaco(): void;

  /** Tear down the current editor and create a fresh one. */
  protected reinit(): void {
    this.disposeEditor();
    this.initMonaco();
  }

  /** Dispose the editor and every resource it owns (listeners, models, subscriptions). */
  protected disposeEditor(): void {
    this._windowResizeSubscription?.unsubscribe();
    this._windowResizeSubscription = undefined;
    this._listeners.forEach(listener => listener.dispose());
    this._listeners = [];
    this._editor?.dispose();
    this._editor = undefined;
    this._models.forEach(model => model.dispose());
    this._models = [];
  }

  ngOnDestroy(): void {
    this.disposeEditor();
  }
}
