import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorComponent } from '../../../editor/src/lib/editor.component';
import { NGX_MONACO_EDITOR_CONFIG } from '../../../editor/src/lib/config';

/** Counters and spies for the faked monaco global. */
let disposed: { editor: number; models: number; listeners: number };
let updateOptions: ReturnType<typeof vi.fn>;

function installMonacoMock() {
  disposed = { editor: 0, models: 0, listeners: 0 };
  updateOptions = vi.fn();

  const listener = { dispose: () => { disposed.listeners++; } };
  const fakeEditor = {
    setValue: () => {},
    getValue: () => '',
    layout: () => {},
    updateOptions,
    onDidChangeModelContent: () => listener,
    onDidBlurEditorWidget: () => listener,
    dispose: () => { disposed.editor++; }
  };
  const fakeModel = { setValue: () => {}, dispose: () => { disposed.models++; } };

  (window as any).monaco = {
    editor: {
      create: () => fakeEditor,
      createModel: () => fakeModel,
      getModel: () => null,
      setTheme: vi.fn()
    },
    Uri: { parse: (value: string) => ({ value }) }
  };
}

@Component({
  standalone: true,
  imports: [EditorComponent],
  template: `<ngx-monaco-editor [options]="options" [model]="model"></ngx-monaco-editor>`
})
class HostComponent {
  options: any = {};
  model: any = undefined;
}

describe('EditorComponent lifecycle', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    installMonacoMock();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: NGX_MONACO_EDITOR_CONFIG, useValue: {} }]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    // Allow the (possibly async) monaco loader path to resolve.
    await new Promise(resolve => setTimeout(resolve));
  });

  function editor(): EditorComponent {
    return fixture.debugElement.children[0].componentInstance as EditorComponent;
  }

  it('creates the editor once monaco is available', () => {
    expect(editor()['_editor']).toBeTruthy();
  });

  it('disposes the editor and its listeners on destroy', () => {
    fixture.destroy();
    expect(disposed.editor).toBe(1);
    expect(disposed.listeners).toBeGreaterThanOrEqual(2);
  });

  it('disposes models it created on destroy (no leak)', async () => {
    // Fresh fixture with the model present at first init, so a model is created.
    const withModel = TestBed.createComponent(HostComponent);
    withModel.componentInstance.model = { value: 'x', language: 'json' };
    withModel.detectChanges();
    await new Promise(resolve => setTimeout(resolve));

    withModel.destroy();
    expect(disposed.models).toBeGreaterThanOrEqual(1);
  });

  it('setDisabledState updates a live editor immediately', () => {
    editor().setDisabledState(true);
    expect(updateOptions).toHaveBeenCalledWith({ readOnly: true });
  });
});
