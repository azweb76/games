export interface GameManifest {
  id: string;
  title: string;
  tagline: string;
  description: string;
  mount: (root: HTMLElement) => () => void;
}
