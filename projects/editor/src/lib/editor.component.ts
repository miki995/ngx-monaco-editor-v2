import { ChangeDetectionStrategy, Component, effect, forwardRef, inject, input, NgZone } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent } from 'rxjs';
import type * as Monaco from 'monaco-editor';

import { BaseEditor } from './base-editor';
import { NgxEditorModel } from './types';

declare const monaco: typeof Monaco;

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
export class EditorComponent extends BaseEditor<Monaco.editor.IStandaloneCodeEditor> implements ControlValueAccessor {
  private readonly zone = inject(NgZone);
  private _value = '';
  private _disabled = false;

  readonly options = input<Monaco.editor.IStandaloneEditorConstructionOptions>({});
  readonly model = input<NgxEditorModel>();

  propagateChange = (_: any) => {};
  onTouched = () => {};

  constructor() {
    super();
    // Re-create the editor whenever the options or model inputs change.
    effect(() => {
      this.options();
      this.model();
      if (this._editor) {
        this.reinit();
      }
    });
  }

  writeValue(value: any): void {
    this._value = value || '';
    // Fix for value change while dispose in process.
    setTimeout(() => {
      if (this._editor && !this.model()) {
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

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
    // Apply immediately to a live editor instead of waiting for a re-init.
    this._editor?.updateOptions({ readOnly: isDisabled || !!this.options().readOnly });
  }

  /** Change the global monaco theme (e.g. `'vs-dark'`). */
  setTheme(themeName: string): void {
    monaco.editor.setTheme(themeName);
  }

  protected initMonaco(): void {
    const options: Monaco.editor.IStandaloneEditorConstructionOptions = {
      ...this.config.defaultOptions,
      ...this.options()
    };
    if (this._disabled) {
      options.readOnly = true;
    }

    const modelInput = this.model();
    if (modelInput) {
      const existing = modelInput.uri ? monaco.editor.getModel(modelInput.uri as Monaco.Uri) : null;
      if (existing) {
        existing.setValue(this._value);
        options.model = existing;
      } else {
        const created = monaco.editor.createModel(
          modelInput.value,
          modelInput.language,
          modelInput.uri as Monaco.Uri | undefined
        );
        this._models.push(created);
        options.model = created;
      }
    }

    const container = this.editorContainer().nativeElement;
    if (this.insideNg()) {
      this._editor = monaco.editor.create(container, options);
    } else {
      this.zone.runOutsideAngular(() => {
        this._editor = monaco.editor.create(container, options);
      });
    }

    if (!options.model) {
      this._editor!.setValue(this._value);
    }

    this._listeners.push(
      this._editor!.onDidChangeModelContent(() => {
        const value = this._editor!.getValue();
        // value is not propagated to parent when executing outside zone.
        this.zone.run(() => {
          this.propagateChange(value);
          this._value = value;
        });
      })
    );

    this._listeners.push(
      this._editor!.onDidBlurEditorWidget(() => {
        this.onTouched();
      })
    );

    // refresh layout on resize event.
    this._windowResizeSubscription = fromEvent(window, 'resize').subscribe(() => this._editor!.layout());
    this.onInit.emit(this._editor!);
  }
}
