import { Component, OnInit } from '@angular/core';
import { DiffEditorModel, NgxEditorModel } from '../../../editor/src/lib/types';
import { DiffEditorComponent, EditorComponent } from 'projects/editor/src/public-api';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';

import * as monaco from 'monaco-editor';
import { languages } from 'monaco-editor';
import CompletionItemKind = languages.CompletionItemKind;
interface MonarchLanguageConfiguration extends monaco.languages.IMonarchLanguage {
  keywords: string[];
}

@Component({
  selector: 'app-root',
  imports: [FormsModule, JsonPipe, EditorComponent, DiffEditorComponent],
  template: `
    <h1>Editor</h1>
    <button (click)="updateOptions()">Change Language</button>
    <button (click)="code = ''; codeInput=''">Set Value To Empty String</button>
    <button (click)="code = null; codeInput=null">Set Value To Null</button>
    <button (click)="code = undefined; codeInput=undefined">Set Value To undefined</button>
    <button (click)="showMultiple = !showMultiple">{{showMultiple ? 'Hide' : 'Show'}} Multiple Editor</button>
    <select [(ngModel)]="options.theme" (ngModelChange)="onThemeChange($event)" name="theme">
      <option value="" selected disabled>Theme</option>
      @for(theme of availableThemes; track $index){
        <option [value]="theme">{{theme}}</option>
      }

    </select>

    <div style="height: 100px">
        <ngx-monaco-editor style="height: 100%" [options]="options" [(ngModel)]="code" (onInit)="onInit($event)"></ngx-monaco-editor>
    </div>

    @if (showMultiple) {
      <ngx-monaco-editor [options]="options" [(ngModel)]="code"></ngx-monaco-editor>
    }

    <pre>{{code | json}}</pre>

    <h1>Diff Editor</h1>
    <button (click)="updateDiffModel()">Update Models</button>
    <ngx-monaco-diff-editor [options]="options" [originalModel]="originalModel" [modifiedModel]="modifiedModel"
                            (onInit)="onInitDiffEditor($event)"></ngx-monaco-diff-editor>

    <ngx-monaco-editor [options]="options" [model]="model"></ngx-monaco-editor>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  codeInput = 'Sample Code';
  editor: any;
  diffEditor: any;
  showMultiple = false;
  toggleLanguage = true;
  options = {
    theme: 'vs-dark'
  };
  availableThemes = [
    'vs',
    'vs-dark',
    'hc-black',
    'hc-light'
  ];
  code: string;
  cssCode = `.my-class {
  color: red;
}`;
  jsCode = `function hello() {
	 alert('Hello world!');
}`;

  originalModel: DiffEditorModel = {
    code: 'heLLo world!',
    language: 'text/plain'
  };

  modifiedModel: DiffEditorModel = {
    code: 'hello orlando!',
    language: 'text/plain'
  };

  jsonCode = [
    '{',
    '    "p1": "v3",',
    '    "p2": false',
    '}'
  ].join('\n');

  model: NgxEditorModel = {
    value: this.jsonCode,
    language: 'typescript'
  };

  ngOnInit() {
    this.updateOptions();
  }

  updateOptions() {
    this.toggleLanguage = !this.toggleLanguage;
    if (this.toggleLanguage) {
      this.code = this.cssCode;
      this.options = Object.assign({}, this.options, { language: 'java' });
    } else {
      this.code = this.jsCode;
      this.options = Object.assign({}, this.options, { language: 'typescript' });
    }

  }

  updateDiffModel() {
    this.originalModel = Object.assign({}, this.originalModel, { code: 'abcd' });
    this.modifiedModel = Object.assign({}, this.originalModel, { code: 'ABCD ef' });
  }

  onThemeChange(theme: string) {
    this.options = Object.assign({}, this.options, { theme: theme });
    this.editor.setTheme(theme);
  }

  onInit(editor) {
    this.editor = editor;
    console.log(editor);
    this.model = {
      value: this.jsonCode,
      language: 'typescript',
      // uri: monaco.Uri.parse('a://b/foo.json')
    };
    // let line = editor.getPosition();
    // let range = new monaco.Range(line.lineNumber, 1, line.lineNumber, 1);
    // let id = { major: 1, minor: 1 };
    // let text = 'FOO';
    // let op = { identifier: id, range: range, text: text, forceMoveMarkers: true };
    // editor.executeEdits("my-source", [op]);


    if ((window as any).monaco) {

      (window as any).monaco.languages.registerCompletionItemProvider('typescript', {
        provideCompletionItems: () => {
          var suggestions = [
            {
              label: 'simpleText',
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: 'simpleText',
            },
            {
              label: 'testing',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'testing(${1:condition})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            },
            {
              label: 'ifelse',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: ['if (${1:condition}) {', '\t$0', '} else {', '\t', '}'].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'If-Else Statement',
            },
          ];
          return { suggestions: suggestions };
        },
      });
    }
  }

  onInitDiffEditor(editor) {
    this.diffEditor = editor;
    console.log(editor);
  }
}
