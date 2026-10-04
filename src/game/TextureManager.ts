import { Assets, Texture } from 'pixi.js';

export class TextureManager {
  private static instance: TextureManager;
  private textures: Map<string, Texture> = new Map();
  public isLoaded: boolean = false;
  public loadProgress: number = 0;
  private loadAttempt: number = 0;

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
      { key: 'player_ship_damaged', url: '/assets/png/default/ships/ship_7.png' },
      { key: 'player_ship_critical', url: '/assets/png/default/ships/ship_13.png' },
      { key: 'chaser_ship', url: '/assets/png/default/ships/ship_2.png' },
      { key: 'chaser_ship_damaged', url: '/assets/png/default/ships/ship_14.png' },
      { key: 'chaser_ship_wreck', url: '/assets/png/default/ships/ship_20.png' },
      { key: 'shooter_ship', url: '/assets/png/default/ships/ship_5.png' },
      { key: 'shooter_ship_damaged', url: '/assets/png/default/ships/ship_17.png' },
      { key: 'shooter_ship_wreck', url: '/assets/png/default/ships/ship_23.png' },
      { key: 'cannonball', url: '/assets/png/default/ship_parts/cannon_ball.png' },
      { key: 'crew_1', url: '/assets/png/default/ship_parts/crew_1.png' },
      { key: 'crew_2', url: '/assets/png/default/ship_parts/crew_2.png' },
      { key: 'crew_3', url: '/assets/png/default/ship_parts/crew_3.png' },
      { key: 'crew_4', url: '/assets/png/default/ship_parts/crew_4.png' },
      { key: 'island_1', url: '/assets/png/default/tiles/tile_23.png' },
      { key: 'island_2', url: '/assets/png/default/tiles/tile_74.png' },
      { key: 'stone_arch', url: '/assets/png/default/tiles/tile_63.png' },
      { key: 'palm_tree', url: '/assets/png/default/tiles/tile_70.png' },
      { key: 'fire_effect', url: '/assets/png/default/effects/fire_1.png' },
      { key: 'damage_smoke', url: '/assets/png/default/effects/fire_2.png' },
      { key: 'explosion_effect', url: '/assets/png/default/effects/explosion_1.png' },
      { key: 'water_tile', url: '/assets/png/default/tiles/tile_73.png' },
      { key: 'island_sand', url: '/assets/png/default/tiles/tile_68.png' },
      { key: 'foliage_small', url: '/assets/png/default/tiles/tile_70.png' },
      { key: 'foliage_large', url: '/assets/png/default/tiles/tile_71.png' },
      { key: 'foliage_bush', url: '/assets/png/default/tiles/tile_72.png' },
      { key: 'rock_small', url: '/assets/png/default/tiles/tile_65.png' },
      { key: 'rock_large', url: '/assets/png/default/tiles/tile_67.png' },
      { key: 'health_frame', url: '/assets/png/default/ui/hud/health_frame.png' },
      { key: 'enemy_health_fill_red', url: '/assets/png/default/ui/hud/enemy_health_fill_red.png' },
    ];

    let loadedCount = 0;
    const total = assetList.length;
    const failedAssets: string[] = [];
    this.loadAttempt++;
    // Pixi Assets caches by URL, including failures — bust the cache on retry.
    const cacheBuster = this.loadAttempt > 1 ? `?v=${this.loadAttempt}` : '';

    for (const asset of assetList) {
      try {
        const texture = await Assets.load<Texture>(asset.url + cacheBuster);
        if (texture) {
          this.textures.set(asset.key, texture);
        } else {
          failedAssets.push(asset.key);
        }
      } catch (err) {
        console.warn(`Failed to load texture ${asset.url}`, err);
        failedAssets.push(asset.key);
      }
      loadedCount++;
      this.loadProgress = loadedCount / total;
      if (onProgress) onProgress(this.loadProgress);
    }

    if (failedAssets.length > 0) {
      this.loadProgress = 0;
      this.textures.clear();
      throw new Error(`Failed to load game assets: ${failedAssets.join(', ')}`);
    }

    this.isLoaded = true;
  }

  public getTexture(key: string): Texture {
    const tex = this.textures.get(key);
    if (tex) return tex;
    return this.createFallbackTexture(key);
  }

  private createFallbackTexture(_key: string): Texture {
    return Texture.WHITE;
  }
}
