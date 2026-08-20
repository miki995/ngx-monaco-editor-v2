# Changelog

All notable changes to `ngx-monaco-editor-v2` are documented here.

## 22.0.5 (2026-08-20)

### Changed
- **`monaco-editor` peer dependency bumped to `^0.56.0`.** No API changes affect this
  library; build and test suite pass unchanged against the new version.

## 22.0.4 (2026-06-29)

Support for **Angular 22**, plus a round of correctness, type-safety and tooling improvements.

### Added
- **Angular 22 support** — upgraded to `@angular/*` 22, TypeScript 6.0 and `zone.js` 0.16.
- **Full monaco typings on the public API.** Components are now generic over the monaco
  editor type, and `(onInit)` emits a typed editor (`IStandaloneCodeEditor` /
  `IStandaloneDiffEditor`) instead of `any`.
- **`EditorComponent.setTheme(theme)`** method as the supported way to change the theme.
- Unit tests (migrated to **Vitest**) and a GitHub Actions CI pipeline.

### Fixed
- **Memory leak:** monaco text models created by the editor and diff-editor are now tracked
  and disposed on re-init and on destroy, instead of lingering in monaco's global registry.
- **`setDisabledState`** now applies `readOnly` to a live editor immediately (e.g. when a
  reactive form control is disabled/enabled), instead of only on the next re-init.
- Editor event listeners (`onDidChangeModelContent`, `onDidBlurEditorWidget`) are now disposed
  together with the editor.

### Changed
- Components now use Angular **signal-based** `input()` / `output()` / `viewChild()` internally.
  The template-facing API (`[options]`, `[model]`, `[(ngModel)]`, `[originalModel]`,
  `[modifiedModel]`, `(onInit)`, selectors) is unchanged.
- Minimum Node.js is now `^22.22.3 || ^24.15.0 || >=26.0.0` (matches Angular 22).

### Breaking
- The previously monkey-patched `setTheme()` method is **no longer attached** to the editor
  instance emitted by `(onInit)`. Change the theme via the new `EditorComponent.setTheme(theme)`
  method, or call `monaco.editor.setTheme(theme)` directly.
