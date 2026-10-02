import { Howl, Howler } from 'howler';

export class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, Howl> = new Map();
  private muted: boolean = false;
  private volume: number = 0.7;
  private oceanLoop?: Howl;
  private sailingLoop?: Howl;

  private constructor() {
    this.initSounds();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initSounds() {
    const soundList: Array<{ id: string; src: string; loop?: boolean; volume?: number }> = [
      { id: 'cannon_fire', src: '/assets/sounds/cannon_fire_1.wav' },
      { id: 'cannon_broadside', src: '/assets/sounds/cannon_broadside.wav' },
      { id: 'wood_hit', src: '/assets/sounds/ship_wood_hit_1.wav' },
      { id: 'water_hit', src: '/assets/sounds/cannonball_water_hit_1.wav' },
      { id: 'explosion', src: '/assets/sounds/ship_explosion_1.wav' },
      { id: 'ship_collision', src: '/assets/sounds/ship_collision.wav' },
      { id: 'ship_sinking', src: '/assets/sounds/ship_sinking.wav' },
      { id: 'game_start', src: '/assets/sounds/game_start.wav' },
      { id: 'game_over', src: '/assets/sounds/game_over.wav' },
      { id: 'game_complete', src: '/assets/sounds/game_complete.wav' },
      { id: 'score_point', src: '/assets/sounds/score_point.wav' },
      { id: 'ui_click', src: '/assets/sounds/ui_click.wav' },
      { id: 'ui_hover', src: '/assets/sounds/ui_hover.wav' },
      { id: 'ocean_ambience', src: '/assets/sounds/ocean_ambience_loop.wav', loop: true, volume: 0.3 },
      { id: 'ship_sailing', src: '/assets/sounds/ship_sailing_loop.wav', loop: true, volume: 0.2 },
    ];

    soundList.forEach((s) => {
      const howl = new Howl({
        src: [s.src],
        loop: s.loop || false,
        volume: (s.volume ?? 1.0) * this.volume,
        preload: true,
      });
      this.sounds.set(s.id, howl);
    });

    this.oceanLoop = this.sounds.get('ocean_ambience');
    this.sailingLoop = this.sounds.get('ship_sailing');
  }

  public play(id: string, volumeScale: number = 1.0) {
    if (this.muted) return;
    const sound = this.sounds.get(id);
    if (sound) {
      sound.volume(this.volume * volumeScale);
      sound.play();
    }
  }

  public startAmbience() {
    if (this.muted) return;
    if (this.oceanLoop && !this.oceanLoop.playing()) {
      this.oceanLoop.play();
    }
  }

  public stopAmbience() {
    if (this.oceanLoop) {
      this.oceanLoop.stop();
    }
    if (this.sailingLoop) {
      this.sailingLoop.stop();
    }
  }

  public updateSailingSound(isMoving: boolean) {
    if (this.muted || !this.sailingLoop) return;
    if (isMoving && !this.sailingLoop.playing()) {
      this.sailingLoop.play();
    } else if (!isMoving && this.sailingLoop.playing()) {
      this.sailingLoop.pause();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    Howler.mute(muted);
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.volume);
  }

  public getVolume(): number {
    return this.volume;
  }
}
