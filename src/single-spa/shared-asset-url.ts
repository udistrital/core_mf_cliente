import { environment } from '../environments/environment';

export function getSharedAssetUrl(path = ''): string {
  const baseUrl = environment.assets.replace(/\/+$/, '');
  const assetPath = path.replace(/^\/+/, '');

  return assetPath ? `${baseUrl}/${assetPath}` : `${baseUrl}/`;
}
