import { ChangeDetectionStrategy, Component, forwardRef, inject, Input, NgZone } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent } from 'rxjs';

import type MonacoNamespace from 'monaco-editor';
import { BaseEditor } from './base-editor';
import { NgxEditorModel } from './types';

type MonacoOpts = MonacoNamespace.editor.IStandaloneEditorConstructionOptions;

type Monaco = typeof MonacoNamespace;
declare var monaco: Monaco;

type ICodeEditor = MonacoNamespace.editor.ICodeEditor;

@Component({
  standalone: true,
  selector: 'ngx-monaco-editor',
  template: '<div class="editor-container" #editorContainer></div>',
  styles: [`
      :host {
          display: block;
          height: 200px;
      }

      .editor-container {
          width: 100%;
          height: 98%;
      }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => EditorComponent),
    multi: true
  }]
})
export class EditorComponent extends BaseEditor implements ControlValueAccessor {
  private zone = inject(NgZone);
  private _value: string = '';

  _editor: ICodeEditor;

  propagateChange = (_: any) => {};
  onTouched = () => {};

  @Input('options')
  set options(options: MonacoOpts) {
    this._options = Object.assign({}, this.config.defaultOptions, options);
    if (this._editor) {
      this._editor.dispose();
      this.initMonaco(options, this.insideNg);
    }
  }

  get options(): any {
    return this._options;
  }

  @Input('model')
  set model(model: NgxEditorModel) {
    this.options.model = model;
    if (this._editor) {
      this._editor.dispose();
      this.initMonaco(this.options, this.insideNg);
    }
  }

  writeValue(value: any): void {
    this._value = value || '';
    // Fix for value change while dispose in process.
    setTimeout(() => {
      if (this._editor && !this.options.model) {
        this._editor.setValue(this._value);
      }
    });
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  protected initMonaco(options: any, insideNg: boolean): void {

    const hasModel = !!options.model;

    if (hasModel) {
      const model = monaco.editor.getModel(options.model.uri || '');
      if (model) {
        options.model = model;
        options.model.setValue(this._value);
      } else {
        options.model = monaco.editor.createModel(options.model.value, options.model.language, options.model.uri);
      }
    }

    if (insideNg) {
      this._editor = monaco.editor.create(this._editorContainer.nativeElement, options);
    } else {
      this.zone.runOutsideAngular(() => {
        this._editor = monaco.editor.create(this._editorContainer.nativeElement, options);
      })
    }

    if (!hasModel) {
      this._editor.setValue(this._value);
    }

    this._editor.onDidChangeModelContent((e: any) => {
      const value = this._editor.getValue();

      // value is not propagated to parent when executing outside zone.
      this.zone.run(() => {
        this.propagateChange(value);
        this._value = value;
      });
    });

    this._editor.onDidBlurEditorWidget(() => {
      this.onTouched();
    });

    // refresh layout on resize event.
    if (this._windowResizeSubscription) {
      this._windowResizeSubscription.unsubscribe();
    }
    this._windowResizeSubscription = fromEvent(window, 'resize').subscribe(() => this._editor.layout());
    this.onInit.emit(this._editor);
  }

}
