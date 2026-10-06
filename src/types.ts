export * from '../shared/types.ts';

export type ActiveTab = 'dashboard' | 'editor' | 'projects' | 'models' | 'templates' | 'assets';

export interface EditorState {
  currentSceneIndex: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  activeInspectorTab: 'scenes' | 'captions' | 'audio' | 'render';
}
