import { ChangeDetectionStrategy, Component, effect, inject, input, NgZone } from '@angular/core';
import { fromEvent } from 'rxjs';
import type * as Monaco from 'monaco-editor';

import { BaseEditor } from './base-editor';
import { DiffEditorModel } from './types';

declare const monaco: typeof Monaco;

@Component({
  standalone: true,
  selector: 'ngx-monaco-diff-editor',
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiffEditorComponent extends BaseEditor<Monaco.editor.IStandaloneDiffEditor> {
  private readonly zone = inject(NgZone);

  readonly options = input<Monaco.editor.IStandaloneDiffEditorConstructionOptions>({});
  readonly originalModel = input<DiffEditorModel>();
  readonly modifiedModel = input<DiffEditorModel>();

  constructor() {
    super();
    // Re-create the editor whenever options or either model change.
    effect(() => {
      this.options();
      this.originalModel();
      this.modifiedModel();
      if (this._editor) {
        this.reinit();
      }
    });
  }

  protected initMonaco(): void {
    const original = this.originalModel();
    const modified = this.modifiedModel();

    if (!original || !modified) {
      throw new Error('originalModel or modifiedModel not found for ngx-monaco-diff-editor');
    }

    const options: Monaco.editor.IStandaloneDiffEditorConstructionOptions = {
      ...this.config.defaultOptions,
      ...this.options()
    };

    const originalModel = monaco.editor.createModel(original.code, original.language || (options as any).language);
    const modifiedModel = monaco.editor.createModel(modified.code, modified.language || (options as any).language);
    this._models.push(originalModel, modifiedModel);

    const container = this.editorContainer().nativeElement;
    container.innerHTML = '';

    if (this.insideNg()) {
      this._editor = monaco.editor.createDiffEditor(container, options);
    } else {
      this.zone.runOutsideAngular(() => {
        this._editor = monaco.editor.createDiffEditor(container, options);
      });
    }

    this._editor!.setModel({
      original: originalModel,
      modified: modifiedModel
    });

    // refresh layout on resize event.
    this._windowResizeSubscription = fromEvent(window, 'resize').subscribe(() => this._editor!.layout());
    this.onInit.emit(this._editor!);
  }
}
