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
      { id: 'cannon_fire_2', src: '/assets/sounds/cannon_fire_2.wav' },
      { id: 'cannon_fire_3', src: '/assets/sounds/cannon_fire_3.wav' },
      { id: 'cannon_broadside', src: '/assets/sounds/cannon_broadside.wav' },
      { id: 'wood_hit', src: '/assets/sounds/ship_wood_hit_1.wav' },
      { id: 'wood_hit_2', src: '/assets/sounds/ship_wood_hit_2.wav' },
      { id: 'water_hit', src: '/assets/sounds/cannonball_water_hit_1.wav' },
      { id: 'water_hit_2', src: '/assets/sounds/cannonball_water_hit_2.wav' },
      { id: 'explosion', src: '/assets/sounds/ship_explosion_1.wav' },
      { id: 'explosion_2', src: '/assets/sounds/ship_explosion_2.wav' },
      { id: 'ship_collision', src: '/assets/sounds/ship_collision.wav' },
      { id: 'ship_sinking', src: '/assets/sounds/ship_sinking.wav' },
      { id: 'game_start', src: '/assets/sounds/game_start.wav' },
      { id: 'game_over', src: '/assets/sounds/game_over.wav' },
      { id: 'game_complete', src: '/assets/sounds/game_complete.wav' },
      { id: 'game_pause', src: '/assets/sounds/game_pause.wav' },
      { id: 'game_resume', src: '/assets/sounds/game_resume.wav' },
      { id: 'score_point', src: '/assets/sounds/score_point.wav' },
      { id: 'health_low', src: '/assets/sounds/health_low.wav' },
      { id: 'time_warning', src: '/assets/sounds/time_warning.wav' },
      { id: 'ui_click', src: '/assets/sounds/ui_click.wav' },
      { id: 'ui_hover', src: '/assets/sounds/ui_hover.wav' },
      { id: 'ui_open', src: '/assets/sounds/ui_open.wav' },
      { id: 'ui_close', src: '/assets/sounds/ui_close.wav' },
      { id: 'ui_back', src: '/assets/sounds/ui_back.wav' },
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

  /** Sound groups: playing the group name picks a random variation. */
  private readonly variations: Record<string, string[]> = {
    cannon_fire: ['cannon_fire', 'cannon_fire_2', 'cannon_fire_3'],
    wood_hit: ['wood_hit', 'wood_hit_2'],
    water_hit: ['water_hit', 'water_hit_2'],
    explosion: ['explosion', 'explosion_2'],
  };

  public play(id: string, volumeScale: number = 1.0) {
    if (this.muted) return;
    const group = this.variations[id];
    const picked = group ? group[Math.floor(Math.random() * group.length)] : id;
    const sound = this.sounds.get(picked);
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
