import { Assets, Texture, Graphics, Application } from 'pixi.js';

export class TextureManager {
  private static instance: TextureManager;
  private textures: Map<string, Texture> = new Map();
  public isLoaded: boolean = false;
  public loadProgress: number = 0;

  private constructor() {}

  public static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager();
    }
    return TextureManager.instance;
  }

  public async preloadAssets(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) {
      if (onProgress) onProgress(1.0);
      return;
    }

    const assetList: { key: string; url: string }[] = [
      { key: 'player_ship', url: '/assets/png/default/ships/ship_1.png' },
      { key: 'chaser_ship', url: '/assets/png/default/ships/ship_13.png' },
      { key: 'shooter_ship', url: '/assets/png/default/ships/ship_7.png' },
      { key: 'cannonball', url: '/assets/png/default/ship_parts/cannon_ball.png' },
      { key: 'island_1', url: '/assets/png/default/tiles/tile_73.png' },
      { key: 'island_2', url: '/assets/png/default/tiles/tile_74.png' },
      { key: 'fire_effect', url: '/assets/png/default/effects/fire_1.png' },
      { key: 'explosion_effect', url: '/assets/png/default/effects/explosion_1.png' },
      { key: 'water_tile', url: '/assets/png/default/tiles/tile_68.png' },
    ];

    let loadedCount = 0;
    const total = assetList.length;

    for (const asset of assetList) {
      try {
        const texture = await Assets.load<Texture>(asset.url);
        if (texture) {
          this.textures.set(asset.key, texture);
        } else {
          this.textures.set(asset.key, this.createFallbackTexture(asset.key));
        }
      } catch (err) {
        console.warn(`Failed to load texture ${asset.url}, fallback generated.`, err);
        this.textures.set(asset.key, this.createFallbackTexture(asset.key));
      }
      loadedCount++;
      this.loadProgress = loadedCount / total;
      if (onProgress) onProgress(this.loadProgress);
    }

    this.isLoaded = true;
  }

  public getTexture(key: string): Texture {
    const tex = this.textures.get(key);
    if (tex) return tex;
    return this.createFallbackTexture(key);
  }

  private createFallbackTexture(key: string): Texture {
    return Texture.WHITE;
  }
}
