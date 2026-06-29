import { NGX_MONACO_EDITOR_CONFIG } from '../../../editor/src/lib/config';
import { MonacoEditorModule, provideMonacoEditor } from '../../../editor/src/lib/editor.module';

describe('MonacoEditorModule config providers', () => {
  it('forRoot() provides an empty config by default', () => {
    const { providers } = MonacoEditorModule.forRoot();
    expect(providers).toEqual([
      { provide: NGX_MONACO_EDITOR_CONFIG, useValue: {} }
    ]);
  });

  it('forRoot() forwards the supplied config', () => {
    const config = { baseUrl: 'assets/monaco' };
    const { providers } = MonacoEditorModule.forRoot(config);
    expect(providers).toEqual([
      { provide: NGX_MONACO_EDITOR_CONFIG, useValue: config }
    ]);
  });

  it('provideMonacoEditor() returns environment providers', () => {
    expect(provideMonacoEditor({ baseUrl: 'assets/monaco' })).toBeTruthy();
  });
});
