import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    Output,
    ViewChild,
    inject
} from '@angular/core';
import type MonacoNamespace from 'monaco-editor';
import { Subscription } from 'rxjs';
import { NGX_MONACO_EDITOR_CONFIG, NgxMonacoEditorConfig } from './config';

type IEditor = MonacoNamespace.editor.IEditor;
type MonacoOpts = MonacoNamespace.editor.IDiffEditorOptions;

let loadedMonaco = false;
let loadPromise: Promise<void>;

@Component({
    template: '',
    standalone: false
})
export abstract class BaseEditor implements AfterViewInit, OnDestroy {
  config = inject<NgxMonacoEditorConfig>(NGX_MONACO_EDITOR_CONFIG);

  @Input('insideNg')
  set insideNg(insideNg: boolean) {
    this._insideNg = insideNg;
    if (this._editor) {
      this._editor.dispose();
      this.initMonaco(this._options, this.insideNg);
    }
  }

  get insideNg(): boolean {
    return this._insideNg;
  }

  @ViewChild('editorContainer', { static: true }) _editorContainer: ElementRef;
  @Output() onInit = new EventEmitter<IEditor>();
  protected _editor: IEditor;
  protected _options: MonacoOpts;
  protected _windowResizeSubscription: Subscription;
  private _insideNg: boolean = false;

  ngAfterViewInit(): void {
    if (loadedMonaco) {
      // Wait until monaco editor is available
      loadPromise.then(() => {
        this.initMonaco(this._options, this.insideNg);
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
          this.initMonaco(this._options, this.insideNg);
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
            this.initMonaco(this._options, this.insideNg);
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

  protected abstract initMonaco(options: any, insideNg: boolean): void;

  ngOnDestroy() {
    if (this._windowResizeSubscription) {
      this._windowResizeSubscription.unsubscribe();
    }
    if (this._editor) {
      this._editor.dispose();
      this._editor = undefined;
    }
  }
}
